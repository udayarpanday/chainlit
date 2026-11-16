import { documentKind } from '@/lib/documentPreview';

import { type IFileElement } from '@chainlit/react-client';

import { Attachment } from '@/components/chat/MessageComposer/Attachment';

import { DocumentCard } from './DocumentCard';

const FileElement = ({ element }: { element: IFileElement }) => {
  if (!element.url) {
    return null;
  }
  if (documentKind(element)) return <DocumentCard element={element} />;

  return (
    <a
      className={`${element.display}-file no-underline`}
      download={element.name}
      href={element.url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <Attachment name={element.name} mime={element.mime} />
    </a>
  );
};

export { FileElement };
