import { atom } from 'recoil';

export interface EvoyaAttachment {
  id: string;
  path: string;
  type: string;
  name: string;
  remove?: () => void;
}

export const evoyaAttachmentsState = atom<EvoyaAttachment[]>({
  key: 'EvoyaAttachments',
  default: []
});
