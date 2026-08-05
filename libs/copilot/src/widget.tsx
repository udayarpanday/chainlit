import { cn } from '@/lib/utils';
import { MessageCircle, X } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { useMediaQuery } from 'react-responsive';

import Alert from '@chainlit/app/src/components/Alert';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@chainlit/app/src/components/ui/popover';
import { useConfig } from '@chainlit/react-client';

import Header from './components/Header';

import ChatWrapper from './chat';
import { WidgetContext } from './context';
import { useSidebarResize } from './hooks';
import { LS_DISPLAY_MODE_KEY, resolveDisplayMode } from './resolveDisplayMode';
import {
  clearChainlitCopilotThreadId,
  getChainlitCopilotThreadId
} from './state';
import { DisplayMode, IWidgetConfig } from './types';

interface Props {
  config: IWidgetConfig;
  error?: string;
}

const autoOpenLS = 'EVOYA_AUTO_OPEN_USED';
function getCookie(name: string) {
  const re = new RegExp(name + '=([^;]+)');
  const value = re.exec(document.cookie);
  return value != null ? unescape(value[1]) : null;
}

const Widget = ({ config, error }: Props) => {
  const { evoya } = useContext(WidgetContext);
  const [expanded, setExpanded] = useState(config?.expanded || false);
  const [isOpen, setIsOpen] = useState(config?.opened || false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>(() =>
    resolveDisplayMode(config?.displayMode)
  );
  const projectConfig = useConfig();
  const { sidebarWidth, handleMouseDown } = useSidebarResize({
    displayMode,
    isOpen
  });
  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 768px)' });

  useEffect(() => {
    window.toggleChainlitCopilot = () => setIsOpen((prev) => !prev);
    window.getChainlitCopilotThreadId = getChainlitCopilotThreadId;
    window.clearChainlitCopilotThreadId = clearChainlitCopilotThreadId;

    return () => {
      window.toggleChainlitCopilot = () => console.error('Widget not mounted.');
      window.getChainlitCopilotThreadId = () => null;

      window.clearChainlitCopilotThreadId = () =>
        console.error('Widget not mounted.');
    };
  }, []);

  useEffect(() => {
    if (evoya?.autoOpen?.enabledDesktop || evoya?.autoOpen?.enabledMobile) {
      if (isTabletOrMobile && !evoya?.autoOpen?.enabledMobile) {
        return;
      }

      const autoOpenDone = getCookie(autoOpenLS);
      if (autoOpenDone !== '1') {
        if (evoya.autoOpen.delay > 0) {
          setTimeout(() => window.toggleChainlitCopilot(), evoya.autoOpen.delay);
        } else {
          window.toggleChainlitCopilot();
        }
        document.cookie = `${autoOpenLS}=1;path=/`;
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_DISPLAY_MODE_KEY, displayMode);
  }, [displayMode]);

  const customClassName = config?.button?.className || '';
  const evoyaStyle = evoya?.chainlitConfig?.style;
  const evoyaButtonImage = evoya?.chainlitConfig?.imageUrl;

  const chatContent = error ? (
    <Alert variant="error">{error}</Alert>
  ) : (
    <>
      <Header
        expanded={expanded}
        setExpanded={setExpanded}
        projectConfig={projectConfig}
        displayMode={displayMode}
        setDisplayMode={setDisplayMode}
        setIsOpen={setIsOpen}
      />
      <div className="flex flex-grow overflow-y-auto">
        <ChatWrapper />
      </div>
    </>
  );

  if (displayMode === 'sidebar') {
    if (!isOpen) {
      return (
        <Button
          id="chainlit-copilot-button"
          aria-expanded="false"
          className={cn(
            'fixed h-16 w-16 rounded-full bottom-8 right-8 z-[20]',
            'transition-transform duration-300 ease-in-out',
            customClassName
          )}
          style={{
            color: evoyaStyle?.color,
            backgroundColor: evoyaStyle?.bgcolor
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              evoyaStyle?.bgcolorHover || '')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = evoyaStyle?.bgcolor || '')
          }
          onClick={() => setIsOpen(true)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {evoyaButtonImage || config?.button?.imageUrl ? (
              <img
                width="100%"
                src={evoyaButtonImage || config.button.imageUrl}
                alt="Chat bubble icon"
              />
            ) : (
              <MessageCircle className="!size-7" />
            )}
          </div>
        </Button>
      );
    }

    return (
      <div
        className="fixed top-0 right-0 h-full z-[50] bg-background border-l shadow-lg flex flex-col"
        style={{ width: sidebarWidth }}
      >
        <div
          data-testid="sidebar-drag-handle"
          onMouseDown={handleMouseDown}
          className="absolute top-0 left-0 w-1 h-full cursor-col-resize hover:bg-primary/20 active:bg-primary/30 z-10"
        />
        <div id="chainlit-copilot-chat" className="flex flex-col h-full w-full">
          {chatContent}
        </div>
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="chainlit-copilot-button"
          className={cn(
            'fixed h-16 w-16 rounded-full bottom-8 right-8 z-[20]',
            'transition-transform duration-300 ease-in-out',
            customClassName
          )}
          style={{
            color: evoyaStyle?.color,
            backgroundColor: evoyaStyle?.bgcolor
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor =
              evoyaStyle?.bgcolorHover || '')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = evoyaStyle?.bgcolor || '')
          }
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {evoyaButtonImage || config?.button?.imageUrl ? (
              <img
                width="100%"
                src={evoyaButtonImage || config.button.imageUrl}
                alt="Chat bubble icon"
                className={cn(
                  'transition-opacity',
                  isOpen ? 'opacity-0' : 'opacity-100'
                )}
              />
            ) : (
              <MessageCircle
                className={cn(
                  '!size-7 transition-opacity',
                  isOpen ? 'opacity-0' : 'opacity-100'
                )}
              />
            )}
            <X
              className={cn(
                'absolute !size-7 transition-all',
                isOpen ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
              )}
            />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        side="top"
        align="end"
        sideOffset={12}
        className={cn(
          'flex flex-col p-0',
          'transition-all duration-300 ease-in-out bg-background',
          expanded ? 'w-[80vw]' : 'w-[min(400px,80vw)]',
          'h-[min(730px,calc(100vh-150px))]',
          'overflow-hidden rounded-xl',
          'shadow-lg',
          'z-50',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          expanded
            ? 'copilot-container-expanded'
            : 'copilot-container-collapsed'
        )}
      >
        <div id="chainlit-copilot-chat" className="flex flex-col h-full w-full">
          {chatContent}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Widget;
