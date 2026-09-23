import { Quote } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';

import {
  SELECTION_TOOLBAR_ID,
  type TextSelectionRect
} from '@/hooks/useTextSelection';

interface Props {
  rect: TextSelectionRect;
  /** Portal target (shadow root container inside the copilot widget). */
  container: Element;
  onQuote: () => void;
}

const BAR_HEIGHT = 36;
const BAR_OFFSET = 8;
const BAR_ESTIMATED_WIDTH = 160;

/**
 * Small floating toolbar anchored to the current text selection, offering to
 * pin the highlighted text as context for the next prompt.
 */
const SelectionActionBar = ({ rect, container, onQuote }: Props) => {
  const { t } = useTranslation();

  const showAbove = rect.top > BAR_HEIGHT + BAR_OFFSET;
  const top = showAbove
    ? rect.top - BAR_HEIGHT - BAR_OFFSET
    : rect.bottom + BAR_OFFSET;

  const center = rect.left + rect.width / 2;
  const left = Math.min(
    Math.max(center, BAR_ESTIMATED_WIDTH / 2 + BAR_OFFSET),
    window.innerWidth - BAR_ESTIMATED_WIDTH / 2 - BAR_OFFSET
  );

  return createPortal(
    <div
      id={SELECTION_TOOLBAR_ID}
      className="fixed z-50 -translate-x-1/2"
      style={{ top, left }}
      // Keep the DOM selection alive when interacting with the toolbar.
      onMouseDown={(e) => e.preventDefault()}
    >
      <Button
        size="sm"
        variant="secondary"
        className="h-9 gap-1.5 rounded-full border border-border bg-popover px-3 text-xs font-medium shadow-md hover:bg-accent"
        onClick={onQuote}
      >
        <Quote className="!size-3.5" />
        {t('chat.quote.action')}
      </Button>
    </div>,
    container
  );
};

export default SelectionActionBar;
