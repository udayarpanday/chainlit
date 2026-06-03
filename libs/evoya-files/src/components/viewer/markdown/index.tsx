import MarkdownEditor from '@evoya/markdown-editor/src/components/markdownFile/Editor';
import { createPortal } from 'react-dom';

export function MarkdownViewer({ content, setContent, isEditable }: { content: string; setContent: (val: string) => void; isEditable?: boolean; }) {
  return (
    <>
    {createPortal(
      <MarkdownEditor content={content} setContent={setContent} />,
      document.getElementById('fileviewer-root'))}
    </>
  )
}