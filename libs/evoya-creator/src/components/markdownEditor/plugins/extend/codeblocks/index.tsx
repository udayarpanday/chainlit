import {
  codeBlockLanguages$,
  normalizeCodeBlockLanguages,
  realmPlugin
} from '@mdxeditor/editor';

import { EvoyaCodeEditorDescriptor } from './EvoyaCodeEditor';
import {
  MermaidCodeEditorDescriptor,
  SimpleMermaidCodeEditorDescriptor
} from './Mermaid';
import {
  SimpleVegaLiteCodeEditorDescriptor,
  VegaLiteCodeEditorDescriptor
} from './VegaLite';

const evoyaCodePlugin = realmPlugin<{
  codeBlockLanguages: Record<string, string>;
}>({
  init: (realm, params) => {
    realm.pubIn({
      [codeBlockLanguages$]: normalizeCodeBlockLanguages(
        params?.codeBlockLanguages ?? {}
      )
    });
  }
});

export {
  MermaidCodeEditorDescriptor,
  SimpleMermaidCodeEditorDescriptor,
  VegaLiteCodeEditorDescriptor,
  SimpleVegaLiteCodeEditorDescriptor,
  EvoyaCodeEditorDescriptor,
  evoyaCodePlugin
};
