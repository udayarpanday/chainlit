import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  type TextMatch,
  maxSearchMatches,
  textMatches
} from '../../../lib/previewSearch';

export interface PdfPageSearch {
  offsets: number[];
  matches: TextMatch[];
}
export function usePdfSearch(
  pdf: PDFDocumentProxy | undefined,
  root: HTMLElement | null,
  goToPage: (page: number) => void
) {
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');
  const [active, setActive] = useState(0);
  const [result, setResult] = useState<{
    matches: (TextMatch & { page: number })[];
    busy: boolean;
    error: boolean;
  }>({ matches: [], busy: false, error: false });
  const cache = useMemo(
    () => new Map<number, { text: string; offsets: number[] }>(),
    [pdf]
  );
  const sequence = useRef(0);
  useEffect(() => {
    const timer = setTimeout(() => setTerm(query), 200);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const current = ++sequence.current;
    let active = true;
    setActive(0);
    if (!pdf || !term) {
      setResult({ matches: [], busy: false, error: false });
      return;
    }
    setResult({ matches: [], busy: true, error: false });
    (async () => {
      const matches: (TextMatch & { page: number })[] = [];
      for (
        let page = 1;
        page <= pdf.numPages && matches.length < maxSearchMatches;
        page++
      ) {
        if (!active) return;
        let indexed = cache.get(page);
        if (!indexed) {
          const content = await (await pdf.getPage(page)).getTextContent();
          let text = '';
          const offsets: number[] = [];
          for (const item of content.items) {
            offsets.push(text.length);
            if ('str' in item) text += item.str + ' ';
          }
          indexed = { text, offsets };
          cache.set(page, indexed);
        }
        for (const match of textMatches(
          indexed.text,
          term,
          maxSearchMatches - matches.length
        ))
          matches.push({ ...match, page, index: matches.length });
      }
      if (active && sequence.current === current)
        setResult({ matches, busy: false, error: false });
    })().catch(() => {
      if (active) setResult({ matches: [], busy: false, error: true });
    });
    return () => {
      active = false;
    };
  }, [pdf, term, cache]);
  const byPage = useMemo(() => {
    const pages = new Map<number, PdfPageSearch>();
    for (const match of result.matches) {
      if (!pages.has(match.page))
        pages.set(match.page, {
          offsets: cache.get(match.page)!.offsets,
          matches: []
        });
      pages.get(match.page)!.matches.push(match);
    }
    return pages;
  }, [result.matches, cache]);
  useEffect(() => {
    const match = result.matches[active];
    if (!root || !match) return;
    goToPage(match.page);
    const reveal = () => {
      root
        .querySelectorAll('[data-preview-match]')
        .forEach((node) =>
          node.setAttribute(
            'data-active',
            String(Number(node.getAttribute('data-preview-match')) === active)
          )
        );
      const node = root.querySelector('[data-preview-match="' + active + '"]');
      if (node)
        root.scrollTo({
          top:
            root.scrollTop +
            node.getBoundingClientRect().top -
            root.getBoundingClientRect().top -
            root.clientHeight / 2
        });
    };
    reveal();
    const observer = new MutationObserver(reveal);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [result.matches, active, root, goToPage]);
  return {
    query,
    setQuery,
    active,
    total: result.matches.length,
    busy: result.busy || query !== term,
    error: result.error,
    byPage,
    move: (direction: number) =>
      setActive((current) =>
        result.matches.length
          ? (current + direction + result.matches.length) %
            result.matches.length
          : 0
      )
  };
}
