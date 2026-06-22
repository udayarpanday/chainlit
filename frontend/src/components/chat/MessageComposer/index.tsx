import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useRecoilState,
  useRecoilValue,
  useResetRecoilState,
  useSetRecoilState
} from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { WidgetContext } from '@chainlit/copilot/src/context';
import EvoyaCreatorButton from '@chainlit/copilot/src/evoya/EvoyaCreatorButton';
import PrivacyShieldToggle from '@chainlit/copilot/src/evoya/privacyShield/PrivacyShieldToggle';
import {
  chatArchived,
  FileSpec,
  ICommand,
  IStep,
  initialTranscriptState,
  useAuth,
  useChatData,
  useChatInteract,
  projectAccess
} from '@chainlit/react-client';
import { Archive } from 'lucide-react';

import { Settings } from '@/components/icons/Settings';
import { Button } from '@/components/ui/button';

import { chatSettingsOpenState } from '@/state/project';
import { IAttachment, attachmentsState } from 'state/chat';
import { evoyaAttachmentsState, EvoyaAttachment } from '@/state/evoya';

import { Attachments } from './Attachments';
import CommandButton from './CommandButton';
import Input, { InputMethods } from './Input';
import Projects from './Projects';
import SubmitButton from './SubmitButton';
import UploadButton from './UploadButton';
import UploadButtonDropdown from './UploadButtonDropdown';
import { promptState } from '@chainlit/react-client';

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
  const { evoya } = useContext(WidgetContext);
  const inputRef = useRef<InputMethods>(null);
  const [value, setValue] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<ICommand>();
  const [selectedAgents, setSelectedAgents] = useState<any[]>([]);
  const setChatSettingsOpen = useSetRecoilState(chatSettingsOpenState);
  const [attachments, setAttachments] = useRecoilState(attachmentsState);
  const [evoyaAttachments, setEvoyaAttachments] = useRecoilState(evoyaAttachmentsState);
  const initialTranscript = useRecoilValue(initialTranscriptState);
  const isChatArchived = useRecoilValue(chatArchived);
  const isProjectAccessible = useRecoilValue(projectAccess);
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

    if (initialTranscript.mode === 'append') {
      inputRef.current.appendContent(initialTranscript.text);
    } else {
      inputRef.current.setContent(initialTranscript.text);
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
      selectedAgents?: string[]
    ) => {
      const message: IStep = {
        threadId: '',
        command: selectedCommand,
        agents: selectedAgents,
        id: uuidv4(),
        name: user?.identifier || 'User',
        type: 'user_message',
        output: msg,
        createdAt: new Date().toISOString(),
        metadata: { location: window.location.href }
      };

      const fileReferences = attachments
        ?.filter((a) => !!a.serverId)
        .map((a) => ({ id: a.serverId! }));

      const evoyaReferences = evoyaAttachments
        ?.map((a) => ({ path: a.path }));

      if (setAutoScroll) {
        setAutoScroll(true);
      }

      // @ts-expect-error is not a valid prop
      if (window.sendCreatorMessage && window.evoyaCreatorEnabled) {
        // @ts-expect-error is not a valid prop
        window.sendCreatorMessage(message);
      } else {
        sendMessage(message, fileReferences, evoyaReferences);
      }
    },
    [user, sendMessage]
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
    if (disabled) {
      return;
    }

    if (submitProxy) {
      submitProxy(value, (text: string) => {
        if (askUser) {
          onReply(text);
        } else {
          onSubmit(text, attachments, evoyaAttachments);
        }
        setAttachments([]);
        setValue('');
        inputRef.current?.reset();
      });
    } else {
      submitMessage();
    }
  };

  const submitMessage = useCallback(() => {
    if (disabled || (value === '' && attachments.length === 0 && evoyaAttachments.length === 0)) {
      return;
    }

    // Get full content including agents
    const fullContent = inputRef.current?.getFullContent?.() || value;

    if (askUser) {
      onReply(fullContent);
    } else {
      onSubmit(fullContent, attachments, evoyaAttachments, selectedCommand?.id, selectedAgents);
    }
    setAttachments([]);
    setEvoyaAttachments([]);
    setSelectedAgents([]);
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
    setAttachments,
    setSelectedAgents,
    onSubmit
  ]);

  return (
    <div
      className={`bg-accent p-3 px-4 w-full ${
        (evoya && evoya.type == 'dashboard') || evoya == undefined
          ? 'min-h-24 rounded-3xl'
          : 'rounded-full'
      } flex flex-col ${isChatArchived ? 'border border-primary' : ''}`}
    >
      {isChatArchived ? (
        <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Archive className="!size-4 shrink-0" />
          <p>{t('chat.input.archived')}</p>
        </div>
      ) : null}
      {(attachments.length > 0 || evoyaAttachments.length > 0) ? (
        <div className="mb-1">
          <Attachments />
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
          onEnter={submit}
          onPaste={onPaste}
          submitProxy={submitProxy}
          placeholder={t('chat.input.placeholder')}
          selectedAgents={selectedAgents}
          setSelectedAgents={setSelectedAgents}
        />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center -ml-1.5">
          {((evoya && evoya?.type != 'dashboard') || !context?.is_superuser) && (
            <UploadButton
              disabled={disabled}
              fileSpec={fileSpec}
              onFileUploadError={onFileUploadError}
              onFileUpload={onFileUpload}
            />
          )}
          {(evoya && evoya?.type == 'dashboard' && context?.is_superuser) && (
            <UploadButtonDropdown
              disabled={disabled}
              fileSpec={fileSpec}
              onFileUploadError={onFileUploadError}
              onFileUpload={onFileUpload}
            />
          )}
          {evoya && evoya?.type == 'dashboard' && (
            <>
              <CommandButton
                disabled={disabled}
                selectedCommand={selectedCommand}
                onCommandSelect={setSelectedCommand}
              />
              {isProjectAccessible && <Projects disabled={disabled} />}
            </>
          )}
          {evoya?.evoyaCreator?.enabled && (
            <EvoyaCreatorButton disabled={disabled} />
          )}
          {evoya?.api?.privacyShield?.enabled && (
            <PrivacyShieldToggle disabled={disabled} evoya={evoya} />
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
            onEnter={submit}
            onPaste={onPaste}
            submitProxy={submitProxy}
            placeholder={t('chat.input.placeholder')}
            className={'min-h-0'}
            selectedAgents={selectedAgents}
            setSelectedAgents={setSelectedAgents}
          />
        )}
        <div className="flex items-center gap-1">
          <SubmitButton onSubmit={submit} disabled={disabled} value={value} />
        </div>
      </div>
    </div>
  );
}
