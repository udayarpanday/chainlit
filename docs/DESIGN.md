# Chainlit Frontend Design System

> **Purpose:** This document is the single source of truth for the design system used in this repo. It is written to be **machine-readable by coding agents** (Zoo Code, Codex, etc.). Every UI element documents: file path, exports, variants, sizes, and the exact Tailwind class strings currently in use.
>
> **Stack:** React + TypeScript + Tailwind CSS + shadcn/ui (Radix primitives) + `class-variance-authority` (cva) + `tailwindcss-animate` + lucide-react icons + sonner toasts.
>
> **Utility:** All components merge classes via `cn()` from `frontend/src/lib/utils.ts` (clsx + tailwind-merge).

---

## 1. Design Tokens (theme.json)

Source: [`theme.json`](../theme.json)

Colors are HSL triplets exposed as CSS variables (`--background`, `--primary`, etc.) and consumed by Tailwind as semantic classes (`bg-background`, `text-primary`, `border-input`, ...).

| Token | Value (HSL) | Tailwind usage |
|---|---|---|
| `--background` | `0 0% 100%` | `bg-background` |
| `--foreground` | `0 0% 5%` | `text-foreground` |
| `--card` / `--card-foreground` | `0 0% 100%` / `0 0% 5%` | `bg-card`, `text-card-foreground` |
| `--popover` / `--popover-foreground` | `0 0% 100%` / `0 0% 5%` | `bg-popover`, `text-popover-foreground` |
| `--primary` | `357 100% 56%` (red/pink) | `bg-primary` |
| `--primary-foreground` | `0 0% 100%` | `text-primary-foreground` |
| `--secondary` | `210 40% 96.1%` (light blue-grey) | `bg-secondary` |
| `--secondary-foreground` | `222.2 47.4% 11.2%` | `text-secondary-foreground` |
| `--muted` / `--muted-foreground` | `0 0% 90%` / `0 0% 36%` | `bg-muted`, `text-muted-foreground` |
| `--accent` / `--accent-foreground` | `0 0% 95%` / `222.2 47.4% 11.2%` | `bg-accent`, `text-accent-foreground` |
| `--destructive` | `0 84.2% 60.2%` (red) | `bg-destructive` |
| `--destructive-foreground` | `210 40% 98%` | `text-destructive-foreground` |
| `--border` / `--input` | `0 0% 90%` | `border`, `border-input` |
| `--ring` | `357 100% 56%` | `ring-ring` |
| `--radius` | `0.75rem` | `rounded-md` etc. scale |
| `--sidebar-*` | sidebar-specific set | `bg-sidebar`, `text-sidebar-foreground`, ... |

Fonts: `--font-sans: 'Inter', sans-serif`; `--font-mono: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace`.

**Agent rule:** Never hardcode hex colors. Always use the semantic Tailwind classes above so light/dark themes keep working.

---

## 2. Global Conventions

- **Focus ring (standard):** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- **Disabled state:** `disabled:pointer-events-none disabled:opacity-50` (inputs add `disabled:cursor-not-allowed`)
- **Icon sizing inside components:** `[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`
- **Overlay/floating z-index:** `z-50` (popover, tooltip, sheet), `z-[9999]` (dialog overlay), `z-[10050]` (dropdown content)
- **Open/close animation:** `data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95` plus side-based slide (`data-[side=bottom]:slide-in-from-top-2`, etc.)
- **Shadow DOM:** Portals render into `window.cl_shadowRootElement` when present (widget embedding). Keep this behavior in all new portal components.
- **Text sizes:** body `text-sm`, headings `text-lg font-semibold` (dialog title) / `text-2xl font-semibold` (card title), muted helper text `text-sm text-muted-foreground`.

---

## 3. UI Primitives (`frontend/src/components/ui/`)

### 3.1 Button — [`button.tsx`](../frontend/src/components/ui/button.tsx)

Base: `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0`

| Variant | Classes |
|---|---|
| `default` | `bg-primary text-primary-foreground hover:bg-primary/90` |
| `destructive` | `bg-destructive text-destructive-foreground hover:bg-destructive/90` |
| `outline` | `border border-input bg-background hover:bg-accent hover:text-accent-foreground` |
| `secondary` | `bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| `ghost` | `hover:bg-accent hover:text-accent-foreground` |
| `ghost-destructive` | `hover:bg-destructive/10 text-destructive` |
| `link` | `text-primary underline-offset-4 hover:underline` |

| Size | Classes |
|---|---|
| `default` | `h-10 px-4 py-2` |
| `sm` | `h-9 rounded-md px-3` |
| `lg` | `h-11 rounded-md px-8` |
| `icon` | `h-9 w-9` |
| `xs` | `h-6 w-6 rounded-sm` |

Props: `variant`, `size`, `asChild` (Radix Slot). Exports: `Button`, `buttonVariants`.

### 3.2 Input — [`input.tsx`](../frontend/src/components/ui/input.tsx)

`flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:text-sm`

Extra prop `isGroup?: boolean` — when `true`, the focus ring classes are omitted (ring is drawn by the parent `InputGroup`): `focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1`.

### 3.3 Textarea — [`textarea.tsx`](../frontend/src/components/ui/textarea.tsx)

`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50`

### 3.4 Label — [`label.tsx`](../frontend/src/components/ui/label.tsx)

`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70`

### 3.5 Dialog / Modal — [`dialog.tsx`](../frontend/src/components/ui/dialog.tsx)

- **Overlay:** `fixed inset-0 z-[9999] bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0`
- **Content:** `fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 ... sm:rounded-lg` (fade + zoom + slide-in-from-center animation). Built-in close button (lucide `X`, `h-4 w-4`) at `absolute right-4 top-4`.
- **Header:** `flex flex-col space-y-1.5 text-center sm:text-left`
- **Footer:** `flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2`
- **Title:** `text-lg font-semibold leading-none tracking-tight`
- **Description:** `text-sm text-muted-foreground`
- Accepts `container?: Element | DocumentFragment` (shadow-root portal support).
- Exports: `Dialog, DialogPortal, DialogOverlay, DialogClose, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription`.

### 3.6 Alert Dialog (confirmation modal) — [`alert-dialog.tsx`](../frontend/src/components/ui/alert-dialog.tsx)

Radix-based confirmation modal. Same overlay/animation pattern as Dialog. Use for destructive confirmations (e.g., delete thread). Exports: `AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel`.

### 3.7 Popover — [`popover.tsx`](../frontend/src/components/ui/popover.tsx)

**Content:** `z-50 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none` + standard open/close fade/zoom + side-based slide (`data-[side=bottom]:slide-in-from-top-2` ...). Defaults: `align = 'center'`, `sideOffset = 4`. Portal targets `window.cl_shadowRootElement`. Exports: `Popover, PopoverTrigger, PopoverContent`.

### 3.8 Dropdown Menu — [`dropdown-menu.tsx`](../frontend/src/components/ui/dropdown-menu.tsx)

- **Content:** `z-[10050] min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md` + standard animations. `sideOffset = 4`.
- **Item:** `relative flex cursor-default items-center gap-1.5 rounded-md px-1.5 py-1 text-sm outline-none select-none focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 data-disabled:pointer-events-none data-disabled:opacity-50 [&_svg]:size-4`
- **SubTrigger:** `flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent` + trailing `ChevronRight`
- **CheckboxItem:** `relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm focus:bg-accent` with `Check h-4 w-4` indicator
- **Label / Separator:** label `px-2 py-1.5 text-sm font-semibold`; separator `-mx-1 my-1 h-px bg-muted`
- Exports: `DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuRadioGroup`.

### 3.9 Select — [`select.tsx`](../frontend/src/components/ui/select.tsx)

- **Trigger:** `flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1` with trailing `ChevronDown !size-5`
- **Content:** `position = 'popper'`, portal into shadow root, standard popover animation classes.
- Exports: `Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton`.

### 3.10 Command (search palette) — [`command.tsx`](../frontend/src/components/ui/command.tsx)

Built on `cmdk` + Dialog. Used for the global thread search (`Ctrl/Cmd+K`).
- **CommandDialog:** wraps `DialogContent` with `overflow-hidden p-0 shadow-lg`; inner Command styles cmdk group headings (`px-2 font-medium text-muted-foreground`), input height `h-12`, item padding `px-2 py-3`.
- **CommandInput:** wrapper `flex items-center border-b px-3` with `Search h-4 w-4 mr-2 opacity-50`; input `flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground`
- **CommandList:** `max-h-[300px] overflow-y-auto overflow-x-hidden`
- **CommandEmpty:** `py-6 text-center text-sm`
- **CommandItem:** `cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground`
- Exports: `Command, CommandDialog, CommandInput, CommandList, CommandListScrollable, CommandEmpty, CommandGroup, CommandItem, CommandSeparator, CommandShortcut`.

### 3.11 Tooltip — [`tooltip.tsx`](../frontend/src/components/ui/tooltip.tsx)

Centralized timing constants: `TOOLTIP_DELAY_MS = 500`, `TOOLTIP_SKIP_DELAY_MS = 0`.
**Content:** `z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md` + fade/zoom/slide animations. `sideOffset = 4`.
Exports: `Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipPortal`.

### 3.12 Card — [`card.tsx`](../frontend/src/components/ui/card.tsx)

- **Card:** `rounded-lg border bg-card text-card-foreground shadow-sm`
- **CardHeader:** `flex flex-col space-y-1.5 p-6`
- **CardTitle:** `text-2xl font-semibold leading-none tracking-tight`
- **CardDescription:** `text-sm text-muted-foreground`
- **CardContent:** `p-6 pt-0`; **CardFooter:** `flex items-center p-6 pt-0`

### 3.13 Badge — [`badge.tsx`](../frontend/src/components/ui/badge.tsx)

Base: `inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2`

| Variant | Classes |
|---|---|
| `default` | `border-transparent bg-primary text-primary-foreground hover:bg-primary/80` |
| `secondary` | `border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| `destructive` | `border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80` |
| `outline` | `text-foreground` |

### 3.14 Checkbox — [`checkbox.tsx`](../frontend/src/components/ui/checkbox.tsx)

`peer h-4 w-4 shrink-0 rounded-xs border border-gray-500 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary` with `Check h-4 w-4` indicator.

### 3.15 Switch — [`switch.tsx`](../frontend/src/components/ui/switch.tsx)

Track: `peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ... data-[state=checked]:bg-primary data-[state=unchecked]:bg-input`
Sizes: `default: h-6 w-11`, `sm: h-3 w-6`.
Thumb: `pointer-events-none block rounded-full bg-background shadow-lg` — `default: h-5 w-5 data-[state=checked]:translate-x-5`, `sm: h-2 w-2 data-[state=checked]:translate-x-3`.

### 3.16 Slider — [`slider.tsx`](../frontend/src/components/ui/slider.tsx)

Track `h-2 w-full grow overflow-hidden rounded-full bg-secondary`; Range `absolute h-full bg-primary`; Thumb `block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`.

### 3.17 Radio Group — [`radio-group.tsx`](../frontend/src/components/ui/radio-group.tsx)

Radix radio; item is a `h-4 w-4 rounded-full border border-input` circle with `data-[state=checked]:bg-primary` dot indicator.

### 3.18 Tabs — [`tabs.tsx`](../frontend/src/components/ui/tabs.tsx)

- **TabsList:** `inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground`
- **TabsTrigger:** `inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm`
- **TabsContent:** `mt-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`

### 3.19 Toggle / Toggle Group — [`toggle.tsx`](../frontend/src/components/ui/toggle.tsx), [`toggle-group.tsx`](../frontend/src/components/ui/toggle-group.tsx)

Base: `inline-flex items-center justify-center rounded-md font-medium ring-offset-background transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:!bg-accent data-[state=on]:text-accent-foreground gap-2`
Variants: `default: bg-transparent`, `outline: border border-input bg-transparent hover:!bg-accent`. Sizes: `default h-10 px-3`, `sm h-6 px-2.5 text-xs`, `lg h-11 px-5`.

### 3.20 Sheet (side drawer) — [`sheet.tsx`](../frontend/src/components/ui/sheet.tsx)

Overlay: `fixed inset-0 z-50 bg-black/80` + fade. Content base: `fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out` with side variants:
- `top: inset-x-0 top-0 border-b slide-in-from-top`
- `bottom: inset-x-0 bottom-0 border-t slide-in-from-bottom`
- `left: inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm`
- `right: inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm` (default)

Close button `absolute right-4 top-4` with `X h-4 w-4`. Portal into `window.cl_shadowRootElement`.

### 3.21 Table — [`table.tsx`](../frontend/src/components/ui/table.tsx)

Wrapper `relative w-full overflow-auto`; table `w-full caption-bottom text-sm`. Header rows `[&_tr]:border-b`; rows `border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted`; head cells `h-12 px-4 text-left align-middle font-medium text-muted-foreground`; cells `p-4`.

### 3.22 Other primitives

| Element | File | Key classes |
|---|---|---|
| **Separator** | [`separator.tsx`](../frontend/src/components/ui/separator.tsx) | `shrink-0 bg-border`; horizontal `h-[1px] w-full`, vertical `h-full w-[1px]` |
| **Skeleton** | [`skeleton.tsx`](../frontend/src/components/ui/skeleton.tsx) | `animate-pulse rounded-md bg-muted` |
| **Spinner** | [`spinner.tsx`](../frontend/src/components/ui/spinner.tsx) | lucide `Loader2Icon`, `size-4 animate-spin`, `role="status" aria-label="Loading"` |
| **Progress** | [`progress.tsx`](../frontend/src/components/ui/progress.tsx) | track `h-4 w-full rounded-full bg-secondary`; indicator `h-full w-full flex-1 bg-primary transition-all` (translateX) |
| **ScrollArea** | [`scroll-area.tsx`](../frontend/src/components/ui/scroll-area.tsx) | Radix; viewport `h-full w-full rounded-[inherit]`; scrollbar `w-2.5`, thumb `rounded-full bg-border` |
| **Avatar** | [`avatar.tsx`](../frontend/src/components/ui/avatar.tsx) | root `h-10 w-10 rounded-full overflow-hidden`; fallback `bg-muted rounded-full` |
| **Toaster (sonner)** | [`sonner.tsx`](../frontend/src/components/ui/sonner.tsx) | theme-aware; toast `bg-background text-foreground border-border shadow-lg`; description `text-muted-foreground`; action button `bg-primary text-primary-foreground` |
| **Accordion** | [`accordion.tsx`](../frontend/src/components/ui/accordion.tsx) | Radix accordion, chevron rotate animation |
| **Form** | [`form.tsx`](../frontend/src/components/ui/form.tsx) | react-hook-form bindings (`FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`) |
| **HoverCard** | [`hover-card.tsx`](../frontend/src/components/ui/hover-card.tsx) | Radix hover card, popover-style classes |
| **Calendar** | [`calendar.tsx`](../frontend/src/components/ui/calendar.tsx) | react-day-picker, `rounded-md bg-popover` |
| **Pagination** | [`pagination.tsx`](../frontend/src/components/ui/pagination.tsx) | button-based nav |
| **Resizable** | [`resizable.tsx`](../frontend/src/components/ui/resizable.tsx) | react-resizable-panels |
| **Carousel** | [`carousel.tsx`](../frontend/src/components/ui/carousel.tsx) | embla-based |
| **Aspect Ratio** | [`aspect-ratio.tsx`](../frontend/src/components/ui/aspect-ratio.tsx) | Radix aspect-ratio wrapper |
| **Input Group** | [`input-group.tsx`](../frontend/src/components/ui/input-group.tsx) | wraps `Input` with `is_group` + addons |
| **Item** | [`item.tsx`](../frontend/src/components/ui/item.tsx) | generic list item wrapper |

---

## 4. Composite Components (`frontend/src/components/`)

### 4.1 Search (thread search) — [`LeftSidebar/Search.tsx`](../frontend/src/components/LeftSidebar/Search.tsx)

- Trigger: `Button size="icon" variant="ghost"` with `text-muted-foreground hover:text-muted-foreground` + `Search !size-5` icon, wrapped in `Tooltip`.
- Opens `CommandDialog` via `Ctrl/Cmd+K` global keydown listener.
- Results grouped by month/year (`lodash.groupBy` on `thread.createdAt`), rendered as `CommandGroup` + `CommandItem`; `Loader` while fetching.

### 4.2 Chat Settings inputs — `frontend/src/components/ChatSettings/`

Form widgets bound to chat settings; each pairs `Label`/`InputLabel` with a primitive:

| Widget | File | Primitive used |
|---|---|---|
| Text | `TextInput.tsx` | `Input` |
| Select | `SelectInput.tsx` | `Select` |
| Multi-select | `MultiSelectInput.tsx` | `Popover` + `Command` |
| Tags | `TagsInput.tsx` | `Input` + tag chips |
| Switch | `SwitchInput.tsx` | `Switch` |
| Slider | `SliderInput.tsx` | `Slider` |
| Checkbox | `CheckboxInput.tsx` | `Checkbox` |
| Date | `DatePickerInput.tsx` | `Popover` + `Calendar` |
| Radio | `RadioButtonGroup.tsx` | `RadioGroup` |
| Layout | `index.tsx`, `ChatSettingsSidebar.tsx` | sidebar + form sections |

Shared helpers: `InputLabel.tsx` (label + optional tooltip), `InputStateHandler.tsx` (disabled/loading wrapper).

### 4.3 Message Composer — `frontend/src/components/chat/MessageComposer/`

- `Input.tsx` — auto-resizing textarea composer (`AutoResizeTextarea`), `SubmitButton` (send/stop), `UploadButton(Dropdown)`, `CommandButtons`/`CommandPopoverButton` (popover-hosted commands), `ConfigurationMenu` (dropdown), `ModePicker`, `QuotedContext`, `VoiceButton`.
- Composer container pattern: rounded border container with icon buttons in a footer row; buttons are `Button variant="ghost" size="icon"`.

### 4.4 Popover-hosted panels

- [`chat/DataProcessingPopover.tsx`](../frontend/src/components/chat/DataProcessingPopover.tsx) — data-processing notice in a `Popover`.
- `CommandPopoverButton.tsx` — command list inside `PopoverContent` using `Command` primitives.

### 4.5 Modals in use

- [`ModelPicker/ModelPickerModal.tsx`](../frontend/src/components/ModelPicker/ModelPickerModal.tsx) — model selection modal (Dialog + searchable list).
- [`share/ShareDialog.tsx`](../frontend/src/components/share/ShareDialog.tsx) — share thread dialog (Dialog + `Button` copy link).
- [`FilePickerDialog.tsx`](../frontend/src/components/FilePickerDialog.tsx) — file picker modal.
- [`Alert.tsx`](../frontend/src/components/Alert.tsx) — app-level alert banner (destructive styling).

### 4.6 Other composites

| Component | File | Notes |
|---|---|---|
| `ButtonLink` | `ButtonLink.tsx` | `Button` styles rendered as router `Link` (`asChild` pattern) |
| `CodeSnippet` | `CodeSnippet.tsx` | code block + `CopyButton` |
| `CopyButton` | `CopyButton.tsx` | icon button with copied-state feedback |
| `Kbd` | `Kbd.tsx` | keyboard hint chip: `inline-flex select-none items-center justify-center whitespace-nowrap rounded-[4px] bg-muted px-1 py-[1px] font-mono text-xs tracking-tight text-muted-foreground shadow`; platform-aware (⌘ vs Ctrl), renders `Command`/`CornerDownLeft` lucide icons (`!size-4`) for cmd/enter keys |
| `Loader` | `Loader.tsx` | full-area spinner overlay |
| `Markdown` / `MarkdownAlert` | `Markdown.tsx`, `MarkdownAlert.tsx` | message markdown rendering |
| `QuiltedGrid` | `QuiltedGrid.tsx` | starter/gallery grid layout |
| `Starter(s)` | `chat/Starters.tsx` | starter prompt cards |
| `WelcomeScreen` | `chat/WelcomeScreen.tsx` | empty state |
| `Tasklist` | `Tasklist/index.tsx` | task list with `TaskStatusIcon` states |
| `Elements/*` | `Elements/` | inline elements: Audio, Dataframe, File, Image, PDF, Plotly, Text, Video, CustomElement |
| `header/*` | `header/` | top bar: `NewChat`, `ChatProfiles`, `Share`, `ThemeToggle`, `Readme`, `ApiKeys`, `UserNav` (dropdown), `SidebarTrigger` |
| `LeftSidebar/*` | `LeftSidebar/` | app sidebar: `ThreadList`, `ThreadHistory`, `ThreadOptions`, `Search` |
| `icons/*` | `icons/` | custom SVG icons (Search, Send, Stop, Settings, Sidebar, PaperClip, auth provider logos, ...) |

---

## 5. Agent Guidelines (how to build new UI)

1. **Always import primitives from `@/components/ui/*`** — never re-style raw Radix components.
2. **Use `cn()`** (`@/lib/utils`) for conditional classes; keep primitive base classes intact by appending, not replacing.
3. **Colors:** semantic tokens only (`bg-primary`, `text-muted-foreground`, `border-input`, ...). No hex/rgb.
4. **Buttons:** pick `variant` + `size` from the tables in §3.1; icon-only buttons use `size="icon"`.
5. **Floating layers:** `Popover` for rich content, `DropdownMenu` for menus, `Tooltip` (wrap trigger in `TooltipProvider`) for hints, `Dialog`/`AlertDialog` for modals, `Sheet` for drawers. Respect the `window.cl_shadowRootElement` portal behavior.
6. **Forms:** `Label` + primitive + `text-sm text-muted-foreground` helper text; disabled/loading via `InputStateHandler` pattern.
7. **Searchable lists:** use `Command` primitives (`CommandDialog` for global palette, `Popover` + `Command` for inline search).
8. **Icons:** lucide-react at `size-4` (buttons) / `!size-5` (larger triggers); custom SVGs live in `components/icons/`.
9. **Toasts:** `import { toast } from 'sonner'`; styling is centralized in `ui/sonner.tsx`.
10. **Animations:** reuse the `data-[state=open/closed]` animate classes; do not invent new transitions.