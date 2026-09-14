import type { ShortcutItem, ShortcutItemDto } from '../types';

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const nonEmptyString = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value : undefined;

export const getShortcutItemId = (
  item: Partial<ShortcutItemDto>
): string | undefined =>
  nonEmptyString(item.project_uuid) ??
  nonEmptyString(item.source_result_uuid) ??
  nonEmptyString(item.path) ??
  nonEmptyString(item.download_url);

export const mergeShortcutItems = (
  current: ShortcutItem[],
  incoming: ShortcutItem[]
) => {
  const itemsById = new Map(current.map((item) => [item.id, item]));
  incoming.forEach((item) => itemsById.set(item.id, item));
  return [...itemsById.values()];
};

export const getNextShortcutOffset = (
  offset: number,
  returnedRowCount: number
) => offset + returnedRowCount;

export const hasMoreShortcutItems = (fetchedCount: number, count: number) =>
  fetchedCount < count;

export const getShortcutResponseRows = (response: {
  folders?: unknown;
  documents?: unknown;
}) => [
  ...(Array.isArray(response.folders) ? response.folders : []),
  ...(Array.isArray(response.documents) ? response.documents : [])
];

export const normalizeShortcutItems = (value: unknown): ShortcutItem[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const item = candidate as Partial<ShortcutItemDto>;
    const id = getShortcutItemId(item);
    const name = nonEmptyString(item.name);
    if (!id || !name) return [];

    const path = nonEmptyString(item.path) ?? '';
    const downloadUrl = nonEmptyString(item.download_url);

    const common = {
      id,
      name,
      owner: nonEmptyString(item.owner) ?? '--',
      showActions: Boolean(item.showActions),
      readOnly: Boolean(item.readOnly) || !path,
      path,
      download_url: downloadUrl,
      created: parseDate(item.created),
      modified: parseDate(item.modified),
      lastModifiedAt: parseDate(item.last_modified_at),
      lastModifiedBy: item.last_modified_by ?? null,
      lastOpenedAt: parseDate(item.last_opened_at),
      lastOpenedBy: item.last_opened_by ?? null,
      lastActivityAt: parseDate(item.last_activity_at),
      lastActivityBy: item.last_activity_by ?? null,
      lastActivityType: item.last_activity_type ?? null
    };

    const mime = nonEmptyString(item.mime);
    if (item.size !== undefined || mime) {
      if (typeof item.size !== 'number' || !mime) return [];
      return [{ ...common, size: item.size, mime } as ShortcutItem];
    }
    return [common as ShortcutItem];
  });
};
