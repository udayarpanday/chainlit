import {
  useState,
  useRef,
  useEffect,
} from 'react';

import {
  MDXEditor,
  diffSourcePlugin,
  markdownShortcutPlugin,
  AdmonitionDirectiveDescriptor,
  DirectiveDescriptor,
  directivesPlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  SandpackConfig,
  codeBlockPlugin,
  codeMirrorPlugin,
  sandpackPlugin,
  MDXEditorMethods,
  CodeMirrorEditor,
} from '@mdxeditor/editor';
import mdxCss from '@mdxeditor/editor/style.css?inline';
import mdxCustomCss from '../markdownEditor/custom.css?inline';

import useEvoyaCreator from '@/hooks/useEvoyaCreator';
import Toolbar from './Toolbar';

import {
  evoyaMathPlugin,
} from '../markdownEditor/plugins/math';

import {
  evoyaMathDialogPlugin,
} from '../markdownEditor/plugins/math/mathDialog';

import {
  SimpleMermaidCodeEditorDescriptor,
  SimpleVegaLiteCodeEditorDescriptor,
} from '../markdownEditor/plugins/extend/codeblocks';

import {
  getSvgIcon,
} from '../markdownEditor/utils/icons';

export default function Editor({ content, setContent }: { content: string; setContent: (val: string) => void; }) {
  const [mdContent, setMdContent] = useState(content);
  const [mdDiffContent, setMdDiffContent] = useState('');
  const mdxEditorRef = useRef<MDXEditorMethods>(null);

  return (
    <div
      style={{
        overflow: 'auto',
        height: '100%'
      }}
    >
      <style type="text/css">
        {mdxCss}
        {mdxCustomCss}
      </style>
      <MDXEditor
        className="evoya-creator-editor"
        ref={mdxEditorRef}
        markdown={mdContent}
        iconComponentFor={getSvgIcon}
        plugins={[
          toolbarPlugin({ toolbarContents: () => <Toolbar /> }),
          ...MDX_PLUGINS,
          imagePlugin(),
          evoyaMathPlugin(),
          evoyaMathDialogPlugin(),
          diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: mdDiffContent }),
        ]}
        onChange={(md) => {
          setMdContent(md);
          setContent(md);
        }}
      />
    </div>
  );
}

export const MDX_PLUGINS = [
  listsPlugin(),
  quotePlugin(),
  headingsPlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  tablePlugin(),
  thematicBreakPlugin(),
  // frontmatterPlugin(),
  codeBlockPlugin({
    codeBlockEditorDescriptors: [
      SimpleMermaidCodeEditorDescriptor,
      SimpleVegaLiteCodeEditorDescriptor,
      { priority: -10, match: (_) => true, Editor: CodeMirrorEditor }
    ]
  }),
  // sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
  codeMirrorPlugin({
    codeBlockLanguages: {
      js: 'JavaScript',
      json: 'JSON',
      vega: 'Vega',
      mermaid: 'Mermaid',
      mmd: 'Mermaid',
      markdown: 'Markdown',
      css: 'CSS',
      txt: 'Plain Text',
      plaintext: 'Plain Text',
      tsx: 'TypeScript',
      '': 'Unspecified'
    }
  }),
  markdownShortcutPlugin(),
];