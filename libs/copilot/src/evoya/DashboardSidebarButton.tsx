import { useEffect, useState } from 'react';
import { BsLayoutSidebar } from 'react-icons/bs';
import { useMediaQuery } from "react-responsive";


import { Button } from '@chainlit/app/src/components/ui/button';

export default function DashboardSidebarButton() {
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 1199px)' })
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const handleReload = (e) => {
        setIsSidebarOpen(e.detail.message);
    };

    window.addEventListener('show-chat-sidebar', handleReload);

    return () => {
      window.removeEventListener('show-chat-sidebar', handleReload);
    };
  }, []);

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('copilot-dashboard-sidebar'));
  };
  if (isSidebarOpen && !isTabletOrMobile) return null;
  return (
    <Button variant="outline" size="icon" onClick={handleClick}>
      <BsLayoutSidebar />
    </Button>
  );
}
