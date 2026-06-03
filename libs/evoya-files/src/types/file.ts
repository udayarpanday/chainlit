export type EvoyaFile = {
  // type: 'file';
  name: string;
  owner: string;
  // permissions: [
  //   'read',
  //   'write'
  // ],
  showActions: boolean;
  modified: Date;
  created: Date;
  size: number;
  path: string;
  mime: string;
}