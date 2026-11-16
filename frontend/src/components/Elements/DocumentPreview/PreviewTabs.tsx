import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import CodePreview from './CodePreview';
import { usePreviewSettings } from './PreviewSession';

export default function PreviewTabs({
  data,
  name,
  section,
  label,
  headerControls,
  children
}: {
  data: ArrayBuffer;
  name: string;
  section: 'html' | 'markdown';
  label: string;
  headerControls?: HTMLElement | null;
  children: ReactNode;
}) {
  const [saved, save] = usePreviewSettings(section, { tab: 'preview' });
  const tabs = (
    <TabsList className="h-8" aria-label={`${label} view`}>
      <TabsTrigger value="preview" className="py-1 text-xs">
        Preview
      </TabsTrigger>
      <TabsTrigger value="source" className="py-1 text-xs">
        Source
      </TabsTrigger>
    </TabsList>
  );
  return (
    <Tabs
      defaultValue={saved.tab === 'source' ? 'source' : 'preview'}
      onValueChange={(tab) => save({ tab })}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      {headerControls ? (
        createPortal(tabs, headerControls)
      ) : (
        <div className="shrink-0 border-b px-3 py-1">{tabs}</div>
      )}
      <TabsContent
        value="preview"
        className="m-0 min-h-0 min-w-0 flex-1 overflow-hidden data-[state=active]:flex"
      >
        {children}
      </TabsContent>
      <TabsContent
        value="source"
        className="m-0 min-h-0 min-w-0 flex-1 overflow-hidden data-[state=active]:flex"
      >
        <CodePreview
          data={data}
          name={name}
          mime={section === 'markdown' ? 'text/markdown' : 'text/html'}
        />
      </TabsContent>
    </Tabs>
  );
}
