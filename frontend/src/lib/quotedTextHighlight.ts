/**
 * Temporary highlighting of a quoted snippet inside its source message,
 * triggered when the user clicks the quote chip above the composer.
 *
 * Built on the CSS Custom Highlight API so the React-rendered DOM is never
 * mutated (no injected wrapper nodes that could break reconciliation).
 * Browsers without the API degrade to a simple no-op.
 *
 * Works in the standalone app and inside the copilot shadow root alike:
 * the `::highlight()` rule is injected into the root owning the message
 * element, while the highlight itself is registered on the document
 * registry (highlights cross shadow boundaries by design).
 */
import {
  getTextRangeFromOffsets,
  getUIElementById,
  getUIRoot,
  scrollTextRangeIntoView
} from '@/lib/dom';

import type { IQuotedSelection } from '@/state/chat';

/** Name under which the highlight is registered in `CSS.highlights`. */
const HIGHLIGHT_NAME = 'quoted-context-highlight';

/** Id of the injected `<style>` element carrying the highlight colors. */
const HIGHLIGHT_STYLE_ID = 'quoted-context-highlight-style';

/** How long the highlight stays visible after clicking the quote chip. */
export const QUOTED_TEXT_HIGHLIGHT_DURATION_MS = 3000;

/** Minimal shape of `CSS.highlights` (absent from older TS DOM libs). */
interface HighlightRegistryLike {
  set: (name: string, highlight: unknown) => unknown;
  delete: (name: string) => boolean;
}

type HighlightConstructor = new (...ranges: AbstractRange[]) => unknown;

const getHighlightRegistry = (): HighlightRegistryLike | undefined =>
  (CSS as unknown as { highlights?: HighlightRegistryLike }).highlights;

const getHighlightConstructor = (): HighlightConstructor | undefined =>
  (globalThis as unknown as { Highlight?: HighlightConstructor }).Highlight;

const isWhitespace = (char: string) => /\s/.test(char);

/**
 * Mirrors the normalization applied when the quote was captured
 * (`useTextSelection`), plus whitespace collapsing so the quote still
 * matches text that browsers stringified with synthesized line breaks.
 */
const normalizeQuote = (value: string) =>
  value
    .replace(/\u200b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const inlineDisplayCache = new WeakMap<Element, boolean>();

const isInlineElement = (element: Element) => {
  let inline = inlineDisplayCache.get(element);
  if (inline === undefined) {
    const { display } = window.getComputedStyle(element);
    inline =
      display === 'inline' ||
      display.startsWith('inline') ||
      display === 'contents';
    inlineDisplayCache.set(element, inline);
  }
  return inline;
};

const crossesBlockBoundary = (node: Node, commonAncestor: Node) => {
  for (
    let current: Node | null = node;
    current && current !== commonAncestor;
    current = current.parentNode
  ) {
    if (
      current.nodeType === Node.ELEMENT_NODE &&
      !isInlineElement(current as Element)
    ) {
      return true;
    }
  }
  return false;
};

/**
 * Whether the browser's selection stringification would put a line break
 * between two adjacent text nodes (block boundaries and `<br>`).
 */
const needsLineBreak = (previous: Text, next: Text): boolean => {
  if (isWhitespace(previous.data.slice(-1))) return false;
  if (next.data.length > 0 && isWhitespace(next.data[0])) return false;

  const parent = previous.parentElement;
  if (parent && parent === next.parentElement) {
    const siblings = Array.from(parent.childNodes);
    const end = siblings.indexOf(next);
    for (let i = siblings.indexOf(previous) + 1; i < end; i++) {
      const sibling = siblings[i];
      if (sibling.nodeName === 'BR') return true;
      if (
        sibling.nodeType === Node.ELEMENT_NODE &&
        !isInlineElement(sibling as Element)
      ) {
        return true;
      }
    }
    return false;
  }

  const previousAncestors = new Set<Node>();
  for (let node: Node | null = previous; node; node = node.parentNode) {
    previousAncestors.add(node);
  }

  let commonAncestor: Node | null = next;
  while (commonAncestor && !previousAncestors.has(commonAncestor)) {
    commonAncestor = commonAncestor.parentNode;
  }
  if (!commonAncestor) return true;

  return (
    crossesBlockBoundary(previous, commonAncestor) ||
    crossesBlockBoundary(next, commonAncestor)
  );
};

interface CharPosition {
  node: Text;
  offset: number;
  /** Source characters covered (0 for synthesized line breaks). */
  length: number;
}

/**
 * Concatenates all text under `root` into a whitespace-collapsed string,
 * remembering for every produced character which text node and offset it
 * came from so matches can be turned back into DOM ranges.
 */
const buildHaystack = (root: HTMLElement) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node: Node) => {
      const tagName = node.parentElement?.tagName;
      return tagName === 'SCRIPT' || tagName === 'STYLE'
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT;
    }
  });

  let text = '';
  const positions: CharPosition[] = [];

  const append = (node: Text, offset: number, char: string, length: number) => {
    text += char;
    positions.push({ node, offset, length });
  };

  let previous: Text | null = null;
  let current = walker.nextNode() as Text | null;

  while (current) {
    if (
      previous &&
      needsLineBreak(previous, current) &&
      text.length > 0 &&
      text[text.length - 1] !== ' '
    ) {
      // Synthesized line break, mapped to the end of the previous node.
      append(previous, previous.data.length, ' ', 0);
    }

    for (let i = 0; i < current.data.length; i++) {
      const char = current.data[i];
      if (char === '\u200b') continue;
      if (isWhitespace(char)) {
        if (text.length > 0 && text[text.length - 1] !== ' ') {
          append(current, i, ' ', 1);
        }
      } else {
        append(current, i, char, 1);
      }
    }

    previous = current;
    current = walker.nextNode() as Text | null;
  }

  return { text, positions };
};

/** All whitespace-collapsed occurrences of `quote` inside `root`. */
const findRanges = (root: HTMLElement, quote: string) => {
  const { text, positions } = buildHaystack(root);
  const ranges: Range[] = [];

  let searchFrom = 0;
  while (searchFrom <= text.length - quote.length) {
    const start = text.indexOf(quote, searchFrom);
    if (start === -1) break;

    const from = positions[start];
    const to = positions[start + quote.length - 1];
    const range = document.createRange();
    range.setStart(from.node, from.offset);
    range.setEnd(to.node, to.offset + to.length);
    ranges.push(range);

    searchFrom = start + quote.length;
  }

  return ranges;
};

/** Finds the rendered DOM ranges matching a whitespace-normalized quote. */
export const findQuotedTextRanges = (root: HTMLElement, quote: string) => {
  const needle = normalizeQuote(quote);
  return needle ? findRanges(root, needle) : [];
};

const HIGHLIGHT_BACKGROUND_ALPHA = 0.2;
const HIGHLIGHT_FADE_DURATION_MS = 700;

const getHighlightCss = (alpha: number) => `::highlight(${HIGHLIGHT_NAME}) {
  background-color: hsl(var(--primary) / ${alpha});
}`;

/**
 * The `::highlight()` rule must live in a stylesheet that reaches the
 * highlighted element: the document for the app, the shadow root for the
 * copilot widget.
 */
const ensureHighlightStyle = (element: HTMLElement) => {
  const root = getUIRoot(element);
  const container = root instanceof ShadowRoot ? root : (root as Document).head;
  if (!container) return;

  const existing = container.querySelector<HTMLStyleElement>(
    `#${HIGHLIGHT_STYLE_ID}`
  );
  if (existing) return existing;

  const style = element.ownerDocument.createElement('style');
  style.id = HIGHLIGHT_STYLE_ID;
  style.textContent = getHighlightCss(HIGHLIGHT_BACKGROUND_ALPHA);
  container.appendChild(style);
  return style;
};

let clearTimer: ReturnType<typeof setTimeout> | undefined;
let fadeFrame: number | undefined;

/** Removes any active quote highlight and cancels its auto-clear timer. */
export const clearQuotedTextHighlight = () => {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = undefined;
  }
  if (fadeFrame !== undefined) {
    cancelAnimationFrame(fadeFrame);
    fadeFrame = undefined;
  }
  getHighlightRegistry()?.delete(HIGHLIGHT_NAME);
};

/**
 * Highlights the quoted passage inside `root` with the primary color for
 * a few seconds.
 *
 * `range` (e.g. rebuilt from the offsets stored with the quote) takes
 * precedence and pinpoints the exact occurrence; otherwise every
 * whitespace-insensitive match of `quote` is highlighted.
 *
 * Returns whether the highlight was applied; unsupported browsers and
 * quotes that can no longer be found in the message degrade to a no-op.
 */
export const highlightQuotedText = (
  root: HTMLElement,
  quote: string,
  range?: Range | null,
  durationMs: number = QUOTED_TEXT_HIGHLIGHT_DURATION_MS
) => {
  clearQuotedTextHighlight();

  const Highlight = getHighlightConstructor();
  const registry = getHighlightRegistry();
  if (!Highlight || !registry) return false;

  const ranges =
    range && !range.collapsed ? [range] : findQuotedTextRanges(root, quote);
  if (ranges.length === 0) return false;

  const style = ensureHighlightStyle(root);
  if (!style) return false;

  style.textContent = getHighlightCss(HIGHLIGHT_BACKGROUND_ALPHA);
  registry.set(HIGHLIGHT_NAME, new Highlight(...ranges));

  const fadeDuration = Math.min(HIGHLIGHT_FADE_DURATION_MS, durationMs);
  clearTimer = setTimeout(
    () => {
      clearTimer = undefined;
      const fadeStartedAt = performance.now();

      const fade = (timestamp: number) => {
        const progress =
          fadeDuration === 0
            ? 1
            : Math.min(1, (timestamp - fadeStartedAt) / fadeDuration);
        style.textContent = getHighlightCss(
          HIGHLIGHT_BACKGROUND_ALPHA * (1 - progress)
        );

        if (progress < 1) {
          fadeFrame = requestAnimationFrame(fade);
          return;
        }

        fadeFrame = undefined;
        registry.delete(HIGHLIGHT_NAME);
        style.textContent = getHighlightCss(HIGHLIGHT_BACKGROUND_ALPHA);
      };

      fadeFrame = requestAnimationFrame(fade);
    },
    Math.max(0, durationMs - fadeDuration)
  );

  return true;
};

/** Scrolls to and briefly highlights the exact source of a quote. */
export const scrollToQuotedSelection = (
  quotedSelection: IQuotedSelection,
  anchor?: Node | null
) => {
  if (!quotedSelection.messageId) return false;

  const source = getUIElementById(`step-${quotedSelection.messageId}`, anchor);
  if (!source) return false;

  const sourceContent = source.querySelector<HTMLElement>('.quotable-content');
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
  highlightQuotedText(source, quotedSelection.text, range);
  return true;
};
