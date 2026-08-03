import { Download, LoaderCircle, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { useContext, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Translator } from '@chainlit/app/src/components/i18n';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { Button } from '@chainlit/app/src/components/ui/button';
import { Checkbox } from '@chainlit/app/src/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@chainlit/app/src/components/ui/dialog';
import { ScrollArea } from '@chainlit/app/src/components/ui/scroll-area';
import { useUpload } from '@chainlit/app/src/hooks/useUpload';
import { toast } from '@chainlit/app/src/lib/evoya-toast';
import { cn } from '@chainlit/app/src/lib/utils';

import { FilePickerContext } from '../context/file-context';
import type {
  EvoyaFile,
  FilesApiResponse,
  FilePickerData,
  FilePickerItem,
  PathItem,
  RecentFile,
  ShortcutApiResponse,
  ShortcutItem,
  ShortcutKey
} from '../types';
import { downloadBlob } from '../utils/file';
import {
  buildFilesUrl,
  buildShortcutUrl,
  isShortcutKey,
  shouldShowRecentFiles
} from '../utils/files-api';
import { normalizeRecentFiles } from '../utils/recent-files';
import { normalizeShortcutItems } from '../utils/shortcuts';
import FilePickerItemComponent, { PickerCheckedState } from './FilePickerItem';
import FileSearch from './FileSearch';
import FolderBreadcrumbs from './FolderBreadcrumbs';
import RecentFilesSection from './RecentFilesSection';
import ShortcutFilesView from './ShortcutFilesView';
import ShortcutsSection from './ShortcutsSection';
import Uploader from './Uploader';

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
  selectedItemPaths?: string[];
  onItemSelectionChange?: (item: FilePickerItem, checked: boolean) => void;
  searchTrailingAction?: ReactNode;
  initialView?: string;
  setSelectedView?: (view?: ShortcutKey) => void;
};

const selectionKey = (path: string) => path.replace(/^\/+|\/+$/g, '');

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
  selectedItemPaths,
  onItemSelectionChange,
  searchTrailingAction,
  initialView,
  setSelectedView = () => {}
}: Props) {
  const { apiBaseUrl, csrfToken, type: pickerType } = useContext(FilePickerContext);
  const { t } = useTranslation();
  const [currentPath, setCurrentPath] = useState(initialPath);
  const [pathData, setPathData] = useState<FilePickerData>({
    path: [],
    items: []
  });
  const [folderFiles, setFolderFiles] = useState<FilePickerItem[]>([]);
  const [searchItems, setSearchItems] = useState<FilePickerItem[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [activeShortcut, setActiveShortcut] = useState<ShortcutKey | null>(null);
  const [shortcutItems, setShortcutItems] = useState<ShortcutItem[]>([]);
  const [shortcutCursor, setShortcutCursor] = useState<string | null>(null);
  const [searchTruncated, setSearchTruncated] = useState(false);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [isSearch, setIsSearch] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const isSelectionControlled =
    selectedItemPaths !== undefined && onItemSelectionChange !== undefined;

  const fetchDirectory = async (path: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(buildFilesUrl(apiBaseUrl, path));
      if (!response.ok) throw new Error(`Files request failed (${response.status})`);

      const json = (await response.json()) as FilesApiResponse;
      if (!json.success) throw new Error(json.error || 'Files request failed');

      const documents = Array.isArray(json.documents) ? json.documents : [];
      const folders = Array.isArray(json.folders) ? json.folders : [];
      const normalizedDocuments = documents
        .filter((document) => 'size' in document)
        .map((document) => ({
          ...document,
          created: document.created ? new Date(document.created) : null,
          modified: document.modified ? new Date(document.modified) : null,
          id: uuidv4()
        })) as Array<FilePickerItem & EvoyaFile>;
      const nextFolderFiles = (destinationMode ? [] : normalizedDocuments)
        .filter(selectFilter);
      const nextPathItems = [
        { name: 'Home', path: '/', canOpen: true },
        ...(Array.isArray(json.breadcrumbs) ? json.breadcrumbs : [])
      ];

      setCurrentPath(path);
      setActiveShortcut(null);
      setShortcutItems([]);
      setShortcutCursor(null);
      setSelectedView(undefined);
      setSelectedPath(path);
      setIsSearch(false);
      setSearchItems([]);
      setSearchTruncated(false);
      if (!isSelectionControlled) {
        setSelectedElements([]);
        selectedItemsChange([]);
      }
      setFolderFiles(nextFolderFiles);
      setRecentFiles(normalizeRecentFiles(json.recent_files, uuidv4));
      setPathItems(nextPathItems);
      setPathData({
        path: nextPathItems,
        items: [
          ...folders.map((folder) => ({
            ...folder,
            created: folder.created ? new Date(folder.created) : null,
            modified: folder.modified ? new Date(folder.modified) : null,
            id: uuidv4()
          })),
          ...nextFolderFiles
        ] as FilePickerItem[]
      });
    } catch (error) {
      console.error(error);
      toast.error(t('evoyaFiles.common.load_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchShortcut = async (
    shortcut: ShortcutKey,
    cursor?: string | null,
    append = false
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch(buildShortcutUrl(apiBaseUrl, shortcut, cursor));
      if (!response.ok) throw new Error(`Shortcut request failed (${response.status})`);
      const json = (await response.json()) as ShortcutApiResponse;
      if (!json.success) throw new Error(json.error || 'Shortcut request failed');

      const items = normalizeShortcutItems(json.items);
      setShortcutItems((current) => append ? [...current, ...items] : items);
      setShortcutCursor(json.nextCursor || null);
      setPathData({
        path: Array.isArray(json.breadcrumbs) && json.breadcrumbs.length > 0
          ? json.breadcrumbs
          : [
              { name: 'Home', path: '/', canOpen: true },
              { name: t(`evoyaFiles.shortcuts.${shortcut}.title`), canOpen: false }
            ],
        items: []
      });
    } catch (error) {
      // The Phase 2 backend may not be deployed yet. Keep the UI usable and
      // show the shortcut's normal empty state instead of failing the page.
      console.info(error);
      if (!append) {
        setShortcutItems([]);
        setShortcutCursor(null);
        setPathData({
          path: [
            { name: 'Home', path: '/', canOpen: true },
            { name: t(`evoyaFiles.shortcuts.${shortcut}.title`), canOpen: false }
          ],
          items: []
        });
      }
    } finally {
      setCurrentPath('');
      setIsSearch(false);
      setActiveShortcut(shortcut);
      setSelectedView(shortcut);
      setIsLoading(false);
    }
  };

  const searchFilesHandler = async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        buildFilesUrl(apiBaseUrl, currentPath, trimmedQuery)
      );
      if (!response.ok) throw new Error(`Search request failed (${response.status})`);

      const json = (await response.json()) as FilesApiResponse;
      if (!json.success) throw new Error(json.error || 'Search request failed');

      const documents = Array.isArray(json.documents) ? json.documents : [];
      const folders = Array.isArray(json.folders) ? json.folders : [];
      const normalizedDocuments = documents
        .filter((document) => 'size' in document)
        .map((document) => ({
          ...document,
          created: document.created ? new Date(document.created) : null,
          modified: document.modified ? new Date(document.modified) : null,
          id: uuidv4()
        })) as Array<FilePickerItem & EvoyaFile>;
      const sFiles = (destinationMode ? [] : normalizedDocuments)
        .filter(selectFilter);
      const sFolders = folders.map((folder) => ({
        ...folder,
        created: folder.created ? new Date(folder.created) : null,
        modified: folder.modified ? new Date(folder.modified) : null,
        id: uuidv4()
      }));
      setSearchItems([...sFolders, ...sFiles] as FilePickerItem[]);
      setSearchTruncated(Boolean(json.searchTruncated));
      setIsSearch(true);
    } catch (err) {
      console.error(err);
      toast.error(t('evoyaFiles.common.search_error'));
    } finally {
      setIsLoading(false);
    }
  };

  const itemClick = (item: FilePickerItem) => {
    const isFile = 'size' in item;
    handleItemClick(item);
    if (!isFile) {
      fetchDirectory(item.path);
    }
  };

  const recentItemClick = (item: RecentFile) => {
    setPathItems([]);
    handleItemClick(item);
  };

  const shortcutItemClick = (item: ShortcutItem) => {
    if ('size' in item) {
      setPathItems([]);
      handleItemClick(item as FilePickerItem);
    } else {
      void fetchDirectory(item.path);
    }
  };

  useEffect(() => {
    if (isShortcutKey(initialView)) {
      void fetchShortcut(initialView);
    } else {
      if (initialView) setSelectedView(undefined);
      loadCurrentPath();
    }
  }, []);

  const loadCurrentPath = () => {
    if (activeShortcut) {
      return fetchShortcut(activeShortcut);
    }
    return fetchDirectory(currentPath);
  };

  const setItemSelected = (item: FilePickerItem, value: boolean) => {
    if (isSelectionControlled) {
      onItemSelectionChange(item, value);
      return;
    }

    const id = item.id;
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
    selectedItemsChange(
      pathData.items.filter((item) => newItems.includes(item.id))
    );
  };

  const onCheckedChange = (val: boolean) => {
    const items = isSelectionControlled
      ? isSearch
        ? searchItems
        : pathData.items
      : attachmentMode
      ? folderFiles
      : pathData.items;

    if (isSelectionControlled) {
      items.forEach((item) => onItemSelectionChange(item, val));
      return;
    }

    console.log(items);
    if (val) {
      setSelectedElements(items.map((item) => item.id));
      selectedItemsChange(items);
    } else {
      setSelectedElements([]);
      selectedItemsChange([]);
    }
  };

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
          'X-CSRFToken': csrfToken
        }
      });
      const json = await response.json();
      if (response.ok && json.success) {
        toast.success('File moved!');
        await loadCurrentPath();
      } else {
        toast.error('Failed to move file!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to move file!');
    } finally {
      setIsLoading(false);
    }
  };

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
          'X-CSRFToken': csrfToken
        }
      });
      const json = await response.json();
      if (response.ok && json.success) {
        toast.success('File renamed!');
        await loadCurrentPath();
      } else {
        toast.error('Failed to rename file!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to rename file!');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItemsHandler = () => {
    deleteItems(
      pathData.items.filter((item) => selectedElements.includes(item.id))
    );
  };

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
          'X-CSRFToken': csrfToken
        }
      });
      const json = await response.json();
      if (response.ok && json.success) {
        toast.success('Items deleted!');
        setDeleteOpen(false);
        await loadCurrentPath();
      } else {
        toast.error('Failed to delete items!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete items!');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadItems = (items: FilePickerItem[]) => {
    if (items.length === 1 && 'size' in items[0]) {
      const params = new URLSearchParams({
        path: items[0].path,
        intent: 'download'
      });
      fetch(`${apiBaseUrl}/api/files/download/?${params.toString()}`)
        .then((response) => response.blob())
        .then((blob) => {
          downloadBlob(blob, items[0].name);
        });
    } else {
      fetch(`${apiBaseUrl}/api/files/download/bulk/check/`, {
        method: 'POST',
        body: JSON.stringify({
          paths: items.map((item) => item.path)
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken
        }
      })
        .then((response) => response.json())
        .then((json) => {
          if (json.success) {
            fetch(`${apiBaseUrl}/api/files/download/bulk/`, {
              method: 'POST',
              body: JSON.stringify({
                paths: items.map((item) => item.path)
              }),
              headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken
              }
            })
              .then((response) => response.blob())
              .then((blob) => {
                downloadBlob(blob, items[0].name);
              });
          } else {
            toast.error(json.error);
          }
        })
        .catch((_error) => {
          toast.error('Download not possible');
        });
    }
  };

  const onFileUpload = async (files: File[], forcePath: string = '') => {
    console.log(files);
    try {
      const responses = await Promise.all(
        files.map((file) => onSingleFileUpload(file, forcePath))
      );
      console.log(responses);
      if (responses.every((resp) => resp.success)) {
        if (files.length > 1) {
          toast.success('Files uploaded!');
        } else {
          toast.success('File uploaded!');
        }
        loadCurrentPath();
      }
    } catch (_error) {
      if (files.length > 1) {
        toast.error('Failed to upload files!');
      } else {
        toast.error('Failed to upload file!');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const onSingleFileUpload = async (file: File, forcePath: string = '') => {
    setIsUploading(true);
    try {
      const filePathArr = (file.path ?? '')
        .split('/')
        .filter((item: string) => !!item);
      filePathArr.pop();
      const data = new FormData();
      data.append('file', file);
      data.append(
        'path',
        (forcePath ? forcePath : currentPath) +
          (filePathArr.length > 0 ? '/' + filePathArr.join('/') : '')
      );
      const response = await fetch(`${apiBaseUrl}/api/files/upload/`, {
        method: 'POST',
        body: data,
        headers: {
          'X-CSRFToken': csrfToken
        }
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
    } catch (err) {
      console.error(err);
      // toast.error('Failed to upload file!');
      throw err;
    } finally {
      // setIsUploading(false);
    }
  };

  const onFileUploadError = () => {};

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

  const selectableItems = isSelectionControlled
    ? isSearch
      ? searchItems
      : pathData.items
    : attachmentMode
    ? folderFiles
    : pathData.items;
  const selectableItemsLength = selectableItems.length;
  const selectedPathKeys = new Set((selectedItemPaths ?? []).map(selectionKey));
  const getControlledSelectionState = (
    item: FilePickerItem
  ): PickerCheckedState => {
    const itemKey = selectionKey(item.path);
    if (selectedPathKeys.has(itemKey)) {
      return true;
    }

    const isFolder = !('size' in item);
    if (
      isFolder &&
      [...selectedPathKeys].some((path) => path.startsWith(`${itemKey}/`))
    ) {
      return 'indeterminate';
    }

    return false;
  };
  const visibleControlledStates = isSelectionControlled
    ? selectableItems.map(getControlledSelectionState)
    : [];
  const allSelectableItemsSelected = isSelectionControlled
    ? selectableItemsLength > 0 &&
      visibleControlledStates.every((state) => state === true)
    : selectableItemsLength > 0 &&
      selectedElements.length === selectableItemsLength;
  const headerCheckedState: PickerCheckedState = isSelectionControlled
    ? allSelectableItemsSelected
      ? true
      : visibleControlledStates.some((state) => state !== false)
      ? 'indeterminate'
      : false
    : allSelectableItemsSelected;

  return (
    <>
      {showActions && hasUpload && !activeShortcut && (
        <Uploader
          setIsLoading={setIsLoading}
          isLoading={isLoading}
          onFileUpload={onFileUpload}
          currentPath={currentPath}
          loadCurrentPath={loadCurrentPath}
          isSearch={isSearch}
        />
      )}
      <div
        className={cn(
          'relative flex flex-col overflow-y-auto',
          compact ? 'max-h-[300px]' : 'h-full'
        )}
      >
        <div className="flex justify-between items-center mb-2 pt-2 overflow-hidden flex-shrink-0">
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
          {!compact && !activeShortcut && (
            <FileSearch
              isLoading={isLoading}
              searchFiles={searchFilesHandler}
              attachmentMode={attachmentMode}
              destinationMode={destinationMode}
              clearSearch={() => {
                setIsSearch(false);
                setSearchTruncated(false);
              }}
              singleMode={singleMode}
              trailingAction={searchTrailingAction}
            />
          )}
        </div>
        {!activeShortcut && (
        <div
          className={cn(
            'rounded-lg border min-h-24 relative overflow-hidden flex',
            isDragActive && hasUpload
              ? 'bg-primary/20 [.contents>div]:bg-primary/20!'
              : 'bg-white'
          )}
          {...(hasUpload ? getRootProps() : {})}
        >
          {hasUpload && <input {...getInputProps()} />}
          <ScrollArea className="w-full" type="auto">
            <div className="pb-2 px-4">
              {(isLoading || isUploading) && (
                <div className="absolute rounded-lg top-0 right-0 bottom-0 left-0 bg-white/50 flex items-center justify-center z-10">
                  <LoaderCircle className="animate-spin" />
                </div>
              )}
              <div
                className={cn(
                  'grid',
                  showActions
                    ? compact || attachmentMode || destinationMode
                      ? 'grid-cols-[auto_max-content]'
                      : 'grid-cols-[max-content_auto_max-content] md:grid-cols-[max-content_auto_max-content_max-content_max-content_max-content]'
                    : singleMode
                    ? compact || attachmentMode || destinationMode
                      ? 'grid-cols-[auto]'
                      : 'grid-cols-[auto] md:grid-cols-[auto_max-content_max-content_max-content]'
                    : compact || attachmentMode || destinationMode
                    ? 'grid-cols-[max-content_auto]'
                    : 'grid-cols-[max-content_auto] md:grid-cols-[max-content_auto_max-content_max-content_max-content]'
                )}
              >
                <div className="contents text-xs">
                  {!singleMode && (
                    <div className="flex items-center p-2 pt-4 sticky top-0 bg-white">
                      {multiselect && (
                        <Checkbox
                          checked={isLoading ? false : headerCheckedState}
                          disabled={selectableItemsLength === 0}
                          onCheckedChange={(value) =>
                            onCheckedChange(value === true)
                          }
                        />
                      )}
                    </div>
                  )}
                  <div className="p-2 pt-4 flex items-center text-gray-400 font-semibold sticky top-0 bg-white">
                    <Translator path="evoyaFiles.headers.name" />
                  </div>
                  {!compact && !attachmentMode && !destinationMode && (
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
                {!isSearch &&
                  pathData.items.length > 0 &&
                  pathData.items.map((item) => (
                    <FilePickerItemComponent
                      item={item}
                      selected={
                        isSelectionControlled
                          ? getControlledSelectionState(item)
                          : selectedElements.includes(item.id)
                      }
                      setSelectedState={(value) => setItemSelected(item, value)}
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
                {isSearch &&
                  searchItems.length > 0 &&
                  searchItems.map((item) => (
                    <FilePickerItemComponent
                      item={item}
                      selected={
                        isSelectionControlled
                          ? getControlledSelectionState(item)
                          : selectedElements.includes(item.id)
                      }
                      setSelectedState={(value) => setItemSelected(item, value)}
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
                {((!isSearch && pathData.items.length === 0 && !isLoading) ||
                  (isSearch && !isLoading && searchItems.length === 0)) && (
                    <div className="col-span-full p-2 flex justify-center text-sm text-gray-400">
                      <Translator path="evoyaFiles.common.no_entries" />
                    </div>
                  )}
                {isSearch && searchTruncated && !isLoading && (
                  <div className="col-span-full border-t p-2 text-center text-sm text-amber-700">
                    <Translator path="evoyaFiles.common.search_truncated" />
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
        )}
        {activeShortcut && (
          <ShortcutFilesView
            shortcut={activeShortcut}
            items={shortcutItems}
            nextCursor={shortcutCursor}
            isLoading={isLoading}
            onOpen={shortcutItemClick}
            onLoadMore={() => void fetchShortcut(activeShortcut, shortcutCursor, true)}
            onDownload={(item) => downloadItems([item as FilePickerItem])}
            onRename={(item, newName) => renameItem(item as FilePickerItem, newName)}
            onMove={(item, destination) => moveItem(item as FilePickerItem, destination)}
            onDelete={(item) => deleteItems([item as FilePickerItem])}
          />
        )}
        {/* {!activeShortcut && shouldShowRecentFiles({
          path: currentPath,
          isSearch,
          pickerType,
          compact,
          attachmentMode,
          destinationMode,
          singleMode
        }) && (
          <ShortcutsSection onOpen={(shortcut) => void fetchShortcut(shortcut)} />
        )} */}
        {shouldShowRecentFiles({
          path: currentPath,
          isSearch,
          pickerType,
          compact,
          attachmentMode,
          destinationMode,
          singleMode
        }) &&
          !activeShortcut &&
          (
            <RecentFilesSection
              files={recentFiles}
              isLoading={isLoading}
              onOpenFile={recentItemClick}
              onOpenLocation={fetchDirectory}
              onDownload={(file) => downloadItems([file])}
              onRename={(file, newName) => renameItem(file, newName)}
              onMove={(file, destination) => moveItem(file, destination)}
              onDelete={(file) => deleteItems([file])}
            />
          )}
        {!activeShortcut &&
          (selectedElements.length > 0 || attachmentMode) &&
          !destinationMode &&
          !singleMode &&
          !compact && (
            <div className="rounded-lg border bg-white flex justify-between items-center mt-4 pl-4 pr-1 py-1">
              <div className="text-sm">
                {selectedElements.length}{' '}
                <Translator path="evoyaFiles.common.selected" />
              </div>
              <div className="flex items-center gap-1">
                {showActions && (
                  <>
                    <Button
                      variant="ghost"
                      className="text-gray-400"
                      onClick={() =>
                        downloadItems(
                          pathData.items.filter((item) =>
                            selectedElements.includes(item.id)
                          )
                        )
                      }
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
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent
            container={window.cl_files_shadowRootElement}
            className="z-[9999]"
          >
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
