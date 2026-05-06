import { useState } from 'react';
import FilePicker from './components/FilePicker';
import { FilePickerContext } from './context/file-context';
import { Button } from '@chainlit/app/src/components/ui/button';
import { useUpload } from '@chainlit/app/src/hooks/useUpload';
import { Upload } from 'lucide-react';
import { FilePickerItem, EvoyaFile } from './types';
import { ViewerWrapper } from './components/viewer';

interface Props {
  initialPath: string;
  apiBaseUrl: string;
  csrfToken: string;
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

export default function Widget({ initialPath, apiBaseUrl, csrfToken }: Props) {
  const [selectedPath, setSelectedPath] = useState(initialPath);
  const [isUploading, setIsUploading] = useState(false);
  const [openFile, setOpenFile] = useState<EvoyaFile | null>(null);
  const handleItemClick = (item: FilePickerItem) => {
    console.log(item);
    const isFile = "size" in item;
    if (isFile) {
      if (customFileRenderer.some((renderer) => item.mime.includes(renderer))) {
        setOpenFile(item as EvoyaFile);
      } else {
        // open file in new tab or download
      }
    }
  }

  const setSelectedPathHandler = (value: string) => {
    setSelectedPath(value);
    window.history.replaceState({}, '', `${window.location.origin}${window.location.pathname}?path=${value}`)
  }

  const selectedItemsChange = () => {}

  const onFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const data = new FormData();
      data.append('file', file)
      data.append('path', selectedPath)
      const response = await fetch(`${apiBaseUrl}/api/files/upload/`, {
        method: 'POST',
        body: data,
        headers: {
          'X-CSRFToken': csrfToken,
        },
      });
      const json = await response.json();
      console.log(json);
    } catch(err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  }

  const onFileUploadError = () => {}

  const fileSpec = {
    max_size_mb: 500,
    max_files: 20,
    accept: ['*/*']
  };

  const upload = useUpload({
    spec: fileSpec,
    onResolved: (payloads: File[]) => onFileUpload(payloads[0]),
    onError: onFileUploadError,
    options: { noDrag: false, multiple: false }
  });
  const { getRootProps, getInputProps } = upload ?? {};

  return (
    <FilePickerContext.Provider value={{
      apiBaseUrl,
      csrfToken
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
            initialPath={selectedPath}
            handleItemClick={handleItemClick}
            selectedItemsChange={selectedItemsChange}
            setSelectedPath={setSelectedPathHandler}
            showActions
            multiselect
            hasUpload
          />
        )}
        {openFile && (
          <ViewerWrapper file={openFile} setOpenFile={setOpenFile} />
        )}
      </div>
    </FilePickerContext.Provider>
  );
}
