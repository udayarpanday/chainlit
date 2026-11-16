import type { ReactNode } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import {
  type IMessageElement,
  evoyaCreatorEnabledState,
  sideViewState
} from '@chainlit/react-client';

import { EXTERNAL_DOCUMENT_PREVIEW_KEY } from '../../lib/externalDocumentPreview';
import MessageLink from '../MessageLink';

export default function ExternalDocumentLink({
  element,
  children
}: {
  element: IMessageElement;
  children: ReactNode;
}) {
  const setSideView = useSetRecoilState(sideViewState);
  const creatorEnabled = useRecoilValue(evoyaCreatorEnabledState);
  return (
    <MessageLink
      href={element.url}
      className="text-primary hover:underline"
      target="_blank"
      rel="noopener noreferrer"
      referrerPolicy="no-referrer"
      onClick={(event) => {
        if (
          creatorEnabled ||
          event.button !== 0 ||
          event.ctrlKey ||
          event.metaKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        event.preventDefault();
        setSideView({
          title: element.name,
          elements: [element],
          key: EXTERNAL_DOCUMENT_PREVIEW_KEY
        });
      }}
    >
      {children}
    </MessageLink>
  );
}
