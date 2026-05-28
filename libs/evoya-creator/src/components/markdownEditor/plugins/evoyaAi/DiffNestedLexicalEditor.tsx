/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  $addUpdateTag,
  $getNodeByKey,
  $getRoot,
  BLUR_COMMAND,
  FOCUS_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  DecoratorNode,
  EditorConfig,
  KEY_BACKSPACE_COMMAND,
  LexicalEditor,
  SELECTION_CHANGE_COMMAND,
  createEditor,
  COMMAND_PRIORITY_LOW
} from 'lexical'
import * as Mdast from 'mdast'
import { Node } from 'unist'
import React from 'react'
import {
  NESTED_EDITOR_UPDATED_COMMAND,
  codeBlockEditorDescriptors$,
  defaultCodeBlockLanguage$,
  directiveDescriptors$,
  editorInFocus$,
  exportVisitors$,
  importVisitors$,
  jsxComponentDescriptors$,
  jsxIsAvailable$,
  lexicalTheme$,
  nestedEditorChildren$,
  rootEditor$,
  usedLexicalNodes$,
  exportLexicalTreeToMdast,
  importMdastTreeToLexical,
  VoidEmitter,
  isPartOftheEditorUI,
  toMarkdownOptions$,
  toMarkdownExtensions$,
} from '@mdxeditor/editor'
import { SharedHistoryPlugin } from '@mdxeditor/editor/dist/plugins/core/SharedHistoryPlugin.js'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { LexicalNestedComposer } from '@lexical/react/LexicalNestedComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import classNames from 'classnames'
import styles from '@mdxeditor/editor/dist/styles/ui.module.css.js';
import { mergeRegister } from '@lexical/utils'
import { useCellValues, usePublisher, useRealm } from '@mdxeditor/gurx'
import { DifferenceNode } from './DiffNode'
import { toMarkdown } from 'mdast-util-to-markdown'

/**
 * The value of the {@link NestedEditorsContext} React context.
 * @group Custom Editor Primitives
 */
export interface DiffNestedEditorsContextValue<T extends Node> {
  /**
   * The parent lexical editor
   */
  parentEditor: LexicalEditor
  /**
   * The parent editor config
   */
  config: EditorConfig
  /**
   * The mdast node that is being edited
   */
  mdastNode: T
  /**
   * The lexical node that is being edited
   */
  lexicalNode: DifferenceNode
  /**
   * Subscribe to the emitter and implement the logic to focus the custom editor.
   */
  focusEmitter: VoidEmitter
}

/**
 * Use this context to provide the necessary values to the {@link NestedLexicalEditor} React component.
 * Place it as a wrapper in your custom lexical node decorators.
 * @group Custom Editor Primitives
 */
export const DiffNestedEditorsContext = React.createContext<DiffNestedEditorsContextValue<Node> | undefined>(undefined)

/**
 * A hook to get the current {@link NestedEditorsContext} value. Use this in your custom editor components.
 * @group Custom Editor Primitives
 */
export function useDiffNestedEditorContext<T extends Mdast.RootContent>() {
  const context = React.useContext(DiffNestedEditorsContext) as DiffNestedEditorsContextValue<T> | undefined
  if (!context) {
    throw new Error('useNestedEditor must be used within a NestedEditorsProvider')
  }
  return context
}

/**
 * A hook that returns a function that can be used to update the mdast node. Use this in your custom editor components.
 * @group Custom Editor Primitives
 */
export function useDiffMdastNodeUpdater<T extends Mdast.RootContent>() {
  const { parentEditor, mdastNode, lexicalNode } = useDiffNestedEditorContext<T>()
    const [
      toMarkdownExtensions,
      toMarkdownOptions,
    ] = useCellValues(
      toMarkdownExtensions$,
      toMarkdownOptions$,
    );

  return function updateMdastNode(node: Partial<T>, side: 'current' | 'new') {
    parentEditor.update(
      () => {
        $addUpdateTag('history-push')
        const currentNode = $getNodeByKey(lexicalNode.getKey()) as DifferenceNode | null
        if (currentNode) {
          const markdown = toMarkdown({ ...mdastNode, ...node }, { extensions: toMarkdownExtensions, ...toMarkdownOptions })
          if (side === 'new') {
            currentNode.setNewMdastNode({ ...mdastNode, ...node } as any, markdown)
          } else {
            // currentNode.setMdastNode({ ...mdastNode, ...node } as any, markdown)
          }
        }
      },
      { discrete: true }
    )
    parentEditor.dispatchCommand(NESTED_EDITOR_UPDATED_COMMAND, undefined)
  }
}

/**
 * A hook that returns a function that removes the lexical node from the editor.
 * @group Custom Editor Primitives
 */
export function useLexicalNodeRemove() {
  const { parentEditor, lexicalNode } = useDiffNestedEditorContext()

  return () => {
    parentEditor.update(() => {
      const node = $getNodeByKey(lexicalNode.getKey())
      node!.selectNext()
      node!.remove()
    })
  }
}

/**
 * A nested editor React component that allows editing of the contents of complex markdown nodes that have nested markdown content (for example, custom directives or JSX elements).
 *
 * @example
 * You can use a type param to specify the type of the mdast node
 *
 * ```tsx
 *
 * interface CalloutDirectiveNode extends LeafDirective {
 *   name: 'callout'
 *   children: Mdast.PhrasingContent[]
 * }
 *
 * return <NestedLexicalEditor<CalloutDirectiveNode> getContent={node => node.children} getUpdatedMdastNode={(node, children) => ({ ...node, children })} />
 * ```
 * @group Custom Editor Primitives
 */
export const DiffNestedLexicalEditor = function <T extends Mdast.RootContent>(props: {
  /**
   * A function that returns the phrasing content of the mdast node. In most cases, this will be the `children` property of the mdast node, but you can also have multiple nested nodes with their own children.
   */
  getContent: (mdastNode: T) => Mdast.RootContent[]

  /**
   * A function that should return the updated mdast node based on the original mdast node and the new content (serialized as mdast tree) produced by the editor.
   */
  getUpdatedMdastNode: (mdastNode: T, children: Mdast.RootContent[]) => T

  /**
   * Props passed to the {@link https://github.com/facebook/lexical/blob/main/packages/lexical-react/src/LexicalContentEditable.tsx | ContentEditable} component.
   */
  contentEditableProps?: React.ComponentProps<typeof ContentEditable>

  /**
   * Whether or not the editor edits blocks (multiple paragraphs)
   */
  block?: boolean

  side: 'current' | 'new'
}) {
  const { getContent, getUpdatedMdastNode, contentEditableProps, block = false, side } = props
  const { mdastNode, lexicalNode, focusEmitter } = useDiffNestedEditorContext<T>()
  const updateMdastNode = useDiffMdastNodeUpdater<T>()
  const removeNode = useLexicalNodeRemove()
  const content = getContent(mdastNode)
  const realm = useRealm()

  const [
    rootEditor,
    importVisitors,
    exportVisitors,
    usedLexicalNodes,
    jsxComponentDescriptors,
    directiveDescriptors,
    codeBlockEditorDescriptors,
    defaultCodeBlockLanguage,
    jsxIsAvailable,
    nestedEditorChildren,
    lexicalTheme
  ] = useCellValues(
    rootEditor$,
    importVisitors$,
    exportVisitors$,
    usedLexicalNodes$,
    jsxComponentDescriptors$,
    directiveDescriptors$,
    codeBlockEditorDescriptors$,
    defaultCodeBlockLanguage$,
    jsxIsAvailable$,
    nestedEditorChildren$,
    lexicalTheme$
  )

  const setEditorInFocus = usePublisher(editorInFocus$)

  const [editor] = React.useState(() => {
    const editor = createEditor({
      nodes: usedLexicalNodes,
      theme: realm.getValue(lexicalTheme$),
      namespace: 'NestedEditor'
    })
    return editor
  })

  React.useEffect(() => {
    focusEmitter.subscribe(() => {
      editor.focus()
    })
  }, [editor, focusEmitter])

  React.useEffect(() => {
    editor.update(() => {
      $getRoot().clear()
      let theContent: Mdast.PhrasingContent[] | Mdast.RootContent[] = content
      if (block) {
        if (theContent.length === 0) {
          theContent = [{ type: 'paragraph', children: [] }]
        }
      } else {
        theContent = [{ type: 'paragraph', children: content as Mdast.PhrasingContent[] }]
      }

      importMdastTreeToLexical({
        root: $getRoot(),
        mdastRoot: {
          type: 'root',
          children: theContent
        },
        visitors: importVisitors,
        directiveDescriptors,
        codeBlockEditorDescriptors,
        defaultCodeBlockLanguage,
        jsxComponentDescriptors
      })
    })
  }, [editor, block, importVisitors])

  React.useEffect(() => {
    function updateParentNode() {
      editor.getEditorState().read(() => {
        const mdast = exportLexicalTreeToMdast({
          root: $getRoot(),
          visitors: exportVisitors,
          jsxComponentDescriptors,
          jsxIsAvailable,
          addImportStatements: false
        })
        const content: Mdast.RootContent[] = block ? mdast.children : (mdast.children[0] as Mdast.Paragraph)!.children
        updateMdastNode(getUpdatedMdastNode(structuredClone(mdastNode) as any, content as any), side)
      })
    }

    return mergeRegister(
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          setEditorInFocus({ editorType: 'lexical', rootNode: lexicalNode, editorRef: editor })
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        (payload) => {
          const relatedTarget = payload.relatedTarget as HTMLElement | null
          if (isPartOftheEditorUI(relatedTarget, rootEditor!.getRootElement()!)) {
            return false
          }
          updateParentNode()
          setEditorInFocus(null)
          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),
      // triggered by codemirror
      editor.registerCommand(
        NESTED_EDITOR_UPDATED_COMMAND,
        () => {
          updateParentNode()
          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          setEditorInFocus({ editorType: 'lexical', rootNode: lexicalNode, editorRef: editor })
          return false
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (_, editor) => {
          const editorElement = editor.getRootElement()
          // the innerText here is actually the text before backspace takes effect.
          if (editorElement?.innerText === '\n') {
            removeNode()
            return true
          }
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    )
  }, [
    block,
    editor,
    exportVisitors,
    getUpdatedMdastNode,
    jsxComponentDescriptors,
    jsxIsAvailable,
    lexicalNode,
    mdastNode,
    removeNode,
    setEditorInFocus,
    updateMdastNode,
    rootEditor
  ])

  return (
    <LexicalNestedComposer initialEditor={editor} initialTheme={lexicalTheme}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable {...contentEditableProps} className={classNames(styles.nestedEditor, contentEditableProps?.className)} />
        }
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      <SharedHistoryPlugin />
      {nestedEditorChildren.map((Child, index) => (
        <Child key={index} />
      ))}
    </LexicalNestedComposer>
  )
}