export type EvoyaDirectory = {
  // type: 'dir';
  name: string;
  owner: string;
  // permissions: EvoyaPermission[],
  showActions: boolean;
  modified: Date;
  created: Date;
  path: string;
}

export type EvoyaPermission = 'read' | 'write';