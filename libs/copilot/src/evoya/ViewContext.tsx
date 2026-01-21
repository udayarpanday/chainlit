import { useState } from 'react';
import { useRecoilValue } from 'recoil';

import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@chainlit/app/src/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';
import { promptState } from '@chainlit/react-client';

const ViewContext = () => {
  const [open, setOpen] = useState(false);
  const context = useRecoilValue(promptState);

  if (!context?.is_superuser) return null;

  return (
    <div>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="opacity-30"
              size="icon"
              variant="ghost"
              onClick={() => setOpen(true)}
            >
              <Translator path="chat.context.title" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <Translator path="chat.context.modal_title_tip" />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="
            z-[9999]
            sm:max-w-[425px]
            lg:max-w-[1200px]
            h-[70vh]
            flex flex-col
            min-h-0
            overflow-hidden
          "
        >
          <DialogHeader>
            <DialogTitle>
              <Translator path="chat.context.modal_title" />
            </DialogTitle>
          </DialogHeader>


          <div
            className="flex-1 min-h-0 overflow-auto overscroll-contain touch-pan-y rounded-md border p-3"
            onWheelCapture={(e) => e.stopPropagation()}
            onTouchMoveCapture={(e) => e.stopPropagation()}
          >
            <pre className="font-sans whitespace-pre-wrap break-words text-sm leading-relaxed">
              {context.context_prompt}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewContext;
