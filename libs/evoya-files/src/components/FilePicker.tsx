import {
  FilePickerData,
  FilePickerItem as FilePickerItemType,
} from '@/types';
import {
  useContext,
  useEffect,
  useState,
} from 'react';

import { Checkbox } from '@chainlit/app/src/components/ui/checkbox';
import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';

import FilePickerItem from './FilePickerItem'
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/utils/evoya-toast';

import {
  Download,
  Trash2,
  LoaderCircle,
} from 'lucide-react';
import { cn } from '@chainlit/app/src/lib/utils';
import { FilePickerContext } from '@/context/file-context';

import { useUpload } from '@chainlit/app/src/hooks/useUpload';
import Uploader from './Uploader';
import FolderBreadcrumbs from './FolderBreadcrumbs';
import { downloadBlob } from '@/utils/file';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@chainlit/app/src/components/ui/dialog';
import {
  ScrollArea
} from '@chainlit/app/src/components/ui/scroll-area';

type Props = {
  initialPath: string;
  showActions?: boolean;
  handleItemClick?: (item: FilePickerItemType) => void;
  selectedItemsChange?: (items: FilePickerItemType[]) => void;
  setSelectedPath?: (path: string) => void;
  hasUpload?: boolean;
  multiselect?: boolean;
  attachmentMode?: boolean;
  destinationMode?: boolean;
  singleMode?: boolean;
}

export default function FilePicker({
  initialPath,
  showActions = false,
  hasUpload = false,
  multiselect = false,
  attachmentMode = false,
  destinationMode = false,
  singleMode = false,
  handleItemClick = () => {},
  selectedItemsChange = () => {},
  setSelectedPath = () => {},
}: Props) {
  const { apiBaseUrl, csrfToken } = useContext(FilePickerContext);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [pathData, setPathData] = useState<FilePickerData>({ path: [], items: []});
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchDirectory = async (path: string) => {
    setSelectedPath(path)
    setIsLoading(true);
    const response = await fetch(`${apiBaseUrl}/api/files?path=${path}`);
    const json = await response.json()
    setCurrentPath(path);
    setSelectedElements([]);
    selectedItemsChange([]);
    setPathData({
      // path: dummyPathItems,
      path: [
        {
          name: 'Home',
          path: '/',
          canOpen: true
        },
        ...json.breadcrumbs
      ],
      // items: dummyItems.filter((item) => !destinationMode || !("size" in item))
      items: [
        ...json.folders.map((folder) => ({
          ...folder,
          created: folder.created ? new Date(folder.created) : null,
          modified: folder.modified ? new Date(folder.modified) : null,
          id: uuidv4(),
        })),
        ...(destinationMode ? [] : json.documents).map((document) => ({
          ...document,
          created: document.created ? new Date(document.created) : null,
          modified: document.modified ? new Date(document.modified) : null,
          id: uuidv4(),
        }))
      ]
    });
    setIsLoading(false);
  }

  const itemClick = (item: FilePickerItemType) => {
    const isFile = "size" in item;
    handleItemClick(item);
    if (!isFile) {
      fetchDirectory(item.path);
    }
  }

  useEffect(() => {
    loadCurrentPath()
  }, []);

  const loadCurrentPath = () => {
    fetchDirectory(currentPath);
  }

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
  
  const moveItem = async (item: FilePickerItemType, destinationPath: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/files/move/`, {
        method: 'POST',
        body: JSON.stringify({
          path: item.path,
          destination: destinationPath
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
      });
      const json = await response.json();
      if (json.success) {
        toast.success('File moved!');
        loadCurrentPath();
      } else {
        toast.error('Failed to move file!');
      }
    } catch(err) {
      console.error(err);
      toast.error('Failed to move file!');
    } finally {
      setIsLoading(false);
    }
  }
  
  const renameItem = async (item: FilePickerItemType, newName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/files/rename/`, {
        method: 'POST',
        body: JSON.stringify({
          path: item.path,
          new_name: newName
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
      });
      const json = await response.json();
      if (json.success) {
        toast.success('File renamed!');
        loadCurrentPath();
      } else {
        toast.error('Failed to rename file!');
      }
    } catch(err) {
      console.error(err);
      toast.error('Failed to rename file!');
    } finally {
      setIsLoading(false);
    }
  }

  const deleteItemsHandler = () => {
    deleteItems(pathData.items.filter((item) => selectedElements.includes(item.id)))
  }
  
  const deleteItems = async (items: FilePickerItemType[]) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/files/delete/`, {
        method: 'POST',
        body: JSON.stringify({
          paths: items.map((item) => item.path)
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
      });
      const json = await response.json();
      if (json.success) {
        toast.success('Items deleted!');
        loadCurrentPath();
      } else {
        toast.error('Failed to delete items!');
      }
    } catch(err) {
      console.error(err);
      toast.error('Failed to delete items!');
    } finally {
      setIsLoading(false);
    }
  }

  const downloadItems = (items: FilePickerItemType[]) => {
    if (items.length === 1 && "size" in items[0]) {
      fetch(`${apiBaseUrl}/api/files/download/?path=${items[0].path}`)
        .then((response) => response.blob())
        .then((blob) => {
          downloadBlob(blob, items[0].name);
        });
    } else {
      fetch(`${apiBaseUrl}/api/files/download/bulk/check/`, {
        method: "POST",
        body: JSON.stringify({
          paths: items.map((item) => item.path)
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
      })
        .then((response) => response.json())
        .then((json) => {
          if (json.success) {
            fetch(`${apiBaseUrl}/api/files/download/bulk/`, {
              method: "POST",
              body: JSON.stringify({
                paths: items.map((item) => item.path)
              }),
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken,
              },
            })
              .then((response) => response.blob())
              .then((blob) => {
                downloadBlob(blob, items[0].name);
              });
          } else {
            toast.error(json.error);
          }
        })
        .catch((e) => {
          toast.error('Download not possible');
        });
    }
  }

  const onFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const data = new FormData();
      data.append('file', file)
      data.append('path', currentPath)
      const response = await fetch(`${apiBaseUrl}/api/files/upload/`, {
        method: 'POST',
        body: data,
        headers: {
          'X-CSRFToken': csrfToken,
        },
      });
      const json = await response.json();
      if (json.success) {
        toast.success('File uploaded!');
        loadCurrentPath();
      } else {
        toast.error('Failed to upload file!');
      }
    } catch(err) {
      console.error(err);
      toast.error('Failed to upload file!');
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
    onResolved: (payloads: File[]) => hasUpload && onFileUpload(payloads[0]),
    onError: onFileUploadError,
    options: { noDrag: false, noClick: true, multiple: false }
  });
  const { getRootProps, getInputProps, isDragActive } = upload ?? {};

  return (
    <>
    {showActions && hasUpload && (
      <Uploader
        setIsLoading={setIsLoading}
        isLoading={isLoading}
        onFileUpload={onFileUpload}
        currentPath={currentPath}
        loadCurrentPath={loadCurrentPath}
      />
    )}
    <div className='relative flex flex-col overflow-hidden'>
      <FolderBreadcrumbs
        pathData={pathData}
        fetchDirectory={fetchDirectory}
        isLoading={isLoading}
        attachmentMode={attachmentMode}
        destinationMode={destinationMode}
      />
      <div className={cn("rounded-lg border bg-white min-h-24 relative overflow-hidden flex", isDragActive && hasUpload ? 'bg-primary/20' : '')} {...(hasUpload ? getRootProps() : {})}>
        {hasUpload && <input {...getInputProps()} />}
        <ScrollArea className='w-full' type='auto'>
          <div className="pb-2 px-4">
            {(isLoading || isUploading) && (
              <div className='absolute rounded-lg top-0 right-0 bottom-0 left-0 bg-white/50 flex items-center justify-center z-10'>
                <LoaderCircle className='animate-spin' />
              </div>
            )}
            <div className={cn("grid", showActions ? 'grid-cols-[max-content_auto_max-content_max-content_max-content_max-content]' : (singleMode ? 'grid-cols-[auto_max-content_max-content_max-content]' : 'grid-cols-[max-content_auto_max-content_max-content_max-content]'))}>
              <div className="contents text-xs">
                {!singleMode && 
                  <div className="flex items-center p-2 pt-4 sticky top-0 bg-white">
                    {multiselect && <Checkbox checked={!isLoading && selectedElements.length === pathData.items.length} onCheckedChange={onCheckedChange} />}
                  </div>
                }
                <div className="p-2 pt-4 flex items-center text-gray-400 font-semibold sticky top-0 bg-white">
                  <Translator path="evoyaFiles.headers.name" />
                </div>
                <div className="p-2 pt-4 flex items-center text-gray-400 font-semibold sticky top-0 bg-white">
                  <Translator path="evoyaFiles.headers.owner" />
                </div>
                <div className="p-2 pt-4 flex items-center text-gray-400 font-semibold sticky top-0 bg-white">
                  <Translator path="evoyaFiles.headers.modified" />
                </div>
                <div className="p-2 pt-4 flex items-center text-gray-400 font-semibold sticky top-0 bg-white">
                  <Translator path="evoyaFiles.headers.size" />
                </div>
                {showActions && <div className="sticky top-0 bg-white"></div>}
              </div>
              {pathData.items.length > 0 && pathData.items.map((item) => (
                <FilePickerItem
                  item={item}
                  selected={selectedElements.includes(item.id)}
                  setSelectedState={(value) => setItemSelected(item.id, value)}
                  onClick={() => itemClick(item)}
                  showActions={showActions}
                  singleMode={singleMode}
                  onFileUpload={onFileUpload}
                  hasUpload={hasUpload}
                  deleteItems={deleteItems}
                  moveItem={moveItem}
                  renameItem={renameItem}
                  downloadItems={downloadItems}
                />
              ))}
              {(pathData.items.length === 0 && !isLoading) && (
                <div className='col-span-full p-2 flex justify-center text-sm text-gray-400'>
                  No Entries
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
      {(selectedElements.length > 0 || attachmentMode) && !destinationMode && !singleMode && (
        <div className="rounded-lg border bg-white flex justify-between items-center mt-4 pl-4 pr-1 py-1">
          <div className="text-sm">{selectedElements.length} <Translator path="evoyaFiles.common.selected" /></div>
          <div className="flex items-center gap-1">
            {showActions && (
              <>
                <Button
                  variant="ghost"
                  className="text-gray-400"
                  onClick={() => downloadItems(pathData.items.filter((item) => selectedElements.includes(item.id)))}
                >
                  <Download />
                  <Translator path="evoyaFiles.actions.download.label" />
                </Button>
                <Button
                  variant="ghost-destructive"
                  onClick={() => setDeleteOpen(true)}
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
      <Dialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      >
        <DialogContent className="z-[9999]">
          <DialogHeader>
            <DialogTitle>
              <Translator path="evoyaFiles.actions.delete_bulk.title" />
            </DialogTitle>
            <DialogDescription>
              <Translator path="evoyaFiles.actions.delete_bulk.description" />
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              <Translator path="common.actions.cancel" />
            </Button>
            <Button variant="destructive" onClick={deleteItemsHandler}>
              <Translator path="common.actions.confirm" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}