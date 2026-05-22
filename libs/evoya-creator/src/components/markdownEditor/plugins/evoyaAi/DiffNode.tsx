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
} from 'lexical';
import {
  approveDiffNode$,
  rejectDiffNode$,
  comparisonNodeKeys$,
} from '.';

import {
  iconComponentFor$,
  useTranslation,
  LexicalExportVisitor,
  rootEditor$,
} from '@mdxeditor/editor';

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
  const acceptChange = usePublisher(approveDiffNode$);
  const rejectChange = usePublisher(rejectDiffNode$);
  const iconComponentFor = useCellValue(iconComponentFor$);
  const rootEditor = useCellValue(rootEditor$);
  const comparisonNodeKeys = useCellValue(comparisonNodeKeys$);

  console.log("comparisonNodeKeys", comparisonNodeKeys);

  const targets: HTMLElement[] = comparisonNodeKeys.reduce((curr, node) => {
    const domElement = document.querySelector(`[data-node-key="${node}"]`) as HTMLElement;
    if (domElement) return [...curr, domElement];
    return curr;
  }, [] as HTMLElement[])

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
    rejectChange({ key });
  }

  const accept = (key: string) => {
    acceptChange({ key });
  }

  return (
    <>
      {newPortals.map(({ key, target, offsetTop, offsetRight }) => 
        <div
          key={key}
          className="absolute bg-white p-1 rounded border flex gap-2"
          style={{
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

    const actionsTarget = document.createElement('div');
    actionsTarget.className = 'comparison-actions comparison-actions-portal';
    actionsTarget.setAttribute('data-node-key', this.__key);
    actionsTarget.textContent = "Change Diff View"
    dom.appendChild(actionsTarget);

    return dom;
  }

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
    
    return dom;
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
