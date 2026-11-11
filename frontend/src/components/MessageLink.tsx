import { ArrowUpRight, Check, Copy } from 'lucide-react';
import {
  type ComponentPropsWithoutRef,
  useEffect,
  useRef,
  useState
} from 'react';

import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

export default function MessageLink({
  children,
  href,
  ...props
}: ComponentPropsWithoutRef<'a'>) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();
  const keepOpen = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const closeSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 200);
  };

  useEffect(() => {
    setCopied(false);
    setCopyError(false);
    return () => {
      clearTimeout(closeTimer.current);
      clearTimeout(resetTimer.current);
    };
  }, [href]);

  let address: string | undefined;
  try {
    const url = new URL(href || '', window.location.href);
    if (
      href &&
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password
    )
      address = url.href;
  } catch {
    // An incomplete URL must not break a streamed message.
  }
  // Non-web links keep their usual behavior and do not get a details popup.
  if (!address)
    return (
      <a {...props} href={href}>
        {children}
      </a>
    );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(address!);
      setCopyError(false);
      setCopied(true);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <span onMouseEnter={keepOpen} onMouseLeave={closeSoon}>
        <a {...props} href={href}>
          {children}
        </a>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Link details"
            onClick={(event) => {
              event.preventDefault();
              keepOpen();
            }}
            className="ml-0.5 inline-flex size-5 items-center justify-center rounded-sm align-text-bottom text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowUpRight className="size-3" aria-hidden />
          </button>
        </PopoverTrigger>
      </span>
      <PopoverContent
        aria-label="Link details"
        side="top"
        align="start"
        collisionPadding={16}
        className="w-[min(420px,calc(100vw-32px))] max-w-[calc(100vw-32px)] p-3"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onMouseEnter={() => clearTimeout(closeTimer.current)}
        onMouseLeave={closeSoon}
        onFocusCapture={() => clearTimeout(closeTimer.current)}
      >
        <div className="flex min-w-0 items-start gap-2">
          <a
            href={address}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
            className="min-w-0 flex-1 break-all text-sm text-primary underline underline-offset-2"
          >
            {address}
          </a>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="shrink-0"
            aria-label={copied ? 'Link copied' : 'Copy link'}
            onClick={copyLink}
          >
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          </Button>
        </div>
        {copied && (
          <span role="status" className="sr-only">
            Link copied
          </span>
        )}
        {copyError && (
          <p role="alert" className="mt-2 text-xs text-muted-foreground">
            Could not copy the link. Select and copy the URL above.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
