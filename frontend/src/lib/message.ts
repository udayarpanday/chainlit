import { fromMarkdown } from 'mdast-util-from-markdown';

import type { IMessageElement } from 'client-types/';

const isForIdMatch = (id: string | number | undefined, forId: string) => {
  if (!forId || !id) {
    return false;
  }

  return forId === id.toString();
};

const escapeRegExp = (string?: string) => {
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#escaping
  return (string ?? '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

function escapeBrackets(text?: string) {
  const pattern =
    /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)|(\${1})/g;
  const res = (text ?? '').replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket, dollarSign) => {
      if (codeBlock) {
        return codeBlock;
      } else if (squareBracket) {
        return `$$\n${squareBracket}\n$$`;
      } else if (roundBracket) {
        return `$${roundBracket}$`;
      } else if (dollarSign) {
        return '\\$';
      }
      return match;
    }
  );
  return res;
}

export const prepareContent = ({
  elements,
  content,
  id,
  language
}: {
  elements: IMessageElement[];
  content?: string;
  id: string;
  language?: string;
}) => {
  const elementNames = elements
    .map((e) => escapeRegExp(e.name))
    .filter(Boolean);

  // Sort by descending length to avoid matching substrings
  elementNames.sort((a, b) => b.length - a.length);

  const elementRegexp = elementNames.length
    ? new RegExp(`(${elementNames.join('|')})`, 'g')
    : undefined;

  let preparedContent = content ? content.trim() : '';
  preparedContent = escapeBrackets(preparedContent);
  const inlinedElements = elements.filter(
    (e) => isForIdMatch(id, e?.forId) && e.display === 'inline'
  );
  const refElements: IMessageElement[] = [];

  if (elementRegexp) {
    const protectedRanges: {
      start: number;
      end: number;
      reference: boolean;
    }[] = [];
    const protect = (node: any) => {
      if (
        [
          'link',
          'linkReference',
          'image',
          'imageReference',
          'definition',
          'code',
          'inlineCode'
        ].includes(node.type) &&
        node.position
      ) {
        protectedRanges.push({
          start: node.position.start.offset,
          end: node.position.end.offset,
          reference: ['link', 'linkReference'].includes(node.type)
        });
        return;
      }
      node.children?.forEach(protect);
    };
    protect(fromMarkdown(preparedContent));
    preparedContent = preparedContent.replaceAll(
      elementRegexp,
      (match, _capture, offset: number) => {
        const element = elements.find((e) => {
          const nameMatch = e.name === match;
          const scopeMatch = isForIdMatch(id, e?.forId);
          return nameMatch && scopeMatch;
        });
        const foundElement = !!element;

        const inlined = element?.display === 'inline';
        const protectedRange = protectedRanges.find(
          (range) => offset >= range.start && offset < range.end
        );
        if (protectedRange) {
          if (
            element &&
            !inlined &&
            protectedRange.reference &&
            !refElements.includes(element)
          )
            refElements.push(element);
          return match;
        }
        if (!foundElement) {
          // Element reference does not exist, return plain text
          return match;
        } else if (inlined) {
          // If element is inlined, add it to the list and return plain text
          if (inlinedElements.indexOf(element) === -1) {
            inlinedElements.push(element);
          }
          return match;
        } else {
          // Element is a reference, add it to the list and return link
          refElements.push(element);
          // spaces break markdown links. The address in the link is not used anyway
          return `[${match}](${match.replaceAll(' ', '_')})`;
        }
      }
    );
  }

  if (language && preparedContent) {
    const prefix = `\`\`\`${language}`;
    const suffix = '```';
    if (!preparedContent.startsWith('```')) {
      preparedContent = `${prefix}\n${preparedContent}\n${suffix}`;
    }
  }
  return {
    preparedContent,
    inlinedElements,
    refElements
  };
};
