import { useRecoilState } from 'recoil';

import ToolCallsInfo from '@chainlit/app/src/components/chat/Messages/Message/ToolCallsInfo';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@chainlit/app/src/components/ui/sheet';
import { evoyaToolCallsState } from '@chainlit/react-client';

export default function EvoyaToolCallsSideView() {
  const [evoyaToolCalls, setEvoyaToolCalls] = useRecoilState(evoyaToolCallsState);

  return (
    <Sheet open={evoyaToolCalls.isOpen} onOpenChange={(open) => !open && setEvoyaToolCalls({ isOpen: false, toolCalls: []})}>
      <SheetContent className="flex flex-col md:max-w-lg">
        <SheetHeader>
          <SheetTitle>Tool Calls</SheetTitle>
        </SheetHeader>
        <div className="mt-4 overflow-y-auto flex-grow flex flex-col gap-4">
          <ToolCallsInfo toolCalls={evoyaToolCalls.toolCalls} />
        </div>
      </SheetContent>
    </Sheet>
  );
}