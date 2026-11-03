import { atom } from 'recoil';

export const documentPreviewDockedState = atom<boolean>({
  key: 'CopilotDocumentPreviewDocked',
  default: false
});
