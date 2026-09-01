import type { FormEvent, MouseEvent } from 'react';
import { useContext, useId, useRef, useState } from 'react';
import {
  Download,
  EllipsisVertical,
  FilePen,
  FolderInput,
  Pencil,
  Trash2
} from 'lucide-react';

import { Translator } from '@chainlit/app/src/components/i18n';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@chainlit/app/src/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@chainlit/app/src/components/ui/dropdown-menu';
import { Input } from '@chainlit/app/src/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';

import { FilePickerContext } from '../context/file-context';
import type { FilePickerItem } from '../types';
import { canMutateFileItem } from '../utils/files-api';
import FilePicker from './FilePicker';

export type FileItemActionsMode = 'standard-row' | 'menu-only';

type Props = {
  item: FilePickerItem;
  mode: FileItemActionsMode;
  deleteItems: (items: FilePickerItem[]) => Promise<void>;
  moveItem: (item: FilePickerItem, destination: string) => Promise<void>;
  renameItem: (item: FilePickerItem, newName: string) => Promise<void>;
  downloadItems: (items: FilePickerItem[]) => void;
};

export default function FileItemActions({
  item,
  mode,
  deleteItems,
  moveItem,
  renameItem,
  downloadItems
}: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [folderPickerPath, setFolderPickerPath] = useState('');
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveDestination, setMoveDestination] = useState<FilePickerItem[]>([]);
  const { brandColor } = useContext(FilePickerContext);
  const { t } = useTranslation();
  const renameInputRef = useRef<HTMLInputElement>(null);
  const formId = useId().replace(/:/g, '');
  const isFile = 'size' in item;
  const mime = isFile ? item.mime : '';
  const canMutate = canMutateFileItem(item);

  const stopPropagation = (event: MouseEvent) => event.stopPropagation();

  const openCreator = () => {
    // @ts-expect-error Added by the host application.
    window.openEvoyaCreatorWithFile(item, {
      type: mime.indexOf('markdown') > -1 ? 'markdown' : 'text',
      brand_color: brandColor
    });
  };

  const renameItemHandler = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRenameOpen(false);
    void renameItem(item, renameValue);
  };

  const moveItemHandler = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMoveOpen(false);
    const destination = moveDestination[0]?.path || folderPickerPath;
    if (destination) void moveItem(item, destination);
  };

  const startRename = () => {
    setRenameValue(item.name);
    setRenameOpen(true);
  };

  const mutableMenuItems = canMutate && (
    <>
      {mode === 'standard-row' && mime.includes('markdown') && (
        <DropdownMenuItem onClick={openCreator}>
          <FilePen />
          <Translator path="components.molecules.evoyaCreatorButton.label" />
        </DropdownMenuItem>
      )}
      {mode === 'menu-only' && (
        <DropdownMenuItem onClick={startRename}>
          <Pencil />
          <Translator path="evoyaFiles.actions.rename.label" />
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onClick={() => setMoveOpen(true)}>
        <FolderInput />
        <Translator path="evoyaFiles.actions.move.label" />
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => setDeleteOpen(true)}
        className="text-destructive hover:!text-destructive hover:!bg-destructive/10"
      >
        <Trash2 />
        <Translator path="evoyaFiles.actions.delete.label" />
      </DropdownMenuItem>
    </>
  );

  return (
    <div className="flex items-center justify-end gap-1" onClick={stopPropagation}>
      {mode === 'standard-row' && (
        <>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 -my-2 rounded-full text-gray-400"
                  onClick={() => downloadItems([item])}
                  aria-label={t('evoyaFiles.actions.download.label')}
                >
                  <Download />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p><Translator path="evoyaFiles.actions.download.label" /></p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {canMutate && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 -my-2 rounded-full text-gray-400"
                    onClick={startRename}
                    aria-label={t('evoyaFiles.actions.rename.label')}
                  >
                    <Pencil />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p><Translator path="evoyaFiles.actions.rename.label" /></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </>
      )}

      {(mode === 'menu-only' || canMutate) && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 -my-2 rounded-full text-gray-400"
              aria-label={t('evoyaFiles.actions.menu.label')}
            >
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            container={window.cl_files_shadowRootElement}
            align="end"
            onClick={stopPropagation}
          >
            {mode === 'menu-only' && (
              <DropdownMenuItem onClick={() => downloadItems([item])}>
                <Download />
                <Translator path="evoyaFiles.actions.download.label" />
              </DropdownMenuItem>
            )}
            {mutableMenuItems}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {canMutate && (
        <>
          <Dialog open={moveOpen} onOpenChange={setMoveOpen}>
            <DialogContent
              container={window.cl_files_shadowRootElement}
              className="z-[9999] max-w-screen-sm"
              onClick={stopPropagation}
            >
              <DialogHeader>
                <DialogTitle>
                  <Translator path={isFile ? 'evoyaFiles.actions.move.title' : 'evoyaFiles.actions.move_folder.title'} />
                </DialogTitle>
                <DialogDescription>
                  <Translator path={isFile ? 'evoyaFiles.actions.move.description' : 'evoyaFiles.actions.move_folder.description'} />
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={moveItemHandler} id={`move-file-form-${formId}`}>
                <FilePicker
                  initialPath="/"
                  selectedItemsChange={setMoveDestination}
                  setSelectedPath={setFolderPickerPath}
                  destinationMode
                />
              </form>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setMoveOpen(false)}>
                  <Translator path="common.actions.cancel" />
                </Button>
                <Button type="submit" form={`move-file-form-${formId}`}>
                  <Translator path="common.actions.confirm" />
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
            <DialogContent
              container={window.cl_files_shadowRootElement}
              className="z-[9999]"
              onClick={stopPropagation}
              onOpenAutoFocus={() =>
                setTimeout(() => renameInputRef.current?.focus(), 200)
              }
            >
              <DialogHeader>
                <DialogTitle>
                  <Translator path={isFile ? 'evoyaFiles.actions.rename.title' : 'evoyaFiles.actions.rename_folder.title'} />
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={renameItemHandler} id={`rename-file-form-${formId}`}>
                <Input
                  value={renameValue}
                  ref={renameInputRef}
                  onChange={(event) => setRenameValue(event.target.value)}
                  placeholder={t('evoyaFiles.actions.rename.description')}
                  autoFocus
                />
              </form>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setRenameOpen(false)}>
                  <Translator path="common.actions.cancel" />
                </Button>
                <Button type="submit" form={`rename-file-form-${formId}`}>
                  <Translator path="common.actions.confirm" />
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent
              container={window.cl_files_shadowRootElement}
              className="z-[9999]"
              onClick={stopPropagation}
            >
              <DialogHeader>
                <DialogTitle>
                  <Translator path={isFile ? 'evoyaFiles.actions.delete.title' : 'evoyaFiles.actions.delete_folder.title'} />
                </DialogTitle>
                <DialogDescription>
                  <Translator path={isFile ? 'evoyaFiles.actions.delete.description' : 'evoyaFiles.actions.delete_folder.description'} />
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
                  <Translator path="common.actions.cancel" />
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteOpen(false);
                    void deleteItems([item]);
                  }}
                >
                  <Translator path="common.actions.confirm" />
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
