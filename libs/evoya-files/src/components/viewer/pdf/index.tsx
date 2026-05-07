import { createPortal } from 'react-dom';

export function PdfViewer({ path }: { path: string; }) {
  return (
    <>
    {createPortal(
      <iframe src={path} frameBorder="0" height="100%" width="100%"></iframe>,
      document.getElementById('fileviewer-root'))}
    </>
  )
}