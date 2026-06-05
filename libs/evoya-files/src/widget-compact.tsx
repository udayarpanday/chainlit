import FilePicker from './components/FilePicker';
import { FilePickerContext } from './context/file-context';
import { FilePickerItem } from './types';
import { downloadBlob } from './utils/file';

interface Props {
  initialPath: string;
  apiBaseUrl: string;
  csrfToken: string;
  workspaceId?: string;
  projectId?: string;
  brandColor?: string | null;
}

const customFileRenderer = [
  'text/',
  'image/',
  'audio/',
  'video/webm',
  'application/json',
  'application/pdf',
];

export default function WidgetCompact({ initialPath, apiBaseUrl, csrfToken, workspaceId, projectId, brandColor }: Props) {
  const handleItemClick = (item: FilePickerItem) => {
    const isFile = "size" in item;
    if (isFile) {
      if (customFileRenderer.some((renderer) => item.mime.includes(renderer))) {
        const filePathArr = item.path.split('/');
        filePathArr.pop();
        const filePath = filePathArr.join('/') + "/"
        window.location.href = `/files/manage/?path=${filePath}&file=${item.name}&mime=${item.mime}&projectId=${projectId}`
      } else {
        fetch(`${apiBaseUrl}/api/files/download/?path=${item.path}`)
          .then((response) => response.blob())
          .then((blob) => {
            downloadBlob(blob, item.name);
          });
      }
    } else {
      window.location.href = `/files/manage/?path=${item.path}&projectId=${projectId}`
    }
  }

  const setSelectedPathHandler = (_value: string) => {
    // window.location.href = `/files/manage/?path=${value}&projectId=${projectId}`
  }

  const selectedItemsChange = () => {}

  return (
    <FilePickerContext.Provider value={{
      apiBaseUrl,
      csrfToken,
      workspaceId,
      projectId,
      type: 'compact',
      brandColor
    }}>
      <FilePicker
        initialPath={initialPath}
        handleItemClick={handleItemClick}
        selectedItemsChange={selectedItemsChange}
        setSelectedPath={setSelectedPathHandler}
        showActions
        singleMode
        hasUpload
        compact
      />
    </FilePickerContext.Provider>
  );
}
