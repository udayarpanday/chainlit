import { createPortal } from 'react-dom';
import { EvoyaFile } from "@/types";
import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { FilePickerContext } from '@/context/file-context';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { json } from '@codemirror/lang-json';

export function TextViewer({ mime, content = "", setContent, isEditable = true }: { mime: string; content: string; setContent?: (value: string) => void; isEditable?: boolean; }) {
  // const [content, setContent] = useState('');
  // const { apiBaseUrl } = useContext(FilePickerContext);

  // useEffect(() => {
  //   fetch(`${apiBaseUrl}${file.path}`).then(async (response) => {
  //     const text = await response.text();
  //     setContent(text);
  //   })
  // }, []);

  const extensions = useMemo(() => {
    const defaultExtensions = [EditorView.lineWrapping];
    switch (mime) {
      case 'application/json':
        return [json(), ...defaultExtensions];
      case 'text/javascript':
        return [javascript(), ...defaultExtensions];
      case 'text/x-python':
        return [python(), ...defaultExtensions];
    }
  }, [mime]);

  return (
    <>
      {createPortal(
        <div style={{ height: '100%', overflow: 'auto' }}>
          <CodeMirror value={content} height="100%" extensions={extensions} onChange={(value: string) => (setContent && isEditable) && setContent(value)} editable={isEditable} />
        </div>,
        document.getElementById('fileviewer-root')
      )}
    </>
  )
}