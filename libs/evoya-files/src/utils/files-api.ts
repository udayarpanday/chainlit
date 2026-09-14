import type { ShortcutKey } from '../types';

export const buildFilesUrl = (
  apiBaseUrl: string,
  path: string,
  search?: string
) => {
  const params = new URLSearchParams({ path });
  if (search !== undefined) params.set('search', search.trim());
  return `${apiBaseUrl}/api/files/?${params.toString()}`;
};

export const SHORTCUT_KEYS = ['generated', 'images', 'projects'] as const;

export const SHORTCUT_ENDPOINTS: Record<ShortcutKey, string> = {
  generated: 'generated',
  images: 'images',
  projects: 'projects'
};

export const buildShortcutUrl = (
  apiBaseUrl: string,
  shortcut: ShortcutKey,
  limit: number,
  offset: number,
  search?: string
) => {
  const endpoint = SHORTCUT_ENDPOINTS[shortcut];
  if (!endpoint) throw new Error('Invalid shortcut key');

  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset)
  });
  const trimmedSearch = search?.trim();
  if (trimmedSearch) params.set('search', trimmedSearch);

  return `${apiBaseUrl}/api/files/${endpoint}/?${params.toString()}`;
};

export const isShortcutKey = (
  value?: string | null
): value is ShortcutKey => SHORTCUT_KEYS.includes(value as ShortcutKey);

export const isRootPath = (path: string) =>
  path.replace(/^\/+|\/+$/g, '') === '';

export const canMutateFileItem = (item: {
  showActions: boolean;
  readOnly?: boolean;
}) => item.showActions && !item.readOnly;

type RecentFilesVisibility = {
  path: string;
  isSearch: boolean;
  pickerType: string;
  compact: boolean;
  attachmentMode: boolean;
  destinationMode: boolean;
  singleMode: boolean;
};

export const shouldShowRecentFiles = ({
  path,
  isSearch,
  pickerType,
  compact,
  attachmentMode,
  destinationMode,
  singleMode
}: RecentFilesVisibility) =>
  pickerType === 'default' &&
  isRootPath(path) &&
  !isSearch &&
  !compact &&
  !attachmentMode &&
  !destinationMode &&
  !singleMode;
