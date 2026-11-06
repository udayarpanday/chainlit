import { fromMarkdown } from 'mdast-util-from-markdown';

import type { IMessageElement, IStep } from '@chainlit/react-client';

import { textFileInfo } from './codePreview';
import { documentPreviewOrigins } from './documentPreviewOrigins';
import { isApplicationDocumentUrl } from './externalDocumentPreview';

export type DocumentKind =
  'pdf' | 'docx' | 'pptx' | 'xlsx' | 'html' | 'image' | 'code';

const imageMimes: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp'
};

export function imageFileExtension(
  element: Pick<IMessageElement, 'name' | 'mime'>
): string | undefined {
  const extension = /\.(png|jpe?g|webp)$/i
    .exec(element.name)?.[1]
    .toLowerCase();
  if (extension) return extension;
  const mime = element.mime?.split(';')[0].trim().toLowerCase();
  return Object.keys(imageMimes).find(
    (extension) => imageMimes[extension] === mime
  );
}

export function safeDocumentUrl(href?: string): string | undefined {
  if (!href) return;
  try {
    const url = new URL(href, window.location.href);
    if (
      ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password
    )
      return href;
  } catch {
    return;
  }
}

const mimeKinds: Record<string, DocumentKind> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation':
    'pptx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/html': 'html',
  'image/png': 'image',
  'image/jpeg': 'image',
  'image/webp': 'image'
};

export function documentKind(
  element: Pick<IMessageElement, 'type' | 'name' | 'mime'>
): DocumentKind | undefined {
  // Chainlit can publish named text files as Text elements rather than File
  // elements. Leave ordinary titled inline text in its existing renderer.
  if (element.type === 'text')
    return textFileInfo({ name: element.name }) ? 'code' : undefined;
  if (!['pdf', 'file', 'image'].includes(element.type)) return;
  if (element.type === 'pdf') return 'pdf';
  const mime = element.mime?.split(';')[0].trim().toLowerCase();
  if (
    element.type === 'image' &&
    mime?.startsWith('image/') &&
    !mimeKinds[mime]
  )
    return;
  if (mime && mimeKinds[mime]) return mimeKinds[mime];
  if (imageFileExtension(element)) return 'image';
  if (element.type === 'image') {
    // Typed images need not include a filename extension. Explicitly unsupported
    // formats keep their existing image handling rather than being relabeled.
    if (/\.(svgz?|gif|avif|bmp|ico|tiff?|heic|heif)$/i.test(element.name))
      return;
    return 'image';
  }
  const extension = element.name.split('.').pop()?.toLowerCase();
  if (extension === 'htm') return 'html';
  if (['pdf', 'docx', 'pptx', 'xlsx', 'html'].includes(extension || '')) {
    return extension as DocumentKind;
  }
  if (textFileInfo(element)) return 'code';
}

export function documentDisplayName(
  element: Pick<IMessageElement, 'type' | 'name' | 'mime'>
): string {
  const kind = documentKind(element);
  if (kind === 'code') return element.name || 'Source file';
  if (kind === 'image') {
    if (/\.[a-z\d]{1,8}$/i.test(element.name)) return element.name;
    const extension = imageFileExtension(element);
    if (!extension) return element.name || 'Image';
    const title = element.name
      .replace(/^download\s+/i, '')
      .replace(/\s+(png|jpe?g|webp|image)$/i, '')
      .trim();
    return `${title || 'Image'}.${extension}`;
  }
  if (!kind || /\.(pdf|docx|pptx|xlsx|html?)$/i.test(element.name))
    return element.name;
  const title = element.name
    .replace(/^download\s+/i, '')
    .replace(new RegExp(`\\s+${kind}$`, 'i'), '')
    .trim();
  return `${title || 'Document'}.${kind}`;
}

// Only preview links hosted by this application or its configured API server.
// A model-generated label must not cause requests to an unrelated third party.
export function documentFromLink(
  href: string,
  label: string,
  forId = '',
  baseUrl = window.location.href,
  trustedServers: string[] = [],
  includeOpaque = false,
  imageHint = false
): IMessageElement | undefined {
  // The streaming cursor can temporarily become part of an unfinished link.
  // Never turn that partial signed URL into a preview request or file card.
  if (/\u200b|%e2%80%8b/i.test(href)) return;
  try {
    const url = new URL(href, baseUrl);
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      (url.origin !== new URL(baseUrl).origin &&
        ![...trustedServers, ...documentPreviewOrigins()].some(
          (server) => url.origin === new URL(server, baseUrl).origin
        )) ||
      url.username ||
      url.password
    )
      return;
    const filePath =
      url.searchParams.get('path') ||
      url.searchParams.get('filename') ||
      decodeURIComponent(url.pathname);
    const pathName = filePath.split('/').pop() || '';
    const isDownload =
      /\/api\/files\//.test(url.pathname) ||
      /\/project\/file\//.test(url.pathname) ||
      isStorageDownload(url);
    const pathKind = documentKind({ type: 'file', name: pathName });
    const name = pathKind ? pathName : isDownload ? label : '';
    const labelFormat = isDownload
      ? /\b(pdf|docx|pptx|xlsx|html|png|jpe?g|webp|md|markdown|txt)\b/i
          .exec(label)?.[1]
          .toLowerCase()
      : undefined;
    const textMime =
      labelFormat === 'md' || labelFormat === 'markdown'
        ? 'text/markdown'
        : labelFormat === 'txt'
          ? 'text/plain'
          : undefined;
    const labelKind =
      labelFormat && imageMimes[labelFormat]
        ? 'image'
        : textMime
          ? 'code'
          : (labelFormat as DocumentKind | undefined);
    const isImageDownload =
      (isStorageDownload(url) && url.searchParams.get('type') === 'image') ||
      (imageHint && isDownload);
    const kind =
      documentKind({ type: 'file', name }) ||
      labelKind ||
      (isImageDownload ? 'image' : undefined);
    if (!kind && !(includeOpaque && isDownload)) return;
    return {
      id: `document:${forId}:${url.href}`,
      type: kind === 'pdf' ? 'pdf' : kind === 'image' ? 'image' : 'file',
      name: name || label || 'Generated document',
      ...(labelFormat && !pathKind && labelKind === kind
        ? {
            mime:
              imageMimes[labelFormat] ||
              textMime ||
              Object.entries(mimeKinds).find(([, value]) => value === kind)?.[0]
          }
        : {}),
      forId,
      display: 'side',
      url: url.href
    };
  } catch {
    return;
  }
}

export function isStorageDownload(url: URL): boolean {
  return (
    /\/(?:app\/)?storage\/download\/[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}\/?$/i.test(
      url.pathname
    ) &&
    ['fileregistry', 'code_interpreter', 'file', 'image'].includes(
      url.searchParams.get('type') || ''
    )
  );
}

export function documentsFromMarkdown(
  output: string,
  forId: string,
  baseUrl?: string,
  trustedServers: string[] = [],
  includeOpaque = false
): IMessageElement[] {
  const tree = fromMarkdown(output);
  const definitions = new Map<string, string>();
  const documents = new Map<string, IMessageElement>();
  interface MarkdownNode {
    type: string;
    value?: string;
    alt?: string | null;
    children?: MarkdownNode[];
    identifier?: string;
    url?: string;
  }
  const text = (node: MarkdownNode): string =>
    node.alt || node.value || node.children?.map(text).join('') || '';
  const walk = (node: MarkdownNode, visit: (node: MarkdownNode) => void) => {
    visit(node);
    node.children?.forEach((child) => walk(child, visit));
  };
  walk(tree, (node) => {
    if (node.type === 'definition' && node.identifier && node.url)
      definitions.set(node.identifier, node.url);
  });
  walk(tree, (node) => {
    const href =
      node.type === 'link' || node.type === 'image'
        ? node.url
        : (node.type === 'linkReference' || node.type === 'imageReference') &&
            node.identifier
          ? definitions.get(node.identifier)
          : undefined;
    if (!href) return;
    const document = documentFromLink(
      href,
      text(node),
      forId,
      baseUrl,
      trustedServers,
      includeOpaque,
      node.type === 'image' || node.type === 'imageReference'
    );
    if (document) documents.set(document.url!, document);
  });
  return [...documents.values()];
}

export function messageDocuments(
  message: IStep,
  elements: IMessageElement[],
  trustedServers: string[] = [],
  includeOpaque = false
): IMessageElement[] {
  const attached = elements.filter(
    (element) =>
      element.forId === message.id &&
      documentKind(element) &&
      safeDocumentUrl(element.url) &&
      isApplicationDocumentUrl(element.url!, trustedServers)
  );
  const linked = documentsFromMarkdown(
    message.output || '',
    message.id,
    undefined,
    trustedServers,
    includeOpaque
  );
  return [
    ...attached,
    ...linked.filter(
      (link) => !attached.some((element) => element.url === link.url)
    )
  ];
}
