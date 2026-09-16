import {
  Folder,
  Image as ImageIcon,
  LayoutGrid,
  LayoutList,
  LoaderCircle
} from 'lucide-react';
import type { KeyboardEvent, SyntheticEvent } from 'react';
import { useContext, useEffect, useState } from 'react';

import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';

import { FilePickerContext } from '../context/file-context';
import type { FilePickerItem, ShortcutItem, ShortcutKey } from '../types';
import { getDateDisplay, getSizeDisplay } from '../utils/file';
import FileItemActions from './FileItemActions';
import { getItemIcon } from './FilePickerItem';

type Props = {
  shortcut: ShortcutKey;
  items: ShortcutItem[];
  hasMore: boolean;
  isLoading: boolean;
  hasError: boolean;
  onOpen: (item: ShortcutItem) => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onDownload: (item: ShortcutItem) => void;
  onRename: (item: ShortcutItem, newName: string) => Promise<void>;
  onMove: (item: ShortcutItem, destination: string) => Promise<void>;
  onDelete: (item: ShortcutItem) => Promise<void>;
};

export type ImageViewMode = 'library' | 'list';

export function ImageViewToggle({
  value,
  onChange
}: {
  value: ImageViewMode;
  onChange: (value: ImageViewMode) => void;
}) {
  return (
    <div
      className="inline-flex items-center rounded-lg border bg-gray-50 p-0.5"
      role="group"
      aria-label="Image view"
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`h-7 w-7 rounded-md ${
          value === 'library'
            ? 'bg-white text-foreground shadow-sm hover:bg-white'
            : 'text-gray-400'
        }`}
        aria-label="Library view"
        title="Library view"
        aria-pressed={value === 'library'}
        onClick={() => onChange('library')}
      >
        <LayoutGrid aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={`h-7 w-7 rounded-md ${
          value === 'list'
            ? 'bg-white text-foreground shadow-sm hover:bg-white'
            : 'text-gray-400'
        }`}
        aria-label="List view"
        title="List view"
        aria-pressed={value === 'list'}
        onClick={() => onChange('list')}
      >
        <LayoutList aria-hidden="true" />
      </Button>
    </div>
  );
}

export function ImageLibraryItem({
  item,
  onOpen,
  onDownload,
  onRename,
  onMove,
  onDelete
}: Pick<Props, 'onOpen' | 'onDownload' | 'onRename' | 'onMove' | 'onDelete'> & {
  item: ShortcutItem;
}) {
  const { apiBaseUrl } = useContext(FilePickerContext);
  const [previewFailed, setPreviewFailed] = useState(false);
  const date = item.lastActivityAt || item.modified;
  const previewUrl =
    'size' in item && item.path
      ? `${apiBaseUrl}/api/files/download/?${new URLSearchParams({
          path: item.path,
          intent: 'preview'
        }).toString()}`
      : 'size' in item
        ? item.download_url
        : undefined;

  useEffect(() => setPreviewFailed(false), [previewUrl]);

  return (
    <article className="group relative min-w-0 overflow-hidden rounded-xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-within:ring-2 focus-within:ring-primary">
      <button
        type="button"
        className="block aspect-square w-full overflow-hidden bg-gray-100 focus-visible:outline-none"
        onClick={() => onOpen(item)}
        aria-label={item.name}
      >
        {previewUrl && !previewFailed ? (
          <img
            src={previewUrl}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            onError={() => setPreviewFailed(true)}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-gray-300">
            {'size' in item ? (
              <ImageIcon className="h-10 w-10" aria-hidden="true" />
            ) : (
              <Folder className="h-10 w-10" aria-hidden="true" />
            )}
          </span>
        )}
      </button>
      <div className="flex min-w-0 items-start gap-2 p-3">
        <button
          type="button"
          className="min-w-0 flex-1 text-left focus-visible:outline-none"
          onClick={() => onOpen(item)}
        >
          <span
            className="block truncate text-sm font-medium"
            title={item.name}
          >
            {item.name}
          </span>
          <span className="mt-1 block truncate text-xs text-gray-400">
            {date ? getDateDisplay(date) : item.owner}
            {'size' in item ? ` · ${getSizeDisplay(item.size)}` : ''}
          </span>
        </button>
        {'size' in item && (
          <FileItemActions
            item={item as FilePickerItem}
            mode="menu-only"
            downloadItems={() => onDownload(item)}
            renameItem={(_, name) => onRename(item, name)}
            moveItem={(_, destination) => onMove(item, destination)}
            deleteItems={() => onDelete(item)}
          />
        )}
      </div>
    </article>
  );
}

export default function ShortcutFilesView({
  shortcut,
  items,
  hasMore,
  isLoading,
  hasError,
  onOpen,
  onLoadMore,
  onRetry,
  onDownload,
  onRename,
  onMove,
  onDelete
}: Props) {
  const stopPropagation = (event: SyntheticEvent) => event.stopPropagation();
  const isImageLibrary = shortcut === 'images';
  const [imageView, setImageView] = useState<ImageViewMode>('library');

  const activateRow = (
    event: KeyboardEvent<HTMLTableRowElement>,
    item: ShortcutItem
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(item);
    }
  };

  return (
    <section className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-white">
      {isImageLibrary && (
        <div className="z-10 flex shrink-0 justify-end border-b bg-white p-2">
          <ImageViewToggle value={imageView} onChange={setImageView} />
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        {isImageLibrary && imageView === 'library' ? (
          <div className="grid content-start grid-cols-2 gap-3 p-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((item) => (
              <ImageLibraryItem
                key={item.id}
                item={item}
                onOpen={onOpen}
                onDownload={onDownload}
                onRename={onRename}
                onMove={onMove}
                onDelete={onDelete}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400">
                  <th className="px-4 py-3 font-semibold">
                    <Translator path="evoyaFiles.headers.name" />
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    <Translator path="evoyaFiles.headers.owner" />
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    <Translator path="evoyaFiles.headers.modified" />
                  </th>
                  <th className="px-4 py-3 font-semibold">
                    <Translator path="evoyaFiles.headers.size" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const date = item.lastActivityAt || item.modified;
                  return (
                    <tr
                      key={item.id}
                      tabIndex={0}
                      className="cursor-pointer border-t hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                      onClick={() => onOpen(item)}
                      onKeyDown={(event) => activateRow(event, item)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center">
                          {getItemIcon(item as FilePickerItem)}
                          <span className="ml-2 max-w-[320px] truncate">
                            {item.name}
                          </span>
                          {'size' in item && (
                            <div
                              className="ml-auto"
                              onClick={stopPropagation}
                              onKeyDown={stopPropagation}
                            >
                              <FileItemActions
                                item={item as FilePickerItem}
                                mode="menu-only"
                                downloadItems={() => onDownload(item)}
                                renameItem={(_, name) => onRename(item, name)}
                                moveItem={(_, destination) =>
                                  onMove(item, destination)
                                }
                                deleteItems={() => onDelete(item)}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{item.owner}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                        <span className="block">
                          {date ? getDateDisplay(date) : '--'}
                        </span>
                        {item.lastActivityType && item.lastActivityBy && (
                          <span className="block text-xs text-gray-400">
                            <Translator
                              path={`evoyaFiles.activity.${item.lastActivityType}`}
                            />{' '}
                            {item.lastActivityBy.name}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {'size' in item ? getSizeDisplay(item.size) : '--'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {isLoading && items.length === 0 && (
          <div className="flex border-t p-6 justify-center" role="status">
            <LoaderCircle className="animate-spin" />
          </div>
        )}
        {!isLoading && hasError && (
          <div className="border-t p-6 text-center text-sm" role="alert">
            <p className="text-destructive">
              <Translator path="evoyaFiles.common.load_error" />
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={onRetry}
            >
              <Translator path="common.actions.retry" />
            </Button>
          </div>
        )}
        {!isLoading && !hasError && items.length === 0 && (
          <div className="border-t p-6 text-center text-sm text-gray-400">
            <Translator path={`evoyaFiles.shortcuts.${shortcut}.empty`} />
          </div>
        )}
        {hasMore && !hasError && (
          <div className="border-t p-3 text-center">
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              onClick={onLoadMore}
            >
              <Translator path="evoyaFiles.common.load_more" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
