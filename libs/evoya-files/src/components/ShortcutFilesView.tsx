import { LoaderCircle } from 'lucide-react';
import type { KeyboardEvent, SyntheticEvent } from 'react';

import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';

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
    <section className="relative flex min-h-24 flex-col overflow-hidden rounded-lg border bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[680px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-400">
              <th className="px-4 py-3 font-semibold"><Translator path="evoyaFiles.headers.name" /></th>
              <th className="px-4 py-3 font-semibold"><Translator path="evoyaFiles.headers.owner" /></th>
              <th className="px-4 py-3 font-semibold"><Translator path="evoyaFiles.headers.modified" /></th>
              <th className="px-4 py-3 font-semibold"><Translator path="evoyaFiles.headers.size" /></th>
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
                      <span className="ml-2 max-w-[320px] truncate">{item.name}</span>
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
                            moveItem={(_, destination) => onMove(item, destination)}
                            deleteItems={() => onDelete(item)}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.owner}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                    <span className="block">{date ? getDateDisplay(date) : '--'}</span>
                    {item.lastActivityType && item.lastActivityBy && (
                      <span className="block text-xs text-gray-400">
                        <Translator path={`evoyaFiles.activity.${item.lastActivityType}`} />{' '}
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
          <Button type="button" variant="outline" disabled={isLoading} onClick={onLoadMore}>
            <Translator path="evoyaFiles.common.load_more" />
          </Button>
        </div>
      )}
    </section>
  );
}
