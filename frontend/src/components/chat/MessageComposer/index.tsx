import { cn } from '@/lib/utils';
import { Archive, Brain, FolderOpen, Plus, X } from 'lucide-react';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState
} from 'recoil';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { WidgetContext } from '@chainlit/copilot/src/context';
import {
  FileSpec,
  ICommand,
  IStep,
  activeModelOverrideState,
  audioConnectionState,
  chatArchived,
  evoyaCreatorEnabledState,
  initialTranscriptState,
  modelCatalogState,
  projectAccess,
  promptState,
  sessionState,
  temporaryChatState,
  useAuth,
  useChatData,
  useChatInteract,
  useChatSession
} from '@chainlit/react-client';

import { Settings } from '@/components/icons/Settings';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { EvoyaAttachment, evoyaAttachmentsState } from '@/state/evoya';
import { chatSettingsOpenState } from '@/state/project';
import {
  IAttachment,
  IQuotedSelection,
  attachmentsState,
  quotedSelectionState
} from 'state/chat';

import { Attachments } from './Attachments';
import ConfigurationMenu, {
  ProjectListItem,
  removeDashboardProject
} from './ConfigurationMenu';
import Input, { InputMethods } from './Input';
import QuotedContext from './QuotedContext';
import SubmitButton from './SubmitButton';
import UploadButton from './UploadButton';
import UploadButtonDropdown from './UploadButtonDropdown';

interface Props {
  fileSpec: FileSpec;
  onFileUpload: (payload: File[]) => void;
  onFileUploadError: (error: string) => void;
  setAutoScroll: (autoScroll: boolean) => void;
  submitProxy?: (text: string, submitFunction: (text: string) => void) => void;
}

export default function MessageComposer({
  fileSpec,
  onFileUpload,
  onFileUploadError,
  setAutoScroll,
  submitProxy
}: Props) {
  const context = useRecoilValue(promptState);
  const creatorEnabled = useRecoilValue(evoyaCreatorEnabledState);
  const { evoya } = useContext(WidgetContext);
  const session = useRecoilValue(sessionState);
  useEffect(() => {
    if (evoya?.type !== 'dashboard' || !session?.socket) return;
    const socket = session.socket;
    const syncProjectSelection = () => {
      socket.emit('project_selection', {
        project_uuids: new URL(window.location.href).searchParams.getAll(
          'project_uuids'
        )
      });
    };
    window.addEventListener('project-context-changed', syncProjectSelection);
    socket.on('connect', syncProjectSelection);
    if (socket.connected) syncProjectSelection();
    return () => {
      window.removeEventListener(
        'project-context-changed',
        syncProjectSelection
      );
      socket.off('connect', syncProjectSelection);
    };
  }, [evoya?.type, session?.socket]);
  const inputRef = useRef<InputMethods>(null);
  const [value, setValue] = useState('');
  const [thinkEnabled, setThinkEnabled] = useState(false);
  const modelCatalog = useRecoilValue(modelCatalogState);
  const activeModel = useRecoilValue(activeModelOverrideState);
  const { setModelOverride } = useChatSession();
  const [removingModel, setRemovingModel] = useState(false);
  const defaultModel = modelCatalog?.find((model) => model.isDefault);
  const removeModel = async () => {
    if (!defaultModel || removingModel || disabled) return;
    setRemovingModel(true);
    try {
      const result = await setModelOverride(
        { modelId: defaultModel.id, key: defaultModel.key },
        evoya?.chat_uuid
      );
      if (!result.ok) {
        toast.error(t('components.molecules.modelPicker.changeFailed'));
      }
    } catch {
      toast.error(t('components.molecules.modelPicker.changeFailed'));
    } finally {
      setRemovingModel(false);
    }
  };
  const selectedModel =
    modelCatalog?.find((model) => model.id === activeModel?.modelId) ??
    modelCatalog?.find((model) => model.isDefault);
  const supportsThinking =
    selectedModel?.reasoning.type !== undefined &&
    selectedModel.reasoning.type !== 'none';

  useEffect(() => {
    setThinkEnabled(false);
  }, [selectedModel?.id, evoya?.chat_uuid]);
  const [selectedCommand, setSelectedCommand] = useState<ICommand>();
  const [selectedAgents, setSelectedAgents] = useState<any[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<ProjectListItem[]>(
    []
  );
  const [openProjectsRequest, setOpenProjectsRequest] = useState(0);
  const [openModelPickerRequest, setOpenModelPickerRequest] = useState(0);
  const setChatSettingsOpen = useSetRecoilState(chatSettingsOpenState);
  const [attachments, setAttachments] = useRecoilState(attachmentsState);
  const quotedSelection = useRecoilValue(quotedSelectionState);
  const resetQuotedSelection = useResetRecoilState(quotedSelectionState);
  const [evoyaAttachments, setEvoyaAttachments] = useRecoilState(
    evoyaAttachmentsState
  );
  const initialTranscript = useRecoilValue(initialTranscriptState);
  const audioConnection = useRecoilValue(audioConnectionState);
  const isChatArchived = useRecoilValue(chatArchived);
  const isProjectAccessible = useRecoilValue(projectAccess);
  const temporaryChat = useRecoilValue(temporaryChatState);
  const isTemporaryChat = evoya?.type === 'dashboard' && temporaryChat;
  const resetInitialTranscript = useResetRecoilState(initialTranscriptState);
  const { t } = useTranslation();

  const { user } = useAuth();
  const { sendMessage, replyMessage } = useChatInteract();
  const {
    askUser,
    chatArchived: isDisabledByArchive,
    chatSettingsInputs,
    connected,
    disabled: _disabled
  } = useChatData();

  const hasUploadingAttachment = !!attachments.find((a) => !a.uploaded);
  const disabled = _disabled || hasUploadingAttachment;
  const inputDisabled =
    isDisabledByArchive ||
    !connected ||
    askUser?.spec.type === 'file' ||
    askUser?.spec.type === 'action' ||
    hasUploadingAttachment;

  useEffect(() => {
    if (!initialTranscript || !inputRef.current) return;

    const transcriptText = initialTranscript.text;
    if (typeof transcriptText !== 'string') {
      resetInitialTranscript();
      return;
    }

    if (
      inputRef.current.insertTranscript(transcriptText, initialTranscript.mode)
    ) {
      resetInitialTranscript();
      return;
    }
    if (initialTranscript.mode === 'append') {
      inputRef.current.appendContent(transcriptText);
    } else {
      inputRef.current.setContent(transcriptText);
    }

    resetInitialTranscript();
  }, [initialTranscript, resetInitialTranscript]);

  const onPaste = useCallback((event: ClipboardEvent) => {
    if (event.clipboardData && event.clipboardData.items) {
      const items = Array.from(event.clipboardData.items);

      // If no text data, check for files (e.g., images)
      items.forEach((item) => {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            onFileUpload([file]);
          }
        }
      });
    }
  }, []);

  const onSubmit = useCallback(
    async (
      msg: string,
      attachments?: IAttachment[],
      evoyaAttachments?: EvoyaAttachment[],
      selectedCommand?: string,
      selectedAgents?: string[],
      collapsedPromptDisplayOutput?: string,
      quotedSelection?: IQuotedSelection
    ) => {
      // The quote is inlined in the payload sent to the LLM as a markdown
      // blockquote, while the bubble only displays the user question (the
      // quote is rendered separately from the metadata).
      const quoteBlock = quotedSelection?.text
        ? quotedSelection.text
            .split('\n')
            .map((line) => `> ${line}`)
            .join('\n')
        : undefined;

      const outputWithQuote = quoteBlock ? `${quoteBlock}\n\n${msg}` : msg;

      const displayOutput =
        collapsedPromptDisplayOutput !== undefined
          ? collapsedPromptDisplayOutput
          : quoteBlock
            ? msg
            : undefined;

      const message: IStep = {
        threadId: '',
        command: selectedCommand,
        agents: selectedAgents,
        id: uuidv4(),
        name: user?.identifier || 'User',
        type: 'user_message',
        output: outputWithQuote,
        createdAt: new Date().toISOString(),
        metadata: {
          location: window.location.href,
          ...(supportsThinking ? { think_enabled: thinkEnabled } : {}),
          ...(displayOutput !== undefined
            ? { evoyaCollapsedPromptDisplayOutput: displayOutput }
            : {}),
          ...(quotedSelection ? { quotedSelection } : {})
        }
      };

      const fileReferences = attachments
        ?.filter((a) => !!a.serverId)
        .map((a) => ({ id: a.serverId! }));

      const evoyaReferences = evoyaAttachments?.map((a) => ({ path: a.path }));

      if (setAutoScroll) {
        setAutoScroll(true);
      }

      // @ts-expect-error is not a valid prop
      if (window.sendCreatorMessage && creatorEnabled) {
        // @ts-expect-error is not a valid prop
        window.sendCreatorMessage(message);
      } else {
        sendMessage(message, fileReferences, evoyaReferences);
      }
    },
    [user, sendMessage, creatorEnabled, thinkEnabled, supportsThinking]
  );

  const onReply = useCallback(
    async (msg: string) => {
      const message: IStep = {
        threadId: '',
        id: uuidv4(),
        name: user?.identifier || 'User',
        type: 'user_message',
        output: msg,
        createdAt: new Date().toISOString(),
        metadata: { location: window.location.href }
      };

      replyMessage(message);
      setAutoScroll(true);
    },
    [user, replyMessage]
  );

  const submit = async () => {
    if (
      audioConnection !== 'off' ||
      disabled ||
      (!selectedCommand &&
        (inputRef.current?.getFullContent() ?? value).trim() === '' &&
        attachments.length === 0 &&
        evoyaAttachments.length === 0)
    ) {
      return;
    }

    const isCollapsedCreatorPrompt =
      creatorEnabled &&
      !!selectedCommand &&
      !inputRef.current?.isCommandExpanded();
    const fullContent =
      inputRef.current?.getFullContent?.(isCollapsedCreatorPrompt) ?? value;

    if (submitProxy) {
      submitProxy(fullContent, (text: string) => {
        if (askUser) {
          onReply(text);
        } else {
          onSubmit(
            text,
            attachments,
            evoyaAttachments,
            selectedCommand?.id,
            selectedAgents,
            isCollapsedCreatorPrompt ? value : undefined,
            quotedSelection
          );
        }
        setAttachments([]);
        setValue('');
        resetQuotedSelection();
        inputRef.current?.reset();
      });
    } else {
      submitMessage();
    }
  };

  const submitMessage = useCallback(() => {
    if (
      disabled ||
      (!selectedCommand &&
        (inputRef.current?.getFullContent() ?? value).trim() === '' &&
        attachments.length === 0 &&
        evoyaAttachments.length === 0)
    ) {
      return;
    }

    // Get full content including agents
    const isCollapsedCreatorPrompt =
      creatorEnabled &&
      !!selectedCommand &&
      !inputRef.current?.isCommandExpanded();
    const fullContent =
      inputRef.current?.getFullContent?.(isCollapsedCreatorPrompt) ?? value;

    if (askUser) {
      onReply(fullContent);
    } else {
      onSubmit(
        fullContent,
        attachments,
        evoyaAttachments,
        selectedCommand?.id,
        selectedAgents,
        isCollapsedCreatorPrompt ? value : undefined,
        quotedSelection
      );
    }
    setAttachments([]);
    setEvoyaAttachments([]);
    setSelectedAgents([]);
    resetQuotedSelection();
    inputRef.current?.reset();
  }, [
    value,
    disabled,
    setValue,
    askUser,
    attachments,
    evoyaAttachments,
    selectedCommand,
    selectedAgents,
    creatorEnabled,
    quotedSelection,
    resetQuotedSelection,
    setAttachments,
    setSelectedAgents,
    onSubmit
  ]);

  const removeProject = (project: ProjectListItem) => {
    removeDashboardProject(project);
    setSelectedProjects((current) =>
      current.filter((item) => item.id !== project.id)
    );
  };

  return (
    <div
      className={cn(
        'bg-accent p-3 px-4 w-full flex flex-col',
        (evoya && evoya.type == 'dashboard') || evoya == undefined
          ? 'min-h-24 rounded-3xl'
          : 'rounded-full',
        // The pill layout (copilot) needs square-ish corners to host the
        // quoted context chip.
        quotedSelection && 'rounded-3xl',
        isChatArchived && 'border border-primary',
        isTemporaryChat &&
          'border border-dashed border-gray-400 dark:border-gray-500'
      )}
    >
      {isChatArchived ? (
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Archive className="!size-4 shrink-0" />
          <p>{t('chat.input.archived')}</p>
        </div>
      ) : null}
      {attachments.length > 0 || evoyaAttachments.length > 0 ? (
        <div className="mb-1">
          <Attachments />
        </div>
      ) : null}
      {quotedSelection ? (
        <div className="mb-2">
          <QuotedContext disabled={inputDisabled} />
        </div>
      ) : null}
      {evoya?.type === 'dashboard' && selectedProjects.length > 0 ? (
        <div className="mb-2 flex min-h-7 flex-wrap items-center gap-1.5">
          {selectedProjects.map((project) => (
            <div
              key={project.id}
              className="flex h-7 max-w-full items-center gap-1.5 rounded-md bg-primary/10 px-2 text-xs font-medium text-primary"
            >
              <FolderOpen className="size-3 shrink-0" />
              <span className="max-w-64 truncate">{project.name}</span>
              <button
                type="button"
                onClick={() => removeProject(project)}
                disabled={disabled}
                className="ml-0.5 rounded-sm p-0.5 hover:bg-primary/10 disabled:opacity-50"
                aria-label={`Remove ${project.name}`}
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setOpenProjectsRequest((request) => request + 1)}
            disabled={disabled}
            className="flex size-7 items-center justify-center rounded-full border border-dashed border-primary/40 text-primary hover:bg-primary/10 disabled:opacity-50"
            aria-label="Open projects"
          >
            <Plus className="size-4" />
          </button>
        </div>
      ) : null}
      {((evoya && evoya?.type == 'dashboard') || evoya == undefined) && (
        <Input
          ref={inputRef}
          id="chat-input"
          autoFocus
          disabled={inputDisabled}
          selectedCommand={selectedCommand}
          setSelectedCommand={setSelectedCommand}
          onChange={setValue}
          onEnter={() => void submit()}
          onPaste={onPaste}
          submitProxy={submitProxy}
          placeholder={t('chat.input.placeholder')}
          selectedAgents={selectedAgents}
          setSelectedAgents={setSelectedAgents}
        />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center -ml-1.5">
          {((evoya && evoya?.type != 'dashboard') ||
            !context?.is_superuser) && (
            <UploadButton
              disabled={disabled}
              fileSpec={fileSpec}
              onFileUploadError={onFileUploadError}
              onFileUpload={onFileUpload}
            />
          )}
          {evoya && evoya?.type == 'dashboard' && context?.is_superuser && (
            <UploadButtonDropdown
              disabled={disabled}
              fileSpec={fileSpec}
              onFileUploadError={onFileUploadError}
              onFileUpload={onFileUpload}
            />
          )}
          {evoya && evoya?.type == 'dashboard' && (
            <ConfigurationMenu
              disabled={disabled}
              isProjectAccessible={isProjectAccessible}
              openProjectsRequest={openProjectsRequest}
              openModelPickerRequest={openModelPickerRequest}
              onSelectedProjectsChange={setSelectedProjects}
              selectedCommand={selectedCommand}
              onCommandSelect={setSelectedCommand}
            />
          )}
          {chatSettingsInputs.length > 0 && (
            <Button
              id="chat-settings-open-modal"
              disabled={disabled}
              onClick={() => setChatSettingsOpen(true)}
              className="hover:bg-muted"
              variant="ghost"
              size="icon"
            >
              <Settings className="!size-5" />
            </Button>
          )}
        </div>
        {evoya && evoya?.type != 'dashboard' && (
          <Input
            ref={inputRef}
            id="chat-input"
            autoFocus
            disabled={inputDisabled}
            selectedCommand={selectedCommand}
            setSelectedCommand={setSelectedCommand}
            onChange={setValue}
            onEnter={() => void submit()}
            onPaste={onPaste}
            submitProxy={submitProxy}
            placeholder={t('chat.input.placeholder')}
            className={'min-h-0'}
            selectedAgents={selectedAgents}
            setSelectedAgents={setSelectedAgents}
          />
        )}
        <div className="flex items-center gap-1">
          {evoya?.type === 'dashboard' &&
          evoya.chat_uuid &&
          selectedModel &&
          !selectedModel.isDefault ? (
            <div className="group mx-2 flex h-7 max-w-48 items-center rounded-md border border-primary/25 bg-primary/10 text-xs font-medium text-primary transition-colors hover:bg-primary/15">
              <button
                type="button"
                onClick={() =>
                  setOpenModelPickerRequest((request) => request + 1)
                }
                disabled={disabled || removingModel}
                aria-label={`Change model. Current model: ${selectedModel.name}`}
                className="min-w-0 truncate rounded-md px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selectedModel.name}
              </button>
              <button
                type="button"
                onClick={() => void removeModel()}
                disabled={disabled || removingModel || !defaultModel}
                aria-label={`Remove ${selectedModel.name} and use default model`}
                className="w-0 shrink-0 overflow-hidden rounded-sm opacity-0 transition-all hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 group-hover:mr-1 group-hover:w-4 group-hover:p-0.5 group-hover:opacity-100 group-focus-within:mr-1 group-focus-within:w-4 group-focus-within:p-0.5 group-focus-within:opacity-100 disabled:cursor-not-allowed [@media(hover:none)]:mr-1 [@media(hover:none)]:w-4 [@media(hover:none)]:p-0.5 [@media(hover:none)]:opacity-100"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </div>
          ) : null}
          {supportsThinking && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    id="think-toggle"
                    type="button"
                    aria-pressed={thinkEnabled}
                    disabled={disabled || inputDisabled}
                    onClick={() => setThinkEnabled((enabled) => !enabled)}
                    variant={thinkEnabled ? 'secondary' : 'ghost'}
                    size="sm"
                    className={cn(
                      'mx-2 h-7 gap-1.5 rounded-md border px-2 text-xs font-medium',
                      thinkEnabled
                        ? 'border-primary/25 bg-primary/10 text-primary hover:bg-primary/15'
                        : 'border-border bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    <Brain className="!size-5 shrink-0" />
                    {t('chat.input.think', { defaultValue: 'Think' })}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t('chat.input.thinkTooltip', {
                    defaultValue: 'Think longer to handle complex tasks'
                  })}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <SubmitButton
            onDictationStart={() => inputRef.current?.beginDictation()}
            onDictationCancel={() => inputRef.current?.cancelDictation()}
            onSubmit={() => void submit()}
            disabled={disabled}
            value={selectedCommand ? selectedCommand.id : value}
          />
        </div>
      </div>
    </div>
  );
}
