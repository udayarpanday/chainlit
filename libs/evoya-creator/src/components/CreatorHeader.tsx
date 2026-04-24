import { Button } from '@chainlit/app/src/components/ui/button';
import {
  FilePickerDialog
} from '@chainlit/app/src/components/FilePickerDialog';
import { FileInput, Save, X } from 'lucide-react';

import { useState } from 'react';
import useEvoyaCreator from '@/hooks/useEvoyaCreator';

const CreatorHeader = (): JSX.Element => {
  const {
    closeCreatorOverlay,
    saveCreatorContent,
  } = useEvoyaCreator();
  const [filesOpen, setFilesOpen] = useState(false);

  const handleCloseCreator = () => {
    closeCreatorOverlay();
  };

  const selectFile = (file) => {
    setFilesOpen(false);
    console.log(file);
  }

  return (
    <div className="!py-4 pl-2 pr-3 flex items-center justify-between header-bar border-b">
      <div className="font-bold">
        Creator
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={() => saveCreatorContent()} className="!w-9 rounded-full">
          <Save />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setFilesOpen(true)} className="!w-9 rounded-full">
          <FileInput />
        </Button>
        <FilePickerDialog
          open={filesOpen}
          setOpen={setFilesOpen}
          selectFile={selectFile}
        />
        <Button variant="ghost" size="icon" onClick={handleCloseCreator} className="!w-9 rounded-full">
          <X />
        </Button>
      </div>
    </div>
  )
};

export default CreatorHeader;
