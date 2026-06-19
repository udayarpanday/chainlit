import { Card } from '@/components/ui/card';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from '@/components/ui/item';
import type { IStep } from '@chainlit/react-client';
import { ChevronRight, Globe, SquareArrowOutUpRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StepIO } from '../../ToolCallsInfo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BaseToolCall } from './BaseToolCall';
import Markdown from '@/components/Markdown';
import { tryParseJSONObject } from '@/lib/evoya';
import ReactJsonView from '@microlink/react-json-view'

export const WebRequest = ({ step }: { step: StepIO }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasError = step.outputParsed.messages[0].kwargs.status === 'error';
  const jsonResponse = useMemo(() => tryParseJSONObject(step.outputParsed.messages[0].kwargs.content), [step]);
  // const inputJson = JSON.parse(step.input ?? '{}');
  // const inputJson = useMemo(() => {
  //   if (step.showInput === "json") {
  //     const json = JSON.parse(step.input ?? '{}');
  //     console.log(json);
  //     if (json.input && typeof json.input === 'string') {
  //       try {
  //         return JSON.parse(json.input.replace(/'/g, '"'));
  //       } catch(e) {
  //         return { url: 'failed'}
  //       }
  //     }

  //     return json;
  //   }

  //   return {};
  // }, [step]);
  // console.log(inputJson);

  return (
    <BaseToolCall
      title={step.inputParsed.tool_call.args.url ?? 'no url data for web request'}
      icon={<Globe />}
      hasError={hasError}
      additionalActions={
        <Button size="xs" variant="ghost" className="-my-2" asChild>
          <a href={step.inputParsed.tool_call.args.url} target="_blank">
            <SquareArrowOutUpRight />
          </a>
        </Button>
      }
    >
      {!jsonResponse && (
        <Markdown
          allowHtml={true}
        >
          {step.outputParsed.messages[0].kwargs.content}
        </Markdown>
      )}
      {jsonResponse && <ReactJsonView src={jsonResponse} />}
    </BaseToolCall>
  );
}