import { useContext } from 'react';
import { useRecoilValue } from 'recoil';

import { WidgetContext } from '@chainlit/copilot/src/context';
import {
  FileSpec,
  temporaryChatState,
  useChatMessages
} from '@chainlit/react-client';

import WaterMark from '@/components/WaterMark';
import { cn, hasMessage } from '@/lib/utils';

import DataProcessingPopover from './DataProcessingPopover';
import MessageComposer from './MessageComposer';
import ScrollDownButton from './ScrollDownButton';
import TemporaryChatNotice from './TemporaryChatNotice';

interface Props {
  fileSpec: FileSpec;
  onFileUpload: (payload: File[]) => void;
  onFileUploadError: (error: string) => void;
  setAutoScroll: (autoScroll: boolean) => void;
  autoScroll: boolean;
  showIfEmptyThread?: boolean;
  submitProxy?: (text: string, submitFunction: (text: string) => void) => void;
}

export default function ChatFooter({
  autoScroll,
  showIfEmptyThread,
  ...props
}: Props) {
  const { messages } = useChatMessages();
  const temporaryChat = useRecoilValue(temporaryChatState);
  const { evoya } = useContext(WidgetContext);
  const dataProcessingCategories =
    evoya?.additionalInfo?.dataProcessingCategories ?? [];
  const showDataProcessing =
    evoya?.type === 'dashboard' &&
    evoya?.additionalInfo?.dataProcessing !== false &&
    dataProcessingCategories.length > 0;

  if (!hasMessage(messages) && !showIfEmptyThread) return null;

  return (
    <div className={cn('relative flex flex-col items-center gap-2 w-full')}>
      {!autoScroll ? (
        <ScrollDownButton onClick={() => props.setAutoScroll(true)} />
      ) : null}
      <MessageComposer {...props} />
      <div
        className={cn(
          'relative flex min-h-4 w-full items-center flex-wrap gap-2',
          evoya?.type === 'dashboard'
            ? 'justify-start'
            : 'justify-center flex-col'
        )}
      >
        {temporaryChat ? (
          <TemporaryChatNotice />
        ) : (
          <WaterMark />
        )}
        {showDataProcessing ? (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            <DataProcessingPopover categories={dataProcessingCategories} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
