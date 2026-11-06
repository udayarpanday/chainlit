import { Eye } from 'lucide-react';
import type { ReactNode } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import {
  type IMessageElement,
  evoyaCreatorEnabledState,
  sideViewState
} from '@chainlit/react-client';

import { EXTERNAL_DOCUMENT_PREVIEW_KEY } from '../../lib/externalDocumentPreview';

export default function ExternalDocumentLink({
  element,
  children
}: {
  element: IMessageElement;
  children: ReactNode;
}) {
  const creatorEnabled = useRecoilValue(evoyaCreatorEnabledState);
  const setSideView = useSetRecoilState(sideViewState);
  const host = new URL(element.url!).hostname;
  const original = (
    <a
      href={element.url}
      className="text-primary hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
    >
      {children}
    </a>
  );
  if (creatorEnabled) return original;
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 align-baseline">
      {original}
      <button
        type="button"
        className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Preview document from ${host}`}
        title={`Preview a PDF from ${host}. Loads only when clicked.`}
        onClick={() =>
          setSideView({
            title: element.name,
            elements: [element],
            key: EXTERNAL_DOCUMENT_PREVIEW_KEY
          })
        }
      >
        <Eye className="size-3.5 shrink-0" aria-hidden />
        Preview <span className="truncate">· {host}</span>
      </button>
    </span>
  );
}
