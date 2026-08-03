import type { KeyboardEvent, MouseEvent } from 'react';
import { Folder, LoaderCircle, PackageOpen } from 'lucide-react';

import { Translator } from '@chainlit/app/src/components/i18n';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { Button } from '@chainlit/app/src/components/ui/button';

import type { FilePickerItem, RecentFile } from '../types';
import { getDateDisplay } from '../utils/file';
import FileItemActions from './FileItemActions';
import { getItemIcon } from './FilePickerItem';

type Props = {
  files: RecentFile[];
  isLoading?: boolean;
  onOpenFile: (file: RecentFile) => void;
  onOpenLocation: (path: string) => void;
  onDownload: (file: RecentFile) => void;
  onRename: (file: RecentFile, newName: string) => Promise<void>;
  onMove: (file: RecentFile, destination: string) => Promise<void>;
  onDelete: (file: RecentFile) => Promise<void>;
};

export default function RecentFilesSection({
  files,
  isLoading = false,
  onOpenFile,
  onOpenLocation,
  onDownload,
  onRename,
  onMove,
  onDelete
}: Props) {
  const { t } = useTranslation();

  const activateRow = (event: KeyboardEvent<HTMLTableRowElement>, file: RecentFile) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpenFile(file);
    }
  };

  const openLocation = (event: MouseEvent, path: string) => {
    event.stopPropagation();
    if (path) onOpenLocation(path);
  };

  const getLocationLabel = (file: RecentFile) => {
    const location = file.locationName || file.location;
    return location.split('/').filter(Boolean)[0] || location;
  };

  return (
    <section className="mt-6 flex-shrink-0" aria-labelledby="recent-files-title">
      <h2 id="recent-files-title" className="mb-2 text-base font-semibold">
        <Translator path="evoyaFiles.common.recent_files" />
      </h2>
      <div className="overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-foreground">
              <th className="px-5 py-4 font-semibold text-gray-400"><Translator path="evoyaFiles.headers.name" /></th>
              <th className="px-5 py-4 font-semibold text-gray-400"><Translator path="evoyaFiles.headers.modified" /></th>
              <th className="px-5 py-4 font-semibold text-gray-400"><Translator path="evoyaFiles.headers.owner" /></th>
              <th className="px-5 py-4 font-semibold text-gray-400"><Translator path="evoyaFiles.headers.location" /></th>
              <th className="px-5 py-4 text-right font-semibold text-gray-400"><Translator path="evoyaFiles.headers.actions" /></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && files.length === 0 && (
              <tr>
                <td colSpan={5} className="border-t px-5 py-12">
                  <div className="flex flex-col items-center justify-center text-center text-gray-500">
                    <LoaderCircle className="h-8 w-8 animate-spin" aria-label="Loading" />
                  </div>
                </td>
              </tr>
            )}
            {!isLoading && files.length === 0 && (
              <tr>
                <td colSpan={5} className="border-t px-5 py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <PackageOpen className="mb-3 h-9 w-9 stroke-[1.75] text-foreground" aria-hidden="true" />
                    <p className="text-base text-foreground">
                      <Translator path="evoyaFiles.common.no_recent_files" />
                    </p>
                  </div>
                </td>
              </tr>
            )}
            {files.map((file) => (
              <tr
                key={file.id}
                tabIndex={0}
                className="cursor-pointer border-t hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                onClick={() => onOpenFile(file)}
                onKeyDown={(event) => activateRow(event, file)}
                aria-label={t('evoyaFiles.actions.open_recent_file.label', { name: file.name })}
              >
                <td className="px-5 py-4">
                  <span className="flex min-w-0 items-center">
                    {getItemIcon(file)}
                    <span className="ml-2 max-w-[280px] truncate">{file.name}</span>
                  </span>
                </td>
                <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                  {file.modified ? getDateDisplay(file.modified) : '—'}
                </td>
                <td className="px-5 py-4 text-gray-500">{file.owner}</td>
                <td className="px-5 py-4">
                  {file.location ? (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto max-w-[260px] justify-start gap-2 truncate p-0 text-left"
                      onClick={(event) => openLocation(event, file.location)}
                      title={file.locationName || file.location}
                      aria-label={t('evoyaFiles.actions.open_location.label', {
                        location: file.locationName || file.location
                      })}
                    >
                      <Folder className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{getLocationLabel(file)}</span>
                    </Button>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                  <FileItemActions
                    item={file as FilePickerItem}
                    mode="menu-only"
                    downloadItems={() => onDownload(file)}
                    renameItem={(_, newName) => onRename(file, newName)}
                    moveItem={(_, destination) => onMove(file, destination)}
                    deleteItems={() => onDelete(file)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
