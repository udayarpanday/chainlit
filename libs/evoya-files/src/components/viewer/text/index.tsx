import { createPortal } from 'react-dom';
import { EvoyaFile } from "@/types";
import CodeMirror from '@uiw/react-codemirror';
import { useContext, useEffect, useMemo, useState } from "react";
import { FilePickerContext } from '@/context/file-context';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { json } from '@codemirror/lang-json';

export function TextViewer({ file, isEditable = true }: { file: EvoyaFile; isEditable?: boolean; }) {
  const [content, setContent] = useState('');
  const { apiBaseUrl } = useContext(FilePickerContext);

  useEffect(() => {
    fetch(`${apiBaseUrl}${file.path}`).then(async (response) => {
      const text = await response.text();
      setContent(text);
    })
  }, []);

  const extensions = useMemo(() => {
    switch (file.mime) {
      case 'application/json':
        return [json()];
      case 'text/javascript':
        return [javascript()];
      case 'text/x-python':
        return [python()];
    }
  }, [file]);

  if (!content) return null;

  return (
    <>
      {createPortal(
        <div style={{ height: '100%', overflow: 'auto' }}>
          <CodeMirror value={content} height='100%' extensions={extensions} />
        </div>,
        document.getElementById('fileviewer-root')
      )}
    </>
  )
}