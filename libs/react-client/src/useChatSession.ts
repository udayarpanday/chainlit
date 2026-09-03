import { debounce, set } from 'lodash';
import { useCallback, useContext, useEffect, useRef } from 'react';
import {
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState
} from 'recoil';
import io from 'socket.io-client';
import { toast } from 'sonner';
import {
  type EvoyaPromptContext,
  actionState,
  activeModelOverrideState,
  agentState,
  askUserState,
  audioConnectionState,
  callFnState,
  canOverrideModelState,
  chatArchived,
  chatProfileState,
  chatSettingsInputsState,
  chatSettingsValueState,
  commandsState,
  currentThreadIdState,
  elementState,
  favoriteMessagesState,
  firstUserInteraction,
  initialTranscriptState,
  isAiSpeakingState,
  loadingState,
  mcpState,
  messagesState,
  modelCatalogState,
  modesState,
  projectAccess,
  promptState,
  resumeThreadErrorState,
  sessionIdState,
  sessionState,
  sideViewState,
  tasklistState,
  threadIdToResumeState,
  tokenCountState,
  wavRecorderState,
  wavStreamPlayerState
} from 'src/state';
import {
  ActiveModelOverride,
  ChatInputSocketPayload,
  IAction,
  IAgents,
  IChatArchived,
  ICommand,
  IElement,
  IMessageElement,
  IMode,
  IStep,
  ITasklistElement,
  IThread,
  ModelCatalogItem,
  ModelReasoningSelection,
  ReasoningSpec,
  SetModelOverrideResponse
} from 'src/types';
import {
  addMessage,
  deleteMessageById,
  findMessageById,
  updateMessageById,
  updateMessageContentById
} from 'src/utils/message';

import { OutputAudioChunk } from './types/audio';

import { ChainlitContext } from './context';
import {
  getChainlitTabId,
  getScopedSessionStorageItem,
  setScopedSessionStorageItem
} from './storage';
import {
  markTaskEnded,
  markTaskStarted,
  resetTaskLoading
} from './taskLoading';
import type { IToken } from './useChatData';

type EvoyaCreatorWindow = Window &
  typeof globalThis & {
    evoyaCreatorEnabled?: boolean;
    updateEvoyaCreator?: (message: IStep, parent?: IStep) => string | undefined;
  };

type ModelCatalogSocketPayload =
  | unknown[]
  | {
      models?: unknown[];
      catalog?: unknown[];
      active?: unknown;
      can_override_model?: boolean;
      canOverrideModel?: boolean;
    };

const asObject = (value: unknown): Record<string, any> | undefined =>
  value && typeof value === 'object'
    ? (value as Record<string, any>)
    : undefined;

const normalizeReasoningSpec = (value: unknown): ReasoningSpec => {
  const raw = asObject(value);
  if (!raw || raw.type === 'none') return { type: 'none' };

  if (raw.type === 'effort' && Array.isArray(raw.values)) {
    const values = raw.values.filter(
      (item: unknown): item is string => typeof item === 'string'
    );
    return {
      type: 'effort',
      values,
      ...(typeof raw.default === 'string' ? { default: raw.default } : {})
    };
  }

  if (
    raw.type === 'max_tokens' &&
    typeof raw.min === 'number' &&
    typeof raw.max === 'number' &&
    typeof raw.step === 'number'
  ) {
    return {
      type: 'max_tokens',
      min: raw.min,
      max: raw.max,
      step: raw.step,
      ...(typeof raw.default === 'number' ? { default: raw.default } : {})
    };
  }

  return { type: 'none' };
};

const normalizeModelCatalogItem = (
  value: unknown
): ModelCatalogItem | undefined => {
  const raw = asObject(value);
  const id = Number(raw?.id);
  if (!raw || !Number.isFinite(id) || !raw.name || !raw.key) return undefined;

  return {
    id,
    key: String(raw.key),
    name: String(raw.name),
    provider: String(raw.provider || ''),
    providerLogoUrl:
      typeof (raw.providerLogoUrl ?? raw.provider_logo_url) === 'string'
        ? (raw.providerLogoUrl ?? raw.provider_logo_url)
        : undefined,
    dataLocation:
      typeof (raw.dataLocation ?? raw.data_location) === 'string'
        ? (raw.dataLocation ?? raw.data_location)
        : undefined,
    isToolsSupported: Boolean(
      raw.isToolsSupported ?? raw.is_tools_supported ?? true
    ),
    reasoning: normalizeReasoningSpec(raw.reasoning),
    isDefault: Boolean(raw.isDefault ?? raw.is_default)
  };
};

const normalizeActiveModel = (
  value: unknown
): ActiveModelOverride | undefined => {
  const raw = asObject(value);
  const modelId = Number(raw?.modelId ?? raw?.model_id);
  if (!raw || !Number.isFinite(modelId)) return undefined;

  const reasoning = asObject(raw.reasoning);
  const normalizedReasoning: ModelReasoningSelection = {};
  if (typeof reasoning?.effort === 'string') {
    normalizedReasoning.effort = reasoning.effort;
  }
  if (typeof reasoning?.max_tokens === 'number') {
    normalizedReasoning.max_tokens = reasoning.max_tokens;
  }

  return {
    modelId,
    ...(Object.keys(normalizedReasoning).length
      ? { reasoning: normalizedReasoning }
      : {})
  };
};

const useChatSession = () => {
  const client = useContext(ChainlitContext);
  const sessionId = useRecoilValue(sessionIdState);

  const [session, setSession] = useRecoilState(sessionState);
  const setIsAiSpeaking = useSetRecoilState(isAiSpeakingState);
  const setAudioConnection = useSetRecoilState(audioConnectionState);
  const resetChatSettingsValue = useResetRecoilState(chatSettingsValueState);
  const setChatSettingsValue = useSetRecoilState(chatSettingsValueState);
  const setFirstUserInteraction = useSetRecoilState(firstUserInteraction);
  const setLoading = useSetRecoilState(loadingState);
  const setMcps = useSetRecoilState(mcpState);
  const wavStreamPlayer = useRecoilValue(wavStreamPlayerState);
  const wavRecorder = useRecoilValue(wavRecorderState);
  const setMessages = useSetRecoilState(messagesState);
  const setAskUser = useSetRecoilState(askUserState);
  const setCallFn = useSetRecoilState(callFnState);
  const setCommands = useSetRecoilState(commandsState);
  const setModes = useSetRecoilState(modesState);
  const setModelCatalog = useSetRecoilState(modelCatalogState);
  const setActiveModelOverride = useSetRecoilState(activeModelOverrideState);
  const setCanOverrideModel = useSetRecoilState(canOverrideModelState);
  const setAgents = useSetRecoilState(agentState);
  const setContextPrompt = useSetRecoilState(promptState);
  const setSideView = useSetRecoilState(sideViewState);
  const setElements = useSetRecoilState(elementState);
  const setTasklists = useSetRecoilState(tasklistState);
  const setActions = useSetRecoilState(actionState);
  const setChatSettingsInputs = useSetRecoilState(chatSettingsInputsState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const [chatProfile, setChatProfile] = useRecoilState(chatProfileState);
  const idToResume = useRecoilValue(threadIdToResumeState);
  const setThreadResumeError = useSetRecoilState(resumeThreadErrorState);
  const setFavoriteMessages = useSetRecoilState(favoriteMessagesState);
  const setInitialTranscript = useSetRecoilState(initialTranscriptState);
  const setChatArchived = useSetRecoilState(chatArchived);
  const setProjectAccess = useSetRecoilState(projectAccess);

  const token = getScopedSessionStorageItem('chainlit_token') || '';
  const tabId = getChainlitTabId();

  const [currentThreadId, setCurrentThreadId] =
    useRecoilState(currentThreadIdState);

  useEffect(() => {
    if (session?.socket) {
      session.socket.auth['threadId'] = currentThreadId || '';
    }
  }, [currentThreadId]);

  const isReconnectingRef = useRef(false);
  const reconnectAttemptRef = useRef(0);

  const refreshStickyCookie = useCallback(
    async (stickySessionId: string) => {
      try {
        await client.stickyCookie(stickySessionId);
      } catch (err) {
        console.error(`Failed to set sticky session cookie: ${err}`);
      }
    },
    [client]
  );

  const _connect = useCallback(
    async ({
      transports,
      userEnv,
      evoya
    }: {
      transports?: string[];
      userEnv: Record<string, string>;
      evoya: { session_uuid: string };
    }) => {
      setModelCatalog(undefined);
      setActiveModelOverride(undefined);
      setCanOverrideModel(false);

      const { protocol, host, pathname } = new URL(client.httpEndpoint);
      const uri = `${protocol}//${host}`;
      const path =
        pathname && pathname !== '/'
          ? `${pathname}/ws/socket.io`
          : '/ws/socket.io';

      await refreshStickyCookie(sessionId);

      isReconnectingRef.current = false;
      reconnectAttemptRef.current = 0;

      const socket = io(uri, {
        path,
        withCredentials: true,
        transports,
        query: {
          chainlit_session_id: sessionId
        },
        auth: (cb) => {
          cb({
            clientType: client.type,
            sessionId,
            threadId: idToResume || '',
            userEnv: JSON.stringify(userEnv),
            Authorization: token,
            chatProfile: chatProfile ? encodeURIComponent(chatProfile) : '',
            clientTabId: tabId,
            socketReconnection: isReconnectingRef.current ? 'true' : 'false',
            reconnectAttempt: String(reconnectAttemptRef.current),
            chatSessionUuid:
              evoya?.session_uuid ||
              getScopedSessionStorageItem('session_token') ||
              '' // Pass the Evoya session UUID to the server,
          });
        },
        extraHeaders: {
          Authorization: `Bearer ${token}` || '',
          'X-Chainlit-Client-Type': client.type,
          'X-Chainlit-Session-Id': sessionId,
          'X-Chainlit-Tab-Id': tabId,
          'X-Chainlit-Thread-Id': idToResume || '',
          'user-env': JSON.stringify(userEnv),
          'X-Chainlit-Chat-Profile': chatProfile
            ? encodeURIComponent(chatProfile)
            : ''
        }
      });

      socket.io.on('reconnect_attempt', (attempt: number) => {
        isReconnectingRef.current = true;
        reconnectAttemptRef.current = attempt;
        void refreshStickyCookie(sessionId);
      });

      socket.io.on('reconnect', (attempt: number) => {
        reconnectAttemptRef.current = attempt;
      });

      socket.io.on('reconnect_failed', () => {
        isReconnectingRef.current = false;
        reconnectAttemptRef.current = 0;
      });

      setSession((old) => {
        old?.socket?.removeAllListeners();
        old?.socket?.close();
        return {
          socket
        };
      });

      socket.on('connect', () => {
        socket.emit('connection_successful');
        setLoading(resetTaskLoading());
        setSession((s) => ({ ...s!, error: false }));
        isReconnectingRef.current = false;
        socket.emit('fetch_favorites');
        setMcps((prev) =>
          prev.map((mcp) => {
            let promise;
            if (mcp.clientType === 'sse') {
              promise = client.connectSseMCP(sessionId, mcp.name, mcp.url!);
            } else if (mcp.clientType === 'streamable-http') {
              promise = client.connectStreamableHttpMCP(
                sessionId,
                mcp.name,
                mcp.url!,
                mcp.headers || {}
              );
            } else {
              promise = client.connectStdioMCP(
                sessionId,
                mcp.name,
                mcp.command!
              );
            }
            promise
              .then(async ({ success, mcp }) => {
                setMcps((prev) =>
                  prev.map((existingMcp) => {
                    if (existingMcp.name === mcp.name) {
                      return {
                        ...existingMcp,
                        status: success ? 'connected' : 'failed',
                        tools: mcp ? mcp.tools : existingMcp.tools
                      };
                    }
                    return existingMcp;
                  })
                );
              })
              .catch(() => {
                setMcps((prev) =>
                  prev.map((existingMcp) => {
                    if (existingMcp.name === mcp.name) {
                      return {
                        ...existingMcp,
                        status: 'failed'
                      };
                    }
                    return existingMcp;
                  })
                );
              });
            return { ...mcp, status: 'connecting' };
          })
        );
      });

      socket.on('connect_error', (_) => {
        setSession((s) => ({ ...s!, error: true }));
      });

      socket.on('task_start', () => {
        setLoading(markTaskStarted());
      });

      socket.on('task_end', () => {
        setLoading(markTaskEnded());
      });

      socket.on('reload', () => {
        socket.emit('clear_session');
        window.location.reload();
      });

      socket.on('audio_connection', async (state: 'on' | 'off') => {
        if (state === 'on') {
          let isFirstChunk = true;
          const startTime = Date.now();
          const mimeType = 'pcm16';
          // Connect to microphone
          await wavRecorder.begin();
          await wavStreamPlayer.connect();
          await wavRecorder.record(async (data) => {
            const elapsedTime = Date.now() - startTime;
            socket.emit('audio_chunk', {
              isStart: isFirstChunk,
              mimeType,
              elapsedTime,
              data: data.mono
            });
            isFirstChunk = false;
          });
          wavStreamPlayer.onStop = () => setIsAiSpeaking(false);
        } else {
          await wavRecorder.end();
          await wavStreamPlayer.interrupt();
        }
        setAudioConnection(state);
      });

      socket.on('audio_chunk', (chunk: OutputAudioChunk) => {
        wavStreamPlayer.add16BitPCM(chunk.data, chunk.track);
        setIsAiSpeaking(true);
      });

      socket.on('audio_interrupt', () => {
        wavStreamPlayer.interrupt();
      });

      socket.on('resume_thread', (thread: IThread) => {
        const isReadOnlyView = Boolean(
          (thread as any)?.metadata?.viewer_read_only
        );
        if (!isReadOnlyView && idToResume && thread.id !== idToResume) {
          window.location.href = `/thread/${thread.id}`;
        }
        if (!isReadOnlyView && idToResume) {
          setCurrentThreadId(thread.id);
        }
        let messages: IStep[] = [];
        for (const step of thread.steps) {
          messages = addMessage(messages, step);
        }
        if (thread.metadata?.chat_profile) {
          setChatProfile(thread.metadata?.chat_profile);
        }
        if (thread.metadata?.chat_settings) {
          setChatSettingsValue(thread.metadata?.chat_settings);
        }
        setMessages(messages);
        const elements = thread.elements || [];
        setTasklists(
          (elements as ITasklistElement[]).filter((e) => e.type === 'tasklist')
        );
        setElements(
          (elements as IMessageElement[]).filter(
            (e) => ['avatar', 'tasklist'].indexOf(e.type) === -1
          )
        );
      });

      socket.on('resume_thread_error', (error?: string) => {
        setThreadResumeError(error);
      });

      // socket.on('new_message', (message: IStep) => {
      //   setMessages((oldMessages) => addMessage(oldMessages, message));
      // });
      socket.on('new_message', (message: IStep) => {
        /*if (message.type === 'assistant_message' && message.output !== "") {
          // @ts-expect-error is not a valid prop
          window.updateEvoyaCreator(message, findMessageById(oldMessages, message.parentId));
          // window.updateEvoyaCreator(message.output);
        }*/
        setMessages((oldMessages) => {
          let newOutput = message.output;
          const evoyaWindow = window as EvoyaCreatorWindow;

          if (
            message.type === 'assistant_message' &&
            message.output !== '' &&
            evoyaWindow.evoyaCreatorEnabled
          ) {
            const parentMessage = message.parentId
              ? findMessageById(oldMessages, message.parentId)
              : undefined;

            newOutput =
              evoyaWindow.updateEvoyaCreator?.(message, parentMessage) ||
              message.output;
            // window.updateEvoyaCreator(message.output);
          }

          // console.log('feedback', newOutput);
          return addMessage(oldMessages, { ...message, output: newOutput });
          // return addMessage(oldMessages, message);
        });
      });

      socket.on(
        'first_interaction',
        (event: { interaction: string; thread_id: string }) => {
          setFirstUserInteraction(event.interaction);
          setCurrentThreadId(event.thread_id);
        }
      );

      socket.on('update_message', (message: IStep) => {
        setMessages((oldMessages) => {
          const newMessages = oldMessages;
          /* // @ts-expect-error is not a valid prop
          if (message.type === 'run' && message.name === 'on_message' && message.end && window.evoyaCreatorEnabled) {
            const oldMsg = findMessageById(oldMessages, message.id)
            console.log(oldMsg)
            // const directParent = findMessageById(oldMessages, message.parentId || '');
            // let messageParent = directParent;
            // if (directParent?.parentId) {
              // messageParent = findMessageById(oldMessages, directParent.parentId);
            // }
            if (oldMsg?.steps?.length && oldMsg.steps[0].output) {
              // @ts-expect-error is not a valid prop
              const newOutput = window.updateEvoyaCreator(oldMsg.steps[0], message) || oldMsg.steps[0].output;
              // window.updateEvoyaCreator(message.output);
              newMessages = updateMessageById(oldMessages, oldMsg.steps[0].id, {
                ...oldMsg.steps[0],
                output: newOutput
              })
            }
          }*/
          return updateMessageById(newMessages, message.id, message);
        });
      });

      socket.on('delete_message', (message: IStep) => {
        setMessages((oldMessages) =>
          deleteMessageById(oldMessages, message.id)
        );
      });

      socket.on('stream_start', (message: IStep) => {
        setMessages((oldMessages) => addMessage(oldMessages, message));
      });

      socket.on(
        'stream_token',
        ({ id, token, isSequence, isInput }: IToken) => {
          setMessages((oldMessages) => {
            const newMessages = updateMessageContentById(
              oldMessages,
              id,
              token,
              isSequence,
              isInput
            );
            // @ts-expect-error is not a valid prop
            if (window.evoyaCreatorEnabled) {
              // @ts-expect-error is not a valid prop
              window.streamEvoyaCreator(findMessageById(newMessages, id));
            }
            return newMessages;
          });
        }
      );

      socket.on('ask', ({ msg, spec }, callback) => {
        setAskUser({ spec, callback, parentId: msg.parentId });
        setMessages((oldMessages) => addMessage(oldMessages, msg));
        setLoading(false);
      });

      socket.on('ask_timeout', () => {
        setAskUser(undefined);
        setLoading(false);
      });

      socket.on('clear_ask', () => {
        setAskUser(undefined);
      });

      socket.on('call_fn', ({ name, args }, callback) => {
        setCallFn({ name, args, callback });
      });

      socket.on('clear_call_fn', () => {
        setCallFn(undefined);
      });

      socket.on('call_fn_timeout', () => {
        setCallFn(undefined);
      });

      socket.on('chat_settings', (inputs: any) => {
        setChatSettingsInputs(inputs);
        resetChatSettingsValue();
      });

      socket.on('set_commands', (commands: ICommand[]) => {
        setCommands(commands);
      });
      socket.on('set_modes', (modes: IMode[]) => {
        setModes(modes);
      });

      socket.on('model_catalog', (payload: ModelCatalogSocketPayload) => {
        const envelope = Array.isArray(payload) ? undefined : payload;
        const rawModels = Array.isArray(payload)
          ? payload
          : (envelope?.models ?? envelope?.catalog ?? []);
        const models = rawModels
          .map(normalizeModelCatalogItem)
          .filter((model): model is ModelCatalogItem => Boolean(model))
          .sort(
            (left, right) => Number(right.isDefault) - Number(left.isDefault)
          );
        const active = normalizeActiveModel(envelope?.active);
        const defaultModel = models.find((model) => model.isDefault);

        setModelCatalog(models.length ? models : undefined);
        setActiveModelOverride(
          active ?? (defaultModel ? { modelId: defaultModel.id } : undefined)
        );
        setCanOverrideModel(
          Boolean(
            envelope?.canOverrideModel ??
            envelope?.can_override_model ??
            models.length
          )
        );
      });

      socket.on('agents', (agents: IAgents) => {
        setAgents(agents);
      });

      socket.on('set_sidebar_title', (title: string) => {
        setSideView((prev) => {
          return { title, elements: prev?.elements || [] };
        });
      });

      socket.on('context_prompt', (context: EvoyaPromptContext | undefined) => {
        if (context) {
          setContextPrompt(context);
        }
      });

      socket.on('initial_transcript', (payload: ChatInputSocketPayload) => {
        const text = typeof payload === 'string' ? payload : payload?.text;

        if (typeof text !== 'string') {
          return;
        }

        setInitialTranscript({
          text,
          mode:
            typeof payload === 'string' ? 'replace' : payload.mode || 'replace',
          receivedAt: Date.now()
        });
      });

      socket.on('chat_archived', (payload: IChatArchived) => {
        setChatArchived(payload.is_chat_archived);
      });

      socket.on('is_project_accessible', (payload: boolean) => {
        setProjectAccess(payload);
      });
      socket.on('set_favorites', (steps: IStep[]) => {
        setFavoriteMessages(steps);
      });

      socket.on('set_sidebar_title', (title: string) => {
        setSideView((prev) => {
          if (prev?.title === title) return prev;
          return { title, elements: prev?.elements || [] };
        });
      });

      socket.on('chat_session_uuid', (data: { session_uuid: string }) => {
        if (data?.session_uuid) {
          sessionStorage.setItem('chat_session_uuid', data.session_uuid);
          setScopedSessionStorageItem('session_token', data.session_uuid);
        }
      });

      socket.on('set_sidebar_elements', (elements: IMessageElement[]) => {
        if (!elements.length) {
          setSideView(undefined);
        } else {
          elements.forEach((element) => {
            if (!element.url && element.chainlitKey) {
              element.url = client.getElementUrl(
                element.chainlitKey,
                sessionId
              );
            }
          });
          setSideView((prev) => {
            return { title: prev?.title || '', elements: elements };
          });
        }
      });

      socket.on('element', (element: IElement) => {
        if (!element.url && element.chainlitKey) {
          element.url = client.getElementUrl(element.chainlitKey, sessionId);
        }

        if (element.type === 'tasklist') {
          setTasklists((old) => {
            const index = old.findIndex((e) => e.id === element.id);
            if (index === -1) {
              return [...old, element];
            } else {
              return [...old.slice(0, index), element, ...old.slice(index + 1)];
            }
          });
        } else {
          setElements((old) => {
            const index = old.findIndex((e) => e.id === element.id);
            if (index === -1) {
              return [...old, element];
            } else {
              return [...old.slice(0, index), element, ...old.slice(index + 1)];
            }
          });
        }
      });

      socket.on('remove_element', (remove: { id: string }) => {
        setElements((old) => {
          return old.filter((e) => e.id !== remove.id);
        });
        setTasklists((old) => {
          return old.filter((e) => e.id !== remove.id);
        });
      });

      socket.on('action', (action: IAction) => {
        setActions((old) => [...old, action]);
      });

      socket.on('remove_action', (action: IAction) => {
        setActions((old) => {
          const index = old.findIndex((a) => a.id === action.id);
          if (index === -1) return old;
          return [...old.slice(0, index), ...old.slice(index + 1)];
        });
      });

      socket.on('token_usage', (count: number) => {
        setTokenCount((old) => old + count);
      });

      socket.on('window_message', (data: any) => {
        if (window.parent) {
          window.parent.postMessage(data, '*');
        }
      });

      socket.on('toast', (data: { message: string; type: string }) => {
        if (!data.message) {
          console.warn('No message received for toast.');
          return;
        }

        switch (data.type) {
          case 'info':
            toast.info(data.message);
            break;
          case 'error':
            toast.error(data.message);
            break;
          case 'success':
            toast.success(data.message);
            break;
          case 'warning':
            toast.warning(data.message);
            break;
          default:
            toast(data.message);
            break;
        }
      });
    },
    [setSession, sessionId, idToResume, chatProfile, refreshStickyCookie]
  );

  const connect = useCallback(debounce(_connect, 200), [_connect]);

  const disconnect = useCallback(() => {
    if (session?.socket) {
      session.socket.removeAllListeners();
      session.socket.close();
    }
    resetTaskLoading();
    setLoading(false);
  }, [session]);

  const setModelOverride = useCallback(
    (selection: ActiveModelOverride): Promise<SetModelOverrideResponse> => {
      const socket = session?.socket;
      if (!socket?.connected) {
        return Promise.resolve({
          ok: false,
          error: { code: 'disconnected', message: 'Socket is disconnected' }
        });
      }

      return new Promise((resolve) => {
        let settled = false;
        const timeout = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          resolve({
            ok: false,
            error: { code: 'timeout', message: 'Model override timed out' }
          });
        }, 15_000);

        socket.emit(
          'set_model_override',
          {
            model_id: selection.modelId,
            ...(selection.reasoning ? { reasoning: selection.reasoning } : {})
          },
          (response: unknown) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);

            const raw = asObject(response);
            if (!raw?.ok) {
              const rawError = asObject(raw?.error);
              resolve({
                ok: false,
                error: {
                  ...(typeof rawError?.code === 'string'
                    ? { code: rawError.code }
                    : {}),
                  ...(typeof rawError?.message === 'string'
                    ? { message: rawError.message }
                    : typeof raw?.error === 'string'
                      ? { message: raw.error }
                      : {})
                }
              });
              return;
            }

            const active = normalizeActiveModel(raw.active) ?? selection;
            setActiveModelOverride(active);
            resolve({ ok: true, active });
          }
        );
      });
    },
    [session?.socket, setActiveModelOverride]
  );

  return {
    connect,
    disconnect,
    session,
    sessionId,
    chatProfile,
    idToResume,
    setChatProfile,
    setModelOverride
  };
};

export { useChatSession };
