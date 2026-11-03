import type { IFileElement } from '@chainlit/react-client';

import { FileElement } from '@/components/Elements/File';

interface Props {
  items: IFileElement[];
}

const InlinedFileList = ({ items }: Props) => {
  return (
    <div className="flex flex-col gap-2">
      {items.map((file, i) => {
        return (
          <div key={i}>
            <FileElement element={file} />
          </div>
        );
      })}
    </div>
  );
};

export { InlinedFileList };
