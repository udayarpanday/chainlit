import { codeBlockElement } from '@/lib/codeBlockPreview';
import hljs from 'highlight.js';
import { PanelRightOpen } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import {
  evoyaCreatorEnabledState,
  sideViewState
} from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

import 'highlight.js/styles/monokai-sublime.css';

import CopyButton from './CopyButton';

interface CodeSnippetProps {
  language: string;
  children: string;
}

const HighlightedCode = ({ language, children }: CodeSnippetProps) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      const highlighted =
        codeRef.current.getAttribute('data-highlighted') === 'yes';
      if (!highlighted) {
        hljs.highlightElement(codeRef.current);
      }
    }
  }, []);

  return (
    <pre className="m-0 whitespace-break-spaces">
      <code
        ref={codeRef}
        className={`language-${language} font-mono text-sm rounded-b-md block`}
      >
        {children}
      </code>
    </pre>
  );
};

interface CodeProps {
  children: React.ReactNode;
  isStreaming?: boolean;
  node?: {
    children?: Array<{
      properties?: {
        className?: string[];
      };
      children?: Array<{
        value?: string;
      }>;
    }>;
  };
}

export default function CodeSnippet({ isStreaming, ...props }: CodeProps) {
  const id = useId();
  const setSideView = useSetRecoilState(sideViewState);
  const creatorEnabled = useRecoilValue(evoyaCreatorEnabledState);
  const codeChildren = props.node?.children?.[0];
  const className = codeChildren?.properties?.className?.join(' ');
  const match = /language-([^\s]+)/.exec(className || '');
  const code =
    codeChildren?.children?.map((child) => child.value || '').join('') || '';

  const showSyntaxHighlighter = match && code;

  const highlightedCode = showSyntaxHighlighter ? (
    <HighlightedCode language={match[1]}>{code}</HighlightedCode>
  ) : null;

  const nonHighlightedCode = showSyntaxHighlighter ? null : (
    <div className="p-2 rounded-b-md min-h-20 overflow-x-auto bg-accent">
      <code className="whitespace-pre-wrap">{code}</code>
    </div>
  );

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between gap-2 py-1 px-4">
        <span className="min-w-0 truncate text-sm text-muted-foreground">
          {match?.[1] || 'Raw code'}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {!creatorEnabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs text-muted-foreground"
              aria-label="Open in side panel"
              disabled={isStreaming || !code.trim()}
              title={
                isStreaming
                  ? 'Available when the response finishes'
                  : 'Open in side panel'
              }
              onClick={() => {
                const element = codeBlockElement(
                  `code-block:${id}`,
                  code,
                  match?.[1]
                );
                setSideView({
                  title: element.name,
                  elements: [element],
                  key: 'document-preview'
                });
              }}
            >
              <PanelRightOpen />
              Open in side panel
            </Button>
          )}
          <CopyButton content={code} />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {highlightedCode}
        {nonHighlightedCode}
      </CardContent>
    </Card>
  );
}
