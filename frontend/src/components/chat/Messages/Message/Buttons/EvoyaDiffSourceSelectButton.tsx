import { MessageContext } from 'contexts/MessageContext';
import { useSetRecoilState, useRecoilValue } from 'recoil';
import { useContext } from 'react';

import {
  type IStep,
  evoyaDiffSourceContentState,
  evoyaDiffSourceEnabledState,
} from '@chainlit/react-client';

import { DiffIcon } from 'lucide-react';

import { WidgetContext } from '@chainlit/copilot/src/context';
import { useTranslation } from '@/components/i18n/Translator';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from '@/components/i18n';
import DiffToggle from './DiffToggle';

interface Props {
  message: IStep;
}

export function EvoyaDiffSourceSelectButton({ message }: Props) {
  const { evoya } = useContext(WidgetContext);
  const messageContext = useContext(MessageContext);
  const setDiffSourceContent = useSetRecoilState(evoyaDiffSourceContentState);
  const isDiffEnabled = useRecoilValue(evoyaDiffSourceEnabledState);

  const handleClick = () => {
    setDiffSourceContent(message.output);
  };

  return (
    <div className="flex items-center gap-2">
      <DiffToggle id={`diff-toggle-${message.id}`} />
      {isDiffEnabled &&
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
                  <DiffIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  <Translator path="components.molecules.evoyaDiff.sourceLabel" />
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      }
    </div>
  );
}

export default EvoyaDiffSourceSelectButton;
