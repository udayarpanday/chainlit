import { useContext, useEffect, useState } from 'react';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import FilePicker from './components/FilePicker';
import { FilePickerContext } from './context/file-context';
import { Button } from '@chainlit/app/src/components/ui/button';
import { useUpload } from '@chainlit/app/src/hooks/useUpload';
import { ArrowLeft, Upload } from 'lucide-react';
import { FilePickerItem, EvoyaFile } from './types';
import { ViewerWrapper } from './components/viewer';

interface Props {
  initialPath: string;
  apiBaseUrl: string;
}

const customFileRenderer = [
  'text/',
  'image/',
  'application/json',
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export default function Widget({ initialPath, apiBaseUrl }: Props) {
  const [isUploading, setIsUploading] = useState(false);
  const [openFile, setOpenFile] = useState<EvoyaFile | null>(null);
  const handleItemClick = (item: FilePickerItem) => {
    console.log(item);
    const isFile = "size" in item;
    if (isFile) {
      if (customFileRenderer.some((renderer) => item.mime.includes(renderer))) {
        console.log("set as file");
        setOpenFile(item as EvoyaFile);
      } else {
        // open file in new tab
      }
    }
  }
  const selectedItemsChange = () => {}
  const onFileUpload = (payloads: File[]) => {
    console.log(payloads);
    setIsUploading(true);
  }
  const onFileUploadError = () => {}

  const fileSpec = {
    max_size_mb: 500,
    max_files: 20,
    accept: ['*/*']
  };

  const upload = useUpload({
    spec: fileSpec,
    onResolved: (payloads: File[]) => onFileUpload(payloads),
    onError: onFileUploadError,
    options: { noDrag: false }
  });
  const { getRootProps, getInputProps } = upload ?? {};

  return (
    <FilePickerContext.Provider value={{
      apiBaseUrl
    }}>
      <div>
        {!openFile && (
          <div className="flex justify-between items-center mb-4">
            <div className="font-bold text-2xl">Files</div>
            <div>
              <input
                id="upload-button-input"
                className="hidden"
                {...getInputProps()}
              />
              <Button
                id='upload-button'
                disabled={isUploading}
                {...getRootProps()}
              >
                <Upload className="h-5" />
                Upload
              </Button>
            </div>
          </div>
        )}
        {!openFile && (
          <FilePicker
            initialPath={initialPath}
            handleItemClick={handleItemClick}
            selectedItemsChange={selectedItemsChange}
            showActions
            multiselect
          />
        )}
        {openFile && (
          <ViewerWrapper file={openFile} setOpenFile={setOpenFile} />
        )}
      </div>
    </FilePickerContext.Provider>
  );
}
