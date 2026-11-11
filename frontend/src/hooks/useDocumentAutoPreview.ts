import { useEffect, useRef } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import {
  IMessageElement,
  IStep,
  evoyaCreatorEnabledState,
  generatingMessageIdState,
  getMessageTurnIds,
  sideViewState
} from '@chainlit/react-client';

import { messageDocuments } from '../lib/documentPreview';

// Loading also occurs when restoring history. Only documents belonging to a
// locally started turn open automatically, once the response has finished.
export function useDocumentAutoPreview(
  messages: IStep[],
  elements: IMessageElement[],
  loading: boolean,
  fileServer?: string
) {
  const setSideView = useSetRecoilState(sideViewState);
  const creatorEnabled = useRecoilValue(evoyaCreatorEnabledState);
  const generatingMessageId = useRecoilValue(generatingMessageIdState);
  const seen = useRef(new Set<string>());
  // Keep the turn after message_task_end clears generatingMessageId so late
  // file elements can still open, without including earlier chat history.
  const activeTurnId = useRef<string>();

  useEffect(() => {
    if (!messages.length) {
      seen.current.clear();
      activeTurnId.current = undefined;
      return;
    }
    if (generatingMessageId) activeTurnId.current = generatingMessageId;
    // Scan the completed response once rather than reparsing the entire chat
    // history for every streamed token.
    if (loading) return;
    const activeMessageIds = activeTurnId.current
      ? getMessageTurnIds(messages, activeTurnId.current)
      : new Set<string>();
    const documents: IMessageElement[] = [];
    const visit = (steps: IStep[]) => {
      for (const step of steps) {
        if (step.type === 'assistant_message') {
          for (const document of messageDocuments(
            step,
            elements,
            fileServer ? [fileServer] : [],
            true
          )) {
            if (!seen.current.has(document.id)) {
              seen.current.add(document.id);
              if (activeMessageIds.has(step.id)) documents.push(document);
            }
          }
        }
        if (step.steps) visit(step.steps);
      }
    };
    visit(messages);
    if (documents.length) {
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
  }, [
    messages,
    elements,
    loading,
    fileServer,
    creatorEnabled,
    generatingMessageId,
    setSideView
  ]);
}
