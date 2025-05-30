import { useCallback, useContext, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { WidgetContext } from '@chainlit/copilot/src/context';
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
import VoiceButton from './VoiceButton';

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
      selectedCommand?: string
    ) => {
      const message: IStep = {
        threadId: '',
        command: selectedCommand,
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

      setAutoScroll(true);

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
    if (askUser) {
      onReply(value);
    } else {
      onSubmit(value, attachments, selectedCommand?.id);
    }
    setAttachments([]);
    inputRef.current?.reset();
  }, [
    value,
    disabled,
    setValue,
    askUser,
    attachments,
    selectedCommand,
    setAttachments,
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
          placeholder={t('chat.input.placeholder', 'Type your message here...')}
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
          {evoya && evoya?.type == 'dashboard' && (
            <VoiceButton disabled={disabled} />
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
            placeholder={t(
              'chat.input.placeholder',
              'Type your message here...'
            )}
            className={'min-h-0'}
          />
        )}
        <div className="flex items-center gap-1">
          <SubmitButton onSubmit={submit} disabled={disabled} />
        </div>
      </div>
    </div>
  );
}
