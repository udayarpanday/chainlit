import type { RecentFile, RecentFileDto } from '../types';

const isNullableString = (value: unknown): value is string | null =>
  value === null || typeof value === 'string';

const isRecentFileDto = (value: unknown): value is RecentFileDto => {
  if (!value || typeof value !== 'object') return false;

  const file = value as Record<string, unknown>;
  return (
    typeof file.name === 'string' &&
    typeof file.owner === 'string' &&
    isNullableString(file.created) &&
    isNullableString(file.modified) &&
    typeof file.showActions === 'boolean' &&
    typeof file.readOnly === 'boolean' &&
    typeof file.path === 'string' &&
    typeof file.size === 'number' &&
    Number.isFinite(file.size) &&
    typeof file.mime === 'string' &&
    typeof file.location === 'string' &&
    (file.location_name === undefined ||
      typeof file.location_name === 'string')
  );
};

const parseDate = (value: string | null): Date | null | undefined => {
  if (value === null) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

export const normalizeRecentFiles = (
  value: unknown,
  createId: () => string
): RecentFile[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry) => {
    if (!isRecentFileDto(entry)) return [];

    const created = parseDate(entry.created);
    const modified = parseDate(entry.modified);
    if (created === undefined || modified === undefined) return [];

    return [
      {
        ...entry,
        id: createId(),
        created,
        modified,
        locationName: entry.location_name
      }
    ];
  });
};
