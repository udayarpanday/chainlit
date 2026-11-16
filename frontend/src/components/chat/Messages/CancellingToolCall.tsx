import { MessageContext } from '@/contexts/MessageContext';
import { useContext } from 'react';

import type { IStep } from '@chainlit/react-client';

import BlinkingCursor from '@/components/BlinkingCursor';

import { useLayoutMaxWidth } from '@/hooks/useLayoutMaxWidth';

import { MessageAvatar } from './Message/Avatar';
import ToolStepInfo from './Message/ToolStepInfo';

export default function CancellingToolCall({
  toolCalls
}: {
  toolCalls: IStep[];
}) {
  const { uiName } = useContext(MessageContext);
  const layoutMaxWidth = useLayoutMaxWidth();

  return (
    <div
      className="step my-2"
      style={{ maxWidth: layoutMaxWidth }}
      role="status"
    >
      <div className="ai-message flex items-center gap-4 w-full pb-2">
        <div className="hidden md:block">
          <MessageAvatar author={uiName} />
        </div>
        <BlinkingCursor />
        <ToolStepInfo toolCalls={toolCalls} />
      </div>
    </div>
  );
}
