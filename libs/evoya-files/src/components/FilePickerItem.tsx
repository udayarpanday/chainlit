import type { ReactNode } from 'react';
import { File, FileBraces, FileImage, FileText, FolderOpen } from 'lucide-react';

import { Checkbox } from '@chainlit/app/src/components/ui/checkbox';
import { useUpload } from '@chainlit/app/src/hooks/useUpload';
import { cn } from '@chainlit/app/src/lib/utils';

import type { FilePickerItem } from '../types';
import { getDateDisplay, getSizeDisplay } from '../utils/file';
import FileItemActions from './FileItemActions';

export type PickerCheckedState = boolean | 'indeterminate';

type Props = {
  item: FilePickerItem;
  selected: PickerCheckedState;
  setSelectedState: (value: boolean) => void;
  onClick?: () => void;
  showActions?: boolean;
  hasUpload?: boolean;
  singleMode?: boolean;
  attachmentMode?: boolean;
  destinationMode?: boolean;
  compact?: boolean;
  onFileUpload?: (files: File[], forcePath?: string) => void;
  deleteItems?: (items: FilePickerItem[]) => Promise<void>;
  moveItem?: (item: FilePickerItem, destination: string) => Promise<void>;
  renameItem?: (item: FilePickerItem, newName: string) => Promise<void>;
  downloadItems?: (items: FilePickerItem[]) => void;
};

export const getItemIcon = (item: FilePickerItem): ReactNode => {
  if (!('size' in item)) return <FolderOpen className="h-4 shrink-0" />;

  const extension = item.name.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'png':
    case 'jpg':
    case 'jpeg':
      return <FileImage className="h-4 shrink-0" />;
    case 'pdf':
    case 'txt':
    case 'md':
      return <FileText className="h-4 shrink-0" />;
    case 'json':
      return <FileBraces className="h-4 shrink-0" />;
    default:
      return <File className="h-4 shrink-0" />;
  }
};

export default function FilePickerItemComponent({
  item,
  selected = false,
  showActions = false,
  setSelectedState,
  onClick = () => {},
  hasUpload = false,
  singleMode = false,
  attachmentMode = false,
  destinationMode = false,
  compact = false,
  onFileUpload = () => {},
  deleteItems = async () => {},
  moveItem = async () => {},
  renameItem = async () => {},
  downloadItems = () => {}
}: Props) {
  const isFile = 'size' in item;
  const upload = useUpload({
    spec: { max_size_mb: 500, max_files: 20, accept: ['*/*'] },
    onResolved: (payloads: File[]) =>
      hasUpload && onFileUpload(payloads, item.path),
    onError: () => {},
    options: {
      noDrag: false,
      noClick: true,
      noDragEventsBubbling: true,
      multiple: true
    }
  });
  const { getRootProps, getInputProps, isDragActive } = upload ?? {};

  const clickItem = () => {
    onClick();
    if (isFile && !showActions) setSelectedState(selected !== true);
  };

  const rowCellClass =
    'p-2 border-t flex items-center group-has-[>div:hover]:bg-gray-100 group-has-[.drag-over]:bg-primary/20';

  return (
    <div
      className="contents text-sm group"
      {...(!isFile && hasUpload ? getRootProps() : {})}
    >
      {!isFile && hasUpload && <input {...getInputProps()} />}
      {!singleMode && (
        <div className={rowCellClass}>
          {!(!isFile && attachmentMode) && (
            <Checkbox
              checked={selected}
              onCheckedChange={(value) => setSelectedState(value === true)}
            />
          )}
        </div>
      )}
      <div
        className={cn(
          rowCellClass,
          'cursor-pointer overflow-hidden',
          isDragActive && hasUpload ? 'drag-over' : ''
        )}
        onClick={clickItem}
      >
        {getItemIcon(item)}
        <span className="ml-1 overflow-hidden overflow-ellipsis whitespace-nowrap">
          {item.name}
        </span>
      </div>
      {!compact && !attachmentMode && !destinationMode && (
        <>
          <div className={cn(rowCellClass, 'text-gray-400 hidden md:block')} onClick={clickItem}>
            {item.owner}
          </div>
          <div className={cn(rowCellClass, 'text-gray-400 hidden md:block')} onClick={clickItem}>
            {item.modified ? getDateDisplay(item.modified) : ''}
          </div>
          <div className={cn(rowCellClass, 'text-gray-400 hidden md:block')} onClick={clickItem}>
            {'size' in item ? getSizeDisplay(item.size) : '--'}
          </div>
        </>
      )}
      {showActions && (
        <div className={cn(rowCellClass, 'justify-end')}>
          <FileItemActions
            item={item}
            mode="standard-row"
            deleteItems={deleteItems}
            moveItem={moveItem}
            renameItem={renameItem}
            downloadItems={downloadItems}
          />
        </div>
      )}
    </div>
  );
}
