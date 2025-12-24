import { History } from 'lucide-react';
import { Button } from '@chainlit/app/src/components/ui/button';

export default function DashboardSidebarButton() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('copilot-dashboard-sidebar'));
  };
  return (
    <Button variant="ghost" size="icon" onClick={handleClick}>
      <History  />
    </Button>
  );
}
