import { Download, ExternalLink, X } from 'lucide-react';
import {
  Component,
  ReactNode,
  Suspense,
  lazy,
  useContext,
  useEffect,
  useState
} from 'react';

import { ChainlitContext, type IMessageElement } from '@chainlit/react-client';

import { beginDocumentDownload } from '../../../lib/documentDownloadState';
import {
  documentDisplayName,
  documentKind,
  safeDocumentUrl
} from '../../../lib/documentPreview';
import { isApplicationDocumentUrl } from '../../../lib/externalDocumentPreview';
import { loadDocument } from '../../../lib/loadDocument';
import { Button } from '../../ui/button';
import PreviewLoading from './PreviewLoading';
import { PreviewSession } from './PreviewSession';

const loadPdfPreview = () => import('./PdfPreview');
const PdfPreview = lazy(loadPdfPreview);
const OfficePreview = lazy(() => import('./OfficePreview'));
const SpreadsheetPreview = lazy(() => import('./SpreadsheetPreview'));
const PresentationPreview = lazy(() => import('./PresentationPreview'));
const ImagePreview = lazy(() => import('./ImagePreview'));
const HtmlPreview = lazy(() => import('./HtmlPreview'));
const CodePreview = lazy(() => import('./CodePreview'));

class PreviewBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <p role="alert">
        This document could not be rendered. Download the original instead.
      </p>
    ) : (
      this.props.children
    );
  }
}

function Viewer({
  element,
  fileServer
}: {
  element: IMessageElement;
  fileServer?: string;
}) {
  const external =
    !!element.url &&
    !isApplicationDocumentUrl(element.url, fileServer ? [fileServer] : []);
  const [kind, setKind] = useState(documentKind(element));
  const [data, setData] = useState<ArrayBuffer>();
  const [sourceInfo, setSourceInfo] = useState({
    name: element.name,
    mime: element.mime
  });
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const status =
    documentKind(element) === 'image'
      ? 'Downloading image…'
      : 'Downloading document…';
  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    let active = true;
    setData(undefined);
    setError(undefined);
    const finishDownload = element.url
      ? beginDocumentDownload(element.url)
      : undefined;
    if (element.url) {
      (async () => {
        const prepareViewer = (
          resolvedKind: NonNullable<ReturnType<typeof documentKind>>
        ) => {
          if (!active) return;
          setKind(resolvedKind);
          if (resolvedKind !== 'pdf') return;
          // Loading the worker must overlap the file request rather than start
          // only after the entire download has completed.
          void loadPdfPreview()
            .then((module) => module.preparePdfWorker())
            .catch(() => {});
        };
        const expectedKind = external ? 'pdf' : documentKind(element);
        if (expectedKind) prepareViewer(expectedKind);
        return loadDocument(
          element.url!,
          controller.signal,
          fileServer,
          expectedKind,
          prepareViewer
        );
      })()
        .then((document) => {
          if (active) {
            setSourceInfo({
              name: document.filename || element.name,
              mime: document.mime || element.mime
            });
            setData(document.data);
          }
        })
        .catch((error: Error) => {
          if (active)
            setError(
              error.name === 'AbortError'
                ? 'The preview timed out. Download the original or reopen the preview to retry.'
                : error instanceof TypeError
                  ? external
                    ? 'This site could not provide a preview. Open the original instead.'
                    : 'The document could not be loaded. Open the original file to sign in or check access, then retry.'
                  : error.message
            );
        })
        .finally(() => {
          window.clearTimeout(timeout);
          finishDownload?.();
        });
    } else {
      setError('The file is not available yet.');
    }
    return () => {
      active = false;
      controller.abort();
      finishDownload?.();
      window.clearTimeout(timeout);
    };
  }, [
    element.url,
    element.name,
    element.type,
    element.mime,
    fileServer,
    external,
    attempt
  ]);
  if (error)
    return (
      <div className="p-4 text-sm text-muted-foreground">
        <p role="alert">{error}</p>
        {external && (
          <Button asChild variant="outline" className="mt-3 mr-2">
            <a
              href={safeDocumentUrl(element.url)}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
            >
              Open original
            </a>
          </Button>
        )}
        <Button
          variant="outline"
          className="mt-3"
          onClick={() => setAttempt((current) => current + 1)}
        >
          Retry preview
        </Button>
      </div>
    );
  if (!data) return <PreviewLoading label={status} />;
  if (!kind) return <p>Preview is unavailable for this file type.</p>;
  return (
    <PreviewBoundary>
      <Suspense fallback={<PreviewLoading label="Loading viewer…" />}>
        {kind === 'pdf' ? (
          <PdfPreview
            data={data}
            initialPage={element.type === 'pdf' ? element.page : undefined}
          />
        ) : kind === 'xlsx' ? (
          <SpreadsheetPreview data={data} />
        ) : kind === 'pptx' ? (
          <PresentationPreview data={data} />
        ) : kind === 'image' ? (
          <ImagePreview data={data} name={documentDisplayName(element)} />
        ) : kind === 'html' ? (
          <HtmlPreview data={data} />
        ) : kind === 'code' ? (
          <CodePreview data={data} {...sourceInfo} />
        ) : (
          <OfficePreview data={data} kind={kind} />
        )}
      </Suspense>
    </PreviewBoundary>
  );
}

export default function DocumentPreview({
  elements,
  fileServer,
  onClose,
  closeLabel = 'Close preview'
}: {
  elements: IMessageElement[];
  fileServer?: string;
  onClose?: () => void;
  closeLabel?: string;
}) {
  const client = useContext(ChainlitContext);
  const sourceServer = fileServer || client.httpEndpoint;
  const [selected, setSelected] = useState(elements[0]?.id);
  const element = elements.find((item) => item.id === selected) || elements[0];
  if (!element) return null;
  const downloadUrl = safeDocumentUrl(element.url);
  const name = documentDisplayName(element);
  const external =
    !!downloadUrl && !isApplicationDocumentUrl(downloadUrl, [sourceServer]);
  return (
    <section
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-background"
      aria-label="Document preview"
    >
      <header
        aria-label="Document header"
        className="flex min-w-0 shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b border-[#f4f4f4] bg-background p-4 text-foreground"
      >
        <div className="flex h-10 min-w-0 flex-1 items-center">
          {elements.length > 1 ? (
            <select
              aria-label="Choose document"
              className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={element.id}
              onChange={(event) => setSelected(event.target.value)}
            >
              {elements.map((item) => (
                <option key={item.id} value={item.id}>
                  {documentDisplayName(item)}
                </option>
              ))}
            </select>
          ) : (
            <span
              className="min-w-0 flex-1 truncate text-sm font-medium"
              title={name}
            >
              {name}
            </span>
          )}
        </div>
        <div
          className="flex shrink-0 items-center"
          aria-label="Document controls"
        >
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="shrink-0 text-foreground"
          >
            <a
              href={downloadUrl}
              download={name}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Download original"
              title="Download original"
            >
              <Download className="!size-5" />
              <span className="sr-only">Download original</span>
            </a>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="shrink-0 text-foreground"
          >
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open original in new tab"
              title="Open original in new tab"
            >
              <ExternalLink className="!size-5" />
            </a>
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-foreground"
              aria-label={closeLabel}
              title={closeLabel}
              onClick={onClose}
            >
              <X className="!size-5" />
              <span className="sr-only">{closeLabel}</span>
            </Button>
          )}
        </div>
      </header>
      {external && (
        <p className="shrink-0 border-b border-border px-4 py-2 text-xs text-foreground">
          Source: {new URL(downloadUrl!, window.location.href).hostname} · PDF
          preview
        </p>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <PreviewSession
          key={`${element.id}:${element.url}:${sourceServer}`}
          identity={element.url || element.id}
        >
          <Viewer
            key={`${element.id}:${element.url}:${sourceServer}`}
            element={element}
            fileServer={sourceServer}
          />
        </PreviewSession>
      </div>
    </section>
  );
}
