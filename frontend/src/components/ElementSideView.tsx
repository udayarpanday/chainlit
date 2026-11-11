import { isDocumentPreviewRequest } from '@/lib/documentPreviewBridge';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import {
  evoyaCreatorEnabledState,
  sideViewState
} from '@chainlit/react-client';

import { Card, CardContent } from '@/components/ui/card';
import { ResizableHandle, ResizablePanel } from '@/components/ui/resizable';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';

import { useIsMobile } from '@/hooks/use-mobile';

import { Element } from './Elements';
import DocumentPreview from './Elements/DocumentPreview';
import { Button } from './ui/button';

export default function ElementSideView({
  expanded = false,
  onToggleExpanded
}: {
  expanded?: boolean;
  onToggleExpanded?: () => void;
}) {
  const [sideView, setSideView] = useRecoilState(sideViewState);
  const creatorEnabled = useRecoilValue(evoyaCreatorEnabledState);
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);

  const isCanvas = sideView?.title === 'canvas';
  const isDocument = isDocumentPreviewRequest(sideView);
  useEffect(() => {
    if (creatorEnabled && sideView) setSideView(undefined);
  }, [creatorEnabled, sideView, setSideView]);
  const content = isDocument ? (
    <DocumentPreview
      elements={sideView!.elements}
      onClose={() => setSideView(undefined)}
      expanded={expanded}
      onToggleExpanded={isMobile ? undefined : onToggleExpanded}
    />
  ) : (
    sideView?.elements.map((element) => (
      <Element key={element.id} element={element} />
    ))
  );

  useEffect(() => {
    if (sideView) {
      // Delay setting visibility to trigger animation
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
  }, [sideView]);

  if (!sideView || creatorEnabled) return null;

  if (isDocument) {
    const preview = (
      <aside
        aria-label="Document side panel"
        className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
      >
        {content}
      </aside>
    );
    if (isMobile)
      return (
        <Sheet open onOpenChange={(open) => !open && setSideView(undefined)}>
          <SheetContent className="flex min-h-0 min-w-0 w-full flex-col gap-0 overflow-hidden p-0 [&>button]:hidden">
            <SheetHeader className="sr-only">
              <SheetTitle>{sideView.title}</SheetTitle>
            </SheetHeader>
            {preview}
          </SheetContent>
        </Sheet>
      );
    return (
      <>
        <ResizableHandle
          disabled={expanded}
          className={cn('border-0 bg-border/60', expanded && 'hidden')}
        />
        <ResizablePanel
          id="document-preview"
          order={2}
          minSize={40}
          defaultSize={62}
          maxSize={expanded ? 100 : 75}
          className="flex min-h-0 min-w-0 flex-col overflow-hidden"
        >
          {preview}
        </ResizablePanel>
      </>
    );
  }

  if (isMobile) {
    return (
      <Sheet open onOpenChange={(open) => !open && setSideView(undefined)}>
        <SheetContent
          className={cn('md:hidden flex flex-col', isCanvas && 'p-0')}
        >
          {!isCanvas ? (
            <SheetHeader>
              <SheetTitle id="side-view-title">{sideView.title}</SheetTitle>
            </SheetHeader>
          ) : null}
          <div
            id="side-view-content"
            className={cn(
              'overflow-auto flex-grow min-h-0 flex flex-col',
              isCanvas || isDocument ? 'p-0' : 'gap-4 mt-4'
            )}
          >
            {content}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <ResizableHandle className="sm:hidden md:block bg-transparent" />
      <ResizablePanel
        minSize={isCanvas || isDocument ? 30 : 10}
        defaultSize={isCanvas ? 50 : 40}
        className={`md:flex flex-col flex-grow sm:hidden transform transition-transform duration-300 ease-in-out ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <aside
          aria-label={isDocument ? 'Document side panel' : 'Side panel'}
          className="relative flex-grow min-h-0 overflow-auto mr-4 mb-4"
        >
          <Card className="overflow-auto h-full relative flex flex-col">
            <div
              id="side-view-title"
              className={cn(
                'text-lg font-semibold text-foreground px-6 py-4 flex items-center',
                isCanvas && 'absolute top-0 z-10 bg-transparent'
              )}
            >
              <Button
                className="-ml-2"
                onClick={() => setSideView(undefined)}
                aria-label="Close preview"
                size="icon"
                variant={isCanvas ? 'default' : 'ghost'}
              >
                <ArrowLeft />
              </Button>
              {isCanvas ? null : sideView.title}
            </div>
            <CardContent
              id="side-view-content"
              className={cn(
                'flex min-h-0 flex-col flex-grow',
                isCanvas || isDocument ? 'p-0' : 'gap-4'
              )}
            >
              {content}
            </CardContent>
          </Card>
        </aside>
      </ResizablePanel>
    </>
  );
}
