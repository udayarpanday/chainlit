import { documentKind } from '@/lib/documentPreview';
import { ArrowLeft } from 'lucide-react';

import type { IMessageElement } from '@chainlit/react-client';

import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

import { Element } from './Elements';
import DocumentPreview from './Elements/DocumentPreview';
import { Button } from './ui/button';

interface ElementViewProps {
  element: IMessageElement;
  onGoBack?: () => void;
}

const ElementView = ({ element, onGoBack }: ElementViewProps) => {
  const layoutMaxWidth = useLayoutMaxWidth();

  return (
    <div
      className="flex flex-col flex-grow p-4 mx-auto gap-4 w-full"
      style={{
        maxWidth: layoutMaxWidth
      }}
      id="element-view"
    >
      <div className="flex items-center gap-1 -ml-2">
        {onGoBack ? (
          <Button size="icon" variant="ghost" onClick={onGoBack}>
            <ArrowLeft />
          </Button>
        ) : null}
        <div className="text-lg font-semibold leading-none tracking-tight">
          {element.name}
        </div>
      </div>

      {documentKind(element) ? (
        <DocumentPreview elements={[element]} />
      ) : (
        <Element element={element} />
      )}
    </div>
  );
};

export { ElementView };
