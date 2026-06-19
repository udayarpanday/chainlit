import { Card } from '@/components/ui/card';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from '@/components/ui/item';
import type { IStep } from '@chainlit/react-client';
import { ChevronRight, Globe, Hammer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StepIO } from '../../ToolCallsInfo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BaseToolCall } from './BaseToolCall';
import Markdown from '@/components/Markdown';
import { tryParseJSONObject } from '@/lib/evoya';
import ReactJsonView from '@microlink/react-json-view'

export const CustomTool = ({ step }: { step: StepIO }) => {
  const hasError = step.outputParsed.messages[0].kwargs.status === 'error';
  // const content = useMemo(() => tryParseJSONObject(step.outputParsed.messages[0].kwargs.content), [step]);
  const jsonResponse = useMemo(() => tryParseJSONObject(step.outputParsed.messages[0].kwargs.content), [step]);
  const toolName = useMemo(() => {
    const toolNameArr = step.inputParsed.tool_call.name.split("_");
    toolNameArr.shift();
    if (!isNaN(parseInt(toolNameArr[toolNameArr.length - 1]))) {
      toolNameArr.pop();
    }
    return toolNameArr.join(" ");
  }, [step]);

  return (
    <BaseToolCall
      title={toolName}
      icon={<Hammer />}
      hasError={hasError}
      titleClass='capitalize'
    >
      <ReactJsonView src={step.inputParsed.tool_call.args} />
      {!jsonResponse && (
        <Markdown
          allowHtml={true}
          className="mt-2"
        >
          {step.outputParsed.messages[0].kwargs.content}
        </Markdown>
      )}
      {jsonResponse && <ReactJsonView src={jsonResponse} />}
    </BaseToolCall>
  );
}