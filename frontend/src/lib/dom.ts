/**
 * DOM helpers that work both in the standalone app and inside the copilot
 * widget, which renders into a shadow root (see `libs/copilot/index.tsx`).
 */

const getWidgetShadowRoot = (): ShadowRoot | undefined => {
  const widgetRoot = (window as any).cl_shadowRootElement?.getRootNode?.();
  return widgetRoot instanceof ShadowRoot ? widgetRoot : undefined;
};

/**
 * Returns the closest `Document` or `ShadowRoot` owning `node`, falling back to
 * the copilot shadow root (when mounted) and finally to `document`.
 */
export const getUIRoot = (node?: Node | null): Document | ShadowRoot => {
  const root = node?.getRootNode?.();
  if (root instanceof ShadowRoot) return root;
  if (root instanceof Document) return root;
  return getWidgetShadowRoot() ?? document;
};

/** `getElementById` that also looks inside the copilot shadow root. */
export const getUIElementById = (
  id: string,
  node?: Node | null
): HTMLElement | null => {
  const root = getUIRoot(node);
  const byId = (root as Document | (ShadowRoot & { getElementById?: unknown }))
    .getElementById as ((elementId: string) => HTMLElement | null) | undefined;

  const found = byId ? byId.call(root, id) : null;
  if (found) return found;

  return (
    (root.querySelector(`#${CSS.escape(id)}`) as HTMLElement | null) ??
    document.getElementById(id)
  );
};

/**
 * Where floating/portaled UI should be mounted: inside the shadow root when the
 * component lives in the copilot widget (so the widget styles apply), and
 * `document.body` otherwise.
 */
export const getPortalContainer = (node?: Node | null): Element => {
  const root = getUIRoot(node);
  if (root instanceof ShadowRoot) {
    return (
      (root.getElementById?.('cl-shadow-root') as Element | null) ??
      root.firstElementChild ??
      document.body
    );
  }
  return document.body;
};

/**
 * The deepest event target, piercing shadow boundaries (`event.target` is
 * retargeted to the shadow host once the event leaves the shadow tree).
 */
export const getEventTarget = (event: Event): Node | null =>
  (event.composedPath?.()[0] as Node | undefined) ??
  (event.target as Node | null);

/** `Node.contains` that also walks up through shadow hosts. */
export const containsAcrossShadow = (
  container: Node,
  node: Node | null
): boolean => {
  let current: Node | null = node;

  while (current) {
    if (container.contains(current)) return true;

    const root = current.getRootNode?.();
    current = root instanceof ShadowRoot ? root.host : null;
  }

  return false;
};

/**
 * Active text selection, preferring the shadow root selection API (Chromium)
 * so selections made inside the copilot widget are readable.
 */
export const getUISelection = (node?: Node | null): Selection | null => {
  const root = getUIRoot(node);
  const shadowSelection = (
    root as ShadowRoot & { getSelection?: () => Selection | null }
  ).getSelection?.();

  if (shadowSelection && !shadowSelection.isCollapsed) return shadowSelection;

  return window.getSelection();
};

/** Character offsets for a DOM range relative to a containing element. */
export const getTextRangeOffsets = (
  container: HTMLElement,
  range: Range
): { start: number; end: number } => {
  const before = container.ownerDocument.createRange();
  before.selectNodeContents(container);
  before.setEnd(range.startContainer, range.startOffset);

  const start = before.toString().length;
  return { start, end: start + range.toString().length };
};

/** Rebuilds a DOM range from character offsets in an element's text nodes. */
export const getTextRangeFromOffsets = (
  container: HTMLElement,
  start: number,
  end: number
): Range | null => {
  const nodeFilter =
    container.ownerDocument.defaultView?.NodeFilter ?? NodeFilter;
  const walker = container.ownerDocument.createTreeWalker(
    container,
    nodeFilter.SHOW_TEXT
  );

  let currentOffset = 0;
  let startBoundary: { node: Text; offset: number } | undefined;
  let endBoundary: { node: Text; offset: number } | undefined;
  let lastTextNode: Text | undefined;
  let node = walker.nextNode() as Text | null;

  while (node) {
    lastTextNode = node;
    const nextOffset = currentOffset + node.data.length;

    if (!startBoundary && start <= nextOffset) {
      startBoundary = {
        node,
        offset: Math.max(0, start - currentOffset)
      };
    }
    if (end <= nextOffset) {
      endBoundary = {
        node,
        offset: Math.max(0, end - currentOffset)
      };
      break;
    }

    currentOffset = nextOffset;
    node = walker.nextNode() as Text | null;
  }

  if (!lastTextNode) return null;

  startBoundary ??= { node: lastTextNode, offset: lastTextNode.data.length };
  endBoundary ??= { node: lastTextNode, offset: lastTextNode.data.length };

  const range = container.ownerDocument.createRange();
  range.setStart(startBoundary.node, startBoundary.offset);
  range.setEnd(endBoundary.node, endBoundary.offset);
  return range;
};

const getParentElementAcrossShadow = (
  element: HTMLElement
): HTMLElement | null => {
  if (element.parentElement) return element.parentElement;
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? (root.host as HTMLElement) : null;
};

/** Centers the first line of a text range in its nearest scroll container. */
export const scrollTextRangeIntoView = (range: Range) => {
  const rect = range.getClientRects()[0] ?? range.getBoundingClientRect();
  const startElement =
    range.startContainer instanceof HTMLElement
      ? range.startContainer
      : range.startContainer.parentElement;

  if (!startElement) return false;

  let ancestor = getParentElementAcrossShadow(startElement);
  while (ancestor) {
    const { overflowY } = getComputedStyle(ancestor);
    if (
      /(auto|scroll|overlay)/.test(overflowY) &&
      ancestor.scrollHeight > ancestor.clientHeight
    ) {
      const ancestorRect = ancestor.getBoundingClientRect();
      ancestor.scrollTo({
        top:
          ancestor.scrollTop +
          rect.top -
          ancestorRect.top -
          (ancestor.clientHeight - rect.height) / 2,
        behavior: 'smooth'
      });
      return true;
    }
    ancestor = getParentElementAcrossShadow(ancestor);
  }

  const view = (range.startContainer.ownerDocument ?? document).defaultView;
  view?.scrollBy({
    top: rect.top - (view.innerHeight - rect.height) / 2,
    behavior: 'smooth'
  });
  return !!view;
};
