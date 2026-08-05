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
import { Archive, FolderOpen, Plus, X } from 'lucide-react';

import { Settings } from '@/components/icons/Settings';
import { Button } from '@/components/ui/button';

import { chatSettingsOpenState } from '@/state/project';
import { IAttachment, attachmentsState } from 'state/chat';
import { evoyaAttachmentsState, EvoyaAttachment } from '@/state/evoya';

import { Attachments } from './Attachments';
import ConfigurationMenu, {
  ProjectListItem,
  removeDashboardProject
} from './ConfigurationMenu';
import Input, { InputMethods } from './Input';
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
  const [selectedProjects, setSelectedProjects] = useState<ProjectListItem[]>(
    []
  );
  const [openProjectsRequest, setOpenProjectsRequest] = useState(0);
  const setChatSettingsOpen = useSetRecoilState(chatSettingsOpenState);
  const [attachments, setAttachments] = useRecoilState(attachmentsState);
  const [evoyaAttachments, setEvoyaAttachments] = useRecoilState(evoyaAttachmentsState);
  const initialTranscript = useRecoilValue(initialTranscriptState);
  const isChatArchived = useRecoilValue(chatArchived);
  const isProjectAccessible = useRecoilValue(projectAccess);
  console.log(isProjectAccessible)
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

  const removeProject = (project: ProjectListItem) => {
    removeDashboardProject(project);
    setSelectedProjects((current) =>
      current.filter((item) => item.id !== project.id)
    );
  };

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
          <ConfigurationMenu
            disabled={disabled}
            isProjectAccessible={isProjectAccessible}
            openProjectsRequest={openProjectsRequest}
            onSelectedProjectsChange={setSelectedProjects}
            selectedCommand={selectedCommand}
            onCommandSelect={setSelectedCommand}
          />
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
