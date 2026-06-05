import {
  useEffect,
  useMemo,
} from 'react';

import useEvoyaCreator from '@/hooks/useEvoyaCreator';
import MarkdownEditor from './markdownEditor';

import CreatorHeader from './CreatorHeader';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@chainlit/app/src/components/ui/resizable";
import {
  Dialog,
  DialogContent,
} from '@chainlit/app/src/components/ui/dialog';
import CreatorChat from './CreatorChat';

export default function CreatorFrame() {
  const {
    active,
    closeCreatorOverlay,
    creatorType,
    openCreatorWithContent,
    openCreatorWithFile,
  } = useEvoyaCreator();

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.openEvoyaCreator = openCreatorWithContent;
    // @ts-expect-error is not a valid prop
    window.openEvoyaCreatorWithFile = openCreatorWithFile;
  }, [openCreatorWithContent, openCreatorWithFile]);

  const CreatorRenderer = useMemo(() => {
    switch(creatorType.toLowerCase()) {
      default:
      case 'markdown':
        return <MarkdownEditor />
      case 'vega':
        return <MarkdownEditor />
    }
  }, [creatorType]);

  return (
    <Dialog
      open={active}
      onOpenChange={() => closeCreatorOverlay()}
    >
      <DialogContent
        className="z-[9999] h-full p-0 overflow-hidden border-0"
        style={{
          maxHeight: 'calc(100% - 1rem)',
          maxWidth: 'calc(100% - 1rem)',
        }}
        // @ts-expect-error is not a valid prop
        container={window.mdx_shadowRootElement}
      >
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="creator-panel-sizes"
        >
          <ResizablePanel defaultValue={50}>
            <CreatorChat />
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultValue={50}>
            <div className="overflow-hidden h-full flex flex-col">
              <CreatorHeader />
              {CreatorRenderer}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </DialogContent>
    </Dialog>
  )
}