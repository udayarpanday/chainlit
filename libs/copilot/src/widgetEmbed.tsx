import Chat from 'chat';
import { useSetRecoilState } from 'recoil';

import { useState, useEffect, useContext } from 'react';
import Header from './components/Header';
import { WidgetContext } from './context';
import { cn } from '@/lib/utils';
import { evoyaCreatorEnabledState } from '@chainlit/react-client';


export default function WidgetEmbedded() {
  const { evoya } = useContext(WidgetContext)
  const [expanded, setExpanded] = useState(evoya?.overlay ?? false);
  const setCreatorEnabled = useSetRecoilState(evoyaCreatorEnabledState);

  useEffect(() => {
    if (evoya?.type === 'dashboard') {
      window.addEventListener('disable-creator-mode', () => {
        setCreatorEnabled(false);
      });
      window.addEventListener('enable-creator-mode', () => {
        console.log("enable creator");
        setCreatorEnabled(true);
      });
    }
    return () => {
    }
  }, []);

  // useEffect(() => {
  //   window.toggleChainlitCopilot = () => setExpanded((prev) => !prev);

  //   return () => {
  //     window.toggleChainlitCopilot = () => console.error('Widget not mounted.');
  //   };
  // }, []);

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col bg-background relative shadow-lg',
        expanded
          ? 'copilot-container-expanded'
          : 'copilot-container-collapsed'
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        {!evoya?.headerConfig?.hideHeaderBar && (
          <Header expanded={expanded} setExpanded={setExpanded} />
        )}
        <div className="min-h-0 flex-1">
          <Chat />
        </div>
      </div>
    </div>
  );
}
