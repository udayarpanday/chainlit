import { useMemo, useState } from 'react';

import { htmlPreviewDocument } from '../../../lib/htmlPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import CodePreview from './CodePreview';
import { usePreviewSettings, useRememberScroll } from './PreviewSession';

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

export default function HtmlPreview({ data }: { data: ArrayBuffer }) {
  const [saved, save] = usePreviewSettings('html', { tab: 'preview' });
  const source = useMemo(() => htmlPreviewDocument(data), [data]);
  return (
    <Tabs
      defaultValue={saved.tab === 'source' ? 'source' : 'preview'}
      onValueChange={(tab) => save({ tab })}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      <div className="shrink-0 border-b px-3 py-1">
        <TabsList className="h-8" aria-label="HTML view">
          <TabsTrigger value="preview" className="py-1 text-xs">
            Preview
          </TabsTrigger>
          <TabsTrigger value="source" className="py-1 text-xs">
            Source
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent
        value="preview"
        className="m-0 min-h-0 flex-1 data-[state=active]:flex"
      >
        <HtmlFrame source={source} />
      </TabsContent>
      <TabsContent
        value="source"
        className="m-0 min-h-0 flex-1 data-[state=active]:flex"
      >
        <CodePreview data={data} name="document.html" />
      </TabsContent>
    </Tabs>
  );
}
