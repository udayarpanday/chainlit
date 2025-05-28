import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
  CodeBlockEditorDescriptor,
  useCodeBlockEditorContext,
  CodeMirrorEditor,
  editorInFocus$,
  rootEditor$,
  iconComponentFor$,
} from '@mdxeditor/editor';

import { usePublisher, useRealm, useCellValue } from '@mdxeditor/gurx';

import { setNodeSelection$, setNodeSelectionByKey$, setCodeSelection$ } from '../../evoyaAi';

import { VegaLite } from 'react-vega';


const VegaPreview: React.FC<{ code: string }> = ({ code }) => {
  // const [vegaSpec, setVegaSpec] = useState<any | null>(null);

  const vegaSpec = useMemo(() => {
    try {
      const json = JSON.parse(code);

      return {
        ...json,
        width: json.width ?? 'container',
        height: json.height ?? 300
      };
    } catch(e) {
      return null;
    }
  }, [code]);

  if (!vegaSpec) {
    return (<div>could not parse json</div>);
  }

  return <VegaLite spec={vegaSpec} data={vegaSpec.data} renderer="svg" />;
}

export const VegaLiteCodeEditorDescriptor: CodeBlockEditorDescriptor = {
  match: (language, _meta) => {
    return language === 'vega' || language == 'vega-lite'
  },
  priority: 0,
  Editor: (props) => {
    const setNodeSelection = usePublisher(setNodeSelectionByKey$);
    const iconComponentFor = useCellValue(iconComponentFor$);
    const realm = useRealm();
    const [previewMode, setPerviewMode] = useState(true);

    const selectionChange = useCallback(() => {
      const editorInFocus = realm.getValue(editorInFocus$);
      const rootEditor = realm.getValue(rootEditor$);

      if (editorInFocus?.editorType === 'codeblock' && editorInFocus?.rootNode?.__key === props.nodeKey) {
        const selectedCode = document.getSelection()?.toString();
        const codeDomNode = rootEditor.getElementByKey(editorInFocus?.rootNode?.__key);
        const isChild = codeDomNode?.contains(document.activeElement);
        if (isChild) {
          const codeSelection = {
            nodeKey: props.nodeKey,
            code: props.code,
            selection: selectedCode,
            language: props.language,
          };
          realm.pub(setCodeSelection$, codeSelection);
        }
      }
    }, [props, realm]);

    useEffect(() => {
      document.addEventListener('selectionchange', selectionChange);

      return () => document.removeEventListener('selectionchange', selectionChange);
    }, [selectionChange]);

    return (
      <div
        onKeyDown={(e) => {
          e.nativeEvent.stopImmediatePropagation()
        }}
      >
        <div className="mermaidBlockWrapper">
          <div className="mermaidBlockAction" onClick={() => setNodeSelection(props.nodeKey)}>
            {iconComponentFor('handPointer')}
          </div>
          <div className="mermaidBlockAction" onClick={() => setPerviewMode(!previewMode)}>
            {previewMode ? iconComponentFor('code') : iconComponentFor('eye')}
          </div>
          {!previewMode &&
            <div className="mermaidEditorWrapper">
              <CodeMirrorEditor {...props} />
            </div>
          }
          {previewMode &&
            <div className="mermaidPreviewWrapper">
              <div>
                <VegaPreview code={props.code} />
              </div>
            </div>
          }
        </div>
      </div>
    );
  }
}