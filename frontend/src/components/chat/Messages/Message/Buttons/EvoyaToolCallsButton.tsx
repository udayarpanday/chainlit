import { MessageContext } from 'contexts/MessageContext';
import { useRecoilState } from 'recoil';

import { useContext } from 'react';
import {
  type IStep,
} from '@chainlit/react-client';

import { Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from '@/components/i18n';
import { evoyaToolCallsState } from '@chainlit/react-client';

interface Props {
  toolCalls: IStep[];
}

export function EvoyaToolCallsButton({ toolCalls }: Props) {
  const [evoyaToolCalls, setEvoyaToolCalls] = useRecoilState(evoyaToolCallsState);

  const handleClick = () => {
    setEvoyaToolCalls({ isOpen: true, toolCalls });
  };

  if (toolCalls.length === 0) {
    return null;
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="flex">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleClick}
              variant="ghost"
              size="icon"
              className={`text-muted-foreground`}
            >
              <Info className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              Sources & Tools
            </p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

export default EvoyaToolCallsButton;
