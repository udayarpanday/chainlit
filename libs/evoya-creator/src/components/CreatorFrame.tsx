import {
  useEffect,
  useMemo,
  useContext,
} from 'react';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@chainlit/app/src/components/ui/resizable';
import { cn } from '@chainlit/app/src/lib/utils';
import { WidgetContext } from '@/context';

import useEvoyaCreator from '@/hooks/useEvoyaCreator';

import CreatorChat from './CreatorChat';
import CreatorHeader from './CreatorHeader';
import MarkdownEditor from './markdownEditor';

export default function CreatorFrame() {
  const {
    active,
    closeCreatorOverlay,
    creatorType,
    openCreatorWithContent,
    openCreatorWithFile,
  } = useEvoyaCreator();
  const { config } = useContext(WidgetContext);

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.openEvoyaCreator = openCreatorWithContent;
    // @ts-expect-error is not a valid prop
    window.openEvoyaCreatorWithFile = openCreatorWithFile;
  }, [openCreatorWithContent, openCreatorWithFile]);

  useEffect(() => {
    if (config?.fileName) {
      openCreatorWithFile({ path: config.fileName }, { type: 'markdown' });
    }
  }, []);

  const CreatorRenderer = useMemo(() => {
    switch (creatorType.toLowerCase()) {
      default:
      case 'markdown':
        return <MarkdownEditor />;
      case 'vega':
        return <MarkdownEditor />;
    }
  }, [creatorType]);

  if (!active) return null;

  return (
    <div className="overflow-hidden h-full flex flex-col">
      {/* <CreatorHeader /> */}
      {CreatorRenderer}
    </div>
  );

  return (
    <div
      className={cn(
        'fixed top-0 left-0 bottom-0 right-0 z-[9999] p-2 transition-colors',
        active
          ? 'bg-black/50 visible'
          : 'bg-transparent invisible pointer-events-none'
      )}
    >
      <div
        className={cn(
          'bg-background rounded-md w-full h-full overflow-hidden transition-transform',
          active ? 'scale-100' : 'scale-90'
        )}
      >
        {active && (
          <ResizablePanelGroup
            direction="horizontal"
            autoSaveId="creator-panel-sizes"
          >
            <ResizablePanel defaultSize={50} minSize={25}>
              <CreatorChat />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="overflow-hidden h-full flex flex-col">
                <CreatorHeader />
                {CreatorRenderer}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
