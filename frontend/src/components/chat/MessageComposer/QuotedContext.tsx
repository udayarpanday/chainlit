import {
  getTextRangeFromOffsets,
  getUIElementById,
  scrollTextRangeIntoView
} from '@/lib/dom';
import {
  clearQuotedTextHighlight,
  findQuotedTextRanges,
  highlightQuotedText
} from '@/lib/quotedTextHighlight';
import { cn } from '@/lib/utils';
import { CornerDownRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue, useResetRecoilState } from 'recoil';

import { Button } from '@/components/ui/button';

import { quotedSelectionState } from '@/state/chat';

interface Props {
  className?: string;
  disabled?: boolean;
}

const QuotedContext = ({ className, disabled }: Props) => {
  const quotedSelection = useRecoilValue(quotedSelectionState);
  const resetQuotedSelection = useResetRecoilState(quotedSelectionState);
  const containerRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Never leave a highlight running after the composer is gone.
  useEffect(() => clearQuotedTextHighlight, []);

  if (!quotedSelection?.text) return null;

  const scrollToSource = () => {
    if (!quotedSelection.messageId) return;
    const source = getUIElementById(
      `step-${quotedSelection.messageId}`,
      containerRef.current
    );
    if (!source) return;

    const sourceContent =
      source.querySelector<HTMLElement>('.quotable-content');
    const { sourceStart, sourceEnd } = quotedSelection;
    const offsetRange =
      sourceContent && sourceStart !== undefined && sourceEnd !== undefined
        ? getTextRangeFromOffsets(sourceContent, sourceStart, sourceEnd)
        : null;
    const range =
      offsetRange ??
      findQuotedTextRanges(sourceContent ?? source, quotedSelection.text)[0] ??
      null;

    if (!range || !scrollTextRangeIntoView(range)) {
      source.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Flash the quoted passage in the source message for a few seconds.
    highlightQuotedText(source, quotedSelection.text, range);
  };

  return (
    <div
      id="quoted-context"
      ref={containerRef}
      className={cn(
        'flex w-full min-w-0 max-w-full items-center gap-2 overflow-hidden rounded-2xl bg-background/60 py-2 pl-3 pr-1.5 text-sm text-muted-foreground',
        className
      )}
    >
      <CornerDownRight className="size-4 shrink-0" />
      <button
        type="button"
        onClick={scrollToSource}
        title={quotedSelection.text}
        className="min-w-0 flex-1 overflow-hidden text-left hover:text-foreground"
      >
        {/* Long quotes wrap inside the chip; the button clips overflow
            because buttons don't apply text-overflow reliably. */}
        <span className="block">
          &ldquo;{quotedSelection.text.replace(/\s+/g, ' ')}&rdquo;
        </span>
      </button>
      <Button
        variant="ghost"
        size="icon"
        disabled={disabled}
        onClick={() => resetQuotedSelection()}
        className="size-7 shrink-0 rounded-full hover:bg-muted"
        aria-label={t('chat.quote.remove')}
      >
        <X className="!size-4" />
      </Button>
    </div>
  );
};

export default QuotedContext;
