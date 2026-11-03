import DOMPurify from 'dompurify';

const contentPolicy =
  "default-src 'none'; script-src 'none'; connect-src 'none'; img-src data: blob:; font-src data: blob:; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'";

export function htmlPreviewDocument(data: ArrayBuffer): string {
  // Preserve the complete document so head styles and body attributes survive.
  const clean = DOMPurify.sanitize(new TextDecoder().decode(data), {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ['style'],
    FORBID_TAGS: ['form', 'iframe', 'object', 'embed', 'meta', 'link', 'base'],
    FORBID_ATTR: ['href', 'srcset', 'action', 'formaction']
  });
  const document = new DOMParser().parseFromString(clean, 'text/html');
  // Older local downloads may already contain injected Django developer panels.
  document.querySelectorAll('#djDebug').forEach((toolbar) => toolbar.remove());

  const policy = document.createElement('meta');
  policy.httpEquiv = 'Content-Security-Policy';
  policy.content = contentPolicy;
  const defaults = document.createElement('style');
  defaults.textContent = `html{color-scheme:light}body{margin:24px;background:#fff;color:#111827;font:14px/1.5 system-ui,"Segoe UI",Arial,sans-serif}img{max-width:100%;height:auto}table{border-collapse:collapse}td,th{border:1px solid #d1d5db;padding:8px 12px}th{background:#f8fafc;text-align:left}`;
  // Authored styles follow these defaults and retain their normal precedence.
  // The policy precedes every resource-bearing element in the resulting frame.
  document.head.prepend(policy, defaults);
  return `<!doctype html>${document.documentElement.outerHTML}`;
}
