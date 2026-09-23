import { atom } from 'recoil';

import { ICommand } from 'client-types/*';

export interface IAttachment {
  id: string;
  serverId?: string;
  name: string;
  size: number;
  type: string;
  uploadProgress?: number;
  uploaded?: boolean;
  cancel?: () => void;
  remove?: () => void;
  file?: File;
}

export const attachmentsState = atom<IAttachment[]>({
  key: 'Attachments',
  default: []
});

export const persistentCommandState = atom<ICommand | undefined>({
  key: 'PersistentCommand',
  default: undefined
});

/**
 * A snippet of text the user highlighted in a message and pinned as extra
 * context for their next prompt.
 */
export interface IQuotedSelection {
  /** The (whitespace normalized) selected text. */
  text: string;
  /** Id of the step/message the selection comes from. */
  messageId?: string;
  /** Author of the quoted message, used for display purposes. */
  author?: string;
  /** Character offsets within the source message's rendered text. */
  sourceStart?: number;
  sourceEnd?: number;
}

export const MAX_QUOTED_SELECTION_LENGTH = 4000;

export const quotedSelectionState = atom<IQuotedSelection | undefined>({
  key: 'QuotedSelection',
  default: undefined
});
