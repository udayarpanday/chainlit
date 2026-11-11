Generated documents can be served by a different application from Chainlit. Set
`VITE_DOCUMENT_PREVIEW_ORIGINS` to the trusted file-server origins (comma separated)
when building the frontend and copilot. The local builds use
`http://localhost:8000`; chat runs on `http://localhost:7000`.

External HTTPS links offer a separate, click-only Preview action only when the
path, a file/type query parameter, or the visible label indicates a PDF. Ordinary
website links have no Preview button. The action displays the destination
hostname and works without a domain allowlist, including PDF service URLs such
as `/extract/pdf/` and opaque URLs explicitly labeled PDF. These hints do not
confirm the response type; validation still happens on click. Opaque links with
no PDF hint remain ordinary links. Link rendering and streaming issue no metadata
requests. External links and external attachments
are excluded from automatic document discovery; Creator offers no external
preview action. Application file servers retain the configured origin list for
authenticated downloads.

External PDFs use a backend import flow. A Preview click posts the source URL to
the authenticated Chainlit `/project/document-preview/imports` endpoint. The
backend downloads and validates the file, stores a temporary user-private copy,
and returns a cache identifier. PDF.js loads byte ranges from the authenticated
`/project/document-preview/imports/{id}/file` route instead of downloading the
entire cached PDF into browser memory first. GET and HEAD never fetch remote
content. Reopening posts to the same endpoint and reuses an unexpired cached
copy without another source download. Concurrent imports of the same URL by the
same user share a filesystem reservation, including across workers using the
same cache volume. Source fragments are excluded from the cache identity;
signed query parameters are preserved when requesting the source.

The source server does not need CORS support. Only HTTPS on the standard port is
accepted; URL credentials, IP literals, common local hostnames, and non-public
DNS answers are rejected. Every DNS answer must be public, and connections are
pinned to a checked IP while retaining the original TLS certificate hostname
and HTTP Host. Up to three redirects are followed, validating and resolving
each destination again. The downloader ignores proxy environment settings and
forwards no user cookies, Authorization, or referrer. Remote cookies are not
reused between hops. HTTPX request logs for the downloader are suppressed so
signed source URLs are not logged. As defense in depth, deployments should also
restrict downloader egress to public networks.

Validation checks the response type, streamed byte count, PDF signature, and
end-of-file marker; it does not certify a document as harmless. PDF.js eval
support remains disabled. Unsupported responses, denied access, and failed
downloads retain Open original and explicit Retry preview actions. There is no
per-link metadata request, remote range proxy, or automatic download retry.
The remote site sees the backend's IP. Public PDFs only are imported; login-only
files and websites that reject backend downloads still need a fallback.

Cache reads and imports require a signed-in Chainlit user, even if the app
otherwise permits anonymous chat. Files are scoped to that user's identifier,
not shared automatically with other users or added to the AI context. The
private cache is inside `.files/document-preview-imports`, uses hashed directory
and file identifiers, and does not persist source URLs or authentication tokens.
Expiry is enforced on every read; a minute-based cleanup removes expired files
and abandoned partial downloads. Active imports reserve their maximum permitted
size against storage quotas. The cache is temporary and can be cleared when
Chainlit shuts down.

Backend environment settings (values shown are defaults):

| Setting | Default | Purpose |
| --- | --- | --- |
| `CHAINLIT_EXTERNAL_PDF_MAX_MB` | `100` | Maximum imported PDF size, configurable from 1 to 500 MiB |
| `CHAINLIT_EXTERNAL_PDF_TTL_SECONDS` | `3600` | Cache lifetime, from 300 to 86400 seconds |
| `CHAINLIT_EXTERNAL_PDF_TIMEOUT_SECONDS` | `120` | Download deadline, from 10 to 300 seconds |
| `CHAINLIT_EXTERNAL_PDF_CACHE_MB` | `1024` | Total cache budget |
| `CHAINLIT_EXTERNAL_PDF_USER_CACHE_MB` | `300` | Per-user cache budget |
| `CHAINLIT_EXTERNAL_PDF_REQUESTS_PER_MINUTE` | `10` | New import attempts per user per worker; cache hits do not consume this budget |
| `CHAINLIT_EXTERNAL_PDF_CONCURRENCY` | `4` | Simultaneous source downloads per worker |

Keep the cache budgets at least as large as the maximum file size. Multiple
workers/replicas need the same private `.files` volume for shared cache access
and deduplication; otherwise use instance affinity. Rate/concurrency counters are
per worker; apply a gateway-wide limit when scaling horizontally. Reverse proxy
POST timeouts must allow the configured import deadline plus a 15-second
reservation margin. Authenticated file routes must not be publicly cached or
have their range/identity-encoding headers altered. The range route exposes the
headers needed by cross-origin copilot clients through the existing app CORS
policy.

Deploy the updated Chainlit Python backend (HTTPX 0.27 or newer) and rebuild
frontend/copilot together. Rebuilding JavaScript alone does not install the import
routes. Existing application-hosted file previews retain their 25 MiB limit and
30-second deadline; only external PDF imports use the larger configurable limit.
Creator continues to show ordinary external links without preview controls.

For `D:/client_works/avaia-chat`, the app currently installs `chainlit==2.1.1`
from PyPI instead of loading this repository's backend. Its persistent integration
is `src/utils/document_preview.py` (a copy of `backend/chainlit/external_pdf.py`),
registered from `src/utils/avaia.py` through `register_external_pdf_preview(app)`.
The helper places the routes before the older Chainlit catch-all, preserves
authentication/root-path handling, and closes the cache before Chainlit exits.
It skips routes already provided by a newer Chainlit version. The application
requirements explicitly require HTTPX 0.27 or newer. The `src` directory is
Docker-mounted, so a local chat-container restart loads this backend integration
without rebuilding frontend bundles or editing installed site-packages. Keep
the app copy synchronized when updating the canonical importer.

PDFs use a continuous vertical stack on a theme-aware canvas, with page gaps, automatic
page tracking, zoom, navigation buttons, and optional thumbnails. Page positions
are retained while canvases are rendered only near the viewport, so long files
do not render every full-size page at once.

PPTX uses the same continuous vertical page layout as PDF, on a theme-aware canvas.
One fixed, script-disabled iframe contains the scrolling slide list. The file is
parsed once and only nearby slides are rendered; offscreen slide slots retain
their positions. Mouse-wheel scrolling moves naturally through the deck, with
the slide selector tracking the current slide. Navigation and zoom reuse the
downloaded file and iframe.

Both viewers fit their content to the available pane width, including narrower
panes and PDF thumbnail mode. Floating controls wrap within the pane. Fit width
restores the responsive view after manual zoom; horizontal panning is available
when zoomed above the fitted width. Each main preview has one vertical scrolling
surface.

In embedded and popup copilot chat, the chat header belongs to the left column.
Dashboard chat controls are grouped on the left and wrap within that column;
the document pane starts at the top of the frame and uses its full height.

Download, viewer-startup, and PDF page-rendering loaders are centered within
their available preview area. PDF fit width accounts for a stable vertical
scrollbar gutter, and the viewer contains overflow within the pane.
PDF.js's cached measurement canvas is hidden at document scope as well as
inside the widget, so shadow-root previews do not add an outer-page scrollbar.

Preview controls and surrounding canvases follow the application's light/dark
theme, including inside copilot's shadow root and document iframes. PDF/Word
pages and authored HTML retain their document colors. Changing themes does not
reload the file or PPTX frame.

PDF and source previews include literal, case-insensitive Find in file, match
counts/highlights, previous/next matches, and scoped Ctrl/Cmd+F. Enter advances,
Shift+Enter goes back, and Escape clears the query. Source search includes only
the rendered preview; PDF search indexes text locally as needed and supports
selection/copying through PDF.js's text layer. Image-only PDFs need OCR before
their content can be searched. Results are limited to the first 1,000 matches;
the count shows a plus sign at the limit. Search queries are not stored.

Viewing history restores page/slide, zoom, and relative scroll position for PDF
and PPTX, source-file scroll position, image zoom/panning, HTML tab/scroll, Word
zoom/scroll, and the workbook's selected sheet/zoom/scroll. It keeps the last 100
files in session storage for the current tab/origin and survives a page reload.
Only hashed file identity and viewing metadata are stored, with signed URL
credentials excluded; file contents, full URLs, and search queries are not
persisted. If session storage is unavailable, in-memory restoration still works.
Code previews remain read-only.

PNG, JPG/JPEG, and WebP artifacts also open in the docked preview, with fit,
zoom, original-size, and download controls. Generated image links use artifact
cards; existing inline image thumbnails open the panel when clicked. The viewer
decodes the downloaded raster image locally and preserves transparency. The
middleware below includes storage downloads with `type=image`.

Code, configuration, CSV/TSV, Markdown, and plain-text artifacts open in a
read-only source viewer with syntax highlighting, line numbers, copy, and the
existing original-download actions. Common source extensions and text MIME types
are recognized, including extensionless Dockerfiles and Makefiles. The same
viewer is shared by regular chat and copilot. Creator stays focused on editing:
it does not host file previews, and its embedded chat shows download actions
instead of opening a preview for any file type. Opening Creator dismisses an
existing chat preview, and files generated in Creator mode do not auto-open or
reopen later when Creator closes. Markdown and plain-text editing remain available.
Named `.md`/`.markdown` and `.txt` attachments are previewable whether Chainlit
publishes them as `file` or `text` elements. Text-file cards defer downloading
until the preview opens. Opaque application download links also recognize
Markdown/MD and TXT format labels.

Source previews support UTF-8 and BOM-marked UTF-16. Binary content is rejected.
Rendering is limited to the first 1 MB or 10,000 lines; larger previews display a
notice and copy only the visible source. Syntax coloring is skipped above
100,000 characters. The original download remains complete.

The source viewer carries its scoped stylesheet inside the component, including
inside copilot's shadow root. Its token colors override the chat code theme so
line numbers stay beside the source and light-background syntax remains dark
and readable. The stylesheet is imported as raw text to avoid deployment-specific
CSS extraction or Creator selector rewriting.

HTML previews preserve the document's head styles and body formatting inside a
script-disabled iframe, with Preview and Source tabs using the same download.
Existing injected Django Debug Toolbar panels are removed
from the preview. HTML downloads use a streaming `FileResponse` in the storage
helper below, preventing development middleware from adding its toolbar to the
artifact. Embedded CSS is retained; external resources and scripts remain blocked.

Organization-only storage links require the application's login cookie. The file
server must return the exact trusted chat origin in `Access-Control-Allow-Origin`,
`Access-Control-Allow-Credentials: true`, and expose `Content-Disposition` for
format/filename discovery. Wildcard CORS headers do not support these requests.

For the existing Django application, copy [django_cors.py](django_cors.py) to
`apps/api/middleware/document_preview.py` and add
`apps.api.middleware.document_preview.DocumentPreviewCorsMiddleware` immediately
before `corsheaders.middleware.CorsMiddleware` in `MIDDLEWARE`. It only adds
credentialed CORS for GET/HEAD storage downloads from `BASE_URL`,
`CHAINLIT_CHAT_URL`, and optional `DOCUMENT_PREVIEW_ALLOWED_ORIGINS`. Other origins
retain the existing CORS behavior. File permissions and signed share scopes still
apply. An organization-only link must be opened by an authenticated user in that
organization.

Cookies also remain subject to browser SameSite and third-party-cookie rules.
Separate production sites may need a same-site deployment or an authenticated
file proxy; the local two-port setup shares the localhost site.

The artifact card and right panel open before file access succeeds. A blocked or
unavailable file displays an access/network error with Open original and Retry
preview controls. Cards do not make background metadata requests. The viewer
discovers unknown file types from the headers of the same GET response that
downloads the document, avoiding requests for partial URLs during streaming.


For metadata performance, install storage_response.py as apps/files/preview_response.py
and call storage_download_response(storage, file_name, head=request.method == 'HEAD')
inside the authorized storage-download view after its existing access and existence
checks. HEAD returns metadata without retrieving the entire file; GET retrieves
the file once. HTML is served as a file response to preserve its original bytes.

