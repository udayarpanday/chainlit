export type EvoyaDirectory = {
  type?: string;
  name: string;
  owner: string;
  // permissions: EvoyaPermission[],
  showActions: boolean;
  readOnly?: boolean;
  modified: Date | null;
  created: Date | null;
  path: string;
}

export type EvoyaPermission = 'read' | 'write';
