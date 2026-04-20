import { createPortal } from 'react-dom';

export function PdfViewer({ path }: { path: string; }) {
  // return (
  //   <div style={{ height: 'calc(100% - 3.5rem)', width: '100%' }} >
  //     <iframe src={path} frameBorder="0" height="100%" width="100%"></iframe>
  //   </div>
  // )
  return (
    <>
    {createPortal(
      <iframe src={path} frameBorder="0" height="100%" width="100%"></iframe>,
      document.getElementById('fileviewer-root'))}
    </>
  )
}