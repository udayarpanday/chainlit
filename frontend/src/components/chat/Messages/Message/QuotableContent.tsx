import {
  getPortalContainer,
  getTextRangeOffsets,
  getUIElementById,
  getUISelection
} from '@/lib/dom';
import { useCallback, useRef } from 'react';
import { useSetRecoilState } from 'recoil';

import { useTextSelection } from '@/hooks/useTextSelection';

import {
  MAX_QUOTED_SELECTION_LENGTH,
  quotedSelectionState
} from '@/state/chat';

import SelectionActionBar from './SelectionActionBar';

interface Props {
  messageId: string;
  author?: string;
  /** Selection capture is disabled while the message is still streaming. */
  disabled?: boolean;
}

/**
 * Wraps a message body and lets the user pin the highlighted text as context
 * for their next prompt.
 */
const QuotableContent = ({
  messageId,
  author,
  disabled,
  children
}: React.PropsWithChildren<Props>) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const setQuotedSelection = useSetRecoilState(quotedSelectionState);
  const { selection, clearSelection } = useTextSelection(containerRef, {
    enabled: !disabled
  });

  const onQuote = useCallback(() => {
    if (!selection) return;

    const container = containerRef.current;
    const domSelection = getUISelection(container);
    const sourceOffsets =
      container && domSelection?.rangeCount
        ? getTextRangeOffsets(container, domSelection.getRangeAt(0))
        : undefined;

    setQuotedSelection({
      text: selection.text.slice(0, MAX_QUOTED_SELECTION_LENGTH),
      messageId,
      author,
      sourceStart: sourceOffsets?.start,
      sourceEnd: sourceOffsets?.end
    });

    domSelection?.removeAllRanges();
    clearSelection();

    getUIElementById('chat-input', containerRef.current)?.focus();
  }, [author, clearSelection, messageId, selection, setQuotedSelection]);

  return (
    <div ref={containerRef} className="quotable-content w-full">
      {children}
      {selection ? (
        <SelectionActionBar
          rect={selection.rect}
          container={getPortalContainer(containerRef.current)}
          onQuote={onQuote}
        />
      ) : null}
    </div>
  );
};

export default QuotableContent;
