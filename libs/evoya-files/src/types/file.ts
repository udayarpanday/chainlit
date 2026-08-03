export type EvoyaFile = {
  // type: 'file';
  name: string;
  owner: string;
  // permissions: [
  //   'read',
  //   'write'
  // ],
  showActions: boolean;
  readOnly?: boolean;
  modified: Date | null;
  created: Date | null;
  size: number;
  path: string;
  mime: string;
  lastModifiedAt?: Date | null;
  lastModifiedBy?: ActivityActor | null;
  lastOpenedAt?: Date | null;
  lastOpenedBy?: ActivityActor | null;
  lastActivityAt?: Date | null;
  lastActivityBy?: ActivityActor | null;
  lastActivityType?: 'opened' | 'modified' | null;
}

export type ActivityActor = {
  id: string;
  name: string;
};

export type RecentFileDto = {
  name: string;
  owner: string;
  created: string | null;
  modified: string | null;
  showActions: boolean;
  readOnly: boolean;
  path: string;
  size: number;
  mime: string;
  location: string;
  location_name?: string;
};

export type RecentFile = Omit<EvoyaFile, 'created' | 'modified'> & {
  id: string;
  created: Date | null;
  modified: Date | null;
  location: string;
  locationName?: string;
};

export type ShortcutKey = 'generated' | 'images' | 'projects';

export type ShortcutItemDto = {
  id: string;
  name: string;
  owner: string;
  created: string | null;
  modified: string | null;
  showActions: boolean;
  readOnly: boolean;
  path: string;
  size?: number | null;
  mime?: string;
  last_modified_at?: string | null;
  last_modified_by?: ActivityActor | null;
  last_opened_at?: string | null;
  last_opened_by?: ActivityActor | null;
  last_activity_at?: string | null;
  last_activity_by?: ActivityActor | null;
  last_activity_type?: 'opened' | 'modified' | null;
};

export type ShortcutItem = FilePickerShortcutItem & {
  lastModifiedAt?: Date | null;
  lastModifiedBy?: ActivityActor | null;
  lastOpenedAt?: Date | null;
  lastOpenedBy?: ActivityActor | null;
  lastActivityAt?: Date | null;
  lastActivityBy?: ActivityActor | null;
  lastActivityType?: 'opened' | 'modified' | null;
};

type FilePickerShortcutItem =
  | (Omit<EvoyaFile, 'created' | 'modified'> & {
      id: string;
      created: Date | null;
      modified: Date | null;
    })
  | {
      id: string;
      name: string;
      owner: string;
      showActions: boolean;
      readOnly?: boolean;
      created: Date | null;
      modified: Date | null;
      path: string;
    };
