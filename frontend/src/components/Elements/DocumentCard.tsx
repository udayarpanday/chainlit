import {
  Download,
  FileCode,
  FileText,
  Image as ImageIcon,
  LoaderCircle
} from 'lucide-react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import {
  IMessageElement,
  evoyaCreatorEnabledState,
  sideViewState
} from '@chainlit/react-client';

import { textFileInfo } from '../../lib/codePreview';
import { useDocumentDownloading } from '../../lib/documentDownloadState';
import {
  documentDisplayName,
  documentKind,
  imageFileExtension,
  safeDocumentUrl
} from '../../lib/documentPreview';

export function DocumentCard({ element }: { element: IMessageElement }) {
  const setSideView = useSetRecoilState(sideViewState);
  const creatorEnabled = useRecoilValue(evoyaCreatorEnabledState);
  const downloading = useDocumentDownloading(element.url);
  const downloadUrl = safeDocumentUrl(element.url);
  const name = documentDisplayName(element);
  const kind = documentKind(element);
  const Icon =
    kind === 'image' ? ImageIcon : kind === 'code' ? FileCode : FileText;
  const format =
    kind === 'image'
      ? imageFileExtension(element)?.toUpperCase() || 'Image'
      : kind === 'code'
        ? textFileInfo(element)?.extension?.toUpperCase() ||
          textFileInfo(element)?.label ||
          'Text'
        : kind?.toUpperCase();
  const accent =
    kind === 'pdf'
      ? 'text-red-500'
      : kind === 'xlsx'
        ? 'text-emerald-600'
        : kind === 'pptx'
          ? 'text-orange-500'
          : kind === 'image'
            ? 'text-violet-500'
            : 'text-blue-500';
  const fileLabel = (
    <>
      <span
        className={`flex w-7 shrink-0 flex-col items-center gap-0.5 ${accent}`}
        aria-hidden
      >
        <Icon className="size-5" />
        <span className="text-[8px] font-bold leading-none">
          {format || 'FILE'}
        </span>
      </span>
      <span
        className="min-w-0 truncate font-semibold text-foreground"
        title={name}
      >
        {name}
      </span>
    </>
  );
  const labelClass =
    'flex min-w-0 flex-1 items-center gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring';
  return (
    <span
      className="group my-3 flex w-full max-w-[480px] items-center overflow-hidden rounded-2xl border border-border/80 bg-muted/40 text-sm transition-colors hover:bg-muted/70"
      data-testid="document-card"
    >
      {creatorEnabled ? (
        <a
          className={labelClass}
          href={downloadUrl}
          download={name}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Download ${name}`}
        >
          {fileLabel}
        </a>
      ) : (
        <button
          type="button"
          disabled={!downloadUrl}
          className={labelClass}
          onClick={() =>
            setSideView({
              title: name,
              elements: [element],
              key: 'document-preview'
            })
          }
          aria-label={`Preview ${name}`}
        >
          {fileLabel}
        </button>
      )}
      {downloading ? (
        <span
          className="mr-2 flex size-9 shrink-0 items-center justify-center text-muted-foreground"
          role="status"
          aria-label={`Downloading ${name}`}
        >
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        </span>
      ) : (
        <a
          className="mr-2 flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href={downloadUrl}
          download={name}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Download ${name}`}
        >
          <Download className="size-4" aria-hidden />
        </a>
      )}
    </span>
  );
}
