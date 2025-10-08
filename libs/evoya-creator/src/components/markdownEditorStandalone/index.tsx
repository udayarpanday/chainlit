import {
  useState,
  useRef,
} from 'react';

import Box from '@mui/material/Box';

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

export default function MDXEditorWrapper({ content, onChange }: { content: string; onChange: (value: string) => void; }) {
  const [mdContent, setMdContent] = useState(content);
  const mdxEditorRef = useRef<MDXEditorMethods>(null);
  const containerRef = useRef<HTMLElement>(null);

  return (
    <Box
      ref={containerRef}
      sx={{
        overflow: 'auto',
        height: '100%'
      }}
    >
      <style type="text/css">
        {mdxCss}
        {mdxCustomCss}
      </style>
      <MDXEditor
        className="evoya-mdx-editor"
        ref={mdxEditorRef}
        markdown={content}
        iconComponentFor={getSvgIcon}
        autoFocus
        plugins={[
          ...MDX_PLUGINS,
          evoyaMathPlugin(),
          evoyaMathDialogPlugin(),
          diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: content }),
        ]}
        onChange={(md) => {
          setMdContent(md);
          onChange(md);
        }}
      />
    </Box>
  );
}

export const MDX_PLUGINS = [
  toolbarPlugin({ toolbarContents: () => <EditorToolbar /> }),
  listsPlugin(),
  quotePlugin(),
  headingsPlugin(),
  linkPlugin(),
  linkDialogPlugin(),
  tablePlugin(),
  thematicBreakPlugin(),
  // frontmatterPlugin(),
  markdownShortcutPlugin(),
];
