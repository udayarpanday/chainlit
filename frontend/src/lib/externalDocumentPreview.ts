import type { IMessageElement } from '@chainlit/react-client';

import { documentPreviewOrigins } from './documentPreviewOrigins';

export const EXTERNAL_DOCUMENT_PREVIEW_KEY = 'external-document-preview';

export function isApplicationDocumentUrl(
  href: string,
  servers: string[] = [],
  baseUrl = window.location.href
) {
  try {
    const url = new URL(href, baseUrl);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return false;
    return [baseUrl, ...servers, ...documentPreviewOrigins()].some((server) => {
      try {
        return new URL(server, baseUrl).origin === url.origin;
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

// This validates the URL's syntax without issuing DNS or metadata requests.
// Browser code cannot verify the IP a domain resolves to; no server fetcher is
// involved. Reject obvious local targets, IP literals, and nonstandard ports.
export function externalPreviewUrl(href: string): URL | undefined {
  if (/\u200b|%e2%80%8b/i.test(href)) return;
  try {
    const url = new URL(href, window.location.href);
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      (url.port && url.port !== '443') ||
      !host.includes('.') ||
      host.includes(':') ||
      /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
      /(?:^|\.)(?:localhost|local|internal|intranet|lan|home|home\.arpa|test|invalid|onion)$/.test(
        host
      )
    )
      return;
    return url;
  } catch {
    return;
  }
}

function hasPdfHint(url: URL, label: string): boolean {
  if (/\bpdf\b/i.test(label)) return true;
  let path = url.pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    // An invalid path escape must not break ordinary link rendering.
  }
  if (/(?:\.pdf|\/pdf)\/?$/i.test(path)) return true;
  return [...url.searchParams].some(
    ([key, value]) =>
      /^(?:file(?:name)?|name|path|format|output|type|mime(?:type)?|content-type|response-content-type)$/i.test(
        key
      ) && /(?:\.pdf$|^pdf$|^application\/pdf$)/i.test(value.trim())
  );
}

// Offer explicit previews only for links with a PDF hint, leaving ordinary
// websites alone. Hints never replace response validation after a click, and
// link rendering must never issue DNS, metadata, or download requests.
export function externalDocumentFromLink(
  href: string,
  label: string,
  servers: string[] = []
): IMessageElement | undefined {
  if (isApplicationDocumentUrl(href, servers)) return;
  const url = externalPreviewUrl(href);
  if (!url || !hasPdfHint(url, label)) return;
  return {
    id: `external-document:${url.href}`,
    type: 'file',
    name: label.trim() || url.hostname,
    url: url.href,
    forId: '',
    display: 'side'
  };
}
