import {
  realmPlugin,
  addActivePlugin$,
} from "@mdxeditor/editor";

import {
  Cell,
} from "@mdxeditor/gurx";

export const showAdvancedToolbar$ = Cell<boolean>(false, (r) => {});

export const evoyaAiPlugin = realmPlugin({
  init: (realm, params) => {
    realm.pubIn({
      [addActivePlugin$]: 'evoyaToolbar',
      [showAdvancedToolbar$]: false,
    });
  }
});