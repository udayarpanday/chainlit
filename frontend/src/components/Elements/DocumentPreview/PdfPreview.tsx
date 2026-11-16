/// <reference types="vite/client" />
import {
  ChevronLeft,
  ChevronRight,
  PanelLeft,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { Document, Page, Thumbnail, pdfjs } from 'react-pdf';

import textLayerCss from 'react-pdf/dist/Page/TextLayer.css?raw';

import type { ImportedPdfSource } from '../../../lib/importExternalPdf';
import { escapeSource, markedText } from '../../../lib/previewSearch';
import { Button } from '../../ui/button';
import PreviewLoading from './PreviewLoading';
import PreviewSearch, { searchStyles } from './PreviewSearch';
import { usePreviewSettings, usePreviewTheme } from './PreviewSession';
import { type PdfPageSearch, usePdfSearch } from './usePdfSearch';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
let sharedWorker: InstanceType<typeof pdfjs.PDFWorker> | undefined;

// Overlap worker startup with downloading; each Document owns its loading task.
export function preparePdfWorker() {
  if (sharedWorker && !sharedWorker.destroyed) return sharedWorker;
  const worker = new pdfjs.PDFWorker();
  sharedWorker = worker;
  void worker.promise.catch(() => {
    worker.destroy();
    if (sharedWorker === worker) sharedWorker = undefined;
  });
  return worker;
}

function ContinuousPage({
  number,
  width,
  aspect,
  visible,
  onError,
  search
}: {
  number: number;
  width: number;
  aspect: number;
  visible: boolean;
  onError: () => void;
  search?: PdfPageSearch;
}) {
  const [measuredAspect, setMeasuredAspect] = useState<number>();
  const renderText = useCallback(
    ({ str, itemIndex }: { str: string; itemIndex: number }) =>
      search
        ? markedText(str, search.matches, search.offsets[itemIndex])
        : escapeSource(str),
    [search]
  );
  return (
    <div
      style={{
        position: 'relative',
        width,
        minHeight: Math.ceil(width * (measuredAspect ?? aspect)),
        background: '#fff'
      }}
    >
      {visible && (
        <Page
          pageNumber={number}
          width={width}
          renderTextLayer
          customTextRenderer={renderText}
          renderAnnotationLayer={false}
          onLoadSuccess={(page) => {
            const size = page.getViewport({ scale: 1 });
            setMeasuredAspect(size.height / size.width);
          }}
          onLoadError={onError}
          onRenderError={onError}
          loading={
            <PreviewLoading
              label={`Rendering page ${number}…`}
              style={{ color: '#374151' }}
            />
          }
        />
      )}
    </div>
  );
}

export default function PdfPreview({
  data,
  source,
  initialPage = 1
}: {
  data?: ArrayBuffer;
  source?: ImportedPdfSource;
  initialPage?: number;
}) {
  const file = useMemo(
    () =>
      source || (data ? { data: new Uint8Array(data.slice(0)) } : undefined),
    [data, source]
  );
  const options = useMemo(
    () => ({
      worker: preparePdfWorker(),
      isEvalSupported: false,
      // Imported PDFs support authenticated local ranges. Avoid downloading the
      // entire stored PDF before first paint or automatically fetching all of it.
      rangeChunkSize: 256 * 1024,
      disableAutoFetch: true,
      disableStream: true
    }),
    []
  );
  const [pages, setPages] = useState(0);
  const theme = usePreviewTheme();
  const [saved, save] = usePreviewSettings('pdf', {
    page: initialPage,
    offset: 0,
    zoom: 1,
    thumbnails: false as boolean
  });
  const [page, setPage] = useState(saved.page);
  const currentPage = useRef(saved.page);
  const offset = useRef(saved.offset);
  const [scale, setScale] = useState(Math.max(0.5, Math.min(2, saved.zoom)));
  const [aspect, setAspect] = useState(Math.SQRT2);
  const [thumbnails, setThumbnails] = useState(saved.thumbnails);
  const [pdf, setPdf] = useState<PDFDocumentProxy>();
  const [error, setError] = useState(false);
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(new Set<number>());
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const fail = useCallback(() => setError(true), []);
  const hasWidth = width > 0;

  useLayoutEffect(() => {
    // PDF.js caches a measurement canvas in document.body, outside the widget's
    // shadow root. Keep its hiding rule in the document even after unmount.
    const id = 'evoya-pdf-global-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.textContent =
      ':root{--react-pdf-text-layer:1}canvas.hiddenCanvasElement{position:absolute;top:0;left:0;width:0;height:0;display:none}';
    document.head.append(style);
  }, []);

  useEffect(() => {
    if (!root) return;
    const measure = () => setWidth(Math.max(1, root.clientWidth - 32));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [root]);

  const goToPage = useCallback(
    (number: number, fraction = 0) => {
      const next = Math.max(1, Math.min(pages, number));
      const target = nodes.current[next - 1];
      if (!root || !target) return;
      currentPage.current = next;
      offset.current = fraction;
      setPage(next);
      save({ page: next, offset: fraction });
      root.scrollTo({
        top:
          root.scrollTop +
          target.getBoundingClientRect().top -
          root.getBoundingClientRect().top -
          16 +
          target.getBoundingClientRect().height * fraction
      });
    },
    [root, pages, save]
  );

  useLayoutEffect(() => {
    if (pages) goToPage(currentPage.current, offset.current);
  }, [width, scale, pages, goToPage]);
  useEffect(() => save({ zoom: scale, thumbnails }), [scale, thumbnails, save]);
  const search = usePdfSearch(pdf, root, goToPage);

  useEffect(() => {
    if (!root || !pages || !hasWidth) return;
    // Reserve every page's position, but keep canvases only near the viewport.
    const observer = new IntersectionObserver(
      (entries) => {
        setVisible((current) => {
          const next = new Set(current);
          for (const entry of entries) {
            const number = Number(
              (entry.target as HTMLElement).dataset.pdfPage
            );
            if (entry.isIntersecting) next.add(number);
            else next.delete(number);
          }
          return next;
        });
      },
      { root, rootMargin: '800px 0px' }
    );
    nodes.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [root, pages, hasWidth]);

  useEffect(() => {
    if (!root || !pages) return;
    let pending = 0;
    const update = () => {
      pending = 0;
      const record = (number: number) => {
        currentPage.current = number;
        const node = nodes.current[number - 1];
        if (node)
          offset.current =
            (root.getBoundingClientRect().top +
              16 -
              node.getBoundingClientRect().top) /
            node.getBoundingClientRect().height;
        save({ page: number, offset: offset.current });
        setPage(number);
      };
      if (
        root.scrollTop > 0 &&
        root.scrollTop >= root.scrollHeight - root.clientHeight - 2
      ) {
        record(pages);
        return;
      }
      const position =
        root.getBoundingClientRect().top +
        (search.total
          ? root.clientHeight / 2
          : Math.min(120, root.clientHeight / 4));
      // Page positions remain ordered; avoid scanning a long document on scroll.
      let low = 0,
        high = pages - 1;
      while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (
          (nodes.current[middle]?.getBoundingClientRect().bottom ?? Infinity) <=
          position
        )
          low = middle + 1;
        else high = middle;
      }
      record(low + 1);
    };
    const onScroll = () => {
      if (!pending) pending = requestAnimationFrame(update);
    };
    root.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      root.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(pending);
    };
  }, [root, pages, save, search.total]);

  if (error)
    return (
      <p role="alert" className="p-4 text-sm">
        This PDF could not be rendered. Download the original instead.
      </p>
    );
  const buttonClass =
    'size-8 rounded-full text-foreground hover:bg-accent hover:text-accent-foreground';
  return (
    <Document
      file={file}
      options={options}
      onLoadSuccess={async (document) => {
        try {
          const first = await document.getPage(1);
          const size = first.getViewport({ scale: 1 });
          const start = Math.max(1, Math.min(saved.page, document.numPages));
          currentPage.current = start;
          setPdf(document);
          setAspect(size.height / size.width);
          setVisible(new Set([start]));
          setPage(start);
          setPages(document.numPages);
        } catch {
          fail();
        }
      }}
      onLoadError={fail}
      loading={<PreviewLoading label="Loading PDF…" />}
      className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
      onKeyDown={(event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === 'f'
        ) {
          event.preventDefault();
          (
            event.currentTarget.querySelector(
              '[aria-label="Find in preview"]'
            ) as HTMLInputElement | null
          )?.focus();
        }
      }}
    >
      <style>{textLayerCss + searchStyles}</style>
      <PreviewSearch
        query={search.query}
        onQuery={search.setQuery}
        active={search.active}
        total={search.total}
        busy={search.busy}
        onMove={search.move}
      />
      {search.error && (
        <p role="status" className="p-2 text-xs">
          Search could not read this PDF's text.
        </p>
      )}
      <div
        className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full border p-1.5 text-xs shadow-sm"
        style={{
          background: theme.surface,
          color: theme.text,
          borderColor: theme.border,
          width: 'max-content',
          maxWidth: 'calc(100% - 16px)',
          flexWrap: 'wrap',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}
        aria-label="PDF controls"
      >
        {pages > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className={buttonClass}
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
        )}
        <span aria-live="polite" className="px-2 tabular-nums">
          Page {page} of {pages || '…'}
        </span>
        {pages > 1 && (
          <Button
            variant="ghost"
            size="icon"
            className={buttonClass}
            disabled={page >= pages}
            onClick={() => goToPage(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
        )}
        <span
          className="mx-1 h-4 w-px"
          style={{ background: theme.border }}
          aria-hidden
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-8 rounded-full px-2 text-xs text-foreground hover:bg-accent hover:text-accent-foreground"
          onClick={() => setScale(1)}
          aria-label="Fit width"
        >
          Fit width
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={buttonClass}
          disabled={scale <= 0.5}
          onClick={() => setScale((value) => Math.max(0.5, value - 0.25))}
          aria-label="Zoom out"
        >
          <ZoomOut />
        </Button>
        <span className="min-w-[36px] text-center tabular-nums">
          {Math.round(scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon"
          className={buttonClass}
          disabled={scale >= 2}
          onClick={() => setScale((value) => Math.min(2, value + 0.25))}
          aria-label="Zoom in"
        >
          <ZoomIn />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={buttonClass}
          aria-label="Thumbnails"
          title="Thumbnails"
          aria-pressed={thumbnails}
          onClick={() => setThumbnails(!thumbnails)}
        >
          <PanelLeft />
          <span className="sr-only">Thumbnails</span>
        </Button>
      </div>
      <div
        className="flex min-h-0 min-w-0 flex-1 overflow-hidden"
        style={{
          background: theme.canvas,
          colorScheme: theme.dark ? 'dark' : 'light'
        }}
      >
        {thumbnails && (
          <div
            className="flex shrink-0 flex-col gap-2 overflow-auto border-r p-2"
            style={{ color: theme.text, borderColor: theme.border }}
            aria-label="Page thumbnails"
          >
            {Array.from({ length: Math.min(pages, 100) }, (_, index) => (
              <Thumbnail
                key={index}
                pageNumber={index + 1}
                width={70}
                onItemClick={() => goToPage(index + 1)}
              />
            ))}
            {pages > 100 && <span className="text-xs">First 100 pages</span>}
          </div>
        )}
        <div
          ref={setRoot}
          tabIndex={0}
          aria-label="PDF pages"
          className="min-h-0 min-w-0 flex-1 overflow-auto"
          style={{
            overscrollBehavior: 'contain',
            scrollbarGutter: 'stable',
            overflowX: scale > 1 ? 'auto' : 'hidden'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              width: '100%',
              minWidth: scale > 1 ? Math.floor(width * scale) + 32 : undefined,
              padding: '16px 16px 128px',
              boxSizing: 'border-box'
            }}
          >
            {Array.from({ length: width ? pages : 0 }, (_, index) => (
              <div
                key={index}
                ref={(node) => {
                  nodes.current[index] = node;
                }}
                data-pdf-page={index + 1}
                role="group"
                aria-label={'Page ' + (index + 1)}
              >
                <ContinuousPage
                  number={index + 1}
                  width={Math.floor(width * scale)}
                  aspect={aspect}
                  visible={visible.has(index + 1)}
                  onError={fail}
                  search={search.byPage.get(index + 1)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Document>
  );
}
