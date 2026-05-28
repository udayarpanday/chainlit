import { Card, CardContent } from '@/components/ui/card';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from '@/components/ui/item';
import type { IStep } from '@chainlit/react-client';
import { ChevronRight, Globe, Hammer, Code } from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import { StepIO } from '../../ToolCallsInfo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BaseToolCall } from './BaseToolCall';
import Markdown from '@/components/Markdown';
import { tryParseJSONObject } from '@/lib/evoya';
import ReactJsonView from '@microlink/react-json-view';
import hljs from 'highlight.js';

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
        className={`language-${language} font-mono text-sm rounded-md block`}
      >
        {children}
      </code>
    </pre>
  );
};

export const CodeInterpreter = ({ step }: { step: StepIO }) => {
  let hasError = step.outputParsed.messages[0].kwargs.status === 'error';
  const jsonResponse = useMemo(() => tryParseJSONObject(step.outputParsed.messages[0].kwargs.content), [step]);

  if (jsonResponse && !jsonResponse.success) {
    hasError = true;
  }

  return (
    <BaseToolCall
      title="Code Interpreter"
      icon={<Code />}
      hasError={hasError}
    >
      <HighlightedCode language='py'>
        {step.inputParsed.tool_call.args.code}
      </HighlightedCode>
      <Card className={cn('my-2', hasError && 'bg-destructive/20 border-destructive')}>
        <div className='p-3'>
          <ReactJsonView src={{files: step.inputParsed.tool_call.args.input_files}} />
        </div>
      </Card>
      {jsonResponse && (
        <Card className={cn(hasError && 'bg-destructive/20 border-destructive')}>
          <ItemGroup>
            <Item size="sm">
              <ItemContent className="overflow-hidden">
                <ItemTitle className="overflow-hidden whitespace-nowrap w-full">
                  <span className="text-ellipsis overflow-hidden">Output</span>
                </ItemTitle>
              </ItemContent>
            </Item>
            <ItemSeparator className={cn(hasError && 'bg-destructive')} />
            <Item size="sm">
              <ItemContent className="overflow-hidden">
                {jsonResponse.text}
              </ItemContent>
            </Item>
          </ItemGroup>
        </Card>
      )}
    </BaseToolCall>
  );
}