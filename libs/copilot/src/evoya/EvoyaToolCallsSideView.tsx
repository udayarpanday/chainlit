import { useRecoilState } from 'recoil';

import ToolCallsInfo from '@chainlit/app/src/components/chat/Messages/Message/ToolCallsInfo';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@chainlit/app/src/components/ui/sheet';
import { evoyaToolCallsState, getScopedSessionStorageItem } from '@chainlit/react-client';
import { useEffect, useState, useContext } from 'react';
import {
  type IStep,
} from '@chainlit/react-client';
import { WidgetContext } from '@/context';

export default function EvoyaToolCallsSideView() {
  const [evoyaToolCalls, setEvoyaToolCalls] = useRecoilState(evoyaToolCallsState);
  const [toolCalls, setToolCalls] = useState<IStep[]>([])
  const { evoya } = useContext(WidgetContext);

  useEffect(() => {
    if (evoyaToolCalls.isOpen) {
      const sessionUuid = getScopedSessionStorageItem('session_token');
      const apiUrl = `${evoya?.api?.baseUrl ?? location.origin}/chat/session/${sessionUuid}/tool-call/${evoyaToolCalls.runId}/`;
      fetch(apiUrl, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then((response) => response.json())
      .then((json) => setToolCalls(json))
    } else {
      setToolCalls([]);
    }
  }, [evoyaToolCalls])

  return (
    <Sheet open={evoyaToolCalls.isOpen} onOpenChange={(open) => !open && setEvoyaToolCalls({ isOpen: false, runId: undefined, toolCalls: []})}>
      <SheetContent className="flex flex-col md:max-w-lg px-0">
        <SheetHeader className='px-6'>
          <SheetTitle>Sources & Tools</SheetTitle>
        </SheetHeader>
        <div className="mt-4 overflow-y-auto flex-grow flex flex-col gap-4 px-6">
          {/* <ToolCallsInfo toolCalls={toolCalls} /> */}
          <ToolCallsInfo toolCalls={evoyaToolCalls.toolCalls} />
        </div>
      </SheetContent>
    </Sheet>
  );
}