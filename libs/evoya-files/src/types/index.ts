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

export type PathItem = {
  name: string;
  path?: string;
  canOpen: boolean;
}

// export type FilePickerItem = {
//   type: 'file' | 'dir';
//   item: EvoyaFile | EvoyaDirectory;
// };