import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';
import { useChatMessages, useChatSession } from '@chainlit/react-client';

interface Props {
  setAutoScroll?: (autoScroll: boolean) => void;
  autoScroll?: boolean;
  children: React.ReactNode;
  className?: string;
  bottomTolerance?: number;
}

export default function ScrollContainer({
  setAutoScroll,
  autoScroll,
  children,
  className,
  bottomTolerance = 16
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef<number>(0);
  const touchStartYRef = useRef<number | null>(null);

  const { messages } = useChatMessages();
  const { session } = useChatSession();

  useEffect(() => {
    setAutoScroll?.(true);
    if (ref.current) {
      lastScrollTopRef.current = ref.current.scrollTop;
    }
  }, [session?.socket.id]);

  useEffect(() => {
    if (!ref.current || !autoScroll) return;
    ref.current.scrollTop = ref.current.scrollHeight;
    lastScrollTopRef.current = ref.current.scrollTop;
  }, [messages, autoScroll]);

  const computeAtBottom = () => {
    if (!ref.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    return scrollTop + clientHeight >= scrollHeight - bottomTolerance;
  };

  const handleScroll = () => {
    if (!ref.current || !setAutoScroll) return;

    const { scrollTop } = ref.current;

    if (scrollTop < lastScrollTopRef.current) {
      setAutoScroll(false);
    } else if (computeAtBottom()) {
      setAutoScroll(true);
    }

    lastScrollTopRef.current = scrollTop;
  };

  const handleWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    if (!setAutoScroll) return;
    if (e.deltaY < 0) setAutoScroll(false);
  };

  const handleTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    touchStartYRef.current = e.touches[0]?.clientY ?? null;
  };
  const handleTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (!setAutoScroll) return;
    const startY = touchStartYRef.current;
    const currentY = e.touches[0]?.clientY ?? null;
    if (startY !== null && currentY !== null) {
      const delta = currentY - startY;
      if (delta > 0) setAutoScroll(false);
    }
  };
  const handleTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    touchStartYRef.current = null;
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative flex flex-col flex-grow overflow-y-auto overscroll-contain', 
        className
      )}
      onScroll={handleScroll}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      <div style={{ height: 1 }} />
    </div>
  );
}
