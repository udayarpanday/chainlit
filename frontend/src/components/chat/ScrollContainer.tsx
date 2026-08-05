import { cn } from '@/lib/utils';
import { ArrowDown } from 'lucide-react';
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

import { useChatMessages } from '@chainlit/react-client';
import { Button } from '@/components/ui/button';

interface Props {
  autoScrollUserMessage?: boolean;
  autoScrollRef?: MutableRefObject<boolean>;
  children: React.ReactNode;
  className?: string;
}

export default function ScrollContainer({
  autoScrollRef,
  autoScrollUserMessage,
  children,
  className
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement | null>(null);
  const { messages } = useChatMessages();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const scrollToPosition = useCallback(() => {
    if (!ref.current || !lastUserMessageRef.current) return;

    setIsScrolling(true);
    const scrollPosition = lastUserMessageRef.current.offsetTop - 20;

    ref.current.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });

    setShowScrollButton(false);
    // We don't know when smooth scroll ends, so we just let handleScroll
    // update state as the user interacts.
  }, []);

  const scrollToBottom = useCallback(() => {
    if (!ref.current) return;

    setIsScrolling(true);
    ref.current.scrollTo({
      top: ref.current.scrollHeight,
      behavior: 'smooth'
    });

    if (autoScrollRef) {
      autoScrollRef.current = true;
    }

    setShowScrollButton(false);
  }, [autoScrollRef]);

  // Calculate and update spacer height
  const updateSpacerHeight = useCallback(() => {
    if (!ref.current) return;

    // When focusing on the last user message
    if (autoScrollUserMessage && lastUserMessageRef.current) {
      const containerHeight = ref.current.clientHeight;
      const lastMessageHeight = lastUserMessageRef.current.offsetHeight;

      // Height of all elements after the last user message
      let afterMessagesHeight = 0;
      let currentElement = lastUserMessageRef.current.nextElementSibling;

      while (currentElement && currentElement !== spacerRef.current) {
        afterMessagesHeight += (currentElement as HTMLElement).offsetHeight;
        currentElement = currentElement.nextElementSibling;
      }

      const newSpacerHeight =
        containerHeight - lastMessageHeight - afterMessagesHeight - 32;

      if (spacerRef.current) {
        spacerRef.current.style.height = `${Math.max(0, newSpacerHeight)}px`;
      }

      // If nothing after the last user message, scroll to it.
      if (afterMessagesHeight === 0) {
        scrollToPosition();
      } else {
        // Otherwise, follow the normal auto-scroll behavior.
        if (!autoScrollRef || autoScrollRef.current) {
          ref.current.scrollTop = ref.current.scrollHeight;
        }
      }
    } else {
      // Normal behavior: keep at bottom if auto-scroll is enabled or no ref passed
      if (!autoScrollRef || autoScrollRef.current) {
        ref.current.scrollTop = ref.current.scrollHeight;
      }
    }
  }, [autoScrollUserMessage, autoScrollRef, scrollToPosition]);

  // Find and set a ref to the last user message element
  useEffect(() => {
    if (!ref.current) return;

    if (messages.length === 0 && spacerRef.current) {
      spacerRef.current.style.height = `0px`;
      return;
    }

    const userMessages = ref.current.querySelectorAll(
      '[data-step-type="user_message"]'
    );

    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[
        userMessages.length - 1
      ] as HTMLDivElement;

      lastUserMessageRef.current = lastUserMessage;

      // Delay a bit to ensure DOM layout is updated
      requestAnimationFrame(() => {
        updateSpacerHeight();
      });
    } else if (autoScrollRef?.current && ref.current) {
      // No user messages, just keep at bottom if needed
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [messages, updateSpacerHeight, autoScrollRef]);

  // Window resize listener to update spacer height
  useEffect(() => {
    if (!autoScrollUserMessage) return;

    const handleResize = () => {
      updateSpacerHeight();
    };

    window.addEventListener('resize', handleResize);

    // Initial update
    updateSpacerHeight();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [autoScrollUserMessage, updateSpacerHeight]);

  // Check scroll position on mount
  useEffect(() => {
    if (!ref.current) return;

    setTimeout(() => {
      if (!ref.current) return;

      const { scrollTop, scrollHeight, clientHeight } = ref.current;
      const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
      setShowScrollButton(!atBottom);
      if (autoScrollRef) {
        autoScrollRef.current = atBottom;
      }
    }, 300);
  }, [autoScrollRef]);

  const handleScroll = () => {
    if (!ref.current) return;

    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;

    if (autoScrollRef) {
      autoScrollRef.current = atBottom;
    }

    setShowScrollButton(!atBottom);
    setIsScrolling(false);
  };

  return (
    <div className="relative flex flex-col flex-grow min-h-0">
      <div
        ref={ref}
        className={cn(
          'flex flex-col flex-grow overflow-y-auto min-h-0',
          className
        )}
        onScroll={handleScroll}
      >
        {children}
        {/* Dynamic spacer to position the last user message at the top */}
        <div ref={spacerRef} className="flex-shrink-0" />
      </div>

      {showScrollButton ? (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <Button
            size="icon"
            variant="outline"
            className="rounded-full"
            onClick={scrollToBottom}
          >
            <ArrowDown className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
