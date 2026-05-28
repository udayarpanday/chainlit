import { Card } from '@/components/ui/card';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from '@/components/ui/item';
import type { IStep } from '@chainlit/react-client';
import { ChevronRight, Globe, Hammer, Image } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StepIO } from '../../ToolCallsInfo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BaseToolCall } from './BaseToolCall';
import Markdown from '@/components/Markdown';
import { tryParseJSONObject } from '@/lib/evoya';
import ReactJsonView from '@microlink/react-json-view'
import { ImageElement } from '@/components/Elements/Image';

export const ImageGeneration = ({ step }: { step: StepIO }) => {
  const hasError = step.outputParsed.messages[0].kwargs.status === 'error';
  const jsonResponse = useMemo(() => tryParseJSONObject(step.outputParsed.messages[0].kwargs.content), [step]);
  const toolName = useMemo(() => {
    const toolNameArr = step.inputParsed.tool_call.name.split("_");
    toolNameArr.shift();
    if (isNaN(parseInt(toolNameArr[toolNameArr.length - 1]))) {
      toolNameArr.pop();
    }
    return toolNameArr.join("_");
  }, [step]);

  return (
    <BaseToolCall
      title="Image Generation"
      icon={<Image />}
      hasError={hasError}
    >
      <div className="rounded-sm bg-accent overflow-hidden p-2 text-sm">
        {step.inputParsed.tool_call.args.query}
      </div>
      {!jsonResponse && (
        <Markdown
          allowHtml={true}
        >
          {step.outputParsed.messages[0].kwargs.content}
        </Markdown>
      )}
      {jsonResponse && (
        <div className="rounded-sm bg-accent overflow-hidden mt-2">
          <img
            className={cn(
              'mx-auto block max-w-full h-auto',
              `inline-image`
            )}
            src={jsonResponse.url}
            alt={jsonResponse.filename}
            loading="lazy"
          />
        </div>
      )}
      {/* {jsonResponse && (
        <ImageElement
          element={{
            url: jsonResponse.data,
            name: jsonResponse.filename,
            display: 'inline',
            id: jsonResponse.file_registry_uuid,
            type: 'image',
            forId: step.id
          }}
        />
      )} */}
    </BaseToolCall>
  );
}