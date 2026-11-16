import type { IMessageElement } from './types';

export interface SidebarView {
  title: string;
  elements: IMessageElement[];
  key?: string;
}

export type SidebarElementsPayload =
  IMessageElement[] | { elements: IMessageElement[]; key?: string | null };

export function applySidebarElements(
  current: SidebarView | undefined,
  payload: SidebarElementsPayload,
  resolveUrl: (key: string) => string
): SidebarView | undefined {
  const elements = Array.isArray(payload) ? payload : payload.elements;
  const key = Array.isArray(payload) ? undefined : payload.key || undefined;
  if (!elements.length) return undefined;
  if (key && current?.key === key) return current;
  return {
    title: current?.title || '',
    key,
    elements: elements.map((element) =>
      !element.url && element.chainlitKey
        ? { ...element, url: resolveUrl(element.chainlitKey) }
        : element
    )
  };
}
