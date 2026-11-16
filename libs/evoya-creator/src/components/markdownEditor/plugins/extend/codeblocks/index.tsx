import {
  MermaidCodeEditorDescriptor,
  SimpleMermaidCodeEditorDescriptor,
} from './Mermaid';
import {
  EvoyaCodeEditorDescriptor
} from './EvoyaCodeEditor';
import {
  VegaLiteCodeEditorDescriptor,
  SimpleVegaLiteCodeEditorDescriptor,
} from './VegaLite';

import {
  realmPlugin,
  codeBlockLanguages$,
  normalizeCodeBlockLanguages
} from "@mdxeditor/editor";

const evoyaCodePlugin = realmPlugin<{codeBlockLanguages: Record<string, string>}>({
  // init: (realm, params) => {
  //   realm.pubIn({
  //     [codeBlockLanguages$]: params?.codeBlockLanguages,
  //   });
  // }
  update(r, params) {
    r.pubIn({
      [codeBlockLanguages$]: normalizeCodeBlockLanguages((params == null ? void 0 : params.codeBlockLanguages) ?? {}),
    });
  },
  init(r, params) {
    const normalized = normalizeCodeBlockLanguages((params == null ? void 0 : params.codeBlockLanguages) ?? {});
    r.pubIn({
      [codeBlockLanguages$]: normalized
    });
  }
});

export {
  MermaidCodeEditorDescriptor,
  SimpleMermaidCodeEditorDescriptor,
  VegaLiteCodeEditorDescriptor,
  SimpleVegaLiteCodeEditorDescriptor,
  EvoyaCodeEditorDescriptor,
  evoyaCodePlugin,
}