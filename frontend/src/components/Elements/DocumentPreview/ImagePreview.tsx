import { LoaderCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '../../ui/button';
import { usePreviewSettings, useRememberScroll } from './PreviewSession';

function imageMime(data: ArrayBuffer): string | undefined {
  const bytes = new Uint8Array(data);
  if (
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value
    )
  )
    return 'image/png';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return 'image/jpeg';
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
  )
    return 'image/webp';
}

const checkerboard = {
  backgroundColor: '#fff',
  backgroundImage:
    'linear-gradient(45deg,#e5e7eb 25%,transparent 25%),linear-gradient(-45deg,#e5e7eb 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e7eb 75%),linear-gradient(-45deg,transparent 75%,#e5e7eb 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0,0 8px,8px -8px,-8px 0'
};

export default function ImagePreview({
  data,
  name
}: {
  data: ArrayBuffer;
  name: string;
}) {
  const [saved, save] = usePreviewSettings('image', { zoom: 0 });
  const [source, setSource] = useState<string>();
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({ width: 640, height: 480 });
  const [manualScale, setManualScale] = useState<number | undefined>(
    saved.zoom || undefined
  );
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const [error, setError] = useState<string>();
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mime = imageMime(data);
    setError(undefined);
    setNatural({ width: 0, height: 0 });
    setManualScale(saved.zoom || undefined);
    if (!mime) {
      setSource(undefined);
      setError(
        'This image format could not be previewed. Download the original instead.'
      );
      return;
    }
    const url = URL.createObjectURL(new Blob([data], { type: mime }));
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [data]);

  useEffect(() => {
    const target = container.current;
    if (!target) return;
    const measure = (width: number, height: number) => {
      if (!width || !height) return;
      const next = { width: Math.floor(width), height: Math.floor(height) };
      setViewport((current) =>
        current.width === next.width && current.height === next.height
          ? current
          : next
      );
    };
    measure(target.clientWidth, target.clientHeight);
    const observer = new ResizeObserver(([entry]) =>
      measure(entry.contentRect.width, entry.contentRect.height)
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const ready = !!source && natural.width > 0;
  const fit = ready
    ? Math.min(
        1,
        Math.max(1, viewport.width - 50) / natural.width,
        Math.max(1, viewport.height - 50) / natural.height
      )
    : 1;
  const scale = manualScale ?? fit;
  const width = Math.max(1, Math.round(natural.width * scale));
  const height = Math.max(1, Math.round(natural.height * scale));
  useEffect(() => save({ zoom: manualScale ?? 0 }), [manualScale, save]);
  useRememberScroll('image-scroll', scrollRoot, ready);

  if (error)
    return (
      <p role="alert" className="p-4 text-sm">
        {error}
      </p>
    );
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div
        ref={container}
        className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-muted/40"
      >
        <div
          ref={setScrollRoot}
          className="absolute inset-0 overflow-auto"
          aria-label="Image canvas"
        >
          {!ready && (
            <p
              role="status"
              className="absolute inset-0 flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground"
            >
              <LoaderCircle className="size-4 animate-spin" />
              Opening image…
            </p>
          )}
          <div
            style={{
              width: Math.max(viewport.width, width + 48),
              height: Math.max(viewport.height, height + 48),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              boxSizing: 'border-box',
              visibility: ready ? 'visible' : 'hidden'
            }}
          >
            <div
              className="shrink-0 overflow-hidden rounded-sm shadow-sm ring-1 ring-black/5"
              style={{ ...checkerboard, width, height }}
            >
              {source && (
                <img
                  src={source}
                  alt={name}
                  className="block max-w-none"
                  style={{ width, height }}
                  draggable={false}
                  onLoad={(event) =>
                    setNatural({
                      width: event.currentTarget.naturalWidth,
                      height: event.currentTarget.naturalHeight
                    })
                  }
                  onError={() =>
                    setError(
                      'This image could not be displayed. Download the original instead.'
                    )
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        className="flex h-12 shrink-0 items-center justify-between gap-2 border-t bg-background px-3 text-xs"
        style={{ visibility: ready ? 'visible' : 'hidden' }}
        aria-hidden={!ready}
        aria-label="Image controls"
      >
        <span className="whitespace-nowrap text-muted-foreground">
          {natural.width} × {natural.height}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Zoom out"
            disabled={scale <= 0.05}
            onClick={() => setManualScale(Math.max(0.05, scale - 0.25))}
          >
            <ZoomOut className="size-3.5" />
          </Button>
          <span className="w-10 text-center tabular-nums">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            aria-label="Zoom in"
            disabled={scale >= 4}
            onClick={() => setManualScale(Math.min(4, scale + 0.25))}
          >
            <ZoomIn className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            aria-label="Actual image size"
            onClick={() => setManualScale(1)}
          >
            100%
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setManualScale(undefined)}
          >
            Fit
          </Button>
        </div>
      </div>
    </div>
  );
}
