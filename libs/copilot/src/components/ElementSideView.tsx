import { type ReactNode, useEffect, useLayoutEffect } from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import { Element } from '@chainlit/app/src/components/Elements';
import DocumentPreview from '@chainlit/app/src/components/Elements/DocumentPreview';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from '@chainlit/app/src/components/ui/resizable';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@chainlit/app/src/components/ui/sheet';
import { useIsMobile } from '@chainlit/app/src/hooks/use-mobile';
import { isDocumentPreviewRequest } from '@chainlit/app/src/lib/documentPreviewBridge';
import {
  evoyaCreatorEnabledState,
  sideViewState
} from '@chainlit/react-client';

import { documentPreviewDockedState } from '../state/documentPreview';

export default function ElementSideView({
  children
}: {
  children?: ReactNode;
}) {
  const [sideView, setSideView] = useRecoilState(sideViewState);
  const creatorEnabled = useRecoilValue(evoyaCreatorEnabledState);
  const isDocument = isDocumentPreviewRequest(sideView);
  const isMobile = useIsMobile();
  const setDocked = useSetRecoilState(documentPreviewDockedState);

  const docked = !!sideView && isDocument && !creatorEnabled && !isMobile;
  const sheet = !!sideView && !creatorEnabled && (!isDocument || isMobile);

  useLayoutEffect(() => setDocked(docked), [docked, setDocked]);

  useEffect(() => {
    if (creatorEnabled && sideView) setSideView(undefined);
  }, [creatorEnabled, sideView, setSideView]);
  useEffect(() => () => setDocked(false), [setDocked]);

  return (
    <>
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full min-h-0 w-full"
      >
        <ResizablePanel
          id="copilot-chat"
          order={1}
          minSize={25}
          defaultSize={docked ? 38 : 100}
          className="min-h-0 min-w-0"
        >
          <div
            aria-label="Chat conversation"
            className="flex h-full min-h-0 min-w-0 flex-col"
          >
            {children}
          </div>
        </ResizablePanel>
        {docked && (
          <>
            <ResizableHandle className="border-0 bg-border/60" />
            <ResizablePanel
              id="copilot-document"
              order={2}
              minSize={40}
              defaultSize={62}
              maxSize={75}
              className="flex min-h-0 min-w-0 flex-col overflow-hidden"
            >
              <aside
                aria-label="Document side panel"
                className="flex h-full min-h-0 min-w-0 flex-col border-l border-border/60 bg-background"
              >
                <DocumentPreview
                  elements={sideView!.elements}
                  onClose={() => setSideView(undefined)}
                />
              </aside>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
      {sheet && (
        <Sheet open onOpenChange={(open) => !open && setSideView(undefined)}>
          <SheetContent
            side={isDocument ? 'right' : 'left'}
            className={
              isDocument
                ? 'flex w-full flex-col gap-0 p-0 [&>button]:hidden'
                : 'flex flex-col'
            }
          >
            <SheetHeader className={isDocument ? 'sr-only' : undefined}>
              <SheetTitle>{sideView!.title}</SheetTitle>
            </SheetHeader>
            <div
              className={
                isDocument
                  ? 'flex min-h-0 flex-1 flex-col overflow-auto'
                  : 'mt-4 overflow-y-auto flex-grow flex flex-col gap-4'
              }
            >
              {isDocument ? (
                <DocumentPreview
                  elements={sideView!.elements}
                  onClose={() => setSideView(undefined)}
                />
              ) : (
                sideView!.elements.map((e) => (
                  <Element key={e.id} element={e} />
                ))
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
