import { EvoyaDirectory, EvoyaFile, FilePickerData, FilePickerItem as FilePickerItemType, PathItem } from '@/types';
import {
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Checkbox } from '@chainlit/app/src/components/ui/checkbox';
import { getSizeDisplay } from '@/utils/file';
import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';

import FilePickerItem from './FilePickerItem'
import { v4 as uuidv4 } from 'uuid';

import {
  Home,
  ChevronRight,
  Download,
  Trash2,
} from 'lucide-react';
import { cn } from '@chainlit/app/src/lib/utils';
import { FilePickerContext } from '@/context/file-context';

import { useUpload } from '@chainlit/app/src/hooks/useUpload';

type Props = {
  initialPath: string;
  showActions?: boolean;
  handleItemClick?: (item: FilePickerItemType) => void;
  selectedItemsChange: (items: FilePickerItemType[]) => void;
  hasUpload?: boolean;
  multiselect?: boolean;
  attachmentMode?: boolean;
  destinationMode?: boolean;
}
const dummyPathItems: PathItem[] = [
  {
    name: 'Home',
    path: '/',
    canOpen: true
  },
  {
    name: 'Documents',
    path: '/documents/',
    canOpen: true
  }
];

const dummyItems: FilePickerItemType[] = [
  {
    id: uuidv4(),
    name: 'Marketing',
    owner: 'You',
    modified: new Date(),
    created: new Date(),
    showActions: true,
    path: 'Marketing/'
  },
  {
    id: uuidv4(),
    name: 'Notes',
    owner: 'You',
    modified: new Date(),
    created: new Date(),
    showActions: true,
    path: 'Notes/'
  },
  {
    id: uuidv4(),
    name: 'Product',
    owner: 'Sarah K.',
    modified: new Date(),
    created: new Date(),
    showActions: false,
    path: 'Product/'
  },
  {
    id: uuidv4(),
    name: 'astra-2012.pdf',
    owner: 'You',
    modified: new Date(),
    created: new Date(),
    showActions: true,
    path: '/static/test-docs/astra-2012.pdf',
    size: 1572864,
    mime: 'application/pdf'
  },
  {
    id: uuidv4(),
    name: 'README.md',
    owner: 'You',
    modified: new Date(),
    created: new Date(),
    showActions: true,
    path: '/path/to/file/README.md',
    size: 2048,
    mime: 'text/markdown'
  },
  {
    id: uuidv4(),
    name: 'room_data.json',
    owner: 'You',
    modified: new Date(),
    created: new Date(),
    showActions: true,
    path: '/static/test-docs/room_data.json',
    size: 2048,
    mime: 'application/json'
  },
  {
    id: uuidv4(),
    name: 'manual-doc.docx',
    owner: 'You',
    modified: new Date(),
    created: new Date(),
    showActions: true,
    path: '/static/test-docs/manual-doc.docx',
    size: 2048,
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  },
  {
    id: uuidv4(),
    name: 'themen.pptx',
    owner: 'You',
    modified: new Date(),
    created: new Date(),
    showActions: true,
    path: '/static/test-docs/themen.pptx',
    size: 2048,
    mime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  },
  // {
  //   id: uuidv4(),
  //   name: 'test-data.csv',
  //   owner: 'You',
  //   modified: new Date(),
  //   created: new Date(),
  //   showActions: true,
  //   path: '/static/test-docs/test-data.csv',
  //   size: 2048,
  //   mime: 'application/json'
  // },
]

export default function FilePicker({
  initialPath,
  showActions = false,
  hasUpload = false,
  multiselect = false,
  attachmentMode = false,
  destinationMode = false,
  handleItemClick = () => {},
  selectedItemsChange,
}: Props) {
  const { apiBaseUrl } = useContext(FilePickerContext);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [pathData, setPathData] = useState<FilePickerData | null>(null);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDirectory = async (path: string) => {
    // fetch('http://localhost:8000/chat/list-chat/');
    setCurrentPath(path);
    setSelectedElements([]);
    selectedItemsChange([]);
    setPathData({
      path: dummyPathItems,
      items: dummyItems.filter((item) => !destinationMode || !("size" in item))
    });
  }

  const itemClick = (item: FilePickerItemType) => {
    const isFile = "size" in item;
    handleItemClick(item);
    if (!isFile) {
      fetchDirectory(item.path);
    }
  }

  useEffect(() => {
    fetchDirectory(currentPath);
  }, []);

  const setItemSelected = (id: string, value: boolean) => {
    let newItems: string[] = [];
    if (value) {
      if (multiselect) {
        newItems = [...selectedElements, id];
      } else {
        newItems = [id];
      }
    } else {
      const currIndex = selectedElements.findIndex((val) => val === id);
      newItems = selectedElements.toSpliced(currIndex, 1);
      if (multiselect) {
        newItems = selectedElements.toSpliced(currIndex, 1);
      } else {
        newItems = [];
      }
    }
    setSelectedElements(newItems);
    selectedItemsChange(pathData.items.filter((item) => newItems.includes(item.id)));
  }

  const onCheckedChange = (val: boolean) => {
    if (val) {
      setSelectedElements(pathData.items.map((item) => item.id));
      selectedItemsChange(pathData.items);
    } else {
      setSelectedElements([]);
      selectedItemsChange([]);
    }
  }

  const onFileUpload = (payloads: File[]) => {
    console.log('view dir', payloads);
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
    onResolved: (payloads: File[]) => hasUpload && onFileUpload(payloads),
    onError: onFileUploadError,
    options: { noDrag: false, noClick: true, }
  });
  const { getRootProps, getInputProps, isDragActive } = upload ?? {};

  if (!pathData) {
    return (
      <div>Loading</div>
    );
  }

  return (
    <div>
      <div className={cn("flex items-center mb-4", (attachmentMode || destinationMode) ? 'text-xs' : 'text-sm')}>
        {pathData.path.length > 0 && pathData.path.map((item, index) => (
          <>
            {index > 0 && (
              <div className={(attachmentMode || destinationMode) ? 'px-1' : 'px-2'}>
                <ChevronRight className={(attachmentMode || destinationMode) ? 'h-3 w-3' : 'h-4 w-4'} />
              </div>
            )}
            <div className={cn('flex items-center', item.path ? 'hover:text-foreground transition-colors cursor-pointer' : '', index < pathData.path.length - 1 ? 'text-gray-400' : '')} onClick={() => item.path && fetchDirectory(item.path)}>
              {index === 0 && <Home className={(attachmentMode || destinationMode) ? 'h-3 w-3 mr-1' : 'h-4 w-4 mr-2'} />}
              <span>{item.name}</span>
            </div>
          </>
        ))}
      </div>
      <div className={cn("rounded-lg border bg-white py-2 px-4", isDragActive && hasUpload ? 'bg-primary/20' : '')} {...(hasUpload ? getRootProps() : {})}>
        {hasUpload && <input {...getInputProps()} />}
        <div className={cn("grid", showActions ? 'grid-cols-[max-content_auto_max-content_max-content_max-content_max-content]' : 'grid-cols-[max-content_auto_max-content_max-content_max-content]')}>
          <div className="contents text-xs">
            <div className="flex items-center p-2">
              {multiselect && <Checkbox checked={selectedElements.length === pathData.items.length} onCheckedChange={onCheckedChange} />}
            </div>
            <div className="p-2 flex items-center text-gray-400 font-semibold">
              <Translator path="evoyaFiles.headers.name" />
            </div>
            <div className="p-2 flex items-center text-gray-400 font-semibold">
              <Translator path="evoyaFiles.headers.owner" />
            </div>
            <div className="p-2 flex items-center text-gray-400 font-semibold">
              <Translator path="evoyaFiles.headers.modified" />
            </div>
            <div className="p-2 flex items-center text-gray-400 font-semibold">
              <Translator path="evoyaFiles.headers.size" />
            </div>
            {showActions && <div></div>}
          </div>
          {pathData.items.length > 0 && pathData.items.map((item) => (
            <FilePickerItem
              item={item}
              selected={selectedElements.includes(item.id)}
              setSelectedState={(value) => setItemSelected(item.id, value)}
              onClick={() => itemClick(item)}
              showActions={showActions}
            />
          ))}
        </div>
      </div>
      {(selectedElements.length > 0 || attachmentMode) && !destinationMode && (
        <div className="rounded-lg border bg-white flex justify-between items-center mt-4 pl-4 pr-1 py-1">
          <div className="text-sm">{selectedElements.length} <Translator path="evoyaFiles.common.selected" /></div>
          <div className="flex items-center gap-1">
            {showActions && (
              <>
                <Button
                  variant="ghost"
                  className="text-gray-400"
                >
                  <Download />
                  <Translator path="evoyaFiles.actions.download.label" />
                </Button>
                <Button
                  variant="ghost-destructive"
                >
                  <Trash2 />
                  <Translator path="evoyaFiles.actions.delete.label" />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              className="text-gray-400"
              onClick={() => onCheckedChange(false)}
              disabled={selectedElements.length === 0}
            >
              <Translator path="evoyaFiles.actions.clear.label" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}