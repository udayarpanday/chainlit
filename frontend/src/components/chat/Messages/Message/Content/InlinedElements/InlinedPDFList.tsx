import type { IPdfElement } from '@chainlit/react-client';

import { DocumentCard } from '@/components/Elements/DocumentCard';

interface Props {
  items: IPdfElement[];
}

const InlinedPDFList = ({ items }: Props) => (
  <div className="flex flex-col gap-2">
    {items.map((pdf, i) => {
      return (
        <div key={i}>
          <DocumentCard element={pdf} />
        </div>
      );
    })}
  </div>
);

export { InlinedPDFList };
