import { Card } from '@/components/ui/card';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from '@/components/ui/item';
import type { IStep } from '@chainlit/react-client';
import { ChevronRight, SquareArrowOutUpRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StepIO } from '../../ToolCallsInfo';
import Google from '@/components/icons/Google';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BaseToolCall } from './BaseToolCall';
import Markdown from '@/components/Markdown';
import { tryParseJSONObject } from '@/lib/evoya';

export const GoogleSearch = ({ step }: { step: StepIO }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasError = step.outputParsed.messages[0].kwargs.status === 'error';
  const jsonResponse = useMemo(() => tryParseJSONObject(step.outputParsed.messages[0].kwargs.content), [step]);

  return (
    <BaseToolCall
      title={step.inputParsed.tool_call.args.query ?? 'no query data'}
      icon={<Google />}
      hasError={hasError}
      contentItemClass="!p-0"
    >
      {!jsonResponse && (
        <div className='p-2'>
          {step.outputParsed.messages[0].kwargs.content}
        </div>
      )}
      {jsonResponse && (
        <ItemGroup>
          {jsonResponse.organic.map((item, index) => (
            <>
              {index > 0 && <ItemSeparator />}
              <Item size="sm">
                <ItemContent className="overflow-hidden">
                  <ItemTitle className="overflow-hidden whitespace-nowrap w-full">
                    <span className="text-ellipsis overflow-hidden">{item.title}</span>
                  </ItemTitle>
                  <ItemDescription>
                    {item.link}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button size="xs" variant="ghost" className="-my-2" asChild>
                    <a href={item.link} target="_blank">
                      <SquareArrowOutUpRight />
                    </a>
                  </Button>
                </ItemActions>
              </Item>
            </>
          ))}
        </ItemGroup>
      )}
    </BaseToolCall>
  );
}