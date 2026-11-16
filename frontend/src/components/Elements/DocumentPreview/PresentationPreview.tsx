import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';

import scrollbarStyles from '../../../styles/scrollbars.css?raw';

import {
  presentationPreviewData,
  validateOfficeArchive
} from '../../../lib/loadDocument';
import { Button } from '../../ui/button';
import { usePreviewSettings, usePreviewTheme } from './PreviewSession';

type PresentationViewer = ReturnType<(typeof import('pptx-preview'))['init']>;

// The frame owns the only scrolling surface. App/global CSS cannot change slide
// layout; the iframe itself stays fixed and only its inner slide column zooms.
const frameHtml = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; connect-src 'none'; img-src data: blob:; font-src data: blob:; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"><style>${scrollbarStyles}*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:var(--preview-canvas,#eef1f5);font-family:Calibri,"Segoe UI",Arial,sans-serif}#viewport{position:fixed;inset:0;overflow-y:scroll;overflow-x:hidden;overscroll-behavior:contain;color-scheme:var(--preview-scheme,light)}#strip{padding:16px 16px 128px}#slides{margin:0 auto}.pptx-preview-wrapper{margin:0!important;height:auto!important;overflow:visible!important;background:transparent!important;display:flex;flex-direction:column;gap:var(--slide-gap,16px)}.slide-slot{position:relative;flex:none;background:#fff;overflow:hidden}.pptx-preview-slide-wrapper{margin:0!important;top:0!important;left:0!important}</style></head><body><div id="viewport" tabindex="0" aria-label="Presentation pages"><div id="strip"><div id="slides"></div></div></div></body></html>`;

export default function PresentationPreview({ data }: { data: ArrayBuffer }) {
  const theme = usePreviewTheme();
  const [saved, save] = usePreviewSettings('pptx', {
    page: 0,
    offset: 0,
    zoom: 1
  });
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const [size, setSize] = useState({ width: 1280, height: 720 });
  const [viewportWidth, setViewportWidth] = useState(0);
  const [page, setPage] = useState(saved.page);
  const currentPage = useRef(saved.page);
  const offset = useRef(saved.offset);
  const [count, setCount] = useState(0);
  const [zoom, setZoom] = useState(Math.max(0.5, Math.min(2, saved.zoom)));
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string>();
  const slots = useRef<HTMLElement[]>([]);

  useEffect(() => {
    const root = frame?.contentDocument?.getElementById('viewport');
    if (!root) return;
    const measure = () => setViewportWidth(root.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [frame]);

  useEffect(() => {
    const document = frame?.contentDocument;
    const host = document?.getElementById('slides');
    const root = document?.getElementById('viewport');
    if (!document || !host || !root) return;
    let active = true;
    let instance: PresentationViewer | undefined;
    let observer: IntersectionObserver | undefined;
    setReady(false);
    setError(undefined);
    setPage(saved.page);
    currentPage.current = saved.page;
    const timer = window.setTimeout(() => {
      active = false;
      setError(
        'This presentation took too long to open. Download the original instead.'
      );
    }, 30000);
    (async () => {
      const archive = await validateOfficeArchive(data, 'pptx');
      const xml = new DOMParser().parseFromString(
        await archive.file('ppt/presentation.xml')!.async('text'),
        'application/xml'
      );
      const slideSize = xml.getElementsByTagNameNS('*', 'sldSz')[0];
      const width = Number(slideSize?.getAttribute('cx'));
      const height = Number(slideSize?.getAttribute('cy'));
      if (
        !Number.isFinite(width) ||
        !Number.isFinite(height) ||
        width <= 0 ||
        height <= 0
      )
        throw new Error('Invalid presentation dimensions.');
      const factor = 1280 / Math.max(width, height);
      const dimensions = { width: width * factor, height: height * factor };
      const { init } = await import('pptx-preview');
      const previewData = await presentationPreviewData(data, archive);
      if (!active) return;
      instance = init(host, { ...dimensions, mode: 'list' });
      const presentation = await instance.load(previewData);
      if (!active) return;
      if (!presentation.slides.length || presentation.slides.length > 200)
        throw new Error('Unsupported slide count.');
      const viewer = instance;
      const wrapper = viewer.wrapper;
      // Parse once. Slots reserve the whole deck's layout while the library
      // renders only nearby slides from its already loaded presentation.
      slots.current = presentation.slides.map((_, index) => {
        const slot = document.createElement('div');
        slot.className = 'slide-slot';
        slot.dataset.slide = String(index);
        slot.setAttribute('role', 'group');
        slot.setAttribute('aria-label', 'Slide ' + (index + 1));
        slot.style.width = dimensions.width + 'px';
        slot.style.height = dimensions.height + 'px';
        wrapper.append(slot);
        return slot;
      });
      observer = new IntersectionObserver(
        (entries) => {
          if (!active) return;
          for (const entry of entries) {
            const slot = entry.target as HTMLElement;
            if (!entry.isIntersecting) {
              slot.replaceChildren();
              continue;
            }
            if (slot.childElementCount) continue;
            try {
              const index = Number(slot.dataset.slide);
              viewer.htmlRender.renderSlide(index);
              const rendered = wrapper.querySelector(
                ':scope > .pptx-preview-slide-wrapper-' + index
              );
              if (!rendered) throw new Error('Slide rendering failed.');
              slot.append(rendered);
              slot.querySelectorAll('a').forEach((anchor) => {
                anchor.removeAttribute('href');
                anchor.removeAttribute('xlink:href');
              });
            } catch {
              setError(
                'This slide could not be displayed. Download the original instead.'
              );
            }
          }
        },
        { root, rootMargin: '800px 0px' }
      );
      slots.current.forEach((slot) => observer!.observe(slot));
      setSize(dimensions);
      currentPage.current = Math.min(
        saved.page,
        presentation.slides.length - 1
      );
      setPage(currentPage.current);
      setCount(presentation.slides.length);
      setReady(true);
    })()
      .catch((error) => {
        console.warn('Presentation preview failed', error);
        if (active)
          setError(
            'This presentation could not be displayed. Download the original instead.'
          );
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      active = false;
      window.clearTimeout(timer);
      observer?.disconnect();
      instance?.destroy();
      slots.current = [];
      host.replaceChildren();
    };
  }, [data, frame]);

  const goToSlide = useCallback(
    (index: number, fraction = 0) => {
      const root = frame?.contentDocument?.getElementById('viewport');
      const next = Math.max(0, Math.min(count - 1, index));
      const slot = slots.current[next];
      if (!root || !slot) return;
      currentPage.current = next;
      offset.current = fraction;
      setPage(next);
      save({ page: next, offset: fraction });
      root.scrollTo({
        top:
          root.scrollTop +
          slot.getBoundingClientRect().top -
          root.getBoundingClientRect().top -
          16 +
          slot.getBoundingClientRect().height * fraction
      });
    },
    [frame, count, save]
  );

  const displayedWidth = Math.max(
    1,
    Math.floor(Math.max(1, viewportWidth - 32) * zoom)
  );
  const scale = displayedWidth / size.width;
  useLayoutEffect(() => {
    const document = frame?.contentDocument;
    const root = document?.getElementById('viewport');
    const host = document?.getElementById('slides');
    const strip = document?.getElementById('strip');
    if (!root || !host || !strip || !ready || !viewportWidth) return;
    host.style.width = size.width + 'px';
    host.style.setProperty('zoom', String(scale));
    host.style.setProperty('--slide-gap', 16 / scale + 'px');
    strip.style.width = Math.max(root.clientWidth, displayedWidth + 32) + 'px';
    root.style.overflowX = zoom > 1 ? 'auto' : 'hidden';
    goToSlide(currentPage.current, offset.current);
  }, [
    frame,
    ready,
    viewportWidth,
    size.width,
    scale,
    displayedWidth,
    zoom,
    goToSlide
  ]);

  useEffect(() => save({ zoom }), [zoom, save]);
  useEffect(() => {
    const document = frame?.contentDocument;
    if (!document) return;
    document.documentElement.style.setProperty(
      '--preview-canvas',
      theme.canvas
    );
    document.documentElement.style.setProperty(
      '--preview-scheme',
      theme.dark ? 'dark' : 'light'
    );
  }, [frame, theme]);
  useEffect(() => {
    const root = frame?.contentDocument?.getElementById('viewport');
    if (!root || !ready) return;
    let pending = 0;
    const update = () => {
      pending = 0;
      let index = count - 1;
      if (!(
        root.scrollTop > 0 &&
        root.scrollTop >= root.scrollHeight - root.clientHeight - 2
      )) {
        const position =
          root.getBoundingClientRect().top +
          Math.min(120, root.clientHeight / 4);
        let low = 0,
          high = count - 1;
        while (low < high) {
          const middle = Math.floor((low + high) / 2);
          if (slots.current[middle].getBoundingClientRect().bottom <= position)
            low = middle + 1;
          else high = middle;
        }
        index = low;
      }
      currentPage.current = index;
      const slot = slots.current[index];
      offset.current =
        (root.getBoundingClientRect().top +
          16 -
          slot.getBoundingClientRect().top) /
        slot.getBoundingClientRect().height;
      save({ page: index, offset: offset.current });
      setPage(index);
    };
    const onScroll = () => {
      if (!pending) pending = requestAnimationFrame(update);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      root.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(pending);
    };
  }, [frame, ready, count, save]);

  if (error)
    return (
      <p role="alert" className="p-4 text-sm">
        {error}
      </p>
    );
  const buttonClass =
    'size-8 rounded-full text-foreground hover:bg-accent hover:text-accent-foreground';
  return (
    <div
      className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      style={{ background: theme.canvas }}
    >
      {!ready && (
        <p
          role="status"
          className="absolute inset-0 z-10 flex items-center justify-center p-4 text-sm text-foreground"
        >
          Opening presentation…
        </p>
      )}
      <iframe
        title="PowerPoint preview"
        className="min-h-0 w-full flex-1 border-0"
        style={{ visibility: ready ? 'visible' : 'hidden' }}
        sandbox="allow-same-origin"
        referrerPolicy="no-referrer"
        srcDoc={frameHtml}
        onLoad={(event) => setFrame(event.currentTarget)}
      />
      <div
        aria-label="Slide controls"
        aria-hidden={!ready}
        className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border p-1.5 text-xs shadow-sm"
        style={{
          visibility: ready ? 'visible' : 'hidden',
          background: theme.surface,
          color: theme.text,
          borderColor: theme.border,
          width: 'max-content',
          maxWidth: 'calc(100% - 16px)',
          flexWrap: 'wrap',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}
      >
        <Button
          variant="ghost"
          size="icon"
          className={buttonClass}
          aria-label="Previous slide"
          disabled={page <= 0}
          onClick={() => goToSlide(page - 1)}
        >
          <ChevronLeft />
        </Button>
        <select
          aria-label="Choose slide"
          className="min-w-0 rounded bg-transparent px-1 py-2 text-xs"
          style={{
            color: theme.text,
            colorScheme: theme.dark ? 'dark' : 'light',
            maxWidth: 110
          }}
          value={page}
          onChange={(event) => goToSlide(Number(event.target.value))}
        >
          {Array.from({ length: count }, (_, index) => (
            <option key={index} value={index}>
              {index + 1} / {count}
            </option>
          ))}
        </select>
        <Button
          variant="ghost"
          size="icon"
          className={buttonClass}
          aria-label="Next slide"
          disabled={page >= count - 1}
          onClick={() => goToSlide(page + 1)}
        >
          <ChevronRight />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={buttonClass}
          aria-label="Zoom out"
          disabled={zoom <= 0.5}
          onClick={() => setZoom((value) => Math.max(0.5, value - 0.25))}
        >
          <ZoomOut />
        </Button>
        <span className="min-w-[36px] text-center tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className={buttonClass}
          aria-label="Zoom in"
          disabled={zoom >= 2}
          onClick={() => setZoom((value) => Math.min(2, value + 0.25))}
        >
          <ZoomIn />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full px-2 text-xs text-foreground hover:bg-accent hover:text-accent-foreground"
          aria-label="Fit width"
          onClick={() => setZoom(1)}
        >
          Fit width
        </Button>
      </div>
    </div>
  );
}
