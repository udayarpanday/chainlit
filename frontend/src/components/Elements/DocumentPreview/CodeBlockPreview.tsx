import { useMemo } from 'react';

import type { CodeBlockSource } from '../../../lib/codeBlockPreview';
import CodePreview from './CodePreview';
import HtmlPreview from './HtmlPreview';
import MarkdownPreview from './MarkdownPreview';

export default function CodeBlockPreview({
  source,
  language,
  kind,
  name,
  headerControls
}: CodeBlockSource & { name: string; headerControls: HTMLElement | null }) {
  const data = useMemo(() => new TextEncoder().encode(source).buffer, [source]);
  return kind === 'html' ? (
    <HtmlPreview data={data} headerControls={headerControls} />
  ) : kind === 'markdown' ? (
    <MarkdownPreview data={data} name={name} headerControls={headerControls} />
  ) : (
    <CodePreview data={data} name={name} language={language} />
  );
}
