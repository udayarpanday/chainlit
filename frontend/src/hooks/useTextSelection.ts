import { RefObject, useCallback, useEffect, useState } from 'react';

import {
  containsAcrossShadow,
  getEventTarget,
  getUISelection
} from '@/lib/dom';

export interface TextSelectionRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
  width: number;
  height: number;
}

export interface TextSelectionInfo {
  text: string;
  rect: TextSelectionRect;
}

/** Id of the floating toolbar; clicks on it must not drop the selection. */
export const SELECTION_TOOLBAR_ID = 'selection-action-bar';

const normalizeText = (value: string) =>
  value
    // Remove the blinking cursor placeholder and zero width chars
    .replace(/\u200b/g, '')
    .replace(/\r\n/g, '\n')
    // Trim trailing spaces per line but keep line breaks
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/g, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const isInsideToolbar = (target: Node | null) => {
  if (!target) return false;
  const element =
    target instanceof Element
      ? target
      : (target.parentElement as Element | null);
  return !!element?.closest(`#${SELECTION_TOOLBAR_ID}`);
};

const isSelectionInside = (selection: Selection, container: HTMLElement) => {
  if (selection.rangeCount === 0) return false;
  const range = selection.getRangeAt(0);
  return (
    containsAcrossShadow(container, range.startContainer) &&
    containsAcrossShadow(container, range.endContainer)
  );
};

interface Options {
  /** When false, listeners are detached and any pending selection is dropped. */
  enabled?: boolean;
}

/**
 * Tracks the text the user selected inside `containerRef`.
 *
 * Returns the normalized selected text together with the bounding rect of the
 * selection (viewport coordinates) so callers can anchor a floating toolbar.
 * Works inside the copilot shadow root as well as in the standalone app.
 */
export function useTextSelection(
  containerRef: RefObject<HTMLElement>,
  { enabled = true }: Options = {}
) {
  const [selection, setSelection] = useState<TextSelectionInfo | undefined>();

  const clear = useCallback(() => {
    setSelection((current) => (current ? undefined : current));
  }, []);

  const readSelection = useCallback(() => {
    const container = containerRef.current;
    if (!container) return clear();

    const domSelection = getUISelection(container);

    if (
      !domSelection ||
      domSelection.isCollapsed ||
      !isSelectionInside(domSelection, container)
    ) {
      return clear();
    }

    const text = normalizeText(domSelection.toString());
    if (!text) return clear();

    const domRect = domSelection.getRangeAt(0).getBoundingClientRect();
    if (!domRect || (domRect.width === 0 && domRect.height === 0)) {
      return clear();
    }

    setSelection({
      text,
      rect: {
        top: domRect.top,
        bottom: domRect.bottom,
        left: domRect.left,
        right: domRect.right,
        width: domRect.width,
        height: domRect.height
      }
    });
  }, [clear, containerRef]);

  useEffect(() => {
    if (!enabled) {
      clear();
      return;
    }

    const onPointerUp = (event: Event) => {
      if (isInsideToolbar(getEventTarget(event))) return;
      // Let the browser commit the selection before reading it.
      window.setTimeout(readSelection, 0);
    };

    const onPointerDown = (event: Event) => {
      const container = containerRef.current;
      const target = getEventTarget(event);
      // Clicking anywhere collapses the current selection, except when the
      // click happens on the floating toolbar itself (otherwise the toolbar
      // would unmount before its click handler runs).
      if (isInsideToolbar(target)) return;
      if (!container || !containsAcrossShadow(container, target)) {
        clear();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clear();
        return;
      }
      if (event.shiftKey || event.ctrlKey || event.metaKey) {
        window.setTimeout(readSelection, 0);
      }
    };

    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchend', onPointerUp);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mouseup', onPointerUp);
      document.removeEventListener('touchend', onPointerUp);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [clear, containerRef, enabled, readSelection]);

  // Hide the toolbar while scrolling/resizing to avoid a detached bubble.
  useEffect(() => {
    if (!enabled || !selection) return;

    const onViewportChange = () => clear();

    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);

    return () => {
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('resize', onViewportChange);
    };
  }, [clear, enabled, selection]);

  return { selection, clearSelection: clear };
}

export default useTextSelection;
