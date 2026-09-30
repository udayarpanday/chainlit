import type { DatasourceConnection } from './file';

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
  connectedToDatasource?: boolean;
  datasources?: DatasourceConnection[];
};

export type EvoyaPermission = 'read' | 'write';
