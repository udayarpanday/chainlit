import { cn } from '@/lib/utils';
import { MessageCircle, X } from 'lucide-react';
import { useContext, useEffect, useState } from 'react';
import { useMediaQuery } from 'react-responsive';
import { useRecoilValue } from 'recoil';

import Alert from '@chainlit/app/src/components/Alert';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@chainlit/app/src/components/ui/popover';

import ElementSideView from './components/ElementSideView';
import Header from './components/Header';

import { documentPreviewDockedState } from './state/documentPreview';

import ChatWrapper from './chat';
import { WidgetContext } from './context';
import { IWidgetConfig } from './types';

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
  const [expanded, setExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const documentDocked = useRecoilValue(documentPreviewDockedState);

  const [visualViewportHeight, setVisualViewportHeight] = useState(
    window.visualViewport?.height ?? window.innerHeight
  );
  const [visualViewportOffsetTop, setVisualViewportOffsetTop] = useState(
    window.visualViewport?.offsetTop ?? 0
  );

  const isTabletOrMobile = useMediaQuery({ query: '(max-width: 768px)' });

  useEffect(() => {
    window.toggleChainlitCopilot = () => setIsOpen((prev) => !prev);

    return () => {
      window.toggleChainlitCopilot = () => console.error('Widget not mounted.');
    };
  }, []);

  const viewportHandler = () => {
    if (window.visualViewport) {
      setVisualViewportHeight(window.visualViewport.height);
      setVisualViewportOffsetTop(window.visualViewport.offsetTop);
    }
  };

  useEffect(() => {
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', viewportHandler);
      window.visualViewport.addEventListener('scroll', viewportHandler);
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', viewportHandler);
        window.visualViewport.removeEventListener('scroll', viewportHandler);
      }
    };
  }, []);

  useEffect(() => {
    if (evoya?.autoOpen?.enabledDesktop || evoya?.autoOpen?.enabledMobile) {
      if (isTabletOrMobile && !evoya?.autoOpen?.enabledMobile) {
        return;
      }

      // const autoOpenDone = sessionStorage.getItem(autoOpenLS);
      const autoOpenDone = getCookie(autoOpenLS);
      if (autoOpenDone !== '1') {
        if (evoya.autoOpen.delay > 0) {
          setTimeout(
            () => window.toggleChainlitCopilot(),
            evoya.autoOpen.delay
          );
        } else {
          window.toggleChainlitCopilot();
        }
        // sessionStorage.setItem(autoOpenLS, "1");
        document.cookie = `${autoOpenLS}=1;path=/`;
      }
    }
  }, []);

  const customClassName = config?.button?.className || '';
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      {isTabletOrMobile && isOpen ? (
        <></>
      ) : (
        <PopoverTrigger asChild>
          <Button
            id="chainlit-copilot-button"
            className={cn(
              'fixed h-16 w-16 rounded-full bottom-8 right-8 z-[20]',
              'transition-transform duration-300 ease-in-out',
              customClassName
            )}
            style={{
              color: evoya.chainlitConfig.style.color,
              backgroundColor: evoya.chainlitConfig.style.bgcolor
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor =
                evoya.chainlitConfig.style.bgcolorHover)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor =
                evoya.chainlitConfig.style.bgcolor)
            }
            title="Evoya Chat"
            aria-label="Evoya Chat"
          >
            <div className="relative w-full h-full flex items-center justify-center">
              {evoya?.chainlitConfig.button?.imageUrl ? (
                <img
                  width="100%"
                  src={config.button.imageUrl}
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
      )}

      <PopoverContent
        onInteractOutside={(e) => {
          e.preventDefault();
        }}
        side="top"
        align="end"
        sideOffset={12}
        className={cn(
          'border-none flex flex-col p-0 transition-all duration-300 ease-in-out bg-background',
          'overflow-hidden shadow-lg z-[9999]',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 md:relative',
          evoya?.chatBubbleConfig?.size === 'full_screen' &&
            'md:top-[95px] md:left-[10px]',
          expanded
            ? 'copilot-container-expanded'
            : 'copilot-container-collapsed',
          isTabletOrMobile ? 'rounded-none' : 'rounded-xl'
        )}
        style={{
          width: isTabletOrMobile
            ? `100vw`
            : documentDocked
              ? 'min(1280px, calc(100vw - 32px))'
              : evoya?.chatBubbleConfig
                ? evoya?.chatBubbleConfig?.size === 'full_screen'
                  ? '98vw'
                  : `calc(${evoya?.chatBubbleConfig?.width.replace('%', '')}vw - 3vw)`
                : 'min(400px, 80vw)',
          inset: isTabletOrMobile && `0 0 0 0`,
          height: isTabletOrMobile
            ? '100dvh'
            : evoya?.chatBubbleConfig
              ? evoya?.chatBubbleConfig?.size === 'full_screen'
                ? '98vh'
                : evoya?.chatBubbleConfig?.height?.endsWith('%')
                  ? `calc(${evoya?.chatBubbleConfig?.height.replace('%', '')}vh - 13vh)`
                  : `calc(${evoya?.chatBubbleConfig?.height || '0'} - 13vh)`
              : 'min(730px, calc(100vh - 100px))'
        }}
      >
        <div id="chainlit-copilot" className="flex flex-col h-full w-full">
          {error ? (
            <Alert variant="error">{error}</Alert>
          ) : (
            <ElementSideView>
              <Header
                expanded={isOpen}
                setExpanded={setIsOpen}
                isPopup={true}
              />
              <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
                <ChatWrapper />
              </div>
            </ElementSideView>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default Widget;
