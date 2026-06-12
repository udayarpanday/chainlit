import { $insertDataTransferForRichText } from '@lexical/clipboard';
import { createRootEditorSubscription$, realmPlugin } from '@mdxeditor/editor';
import { Cell } from '@mdxeditor/gurx';
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  PASTE_COMMAND
} from 'lexical';

const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/;
const HEADING_RE = /^ {0,3}#{1,6}\s+/;
const LIST_RE = /^ {0,3}(?:[-+*]|\d+[.)])\s+/;
const BLOCKQUOTE_RE = /^ {0,3}>\s?/;
const THEMATIC_BREAK_RE = /^ {0,3}(?:([-*_])(?:\s*\1){2,})\s*$/;
const TABLE_ROW_RE = /^\s*\|.*\|\s*$/;
const TABLE_ALIGN_RE = /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/;
const LINK_DEF_RE = /^ {0,3}\[[^\]]+\]:\s+\S+/;
const FOOTNOTE_DEF_RE = /^ {0,3}\[\^[^\]]+\]:\s+/;
const INDENTED_CODE_RE = /^(?:\t| {4,})\S?/;
const SETEXT_UNDERLINE_RE = /^ {0,3}(?:=+|-+)\s*$/;
const DIRECTIVE_RE = /^ {0,3}(?:::|import\s|export\s)/;
const HTML_BLOCK_RE = /^\s*<\/?[A-Za-z][^>]*>\s*$/;

export const pasteNormalizerEnabled$ = Cell<boolean>(true);

const INLINE_ONLY_TAGS = new Set([
  'A',
  'ABBR',
  'B',
  'BDI',
  'BDO',
  'BR',
  'CITE',
  'CODE',
  'DATA',
  'DEL',
  'EM',
  'I',
  'IMG',
  'INS',
  'KBD',
  'MARK',
  'Q',
  'S',
  'SAMP',
  'SMALL',
  'SPAN',
  'STRONG',
  'SUB',
  'SUP',
  'TIME',
  'TT',
  'U',
  'VAR'
]);

function stripClipboardNoise(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/\u00A0/g, ' ')
    .replace(/\u00AD/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '');
}

function trimTrailingWhitespacePerLine(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n');
}

function collapseExcessBlankLines(text: string): string {
  return text.replace(/\n{3,}/g, '\n\n');
}

function isMarkdownStructuralLine(line: string): boolean {
  return (
    FENCE_RE.test(line) ||
    HEADING_RE.test(line) ||
    LIST_RE.test(line) ||
    BLOCKQUOTE_RE.test(line) ||
    THEMATIC_BREAK_RE.test(line) ||
    TABLE_ROW_RE.test(line) ||
    TABLE_ALIGN_RE.test(line) ||
    LINK_DEF_RE.test(line) ||
    FOOTNOTE_DEF_RE.test(line) ||
    INDENTED_CODE_RE.test(line) ||
    SETEXT_UNDERLINE_RE.test(line) ||
    DIRECTIVE_RE.test(line) ||
    HTML_BLOCK_RE.test(line.trim())
  );
}

function shouldUnwrapParagraph(lines: string[]): boolean {
  if (lines.length < 2) {
    return false;
  }

  const visibleLines = lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (visibleLines.length < 2) {
    return false;
  }

  const lengths = visibleLines.map((line) => line.length);
  const averageLength =
    lengths.reduce((total, length) => total + length, 0) / lengths.length;
  const mediumLines = lengths.filter((length) => length >= 35).length;
  const longLines = lengths.filter((length) => length >= 60).length;
  const allShort = lengths.every((length) => length < 30);
  const looksLikeLabel =
    visibleLines[0].endsWith(':') &&
    averageLength < 50 &&
    visibleLines.length <= 3;
  const hasStrongContinuation = visibleLines.some((line, index) => {
    if (index === 0) {
      return false;
    }

    const previousLine = visibleLines[index - 1];
    return (
      (/[A-Za-z]-$/.test(previousLine) && /^[a-z]/.test(line)) ||
      /^[,.;:!?%)\]}]/.test(line)
    );
  });

  if (hasStrongContinuation) {
    return true;
  }

  if (looksLikeLabel) {
    return false;
  }

  if (allShort && visibleLines.length <= 3) {
    return false;
  }

  if (visibleLines.length >= 3) {
    return averageLength >= 25 || mediumLines >= 2;
  }

  return longLines >= 1 || mediumLines === 2;
}

function joinWrappedLines(lines: string[]): string {
  return lines.reduce((paragraph, rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      return paragraph;
    }

    if (index === 0 || paragraph.length === 0) {
      return line;
    }

    if (/[A-Za-z]-$/.test(paragraph) && /^[a-z]/.test(line)) {
      return `${paragraph.slice(0, -1)}${line}`;
    }

    if (/^[,.;:!?%)\]}]/.test(line)) {
      return `${paragraph}${line}`;
    }

    return `${paragraph} ${line}`;
  }, '');
}

function normalizeParagraphBuffer(lines: string[]): string[] {
  const trimmedLines = lines.map((line) => line.trim());
  if (!shouldUnwrapParagraph(trimmedLines)) {
    return trimmedLines;
  }
  return [joinWrappedLines(trimmedLines)];
}

function unwrapMarkdownParagraphs(text: string): string {
  const output: string[] = [];
  let paragraphBuffer: string[] = [];
  let activeFence: string | null = null;

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) {
      return;
    }
    output.push(...normalizeParagraphBuffer(paragraphBuffer));
    paragraphBuffer = [];
  };

  for (const line of text.split('\n')) {
    const fenceMatch = line.match(FENCE_RE);
    if (fenceMatch) {
      flushParagraph();
      output.push(line);

      const fenceToken = fenceMatch[1];
      if (!activeFence) {
        activeFence = fenceToken[0].repeat(fenceToken.length);
      } else if (
        activeFence[0] === fenceToken[0] &&
        fenceToken.length >= activeFence.length
      ) {
        activeFence = null;
      }
      continue;
    }

    if (activeFence) {
      output.push(line);
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      if (output[output.length - 1] !== '') {
        output.push('');
      }
      continue;
    }

    if (isMarkdownStructuralLine(line)) {
      flushParagraph();
      output.push(line);
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  return collapseExcessBlankLines(output.join('\n'));
}

function getFirstTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node as Text;
  }

  for (const child of Array.from(node.childNodes)) {
    const textNode = getFirstTextNode(child);
    if (textNode) {
      return textNode;
    }
  }

  return null;
}

function getLastTextNode(node: Node): Text | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return node as Text;
  }

  const children = Array.from(node.childNodes);
  for (let index = children.length - 1; index >= 0; index -= 1) {
    const textNode = getLastTextNode(children[index]);
    if (textNode) {
      return textNode;
    }
  }

  return null;
}

function trimLeadingWhitespace(node: Node): void {
  const firstTextNode = getFirstTextNode(node);
  if (firstTextNode?.textContent) {
    firstTextNode.textContent = firstTextNode.textContent.replace(/^\s+/g, '');
  }
}

function trimTrailingWhitespace(node: Node): void {
  const lastTextNode = getLastTextNode(node);
  if (lastTextNode?.textContent) {
    lastTextNode.textContent = lastTextNode.textContent.replace(/\s+$/g, '');
  }
}

function getNormalizedTextContent(node: Node): string {
  return trimTrailingWhitespacePerLine(
    stripClipboardNoise(node.textContent ?? '')
  ).trim();
}

function isSimpleTextBlock(element: Element): boolean {
  if (!['P', 'DIV'].includes(element.tagName)) {
    return false;
  }

  if (getNormalizedTextContent(element).length === 0) {
    return false;
  }

  return Array.from(element.children).every((child) =>
    INLINE_ONLY_TAGS.has(child.tagName)
  );
}

function joinHtmlBlocks(target: Element, source: Element): void {
  trimTrailingWhitespace(target);
  trimLeadingWhitespace(source);

  const lastTextNode = getLastTextNode(target);
  const firstTextNode = getFirstTextNode(source);
  const targetEndsWithHyphen = /[A-Za-z]-$/.test(
    lastTextNode?.textContent ?? ''
  );
  const sourceStartsWithLowercase = /^[a-z]/.test(
    firstTextNode?.textContent ?? ''
  );

  if (targetEndsWithHyphen && sourceStartsWithLowercase && lastTextNode) {
    lastTextNode.textContent = lastTextNode.textContent?.slice(0, -1) ?? '';
  } else {
    const sourceStartsWithPunctuation = /^[,.;:!?%)\]}]/.test(
      firstTextNode?.textContent ?? ''
    );
    if (!sourceStartsWithPunctuation) {
      target.appendChild(target.ownerDocument.createTextNode(' '));
    }
  }

  while (source.firstChild) {
    target.appendChild(source.firstChild);
  }
}

function normalizeWrappedHtmlBlocks(container: ParentNode): void {
  const directChildElements = Array.from(container.childNodes).filter(
    (node): node is Element => node.nodeType === Node.ELEMENT_NODE
  );

  let run: Element[] = [];

  const flushRun = () => {
    if (run.length < 2) {
      run = [];
      return;
    }

    const lines = run.map((element) => getNormalizedTextContent(element));
    if (!shouldUnwrapParagraph(lines)) {
      run = [];
      return;
    }

    const [target, ...sources] = run;
    for (const source of sources) {
      joinHtmlBlocks(target, source);
      source.remove();
    }

    run = [];
  };

  for (const child of directChildElements) {
    if (isSimpleTextBlock(child)) {
      run.push(child);
    } else {
      flushRun();
      normalizeWrappedHtmlBlocks(child);
    }
  }

  flushRun();
}

export function normalizePastedText(text: string): string {
  if (!text) return text;

  return collapseExcessBlankLines(
    unwrapMarkdownParagraphs(
      trimTrailingWhitespacePerLine(stripClipboardNoise(text))
    )
  );
}

export function normalizePastedHtml(html: string): string {
  if (!html || typeof DOMParser === 'undefined') return html;

  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const body = doc.body;
    if (!body) return html;

    const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
    let node: Node | null = walker.nextNode();
    while (node) {
      const original = node.textContent ?? '';
      const cleaned = stripClipboardNoise(original);
      if (cleaned !== original) {
        node.textContent = cleaned;
      }
      node = walker.nextNode();
    }

    const isEmptyBlock = (element: Element): boolean => {
      const textContent = getNormalizedTextContent(element);
      if (textContent.length > 0) {
        return false;
      }

      return Array.from(element.children).every(
        (child) => child.tagName === 'BR' || isEmptyBlock(child)
      );
    };

    let changed = true;
    let guard = 0;
    while (changed && guard < 5) {
      changed = false;
      guard += 1;

      const blocks = Array.from(body.querySelectorAll('p, div'));
      for (const block of blocks) {
        if (!isEmptyBlock(block)) {
          continue;
        }

        const previousSibling = block.previousElementSibling;
        if (previousSibling && isEmptyBlock(previousSibling)) {
          block.remove();
          changed = true;
        }
      }
    }

    normalizeWrappedHtmlBlocks(body);

    return body.innerHTML;
  } catch {
    return html;
  }
}

export const pasteNormalizerPlugin = realmPlugin({
  init: (realm) => {
    realm.pub(createRootEditorSubscription$, (editor) => {
      return editor.registerCommand(
        PASTE_COMMAND,
        (event) => {
          if (!(event instanceof ClipboardEvent)) return false;

          const clipboard = event.clipboardData;
          if (!clipboard) return false;

          if (!realm.getValue(pasteNormalizerEnabled$)) {
            return false;
          }

          const text = clipboard.getData('text/plain');
          const html = clipboard.getData('text/html');

          if (!text && !html) return false;

          const cleanedText = text ? normalizePastedText(text) : '';
          const cleanedHtml = html ? normalizePastedHtml(html) : '';
          const textUnchanged = cleanedText === text;
          const htmlUnchanged = cleanedHtml === html;

          if (textUnchanged && htmlUnchanged) {
            return false;
          }

          const preferCleanedText = Boolean(text && html && !textUnchanged);

          let dataTransfer: DataTransfer;
          try {
            dataTransfer = new DataTransfer();
          } catch {
            return false;
          }

          if (cleanedText) {
            dataTransfer.setData('text/plain', cleanedText);
          }
          if (cleanedHtml && !preferCleanedText) {
            dataTransfer.setData('text/html', cleanedHtml);
          }

          event.preventDefault();

          editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
              $insertDataTransferForRichText(dataTransfer, selection, editor);
            }
          });

          return true;
        },
        COMMAND_PRIORITY_CRITICAL
      );
    });
  }
});
