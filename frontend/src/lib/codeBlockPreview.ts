import type { ICustomElement, IMessageElement } from '@chainlit/react-client';

import { codeBlockFileInfo } from './codePreview';

export interface CodeBlockSource {
  source: string;
  language: string;
  kind: 'html' | 'markdown' | 'code';
}

export function codeBlockElement(
  id: string,
  source: string,
  language = ''
): ICustomElement {
  const info = codeBlockFileInfo(language);
  const kind = /^(html|htm)$/i.test(language.trim())
    ? 'html'
    : info.language === 'markdown'
      ? 'markdown'
      : 'code';
  return {
    id,
    type: 'custom',
    name: `snippet.${info.extension || 'txt'}`,
    mime:
      kind === 'html'
        ? 'text/html'
        : kind === 'markdown'
          ? 'text/markdown'
          : 'text/plain',
    display: 'side',
    forId: '',
    props: { preview: 'code-block', source, language: info.language, kind }
  };
}

export function getCodeBlockSource(
  element?: IMessageElement
): CodeBlockSource | undefined {
  if (
    element?.type !== 'custom' ||
    element.props?.preview !== 'code-block' ||
    typeof element.props.source !== 'string' ||
    typeof element.props.language !== 'string' ||
    (element.props.kind !== 'html' &&
      element.props.kind !== 'markdown' &&
      element.props.kind !== 'code')
  )
    return;
  return {
    source: element.props.source,
    language: element.props.language,
    kind: element.props.kind
  };
}
