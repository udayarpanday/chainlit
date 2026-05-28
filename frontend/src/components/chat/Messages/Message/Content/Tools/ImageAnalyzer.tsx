import { Card } from '@/components/ui/card';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from '@/components/ui/item';
import type { IStep } from '@chainlit/react-client';
import { ChevronRight, Globe, Hammer, Image, ScanSearch } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StepIO } from '../../ToolCallsInfo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BaseToolCall } from './BaseToolCall';
import Markdown from '@/components/Markdown';
import { tryParseJSONObject } from '@/lib/evoya';
import ReactJsonView from '@microlink/react-json-view'
import { ImageElement } from '@/components/Elements/Image';

export const ImageAnalyzer = ({ step }: { step: StepIO }) => {
  const hasError = step.outputParsed.messages[0].kwargs.status === 'error';
  const jsonResponse = useMemo(() => tryParseJSONObject(step.outputParsed.messages[0].kwargs.content), [step]);

  return (
    <BaseToolCall
      title="Image Analyzer"
      icon={<ScanSearch />}
      hasError={hasError}
    >
      <div className="rounded-sm bg-accent overflow-hidden p-2 text-sm">
        {step.inputParsed.tool_call.args.image_query}
      </div>
      <div className='mt-2'>
        {!jsonResponse && step.outputParsed.messages[0].kwargs.content}
        {jsonResponse && <ReactJsonView src={jsonResponse} />}
      </div>
    </BaseToolCall>
  );
}