import { atom } from 'recoil';

export const evoyaCreatorEnabledState = atom<boolean>({
  key: 'EvoyaCreatorEnabled',
  default: false
});

export const evoyaDiffSourceContentState = atom<string>({
  key: 'EvoyaDiffSourceContent',
  default: ''
});

export const evoyaDiffSourceEnabledState = atom<boolean>({
  key: 'EvoyaDiffSourceEnabled',
  default: false
});