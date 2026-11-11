import {
  type ChainlitAPI,
  getScopedSessionStorageItem
} from '@chainlit/react-client';

import { externalPreviewUrl } from './externalDocumentPreview';

export interface ImportedPdfSource {
  url: string;
  httpHeaders: Record<string, string>;
  withCredentials: boolean;
}

export async function importExternalPdf(
  client: Pick<ChainlitAPI, 'fetch' | 'buildEndpoint'>,
  url: string,
  signal: AbortSignal
): Promise<{ source: ImportedPdfSource; filename: string }> {
  const external = externalPreviewUrl(url);
  if (!external) throw new Error('This address cannot be previewed.');
  const token = getScopedSessionStorageItem('chainlit_token');
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};
  const response = await client.fetch(
    'POST',
    '/project/document-preview/imports',
    { url: external.href },
    signal,
    headers
  );
  const imported = await response.json();
  // Construct the file route locally. Never use a response-supplied URL as a
  // destination for application credentials, or persist source URLs/tokens.
  if (
    !imported ||
    typeof imported.id !== 'string' ||
    !/^[a-f0-9]{64}$/.test(imported.id) ||
    typeof imported.filename !== 'string'
  )
    throw new Error('The preview service returned an invalid file response.');
  return {
    filename: imported.filename,
    source: {
      url: client.buildEndpoint(
        `/project/document-preview/imports/${imported.id}/file`
      ),
      httpHeaders: headers,
      withCredentials: !token
    }
  };
}
