import { useState } from 'react';
import FilePicker from './components/FilePicker';
import { FilePickerContext } from './context/file-context';
import { FilePickerItem, EvoyaFile } from './types';
import { ViewerWrapper } from './components/viewer';
import { downloadBlob } from './utils/file';

interface Props {
  initialPath: string;
  apiBaseUrl: string;
  csrfToken: string;
  workspaceId?: string;
  projectId?: string;
  file?: string;
  mime?: string;
}

const customFileRenderer = [
  'text/',
  'image/',
  'audio/',
  'video/webm',
  'application/json',
  'application/pdf',
];

export default function Widget({ initialPath, apiBaseUrl, csrfToken, workspaceId, projectId, file, mime }: Props) {
  const [selectedPath, setSelectedPath] = useState(initialPath);
  const [openFile, setOpenFile] = useState<EvoyaFile | null>((file && mime) ? { path: initialPath + file, name: file, mime: mime, owner: '', size: 0, showActions: false, modified: new Date(), created: new Date() } : null);
  const handleItemClick = (item: FilePickerItem) => {
    const isFile = "size" in item;
    if (isFile) {
      if (customFileRenderer.some((renderer) => item.mime.includes(renderer))) {
        setOpenFile(item as EvoyaFile);
      } else {
        fetch(`${apiBaseUrl}/api/files/download/?path=${item.path}`)
          .then((response) => response.blob())
          .then((blob) => {
            downloadBlob(blob, item.name);
          });
      }
    }
  }

  const setSelectedPathHandler = (value: string) => {
    setSelectedPath(value);
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('path', value);
    window.history.replaceState({}, '', `${window.location.origin}${window.location.pathname}?${urlParams.toString()}`)
  }

  const selectedItemsChange = () => {}

  return (
    <FilePickerContext.Provider value={{
      apiBaseUrl,
      csrfToken,
      workspaceId,
      projectId,
      type: 'default'
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
