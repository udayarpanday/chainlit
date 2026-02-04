import { useCallback, useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { WidgetContext } from '@chainlit/copilot/src/context';
import EvoyaCreatorButton from '@chainlit/copilot/src/evoya/EvoyaCreatorButton';
import PrivacyShieldToggle from '@chainlit/copilot/src/evoya/privacyShield/PrivacyShieldToggle';
import {
  FileSpec,
  ICommand,
  IStep,
  useAuth,
  useChatData,
  useChatInteract
} from '@chainlit/react-client';

import { Settings } from '@/components/icons/Settings';
import { Button } from '@/components/ui/button';

import { chatSettingsOpenState } from '@/state/project';
import { IAttachment, attachmentsState } from 'state/chat';

import { Attachments } from './Attachments';
import CommandButton from './CommandButton';
import Input, { InputMethods } from './Input';
import SubmitButton from './SubmitButton';
import UploadButton from './UploadButton';

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
  const { evoya } = useContext(WidgetContext);
  const inputRef = useRef<InputMethods>(null);
  const [value, setValue] = useState('');
  const [selectedCommand, setSelectedCommand] = useState<ICommand>();
  const [selectedAgents, setSelectedAgents] = useState<any[]>([]);
  const setChatSettingsOpen = useSetRecoilState(chatSettingsOpenState);
  const [attachments, setAttachments] = useRecoilState(attachmentsState);
  const { t } = useTranslation();

  const { user } = useAuth();
  const { sendMessage, replyMessage } = useChatInteract();
  const { askUser, chatSettingsInputs, disabled: _disabled } = useChatData();

  const disabled = _disabled || !!attachments.find((a) => !a.uploaded);

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

      if (setAutoScroll) {
        setAutoScroll(true);
      }

      // @ts-expect-error is not a valid prop
      if (window.sendCreatorMessage && window.evoyaCreatorEnabled) {
        // @ts-expect-error is not a valid prop
        window.sendCreatorMessage(message);
      } else {
        sendMessage(message, fileReferences);
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
    if (submitProxy) {
      submitProxy(value, (text: string) => {
        if (askUser) {
          onReply(text);
        } else {
          onSubmit(text, attachments);
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
    if (disabled || (value === '' && attachments.length === 0)) {
      return;
    }
    
    // Get full content including agents
    const fullContent = inputRef.current?.getFullContent?.() || value;
    
    if (askUser) {
      onReply(fullContent);
    } else {
      onSubmit(fullContent, attachments, selectedCommand?.id, selectedAgents);
    }
    setAttachments([]);
    setSelectedAgents([]);
    inputRef.current?.reset();
  }, [
    value,
    disabled,
    setValue,
    askUser,
    attachments,
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
      } flex flex-col`}
    >
      {attachments.length > 0 ? (
        <div className="mb-1">
          <Attachments />
        </div>
      ) : null}
      {((evoya && evoya?.type == 'dashboard') || evoya == undefined) && (
        <Input
          ref={inputRef}
          id="chat-input"
          autoFocus
          selectedCommand={selectedCommand}
          setSelectedCommand={setSelectedCommand}
          onChange={setValue}
          onEnter={submit}
          onPaste={onPaste}
          submitProxy={submitProxy}
          placeholder={t('chat.input.placeholder', 'Your input...')}
          selectedAgents={selectedAgents}
          setSelectedAgents={setSelectedAgents}
        />
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center -ml-1.5">
          <UploadButton
            disabled={disabled}
            fileSpec={fileSpec}
            onFileUploadError={onFileUploadError}
            onFileUpload={onFileUpload}
          />
          {evoya && evoya?.type == 'dashboard' && (
            <CommandButton
              disabled={disabled}
              selectedCommand={selectedCommand}
              onCommandSelect={setSelectedCommand}
            />
          )}
          {evoya?.evoyaCreator?.enabled && <EvoyaCreatorButton />}
          {evoya?.api?.privacyShield?.enabled && (
            <PrivacyShieldToggle evoya={evoya} />
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
              <Settings className="!size-6" />
            </Button>
          )}
        </div>
        {evoya && evoya?.type != 'dashboard' && (
          <Input
            ref={inputRef}
            id="chat-input"
            autoFocus
            selectedCommand={selectedCommand}
            setSelectedCommand={setSelectedCommand}
            onChange={setValue}
            onEnter={submit}
            onPaste={onPaste}
            submitProxy={submitProxy}
            placeholder={t('chat.input.placeholder', 'Your input...')}
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
