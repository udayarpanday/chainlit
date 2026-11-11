# Document Preview Panel — Stakeholder Report

**Feature:** When the AI agent generates a document (PDF, Word, PowerPoint, Excel, or HTML) in the sandbox, its registered file or application-hosted download link opens in a preview panel on the right side of the chat.

**Avaia-chat runtime integration (9 November 2026):** The local app uses the
installed `chainlit==2.1.1`, so modifying `D:/chainlit/backend` alone does not add
the import endpoints. A persistent importer copy in
`D:/client_works/avaia-chat/src/utils/document_preview.py` is registered from the
existing `src/utils/avaia.py` startup integration. Routes are placed before
Chainlit's catch-all and keep the existing authentication checks. Registration
is idempotent and supports the configured root path. The app's HTTPX requirement
is explicit; restarting the local chat container loads the mounted source.

**External PDF imports (6 November 2026):** Preview now imports public PDFs through
the authenticated Chainlit backend, removing the browser CORS dependency. The
backend validates response type, streamed size, PDF signature and EOF, caches a
user-private copy for one hour by default, and serves authenticated byte ranges.
The default external-file limit is 100 MiB and the download deadline is 120
seconds; both are configurable. Reopening reuses the cached file, and concurrent
clicks share a reservation. No request is made while rendering links. DNS answers
and redirect targets are checked for public addresses; outbound connections are
pinned to validated IPs, retain TLS hostname verification, and forward no user
credentials or referrer. Storage quotas, import rate/concurrency limits, partial
file cleanup, and expiry checks apply. Existing internal document flows and the
Creator exclusion remain. This supersedes the earlier direct-browser external
PDF flow below. The updated Python backend must be deployed along with frontend
and copilot builds. See `docs/document-preview/README.md` for configuration.

Validation: 17 backend test groups passed, covering public DNS/IP pinning,
redirect validation, user isolation, deduplication across workers, cache expiry,
quotas, cancellation, and HTTP byte ranges. The actual CMU PDF (60,363,034 bytes)
downloaded once, reopened from cache, and served a local 206 range response.
Browser checks rendered the real viewer using about 280 KB per open of a 4 MiB
fixture, including cross-origin authenticated ranges, without runtime errors or
a repeat import on parent re-render. Targeted TypeScript and formatting checks
passed. Temporary tests and browser artifacts were removed; no production build
was run.

**External PDF link filtering (6 November 2026):** Ordinary website links no longer
show Preview. The action is offered only when a URL path, file/type query parameter,
or visible label indicates PDF. No metadata request or domain allowlist is used;
the response is still validated after a click. Opaque URLs without a PDF hint stay
ordinary links.

**External PDFs (4 November 2026):** Eligible public HTTPS links offer a separate
Preview action with the source hostname, without a domain allowlist or an upfront
request. External links and attachments never auto-open. One browser GET per
explicit preview/retry click omits credentials and referrer, rejects redirects,
and checks PDF response type and header bytes under the existing 25 MB limit
and 30-second deadline. Webpages, unsupported files, and CORS failures retain an
Open original fallback. Creator only shows the original link. No backend fetcher
was added. URL checks reject obvious local targets and IP literals; browser code
cannot verify the public IP behind a DNS name. Forty-nine focused checks passed,
and the live ÖREB endpoint rendered in a shadow-root sidebar with one GET and no
cookies, Authorization, or Referer headers. Production builds remain with the user.

**Current scope (2 November 2026):** File previews are available in regular chat
and copilot. Creator is reserved for editing, with no document preview pane or
preview forwarding bridge. File cards inside Creator's embedded chat download
the original for every file type; opening Creator closes an existing chat preview,
and generated files do not auto-open previews while Creator is active. Markdown
and plain-text editing remain available. Earlier Creator preview notes below
describe the previous implementation and are superseded by this scope.

---

## 1. Executive Summary

- **This is not a green-field build.** Roughly **70% of the required infrastructure already exists** in our platform and is in production use today.
- Our chat UI already has a **resizable right-side panel**, the real-time plumbing for the server to **push content into it**, and a **working PDF preview**.
- What's missing is: (1) connecting AI-generated files to that panel so it **opens automatically**, and (2) adding **preview support for Word and PowerPoint**, which today only appear as download buttons.
- **Recommended approach: render documents directly in the browser** using lightweight open-source viewer libraries (`pptx-preview`, `docx-preview`, `react-pdf`). This requires **no new backend infrastructure**, previews appear instantly, and documents never leave our environment. A server-side conversion service (Gotenberg/LibreOffice) remains available as an optional, later upgrade if higher visual fidelity is ever needed.

---

## 2. What We Already Have

| Capability | Status |
|------------|--------|
| Right-side preview panel (resizable on desktop, slide-over on mobile) | In production — already powers our document editor "canvas" |
| Real-time mechanism for the agent/server to open the panel and put content in it | In production |
| PDF rendering in the browser | Works today |
| Image, video, audio, and data-table previews | Work today |
| Pipeline that turns files into typed, previewable chat objects based on file type | In production |
| Secure file storage & download URLs for generated files (File Registry) | In production |

## 3. What's Missing

1. **Generated files aren't connected to the panel.** Today the agent shares sandbox output as download links in the chat text — there is nothing to preview and nothing opens automatically.
2. **No Word / PowerPoint preview.** These formats fall back to a plain "download" chip.
3. **UX polish:** a document toolbar (download, open in new tab), slide navigation for presentations, and a clickable "artifact card" in the chat.

---

## 4. Rendering Approaches Evaluated

| Option | Approach | Verdict |
|--------|----------|---------|
| **A. Render in the browser** | Open-source JS viewer libraries render PDF, Word, and PowerPoint directly in the preview panel |  **Primary approach** — no new infrastructure, instant previews, data stays with the user, validated libraries available for all three formats |
| B. Server-side conversion to PDF | **Gotenberg** / **LibreOffice headless** as a separate internal Docker container converts Office files to PDF for preview | **Optional upgrade path** — highest visual fidelity; adds a service to run and conversion latency. Adopt later only if real-world fidelity gaps appear |

### Libraries & technologies

| Purpose | Library / Tool | License | Notes |
|---------|---------------|---------|-------|
| PowerPoint preview | **pptx-preview** | ISC (permissive) | Actively maintained (latest release Oct 2025); renders slides incl. embedded charts; verified on npm |
| Word preview | **docx-preview** (or **mammoth.js**) | MIT / BSD | Mature, widely used docx-to-browser renderers |
| PDF preview (Phase 1) | Browser-native viewer | — | Zero new dependencies |
| PDF preview (upgrade) | **react-pdf** (Mozilla **pdf.js**) | MIT / Apache-2.0 | Zoom, thumbnails, consistent look in all browsers |
| HTML sanitization (security) | **DOMPurify** | Apache-2.0 | Industry standard; neutralizes any malicious document content |
| Optional server-side conversion (Phase 4+, only if needed) | **Gotenberg** / **LibreOffice** | MIT / MPL | Would run as a **separate internal Docker container** (never inside the chat app) for isolation and independent scaling |
| Panel layout, resizing, mobile sheet | Already in our stack (React, Radix UI, react-resizable-panels, Tailwind) | MIT | No changes needed |
| Real-time panel control | Already in our stack (Socket.IO) | MIT | No changes needed |
| Automated testing | Cypress (already in our stack) | MIT | New end-to-end specs |

---

## 5. Security of In-Browser Rendering

Client-side rendering is safe in our context, with three standard safeguards that are cheap to implement:

1. **Sandboxed preview frame** — documents render inside an isolated browser frame with no access to the user's session; even a maliciously crafted file cannot touch cookies or the application.
2. **Content sanitization** — any document content converted to HTML passes through **DOMPurify** before display.
3. **Size limits & lazy loading** — very large files fall back to the download button; viewer libraries load only when a preview is opened, keeping the app fast.

Context also matters: previewed files are generated **by our own agent in our own sandbox** for the same user who views them, and all previewing happens in that user's own browser — documents are never sent to any third party. Favorable comparison: the heavier the rendering we keep client-side, the smaller our server attack surface and infrastructure footprint.

---

## 6. Delivery Plan

### PDF auto-preview 
When the agent generates a PDF, the right panel opens automatically and displays it; the chat shifts left. Pure integration of existing components — no new libraries.
*Key item to validate: secure file URLs must be viewable inside the embedded preview (authentication configuration).*

### Word & PowerPoint previews, fully in-browser 
Integrate **pptx-preview** and **docx-preview** into the side panel with the security safeguards above, plus a toolbar: file name, **Download original**, **Open in new tab**. Graceful fallback to the download button if a file can't be rendered.
*Includes a 1–2 day fidelity spike: render a representative sample of agent-generated decks/documents and sign off on visual quality with stakeholders.*

### Polish 
- Upgrade to the **react-pdf** viewer: zoom, page thumbnails, consistent cross-browser rendering.
- Slide navigation (previous/next, slide counter) for presentations.
- "Artifact card" in the chat message (📄 *Quarterly_Report.pptx — click to preview*).
- Support for multiple documents per conversation; automated end-to-end tests.

### Phase 4 (optional, demand-driven) — High-fidelity conversion service
If real usage reveals gaps (complex layouts or missing fonts), an internal **Gotenberg** service can generate PDF previews. Conversion fidelity still needs validation; LibreOffice is not an exact replacement for Microsoft Office. A PDF preview is a print view and does not provide the workbook navigation requested for Excel.

| Phase | Deliverable | Effort |
|-------|------------|--------|
| 1 | PDF opens automatically in right panel |
| 2 | Word & PowerPoint in-browser previews + toolbar |
| 3 | Premium viewer, slide navigation, artifact cards, tests |
| 4 (optional) | Server-side high-fidelity conversion |

---

## 7. OpenUI fit assessment (28 October 2026)

**Recommendation: evolve the right column into a general artifact panel, with document previews and OpenUI-generated interfaces sharing the same surface.** OpenUI can also compose a document preview into a larger interface through a custom component. It does not replace the PDF/Office viewer or generate the underlying document file.

### What was verified in this checkout

- `frontend/src/components/ElementSideView.tsx` already renders a list of typed elements through the shared `Element` dispatcher, on desktop and mobile. The panel is not limited to documents.
- `frontend/src/components/Elements/index.tsx` dispatches PDFs, images, text, media, charts, dataframes, files, and custom elements. An OpenUI renderer fits here as another content renderer.
- `backend/chainlit/sidebar.py` and the `set_sidebar_elements` listener in `libs/react-client/src/useChatSession.ts` already support server-controlled panel content.
- `frontend/src/components/Elements/PDF.tsx` currently embeds the file URL in an iframe. `react-pdf` and `pdfjs-dist` are already dependencies in `frontend/package.json`; the earlier library table describes their use in this panel as an upgrade, but installing them is no longer necessary.
- Custom elements load application-provided JSX and use `react-runner`. An OpenUI integration should use a trusted, compiled renderer with generated OpenUI Lang as data; do not route model-generated JSX through that runner.

### How OpenUI would fit

OpenUI's React runtime (`@openuidev/react-lang`) renders streamed OpenUI Lang using a developer-defined component library. We can mount its `Renderer` in the existing panel without replacing our chat UI or Socket.IO transport. Its component definitions provide schemas and model instructions. This is an integration proposal based on the documented APIs, not a tested implementation.

Two supported paths should coexist:

| Output | Rendering path |
|--------|----------------|
| Generated PDF, Word document, or presentation | Registered file -> existing typed element -> document viewer in the panel |
| Generated dashboard, table, form, or composed report | OpenUI Lang artifact -> OpenUI renderer -> approved application components in the panel |
| Composed report containing a PDF | OpenUI renderer -> custom `DocumentPreview(fileId)` component -> authorized file resolution -> existing document viewer |

`DocumentPreview(fileId)` is a proposed application component, not a built-in OpenUI PDF capability. A plain PDF should open deterministically from its file event, without asking a model to generate a UI description first. OpenUI becomes useful when the agent wants to combine that PDF with a summary, chart, or other controls.

### Additions to the delivery plan

1. **Keep PDF auto-preview as the first deliverable.** Establish stable artifact IDs, message/thread ownership, reopening, and explicit open/update behavior so other renderers can reuse them.
2. **Run a bounded OpenUI spike alongside document viewer work.** Mount a trusted OpenUI renderer in the side panel, initially with text, layout, chart/table, and `DocumentPreview` components. Prove one streamed dashboard and one PDF-containing report using our existing model backend. Check React 18 and Zod compatibility against the selected package version; current OpenUI examples use `zod/v4`, while our manifest declares `^3.24.1`.
3. **Define the artifact contract.** Persist artifact ID, thread/message association, kind, payload, component-library version, and generation status. For OpenUI, persist the accumulated language source, not just the rendered DOM. Route updates to the same artifact, and distinguish updating content from opening the panel so each streamed update does not reopen a panel the user closed. The existing sidebar events provide a starting point; streaming and reload/history restoration need explicit implementation and validation.
4. **Add interactions after read-only rendering works.** Route approved OpenUI actions through our authenticated backend action handling, with schema validation, authorization, and duplicate-submit protection. Rendering an interface alone does not execute an agent tool or persist form state.
5. **Acceptance checks:** PDF-only flow, streamed UI, mixed PDF/UI, invalid or interrupted output, unauthorized file IDs, close/reopen, conversation reload, and mobile layout. Keep text/download fallbacks for failed previews or UI generation.

### Boundaries and deployment

Use a small allowlisted component library and validate props, file references, links, and actions. Resolve file IDs through our existing authorized file mechanism; do not let generated UI select arbitrary iframe URLs or backend endpoints. File ownership must be enforced server-side. Generated files and UI remain untrusted even when produced by our own agent. DOMPurify can sanitize HTML where applicable, but it does not provide action authorization or universal document isolation; the current PDF iframe does not declare a sandbox. Document isolation needs viewer-specific validation.

Start with the open-source renderer and our existing model provider. OpenUI's hosted Gateway, repair, and monitoring services are separate adoption choices; assess data routing and operational costs before enabling them. OpenUI does not remove the Office fidelity spike or optional conversion work. The document-only plan's infrastructure-reuse estimate should not be applied to the expanded interactive UI scope.

### Primary sources

- [OpenUI introduction](https://www.openui.com/docs): integration with existing chat UIs and model providers; optional production services.
- [Getting started](https://www.openui.com/docs/getting-started): library specification, model instructions, accumulated streamed text, and `Renderer` integration.
- [Defining components](https://www.openui.com/docs/openui-lang/defining-components): schema-defined custom React components and component-library composition.
- [Renderer](https://www.openui.com/docs/openui-lang/renderer) and [interactivity](https://www.openui.com/docs/openui-lang/interactivity): rendering and action integration details.

## 8. Implementation notes

The document-preview implementation uses the existing chat and sidebar. OpenUI remains an optional, separate extension.

- Supported previews: PDF (`react-pdf` with a locally bundled PDF.js worker), DOCX (`docx-preview`), PPTX (`pptx-preview`), XLSX (`exceljs`), sanitized HTML with a source tab, PNG/JPG/JPEG/WebP images, and read-only code/configuration/plain-text previews. Legacy DOC/PPT/XLS and other unsupported formats retain downloads.
- Generated document links in assistant Markdown and typed PDF/file elements are recognized by extension or MIME type. Application-hosted links are resolved without changing signed query parameters. A bare `sandbox:/...` path is not a browser download URL: the agent's existing file registry must still publish it first. Opaque download URLs need a filename in their label, a `path`/`filename` query parameter, or a typed element carrying filename/MIME metadata.
- New documents observed during a live response open when the response finishes. Restoring history does not automatically open old files; cards can reopen them. Closing the panel stays effective until a new document is produced. A canvas already in use is preserved.
- The panel supports document selection, original downloads, and opening originals in a new tab. PDFs have page navigation, zoom, and optional thumbnails; presentations have slide navigation. DOCX preserves generated document styles and displays fitted pages with zoom controls. Workbooks use a read-only Excel-style grid with worksheet tabs, row/column headers, a formula bar, selection, zoom, saved number/date formats, fonts, colors, merged cells, widths/heights, hidden rows/columns, and frozen panes. The workbook is parsed once rather than reloaded on every sheet switch. Previews remain limited to 500 rows and 50 columns and use saved formula results; charts, pivot-table interfaces, conditional formatting, and formula recalculation require a fuller Office rendering engine.
- Office and HTML content renders inside a script-disabled iframe with a restrictive content policy. DOCX HTML chunks are disabled, converted DOCX/HTML content is sanitized, and document links cannot navigate the preview. PDF annotations are disabled. This replaces the earlier blanket claim that every browser viewer is automatically isolated.
- Downloads are limited to 25 MiB for previews, with cancellation when a streamed response exceeds the limit. Office archives are checked before rendering (at most 2,000 entries and 80 MiB declared expanded size). Load/render failures keep the original download available.
- Sidebar socket handling now accepts the backend's `{ elements, key }` envelope as well as legacy arrays, honors its key, and updates/removes visible elements without reopening a closed panel.
- A preview-only PPTX normalization removes dangling content-type declarations produced by some generators, preventing the viewer from silently returning an empty deck. Original files remain unchanged. Existing Markdown download URLs are protected from filename-reference substitution.
- PowerPoint uses the deck's original slide proportions instead of forcing 16:9. The complete slide is centered and fitted to the panel, with navigation and zoom in a compact bottom toolbar. Resizing and zoom use the already-parsed presentation; there are no extra file downloads or nested slide scrollbars at the fitted size. Standard 4:3, widescreen, portrait, charts, keyboard navigation, and narrow-panel fitting were verified in a real browser.
- PowerPoint fitting zooms the slide canvas inside an untransformed iframe. The outer viewport is measured independently of its scrollbars, identical size updates are ignored, and toolbar space is reserved during loading. This removes iframe scaling and layout feedback as possible repaint triggers. The reported desktop flicker was not reproduced in the local headless baseline; the changed viewer passed 72 fractional-size/display-scaling cases with no idle redraws/reloads, identical repeated frame captures, working navigation/zoom, and a single download. The user's desktop browser still needs to confirm the reported flicker is resolved.

### Verification and remaining rollout checks

The validation results below record checks completed before cleanup. The feature-specific tests, fixture generator, screenshots, and temporary build/diagnostic backups were removed at the user's request; the project's existing test suites remain.

- Verified: 31 targeted frontend unit tests, four Django CORS tests, and all 15 Chrome viewer tests pass, including actual chart bars, slide navigation, copilot shadow-root previews, and Creator draft preservation. The shared client, frontend, copilot, and Creator production builds pass in workspace-local verification directories. The broader unit suite still has unrelated new-chat mock/privacy-shield failures, and the full frontend type check still reports existing errors outside the preview implementation.
- The shared chat client and frontend must both be rebuilt for the sidebar fix. The checked-in frontend build configuration targets a separate application checkout; verification builds should override its output directory to a workspace-local path.
- Dynamic viewer imports are present, but the current IIFE build uses `inlineDynamicImports`, so production still ships one large JavaScript bundle. True deferred loading requires a separate change to the embedding/build contract.
- Before rollout, validate file-registry authentication and any cross-origin signed URL/CORS behavior in the deployed application, and review representative business documents for layout fidelity. The automated browser fixtures do not constitute that stakeholder fidelity sign-off. A conversion service remains optional if browser fidelity is insufficient.
- The published `pptx-preview` package declares ISC, while the upstream README includes additional source-use restrictions. This implementation consumes the published package without modifying its source; the earlier table's unqualified open-source characterization should not be used as a licensing assessment.

### Copilot and Creator integration

- `libs/copilot` docks the shared document viewer beside the chat on desktop, with a full-screen sheet only on mobile. Its existing shared `MessagesContainer` supplies automatic opening and chat file cards.
- `libs/evoya-creator` receives document metadata from copilot through a cancelable window event, since the widgets have separate bundles and Recoil roots. An active Creator claims the preview in its existing right-hand pane; copilot suppresses its duplicate sheet. Closing the preview or clearing the conversation synchronizes both views.
- Creator keeps the editor mounted while previewing, and **Back to editor** restores the unsaved draft. Opening PDF/DOCX/PPTX/XLSX/HTML through `openCreatorWithFile` also uses the viewer, without decoding binary data as Markdown or replacing the editor's file/save target.
- Embedded builds use relative asset URLs, so the self-hosted PDF worker resolves next to each widget bundle. React and Recoil resolve consistently within Creator's build. Deploy the emitted worker assets alongside each rebuilt widget script.
- File discovery also accepts links on the configured chat API origin when the widget is embedded on another site. The configured file-server context follows previews into Creator. The loader includes cookies for that server's file endpoints and a scoped bearer token only for its Chainlit `/project/file/` route; arbitrary external document hosts receive neither. Authenticated Chainlit downloads reject redirects rather than forwarding credentials elsewhere. Production CORS and expiring-link behavior still need environment-specific validation.
- Creator's verification build uses the 16 GiB Node heap already specified by its development build script; its default heap was insufficient during bundling. The existing IIFE bundle-size and sourcemap/CSS warnings remain.

### Generated download-link integration

- Opaque application storage downloads (UUID routes with fileregistry/code_interpreter/file types) are discovered even when the Markdown label has no extension. Recognized application downloads show preview cards immediately without making network requests. Labels such as Download Sample PDF identify the format; unknown types resolve Content-Type and Content-Disposition from the same GET response used to download the file after the panel opens. Unsupported files, expired access, and login pages keep the original download action and show an error inside the preview panel.
- A completed live assistant response opens the right panel immediately, independently of metadata or file-fetch success. Restored history does not auto-open, and a late response cannot reopen a cleared conversation.
- Updating this checkout alone does not update a separately configured custom_build or widget deployment. Rebuild and publish the native chatpage and both widget bundles, including their PDF-worker assets, into the paths used by the running application.


Local app verification (29 October 2026): published the tested native chatpage, copilot, and Creator builds plus their PDF-worker assets into the running app's configured public directories. Verified that localhost:7000 serves all three final JavaScript bundles byte-for-byte and that all three workers return HTTP 200 with JavaScript content. Authenticated chat-file access still requires checking the actual generated URL in the target session.


### Separate file server and authenticated organization links

- The actual generated code-interpreter link uses localhost:8000, separately from chat on localhost:7000. File discovery and cookie handling now read the deployment allowlist VITE_DOCUMENT_PREVIEW_ORIGINS; each local frontend/widget .env.local configures localhost:8000. Other origins remain excluded, and the Chainlit bearer token is never sent to Django.
- Organization-scoped share tokens require a matching authenticated Django session. Storage-download CORS must echo the trusted chat origin, allow credentials, and expose Content-Disposition. A scoped Django middleware was added to the local application for GET/HEAD downloads, before the general CORS middleware. It preserves file authorization and does not allow credentials for arbitrary origins or unrelated endpoints. See docs/document-preview/README.md for deployment details and the middleware source.


Live verification: the provided URL has a valid signature and organization scope. After reloading the local Django web container, the actual download endpoint echoes localhost:7000 and allows credentials for that origin; an unrelated origin receives no credentialed CORS. Unauthenticated requests still redirect, preserving organization access. All three local app/widget builds were republished with the configured file origin. Sign into the file-server application, refresh the chat, and click a restored file card; only new live responses open automatically.


### Preview panel availability fix

- Previously, a failed metadata request silently left a plain Markdown download link and prevented auto-opening. Document cards now appear immediately, and completed live responses open the panel before file fetching. Download labels with explicit supported format names, including Download Sample PDF, provide a format hint. URLs with explicit supported extensions take precedence.
- The native side panel and copilot/Creator bridge accept explicitly marked document-preview requests while their type is still unresolved. The shared viewer resolves metadata inside the panel and shows access/network errors with original-download and Retry preview actions. A sign-in HTML response cannot be passed to the PDF renderer.


Deployment verification: rebuilt and published all three bundles for the panel-availability fix. Confirmed that localhost:7000 serves their exact final hashes.


### Reference-style presentation

- Desktop chat/document proportions now start at 38/62, with a resizable divider and an edge-to-edge preview pane. The native page is bounded to the viewport so document scrolling stays inside the viewer.
- File cards show a format-colored icon, filename, and format subtitle; generated labels such as Download Sample PDF display as Sample.pdf. Original URLs and access checks are preserved.
- While a document is downloading for preview, its chat card replaces the right-hand download icon with a spinner. The icon returns when the transfer completes, fails, or is canceled. Transfer state is shared across the native chat, copilot, and Creator bundles on the page, so forwarding a preview to Creator still updates its original chat card. The indicator creates no extra file requests.
- A single slim viewer header contains the filename and accessible download, open-original, and close actions. PDF navigation and zoom use a floating toolbar; pages render on a white surface against the current theme.
- Copilot uses the same card/header/viewer styling in a resizable desktop pane beside chat; no desktop document overlay is created. Creator expands the preview pane to 62%, removes duplicate headers, and restores the editor's prior pane width when the document is closed. The editor remains mounted.


Reference layout verification: all 31 targeted frontend unit tests and 15 browser tests pass, including viewport-bounded scrolling, on-screen PDF controls, Office previews, and Creator draft restoration. All three production builds pass. Published the matching bundles and worker assets to the local application. The broader repository type check still has existing alias/type errors outside this feature; a nullable document-link prop found during review was corrected.


### Desktop preview docking correction

- Removed the desktop document Sheet from copilot. The real chat body and document viewer now occupy sibling resizable panels; chat stays mounted while the viewer is opened, closed, or forwarded to Creator.
- Desktop previews use an ordinary aside with no document dialog, backdrop, or focus trap. The narrow mobile view retains a full-screen sheet. Legacy non-document side views retain their existing behavior.
- Chat popups temporarily widen while a document is docked, then restore their previous width. An active Creator claims the preview and keeps the existing chat/editor split without creating a second docked pane.


Docking verification: all 31 targeted unit checks pass (the runner-timeout suite passed on retry). Four focused embedded browser checks pass in Cypress's bundled Electron browser: desktop non-overlap/no dialog, typing and draft persistence, mobile fallback, and Creator routing/editor preservation. Chrome could not attach to the runner in this session. Copilot's production build passed, and only its bundle/worker were published.


### Loading overhead

- Timing local asset transfers with gzip gave approximately 1.3 s for the native app, 1.1 s for copilot, and 0.53 s for the PDF worker. These are local transfer measurements, not timings of a user generation or authenticated file request.
- The code interpreter returns only after execution, file registration, and a synchronous registry-content fetch/session-folder copy. That generation-side delay is separate from the viewer and has not been profiled for the latest user request.
- PDF worker startup now overlaps document downloading, and a shared PDFWorker is reused across previews. Document loading tasks still dispose their own resources. Previous verification held the PDF response until worker creation and confirmed that reopening reused the worker.
- The local storage download view now uses a metadata-only HEAD response after the existing permission and existence checks, avoiding a full file-content read before the GET. GET retains its original bytes and download headers. Three server tests verify HEAD performs no read and GET reads once; all 13 native viewer checks pass in the bundled Electron browser.
- File-type discovery and downloading now share one GET response. Cards never fetch metadata in the background, and URLs containing the streaming cursor are excluded from preview discovery. This prevents requests for partial signed tokens from overwhelming the file server while an answer streams. Transient network/server failures receive at most two automatic retries with short delays; denied access and sign-in pages still require the user to resolve access.


Loading optimization deployment: native, copilot, and Creator builds passed and were published. Django's file watcher reloaded the optimized response helper automatically. Browser verification passed all 13 native viewer checks, including parallel worker startup and reuse on reopen; three installed Django response tests passed. The generation tool's synchronous output mirroring remains unchanged; no latency claim is made for the model/tool generation stage.

Streaming request correction (30 October 2026): recent server logs showed 97 HEAD requests containing the streaming cursor and partial signed tokens, versus three actual GET downloads. Removed eager card metadata fetching and the separate metadata module. Unknown types now resolve from the download response, and transient failures receive bounded automatic retries. In-memory checks verified the single-GET path, partial-link rejection, signed URL and credential preservation, retry limits, denied access, sign-in HTML, cancellation, and the size limit without adding test files. Native, copilot, and Creator production builds passed and were published; HTTP hashes matched the new bundles, and Creator's matching PDF worker was available. The latest authenticated user download has not been retimed after deployment.

Office fidelity correction (30 October 2026): DOCX sanitization now preserves leading stylesheet elements with `FORCE_BODY`, and generic HTML table rules no longer override Word tables. DOCX pages fit the pane and support zoom. Excel uses the requested workbook view, with saved values formatted by [SheetJS SSF](https://docs.sheetjs.com/docs/constellation/ssf/). A real browser verified two styled Word pages, desktop/narrow fitting, merged Excel titles, header colors, currency/percentage/date formats, formula selection, hidden-sheet exclusion, automatic row heights, narrow-cell overflow, and tab switching without another download. The focused preview type check and all three production builds passed; native, copilot, and Creator were published and their served hashes matched. Temporary fixtures, screenshots, browser profiles, and checks were removed. For greater fidelity on complex Office files, an embedded Office viewer such as [ONLYOFFICE](https://api.onlyoffice.com/docs/docs-api/get-started/how-it-works/viewing/) remains an integration option.

Image previews (30 October 2026): PNG, JPG/JPEG, and WebP now use the shared docked viewer in chat, copilot, and Creator. Generated image links become artifact cards, and existing inline thumbnails open the panel when clicked. Images retain their proportions and transparency, with fit, zoom, original-size, dimensions, and the existing download actions. Opaque image links can resolve their format from the same download response. The scoped Django CORS middleware now also includes `type=image` storage downloads.

Browser checks passed for all four extensions, the card download indicator, fit and zoom without extra requests, inline thumbnail docking, live-response auto-open without reopening history, opaque storage URLs, response-MIME discovery, Blob URL cleanup, and invalid raster rejection. Existing document discovery and signed-URL checks passed; the focused changed-file type check passed. Native and copilot builds passed, and the native local bundle was updated before the user took over building. Copilot was not published and Creator was not rebuilt for this change. Temporary browser fixtures and build output were removed.

HTML preview correction (30 October 2026): Django Debug Toolbar was injecting its settings, headers, versions, and SQL panels into HTML download responses. The installed storage helper now returns HTML through `FileResponse`, which the toolbar does not rewrite. The dedicated HTML renderer preserves the complete sanitized document, including head styles and body attributes, and removes any existing `#djDebug` panel. Default spacing and table styling improve plain HTML fragments; authored CSS keeps normal precedence. Scripts, external resources, forms, and navigation remain blocked.

Verification reproduced the server-side injection, then confirmed byte-for-byte HTML output, one storage read for GET, zero reads for HEAD, and unchanged PDF response handling. Browser checks reproduced the old head-style loss and verified preserved styling, responsive CSS, body attributes, toolbar removal without deleting legitimate Settings content, stable iframe rendering on parent updates, plain-table defaults, and no extra downloads or resource requests. The focused changed-file type check passed. Temporary checks and fixtures were removed; production builds and frontend publishing are left to the user.

Code and text previews (30 October 2026): source files, configuration files, CSV/TSV, Markdown, and plain text now use a shared read-only viewer with the existing `highlight.js` dependency, line numbers, light/dark syntax colors, copy feedback, horizontal scrolling, and the original-download controls. Common extensions, extensionless Dockerfiles/Makefiles, and text MIME types are recognized. Filenames and MIME metadata from the existing download response select the language for opaque URLs. HTML has Preview and Source tabs sharing one download. Creator's explicit Markdown-editing workflow remains available.

Source rendering supports UTF-8 and BOM-marked UTF-16 and rejects binary/invalid encoded data. Previews stop at 1 MB or 10,000 lines and display a notice; copying a truncated preview copies only that preview, while the original download stays complete. Coloring is skipped above 100,000 characters. No new dependencies or background metadata requests were added.

Browser checks passed for the requested languages, CSV/TSV/TXT, additional text formats, opaque filename discovery, Unicode, UTF-16 CSV, line numbers, copying and blocked-clipboard feedback, dark colors, HTML tab switching without another download, preserved HTML styling, literal source escaping, large-file caps, binary/access/sign-in rejection, parent rerenders without extra GETs, and long-line scrolling within a narrow panel. Existing document/image discovery, signed URLs, the Creator preview bridge, and the focused changed-file type check passed; Creator's source styles were checked with its CSS prefixer. Temporary checks, screenshots, and fixtures were removed. Production builds and publishing remain with the user.

Source formatting correction (30 October 2026): the page-level checks missed copilot's shadow-root style boundary. The viewer now carries its own scoped stylesheet as raw CSS in a local style element, avoiding reliance on a global stylesheet or deployment-specific selector rewriting. Highlight tokens first inherit readable source colors, then receive the viewer's own palette, preventing the chat's Monokai theme from making parameters and interpolation nearly white. Light-background syntax colors were darkened at the user's request.

Browser verification reproduced the stacked gutter when the component stylesheet was removed inside a real shadow root, then verified corrected gutter/source alignment, matching line heights, preserved indentation, source contents, long-line scrolling, readable parameter/interpolation colors, and both theme palettes in native, copilot-shadow, and Creator-style containers. The focused type check passed. Temporary checks and screenshots were removed; production builds remain with the user.

Continuous PDF and PPTX wheel navigation (30 October 2026): PDFs now display a continuous vertical stack on a dark canvas with 32 px page gaps, fitted width, live page tracking, navigation/zoom controls, and optional thumbnails. A shared IntersectionObserver mounts canvases near the viewport while retaining offscreen page positions and measured proportions. Scrolling to the bottom selects the final page even when a short final page shares the viewport with its predecessor. The existing shared worker and single-download flow remain in use.

PPTX now accepts mouse-wheel navigation both inside the sandboxed slide iframe and over the surrounding dark canvas. A gesture threshold and idle-gap lock prevent continuous trackpad inertia from skipping multiple slides. Enlarged slides consume wheel gestures for panning, including at their scroll boundaries; Fit slide restores wheel navigation. The fixed iframe and inner slide scaling are retained to preserve the earlier flicker correction.

Browser verification used a 20-page PDF with mixed page sizes and a five-slide PPTX. Checks passed for continuous page layout, dark canvas, margins/gaps, mouse scrolling, page tracking, previous/next navigation, mixed proportions, zoom, thumbnails, offscreen canvas removal, opening at a specified page, iframe/canvas wheel handling, reverse navigation, gesture locking, zoomed panning and boundaries, final-slide bounds, stable iframe/layout, and no extra artifact downloads. The focused changed-file type check passed. Temporary fixtures, browser profiles, and screenshots were removed. Production builds and publishing remain with the user.

Continuous PPTX and responsive fitting correction (30 October 2026): the user clarified that PPTX needs the same continuous preview as PDF. It now uses one fixed sandboxed iframe with a naturally scrolling vertical slide list, lazy rendering into reserved slide slots, preserved 16:9/4:3 proportions, live slide tracking, and navigation/zoom controls. The previous wheel-to-switch gesture handler is removed. The presentation is parsed once; resizing, scrolling, and zooming retain the same iframe and download.

PDF now waits for its measured viewport width, uses a fluid full-width page column with bounded padding, and starts observing canvases after width is available. Fit width resets manual zoom. PDF and PPTX controls wrap within the pane instead of extending beyond narrow widths. Fitted views have no horizontal overflow; manually enlarged views support horizontal panning. The main preview retains one vertical scrolling surface.

Browser verification passed at 200/320/600/920 px pane widths and device pixel ratios 1/1.25/2. PDF checks covered native, copilot shadow-root, and Creator-style containers, actual canvas bounds, toolbar bounds, thumbnail mode, zoom/reset, and no repeat downloads. PPTX checks covered a 20-slide continuous list, 32 px gaps, natural wheel scrolling, lazy/offscreen rendering, active slide controls, the same width/scaling matrix, 4:3 proportions, zoom/reset, copilot shadow-root scrolling, and no iframe reloads or repeat downloads. The focused changed-file type check passed. Temporary browser checks, fixtures, profiles, and screenshots were removed; production builds and publishing remain with the user.

Preview usability improvements (30 October 2026): implemented the three agreed priorities: theme consistency, PDF/source search with selectable PDF text, and remembered viewing positions. Code editing was explicitly skipped. Shared preview settings and theme context work across the native app, copilot, and Creator without importing their separate theme-provider contexts. Theme changes update PDF/PPTX canvases, controls, and Word's surrounding canvas while retaining document-page colors and the same loaded files/frames.

Find in file is literal and case-insensitive, with bounded results, previous/next navigation, counts, highlights, scoped Ctrl/Cmd+F, Enter/Shift+Enter navigation, and Escape to clear. PDF text is indexed locally on demand, supports text selection, and highlights matching text runs with the PDF.js text layer. Source matching preserves syntax tokens, indentation, and the original text, including matches spanning multiple highlighted tokens. Both searches cap at 1,000 matches; source search covers the existing bounded preview and scanned PDFs require an existing text/OCR layer. Queries are not persisted.

Viewing metadata restores PDF/PPTX page, zoom, and relative scroll offsets; source scroll; image size and panning; HTML tab and scroll; Word zoom and scroll; and workbook sheet, zoom, and scroll. Session history is shared in memory across widget bundles in the same window and retained in session storage for the current tab/origin. A 100-file limit bounds it. Keys hash canonical file identity after dropping signed credentials; contents, full URLs, credentials, and queries are not stored. Session-storage failures retain the in-memory behavior.

Browser checks passed for live native/shadow-root theme changes, PDF/source search and match navigation, literal metacharacters, cross-token highlights, text selection, scoped keyboard find, no-match feedback, unchanged read-only source, no repeat downloads during search/theme/zoom, and stable PPTX iframes. Restoration passed for PDF/PPTX positions across signed-token changes, images, HTML, Word, workbook sheet/scroll, page reload, and the 100-file bound. Metadata-only storage and narrow search/control layouts were verified. The focused changed-file type check passed. Temporary checks, fixtures, screenshots, and browser profiles were removed. Production builds and publishing remain with the user.

