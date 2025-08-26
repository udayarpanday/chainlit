import { Send } from 'lucide-react';
import { useContext } from 'react';

import { WidgetContext } from '@chainlit/copilot/src/context';
import {
  useChatData,
  useChatInteract,
  useChatMessages
} from '@chainlit/react-client';

import { Stop } from '@/components/icons/Stop';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from 'components/i18n';

import VoiceButton from './VoiceButton';

interface SubmitButtonProps {
  disabled?: boolean;
  value?: string;
  onSubmit: () => void;
}

export default function SubmitButton({
  disabled,
  onSubmit,
  value
}: SubmitButtonProps) {
  const { evoya } = useContext(WidgetContext);
  const { loading } = useChatData();
  const { firstInteraction } = useChatMessages();
  const { stopTask } = useChatInteract();

  const isValueEmpty = (val: string | undefined): boolean => {
    if (!val) return true;
    const cleanedValue = val
      .replace(/\s/g, '') // Remove all whitespace
      .replace(/\u200B/g, '') // Remove zero-width space
      .replace(/\u200C/g, '') // Remove zero-width non-joiner
      .replace(/\u200D/g, '') // Remove zero-width joiner
      .replace(/\uFEFF/g, ''); // Remove byte order mark
    return cleanedValue === '';
  };
  return (
    <TooltipProvider>
      {!loading &&
      isValueEmpty(value) &&
      ((evoya && evoya?.speechToText == true) || evoya == undefined) ? (
        <VoiceButton disabled={disabled} />
      ) : loading && firstInteraction ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="stop-button"
              onClick={stopTask}
              size="icon"
              variant="outline"
              className="rounded-full h-8 w-8 hover:bg-muted"
            >
              <Stop className="!size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              <Translator path="chat.input.actions.stop" />
            </p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="chat-submit"
              disabled={disabled}
              onClick={onSubmit}
              size="icon"
              variant="ghost"
              className="rounded-full h-8 w-8 hover:bg-muted"
            >
              <Send className="!size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              <Translator path="chat.input.actions.send" />
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </TooltipProvider>
  );
}
