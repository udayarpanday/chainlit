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
  SerializedLexicalNode,
  LexicalEditor,
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
  cmExtensions$,
  syntaxExtensions$,
  mdastExtensions$,
  MarkdownParseError,
  VoidEmitter,
  voidEmitter,
} from '@mdxeditor/editor';

import { MergeView } from '@codemirror/merge';
import { EditorState } from '@codemirror/state';
import { EditorView, lineNumbers } from '@codemirror/view';
import { basicLight } from 'cm6-theme-basic-light';
import { basicSetup } from 'codemirror';
import { markdown as markdownLanguageSupport } from '@codemirror/lang-markdown';

import { Button } from '@chainlit/app/src/components/ui/button';
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@chainlit/app/src/components/ui/toggle-group"
import * as Mdast from 'mdast';
import { useEffect, useRef, useCallback, useState } from 'react';
import { cn } from '@chainlit/app/src/lib/utils';
import { fromMarkdown, type Options } from 'mdast-util-from-markdown';
import { ParseOptions } from 'micromark-util-types'
import { DiffNestedEditorsContext, DiffNestedLexicalEditor } from './DiffNestedLexicalEditor';
import styles from '@mdxeditor/editor/dist/styles/ui.module.css.js';

export const LexicalDifferenceVisitor: LexicalExportVisitor<DifferenceNode, Mdast.Nodes> = {
  testLexicalNode: $isDifferenceNode,
  visitLexicalNode({ mdastParent, lexicalNode, actions }) {
    // actions.visitChildren(lexicalNode, mdastParent)
    lexicalNode.getMdastNode().children.forEach((mdastChild) => actions.appendToParent(mdastParent, mdastChild));
  }
}

export type SerializedDifferenceNode = Spread<
  {
    onlyInsert: boolean
    mdastNodeCurrent: Mdast.Root;
    mdastNodeNew: Mdast.Root;
    currentMarkdown: string
    newMarkdown: string
    viewMode: 'render' | 'diff'
    type: 'difference'
    version: 1
  },
  SerializedLexicalNode
>

export class DifferenceNode extends DecoratorNode<JSX.Element> {
  __onlyInsert: boolean;
  __currentMarkdown: string;
  __newMarkdown: string;
  __mdastNodeCurrent: Mdast.Root;
  __mdastNodeNew: Mdast.Root;
  __viewMode: 'render' | 'diff';
  __focusEmitter = voidEmitter();

  static getType(): string {
    return 'difference';
  }

  static clone(node: DifferenceNode): DifferenceNode {
    return new DifferenceNode(node.__onlyInsert, node.__currentMarkdown, node.__newMarkdown, node.__mdastNodeCurrent, node.__mdastNodeNew, node.__viewMode, node.__key);
  }

  constructor(onlyInsert: boolean, currentMarkdown: string, newMarkdown: string, currentMdast: Mdast.Root, newMdast: Mdast.Root, viewMode: 'render' | 'diff', key?: NodeKey) {
    super(key);
    this.__onlyInsert = onlyInsert
    this.__currentMarkdown = currentMarkdown;
    this.__newMarkdown = newMarkdown;
    this.__mdastNodeCurrent = currentMdast;
    this.__mdastNodeNew = newMdast;
    this.__viewMode = viewMode;
  }
  
  exportDOM(): DOMExportOutput {
    const element = document.createElement('p');

    return { element };
  }

  createDOM(config: EditorConfig): HTMLElement {
    const div = document.createElement('p');
    return div;
  }

  updateDOM(): false {
    return false;
  }
  
  static importJSON(serializedNode: SerializedDifferenceNode): DifferenceNode {
    const { currentMarkdown, newMarkdown, onlyInsert, mdastNodeCurrent, mdastNodeNew, viewMode } = serializedNode;
    const node = $createDifferenceNode({ currentMarkdown, newMarkdown, onlyInsert, newMdast: mdastNodeNew, currentMdast: mdastNodeCurrent, viewMode });
    return node;
  }

  exportJSON(): SerializedDifferenceNode {
    return {
      currentMarkdown: this.__currentMarkdown,
      newMarkdown: this.__newMarkdown,
      onlyInsert: this.__onlyInsert,
      mdastNodeCurrent: this.__mdastNodeCurrent,
      mdastNodeNew: this.__mdastNodeNew,
      viewMode: this.__viewMode,
      type: 'difference',
      version: 1
    }
  }

  setMdastNode(mdastNode: Mdast.Root, markdown: string): void {
    const writeable = this.getWritable();
    writeable.__mdastNodeCurrent = mdastNode;
    writeable.__currentMarkdown = markdown;
  }

  getMdastNode() {
    return this.__mdastNodeCurrent;
  }

  setNewMdastNode(mdastNode: Mdast.Root, markdown: string): void {
    const writeable = this.getWritable();
    writeable.__mdastNodeNew = mdastNode;
    writeable.__newMarkdown = markdown;
  }

  setViewMode(viewMode: 'render' | 'diff'): void {
    console.log(viewMode)
    this.getWritable().__viewMode = viewMode;
  }

  decorate(parentEditor: LexicalEditor, config: EditorConfig): JSX.Element {
    if (this.__onlyInsert) {
      return <SourceRenderer
          newMarkdown={this.__newMarkdown}
          nodeKey={this.__key}
          lexicalNode={this}
          parentEditor={parentEditor}
          focusEmitter={this.__focusEmitter}
          config={config}
        />
    }
    return <DifferenceRenderer 
        currentMarkdown={this.__currentMarkdown}
        newMarkdown={this.__newMarkdown}
        nodeKey={this.__key}
        lexicalNode={this}
        parentEditor={parentEditor}
        focusEmitter={this.__focusEmitter}
        config={config}
      />
  }

  isIsolated(): boolean {
    return true;
  }

  isKeyboardSelectable(): boolean {
    return false;
  }

  isInline(): boolean {
    return false;
  }
}

export interface CreateDifferenceNodeParameters {
  onlyInsert: boolean
  currentMarkdown: string
  newMarkdown: string
  newMdast: Mdast.Root
  currentMdast: Mdast.Root
  viewMode: 'render' | 'diff'
  key?: NodeKey
}

export function $createDifferenceNode({ key, currentMarkdown, newMarkdown, onlyInsert, newMdast, viewMode, currentMdast}: CreateDifferenceNodeParameters): DifferenceNode {
  return new DifferenceNode(onlyInsert, currentMarkdown, newMarkdown, currentMdast, newMdast, viewMode, key);
}

export function $isDifferenceNode(node: LexicalNode | null | undefined): node is DifferenceNode {
  return node instanceof DifferenceNode;
}

export type MdastExtensions = Options['mdastExtensions'];

const importMarkdownToMdast = (markdown: string, syntaxExtensions: NonNullable<ParseOptions['extensions']>, mdastExtensions: MdastExtensions[]): Mdast.Root => {
  let mdastRoot: Mdast.Root
  try {
    mdastRoot = fromMarkdown(markdown, {
      extensions: syntaxExtensions,
      mdastExtensions
    })
  } catch (e: unknown) {
    if (e instanceof Error) {
      throw new MarkdownParseError(`Error parsing markdown: ${e.message}`, e)
    } else {
      throw new MarkdownParseError(`Error parsing markdown: ${e}`, e)
    }
  }

  return mdastRoot;
}

export const DifferenceEditor = ({
  lexicalNode,
  focusEmitter,
  parentEditor,
  config,
}: {
  lexicalNode: DifferenceNode;
  focusEmitter: VoidEmitter;
  parentEditor: LexicalEditor;
  config: EditorConfig;
}) => {
  return (
    <div className='grid grid-cols-2'>
      <div className='difference-editor'>
        <DiffNestedEditorsContext.Provider value={{
          mdastNode: lexicalNode.__mdastNodeCurrent,
          lexicalNode,
          parentEditor,
          focusEmitter,
          config,
        }}>
          <DiffNestedLexicalEditor
            side='current'
            block
            getContent={(node) => node.children as Mdast.PhrasingContent[]}
            getUpdatedMdastNode={(mdastNode, children: any) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              return { ...mdastNode, children }
            }}
          />
        </DiffNestedEditorsContext.Provider>
      </div>
      <div>
        <DiffNestedEditorsContext.Provider value={{
          mdastNode: lexicalNode.__mdastNodeNew,
          lexicalNode,
          parentEditor,
          focusEmitter,
          config,
        }}>
          <DiffNestedLexicalEditor
            side='new'
            block
            getContent={(node) => node.children as Mdast.PhrasingContent[]}
            getUpdatedMdastNode={(mdastNode, children: any) => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              return { ...mdastNode, children }
            }}
          />
        </DiffNestedEditorsContext.Provider>
      </div>
    </div>
  )
}

export const SingleEditor = ({
  lexicalNode,
  focusEmitter,
  parentEditor,
  config,
}: {
  lexicalNode: DifferenceNode;
  focusEmitter: VoidEmitter;
  parentEditor: LexicalEditor;
  config: EditorConfig;
}) => {
  return (
    <div className=''>
      <DiffNestedEditorsContext.Provider value={{
        mdastNode: lexicalNode.__mdastNodeNew,
        lexicalNode,
        parentEditor,
        focusEmitter,
        config,
      }}>
        <DiffNestedLexicalEditor
          side='new'
          block
          getContent={(node) => node.children as Mdast.PhrasingContent[]}
          getUpdatedMdastNode={(mdastNode, children: any) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            return { ...mdastNode, children }
          }}
        />
      </DiffNestedEditorsContext.Provider>
    </div>
  )
}

export const DifferenceRenderer = ({
  nodeKey,
  currentMarkdown,
  newMarkdown,
  lexicalNode,
  focusEmitter,
  parentEditor,
  config,
}: {
  currentMarkdown: string;
  newMarkdown: string;
  nodeKey: string;
  lexicalNode: DifferenceNode;
  focusEmitter: VoidEmitter;
  parentEditor: LexicalEditor;
  config: EditorConfig;
}) => {
  const acceptChange = usePublisher(approveDiffNode$);
  const rejectChange = usePublisher(rejectDiffNode$);
  const iconComponentFor = useCellValue(iconComponentFor$);
  const syntaxExtensions = useCellValue(syntaxExtensions$);
  const mdastExtensions = useCellValue(mdastExtensions$) as MdastExtensions[];
  const t = useTranslation();
  const [viewMode, setViewMode] = useState<'render' | 'diff'>('render');

  const editMarkdown = (val: string) => {
    parentEditor.update(() => {
      const mdast = importMarkdownToMdast(val, syntaxExtensions, mdastExtensions);
      lexicalNode.setNewMdastNode(mdast, val);
    });
  }

  return (
    <div className="difference-container">
      <div className="difference-actions flex items-center justify-end px-2 py-1 gap-1" {...{ "data-node-key": nodeKey }}>
        <div className={cn(styles.diffSourceToggleWrapper, 'flex items-center gap-1 [&>span]:flex')} style={{
          '--accent': '230 10.71% 89.02%'
        } as React.CSSProperties}>
          <ToggleGroup type="single" size="sm" value={viewMode} variant="outline" onValueChange={(val: 'render' | 'diff') => setViewMode(val ? val : viewMode)}>
            <ToggleGroupItem value="render" aria-label="Edit">
              Edit
            </ToggleGroupItem>
            <ToggleGroupItem value="diff" aria-label="Compare">
              Compare
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Button variant="ghost" size="xs" className="text-destructive !w-auto px-2 text-xs" onClick={() => rejectChange({key: nodeKey})}>
          {iconComponentFor('close')}
          <span>Reject</span>
        </Button>
        <Button variant="ghost" size="xs" className="text-success !w-auto px-2 text-xs" onClick={() => acceptChange({key: nodeKey})}>
          {iconComponentFor('check')}
          <span>Accept</span>
        </Button>
      </div>
      {viewMode === 'diff' && <MergeViewRenderer currentMarkdown={currentMarkdown} newMarkdown={newMarkdown} modify={editMarkdown} />}
      {viewMode === 'render' && <DifferenceEditor lexicalNode={lexicalNode} parentEditor={parentEditor} focusEmitter={focusEmitter} config={config} />}
    </div>
  );
}

export const MergeViewRenderer = ({
  currentMarkdown,
  newMarkdown,
  modify,
}: {
  currentMarkdown?: string;
  newMarkdown: string;
  modify: (val: string) => void
}) => {
  const cmMergeViewRef = useRef<MergeView | null>(null);
  const cmExtensions = useCellValue(cmExtensions$);
  const elRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const isReadOnly = false;

    const revertParams = isReadOnly
      ? ({
          renderRevertControl: undefined,
          revertControls: undefined
        } as const)
      : ({
          renderRevertControl: () => {
            const el = document.createElement('button')
            el.classList.add('cm-merge-revert')
            el.appendChild(document.createTextNode('\u2B95'))
            return el
          },
          revertControls: 'a-to-b'
        } as const)

    cmMergeViewRef.current = new MergeView({
      ...revertParams,
      parent: elRef.current!,
      orientation: 'a-b',
      gutter: true,
      a: {
        doc: currentMarkdown,
        extensions: [
          ...cmExtensions,
          basicLight,
          basicSetup,
          markdownLanguageSupport(),
          lineNumbers(),
          EditorView.lineWrapping,
          EditorState.readOnly.of(true),
        ]
      },
      b: {
        doc: newMarkdown,
        extensions: [
          ...cmExtensions,
          basicLight,
          basicSetup,
          markdownLanguageSupport(),
          lineNumbers(),
          EditorView.lineWrapping,
          EditorView.updateListener.of(({ state }) => {
            const md = state.doc.toString()
            modify(md);
          }),
          EditorState.readOnly.of(false),
        ]
      }
    })
    return () => {
      cmMergeViewRef.current?.destroy()
      cmMergeViewRef.current = null
    }
  }, [cmExtensions])

  return (
    <div ref={elRef} className="mdxeditor-diff-editor" />
  );
}

export const SourceRenderer = ({
  nodeKey,
  newMarkdown,
  lexicalNode,
  focusEmitter,
  parentEditor,
  config,
}: {
  newMarkdown: string;
  nodeKey: string;
  lexicalNode: DifferenceNode;
  focusEmitter: VoidEmitter;
  parentEditor: LexicalEditor;
  config: EditorConfig;
}) => {
  const [viewMode, setViewMode] = useState<'render' | 'diff'>('render')
  const acceptChange = usePublisher(approveDiffNode$);
  const rejectChange = usePublisher(rejectDiffNode$);
  const iconComponentFor = useCellValue(iconComponentFor$);
  const syntaxExtensions = useCellValue(syntaxExtensions$);
  const mdastExtensions = useCellValue(mdastExtensions$) as MdastExtensions[];

  const editMarkdown = (val: string) => {
    parentEditor.update(() => {
      const mdast = importMarkdownToMdast(val, syntaxExtensions, mdastExtensions);
      lexicalNode.setNewMdastNode(mdast, val);
    });
  }

  return (
    <div className="difference-container">
      <div className="difference-actions flex items-center justify-end px-2 py-1 gap-1" {...{ "data-node-key": nodeKey }}>
        <div className={cn(styles.diffSourceToggleWrapper, 'flex items-center gap-1 [&>span]:flex')} style={{
          '--accent': '230 10.71% 89.02%'
        } as React.CSSProperties}>
          <ToggleGroup type="single" size="sm" value={viewMode} variant="outline" onValueChange={(val: 'render' | 'diff') => setViewMode(val ? val : viewMode)}>
            <ToggleGroupItem value="render" aria-label="Edit">
              Edit
            </ToggleGroupItem>
            <ToggleGroupItem value="diff" aria-label="Compare">
              Source
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <Button variant="ghost" size="xs" className="text-destructive !w-auto px-2 text-xs" onClick={() => rejectChange({key: nodeKey})}>
          {iconComponentFor('close')}
          <span>Reject</span>
        </Button>
        <Button variant="ghost" size="xs" className="text-success !w-auto px-2 text-xs" onClick={() => acceptChange({key: nodeKey})}>
          {iconComponentFor('check')}
          <span>Accept</span>
        </Button>
      </div>
      {viewMode === 'diff' && <SourceEditor newMarkdown={newMarkdown} modify={editMarkdown} />}
      {viewMode === 'render' && <SingleEditor lexicalNode={lexicalNode} parentEditor={parentEditor} focusEmitter={focusEmitter} config={config} />}
    </div>
  );
}

export const SourceEditor = ({ newMarkdown, modify }: { newMarkdown: string; modify: (val: string) => void; }) => {
  const editorViewRef = useRef<EditorView | null>(null)
  const cmExtensions = useCellValue(cmExtensions$);

  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      if (el !== null) {
        const extensions = [
          ...cmExtensions,
          basicLight,
          basicSetup,
          markdownLanguageSupport(),
          lineNumbers(),
          EditorView.lineWrapping,
          EditorState.readOnly.of(false),
          EditorView.updateListener.of(({ state }) => {
            const md = state.doc.toString()
            modify(md);
          }),
        ]
        el.innerHTML = ''
        editorViewRef.current = new EditorView({
          parent: el,
          state: EditorState.create({ doc: newMarkdown, extensions })
        })
      } else {
        editorViewRef.current?.destroy()
        editorViewRef.current = null
      }
    },
    [cmExtensions]
  )

  return (
    <div ref={ref} className="cm-sourceView mdxeditor-source-editor" />
  );
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
