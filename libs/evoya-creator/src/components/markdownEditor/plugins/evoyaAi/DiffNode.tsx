import {
  useRealm,
  usePublisher,
  useCellValue,
} from '@mdxeditor/gurx';
import {
  ElementNode,
  NodeKey,
  EditorConfig,
  LexicalNode,
  SerializedElementNode,
  Spread,
  $applyNodeReplacement,
  $getNodeByKey,
  DOMConversionMap,
  DOMConversionOutput,
  DOMExportOutput,
  DecoratorNode,
  LexicalEditor,
} from 'lexical';
import {
  approveDiffNode$,
  rejectDiffNode$,
  comparisonNodeKeys$,
} from '.';

import {
  ButtonWithTooltip,
  iconComponentFor$,
  useTranslation,
  markdownSourceEditorValue$,
  LexicalExportVisitor,
  rootEditor$,
} from '@mdxeditor/editor';

import { createPortal } from 'react-dom';
import { DOMElement, useEffect, useState } from 'react';
import { Button } from '@chainlit/app/src/components/ui/button';
import * as Mdast from 'mdast'

export type SerializedComparisonNode = Spread<
  {
    type: 'comparison';
    onlyInsert: boolean,
    version: 1;
  },
  SerializedElementNode
>;

export function ComparisonActionsPortal() {
  const [portals, setPortals] = useState<Array<{ key: string; target: HTMLElement }>>([]);
  const acceptChange = usePublisher(approveDiffNode$);
  const setComparisonNodeKeys = usePublisher(comparisonNodeKeys$);
  const rejectChange = usePublisher(rejectDiffNode$);
  const iconComponentFor = useCellValue(iconComponentFor$);
  const rootEditor = useCellValue(rootEditor$);
  const comparisonNodeKeys = useCellValue(comparisonNodeKeys$);
  
  // useEffect(() => {
  //   // Find all portal targets
  //   const targets = document.querySelectorAll('.comparison-actions-portal');
  //   const newPortals = Array.from(targets).map(target => ({
  //     key: target.getAttribute('data-node-key') || '',
  //     target: target as HTMLElement
  //   }));
  //   setPortals(newPortals);
  // }, [comparisonNodeKeys]);
  console.log("comparisonNodeKeys", comparisonNodeKeys);
  // console.log("portals", portals);


  // const targets = document.querySelectorAll('.comparison-actions-portal');
  // const newPortals = Array.from(targets).map(target => ({
  //   key: target.getAttribute('data-node-key') || '',
  //   target: target as HTMLElement
  // }));

  const targets: HTMLElement[] = comparisonNodeKeys.reduce((curr, node) => {
    const domElement = document.querySelector(`[data-node-key="${node}"]`) as HTMLElement;
    if (domElement) return [...curr, domElement];
    return curr;
  }, [] as HTMLElement[])
  // const newPortals = targets.map(target => ({
  //   key: target.getAttribute('data-node-key') || '',
  //   target: target as HTMLElement
  // }));
  const newPortals = targets.map(target => {
    let leftOffset = 0;
    let topOffset = 0;

    const tableElement: HTMLDivElement | null = target.closest(".evoya-table-wrapper");

    if (tableElement) {
      const tdElement = target.closest("td");
      leftOffset += (tdElement?.offsetLeft ?? 0) - 3;
      topOffset += (tdElement?.offsetTop ?? 0);

      leftOffset += (tableElement?.offsetLeft ?? 0);
      topOffset += (tableElement?.offsetTop ?? 0);
    }
    return {
      key: target.getAttribute('data-node-key') || '',
      target: target as HTMLElement,
      offsetTop: target.offsetTop + topOffset,
      offsetRight: (rootEditor?._rootElement?.offsetWidth ?? 0) - leftOffset - target.offsetWidth,
    }
  });

  console.log(newPortals);

  const reject = (key: string) => {
    // setComparisonNodeKeys(comparisonNodeKeys.filter((val) => val !== key));
    rejectChange({ key });
  }

  const accept = (key: string) => {
    // setComparisonNodeKeys(comparisonNodeKeys.filter((val) => val !== key));
    acceptChange({ key });
  }

  return (
    <>
      {newPortals.map(({ key, target, offsetTop, offsetRight }) => 
        <div
          key={key}
          className="absolute bg-white p-1 rounded border flex gap-2"
          style={{
            // top: target.getBoundingClientRect().top,
            // top: target.offsetTop + 43 + 4,
            top: offsetTop + 43 + 4,
            right: offsetRight - 10
          }}
        >
          <Button variant="ghost" size="xs" className="text-destructive !w-auto px-2 text-xs" onClick={() => reject(key)}>
            {iconComponentFor('close')}
            <span>Reject</span>
          </Button>
          <Button variant="ghost" size="xs" className="text-success !w-auto px-2 text-xs" onClick={() => accept(key)}>
            {iconComponentFor('check')}
            <span>Accept</span>
          </Button>
        </div>
      )}
    </>
  );
}

export const LexicalComparisonVisitor: LexicalExportVisitor<ComparisonNode, Mdast.Nodes> = {
  testLexicalNode: $isComparisonNode,
  visitLexicalNode({ mdastParent, lexicalNode, actions }) {
    actions.visitChildren(lexicalNode, mdastParent)
  }
}

export const LexicalComparisonSideVisitor: LexicalExportVisitor<ComparisonSideNode, Mdast.Nodes> = {
  testLexicalNode: $isComparisonSideNode,
  visitLexicalNode({ mdastParent, lexicalNode, actions }) {
    if (lexicalNode.__side === "current") {
      actions.visitChildren(lexicalNode, mdastParent)
    }
  }
}

export class ComparisonNode extends ElementNode {
  __onlyInsert: boolean;

  static getType(): string {
    return 'comparison';
  }

  static clone(node: ComparisonNode): ComparisonNode {
    return new ComparisonNode(node.__onlyInsert, node.__key);
  }

  constructor(onlyInsert: boolean, key?: NodeKey) {
    super(key);
    this.__onlyInsert = onlyInsert;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = `comparison-container ${this.__onlyInsert ? 'only-insert' : ''}`;
    dom.contentEditable = "false";

    // const actions = document.createElement('div');
    // actions.className = 'comparison-actions'

    // const actionReject = document.createElement('div');
    // actionReject.className = "comparison-action comparison-reject-action";
    // actionReject.textContent = "Reject";
    // actions.appendChild(actionReject);

    // const actionAccept = document.createElement('div');
    // actionAccept.className = "comparison-action comparison-accept-action";
    // actionAccept.textContent = "Accept";
    // actions.appendChild(actionAccept);

    // actionReject.onclick = () => this.rejectChange();

    // dom.appendChild(actions);

    // Create a portal target
    const actionsTarget = document.createElement('div');
    actionsTarget.className = 'comparison-actions comparison-actions-portal';
    actionsTarget.setAttribute('data-node-key', this.__key);
    actionsTarget.textContent = "Change Diff View"
    dom.appendChild(actionsTarget);

    return dom;
  }

  // acceptChange() {
  //   const realm = useRealm();
  //   realm.pub(approveDiffNode$, {key: this.getKey()});
  //   // const parent = this.getParent();
  // }

  // rejectChange() {
  //   const realm = useRealm();
  //   realm.pub(rejectDiffNode$, {key: this.getKey()});
  //   // const parent = this.getParent();
  // }

  updateDOM(prevNode: ComparisonNode, dom: HTMLElement): boolean {
    // Return false to indicate that the node does not need to be recreated
    return false;
  }

  static importJSON(serializedNode: SerializedComparisonNode): ComparisonNode {
    return $createComparisonNode(serializedNode.onlyInsert);
  }

  exportJSON(): SerializedComparisonNode {
    return {
      ...super.exportJSON(),
      type: 'comparison',
      onlyInsert: this.__onlyInsert,
      version: 1,
    };
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('div');
    element.className = 'comparison-container';
    return { element };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (domNode.classList.contains('comparison-container')) {
          return {
            conversion: convertComparisonElement,
            priority: 2,
          };
        }
        return null;
      },
    };
  }

  // Allow the node to be replaced in the editor
  canBeEmpty(): boolean {
    return false;
  }

  // Prevent merging with adjacent nodes
  isShadowRoot(): boolean {
    return true;
  }
}

function convertComparisonElement(domNode: HTMLElement): DOMConversionOutput | null {
  const node = $createComparisonNode(domNode.children.length < 3);
  return { node };
}

export function $createComparisonNode(onlyInsert: boolean): ComparisonNode {
  return $applyNodeReplacement(new ComparisonNode(onlyInsert));
}

export function $isComparisonNode(
  node: LexicalNode | null | undefined
): node is ComparisonNode {
  return node instanceof ComparisonNode;
}

export class ComparisonSideNode extends ElementNode {
  __side: 'current' | 'new';

  static getType(): string {
    return 'comparison-side';
  }

  static clone(node: ComparisonSideNode): ComparisonSideNode {
    return new ComparisonSideNode(node.__side, node.__key);
  }

  constructor(side: 'current' | 'new', key?: NodeKey) {
    super(key);
    this.__side = side;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('div');
    dom.className = `comparison-side comparison-side-${this.__side}`;
    
    // Add label
    // const label = document.createElement('div');
    // label.className = 'comparison-label';
    // const labelSpan = document.createElement('span');
    // labelSpan.textContent = this.__side === 'current' ? 'Current' : 'New';
    // label.appendChild(labelSpan);
    // dom.appendChild(label);

    // if (this.__side === 'current') {
    //   const actions = document.createElement('div');
    //   actions.className = 'comparison-actions'

    //   const actionAccept = document.createElement('div');
    //   actionAccept.className = "comparison-accept-action";
    //   actionAccept.textContent = "Accept";
    //   actions.appendChild(actionAccept);

    //   actionAccept.onclick = this.acceptChange

    //   label.appendChild(actions);
    // }
    
    // Add content container
    // const content = document.createElement('div');
    // content.className = 'comparison-content';
    // dom.appendChild(content);
    
    return dom;
    // return content;
  }

  acceptChange() {
    const realm = useRealm();
    realm.pub(approveDiffNode$, {key: this.getKey()});
    // const parent = this.getParent();
  }

  updateDOM(prevNode: ComparisonSideNode, dom: HTMLElement): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedComparisonSideNode): ComparisonSideNode {
    return $createComparisonSideNode(serializedNode.side);
  }

  exportJSON(): SerializedComparisonSideNode {
    return {
      ...super.exportJSON(),
      type: 'comparison-side',
      side: this.__side,
      version: 1,
    };
  }

  getSide(): 'current' | 'new' {
    return this.__side;
  }
}

export type SerializedComparisonSideNode = Spread<
  {
    type: 'comparison-side';
    side: 'current' | 'new';
    version: 1;
  },
  SerializedElementNode
>;

export function $createComparisonSideNode(side: 'current' | 'new'): ComparisonSideNode {
  return $applyNodeReplacement(new ComparisonSideNode(side));
}

export function $isComparisonSideNode(
  node: LexicalNode | null | undefined
): node is ComparisonSideNode {
  return node instanceof ComparisonSideNode;
}
