import {
  useState,
  useRef,
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

import {
  evoyaMathPlugin,
} from '../markdownEditor/plugins/math';

import {
  evoyaMathDialogPlugin,
} from '../markdownEditor/plugins/math/mathDialog';

import {
  getSvgIcon,
} from '../markdownEditor/utils/icons';

import EditorToolbar from './toolbar';

import {
  SimpleMermaidCodeEditorDescriptor,
  SimpleVegaLiteCodeEditorDescriptor,
} from '../markdownEditor/plugins/extend/codeblocks';

export default function MDXEditorWrapper({ content, onChange }: { content: string; onChange: (value: string) => void; }) {
  const [mdContent, setMdContent] = useState(content);
  const mdxEditorRef = useRef<MDXEditorMethods>(null);
  const containerRef = useRef<HTMLElement>(null);

  return (
    <div
      style={{
        overflow: 'auto',
        height: '100%',
        cursor: 'text',
        minHeight: '300px',
        maxHeight: '600px',
      }}
      ref={containerRef}
      onClick={() => mdxEditorRef.current?.focus()}
    >
      <style type="text/css">
        {mdxCss}
        {mdxCustomCss}
      </style>
      <div onClick={(e) => {e.preventDefault(); e.stopPropagation()}}>
        <MDXEditor
          suppressHtmlProcessing
          className="evoya-mdx-editor"
          ref={mdxEditorRef}
          markdown={content}
          iconComponentFor={getSvgIcon}
          overlayContainer={containerRef.current}
          autoFocus
          plugins={[
              toolbarPlugin({ toolbarContents: () => <EditorToolbar /> }),
              ...MDX_PLUGINS,
              imagePlugin(),
              evoyaMathPlugin(),
              evoyaMathDialogPlugin(),
              diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: content }),
          ]}
          // plugins={[
          //   ...MDX_PLUGINS,
          //   evoyaMathPlugin(),
          //   evoyaMathDialogPlugin(),
          //   diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: content }),
          // ]}
          onChange={(md) => {
            setMdContent(md);
            onChange(md);
          }}
        />
      </div>
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
// export const MDX_PLUGINS = [
//   toolbarPlugin({ toolbarContents: () => <EditorToolbar /> }),
//   listsPlugin(),
//   headingsPlugin(),
//   linkPlugin(),
//   linkDialogPlugin(),
//   tablePlugin(),
//   thematicBreakPlugin(),
//   // frontmatterPlugin(),
//   markdownShortcutPlugin(),
// ];
