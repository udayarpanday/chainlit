import type { FilePickerItem } from '@/types';
import {
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
  PencilLine,
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

type Props = {
  item: FilePickerItem;
  isSelectable?: boolean;
  selected: boolean;
  setSelectedState: (value: boolean) => void;
  onClick?: () => void;
  showActions?: boolean;
  hasUpload?: boolean;
  singleMode?: boolean;
  compact?: boolean;
  onFileUpload?: (file: File) => void;
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
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDestination, setMoveDestination] = useState<FilePickerItem[]>([]);
  const { t } = useTranslation();

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

  const openCreator = () => {
    // @ts-expect-error is not a valid prop
    window.openEvoyaCreatorWithFile(item, { type: item.mime.indexOf('markdown') > -1 ? 'markdown' : 'text' });
  }

  const renameItemHandler = () => {
    setRenameOpen(false);
    renameItem(item, renameValue)
  }
  const moveItemHandler = () => {
    setMoveOpen(false);
    moveItem(item, moveDestination[0].path)
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
    onResolved: (payloads: File[]) => hasUpload && onFileUpload(payloads[0]),
    onError: onFileUploadError,
    options: { noDrag: false, noClick: true, noDragEventsBubbling: true, }
  });
  const { getRootProps, getInputProps, isDragActive } = upload ?? {};

  return (
    <div className="contents text-sm group" {...(!isFile && hasUpload ? getRootProps() : {})}>
      {!isFile && hasUpload && <input {...getInputProps()} />}
      {!singleMode &&
        <div className="p-2 border-t flex items-center group-has-[>div:hover]:bg-gray-100 group-has-[.drag-over]:bg-primary/20">
          <Checkbox checked={selected} onCheckedChange={(val: boolean) => setSelectedState(val)} />
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
              {(item.mime ?? '').includes('markdown') && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 -my-2 rounded-full text-gray-400"
                        onClick={openCreator}
                      >
                        <PencilLine />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        <Translator path="components.molecules.evoyaCreatorButton.label" />
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
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
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {setRenameOpen(true); setRenameValue(item.name)}}>
                    <Pencil />
                    <Translator path="evoyaFiles.actions.rename.label" />
                  </DropdownMenuItem>
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
                <DialogContent className="z-[9999] max-w-screen-sm">
                  <DialogHeader>
                    <DialogTitle>
                      {isFile ? <Translator path="evoyaFiles.actions.move.title" /> : <Translator path="evoyaFiles.actions.move_folder.title" />}
                    </DialogTitle>
                    <DialogDescription>
                      {isFile ? <Translator path="evoyaFiles.actions.move.description" /> : <Translator path="evoyaFiles.actions.move_folder.description" />}
                    </DialogDescription>
                  </DialogHeader>
                  <div>
                    <FilePicker 
                      initialPath='/'
                      selectedItemsChange={setMoveDestination}
                      destinationMode
                    />
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setMoveOpen(false)}>
                      <Translator path="common.actions.cancel" />
                    </Button>
                    <Button onClick={moveItemHandler}>
                      <Translator path="common.actions.confirm" />
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog
                open={renameOpen}
                onOpenChange={setRenameOpen}
              >
                <DialogContent className="z-[9999]">
                  <DialogHeader>
                    <DialogTitle>
                      {isFile ? <Translator path="evoyaFiles.actions.rename.title" /> : <Translator path="evoyaFiles.actions.rename_folder.title" />}
                    </DialogTitle>
                  </DialogHeader>
                  <div>
                    <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder={t('evoyaFiles.actions.rename.description')} />
                  </div>
                  <DialogFooter>
                    <Button variant="secondary" onClick={() => setRenameOpen(false)}>
                      <Translator path="common.actions.cancel" />
                    </Button>
                    <Button onClick={renameItemHandler}>
                      <Translator path="common.actions.confirm" />
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Dialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
              >
                <DialogContent className="z-[9999]">
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