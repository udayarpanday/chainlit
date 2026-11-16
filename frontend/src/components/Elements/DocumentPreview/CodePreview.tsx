/// <reference types="vite/client" />
import hljs from 'highlight.js';
import { Check, Copy } from 'lucide-react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

// Widgets load a JavaScript bundle and copilot renders inside a shadow root.
// Keep these scoped styles with the component instead of an extracted CSS asset.
import codePreviewStyles from './CodePreview.css?raw';

import { decodeSource, textFileInfo } from '../../../lib/codePreview';
import {
  escapeSource,
  markHighlightedSource,
  textMatches
} from '../../../lib/previewSearch';
import { Button } from '../../ui/button';
import PreviewSearch, { searchStyles } from './PreviewSearch';
import { usePreviewTheme, useRememberScroll } from './PreviewSession';

export default function CodePreview({
  data,
  name,
  mime,
  language: sourceLanguage
}: {
  data: ArrayBuffer;
  name?: string;
  mime?: string;
  language?: string;
}) {
  const theme = usePreviewTheme();
  const [previewRoot, setPreviewRoot] = useState<HTMLDivElement | null>(null);
  const [darkSurface, setDarkSurface] = useState(theme.dark);
  useLayoutEffect(() => {
    if (!previewRoot) return;
    // Embedded widgets can have a dark ancestor while the preview stays white.
    const color = getComputedStyle(previewRoot).backgroundColor;
    const channels = /^rgba?\(([^)]+)\)/
      .exec(color)?.[1]
      .split(/[,\s/]+/)
      .filter(Boolean)
      .map(Number);
    if (
      !channels ||
      channels.length < 3 ||
      channels.some(Number.isNaN) ||
      (channels.length > 3 && channels[3] < 1)
    ) {
      setDarkSurface(theme.dark);
      return;
    }
    const [r, g, b] = channels.slice(0, 3).map((channel) => {
      const value = channel / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    setDarkSurface(0.2126 * r + 0.7152 * g + 0.0722 * b < 0.18);
  }, [previewRoot, theme]);
  const info = textFileInfo({ name, mime });
  const language = sourceLanguage || info?.language || 'plaintext';
  const source = useMemo(() => {
    try {
      return { ...decodeSource(data), error: undefined };
    } catch (error) {
      return {
        text: '',
        lines: 0,
        truncated: false,
        encoding: '',
        error: (error as Error).message
      };
    }
  }, [data]);
  const highlighted = useMemo(() => {
    // Large files remain usable as plain source without expensive tokenization.
    if (
      source.error ||
      source.text.length > 100000 ||
      language === 'plaintext' ||
      !hljs.getLanguage(language)
    )
      return;
    try {
      return hljs.highlight(source.text, { language, ignoreIllegals: true })
        .value;
    } catch {
      return;
    }
  }, [source, language]);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  useRememberScroll('source', scrollRoot, !source.error);
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => setTerm(query), 180);
    return () => clearTimeout(timeout);
  }, [query]);
  const matches = useMemo(
    () => textMatches(source.text, term),
    [source.text, term]
  );
  const marked = useMemo(
    () =>
      markHighlightedSource(highlighted ?? escapeSource(source.text), matches),
    [highlighted, source.text, matches]
  );
  useEffect(() => setActive(0), [matches]);
  useEffect(() => {
    if (!scrollRoot || !matches.length) return;
    scrollRoot
      .querySelectorAll('[data-preview-match]')
      .forEach((mark) =>
        mark.setAttribute(
          'data-active',
          String(Number(mark.getAttribute('data-preview-match')) === active)
        )
      );
    const target = scrollRoot.querySelector(
      '[data-preview-match="' + active + '"]'
    );
    if (target) {
      const bounds = target.getBoundingClientRect(),
        viewport = scrollRoot.getBoundingClientRect();
      scrollRoot.scrollTo({
        top:
          scrollRoot.scrollTop +
          bounds.top -
          viewport.top -
          viewport.height / 2,
        left: Math.max(
          0,
          scrollRoot.scrollLeft + bounds.left - viewport.left - 60
        )
      });
    }
  }, [scrollRoot, matches, active]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source.text);
      setCopied(true);
      setCopyError(false);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };
  if (source.error)
    return (
      <p role="alert" className="p-4 text-sm">
        {source.error}
      </p>
    );
  return (
    <div
      ref={setPreviewRoot}
      className="document-code-preview flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background text-foreground"
      data-source-theme={darkSurface ? 'dark' : 'light'}
      onKeyDown={(event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 'f'
        ) {
          event.preventDefault();
          event.currentTarget
            .querySelector<HTMLInputElement>('[aria-label="Find in preview"]')
            ?.focus();
        }
      }}
    >
      <style>{codePreviewStyles + searchStyles}</style>
      <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b px-3 text-xs">
        <div className="flex min-w-0 items-center gap-3">
          <span className="truncate font-medium">{info?.label || 'Text'}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2 text-xs"
          onClick={copy}
          aria-label={source.truncated ? 'Copy preview' : 'Copy source'}
        >
          {copied ? (
            <Check className="size-3.5" />
          ) : (
            <Copy className="size-3.5" />
          )}
          {copied ? 'Copied' : source.truncated ? 'Copy preview' : 'Copy'}
        </Button>
      </div>
      <PreviewSearch
        query={query}
        onQuery={setQuery}
        active={active}
        total={matches.length}
        busy={query !== term}
        onMove={(direction) =>
          setActive((current) =>
            matches.length
              ? (current + direction + matches.length) % matches.length
              : 0
          )
        }
      />
      {copyError && (
        <p role="status" className="px-3 py-2 text-xs">
          Copy was blocked. Select the source text to copy it.
        </p>
      )}
      {source.truncated && (
        <p
          role="status"
          className="border-b px-3 py-2 text-xs text-muted-foreground"
        >
          Showing up to 1 MB or 10,000 lines. Download the original for the
          complete file.
        </p>
      )}
      <div
        ref={setScrollRoot}
        role="region"
        aria-label="Source code"
        tabIndex={0}
        className="min-h-0 min-w-0 flex-1 overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div className="source-layout">
          <pre
            aria-hidden="true"
            className="source-gutter"
            style={{ minWidth: `${String(source.lines).length + 3}ch` }}
          >
            {Array.from({ length: source.lines }, (_, index) => index + 1).join(
              '\n'
            )}
          </pre>
          <pre className="source-content" dir="ltr">
            <code dangerouslySetInnerHTML={{ __html: marked }} />
          </pre>
        </div>
      </div>
      <div className="flex h-8 shrink-0 items-center justify-between border-t px-3 text-xs text-muted-foreground">
        <span>
          {source.lines.toLocaleString()}{' '}
          {source.lines === 1 ? 'line' : 'lines'}
          {source.truncated ? ' in preview' : ''}
        </span>
        <span>{source.encoding.toUpperCase()}</span>
      </div>
    </div>
  );
}
