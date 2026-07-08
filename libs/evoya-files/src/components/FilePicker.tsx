import type {
  EvoyaFile,
  FilePickerData,
  FilePickerItem,
  PathItem,
} from '../types';
import {
  useContext,
  useEffect,
  useState,
} from 'react';

import { Checkbox } from '@chainlit/app/src/components/ui/checkbox';
import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';

import FilePickerItemComponent from './FilePickerItem'
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@chainlit/app/src/lib/evoya-toast';

import {
  Download,
  Trash2,
  LoaderCircle,
} from 'lucide-react';
import { cn } from '@chainlit/app/src/lib/utils';
import { FilePickerContext } from '../context/file-context';

import { useUpload } from '@chainlit/app/src/hooks/useUpload';
import Uploader from './Uploader';
import FolderBreadcrumbs from './FolderBreadcrumbs';
import { downloadBlob } from '../utils/file';

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
import FileSearch from './FileSearch';

type Props = {
  initialPath: string;
  showActions?: boolean;
  setPathItems?: (items: PathItem[]) => void;
  handleItemClick?: (item: FilePickerItem) => void;
  selectedItemsChange?: (items: FilePickerItem[]) => void;
  setSelectedPath?: (path: string) => void;
  hasUpload?: boolean;
  multiselect?: boolean;
  attachmentMode?: boolean;
  destinationMode?: boolean;
  singleMode?: boolean;
  compact?: boolean;
  selectFilter?: (val: EvoyaFile) => boolean;
}

export default function FilePicker({
  initialPath,
  showActions = false,
  hasUpload = false,
  multiselect = false,
  attachmentMode = false,
  destinationMode = false,
  singleMode = false,
  compact = false,
  setPathItems = () => {},
  handleItemClick = () => {},
  selectedItemsChange = () => {},
  setSelectedPath = () => {},
  selectFilter = () => true,
}: Props) {
  const { apiBaseUrl, csrfToken } = useContext(FilePickerContext);
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [pathData, setPathData] = useState<FilePickerData>({ path: [], items: []});
  const [folderFiles, setFolderFiles] = useState<FilePickerItem[]>([]);
  const [searchItems, setSearchItems] = useState<FilePickerItem[]>([]);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [isSearch, setIsSearch] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchDirectory = async (path: string) => {
    setIsSearch(false);
    setSearchItems([]);
    setSelectedPath(path)
    setIsLoading(true);
    const response = await fetch(`${apiBaseUrl}/api/files?path=${path}`);
    const json = await response.json()
    setCurrentPath(path);
    setSelectedElements([]);
    selectedItemsChange([]);
    const folderFiles = (destinationMode ? [] : json.documents)
      .filter(selectFilter)
      .map((document) => ({
        ...document,
        created: document.created ? new Date(document.created) : null,
        modified: document.modified ? new Date(document.modified) : null,
        id: uuidv4(),
      }));
    const pathItems = [
        {
          name: 'Home',
          path: '/',
          canOpen: true
        },
        ...json.breadcrumbs
      ];
    setFolderFiles(folderFiles);
    setPathItems(pathItems);
    setPathData({
      // path: dummyPathItems,
      path: pathItems,
      // items: dummyItems.filter((item) => !destinationMode || !("size" in item))
      items: [
        ...json.folders
          .map((folder) => ({
            ...folder,
            created: folder.created ? new Date(folder.created) : null,
            modified: folder.modified ? new Date(folder.modified) : null,
            id: uuidv4(),
          })),
        ...folderFiles
      ]
    });
    setIsLoading(false);
  }

  const searchFilesHandler = async (query: string) => {
    setIsLoading(true);
    setIsSearch(true);
    try {
      // const response = await fetch(`${apiBaseUrl}/api/files?path=${currentPath}&search=${query}`);
      const response = await fetch(`${apiBaseUrl}/api/files?path=${currentPath}&search=${query}`);
      const json = await response.json();

      const sFiles = (destinationMode ? [] : json.documents)
        .filter(selectFilter)
        .map((document) => ({
          ...document,
          created: document.created ? new Date(document.created) : null,
          modified: document.modified ? new Date(document.modified) : null,
          id: uuidv4(),
        }));
      const sFolders = json.folders
        .map((folder) => ({
          ...folder,
          created: folder.created ? new Date(folder.created) : null,
          modified: folder.modified ? new Date(folder.modified) : null,
          id: uuidv4(),
        }));
      setSearchItems([...sFolders, ...sFiles]);
    } catch(err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  const itemClick = (item: FilePickerItem) => {
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
    const items = attachmentMode ? folderFiles : pathData.items;
    console.log(items);
    if (val) {
      setSelectedElements(items.map((item) => item.id));
      selectedItemsChange(items);
    } else {
      setSelectedElements([]);
      selectedItemsChange([]);
    }
  }
  
  const moveItem = async (item: FilePickerItem, destinationPath: string) => {
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
  
  const renameItem = async (item: FilePickerItem, newName: string) => {
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
  
  const deleteItems = async (items: FilePickerItem[]) => {
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
        setDeleteOpen(false);
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

  const downloadItems = (items: FilePickerItem[]) => {
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

  const onFileUpload = async (files: File[], forcePath: string = '') => {
    console.log(files);
    try {
      const responses = await Promise.all(files.map((file) => onSingleFileUpload(file, forcePath)));
      console.log(responses);
      if (responses.every((resp) => resp.success)) {
        if (files.length > 1) {
          toast.success('Files uploaded!');
        } else {
          toast.success('File uploaded!');
        }
        loadCurrentPath();
      }
    } catch(err) {
      if (files.length > 1) {
        toast.error('Failed to upload files!');
      } else {
        toast.error('Failed to upload file!');
      }
    } finally {
      setIsUploading(false);
    }
  }

  const onSingleFileUpload = async (file: File, forcePath: string = '') => {
    setIsUploading(true);
    try {
      const filePathArr = (file.path ?? '').split('/').filter((item: string) => !!item);
      filePathArr.pop();
      const data = new FormData();
      data.append('file', file)
      data.append('path', (forcePath ? forcePath : currentPath) + (filePathArr.length > 0 ? '/' + filePathArr.join('/') : ''))
      const response = await fetch(`${apiBaseUrl}/api/files/upload/`, {
        method: 'POST',
        body: data,
        headers: {
          'X-CSRFToken': csrfToken,
        },
      });
      const json = await response.json();
      if (json.success) {
        // toast.success('File uploaded!');
        // loadCurrentPath();
        return json;
      } else {
        throw new Error('Failed to upload file');
        // toast.error('Failed to upload file!');
      }
    } catch(err) {
      console.error(err);
      // toast.error('Failed to upload file!');
      throw err;
    } finally {
      // setIsUploading(false);
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
    onResolved: (payloads: File[]) => hasUpload && onFileUpload(payloads),
    onError: onFileUploadError,
    options: { noDrag: false, noClick: true, multiple: true }
  });
  const { getRootProps, getInputProps, isDragActive } = upload ?? {};

  const selectableItemsLength = attachmentMode ? folderFiles.length : pathData.items.length;

  return (
    <>
    {showActions && hasUpload && (
      <Uploader
        setIsLoading={setIsLoading}
        isLoading={isLoading}
        onFileUpload={onFileUpload}
        currentPath={currentPath}
        loadCurrentPath={loadCurrentPath}
        isSearch={isSearch}
      />
    )}
    <div className={cn('relative flex flex-col overflow-hidden', compact ? 'max-h-[300px]' : 'h-full')}>
      <div className='flex justify-between items-center mb-2 pt-2 overflow-hidden flex-shrink-0'>
        <FolderBreadcrumbs
          pathData={pathData}
          fetchDirectory={fetchDirectory}
          isLoading={isLoading}
          attachmentMode={attachmentMode}
          destinationMode={destinationMode}
          singleMode={singleMode}
          isSearch={isSearch}
          compact={compact}
        />
        {!compact && (
          <FileSearch
            isLoading={isLoading}
            searchFiles={searchFilesHandler}
            attachmentMode={attachmentMode}
            destinationMode={destinationMode}
            clearSearch={() => setIsSearch(false)}
            singleMode={singleMode}
          />
        )}
      </div>
      <div className={cn("rounded-lg border min-h-24 relative overflow-hidden flex", isDragActive && hasUpload ? 'bg-primary/20 [.contents>div]:bg-primary/20!' : 'bg-white')} {...(hasUpload ? getRootProps() : {})}>
        {hasUpload && <input {...getInputProps()} />}
        <ScrollArea className='w-full' type='auto'>
          <div className="pb-2 px-4">
            {(isLoading || isUploading) && (
              <div className='absolute rounded-lg top-0 right-0 bottom-0 left-0 bg-white/50 flex items-center justify-center z-10'>
                <LoaderCircle className='animate-spin' />
              </div>
            )}
            <div
              className={cn(
                "grid",
                showActions ?
                  ((compact || attachmentMode || destinationMode) ? 'grid-cols-[auto_max-content]' : 'grid-cols-[max-content_auto_max-content] md:grid-cols-[max-content_auto_max-content_max-content_max-content_max-content]')
                  : (singleMode ?
                    ((compact || attachmentMode || destinationMode) ? 'grid-cols-[auto]' : 'grid-cols-[auto] md:grid-cols-[auto_max-content_max-content_max-content]')
                    : ((compact || attachmentMode || destinationMode) ? 'grid-cols-[max-content_auto]' : 'grid-cols-[max-content_auto] md:grid-cols-[max-content_auto_max-content_max-content_max-content]')
                  )
              )
            }>
              <div className="contents text-xs">
                {!singleMode && 
                  <div className="flex items-center p-2 pt-4 sticky top-0 bg-white">
                    {multiselect && <Checkbox checked={!isLoading && selectableItemsLength > 0 && selectedElements.length === selectableItemsLength} disabled={selectableItemsLength === 0} onCheckedChange={onCheckedChange} />}
                  </div>
                }
                <div className="p-2 pt-4 flex items-center text-gray-400 font-semibold sticky top-0 bg-white">
                  <Translator path="evoyaFiles.headers.name" />
                </div>
                {(!compact && !attachmentMode && !destinationMode) && (
                  <>
                    <div className="p-2 pt-4 flex items-center text-gray-400 font-semibold sticky top-0 bg-white hidden md:block">
                      <Translator path="evoyaFiles.headers.owner" />
                    </div>
                    <div className="p-2 pt-4 flex items-center text-gray-400 font-semibold sticky top-0 bg-white hidden md:block">
                      <Translator path="evoyaFiles.headers.modified" />
                    </div>
                    <div className="p-2 pt-4 flex items-center text-gray-400 font-semibold sticky top-0 bg-white hidden md:block">
                      <Translator path="evoyaFiles.headers.size" />
                    </div>
                  </>
                )}
                {showActions && <div className="sticky top-0 bg-white"></div>}
              </div>
              {!isSearch && pathData.items.length > 0 && pathData.items.map((item) => (
                <FilePickerItemComponent
                  item={item}
                  selected={selectedElements.includes(item.id)}
                  setSelectedState={(value) => setItemSelected(item.id, value)}
                  onClick={() => itemClick(item)}
                  showActions={showActions}
                  singleMode={singleMode}
                  attachmentMode={attachmentMode}
                  destinationMode={destinationMode}
                  compact={compact}
                  onFileUpload={onFileUpload}
                  hasUpload={hasUpload}
                  deleteItems={deleteItems}
                  moveItem={moveItem}
                  renameItem={renameItem}
                  downloadItems={downloadItems}
                />
              ))}
              {isSearch && searchItems.length > 0 && searchItems.map((item) => (
                <FilePickerItemComponent
                  item={item}
                  selected={selectedElements.includes(item.id)}
                  setSelectedState={(value) => setItemSelected(item.id, value)}
                  onClick={() => itemClick(item)}
                  showActions={showActions}
                  singleMode={singleMode}
                  attachmentMode={attachmentMode}
                  compact={compact}
                  onFileUpload={onFileUpload}
                  hasUpload={hasUpload}
                  deleteItems={deleteItems}
                  moveItem={moveItem}
                  renameItem={renameItem}
                  downloadItems={downloadItems}
                />
              ))}
              {(!isSearch && pathData.items.length === 0 && !isLoading) || (isSearch && !isLoading && searchItems.length === 0) && (
                <div className='col-span-full p-2 flex justify-center text-sm text-gray-400'>
                  <Translator path="evoyaFiles.common.no_entries" />
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
      {(selectedElements.length > 0 || attachmentMode) && !destinationMode && !singleMode && !compact && (
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
        <DialogContent container={window.cl_files_shadowRootElement} className="z-[9999]">
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
