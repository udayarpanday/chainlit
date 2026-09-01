export const buildFilesUrl = (
  apiBaseUrl: string,
  path: string,
  search?: string
) => {
  const params = new URLSearchParams({ path });
  if (search !== undefined) params.set('search', search.trim());
  return `${apiBaseUrl}/api/files/?${params.toString()}`;
};

export const buildShortcutUrl = (
  apiBaseUrl: string,
  shortcut: string,
  cursor?: string | null
) => {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  const query = params.toString();
  return `${apiBaseUrl}/api/files/shortcuts/${shortcut}/${query ? `?${query}` : ''}`;
};

export const SHORTCUT_KEYS = ['generated', 'images', 'projects'] as const;

export const isShortcutKey = (
  value?: string | null
): value is (typeof SHORTCUT_KEYS)[number] =>
  SHORTCUT_KEYS.includes(value as (typeof SHORTCUT_KEYS)[number]);

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
