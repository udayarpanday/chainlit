import { useEffect, useRef } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import {
  IMessageElement,
  IStep,
  evoyaCreatorEnabledState,
  sideViewState
} from '@chainlit/react-client';

import { messageDocuments } from '../lib/documentPreview';

// History is seeded without opening anything. Only documents observed during a
// live assistant turn open automatically, once the response has finished.
export function useDocumentAutoPreview(
  messages: IStep[],
  elements: IMessageElement[],
  loading: boolean,
  fileServer?: string
) {
  const setSideView = useSetRecoilState(sideViewState);
  const creatorEnabled = useRecoilValue(evoyaCreatorEnabledState);
  const seen = useRef(new Set<string>());
  const pending = useRef(new Map<string, IMessageElement>());
  const initialized = useRef(false);
  const wasLoading = useRef(false);

  useEffect(() => {
    if (!messages.length) {
      seen.current.clear();
      pending.current.clear();
      initialized.current = true;
      wasLoading.current = loading;
      return;
    }
    // Scan the completed response once rather than reparsing the entire chat
    // history for every streamed token.
    if (loading) {
      wasLoading.current = true;
      return;
    }
    const available = new Set<string>();
    const visit = (steps: IStep[]) => {
      for (const step of steps) {
        if (step.type === 'assistant_message') {
          for (const document of messageDocuments(
            step,
            elements,
            fileServer ? [fileServer] : [],
            true
          )) {
            available.add(document.id);
            if (!seen.current.has(document.id)) {
              seen.current.add(document.id);
              if (initialized.current && (loading || wasLoading.current))
                pending.current.set(document.id, document);
            } else if (pending.current.has(document.id)) {
              pending.current.set(document.id, document);
            }
          }
        }
        if (step.steps) visit(step.steps);
      }
    };
    visit(messages);
    for (const id of pending.current.keys()) {
      if (!available.has(id)) pending.current.delete(id);
    }
    initialized.current = true;
    wasLoading.current = loading;
    if (!loading && pending.current.size) {
      const documents = [...pending.current.values()];
      pending.current.clear();
      if (creatorEnabled) return;
      // Open the panel as soon as the response completes. The viewer resolves
      // unknown types and reports access failures without hiding the artifact.
      setSideView((current) =>
        current?.title === 'canvas'
          ? current
          : {
              title: documents.length > 1 ? 'Documents' : documents[0].name,
              elements: documents,
              key: 'document-preview'
            }
      );
    }
  }, [messages, elements, loading, fileServer, creatorEnabled, setSideView]);
}
