import { Card } from '@/components/ui/card';
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemSeparator, ItemTitle } from '@/components/ui/item';
import type { IStep } from '@chainlit/react-client';
import { ChevronRight, Globe } from 'lucide-react';
import { ReactElement, useMemo, useState, PropsWithChildren } from 'react';
import { StepIO } from '../../ToolCallsInfo';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const BaseToolCall = ({
  hasError,
  icon,
  title,
  contentItemClass = '',
  children,
}: PropsWithChildren<{
  hasError: boolean;
  icon: ReactElement;
  title: string;
  contentItemClass?: string;
}>) => {
  const [isOpen, setIsOpen] = useState(false);
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
    <Card className={cn(hasError && 'bg-destructive/20 border-destructive')}>
      <ItemGroup>
        <Item size="sm">
          <ItemMedia variant="icon">
            {icon}
          </ItemMedia>
          <ItemContent className="overflow-hidden">
            <ItemTitle className="overflow-hidden whitespace-nowrap w-full">
              <span className="text-ellipsis overflow-hidden">{title}</span>
            </ItemTitle>
          </ItemContent>
          <ItemActions>
            <Button size="xs" variant="ghost" className="-my-2" onClick={() => setIsOpen(!isOpen)}>
              <ChevronRight className={cn(isOpen ? 'rotate-90' : '')} />
            </Button>
          </ItemActions>
        </Item>
        {isOpen && (
          <>
            <ItemSeparator className={cn(hasError && 'bg-destructive')} />
            <Item size="sm" className={contentItemClass}>
              <ItemContent className="overflow-hidden">
                {children}
              </ItemContent>
            </Item>
          </>
        )}
      </ItemGroup>
    </Card>
  )
}