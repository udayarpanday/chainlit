import { getScopedSessionStorageItem } from '@chainlit/react-client';

import {
  type DocumentKind,
  documentKind,
  isStorageDownload
} from './documentPreview';
import { documentPreviewOrigins } from './documentPreviewOrigins';
import {
  externalPreviewUrl,
  isApplicationDocumentUrl
} from './externalDocumentPreview';

export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;

function dispositionFilename(disposition: string): string | undefined {
  const encoded = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(disposition)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded.trim().replace(/^"|"$/g, ''));
    } catch {
      // Fall back to the ordinary filename.
    }
  }
  return /filename\s*=\s*(?:"([^"]+)"|([^;]+))/i
    .exec(disposition)
    ?.slice(1)
    .find(Boolean)
    ?.trim();
}

async function retryDelay(signal: AbortSignal, milliseconds: number) {
  signal.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, milliseconds);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

async function fetchDocument(
  target: URL,
  signal: AbortSignal,
  fileServer?: string
) {
  const external = !isApplicationDocumentUrl(
    target.href,
    fileServer ? [fileServer] : []
  );
  const options = documentRequestOptions(target.href, signal, fileServer);
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(target.href, options);
      // External sites receive one request per explicit preview/retry click.
      if (external) return response;
      // A newly registered artifact can briefly be unavailable. Recover from
      // that and transient server failures, but never retry denied access.
      const transient =
        [408, 425, 429, 502, 503, 504].includes(response.status) ||
        (response.status === 404 && isStorageDownload(target));
      if (!transient || attempt >= 2) return response;
      await response.body?.cancel();
    } catch (error) {
      if (
        external ||
        signal.aborted ||
        !(error instanceof TypeError) ||
        attempt >= 2
      )
        throw error;
    }
    await retryDelay(signal, 500 * (attempt + 1));
  }
}

export function documentRequestOptions(
  url: string,
  signal: AbortSignal,
  fileServer?: string
): RequestInit {
  const target = new URL(url, window.location.href);
  if (
    !['http:', 'https:'].includes(target.protocol) ||
    target.username ||
    target.password
  )
    throw new Error('This file URL cannot be previewed.');
  if (!isApplicationDocumentUrl(target.href, fileServer ? [fileServer] : [])) {
    if (!externalPreviewUrl(target.href))
      throw new Error(
        'This address cannot be previewed. Open the original instead.'
      );
    return {
      method: 'GET',
      signal,
      mode: 'cors',
      credentials: 'omit',
      redirect: 'error',
      referrerPolicy: 'no-referrer'
    };
  }
  const server = fileServer
    ? new URL(fileServer, window.location.href)
    : undefined;
  const prefix = server?.pathname.replace(/\/$/, '') || '';
  const sameServer = server?.origin === target.origin;
  const chainlitFile =
    sameServer && target.pathname.startsWith(`${prefix}/project/file/`);
  const registeredFile =
    (sameServer &&
      (target.pathname.startsWith(`${prefix}/api/files/`) ||
        isStorageDownload(target))) ||
    (documentPreviewOrigins().includes(target.origin) &&
      (target.pathname.startsWith('/api/files/') || isStorageDownload(target)));
  const token = chainlitFile
    ? getScopedSessionStorageItem('chainlit_token')
    : null;
  return {
    signal,
    ...(token
      ? {
          headers: { Authorization: `Bearer ${token}` },
          redirect: 'error' as const
        }
      : {}),
    credentials:
      chainlitFile || registeredFile
        ? 'include'
        : target.origin === window.location.origin
          ? 'same-origin'
          : 'omit'
  };
}

export async function loadDocument(
  url: string,
  signal: AbortSignal,
  fileServer?: string,
  expectedKind?: DocumentKind,
  onHeaders?: (kind: DocumentKind) => void
): Promise<{
  data: ArrayBuffer;
  kind: DocumentKind;
  filename?: string;
  mime?: string;
}> {
  const target = new URL(url, window.location.href);
  const external = !isApplicationDocumentUrl(
    target.href,
    fileServer ? [fileServer] : []
  );
  const response = await fetchDocument(target, signal, fileServer);
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(
      response.status === 401 || response.status === 403
        ? 'You need access to this file. Open the original to sign in or check permissions, then retry.'
        : 'The file could not be loaded. Try downloading it instead.'
    );
  }
  const mime = response.headers
    .get('content-type')
    ?.split(';')[0]
    .trim()
    .toLowerCase();
  const filename = dispositionFilename(
    response.headers.get('content-disposition') || ''
  );
  if (
    external &&
    (response.redirected ||
      (mime && !['application/pdf', 'application/octet-stream'].includes(mime)))
  ) {
    await response.body?.cancel();
    throw new Error(
      'This link does not provide a direct PDF preview. Open the original instead.'
    );
  }
  const headerKind = documentKind({ type: 'file', name: filename || '', mime });
  if (
    mime === 'text/html' &&
    ((expectedKind && expectedKind !== 'html') ||
      response.redirected ||
      (!expectedKind && !documentKind({ type: 'file', name: filename || '' })))
  ) {
    await response.body?.cancel();
    throw new Error(
      'The file server returned a sign-in page instead of the document. Open the original to sign in, then retry the preview.'
    );
  }
  const kind = external ? 'pdf' : headerKind || expectedKind;
  if (!kind) {
    await response.body?.cancel();
    throw new Error('This file type is available as a download only.');
  }
  onHeaders?.(kind);
  const finish = (data: ArrayBuffer) => {
    if (
      external &&
      !/^%PDF-\d\.\d/.test(
        new TextDecoder().decode(
          new Uint8Array(data, 0, Math.min(8, data.byteLength))
        )
      )
    )
      throw new Error(
        'This response is not a PDF document. Open the original instead.'
      );
    return { data, kind, filename, mime };
  };
  if (Number(response.headers.get('content-length')) > MAX_DOCUMENT_BYTES) {
    await response.body?.cancel();
    throw new Error('Files larger than 25 MB are available as downloads only.');
  }
  const reader = response.body?.getReader();
  if (!reader) {
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_DOCUMENT_BYTES)
      throw new Error(
        'Files larger than 25 MB are available as downloads only.'
      );
    return finish(buffer);
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_DOCUMENT_BYTES)
        throw new Error(
          'Files larger than 25 MB are available as downloads only.'
        );
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel();
    throw error;
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(size);
  let offset = 0;
  chunks.forEach((chunk) => {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  });
  return finish(result.buffer);
}

export async function validateOfficeArchive(
  data: ArrayBuffer,
  kind: 'docx' | 'pptx' | 'xlsx'
) {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(data);
  const files = Object.values(zip.files);
  const expected = {
    docx: 'word/document.xml',
    pptx: 'ppt/presentation.xml',
    xlsx: 'xl/workbook.xml'
  };
  // Central-directory sizes let us reject oversized archives before renderers
  // inflate them. The byte limit alone does not protect against ZIP expansion.
  const expandedSize = files.reduce(
    (total, file) => total + ((file as any)._data?.uncompressedSize || 0),
    0
  );
  if (!zip.file(expected[kind]))
    throw new Error('This file is not a supported Office document.');
  if (files.length > 2000 || expandedSize > 80 * 1024 * 1024)
    throw new Error(
      'This document is too complex to preview. Download the original instead.'
    );
  return zip;
}

export async function presentationPreviewData(
  data: ArrayBuffer,
  archive: Awaited<ReturnType<typeof validateOfficeArchive>>
) {
  const manifest = archive.file('[Content_Types].xml');
  if (!manifest) throw new Error('The presentation manifest is missing.');
  const xml = new DOMParser().parseFromString(
    await manifest.async('text'),
    'application/xml'
  );
  if (xml.querySelector('parsererror'))
    throw new Error('The presentation manifest is invalid.');
  let changed = false;
  // Some generators declare unused masters that are absent from the ZIP. Office
  // ignores those entries; the browser viewer aborts its entire parse. Remove
  // dangling declarations from the preview copy while retaining the original.
  for (const node of [...xml.getElementsByTagNameNS('*', 'Override')]) {
    const part = node.getAttribute('PartName')?.replace(/^\//, '');
    if (part && !archive.file(part)) {
      node.remove();
      changed = true;
    }
  }
  if (!changed) return data;
  archive.file(
    '[Content_Types].xml',
    new XMLSerializer().serializeToString(xml)
  );
  return archive.generateAsync({ type: 'arraybuffer' });
}
