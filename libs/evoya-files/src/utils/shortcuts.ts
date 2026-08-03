import type { ShortcutItem, ShortcutItemDto } from '../types';

const parseDate = (value?: string | null) => (value ? new Date(value) : null);

export const normalizeShortcutItems = (value: unknown): ShortcutItem[] => {
  if (!Array.isArray(value)) return [];

  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const item = candidate as Partial<ShortcutItemDto>;
    if (!item.id || !item.name || !item.path || !item.owner) return [];

    const common = {
      id: item.id,
      name: item.name,
      owner: item.owner,
      showActions: Boolean(item.showActions),
      readOnly: Boolean(item.readOnly),
      path: item.path,
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

    if (typeof item.size === 'number' && item.mime) {
      return [{ ...common, size: item.size, mime: item.mime } as ShortcutItem];
    }
    return [common as ShortcutItem];
  });
};
