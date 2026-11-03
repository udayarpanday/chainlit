import DOMPurify from 'dompurify';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { useEffect, useLayoutEffect, useState } from 'react';

import { DocumentKind } from '../../../lib/documentPreview';
import { validateOfficeArchive } from '../../../lib/loadDocument';
import { Button } from '../../ui/button';
import {
  usePreviewSettings,
  usePreviewTheme,
  useRememberScroll
} from './PreviewSession';

// Scripts, external resources, forms, and document navigation are blocked. The
// same-origin flag lets our trusted renderer populate the frame, without giving
// any script embedded in the document permission to execute.
const frameHtml = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'none'; connect-src 'none'; img-src data: blob:; font-src data: blob:; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'"><style>body{margin:0;background:var(--preview-canvas,#eef1f5);color:#111827;font:14px Calibri,"Segoe UI",Arial,sans-serif}#preview{min-height:100vh}.docx-wrapper{padding:24px!important;min-height:100vh;background:var(--preview-canvas,#eef1f5)!important}.docx-wrapper>section.docx{margin-bottom:24px!important;box-shadow:0 1px 8px #1620331a!important}body[data-kind="html"] table{border-collapse:collapse;background:white}body[data-kind="html"] td,body[data-kind="html"] th{border:1px solid #d1d5db;padding:6px}</style></head><body><div id="preview"></div></body></html>`;

export default function OfficePreview({
  data,
  kind
}: {
  data: ArrayBuffer;
  kind: Extract<DocumentKind, 'docx'>;
}) {
  const theme = usePreviewTheme();
  const [saved, save] = usePreviewSettings('word', { zoom: 1 });
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null);
  const [error, setError] = useState<string>();
  const [ready, setReady] = useState(false);
  const [zoom, setZoom] = useState(Math.max(0.5, Math.min(2, saved.zoom)));
  const [fitScale, setFitScale] = useState(1);
  const [pages, setPages] = useState(0);

  useEffect(() => {
    if (!frame?.contentDocument) return;
    const doc = frame.contentDocument;
    const host = doc.getElementById('preview');
    if (!host) return;
    doc.body.dataset.kind = kind;
    let active = true;
    setReady(false);
    setError(undefined);
    const timer = window.setTimeout(() => {
      if (active)
        setError(
          'The document took too long to render. Download the original instead.'
        );
    }, 30000);
    async function render() {
      await validateOfficeArchive(data, kind);
      if (!active) return;
      if (kind === 'docx') {
        const { renderAsync } = await import('docx-preview');
        if (!active) return;
        await renderAsync(data, host!, undefined, {
          renderAltChunks: false,
          useBase64URL: true,
          ignoreLastRenderedPageBreak: false
        });
        if (!active) return;
        host!.innerHTML = DOMPurify.sanitize(host!.innerHTML, {
          // Leading style tags otherwise move into the parser's head and
          // disappear, stripping Word's page, paragraph and table formatting.
          FORCE_BODY: true,
          ADD_TAGS: ['style'],
          FORBID_TAGS: ['iframe', 'object', 'embed', 'form'],
          FORBID_ATTR: ['href', 'srcset']
        });
        setPages(host!.querySelectorAll('.docx-wrapper > section.docx').length);
      }
      if (active) setReady(true);
    }
    render()
      .catch((error) => {
        console.warn('Document preview failed', error);
        if (active)
          setError(
            'This document could not be rendered. Download the original instead.'
          );
      })
      .finally(() => window.clearTimeout(timer));
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [frame, data, kind]);

  useLayoutEffect(() => {
    if (kind !== 'docx' || !ready || !frame?.contentDocument) return;
    const wrapper =
      frame.contentDocument.querySelector<HTMLElement>('.docx-wrapper');
    const sections = [
      ...frame.contentDocument.querySelectorAll<HTMLElement>('section.docx')
    ];
    if (!wrapper || !sections.length) return;
    const fit = () => {
      const width = Math.max(...sections.map((section) => section.offsetWidth));
      if (!width) return;
      const viewport =
        frame.contentDocument?.documentElement.clientWidth || frame.clientWidth;
      const scale = Math.max(150, viewport) / (width + 48);
      setFitScale(scale);
      wrapper.style.setProperty('zoom', String(scale * zoom));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [frame, kind, ready, zoom]);
  useEffect(() => save({ zoom }), [zoom, save]);
  useEffect(
    () =>
      frame?.contentDocument?.documentElement.style.setProperty(
        '--preview-canvas',
        theme.canvas
      ),
    [frame, theme]
  );
  useRememberScroll(
    'word-scroll',
    frame?.contentDocument?.scrollingElement || null,
    ready
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {kind === 'docx' && ready && (
        <div className="flex h-10 shrink-0 items-center justify-between gap-2 border-b px-3 text-xs text-muted-foreground">
          <span>
            {pages} {pages === 1 ? 'page' : 'pages'}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Zoom out"
              disabled={zoom <= 0.5}
              onClick={() => setZoom((value) => Math.max(0.5, value - 0.1))}
            >
              <ZoomOut className="size-3.5" />
            </Button>
            <span className="w-10 text-center tabular-nums">
              {Math.round(fitScale * zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Zoom in"
              disabled={zoom >= 2}
              onClick={() => setZoom((value) => Math.min(2, value + 0.1))}
            >
              <ZoomIn className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-7 text-xs"
              onClick={() => setZoom(1)}
            >
              Fit width
            </Button>
          </div>
        </div>
      )}
      {error ? (
        <p role="alert" className="p-4 text-sm">
          {error}
        </p>
      ) : (
        <>
          {!ready && (
            <p role="status" className="p-3 text-sm">
              Rendering document…
            </p>
          )}
          <iframe
            title={`${kind.toUpperCase()} preview`}
            className="min-h-[400px] w-full flex-1 border-0 bg-white"
            sandbox="allow-same-origin"
            referrerPolicy="no-referrer"
            srcDoc={frameHtml}
            onLoad={(event) => setFrame(event.currentTarget)}
          />
        </>
      )}
    </div>
  );
}
