import { useSyncExternalStore } from 'react';

interface DownloadState {
  pending: Map<string, Set<symbol>>;
  listeners: Set<() => void>;
}

// Copilot and Creator have separate bundles and React roots in the same page.
// Keep transfer state on that page so its chat cards see the viewer's download.
function state(): DownloadState {
  const page = globalThis as typeof globalThis & {
    __evoyaDocumentDownloads?: DownloadState;
  };
  return (page.__evoyaDocumentDownloads ??= {
    pending: new Map(),
    listeners: new Set()
  });
}

function key(url?: string): string | undefined {
  if (!url) return;
  try {
    return new URL(url, window.location.href).href;
  } catch {
    return url;
  }
}

export function beginDocumentDownload(url: string): () => void {
  const downloadKey = key(url)!;
  const downloads = state();
  const token = Symbol();
  const transfers = downloads.pending.get(downloadKey) || new Set<symbol>();
  transfers.add(token);
  downloads.pending.set(downloadKey, transfers);
  downloads.listeners.forEach((listener) => listener());
  return () => {
    if (!transfers.delete(token)) return;
    if (!transfers.size) downloads.pending.delete(downloadKey);
    downloads.listeners.forEach((listener) => listener());
  };
}

function subscribe(listener: () => void) {
  const downloads = state();
  downloads.listeners.add(listener);
  return () => downloads.listeners.delete(listener);
}

export function useDocumentDownloading(url?: string): boolean {
  const downloadKey = key(url);
  return useSyncExternalStore(
    subscribe,
    () => !!downloadKey && !!state().pending.get(downloadKey)?.size,
    () => false
  );
}
