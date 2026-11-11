import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import markdownStyles from './MarkdownPreview.css?raw';

import { decodeSource } from '../../../lib/codePreview';
import MessageLink from '../../MessageLink';
import { useRememberScroll } from './PreviewSession';
import PreviewTabs from './PreviewTabs';

function MarkdownBody({ data }: { data: ArrayBuffer }) {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const source = useMemo(() => {
    try {
      return { ...decodeSource(data), error: undefined };
    } catch (error) {
      return { text: '', truncated: false, error: (error as Error).message };
    }
  }, [data]);
  useRememberScroll('markdown-scroll', root, !source.error);
  if (source.error)
    return (
      <p role="alert" className="p-4 text-sm">
        {source.error}
      </p>
    );
  return (
    <article
      ref={setRoot}
      aria-label="Markdown preview"
      tabIndex={0}
      className="markdown-document min-h-0 min-w-0 flex-1 overflow-auto bg-background p-6 text-foreground"
    >
      <style>{markdownStyles}</style>
      {source.truncated && (
        <p role="status" className="text-sm text-muted-foreground">
          Showing up to 1 MB or 10,000 lines. Download the original for the
          complete file.
        </p>
      )}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ node, ...props }) => (
            <MessageLink
              {...props}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
            />
          ),
          img: ({ node, ...props }) => (
            <img {...props} loading="lazy" referrerPolicy="no-referrer" />
          )
        }}
      >
        {source.text}
      </ReactMarkdown>
    </article>
  );
}

export default function MarkdownPreview({
  data,
  name = 'document.md',
  headerControls
}: {
  data: ArrayBuffer;
  name?: string;
  headerControls?: HTMLElement | null;
}) {
  return (
    <PreviewTabs
      data={data}
      name={name}
      section="markdown"
      label="Markdown"
      headerControls={headerControls}
    >
      <MarkdownBody data={data} />
    </PreviewTabs>
  );
}
