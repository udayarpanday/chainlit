import {
  RangeSelection,
  NodeSelection,
  LexicalNode,
} from "lexical";

export interface EvoyaCreatorConfig {
  enabled: boolean;
  container: HTMLElement;
  theme?: 'light' | 'dark';
  brand_color?: string | null;
  apiBaseUrl?: string;
  csrfToken?: string;
  workspaceId?: string;
  isSuperUser?: boolean;
}

export type SelectionContext = {
  lexical: RangeSelection | NodeSelection | null;
  markdown: string | null;
  selectionType: 'range' | 'node' | 'caret' | 'document' | 'codeblock' | null;
  // rectangles?: Array<DOMRect>;
  rectangles?: Array<{ height: number; width: number; top: number; left: number; }>;
  rect?: any;
  scrollOffset?: number;
  code?: string;
  selectedCode?: string;
  language?: string;
  topLevelElement?: LexicalNode;
}

export type CodeSelectionContext = {
  lexical: NodeSelection | null;
  code: string;
  selectedCode: string;
}

export const selectionContextDefaultData: SelectionContext = {
  lexical: null,
  markdown: null,
  selectionType: null,
}

export interface ImportPoint {
  append(node: LexicalNode): void
  getType(): string
}

export type CreatorMessage = {
  insertType: string; // 'none' | 'after' | 'before' | 'replace';
  content: string;
  feedback: string | null;
}
