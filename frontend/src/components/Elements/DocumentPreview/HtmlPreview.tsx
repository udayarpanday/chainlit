import { useMemo, useState } from 'react';

import { htmlPreviewDocument } from '../../../lib/htmlPreview';
import { useRememberScroll } from './PreviewSession';
import PreviewTabs from './PreviewTabs';

function HtmlFrame({ source }: { source: string }) {
  const [root, setRoot] = useState<Element | null>(null);
  useRememberScroll('html-scroll', root);
  return (
    <iframe
      title="HTML preview"
      className="min-h-0 w-full flex-1 border-0 bg-white"
      sandbox="allow-same-origin"
      referrerPolicy="no-referrer"
      srcDoc={source}
      onLoad={(event) =>
        setRoot(event.currentTarget.contentDocument?.scrollingElement || null)
      }
    />
  );
}

export default function HtmlPreview({
  data,
  headerControls
}: {
  data: ArrayBuffer;
  headerControls?: HTMLElement | null;
}) {
  const source = useMemo(() => htmlPreviewDocument(data), [data]);
  return (
    <PreviewTabs
      data={data}
      name="document.html"
      section="html"
      label="HTML"
      headerControls={headerControls}
    >
      <HtmlFrame source={source} />
    </PreviewTabs>
  );
}
