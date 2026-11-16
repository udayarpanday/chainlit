import { isApplicationDocumentUrl } from './externalDocumentPreview';

// Avaia's regular file tools return a Files UI link. Its viewer downloads the
// actual file through this API using the user's existing session cookies.
export function resolveDocumentUrl(
  href: string,
  trustedServers: string[] = [],
  baseUrl = window.location.href
): URL {
  const url = new URL(href, baseUrl);
  const managerPath = /^(.*)\/files\/manage\/?$/.exec(url.pathname);
  if (
    !managerPath ||
    !isApplicationDocumentUrl(url.href, trustedServers, baseUrl)
  )
    return url;

  const folder = url.searchParams.get('path');
  const filename = url.searchParams.get('file');
  if (
    !folder ||
    !filename ||
    /[\\/\u0000]/.test(filename) ||
    filename === '.' ||
    filename === '..' ||
    /[\\\u0000]/.test(folder) ||
    folder.split('/').some((part) => part === '.' || part === '..')
  )
    return url;

  const download = new URL(`${managerPath[1]}/api/files/download/`, url.origin);
  download.searchParams.set(
    'path',
    `${folder.replace(/\/+$/, '')}/${filename}`
  );
  download.searchParams.set('intent', 'preview');
  return download;
}
