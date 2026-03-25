import { History } from 'lucide-react';

import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';

export default function DashboardSidebarButton() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('copilot-dashboard-sidebar'));
  };
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleClick}
            className="border-[#7b809a] rounded-[0.5rem] !size-8"
          >
            <History className="text-[#7b809a]" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="w-[120px]">
          <Translator path={'navigation.header.session.description'} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
