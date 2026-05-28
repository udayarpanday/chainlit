import { Card } from '@/components/ui/card';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from '@/components/ui/item';
import type { IStep } from '@chainlit/react-client';
import { ChevronRight, Files, Globe, Hammer } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StepIO } from '../../ToolCallsInfo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BaseToolCall } from './BaseToolCall';
import Markdown from '@/components/Markdown';
import { tryParseJSONObject } from '@/lib/evoya';
import ReactJsonView from '@microlink/react-json-view'

export const SessionFiles = ({ step }: { step: StepIO }) => {
  const hasError = step.outputParsed.messages[0].kwargs.status === 'error';
  const jsonResponse = useMemo(() => tryParseJSONObject(step.outputParsed.messages[0].kwargs.content), [step]);

  return (
    <BaseToolCall
      title="Session Files"
      icon={<Files />}
      hasError={hasError}
    >
      <ReactJsonView src={step.inputParsed.tool_call.args} />
      {jsonResponse && (
        <>
          <div className="rounded-sm bg-accent overflow-hidden p-2 text-sm mb-2">
            {jsonResponse.message}
          </div>
          <ReactJsonView src={jsonResponse.files ?? []} />
        </>
        )}
    </BaseToolCall>
  );
}