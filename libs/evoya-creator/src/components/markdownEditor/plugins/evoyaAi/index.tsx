import {
  realmPlugin,
  currentSelection$,
  activeEditor$,
  withLatestFrom,
  onWindowChange$,
  readOnly$,
  inFocus$,
  addComposerChild$,
  exportMarkdownFromLexical,
  exportVisitors$,
  jsxComponentDescriptors$,
  toMarkdownExtensions$,
  toMarkdownOptions$,
  jsxIsAvailable$,
  addActivePlugin$,
  rootEditor$,
  $isImageNode,
  viewMode$,
} from "@mdxeditor/editor";

import {
  Realm,
  Signal,
  Action,
  Cell,
} from "@mdxeditor/gurx";

import {
  createDOMRange,
  createRectsFromDOMRange,
} from "@lexical/selection";

import {
  $isRangeSelection,
  $getRoot,
  $createNodeSelection,
} from "lexical";
import { RefObject } from "react";

import {
  SelectionContext,
  selectionContextDefaultData,
} from "@/types";

import { TextSelection } from "./TextSelection";
import { getSelectionAsMarkdown } from "../../utils/selection";
import { CreatorLock } from "./CreatorLock";

export const evoyaAiState$ = Cell<SelectionContext | null>(selectionContextDefaultData, (r) => {
  // r.sub(evoyaAiState$, console.log);
});
export const scrollOffset$ = Cell<number>(0);
export const editorContainerRef$ = Cell<RefObject<HTMLElement> | null>(null);

type EvoyaAiPluginParams = {
  containerRef: RefObject<HTMLElement>;
  creatorType: string;
  setRealm: (realm: Realm) => void;
  setSelectionContext: (context: SelectionContext | null) => void;
}

export const setNodeSelection$ = Signal<any>((r) => {});
export const setNodeSelectionByKey$ = Signal<any>((r) => {});
export const setCodeSelection$ = Signal<any>((r) => {});
export const resetSelection$ = Action((r) => {});
export const selectDocument$ = Action((r) => {});
export const resetDocument$ = Action((r) => {});
export const creatorType$ = Cell<string>('', (r) => {});

export const evoyaAiPlugin = realmPlugin<EvoyaAiPluginParams>({
  init: (realm, params) => {
    if (params?.setRealm) {
      params.setRealm(realm);
    }
    realm.sub(realm.pipe(selectDocument$, withLatestFrom(activeEditor$)), ([value, activeEditor]) => {
      // activeEditor?.update(() => {
      //   $selectAll();
      // });
      const selectionContext = {
        lexical: null,
        markdown: null,
        selectionType: 'document' as const,
      };
      
      if (params?.setSelectionContext) {
        params.setSelectionContext(selectionContext);
      }

      realm.pub(evoyaAiState$, selectionContext);
    });

    realm.sub(realm.pipe(resetDocument$, withLatestFrom(activeEditor$)), ([value, activeEditor]) => {
      activeEditor?.update(() => {
        const root = $getRoot();
        root.clear();
      });
    });

    realm.pubIn({
      [addActivePlugin$]: 'evoyaAi',
      [creatorType$]: params?.creatorType,
      [editorContainerRef$]: params?.containerRef,
      // [addLexicalNode$]: MarkNode,
    });

    realm.pub(addComposerChild$, TextSelection);
    realm.pub(addComposerChild$, CreatorLock);
    // realm.pub(replaceSelectionContent$, null);

    realm.sub(resetSelection$, () => {
      const selectionContext = {
        lexical: null,
        markdown: null,
        selectionType: null,
      };
      if (params?.setSelectionContext) {
        params.setSelectionContext(selectionContext);
      }
      realm.pub(evoyaAiState$, selectionContext);
    });
    realm.sub(realm.pipe(realm.combine(currentSelection$, onWindowChange$), withLatestFrom(activeEditor$, readOnly$, inFocus$)), ([[selection], activeEditor, readOnly, inFocus]) => {
      const viewMode = realm.getValue(viewMode$)
      if (viewMode === 'source' || viewMode === 'diff') {
        return ''
      }

      if (!activeEditor) {
        return ''
      }

      // Get all export parameters from realm
      const visitors = realm.getValue(exportVisitors$);
      const toMarkdownExtensions = realm.getValue(toMarkdownExtensions$);
      const toMarkdownOptions = realm.getValue(toMarkdownOptions$);
      const jsxComponentDescriptors = realm.getValue(jsxComponentDescriptors$);
      const jsxIsAvailable = realm.getValue(jsxIsAvailable$);

      if (activeEditor && selection && !readOnly) {
        if ($isRangeSelection(selection)) {
          const startPoint = selection.isBackward() ? selection.focus : selection.anchor;
          const endPoint = !selection.isBackward() ? selection.focus : selection.anchor;
          const domRange = createDOMRange(activeEditor, startPoint.getNode(), startPoint.offset, endPoint.getNode(), endPoint.offset);
          const rects = domRange ? createRectsFromDOMRange(activeEditor, domRange) : [];

          if (params?.setSelectionContext) {
            const markdown = getSelectionAsMarkdown(activeEditor, {
              visitors,
              toMarkdownExtensions,
              toMarkdownOptions,
              jsxComponentDescriptors,
              jsxIsAvailable
            });

            console.log(markdown);
            console.log(rects);

            const selectionContext = {
              rectangles: rects,
              markdown,
              lexical: null,
              selectionType: 'range' as const,
            };
            params.setSelectionContext(selectionContext);
            realm.pub(evoyaAiState$, selectionContext);
          }
        } else {
          console.log('unhandled selection');
        }
      }
    });
    realm.sub(realm.pipe(setNodeSelectionByKey$, withLatestFrom(rootEditor$, activeEditor$)), ([value, rootEditor, activeEditor]) => {
      rootEditor?.update(() => {
        const selection = $createNodeSelection();
        selection.add(value);
        realm.pub(setNodeSelection$, selection.getNodes()[0]);
      });
    });
    realm.sub(realm.pipe(setNodeSelection$, withLatestFrom(rootEditor$, activeEditor$)), ([value, rootEditor, activeEditor]) => {
      const selection = $createNodeSelection();
      selection.add(value.__key);

      let mdExportTarget = value;
      if ($isImageNode(value)) {
        mdExportTarget = value.getParent();
      }

      const selMd = exportMarkdownFromLexical({
        root: mdExportTarget,
        visitors: realm.getValue(exportVisitors$),
        jsxComponentDescriptors: realm.getValue(jsxComponentDescriptors$),
        toMarkdownExtensions: realm.getValue(toMarkdownExtensions$),
        toMarkdownOptions: realm.getValue(toMarkdownOptions$),
        jsxIsAvailable: realm.getValue(jsxIsAvailable$)
      });
      console.log(selMd);

      let scrollOffset = 0;
      if (params?.containerRef?.current) {
        scrollOffset = params?.containerRef.current.scrollTop;
      }
      
      rootEditor?.update(() => {
        const domElement = rootEditor.getElementByKey(value.getKey());
        let newRect;
        if (domElement) {
          newRect = domElement.getBoundingClientRect()
        }

        const selectionContext = {
          lexical: selection,
          markdown: selMd,
          selectionType: 'node' as const,
          rect: newRect,
          scrollOffset
        };
        
        if (params?.setSelectionContext) {
          params.setSelectionContext(selectionContext);
        }
  
        realm.pubIn({
          [evoyaAiState$]: selectionContext,
          [inFocus$]: false
        });
      });
    });
    realm.sub(realm.pipe(setCodeSelection$, withLatestFrom(rootEditor$, activeEditor$)), ([value, rootEditor, activeEditor]) => {
      const selection = $createNodeSelection();
      selection.add(value.nodeKey);

      const selectionContext = {
        lexical: selection,
        markdown: null,
        selectionType: 'codeblock' as const,
        code: value.code,
        selectedCode: value.selection,
        language: value.language,
      };
      
      if (params?.setSelectionContext) {
        params.setSelectionContext(selectionContext);
      }

      realm.pub(evoyaAiState$, selectionContext);
    });
  },
  update(realm, params) {
    realm.pub(editorContainerRef$, params?.containerRef);
  }
});