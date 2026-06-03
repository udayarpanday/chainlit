import {
  LexicalNode,
  $isElementNode,
  $isDecoratorNode,
  $getSelection,
  $isRangeSelection,
  LexicalEditor,
  ElementNode,
  $isTextNode,
  BaseSelection,
} from "lexical";

import {
  $isLinkNode,
} from '@lexical/link';

import {
  $isListItemNode,
  $isListNode,
} from "@lexical/list";

import {
  $isHeadingNode,
} from "@lexical/rich-text";

import {
  $isTableCellNode,
} from "@lexical/table";

import {
  $isAtNodeEnd,
} from "@lexical/selection";

import {
  $isTableNode,
  ExportMarkdownFromLexicalOptions,
  exportMarkdownFromLexical,
} from "@mdxeditor/editor";
import { $isInlineMathNode, $isMathNode } from "../plugins/math";

export const notInline = (node: LexicalNode) =>
  ($isElementNode(node) || $isDecoratorNode(node)) && !node.isInline();

export const notInlineExtended = (node: LexicalNode) =>
  (($isElementNode(node) || $isDecoratorNode(node)) && !node.isInline()) && !$isListItemNode(node) && !$isTableCellNode(node);

export function getSelectionAsMarkdown(editor: LexicalEditor, fixedSelection: BaseSelection | null, _exportParams: Omit<ExportMarkdownFromLexicalOptions, 'root'>): string {
  let markdown = ''

  editor.getEditorState().read(() => {
    const selection = fixedSelection ?? $getSelection();

    // Return empty if no selection or collapsed
    if (!selection || selection.isCollapsed()) {
      return
    }

    // Get all nodes in the selection (entire nodes, not partial)
    const nodes = selection.getNodes()

    console.log('getSelectionAsMarkdown - nodes', nodes);

    if (nodes.length === 0) {
      return
    }

    // Get unique block-level parent nodes to preserve structure (headings, lists, paragraphs, etc.)
    const parentNodes = new Set<ElementNode>()
    nodes.forEach((node) => {
      let current: LexicalNode | null = node

      // Walk up to find the nearest block-level parent (heading, paragraph, list item, etc.)
      while (current) {
        // Check if current node is a block-level node
        if ($isHeadingNode(current) || $isListItemNode(current) || $isListNode(current) || $isMathNode(current) || current.getType() === 'paragraph' || current.getType() === 'quote') {
          if ($isElementNode(current) && $isMathNode(current)) {
            parentNodes.add(current)
          }
          break
        }

        current = current.getParent()
      }
    })

    // If we have parent nodes, use those instead of leaf nodes
    const nodesToProcess = parentNodes.size > 0 ? Array.from(parentNodes) : nodes

    console.log('getSelectionAsMarkdown - nodesToProcess', nodesToProcess);

    // Helper function to recursively convert a node to markdown
    function nodeToMarkdown(node: LexicalNode): string {
      console.log(node);
      if ($isHeadingNode(node)) {
        // Handle heading nodes
        const level = parseInt(node.getTag().replace('h', ''))
        const children = node.getChildren()
        const headingText = children.map((child) => nodeToMarkdown(child)).join('')
        return '#'.repeat(level) + ' ' + headingText + '\n\n'
      } else if ($isListItemNode(node)) {
        // Handle list item nodes
        const parent = node.getParent()
        const prefix = parent && $isListNode(parent) && parent.getListType() === 'number' ? '1. ' : '- '
        const children = node.getChildren()
        const itemText = children.map((child) => nodeToMarkdown(child)).join('')
        return prefix + itemText + '\n'
      } else if ($isListNode(node)) {
        // Handle list nodes
        const children = node.getChildren()
        const content = children.map((child) => nodeToMarkdown(child)).join('') + '\n';
        console.log(content);
        return content
      } else if ($isTextNode(node)) {
        let text = node.getTextContent()
        const format = node.getFormat()

        // Apply markdown formatting based on Lexical text format flags
        // Bold: 1, Italic: 2, Strikethrough: 4, Underline: 8, Code: 16
        if (format & 16) {
          // Code
          return `\`${text}\``
        }
        // Apply formatting in correct order (innermost to outermost)
        if (format & 1) {
          // Bold
          text = `**${text}**`
        }
        if (format & 2) {
          // Italic
          text = `*${text}*`
        }
        if (format & 4) {
          // Strikethrough
          text = `~~${text}~~`
        }

        return text
      } else if ($isLinkNode(node)) {
        // Handle link nodes
        const url = node.getURL()
        const title = node.getTitle()
        const children = node.getChildren()
        const linkText = children.map((child) => nodeToMarkdown(child)).join('')

        if (title) {
          return `[${linkText}](${url} "${title}")`
        }
        return `[${linkText}](${url})`
      } else if ($isTableNode(node)) {
        return exportMarkdownFromLexical({
          root: node,
          ..._exportParams,
        })
      } else if ($isMathNode(node)) {
        return `$$\n${node.__mathString}\n$$`
      } else if ($isInlineMathNode(node)) {
        return `$${node.__mathString}$`
      } else if ($isElementNode(node)) {
        // For other element nodes, process their children
        const children = node.getChildren()
        return children.map((child) => nodeToMarkdown(child)).join('') + (node.isInline() ? '' : '\n\n');
      }

      // Fallback: return text content
      return node.getTextContent()
    }

    // Convert all selected nodes to markdown and concatenate
    markdown = nodesToProcess.map((node) => nodeToMarkdown(node)).join('');
    // markdown = nodesToProcess.map((node) => exportMarkdownFromLexical({
    //   root: node,
    //   ..._exportParams,
    // })).join('\n\n');
  })

  return markdown.trim()
}