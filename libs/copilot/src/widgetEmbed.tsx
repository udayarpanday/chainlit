import { cn } from '@/lib/utils';
import Chat from 'chat';
import { useContext, useState } from 'react';

import ElementSideView from './components/ElementSideView';
import Header from './components/Header';

import { WidgetContext } from './context';

export default function WidgetEmbedded() {
  const { evoya } = useContext(WidgetContext);
  const [expanded, setExpanded] = useState(evoya?.overlay ?? false);

  // useEffect(() => {
  //   window.toggleChainlitCopilot = () => setExpanded((prev) => !prev);

  //   return () => {
  //     window.toggleChainlitCopilot = () => console.error('Widget not mounted.');
  //   };
  // }, []);

  return (
    <div
      className={cn(
        'flex h-full min-h-0 min-w-0 w-full flex-col bg-background relative shadow-lg',
        expanded ? 'copilot-container-expanded' : 'copilot-container-collapsed'
      )}
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <ElementSideView>
          {!evoya?.headerConfig?.hideHeaderBar && (
            <Header expanded={expanded} setExpanded={setExpanded} />
          )}
          <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
            <Chat />
          </div>
        </ElementSideView>
      </div>
    </div>
  );
}
