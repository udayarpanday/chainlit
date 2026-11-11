import { isDocumentPreviewRequest } from '@/lib/documentPreviewBridge';
import { Navigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { sideViewState, useAuth, useConfig } from '@chainlit/react-client';

import ElementSideView from '@/components/ElementSideView';
import LeftSidebar from '@/components/LeftSidebar';
import { TaskList } from '@/components/Tasklist';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

import { useIsMobile } from '@/hooks/use-mobile';
import { useDocumentPreviewExpansion } from '@/hooks/useDocumentPreviewExpansion';

import { userEnvState } from 'state/user';

type Props = {
  children: JSX.Element;
};

const Page = ({ children }: Props) => {
  const { config } = useConfig();
  const { data } = useAuth();
  const userEnv = useRecoilValue(userEnvState);
  const sideView = useRecoilValue(sideViewState);
  const documentOpen = isDocumentPreviewRequest(sideView);
  const isMobile = useIsMobile();
  const { groupRef, expanded, toggleExpanded } = useDocumentPreviewExpansion(
    documentOpen,
    documentOpen && !isMobile
  );

  if (config?.userEnv) {
    for (const key of config.userEnv || []) {
      if (!userEnv[key]) return <Navigate to="/env" />;
    }
  }

  const mainContent = (
    <div className="flex min-h-0 min-w-0 flex-col h-full w-full">
      <ResizablePanelGroup
        ref={groupRef}
        direction="horizontal"
        className="flex min-h-0 flex-row flex-grow"
      >
        <ResizablePanel
          className="flex min-h-0 min-w-0 flex-col h-full w-full"
          id="chat"
          order={1}
          minSize={documentOpen ? (expanded ? 0 : 25) : 35}
          defaultSize={documentOpen ? 38 : 50}
        >
          <div
            className="flex min-h-0 min-w-0 flex-row flex-grow overflow-auto"
            aria-hidden={expanded || undefined}
            {...{ inert: expanded ? '' : undefined }}
          >
            {children}
          </div>
        </ResizablePanel>
        {sideView ? (
          <ElementSideView
            expanded={expanded}
            onToggleExpanded={toggleExpanded}
          />
        ) : (
          <TaskList isMobile={false} />
        )}
      </ResizablePanelGroup>
    </div>
  );

  const historyEnabled = config?.dataPersistence && data?.requireLogin;

  return (
    <SidebarProvider
      autoHide={documentOpen}
      className="h-svh min-h-0 min-w-0 overflow-hidden"
    >
      {historyEnabled ? (
        <>
          <LeftSidebar />
          <SidebarInset className="min-w-0 max-h-svh">
            {mainContent}
          </SidebarInset>
        </>
      ) : (
        <div className="h-screen min-w-0 w-full flex">{mainContent}</div>
      )}
    </SidebarProvider>
  );
};

export default Page;
