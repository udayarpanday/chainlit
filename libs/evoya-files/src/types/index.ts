import { EvoyaDirectory } from './directory';
import { EvoyaFile } from './file';

export * from './file';
export * from './directory';

export type FilePickerItemBase = EvoyaFile | EvoyaDirectory;
export type FilePickerItem = FilePickerItemBase & { id: string };

export type FilePickerData = {
  path: PathItem[];
  items: FilePickerItem[];
}

type WithTransportDates<T> = T extends unknown
  ? Omit<T, 'created' | 'modified'> & {
      created: string | null;
      modified: string | null;
    }
  : never;

export type FileListItemDto = WithTransportDates<FilePickerItemBase>;

export type FilesApiResponse = {
  success: boolean;
  folders: FileListItemDto[];
  documents: FileListItemDto[];
  recent_files?: unknown;
  breadcrumbs: PathItem[];
  searchTruncated?: boolean;
  error?: string;
};

export type ShortcutApiResponse = {
  success: boolean;
  shortcut: import('./file').ShortcutKey;
  items: import('./file').ShortcutItemDto[];
  nextCursor: string | null;
  breadcrumbs: PathItem[];
  error?: string;
};

export type PathItem = {
  name: string;
  path?: string;
  canOpen: boolean;
}

// export type FilePickerItem = {
//   type: 'file' | 'dir';
//   item: EvoyaFile | EvoyaDirectory;
// };
