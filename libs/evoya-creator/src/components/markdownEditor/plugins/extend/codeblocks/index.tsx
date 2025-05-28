import {
  MermaidCodeEditorDescriptor
} from './Mermaid';
import {
  EvoyaCodeEditorDescriptor
} from './EvoyaCodeEditor';
import {
  VegaLiteCodeEditorDescriptor
} from './VegaLite';

import {
  realmPlugin,
  codeBlockLanguages$,
} from "@mdxeditor/editor";


const evoyaCodePlugin = realmPlugin<{codeBlockLanguages: Record<string, string>}>({
  init: (realm, params) => {
    realm.pubIn({
      [codeBlockLanguages$]: params?.codeBlockLanguages,
    });
  }
});

export {
  MermaidCodeEditorDescriptor,
  VegaLiteCodeEditorDescriptor,
  EvoyaCodeEditorDescriptor,
  evoyaCodePlugin,
}