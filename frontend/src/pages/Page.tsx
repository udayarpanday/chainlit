import { isDocumentPreviewRequest } from '@/lib/documentPreviewBridge';
import { Navigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { sideViewState, useAuth, useConfig } from '@chainlit/react-client';

import ElementSideView from '@/components/ElementSideView';
import LeftSidebar from '@/components/LeftSidebar';
import { TaskList } from '@/components/Tasklist';
import { Header } from '@/components/header';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

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

  if (config?.userEnv) {
    for (const key of config.userEnv || []) {
      if (!userEnv[key]) return <Navigate to="/env" />;
    }
  }

  const mainContent = (
    <div className="flex min-h-0 flex-col h-full w-full">
      <ResizablePanelGroup
        direction="horizontal"
        className="flex min-h-0 flex-row flex-grow"
      >
        <ResizablePanel
          className="flex flex-col h-full w-full"
          id="chat"
          order={1}
          minSize={documentOpen ? 25 : 35}
          defaultSize={documentOpen ? 38 : 50}
        >
          <div className="flex flex-row flex-grow overflow-auto">
            {children}
          </div>
        </ResizablePanel>
        {sideView ? <ElementSideView /> : <TaskList isMobile={false} />}
      </ResizablePanelGroup>
    </div>
  );

  const historyEnabled = config?.dataPersistence && data?.requireLogin;

  return (
    <SidebarProvider className="h-svh min-h-0 overflow-hidden">
      {historyEnabled ? (
        <>
          <LeftSidebar />
          <SidebarInset className="max-h-svh">{mainContent}</SidebarInset>
        </>
      ) : (
        <div className="h-screen w-screen flex">{mainContent}</div>
      )}
    </SidebarProvider>
  );
};

export default Page;
