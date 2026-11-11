import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { useRef } from 'react';

import { Button } from '../../ui/button';

export const searchStyles = `.preview-find-match{background:#fde68a;color:#111827;font:inherit;padding:0}.preview-find-match[data-active="true"]{background:#f59e0b;outline:1px solid #92400e}.textLayer .preview-find-match{color:transparent;background:#fbbf2466}.textLayer .preview-find-match[data-active="true"]{background:#f59e0b99}`;
export default function PreviewSearch({
  query,
  onQuery,
  active,
  total,
  busy = false,
  onMove
}: {
  query: string;
  onQuery: (value: string) => void;
  active: number;
  total: number;
  busy?: boolean;
  onMove: (direction: number) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div
      className="flex shrink-0 flex-wrap items-center gap-1 border-b bg-background px-2 py-1 text-foreground"
      aria-label="Preview search"
    >
      <Search className="size-3.5 shrink-0" aria-hidden />
      <input
        ref={input}
        type="search"
        maxLength={256}
        value={query}
        onChange={(event) => onQuery(event.target.value)}
        placeholder="Find in file"
        aria-label="Find in preview"
        className="h-8 min-w-[60px] flex-1 rounded bg-transparent px-1 text-xs outline-none focus:ring-1 focus:ring-ring"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onMove(event.shiftKey ? -1 : 1);
          }
          if (event.key === 'Escape') onQuery('');
        }}
      />
      <span role="status" className="text-xs tabular-nums">
        {busy
          ? 'Searching…'
          : query
            ? total
              ? active + 1 + ' / ' + total + (total >= 1000 ? '+' : '')
              : 'No matches'
            : ''}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Previous match"
        disabled={!total || busy}
        onClick={() => onMove(-1)}
      >
        <ChevronUp className="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-7"
        aria-label="Next match"
        disabled={!total || busy}
        onClick={() => onMove(1)}
      >
        <ChevronDown className="size-3.5" />
      </Button>
      {query && (
        <Button
          variant="ghost"
          size="icon"
          className="size-7"
          aria-label="Clear search"
          onClick={() => {
            onQuery('');
            input.current?.focus();
          }}
        >
          <X className="size-3.5" />
        </Button>
      )}
    </div>
  );
}
