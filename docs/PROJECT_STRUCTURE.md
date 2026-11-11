# Chainlit Workspace — Folder-by-Folder Documentation

> **Purpose:** Complete, agent-readable map of every folder in this monorepo (`d:/chainlit`). Written for coding agents (Zoo Code, Codex) so they can locate any file instantly. Companion doc: [`docs/DESIGN.md`](DESIGN.md) (design system / UI classes).
>
> **Workspace:** pnpm workspaces (`pnpm-workspace.yaml`), `packageManager: pnpm@9.15.9`, enforced via `preinstall: npx only-allow pnpm`. Python backend managed by Poetry/uv (`backend/pyproject.toml`).
>
> **Root scripts** ([`package.json`](../package.json)): `build` (recursive), `buildUi` (react-client → copilot → frontend), `lint` / `lint:fix` / `lintUi` / `lintPython` (dmypy), `format*` (prettier / black+isort), `type-check` (parallel), `test` (recursive), `test:ui` (vitest in frontend), `test:e2e` (cypress run), `test:e2e:interactive` (cypress open). Husky + lint-staged on commit.

---

## 1. `frontend/` — Main Chat UI (`@chainlit/app`)

React 18 + Vite + TypeScript SPA. This is the primary user-facing app.

**Config:** [`package.json`](../frontend/package.json) (scripts: `dev`, `build`, `preview`, `type-check`, `test`), [`vite.config.ts`](../frontend/vite.config.ts), [`tsconfig.json`](../frontend/tsconfig.json), [`components.json`](../frontend/components.json) (shadcn config), [`vitest.config.ts`](../frontend/vitest.config.ts), [`index.html`](../frontend/index.html).

**Key deps:** Radix UI (full primitive set), `class-variance-authority`, `clsx`, `tailwind-merge`, `cmdk`, `lucide-react`, `sonner`, `react-router-dom`, `recoil`, `react-hook-form` + `@hookform/resolvers`, `i18next`/`react-i18next`, `lodash`, `mermaid`, `plotly.js`, `highlight.js`, `react-dropzone`, `date-fns`, `react-day-picker`, `@tanstack/react-table`, `embla-carousel-react`, `js-base64`, `js-cookie`, `react-hotkeys-hook`, `@microlink/react-json-view`, `@chainlit/react-client` (workspace).

### `frontend/src/`

| Path | What it is |
|---|---|
| [`main.tsx`](../frontend/src/main.tsx) | Vite entry point |
| [`App.tsx`](../frontend/src/App.tsx) / [`AppWrapper.tsx`](../frontend/src/AppWrapper.tsx) | Root app + providers wrapper |
| [`router.tsx`](../frontend/src/router.tsx) | Routes: `/` (Home), `/env`, `/thread/:id?`, `/element/:id`, `/login`, `/login/callback`, `/share/:id`, `*` → redirect `/`. Basename from `lib/router` |
| [`index.css`](../frontend/src/index.css) | Tailwind base + CSS variables (theme tokens) |
| [`index.d.ts`](../frontend/src/index.d.ts) | Global types (incl. `window.cl_shadowRootElement`) |

- **`api/`** — `index.ts`: API client wiring to `@chainlit/react-client`.
- **`assets/`** — static SVGs: `logo_light.svg`, `logo_dark.svg`, `evoya_light.svg`, `ch.svg`, `eu.svg`, `us.svg`.
- **`contexts/`** — `MessageContext.tsx`: React context for selected message/quote state.
- **`hooks/`** — `query.ts` (react-query helpers), `use-mobile.tsx`, `useCommandNavigation.tsx` (keyboard nav), `useFetch.tsx`, `useLayoutMaxWidth.tsx`, `usePlatform.ts` (mac detection, used by `Kbd`), `useTextSelection.ts`, `useUpload.tsx`.
- **`i18n/`** — `index.ts` (i18next init), `dateLocale.ts` (locale date formatting).
- **`lib/`** — `utils.ts` (`cn()` = clsx + tailwind-merge), `dom.ts`, `message.ts`, `router.ts` (basename logic), `quotedTextHighlight.ts`, `evoya-toast.ts` (custom toast helper).
- **`pages/`** — `Home.tsx`, `Thread.tsx` (chat page, also serves `/share/:id`), `Element.tsx` (standalone element page), `Login.tsx`, `AuthCallback.tsx`, `Env.tsx` (env debug), `Page.tsx` (layout wrapper).
- **`state/`** — Recoil atoms: `chat.ts`, `project.ts`, `user.ts`, `evoya.ts`.
- **`types/`** — `Input.ts`, `messageContext.ts`, `NotificationCount.tsx`, `index.ts`.

### `frontend/src/components/` (see [`docs/DESIGN.md`](DESIGN.md) §3–4 for styling)

- **`ui/`** — 39 shadcn/Radix primitives (button, dialog, popover, dropdown-menu, select, command, tooltip, sheet, tabs, table, etc.). **All UI must be built from these.**
- **`chat/`** — chat surface: `index.tsx` (page), `Footer.tsx`, `ScrollContainer.tsx`, `ScrollDownButton.tsx`, `WelcomeScreen.tsx`, `Starters.tsx`/`Starter.tsx`/`StarterCategory.tsx`, `TemporaryChatNotice.tsx`, `DataProcessingPopover.tsx`.
  - **`chat/MessageComposer/`** — input composer: `index.tsx`, `Input.tsx` (auto-resize textarea), `SubmitButton`, `UploadButton(Dropdown)`, `Attachments`/`Attachment`, `CommandButtons`/`CommandButton`/`CommandPopoverButton`, `ConfigurationMenu`, `ModePicker`, `Projects`, `QuotedContext`, `FavoriteButton`, `VoiceButton`, `Mcp/` (MCP server add/list UI: `AddForm.tsx`, `List.tsx`, `AnimatedPlugIcon.tsx`).
  - **`chat/Messages/`** — message list: `index.tsx`, `Message/` (`index.tsx`, `Avatar`, `Step`, `UserMessage`, `AskActionButtons`, `AskFileButton`, `QuotableContent`, `SelectionActionBar`, `ToolStepInfo`, `Buttons/` — `DebugButton`, `EvoyaCreatorButton`, `FeedbackButtons`, `Actions/`), `Content/` (`index.tsx`, `InlinedElements/` — audio/dataframe/file/image/pdf/plotly/text/video lists, `Tools/WebRequest.tsx`).
  - **`chat/MessagesContainer/`** — `index.tsx` message list container.
- **`ChatSettings/`** — settings form widgets: `index.tsx`, `ChatSettingsSidebar.tsx`, `FormInput.tsx`, `TextInput`, `SelectInput`, `MultiSelectInput`, `TagsInput`, `SwitchInput`, `SliderInput`, `CheckboxInput`, `DatePickerInput`, `RadioButtonGroup`, `InputLabel`, `InputStateHandler`, `NotificationCount.tsx`, `useChatSettingsSnapshotAtOpen.ts`.
- **`Elements/`** — inline element renderers: `Audio`, `Dataframe`/`LazyDataframe`, `File`, `Image`, `PDF`, `Plotly`, `Text`, `Video`, `ElementRef`, `index`, `CustomElement/` (`index.tsx`, `Renderer.tsx`, `Imports.ts` — dynamic custom element loading).
- **`header/`** — top bar: `index.tsx`, `NewChat`, `ChatProfiles`, `Share`, `ThemeToggle`, `Readme`, `ApiKeys`, `UserNav` (user dropdown), `SidebarTrigger`.
- **`LeftSidebar/`** — app sidebar: `index.tsx`, `ThreadList`, `ThreadHistory`, `ThreadOptions`, `Search` (Ctrl+K command palette).
- **`ModelPicker/`** — `ModelPickerModal.tsx`, `ModelRow.tsx`, `catalog.ts`, `reasoning.ts` — model selection modal.
- **`share/`** — `ShareDialog.tsx`.
- **`Tasklist/`** — `index.tsx`, `Task.tsx`, `TaskStatusIcon.tsx`.
- **`i18n/`** — `index.ts`, `Translator.tsx` (`<Translator>` component for translated strings).
- **`icons/`** — custom SVG icons: `Search`, `Send`, `Stop`, `Settings`, `Sidebar`, `PaperClip`, `Pencil`, `EditSquare`, `ToolBox`, `VoiceLines`, auth provider logos (`Github`, `Google`, `Microsoft`, `Auth0`, `Cognito`, `Descope`, `Gitlab`, `Okta`).
- **Root components** — `Alert`, `AudioPresence`, `AutoResizeTextarea`, `AutoResumeThread`, `BlinkingCursor`, `ButtonLink`, `CodeSnippet`, `CopyButton`, `ElementSideView`, `ElementView`, `ErrorBoundary`, `FilePickerDialog`, `Icon`, `Kbd`, `Loader`, `LoginForm`, `Logo`, `Markdown`, `MarkdownAlert`, `Mermaid`, `ProviderButton`, `QuiltedGrid`, `ReadOnlyThread`, `ThemeProvider`, `WaterMark`.

---

## 2. `backend/` — Python Server (`chainlit` package)

FastAPI + Socket.IO server. Managed with Poetry ([`pyproject.toml`](../backend/pyproject.toml), [`poetry.lock`](../backend/poetry.lock)); build via [`build.py`](../backend/build.py).

### `backend/chainlit/` (the package)

**Core modules:**

| File | Responsibility |
|---|---|
| [`server.py`](../backend/chainlit/server.py) | FastAPI app (~1850 lines): all REST routes, static file serving, CORS/GZip middleware, hot-reload (`watchfiles`), auth wiring, file upload/download, project endpoints |
| [`socket.py`](../backend/chainlit/socket.py) | Socket.IO server handlers (message/stop/action events) |
| [`config.py`](../backend/chainlit/config.py) | `ChainlitConfig`, `config` singleton, `load_module`, `reload_config`, `APP_ROOT`/`BACKEND_ROOT`/`FILES_DIRECTORY`/`public_dir` |
| [`message.py`](../backend/chainlit/message.py) | `Message`, `ErrorMessage`, `AskUserMessage`, `AskFileMessage` |
| [`step.py`](../backend/chainlit/step.py) | `Step`, `AsyncStep` context managers |
| [`action.py`](../backend/chainlit/action.py) | `Action`, `ActionButton` |
| [`element.py`](../backend/chainlit/element.py) | `Element` base + `Text`, `Image`, `Pdf`, `Audio`, `Video`, `File`, `Plotly`, `Dataframe`, `Task`, `CustomElement` |
| [`input_widget.py`](../backend/chainlit/input_widget.py) | `InputWidget` + `TextInput`, `SelectInput`, `MultiSelectInput`, `SwitchInput`, `SliderInput` |
| [`chat_settings.py`](../backend/chainlit/chat_settings.py) | `ChatSettings` |
| [`callbacks.py`](../backend/chainlit/callbacks.py) | base callback helpers |
| [`cache.py`](../backend/chainlit/cache.py) | cache utilities |
| [`chat_context.py`](../backend/chainlit/chat_context.py) | chat context management |
| [`context.py`](../backend/chainlit/context.py) | contextvars session/context |
| [`emitter.py`](../backend/chainlit/emitter.py) | Socket.IO emit wrapper |
| [`session.py`](../backend/chainlit/session.py) / [`user_session.py`](../backend/chainlit/user_session.py) | `Session`, `WebSession`, user session dict |
| [`user.py`](../backend/chainlit/user.py) | `User` model |
| [`markdown.py`](../backend/chainlit/markdown.py) | `get_markdown_str` (README rendering) |
| [`translations.py`](../backend/chainlit/translations.py) | i18n loader |
| [`telemetry.py`](../backend/chainlit/telemetry.py) | usage telemetry |
| [`secret.py`](../backend/chainlit/secret.py) | secret handling |
| [`mcp.py`](../backend/chainlit/mcp.py) | MCP (Model Context Protocol) integration |
| [`mode.py`](../backend/chainlit/mode.py) | app mode (dev/prod) |
| [`oauth_providers.py`](../backend/chainlit/oauth_providers.py) | OAuth provider registry |
| [`sidebar.py`](../backend/chainlit/sidebar.py) | sidebar API |
| [`sync.py`](../backend/chainlit/sync.py) | sync/async helpers |
| [`utils.py`](../backend/chainlit/utils.py) / [`_utils.py`](../backend/chainlit/_utils.py) | misc utils |
| [`__main__.py`](../backend/chainlit/__main__.py) | `chainlit` CLI entry (`chainlit run`) |
| [`hello.py`](../backend/chainlit/hello.py) | default hello app |

**Subpackages:**

- **`auth/`** — `cookie.py` (auth/OAuth state cookies), `jwt.py` (create/decode JWT), `__init__.py` (`create_jwt`, `decode_jwt`, `get_configuration`, `get_current_user`).
- **`data/`** — persistence layer: `base.py` (`BaseDataLayer`), `chainlit_data_layer.py` (default SQLAlchemy layer), `sql_alchemy.py`, `dynamodb.py`, `literalai.py`, `acl.py` (`is_thread_author`), `utils.py`, `get_data_layer` factory; **`storage_clients/`** — `azure_blob.py`, `azure.py`, `gcs.py`, `s3.py`, `base.py` (blob storage for uploaded files).
- **`cli/`** — `__init__.py` (Click CLI: `run`, `deploy`…).
- **Framework integrations** — `langchain/callbacks.py`, `llama_index/callbacks.py`, `haystack/callbacks.py`, `langflow/`, `semantic_kernel/`, `openai/`, `mistralai/` (callback adapters).
- **Channel apps** — `slack/app.py` (Slack Socket Mode), `teams/app.py` (MS Teams), `discord/app.py` (Discord bot).
- **`translations/`** — 26 JSON locale files (`en-US`, `de-DE`, `fr-FR`, `ja`, `zh-CN`, `zh-TW`, `bn`, `hi`, `ta`, `te`, `gu`, …).
- **`sample/`** — `hello.py`, `starters_demo.py` example apps.

### `backend/tests/`

pytest suite: `test_action`, `test_cache`, `test_callbacks`, `test_chat_context`, `test_chat_settings`, `test_config`, `test_context`, `test_element`, `test_emitter`, `test_input_widget`, `test_markdown`, `test_mcp`, `test_message`, `test_modes`, `test_oauth_providers`, `test_server`, `test_session`, `test_sidebar`, `test_slack_socket_mode`, `test_socket`, `test_step`, `test_teams_adapter`, `test_translations`, `test_user_session`, `test_utils`; `auth/test_cookie.py`; `data/` (data layer, literalai, sql_alchemy, get_data_layer); `langchain/`, `llama_index/` callback tests. Run via `cd backend && uv run pytest` (dmypy via root `lintPython`).

---

## 3. `libs/evoya-creator/` — Markdown Editor (`@evoya/markdown-editor`)

Vite + React library. **Scripts:** `dev`, `build`, `build-editor` (uses [`editor.vite.config.ts`](../libs/evoya-creator/editor.vite.config.ts)), `build:dev` (16GB node heap), `lint`, `format`. **Entry points:** [`index.tsx`](../libs/evoya-creator/index.tsx) (widget) and [`editor-standalone.tsx`](../libs/evoya-creator/editor-standalone.tsx) (standalone editor build).

**Key deps:** Lexical (`@lexical/*` 0.35), `@mdxeditor/editor` 3.x, CodeMirror 6 (`@codemirror/*`, `cm6-theme-basic-light`), `katex`, `mermaid`, `micromark` math/gfm-table extensions, `@chainlit/app` + `@chainlit/react-client` (workspace), Radix popover/toolbar/dialog, `js-file-download`, i18next.

### `libs/evoya-creator/src/`

| Path | What it is |
|---|---|
| [`appWrapper.tsx`](../libs/evoya-creator/src/appWrapper.tsx) | root wrapper (providers) |
| [`context.ts`](../libs/evoya-creator/src/context.ts) / [`state.ts`](../libs/evoya-creator/src/state.ts) / [`types.ts`](../libs/evoya-creator/src/types.ts) | context, state, types |
| `components/CreatorChat.tsx` | chat panel inside creator |
| `components/CreatorFrame.tsx` | editor frame layout |
| `components/CreatorHeader.tsx` | header bar |
| `components/ThemeProvider.tsx` | theme provider |
| `svg/EvoyaLogo.tsx`, `svg/HandPointer.tsx` | custom SVGs |
| `hooks/useEvoyaCreator.ts` | main creator hook |

- **`components/markdownEditor/`** — the MDX editor: `index.ts`, `MDXEditorWrapper.tsx`, `MDXEditorToolbar.tsx`, `custom.css`, `utils/` (`markdown.ts`, `message.ts`, `selection.ts`, `icons.tsx`, `translations.ts`).
  - **`plugins/evoyaAi/`** — AI-specific Lexical plugins: `index.tsx`, `CreatorLock.tsx`, `DiffNestedLexicalEditor.tsx`, `DiffNode.tsx`, `TextSelection.tsx`.
  - **`plugins/evoyaImage/`** — image plugin (`index.tsx`).
  - **`plugins/extend/`** — `codeblocks/` (`EvoyaCodeEditor.tsx`, `Mermaid.tsx`, `VegaLite.tsx`), `root/index.tsx`, `table/TableEditorWrapper.tsx`.
  - **`plugins/math/`** — KaTeX math plugin (`index.tsx`, `mathDialog.tsx`).
  - **`plugins/toolbar/`** — `evoyaToolbar.ts` + `components/`: `AutoApproveToggle`, `EvoyaAdvanced`, `EvoyaBlockTypeSelect`, `EvoyaDiffSourceToggleWrapper`, `EvoyaDropdown`, `ExportContent`, `OpenFile`, `ResetDocument`, `SaveContent`, `SelectAll`, `SetDiffSource`, `index.tsx`.
- **`components/markdownEditorStandalone/`** — `index.tsx`, `toolbar.tsx` (standalone editor shell).
- **`components/markdownFile/`** — `Editor.tsx`, `Toolbar.tsx` (file-based markdown editing).
- **`components/vegaEditor/`** — `index.ts` Vega spec editor.

---

## 4. `libs/evoya-files/` — File Picker Widget (`@evoya/file-picker`)

Vite + React library with its own Tailwind theme ([`theme.json`](../libs/evoya-files/theme.json)) and vitest setup ([`vitest.config.ts`](../libs/evoya-files/vitest.config.ts)). **Scripts:** `dev`, `build`, `build:dev`, `lint`, `test`, `format`.

**Key deps:** `@uiw/react-codemirror` + `@codemirror/lang-json|python|javascript` (file viewers), `@evoya/markdown-editor` (workspace, for markdown preview), `@emotion/react|styled|cache` (MUI-style styling), `sonner`, `usehooks-ts`, `uuid`, `react-file-icon`, tailwind-merge/animate.

### `libs/evoya-files/src/`

| Path | What it is |
|---|---|
| [`index.tsx`](../libs/evoya-files/index.tsx) | library entry |
| [`widget.tsx`](../libs/evoya-files/src/widget.tsx) | full file-picker widget |
| [`widget-compact.tsx`](../libs/evoya-files/src/widget-compact.tsx) | compact variant |
| [`widget-picker.tsx`](../libs/evoya-files/src/widget-picker.tsx) | picker-only variant |
| [`app.tsx`](../libs/evoya-files/src/app.tsx) | internal app shell |
| `global.d.ts` / `vite-env.d.ts` | ambient types |

- **`components/`** — `FilePicker.tsx`, `FilePickerItem.tsx`, `FileItemActions.tsx`, `FileSearch.tsx`, `FolderBreadcrumbs.tsx`, `RecentFilesSection.tsx`, `ShortcutFilesView.tsx`, `ShortcutsSection.tsx`, `Uploader.tsx` (dropzone), `DatasourceChangeWarning.tsx`.
- **`components/viewer/`** — file viewers: `audio/`, `image/`, `markdown/`, `pdf/`, `text/` (CodeMirror-based), each with `index.tsx`.
- **`context/`** — `file-context.ts` (React context for selected file/folder).
- **`types/`** — `file.ts`, `directory.ts`, `index.ts`.
- **`utils/`** — `files-api.ts` (backend file API calls), `file.ts` (file helpers), `recent-files.ts` (localStorage recent files), `shortcuts.ts` (keyboard shortcuts).
- **`tests/`** — vitest specs.

---

## 5. `libs/copilot/` — Copilot Widget (`@chainlit/copilot`)

Embeddable copilot chat widget (built with its own Tailwind config, [`tailwind.config.js`](../libs/copilot/tailwind.config.js), and Storybook). **Scripts:** `dev`, `build`, `preview`, `storybook`, `build-storybook`; `type-check` is **skipped** (cross-project path alias mismatch — see note in package.json).

**Key deps:** `recoil`, `react-responsive`, `sonner`, `highlight.js`, `lucide-react@0.468`, `@chainlit/app` + `@chainlit/react-client` (workspace).

### `libs/copilot/src/`

| Path | What it is |
|---|---|
| [`index.tsx`](../libs/copilot/index.tsx) | library entry |
| [`widget.tsx`](../libs/copilot/src/widget.tsx) | widget root |
| [`widgetEmbed.tsx`](../libs/copilot/src/widgetEmbed.tsx) | embed mode (sets `window.cl_shadowRootElement` shadow DOM) |
| [`app.tsx`](../libs/copilot/src/app.tsx) / [`appWrapper.tsx`](../libs/copilot/src/appWrapper.tsx) | app shell |
| [`api.ts`](../libs/copilot/src/api.ts) | API client |
| [`state.ts`](../libs/copilot/src/state.ts) / [`context.ts`](../libs/copilot/src/context.ts) / [`types.ts`](../libs/copilot/src/types.ts) | state/context/types |
| [`resolveDisplayMode.ts`](../libs/copilot/src/resolveDisplayMode.ts) | panel vs embed display resolution |
| [`ThemeProvider.tsx`](../libs/copilot/src/ThemeProvider.tsx) | theme |
| `chat/` | `index.tsx`, `body.tsx` — copilot chat |
| `components/` | `AgentList.tsx`, `Header.tsx`, `WelcomeScreen.tsx`, `ElementSideView.tsx`, `TemporaryChatButton.tsx` |
| `evoya/` | `DashboardSidebarButton`, `EvoyaCreatorButton`, `FavoriteSessionButton`, `ShareSessionButton`, `state.ts`, `types.ts`, `ViewContext.tsx`, `privacyShield/` (`index.tsx`, `PrivacyShieldToggle`, `CreateSection`, `ResponseTextItem`, `TextSections*`, `usePrivacyShield.ts`) |
| `hooks/` | `useCopilotInteract.ts`, `useSidebarResize.ts` |
| `lib/` | `utils.ts` (`cn()`) |
| `stories/` | `App.stories.ts` |

---

## 6. `libs/react-client/` — Shared Client Library (`@chainlit/react-client`)

Shared React hooks/types used by frontend, copilot, evoya-creator and evoya-files.

- **`src/`** — `useChatData.ts`, `useChatInteract.ts`, `useChatMessages.ts`, `useChatSession.ts`, `useConfig.ts`, `useAudio.ts`, `utils/group.ts`, `utils/message.ts`.
- **`wavtools/`** — audio recording stack: `wav_recorder.js`, `wav_packer.js`, `wav_renderer.ts`, `stream_processor.js`/`audio_processor.js` (AudioWorklets), `analysis/` (audio analysis + constants).
- **Build:** `tsconfig.build.json`; built first in root `buildUi` chain.

---

## 7. Other top-level items

| Path | What it is |
|---|---|
| [`theme.json`](../theme.json) | **Design tokens** (HSL CSS variables, light/dark) — documented in [`docs/DESIGN.md`](DESIGN.md) §1 |
| [`cypress/`](../cypress.config.ts) | E2E tests: `e2e/chat_context/`, `e2e/chat_profiles/`, `e2e/window_message/` (each `main.py` + `spec.cy.ts`), `fixtures/` (cat.jpeg, example.mp3/mp4, hello.py/cpp, state_of_the_union.txt), `support/` (`e2e.ts`, `run.ts`, `testUtils.ts`, `utils.ts`). Run `pnpm test:e2e` |
| [`translations/`](../translations/bn.json) | Root-level translation JSONs (bn, de*, en*, fr*, gu, he-IL, hi, it*, …) |
| [`plans/`](../plans/evoya-chainlit-migration.md) | Planning docs (migration plan) |
| [`.agents/`](../.agents) | Agent config/instructions |
| [`.github/`](../.github) | CI workflows |
| [`.husky/`](../.husky) | git hooks (pre-commit → lint-staged) |
| [`lint-staged.config.js`](../lint-staged.config.js) | staged-file lint config |
| [`.eslintrc`](../.eslintrc) / [`.eslintignore`](../.eslintignore) / [`.prettierrc`](../.prettierrc) / [`.editorconfig`](../.editorconfig) | lint/format config |
| [`pnpm-workspace.yaml`](../pnpm-workspace.yaml) | workspace definition |
| [`backend/build.py`](../backend/build.py) | backend build script |
| `images/` | repo images (`quick-start.png`) |
| `CHANGELOG.md`, `CONTRIBUTING.md`, `README.md`, `PRIVACY_POLICY.md`, `RELENG.md`, `LICENSE` | docs |

---

## 8. Agent Quick Rules

1. **UI work** → `frontend/src/components/ui/*` primitives + tokens from [`theme.json`](../theme.json); details in [`docs/DESIGN.md`](DESIGN.md).
2. **Server/API work** → `backend/chainlit/` (routes in `server.py`, socket events in `socket.py`, persistence in `data/`).
3. **Widget/embed work** → `libs/copilot/src/` (shadow DOM via `window.cl_shadowRootElement`).
4. **Editor work** → `libs/evoya-creator/src/components/markdownEditor/` (Lexical/MDX plugins).
5. **File picker work** → `libs/evoya-files/src/` (has its own `theme.json`).
6. **Shared hooks/types** → `libs/react-client/src/` — never duplicate these in app code.
7. **Package manager is pnpm only** (`only-allow pnpm`); Python uses Poetry/uv in `backend/`.
8. **Tests:** UI → `pnpm test:ui` (vitest); E2E → `pnpm test:e2e` (cypress); Python → `cd backend && uv run pytest`.