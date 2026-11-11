import { type ReactNode, useContext, useEffect, useLayoutEffect } from 'react';
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
import { useDocumentPreviewExpansion } from '@chainlit/app/src/hooks/useDocumentPreviewExpansion';
import { isDocumentPreviewRequest } from '@chainlit/app/src/lib/documentPreviewBridge';
import {
  evoyaCreatorEnabledState,
  sideViewState
} from '@chainlit/react-client';

import { useDashboardPreviewLayout } from '../hooks/useDashboardPreviewLayout';

import { documentPreviewDockedState } from '../state/documentPreview';

import { WidgetContext } from '../context';

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
  const { evoya } = useContext(WidgetContext);

  useDashboardPreviewLayout(
    evoya?.type === 'dashboard' ? evoya.container : null,
    isDocument && !creatorEnabled
  );

  const docked = !!sideView && isDocument && !creatorEnabled && !isMobile;
  const sheet = !!sideView && !creatorEnabled && (!isDocument || isMobile);
  const { groupRef, expanded, toggleExpanded } = useDocumentPreviewExpansion(
    isDocument && !creatorEnabled,
    docked
  );

  useLayoutEffect(() => setDocked(docked), [docked, setDocked]);

  useEffect(() => {
    if (creatorEnabled && sideView) setSideView(undefined);
  }, [creatorEnabled, sideView, setSideView]);
  useEffect(() => () => setDocked(false), [setDocked]);

  return (
    <>
      <ResizablePanelGroup
        ref={groupRef}
        direction="horizontal"
        className="h-full min-h-0 min-w-0 w-full"
      >
        <ResizablePanel
          id="copilot-chat"
          order={1}
          minSize={expanded ? 0 : 25}
          defaultSize={docked ? 38 : 100}
          className="min-h-0 min-w-0"
        >
          <div
            aria-label="Chat conversation"
            className="flex h-full min-h-0 min-w-0 flex-col"
            aria-hidden={expanded || undefined}
            {...{ inert: expanded ? '' : undefined }}
          >
            {children}
          </div>
        </ResizablePanel>
        {docked && (
          <>
            <ResizableHandle
              disabled={expanded}
              className={expanded ? 'hidden' : 'border-0 bg-border/60'}
            />
            <ResizablePanel
              id="copilot-document"
              order={2}
              minSize={40}
              defaultSize={62}
              maxSize={expanded ? 100 : 75}
              className="flex min-h-0 min-w-0 flex-col overflow-hidden"
            >
              <aside
                aria-label="Document side panel"
                className="flex h-full min-h-0 min-w-0 flex-col border-l border-border/60 bg-background"
              >
                <DocumentPreview
                  elements={sideView!.elements}
                  onClose={() => setSideView(undefined)}
                  expanded={expanded}
                  onToggleExpanded={toggleExpanded}
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
                ? 'flex min-h-0 min-w-0 w-full flex-col gap-0 overflow-hidden p-0 [&>button]:hidden'
                : 'flex flex-col'
            }
          >
            <SheetHeader className={isDocument ? 'sr-only' : undefined}>
              <SheetTitle>{sideView!.title}</SheetTitle>
            </SheetHeader>
            <div
              className={
                isDocument
                  ? 'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'
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
