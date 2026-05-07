import { useState } from 'react';
import FilePicker from './components/FilePicker';
import { FilePickerContext } from './context/file-context';
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
  const [openFile, setOpenFile] = useState<EvoyaFile | null>(null);
  const handleItemClick = (item: FilePickerItem) => {
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

  return (
    <FilePickerContext.Provider value={{
      apiBaseUrl,
      csrfToken
    }}>
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
    </FilePickerContext.Provider>
  );
}
