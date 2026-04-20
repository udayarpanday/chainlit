import MarkdownEditor from '@evoya/markdown-editor/src/components/markdownFile/Editor';
import { createPortal } from 'react-dom';

export function MarkdownViewer({ content, isEditable }: { content: string; isEditable?: boolean; }) {

  return (
    <>
    {createPortal(
      <MarkdownEditor content={content} />,
      document.getElementById('fileviewer-root'))}
    </>
  )
}