import type { IMessageElement } from '@chainlit/react-client';

import { documentKind, safeDocumentUrl } from './documentPreview';
import {
  EXTERNAL_DOCUMENT_PREVIEW_KEY,
  externalPreviewUrl
} from './externalDocumentPreview';

export interface DocumentPreviewRequest {
  title: string;
  elements: IMessageElement[];
  fileServer?: string;
  key?: string;
}

export function isDocumentPreviewRequest(
  value: unknown
): value is DocumentPreviewRequest {
  const request = value as DocumentPreviewRequest | undefined;
  return (
    !!request &&
    typeof request.title === 'string' &&
    (request.fileServer === undefined ||
      (typeof request.fileServer === 'string' &&
        !!safeDocumentUrl(request.fileServer))) &&
    Array.isArray(request.elements) &&
    request.elements.length > 0 &&
    request.elements.every(
      (element) =>
        element &&
        typeof element.id === 'string' &&
        typeof element.name === 'string' &&
        (documentKind(element) ||
          (request.key === 'document-preview' && element.type === 'file') ||
          (request.key === EXTERNAL_DOCUMENT_PREVIEW_KEY &&
            element.type === 'file' &&
            !!element.url &&
            externalPreviewUrl(element.url))) &&
        safeDocumentUrl(element.url)
    )
  );
}
