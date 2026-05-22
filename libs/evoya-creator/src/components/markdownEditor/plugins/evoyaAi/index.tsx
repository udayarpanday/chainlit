import {
  realmPlugin,
  currentSelection$,
  activeEditor$,
  withLatestFrom,
  onWindowChange$,
  readOnly$,
  inFocus$,
  addComposerChild$,
  exportVisitors$,
  jsxComponentDescriptors$,
  toMarkdownExtensions$,
  toMarkdownOptions$,
  jsxIsAvailable$,
  addActivePlugin$,
  rootEditor$,
  $isImageNode,
  viewMode$,
  addLexicalNode$,
  addExportVisitor$,
} from "@mdxeditor/editor";

import {
  Realm,
  Signal,
  Action,
  Cell,
} from "@mdxeditor/gurx";

import {
  $wrapNodes,
} from "@lexical/selection";

import {
  LexicalNode,
  $isRangeSelection,
  $getRoot,
  $setSelection,
  $createNodeSelection,
  $getSelection,
  $getNodeByKey,
  getNearestEditorFromDOMNode,
} from "lexical";

import { RefObject } from "react";

import {
  SelectionContext,
  selectionContextDefaultData,
  CodeSelectionContext,
  CreatorMessage,
} from "@/types";

import { TextSelection } from "./TextSelection";
import { getSelectionAsMarkdown } from "../../utils/selection";
import { CreatorLock } from "./CreatorLock";

import { tryImportingMarkdown } from "@/components/markdownEditor/utils/markdown";

import {
  $createComparisonNode,
  $createComparisonSideNode,
  ComparisonActionsPortal,
  ComparisonNode,
  ComparisonSideNode,
  LexicalComparisonSideVisitor,
  LexicalComparisonVisitor
} from "./DiffNode";

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

export const approveDiffNode$ = Signal<{ key: string; }>((realm) => {
  realm.sub(realm.pipe(approveDiffNode$, withLatestFrom(rootEditor$, comparisonNodeKeys$)), ([value, rootEditor, comparisonNodeKeys]) => {
    if (rootEditor) {
      const rootEditorDom = rootEditor.getRootElement();
      const comparisonElement = rootEditorDom?.querySelector(`.comparison-actions[data-node-key="${value.key}"]`)

      if (comparisonElement) {
        const theEditor = getNearestEditorFromDOMNode(comparisonElement);

        theEditor?.update(() => {
          const diffNode = $getNodeByKey(value.key) as ComparisonNode;
          const sideNodes = diffNode.getChildren();

          const newContentNode = (sideNodes as ComparisonSideNode[]).find((node) => node.__side === 'new');
          const contentNodes = newContentNode.getChildren();

          contentNodes.forEach((node) => {
            diffNode.insertBefore(node);
          });
          diffNode.remove();
        }, {
          onUpdate: () => realm.pub(updateComparisonNodeKeys$)
        });
      }
    }
  })
});

export const rejectDiffNode$ = Signal<{ key: string; }>((realm) => {
  realm.sub(realm.pipe(rejectDiffNode$, withLatestFrom(rootEditor$, comparisonNodeKeys$)), ([value, rootEditor, comparisonNodeKeys]) => {
    if (rootEditor) {
      const rootEditorDom = rootEditor.getRootElement();
      const comparisonElement = rootEditorDom?.querySelector(`.comparison-actions[data-node-key="${value.key}"]`)

      if (comparisonElement) {
        const theEditor = getNearestEditorFromDOMNode(comparisonElement);

        theEditor?.update(() => {
          const diffNode = $getNodeByKey(value.key) as ComparisonNode;
          const sideNodes = diffNode.getChildren();

          if (!diffNode.__onlyInsert) {
            const newContentNode = (sideNodes as ComparisonSideNode[]).find((node) => node.__side === 'current');
            const contentNodes = newContentNode.getChildren();

            contentNodes.forEach((node) => {
              diffNode.insertBefore(node);
            });
          }

          diffNode.remove();
        }, {
          onUpdate: () => realm.pub(updateComparisonNodeKeys$)
        });
      }
    }
  })
});

export const replaceSelectionContent$ = Signal<{ message: CreatorMessage, context: SelectionContext}>((realm) => {
  realm.sub(realm.pipe(replaceSelectionContent$, withLatestFrom(activeEditor$, comparisonNodeKeys$)), ([value, activeEditor, comparisonNodeKeys]) => {
    console.log(value);
    if (value && value.message && value.context) {
      const selectionContext = value.context;
      const lexicalSelection = value.context.lexical;
      const selectionType = value.context.selectionType;
      const insertType = value.message.insertType;

      realm.pub(viewMode$, 'rich-text');

      console.log("selectionType", selectionType);
      console.log("insertType", insertType);
      if (selectionType === 'node') {
        activeEditor?.update(() => {
          const lexicalNodes = lexicalSelection?.getNodes() ?? [];
          console.log(lexicalNodes);

          const comparisonNode = $createComparisonNode(insertType !== 'replace');
          
          // Create new side
          const newSide = $createComparisonSideNode('new');

          const importPoint = {
            children: [] as LexicalNode[],
            append(node: LexicalNode) {
              this.children.push(node)
            },
            getType() {
              // return lexicalSelection.getNodes()[0].getType();
              return 'importroot';
            }
          }

          tryImportingMarkdown(realm, importPoint, value.message.content);
          console.log('importPoint', importPoint);
          const importChildren = importPoint.children;
          console.log('importChildren', importChildren);

          newSide.append(...importChildren);

          if (insertType === 'replace') {
            lexicalNodes[lexicalNodes.length - 1].insertAfter(comparisonNode);
            // Create current side
            const currentSide = $createComparisonSideNode('current');
            currentSide.append(...(lexicalNodes ?? []));
            comparisonNode.append(currentSide, newSide);
          } else if (insertType === 'after') {
            lexicalNodes[lexicalNodes.length - 1].insertAfter(comparisonNode);
            comparisonNode.append(newSide);
          } else if (insertType === 'before') {
            lexicalNodes[0].insertBefore(comparisonNode);
            comparisonNode.append(newSide);
          }

          realm.pub(resetSelection$);

          $setSelection(null);
        }, {
          onUpdate: () => realm.pub(updateComparisonNodeKeys$)
        });
      } else if (selectionType === 'range') {
        // dont need to handle for now
        // if (insertType === 'replace') {
        // } else if (insertType === 'after') {
        // } else if (insertType === 'before') {
        // }
      } else if (selectionType === 'document') {
        activeEditor?.update(() => {
          const lexicalNodes = $getRoot().getChildren() ?? [];
          console.log($getRoot(), lexicalNodes);

          const comparisonNode = $createComparisonNode(insertType !== 'replace');
          
          // Create new side
          const newSide = $createComparisonSideNode('new');

          const importPoint = {
            children: [] as LexicalNode[],
            append(node: LexicalNode) {
              this.children.push(node)
            },
            getType() {
              // return lexicalSelection.getNodes()[0].getType();
              return 'importroot';
            }
          }

          tryImportingMarkdown(realm, importPoint, value.message.content);
          console.log('importPoint', importPoint);
          const importChildren = importPoint.children;
          console.log('importChildren', importChildren);

          newSide.append(...importChildren);

          if (insertType === 'replace') {
            lexicalNodes[lexicalNodes.length - 1].insertAfter(comparisonNode);
            // Create current side
            const currentSide = $createComparisonSideNode('current');
            currentSide.append(...(lexicalNodes ?? []));
            comparisonNode.append(currentSide, newSide);
          } else if (insertType === 'after') {
            lexicalNodes[lexicalNodes.length - 1].insertAfter(comparisonNode);
            comparisonNode.append(newSide);
          } else if (insertType === 'before') {
            lexicalNodes[0].insertBefore(comparisonNode);
            comparisonNode.append(newSide);
          }

          realm.pub(resetSelection$);

          $setSelection(null);
        }, {
          onUpdate: () => realm.pub(updateComparisonNodeKeys$)
        });
      }
    }
  });
});

export const setNodeSelection$ = Signal<any>((r) => {});
export const setNodeSelectionByKey$ = Signal<any>((r) => {});
export const setCodeSelection$ = Signal<any>((r) => {});
export const resetSelection$ = Action((r) => {});
export const selectDocument$ = Action((r) => {});
export const resetDocument$ = Action((r) => {});
export const updateComparisonNodeKeys$ = Action((r) => {});
export const creatorType$ = Cell<string>('', (r) => {});
export const evoyaViewType$ = Cell<"default" | "approve">('default', (r) => {});
export const evoyaAutoApprove$ = Cell<boolean>(false, (r) => {});
export const comparisonNodeKeys$ = Cell<string[]>([], (r) => {});

export const evoyaAiPlugin = realmPlugin<EvoyaAiPluginParams>({
  init: (realm, params) => {
    if (params?.setRealm) {
      params.setRealm(realm);
    }
    realm.sub(selectDocument$, () => {
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

    realm.sub(realm.pipe(resetDocument$, withLatestFrom(rootEditor$)), ([value, rootEditor]) => {
      rootEditor?.update(() => {
        const root = $getRoot();
        root.clear();
      });
    });

    realm.pubIn({
      [addActivePlugin$]: 'evoyaAi',
      [creatorType$]: params?.creatorType,
      [editorContainerRef$]: params?.containerRef,
      [addLexicalNode$]: [ComparisonNode, ComparisonSideNode],
      [addExportVisitor$]: [LexicalComparisonVisitor, LexicalComparisonSideVisitor],
    });

    realm.pub(addComposerChild$, TextSelection);
    realm.pub(addComposerChild$, CreatorLock);
    realm.pub(addComposerChild$, ComparisonActionsPortal);

    realm.sub(realm.pipe(updateComparisonNodeKeys$, withLatestFrom(rootEditor$)), ([__, rootEditor]) => {
      if (rootEditor) {
        const comparisonNodes = (Array.from(rootEditor.getRootElement()?.querySelectorAll('.comparison-actions') ?? []) as HTMLDivElement[]).map((el) => el.dataset.nodeKey)
        console.log('calc comparisonNodes', comparisonNodes)
        realm.pub(comparisonNodeKeys$, comparisonNodes);
      }
    });
    realm.sub(realm.pipe(comparisonNodeKeys$, withLatestFrom(evoyaAutoApprove$)), ([comparisonNodeKeys, evoyaAutoApprove]) => {
      if (evoyaAutoApprove && comparisonNodeKeys.length > 0) {
        comparisonNodeKeys.forEach((key) => realm.pub(approveDiffNode$, { key }));
      } else {
        realm.pub(evoyaViewType$, comparisonNodeKeys.length > 0 ? "approve" : "default");
      }
    });
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
    // Monitor if it causes issues, but currently it fixes resetting selection of table cell content when clicking to the chat input, because root editor selection was still there
    realm.sub(realm.pipe(realm.combine(activeEditor$, currentSelection$), withLatestFrom(rootEditor$)), ([[activeEditor], rootEditor]) => {
      if (activeEditor && activeEditor._config.namespace === "TableCellEditor" && activeEditor.getRootElement() === document.activeElement && rootEditor) {
        rootEditor.read(() => {
          const selection = $getSelection();
          if (selection) {
            console.log('removing root selection')
            rootEditor.update(() => {
              $setSelection(null);
              rootEditor.blur();
            });
          }
        })
      }
    });
    realm.sub(realm.pipe(realm.combine(currentSelection$, onWindowChange$), withLatestFrom(activeEditor$, rootEditor$, readOnly$, inFocus$, viewMode$)), ([[selection], activeEditor, rootEditor, readOnly, inFocus, viewMode]) => {
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

      let scrollOffset = 0;

      if (activeEditor && selection && !readOnly && inFocus) {
        if (selection.anchor.is(selection.focus)) {
          const selectionContext = {
            lexical: null,
            markdown: null,
            selectionType: null,
            insertType: null
          };
          
          if (params?.setSelectionContext) {
            params.setSelectionContext(selectionContext);
          }
          realm.pub(evoyaAiState$, selectionContext);
        } else {
          if (params?.containerRef?.current) {
            scrollOffset = params?.containerRef.current.scrollTop;
          }
          if ($isRangeSelection(selection)) {
            // $ensureForwardRangeSelection(selection);


            // const startEnd = selection.getStartEndPoints();
            // const restoredSelection = $createRangeSelection();
            // const startOffset = startEnd[0].offset;
            // const endOffset = startEnd[1].offset;
            // restoredSelection.anchor.set(startEnd[0].key, startOffset, 'text');
            // restoredSelection.focus.set(startEnd[1].key, endOffset, 'text');
            // console.log(restoredSelection);

            const startPoint = selection.anchor;
            const endPoint = selection.focus;

            console.log(startPoint, endPoint);

            if (startPoint.key !== endPoint.key) {
              const topElements = selection.getNodes().reduce((acc: LexicalNode[], el: LexicalNode) => {
                const topEl = el.getTopLevelElement();
                const topElKey = topEl?.getKey();
                if (topEl && topElKey && !acc.find((item) => item.getKey() === topElKey)) {
                  return [...acc, topEl]
                }
                return acc;
              }, [])
              const nodeSelection = $createNodeSelection();
              topElements.forEach((el) => nodeSelection.add(el.__key))

              const nodeRects = topElements.map((node) => {
                const domNode = activeEditor.getElementByKey(node.getKey());
                let leftOffset = 0;
                let topOffset = 0;

                if (domNode) {
                  if (activeEditor._config.namespace === "TableCellEditor") {
                    const tdElement = activeEditor._rootElement?.parentElement;
                    leftOffset += (tdElement?.offsetLeft ?? 0);
                    topOffset += (tdElement?.offsetTop ?? 0);

                    const tableElement: HTMLDivElement | null | undefined = tdElement?.closest(".evoya-table-wrapper");
                    leftOffset += (tableElement?.offsetLeft ?? 0);
                    topOffset += (tableElement?.offsetTop ?? 0);
                  }

                  return {
                    height: domNode.offsetHeight,
                    width: domNode.offsetWidth,
                    top: domNode.offsetTop + topOffset,
                    left: domNode.offsetLeft + leftOffset
                  }
                }

                return {
                  height: 0,
                  width: 0,
                  top: 0,
                  left: 0
                }
              });

              if (params?.setSelectionContext) {
                const markdown = getSelectionAsMarkdown(activeEditor, nodeSelection, {
                  visitors,
                  toMarkdownExtensions,
                  toMarkdownOptions,
                  jsxComponentDescriptors,
                  jsxIsAvailable
                });

                const selectionContext = {
                  rectangles: nodeRects,
                  markdown,
                  lexical: nodeSelection,
                  selectionType: 'node' as const,
                  scrollOffset,
                };
                params.setSelectionContext(selectionContext);
                realm.pub(evoyaAiState$, selectionContext);
              }
            } else {
              const topLevelNode = startPoint.getNode().getTopLevelElement();
              const nodeSelection = $createNodeSelection();
              nodeSelection.add(topLevelNode.__key)
              const domElement = activeEditor.getElementByKey(topLevelNode.getKey());
              const rects = [];
              if (domElement) {
                let leftOffset = 0;
                let topOffset = 0;

                if (activeEditor._config.namespace === "TableCellEditor") {
                  const tdElement = activeEditor._rootElement?.parentElement;
                  leftOffset += (tdElement?.offsetLeft ?? 0);
                  topOffset += (tdElement?.offsetTop ?? 0);

                  const tableElement: HTMLDivElement | null | undefined = tdElement?.closest(".evoya-table-wrapper");
                  leftOffset += (tableElement?.offsetLeft ?? 0);
                  topOffset += (tableElement?.offsetTop ?? 0);
                }

                rects.push({
                  height: domElement?.offsetHeight,
                  width: domElement?.offsetWidth,
                  top: domElement?.offsetTop + topOffset,
                  left: domElement?.offsetLeft + leftOffset
                });

                if (params?.setSelectionContext) {
                  const markdown = getSelectionAsMarkdown(activeEditor, nodeSelection, {
                    visitors,
                    toMarkdownExtensions,
                    toMarkdownOptions,
                    jsxComponentDescriptors,
                    jsxIsAvailable
                  });

                  const selectionContext = {
                    rectangles: rects,
                    markdown,
                    lexical: nodeSelection,
                    selectionType: 'node' as const,
                    scrollOffset,
                  };
                  params.setSelectionContext(selectionContext);
                  realm.pub(evoyaAiState$, selectionContext);
                }
              }
            }
          } else {
            console.log('unhandled selection');
          }
        }
      } else {
        if (params?.setSelectionContext) {
          params.setSelectionContext(selectionContextDefaultData);
        }
        realm.pub(evoyaAiState$, selectionContextDefaultData);
      }
    });
    realm.sub(realm.pipe(setNodeSelectionByKey$, withLatestFrom(rootEditor$, activeEditor$)), ([value, rootEditor, activeEditor]) => {
      activeEditor?.read(() => {
        realm.pub(setNodeSelection$, $getNodeByKey(value));
      });
    });
    realm.sub(realm.pipe(setNodeSelection$, withLatestFrom(rootEditor$, activeEditor$)), ([value, rootEditor, activeEditor]) => {
      if (activeEditor) {
        const nodeSelection = $createNodeSelection();
        nodeSelection.add(value.getKey());
        let domElement = activeEditor.getElementByKey(value.getKey());
        const rects = [];
        if (domElement) {
          if ($isImageNode(value)) {
            const wrapperChild = domElement.firstElementChild;
            if (wrapperChild) {
              domElement = wrapperChild as HTMLDivElement;
            }
          }
          rects.push({
            height: domElement.offsetHeight,
            width: domElement.offsetWidth,
            top: domElement.offsetTop,
            left: domElement.offsetLeft
          });
        }
        if (params?.setSelectionContext) {
          const visitors = realm.getValue(exportVisitors$);
          const toMarkdownExtensions = realm.getValue(toMarkdownExtensions$);
          const toMarkdownOptions = realm.getValue(toMarkdownOptions$);
          const jsxComponentDescriptors = realm.getValue(jsxComponentDescriptors$);
          const jsxIsAvailable = realm.getValue(jsxIsAvailable$);

          const markdown = getSelectionAsMarkdown(activeEditor, nodeSelection, {
            visitors,
            toMarkdownExtensions,
            toMarkdownOptions,
            jsxComponentDescriptors,
            jsxIsAvailable
          });

          console.log(nodeSelection)

          const selectionContext = {
            rectangles: rects,
            markdown,
            lexical: nodeSelection,
            selectionType: 'node' as const,
            scrollOffset: 0,
          };
          params.setSelectionContext(selectionContext);
          realm.pubIn({
            [evoyaAiState$]: selectionContext,
            [inFocus$]: false
          });
        }
      }
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