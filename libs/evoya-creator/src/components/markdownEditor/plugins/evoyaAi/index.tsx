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
  insertMarkdown$,
  exportVisitors$,
  jsxComponentDescriptors$,
  toMarkdownExtensions$,
  toMarkdownOptions$,
  jsxIsAvailable$,
  importVisitors$,
  mdastExtensions$,
  syntaxExtensions$,
  directiveDescriptors$,
  codeBlockEditorDescriptors$,
  addActivePlugin$,
  rootEditor$,
  $isTableNode,
  $isCodeBlockNode,
  $createCodeBlockNode,
  $isImageNode,
  viewMode$,
  addLexicalNode$,
  addExportVisitor$,
  createRootEditorSubscription$
} from "@mdxeditor/editor";

import {
  Realm,
  Signal,
  Action,
  Cell,
} from "@mdxeditor/gurx";

import {
  $wrapNodes,
  $isAtNodeEnd,
  $patchStyleText,
  createDOMRange,
  createRectsFromDOMRange,
  $ensureForwardRangeSelection,
} from "@lexical/selection";

import {
  $isTableCellNode,
} from "@lexical/table";

import {
  $isListItemNode,
  $isListNode,
} from "@lexical/list";

import {
  $isHeadingNode,
} from "@lexical/rich-text";

import {
  $generateJSONFromSelectedNodes,
  $generateNodesFromSerializedNodes,
} from "@lexical/clipboard";

import {
  LexicalNode,
  ElementNode,
  EditorConfig,
  $isTextNode,
  $isParagraphNode,
  $isRangeSelection,
  $getRoot,
  $setSelection,
  $createRangeSelection,
  $createNodeSelection,
  $applyNodeReplacement,
  $createTextNode,
  $createParagraphNode,
  $getSelection,
  $getNodeByKey,
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

import { tryImportingMarkdown, evoyaImportMarkdownToLexical } from "@/components/markdownEditor/utils/markdown";

import { notInline, notInlineExtended } from "@/components/markdownEditor/utils/selection";
import { $createComparisonNode, $createComparisonSideNode, ComparisonActionsPortal, ComparisonNode, ComparisonSideNode, LexicalComparisonSideVisitor, LexicalComparisonVisitor } from "./DiffNode";

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
  realm.sub(realm.pipe(approveDiffNode$, withLatestFrom(activeEditor$)), ([value, activeEditor]) => {
    // realm.pub(evoyaViewType$, "default");
    activeEditor?.update(() => {
      const diffNode = $getNodeByKey(value.key) as ComparisonNode;
      console.log(diffNode)
      const sideNodes = diffNode.getChildren();
      console.log(sideNodes);

      const newContentNode = (sideNodes as ComparisonSideNode[]).find((node) => node.__side === 'new');
      const contentNodes = newContentNode.getChildren();

      contentNodes.forEach((node) => {
        diffNode.insertBefore(node);
      });
      diffNode.remove();
    });
  })
});

export const rejectDiffNode$ = Signal<{ key: string; }>((realm) => {
  realm.sub(realm.pipe(rejectDiffNode$, withLatestFrom(activeEditor$)), ([value, activeEditor]) => {
    // realm.pub(evoyaViewType$, "default");
    activeEditor?.update(() => {
      const diffNode = $getNodeByKey(value.key) as ComparisonNode;
      console.log(diffNode)
      const sideNodes = diffNode.getChildren();
      console.log(sideNodes);

      if (!diffNode.__onlyInsert) {
        const newContentNode = (sideNodes as ComparisonSideNode[]).find((node) => node.__side === 'current');
        const contentNodes = newContentNode.getChildren();

        contentNodes.forEach((node) => {
          diffNode.insertBefore(node);
        });
      }

      diffNode.remove();
    });
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
        // if (insertType === 'replace') {
        //   activeEditor?.update(() => {
        //     const lexicalNodes = lexicalSelection?.getNodes() ?? [];
        //     // $setSelection(value.context.lexical);
        //     // realm.pub(insertMarkdown$, value.message.content);


        //     const comparisonNode = $createComparisonNode();

        //     lexicalNodes[lexicalNodes.length - 1].insertAfter(comparisonNode);
      
        //     // Create current side
        //     const currentSide = $createComparisonSideNode('current');
        //     // const currentParagraph = $createParagraphNode();
        //     // currentParagraph.append($createTextNode('This is the current content.'));
        //     currentSide.append(...(lexicalNodes ?? []));
            
        //     // Create new side
        //     const newSide = $createComparisonSideNode('new');
        //     // const newParagraph = $createParagraphNode();
        //     // newParagraph.append($createTextNode('This is the new suggested content.'));
        //     // newSide.append(newParagraph);

        //     const importPoint = {
        //       children: [] as LexicalNode[],
        //       append(node: LexicalNode) {
        //         this.children.push(node)
        //       },
        //       getType() {
        //         // return lexicalSelection.getNodes()[0].getType();
        //         return 'importroot';
        //       }
        //     }

        //     tryImportingMarkdown(realm, importPoint, value.message.content);
        //     console.log('importPoint', importPoint);
        //     const importChildren = importPoint.children;
        //     console.log('importChildren', importChildren);

        //     newSide.append(...importChildren);
        //     // newParagraph.select();
        //     // $getSelection()?.insertNodes(importChildren)
            
        //     // Add both sides to comparison node
        //     comparisonNode.append(currentSide, newSide);

        //     realm.pub(comparisonNodeKeys$, [...comparisonNodeKeys, comparisonNode.getKey()]);

        //     $setSelection(null);
            
        //     // Insert at selection
        //     // const selection = $getSelection();
        //     // if (selection) {
        //     //   selection.insertNodes([comparisonNode]);
        //     // }

            
        //   });
        // } else if (insertType === 'below') {
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

            // realm.pub(comparisonNodeKeys$, [...comparisonNodeKeys, comparisonNode.getKey()]);
            // realm.pub(evoyaViewType$, "approve");

            $setSelection(null);
          });
        // } else if (insertType === 'above') {
          
        // }
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

          // realm.pub(comparisonNodeKeys$, [...comparisonNodeKeys, comparisonNode.getKey()]);
          // realm.pub(evoyaViewType$, "approve");

          $setSelection(null);
        });
      }
      realm.pub(resetSelection$);
    }
  });
});

export const setNodeSelection$ = Signal<any>((r) => {});
export const setNodeSelectionByKey$ = Signal<any>((r) => {});
export const setCodeSelection$ = Signal<any>((r) => {});
export const resetSelection$ = Action((r) => {});
export const selectDocument$ = Action((r) => {});
export const resetDocument$ = Action((r) => {});
export const creatorType$ = Cell<string>('', (r) => {});
export const evoyaViewType$ = Cell<"default" | "approve">('default', (r) => {});
export const evoyaAutoApprove$ = Cell<boolean>(false, (r) => {});
export const comparisonNodeKeys$ = Cell<string[]>([], (r) => {});

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
      [addLexicalNode$]: [ComparisonNode, ComparisonSideNode],
      [addExportVisitor$]: [LexicalComparisonVisitor, LexicalComparisonSideVisitor],
    });

    realm.pub(addComposerChild$, TextSelection);
    realm.pub(addComposerChild$, CreatorLock);
    realm.pub(addComposerChild$, ComparisonActionsPortal);
    // realm.pub(replaceSelectionContent$, null);

    realm.pub(createRootEditorSubscription$, (rootEditor) => {
      return rootEditor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          // console.log('getChildrenKeys', $getRoot().getChildren())
          const rootChildren = $getRoot().getChildren();
          const comparisonNodes = rootChildren.filter((child) => child.getType() === 'comparison').map((child) => child.getKey());
          realm.pub(comparisonNodeKeys$, comparisonNodes);
          realm.pub(evoyaViewType$, comparisonNodes.length > 0 ? "approve" : "default");
        });
      });
    });
    realm.sub(realm.pipe(comparisonNodeKeys$, withLatestFrom(evoyaAutoApprove$)), ([comparisonNodeKeys, evoyaAutoApprove]) => {
      if (evoyaAutoApprove && comparisonNodeKeys.length > 0) {
        comparisonNodeKeys.forEach((key) => realm.pub(approveDiffNode$, { key }));
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

      let scrollOffset = 0;

      if (activeEditor && selection && !readOnly) {
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


            const startEnd = selection.getStartEndPoints();
            const restoredSelection = $createRangeSelection();
            const startOffset = startEnd[0].offset;
            const endOffset = startEnd[1].offset;
            restoredSelection.anchor.set(startEnd[0].key, startOffset, 'text');
            restoredSelection.focus.set(startEnd[1].key, endOffset, 'text');
            console.log(restoredSelection);

            const startPoint = selection.anchor;
            const endPoint = selection.focus;

            console.log(startPoint, endPoint);

            if (startPoint.key !== endPoint.key) {
              // const topElementKeys: string[] = [];
              const topElements = selection.getNodes().reduce((acc: LexicalNode[], el: LexicalNode) => {
                const topEl = el.getTopLevelElement();
                const topElKey = topEl?.getKey();
                // if (topElKey && !topElementKeys.includes(topElKey)) {
                if (topElKey && !acc.find((item) => item.getKey() === topElKey)) {
                  // topElementKeys.push(topElKey);
                  return [...acc, topEl]
                }
                return acc;
              }, [])
              console.log(topElements);
              const nodeSelection = $createNodeSelection();
              topElements.forEach((el) => nodeSelection.add(el.__key))
              // activeEditor?.update(() => {
              //   $setSelection(nodeSelection);
              // });

              // const domRange = createDOMRange(activeEditor, topElements, 0, endPoint.getNode(), endPoint.offset);
              // const rects = domRange ? createRectsFromDOMRange(activeEditor, domRange) : [];
              const rects: ClientRect[] = topElements.map((el) => {
                const domElement = activeEditor.getElementByKey(el.getKey());
                if (domElement) {
                  return domElement.getBoundingClientRect()
                }
                return null;
              })

              if (params?.setSelectionContext) {
                const markdown = getSelectionAsMarkdown(activeEditor, nodeSelection, {
                  visitors,
                  toMarkdownExtensions,
                  toMarkdownOptions,
                  jsxComponentDescriptors,
                  jsxIsAvailable
                });

                console.log(markdown);
                // console.log(rects);

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
            } else {
              const topLevelNode = startPoint.getNode().getTopLevelElement();
              const nodeSelection = $createNodeSelection();
              nodeSelection.add(topLevelNode.__key)
              const domElement = activeEditor.getElementByKey(topLevelNode.getKey());
              const rects = []
              if (domElement) {
                rects.push(domElement.getBoundingClientRect());
              }
              if (params?.setSelectionContext) {
                const markdown = getSelectionAsMarkdown(activeEditor, nodeSelection, {
                  visitors,
                  toMarkdownExtensions,
                  toMarkdownOptions,
                  jsxComponentDescriptors,
                  jsxIsAvailable
                });

                // console.log(markdown);
                // console.log(rects);

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

              // const domRange = createDOMRange(activeEditor, startPoint.getNode(), startPoint.offset, endPoint.getNode(), endPoint.offset);
              // const rects = domRange ? createRectsFromDOMRange(activeEditor, domRange) : [];

              // if (params?.setSelectionContext) {
              //   const markdown = getSelectionAsMarkdown(activeEditor, null, {
              //     visitors,
              //     toMarkdownExtensions,
              //     toMarkdownOptions,
              //     jsxComponentDescriptors,
              //     jsxIsAvailable
              //   });

              //   console.log(markdown);
              //   // console.log(rects);
              //   const topLevelElement = startPoint.getNode().getTopLevelElement();

              //   const selectionContext = {
              //     rectangles: rects,
              //     markdown,
              //     lexical: restoredSelection,
              //     selectionType: 'range' as const,
              //     scrollOffset,
              //     topLevelElement,
              //   };
              //   params.setSelectionContext(selectionContext);
              //   realm.pub(evoyaAiState$, selectionContext);
              // }
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