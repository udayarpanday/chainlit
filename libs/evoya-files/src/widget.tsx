import { useState } from 'react';
import FilePicker from './components/FilePicker';
import { FilePickerContext } from './context/file-context';
import { FilePickerItem, EvoyaFile, PathItem, ShortcutKey } from './types';
import { ViewerWrapper } from './components/viewer';
import { downloadBlob, isPreviewSupported } from './utils/file';
import { isShortcutKey } from './utils/files-api';

interface Props {
  initialPath: string;
  apiBaseUrl: string;
  csrfToken: string;
  workspaceId?: string;
  projectId?: string;
  file?: string;
  mime?: string;
  brandColor?: string | null;
}

export default function Widget({ initialPath, apiBaseUrl, csrfToken, workspaceId, projectId, file, mime, brandColor }: Props) {
  const requestedView = new URLSearchParams(window.location.search).get('view');
  const initialView = isShortcutKey(requestedView) ? requestedView : undefined;
  const [selectedPath, setSelectedPath] = useState(initialPath);
  const [pathItems, setPathItems] = useState<PathItem[]>([]);
  const [openFile, setOpenFile] = useState<EvoyaFile | null>((file && mime) ? { path: initialPath + file, name: file, mime: mime, owner: '', size: 0, showActions: false, modified: new Date(), created: new Date() } : null);
  const handleItemClick = (item: FilePickerItem) => {
    const isFile = "size" in item;
    if (isFile) {
      if (isPreviewSupported(item.mime)) {
        setOpenFile(item as EvoyaFile);
      } else {
        const params = new URLSearchParams({ path: item.path, intent: 'download' });
        fetch(`${apiBaseUrl}/api/files/download/?${params.toString()}`)
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
    urlParams.delete('view');
    window.history.replaceState({}, '', `${window.location.origin}${window.location.pathname}?${urlParams.toString()}`)
  }

  const setSelectedViewHandler = (view?: ShortcutKey) => {
    const urlParams = new URLSearchParams(window.location.search);
    if (view) {
      urlParams.set('view', view);
      urlParams.set('path', '/');
    } else {
      urlParams.delete('view');
    }
    window.history.replaceState({}, '', `${window.location.origin}${window.location.pathname}?${urlParams.toString()}`);
  };

  const selectedItemsChange = () => {}

  return (
    <FilePickerContext.Provider value={{
      apiBaseUrl,
      csrfToken,
      workspaceId,
      projectId,
      type: 'default',
      brandColor
    }}>
      {!openFile && (
        <FilePicker
          initialPath={selectedPath}
          handleItemClick={handleItemClick}
          selectedItemsChange={selectedItemsChange}
          setSelectedPath={setSelectedPathHandler}
          setPathItems={setPathItems}
          initialView={initialView}
          setSelectedView={setSelectedViewHandler}
          showActions
          multiselect
          hasUpload
        />
      )}
      {openFile && (
        <ViewerWrapper file={openFile} setOpenFile={setOpenFile} pathItems={pathItems} setSelectedPath={setSelectedPathHandler} />
      )}
    </FilePickerContext.Provider>
  );
}
