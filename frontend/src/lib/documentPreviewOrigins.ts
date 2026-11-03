// This allowlist comes from deployment configuration, never from model output.
// The chat API and the application that serves generated files can use different origins.
export function documentPreviewOrigins(): string[] {
  const configured = import.meta.env.VITE_DOCUMENT_PREVIEW_ORIGINS || '';
  return configured.split(',').flatMap((server: string) => {
    try {
      const url = new URL(server.trim());
      return ['http:', 'https:'].includes(url.protocol) &&
        !url.username &&
        !url.password
        ? [url.origin]
        : [];
    } catch {
      return [];
    }
  });
}
