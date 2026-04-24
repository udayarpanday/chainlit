import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { createPortal } from 'react-dom';

import {
  Realm,
} from "@mdxeditor/gurx";

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
import mdxCustomCss from './custom.css?inline';

import useEvoyaCreator from '@/hooks/useEvoyaCreator';
import MDXEditorToolbar from './MDXEditorToolbar';

import {
  evoyaAiPlugin,
  replaceSelectionContent$,
  evoyaAiState$,
} from './plugins/evoyaAi';

import {
  evoyaMathPlugin,
} from './plugins/math';

import {
  EditImageToolbar,
} from './plugins/evoyaImage';

import {
  evoyaMathDialogPlugin,
} from './plugins/math/mathDialog';

import {
  evoyaRootPlugin,
} from './plugins/extend/root';

import {
  CodeSelectionContext,
  SelectionContext,
} from "types";

import {
  MermaidCodeEditorDescriptor,
  VegaLiteCodeEditorDescriptor,
  EvoyaCodeEditorDescriptor,
  evoyaCodePlugin,
} from './plugins/extend/codeblocks';

import HandPointer from '@/svg/HandPointer';
import { IStep } from 'client-types/*';

import {
  messageBuilder,
  messageParser,
} from './utils/message';

import {
  getSvgIcon,
} from './utils/icons';

import { Badge } from '@chainlit/app/src/components/ui/badge';
import { Button } from '@chainlit/app/src/components/ui/button';
import { X } from 'lucide-react';

export default function MDXEditorWrapper() {
  const {
    creatorType,
    creatorContent,
    setCreatorContent,
  } = useEvoyaCreator();
  // const [mdContent, setMdContent] = useState(creatorContent);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [mdDiffContent, setMdDiffContent] = useState(creatorContent);
  const [editorSelectionContext, setEditorSelectionContext] = useState<SelectionContext | null>(null);
  const [editorSelectionMessageContext, setEditorSelectionMessageContext] = useState<SelectionContext | null>(null);
  const [mdxRealm, setMdxRealm] = useState<Realm|null>(null);
  const mdxEditorRef = useRef<MDXEditorMethods>(null);
  const containerRef = useRef<HTMLElement>(null);

  const handleRemoveContext = useCallback(() => {
    setEditorSelectionContext({
      lexical: null,
      markdown: null,
      selectionType: null,
    });
    mdxRealm?.pub(evoyaAiState$, null);
  }, [mdxRealm]);

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.getEvoyaCreatorContent = mdxEditorRef.current.getMarkdown;

    return () => {
      // @ts-expect-error is not a valid prop
      window.getEvoyaCreatorContent = () => null;
    }
  }, [mdxEditorRef]);

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.sendCreatorMessage = (message) => {
      const newMsg = messageBuilder(editorSelectionContext, message, creatorContent);

      // @ts-expect-error is not a valid prop
      window.sendChainlitMessage(newMsg);

      console.log('context', editorSelectionContext);
      setEditorSelectionMessageContext(editorSelectionContext);
    }
  }, [creatorContent, editorSelectionContext]);

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.disableEvoyaCreatorLock = () => {
      // mdxRealm?.pub(replaceSelectionContent$, {message: parsedMessage, context: editorSelectionMessageContext});
      setIsReadOnly(false);
    };
    // @ts-expect-error is not a valid prop
    window.enableEvoyaCreatorLock = () => {
      setIsReadOnly(true);
    };
  }, [setIsReadOnly]);

  return (
    <>
    {createPortal(
      <div
        style={{
          backgroundColor: 'white',
          padding: '.5rem 1rem',
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid #f4f4f4',
          margin: '0 -1rem'
        }}
      >
        {(editorSelectionContext?.selectionType === "range" || editorSelectionContext?.selectionType === "node") && (
          <Badge
            className="font-bold p-0.5"
            variant="outline"
          >
            <div className="bg-gray-100 rounded-full p-1">
              <HandPointer color='#FF2E4E' />
            </div>
            <div className="px-2">Partial</div>
            <Button onClick={handleRemoveContext} variant="ghost" size="xs" className="rounded-full">
              <X />
            </Button>
          </Badge>
        )}
        {editorSelectionContext?.selectionType === "document" && (
          <Badge
            className="font-bold p-0.5"
            variant="outline"
          >
            <div className="bg-gray-100 rounded-full p-1">
              <HandPointer color='#FF2E4E' />
            </div>
            <div className="px-2">Everything</div>
            <Button onClick={handleRemoveContext} variant="ghost" size="xs" className="rounded-full">
              <X />
            </Button>
          </Badge>
        )}
        {editorSelectionContext?.selectionType === "codeblock" && (
          <Badge
            className="font-bold p-0.5"
            variant="outline"
          >
            <div className="bg-gray-100 rounded-full p-1">
              <HandPointer color='#FF2E4E' />
            </div>
            <div className="px-2">{editorSelectionContext.selectedCode ? "Code Selection" : "Code Block"}</div>
            <Button onClick={handleRemoveContext} variant="ghost" size="xs" className="rounded-full">
              <X />
            </Button>
          </Badge>
        )}
      </div>,
      document.getElementById('chainlit-copilot')?.shadowRoot?.getElementById('evoya-creator-context-ref')
    )}
    <div ref={containerRef} className="overflow-auto h-full">
      <style type="text/css">
        {mdxCss}
      </style>
      <style type="text/css">
        {mdxCustomCss}
      </style>
      <MDXEditor
        className="evoya-creator-editor"
        readOnly={isReadOnly}
        ref={mdxEditorRef}
        markdown={creatorContent}
        iconComponentFor={getSvgIcon}
        plugins={[
          toolbarPlugin({ toolbarContents: () => <MDXEditorToolbar setMdDiffContent={setMdDiffContent} /> }),
          ...MDX_PLUGINS,
          imagePlugin({
            EditImageToolbar: EditImageToolbar
          }),
          evoyaAiPlugin({
            containerRef,
            creatorType,
            setSelectionContext: (context: SelectionContext | null) => {
              console.log('selectionContext', context);
              setEditorSelectionContext(context);
            },
            setRealm: setMdxRealm
          }),
          evoyaMathPlugin(),
          evoyaMathDialogPlugin(),
          diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: mdDiffContent }),
        ]}
        onChange={(md) => {
          if (!creatorContent) {
            setMdDiffContent(md);
          }
          setCreatorContent(md);
          localStorage.setItem('evoya-creator', JSON.stringify({
            content: md,
            type: 'markdown'
          }));
        }}
      />
    </div>
    </>
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
      MermaidCodeEditorDescriptor,
      VegaLiteCodeEditorDescriptor,
      EvoyaCodeEditorDescriptor,
      // { priority: -10, match: (_) => true, Editor: CodeMirrorEditor }
    ]
  }),
  evoyaCodePlugin({
    codeBlockLanguages: {
      python: 'Python',
      javascript: 'JavaScript',
      json: 'JSON',
      vega: 'Vega',
      mermaid: 'Mermaid',
      css: 'CSS',
      markdown: 'Markdown',
      txt: 'Plain Text',
      typescript: 'TypeScript',
      '': 'Unspecified'
    }
  }),
  evoyaRootPlugin(),
  // sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
  // codeMirrorPlugin({
  //   codeBlockLanguages: {
  //     js: 'JavaScript',
  //     json: 'JSON',
  //     vega: 'Vega',
  //     mermaid: 'Mermaid',
  //     mmd: 'Mermaid',
  //     markdown: 'Markdown',
  //     css: 'CSS',
  //     txt: 'Plain Text',
  //     plaintext: 'Plain Text',
  //     tsx: 'TypeScript',
  //     '': 'Unspecified'
  //   }
  // }),
  markdownShortcutPlugin(),
];