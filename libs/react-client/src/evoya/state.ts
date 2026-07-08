import { atom } from 'recoil';
import { IStep } from 'src/types';

export const evoyaCreatorEnabledState = atom<boolean>({
  key: 'EvoyaCreatorEnabled',
  default: false
});

export const evoyaToolCallsState = atom<
  { isOpen: boolean; runId?: string; toolCalls: IStep[] }
>({
  key: 'EvoyaToolCalls',
  default: {
    isOpen: false,
    toolCalls: [],
    runId: undefined
  }
});