import type { FilePickerItem } from '@/types';
import {
  useContext,
  useRef,
  useState,
} from 'react';

import {
  FolderOpen,
  FileText,
  FileBraces,
  File,
  EllipsisVertical,
  Download,
  Pencil,
  FolderInput,
  Trash2,
  FileImage,
  FilePen,
} from 'lucide-react';

import { cn } from '@chainlit/app/src/lib/utils';

import { Checkbox } from '@chainlit/app/src/components/ui/checkbox';
import { getSizeDisplay, getDateDisplay } from '../utils/file';

import { Button } from '@chainlit/app/src/components/ui/button';
import { Input } from '@chainlit/app/src/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@chainlit/app/src/components/ui/dropdown-menu';
import { Translator } from '@chainlit/app/src/components/i18n';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@chainlit/app/src/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';

import { useUpload } from '@chainlit/app/src/hooks/useUpload';
import FilePicker from './FilePicker';
import { FilePickerContext } from '../context/file-context';

type Props = {
  item: FilePickerItem;
  isSelectable?: boolean;
  selected: boolean;
  setSelectedState: (value: boolean) => void;
  onClick?: () => void;
  showActions?: boolean;
  hasUpload?: boolean;
  singleMode?: boolean;
  attachmentMode?: boolean;
  compact?: boolean;
  onFileUpload?: (files: File[], forcePath?: string) => void;
  deleteItems?: (items: FilePickerItem[]) => Promise<void>;
  moveItem?: (item: FilePickerItem, destination: string) => Promise<void>;
  renameItem?: (item: FilePickerItem, newName: string) => Promise<void>;
  downloadItems?: (items: FilePickerItem[]) => void;
}

export default function FilePickerItem({
  item,
  selected = false,
  showActions = false,
  setSelectedState,
  onClick = () => {},
  hasUpload = false,
  singleMode = false,
  attachmentMode = false,
  compact = false,
  onFileUpload = () => {},
  deleteItems = async () => {},
  moveItem = async () => {},
  renameItem = async () => {},
  downloadItems = async () => {},
}: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [folderPickerPath, setFolderPickerPath] = useState('');
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDestination, setMoveDestination] = useState<FilePickerItem[]>([]);
  const { t } = useTranslation();
  const renameInputRef = useRef<HTMLInputElement>(null)

  const isFile = "size" in item;

  const getItemIcon = (item: FilePickerItem) => {
    if ("size" in item) {
      const fileNameArray = item.name.split('.');
      const extension = fileNameArray[fileNameArray.length - 1];

      switch (extension.toLowerCase()) {
        case 'png':
        case 'jpg':
        case 'jpeg':
          return <FileImage className="h-4 shrink-0" />
        case 'pdf':
        case 'txt':
        case 'md':
          return <FileText className="h-4 shrink-0" />;
        case 'json':
          return <FileBraces className="h-4 shrink-0" />
        default:
          return <File className="h-4 shrink-0" />
      }
    }
    return <FolderOpen className="h-4 shrink-0" />
  }

  const { brandColor } = useContext(FilePickerContext);

  const openCreator = () => {
    // @ts-expect-error is not a valid prop
    window.openEvoyaCreatorWithFile(item, { type: item.mime.indexOf('markdown') > -1 ? 'markdown' : 'text', brand_color: brandColor });
  }

  const renameItemHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRenameOpen(false);
    renameItem(item, renameValue)
  }
  const moveItemHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMoveOpen(false);
    if (moveDestination.length > 0) {
      moveItem(item, moveDestination[0].path);
    } else {
      moveItem(item, folderPickerPath)
    }
  }

  const deleteItemHandler = () => {
    setDeleteOpen(false);
    deleteItems([item])
  }

  const clickItem = () => {
    onClick();
    if (isFile && !showActions) {
      setSelectedState(!selected);
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
    onResolved: (payloads: File[]) => hasUpload && onFileUpload(payloads, item.path),
    onError: onFileUploadError,
    options: { noDrag: false, noClick: true, noDragEventsBubbling: true, multiple: true }
  });
  const { getRootProps, getInputProps, isDragActive } = upload ?? {};

  return (
    <div className="contents text-sm group" {...(!isFile && hasUpload ? getRootProps() : {})}>
      {!isFile && hasUpload && <input {...getInputProps()} />}
      {!singleMode &&
        <div className="p-2 border-t flex items-center group-has-[>div:hover]:bg-gray-100 group-has-[.drag-over]:bg-primary/20">
          {!(!isFile && attachmentMode) && <Checkbox checked={selected} onCheckedChange={(val: boolean) => setSelectedState(val)} />}
        </div>
      }
      <div
        className={cn(
          "p-2 border-t flex items-center group-has-[>div:hover]:bg-gray-100 group-has-[.drag-over]:bg-primary/20 cursor-pointer overflow-hidden",
          isDragActive && hasUpload ? 'drag-over' : '',
        )}
        onClick={clickItem}
      >
        {getItemIcon(item)}
        <span className="ml-1 overflow-hidden overflow-ellipsis whitespace-nowrap">{item.name}</span>
      </div>
      {!compact && (
        <>
          <div className="p-2 border-t flex items-center text-gray-400 group-has-[>div:hover]:bg-gray-100 group-has-[.drag-over]:bg-primary/20" onClick={clickItem}>{item.owner}</div>
          <div className="p-2 border-t flex items-center text-gray-400 group-has-[>div:hover]:bg-gray-100 group-has-[.drag-over]:bg-primary/20" onClick={clickItem}>{item.modified ? getDateDisplay(item.modified) : ''}</div>
          <div className="p-2 border-t flex items-center text-gray-400 group-has-[>div:hover]:bg-gray-100 group-has-[.drag-over]:bg-primary/20" onClick={clickItem}>{"size" in item ? getSizeDisplay(item.size) : '--'}</div>
        </>
      )}
      {showActions && (
        <div className="p-2 border-t flex items-center justify-end gap-1 group-has-[>div:hover]:bg-gray-100 group-has-[.drag-over]:bg-primary/20">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 -my-2 rounded-full text-gray-400"
                  onClick={() => downloadItems([item])}
                >
                  <Download />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  <Translator path="evoyaFiles.actions.download.label" />
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {item.showActions && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 -my-2 rounded-full text-gray-400"
                      onClick={() => {setRenameOpen(true); setRenameValue(item.name)}}
                    >
                      <Pencil />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      <Translator path="evoyaFiles.actions.rename.label" />
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 -my-2 rounded-full text-gray-400"
                  >
                    <EllipsisVertical />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent container={window.cl_files_shadowRootElement} align="end">
                  {(item.mime ?? '').includes('markdown') && (
                    <DropdownMenuItem onClick={openCreator}>
                      <FilePen />
                      <Translator path="components.molecules.evoyaCreatorButton.label" />
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setMoveOpen(true)}>
                    <FolderInput />
                    <Translator path="evoyaFiles.actions.move.label" />
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive hover:!text-destructive hover:!bg-destructive/10">
                    <Trash2 />
                    <Translator path="evoyaFiles.actions.delete.label" />
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Dialog
                open={moveOpen}
                onOpenChange={setMoveOpen}
              >
                <DialogContent container={window.cl_files_shadowRootElement} className="z-[9999] max-w-screen-sm">
                  <DialogHeader>
                    <DialogTitle>
                      {isFile ? <Translator path="evoyaFiles.actions.move.title" /> : <Translator path="evoyaFiles.actions.move_folder.title" />}
                    </DialogTitle>
                    <DialogDescription>
                      {isFile ? <Translator path="evoyaFiles.actions.move.description" /> : <Translator path="evoyaFiles.actions.move_folder.description" />}
                    </DialogDescription>
                  </DialogHeader>
                  <div>
                    <form onSubmit={moveItemHandler} id="move-file-form">
                      <FilePicker 
                        initialPath='/'
                        selectedItemsChange={setMoveDestination}
                        setSelectedPath={setFolderPickerPath}
                        destinationMode
                      />
                    </form>
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setMoveOpen(false)}>
                      <Translator path="common.actions.cancel" />
                    </Button>
                    <Button type="submit" form="move-file-form">
                      <Translator path="common.actions.confirm" />
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog
                open={renameOpen}
                onOpenChange={setRenameOpen}
              >
                <DialogContent container={window.cl_files_shadowRootElement} className="z-[9999]" onOpenAutoFocus={() => setTimeout(() => renameInputRef.current?.focus(), 200)}>
                  <DialogHeader>
                    <DialogTitle>
                      {isFile ? <Translator path="evoyaFiles.actions.rename.title" /> : <Translator path="evoyaFiles.actions.rename_folder.title" />}
                    </DialogTitle>
                  </DialogHeader>
                  <div>
                    <form onSubmit={renameItemHandler} id="rename-file-form">
                      <Input value={renameValue} ref={renameInputRef} onChange={(e) => setRenameValue(e.target.value)} placeholder={t('evoyaFiles.actions.rename.description')} autoFocus />
                    </form>
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setRenameOpen(false)}>
                      <Translator path="common.actions.cancel" />
                    </Button>
                    <Button type="submit" form="rename-file-form">
                      <Translator path="common.actions.confirm" />
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
              >
                <DialogContent container={window.cl_files_shadowRootElement} className="z-[9999]">
                  <DialogHeader>
                    <DialogTitle>
                      {isFile ? <Translator path="evoyaFiles.actions.delete.title" /> : <Translator path="evoyaFiles.actions.delete_folder.title" />}
                    </DialogTitle>
                    <DialogDescription>
                      {isFile ? <Translator path="evoyaFiles.actions.delete.description" /> : <Translator path="evoyaFiles.actions.delete_folder.description" />}
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
                      <Translator path="common.actions.cancel" />
                    </Button>
                    <Button variant="destructive" onClick={deleteItemHandler}>
                      <Translator path="common.actions.confirm" />
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      )}
    </div>
  );
}
