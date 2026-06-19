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
  titleClass = '',
  additionalActions,
  children,
}: PropsWithChildren<{
  hasError: boolean;
  icon: ReactElement;
  additionalActions?: ReactElement;
  title: string;
  contentItemClass?: string;
  titleClass?: string;
}>) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className={cn(hasError && 'bg-destructive/20 border-destructive')}>
      <ItemGroup>
        <Item size="sm">
          <ItemMedia variant="icon">
            {icon}
          </ItemMedia>
          <ItemContent className="overflow-hidden">
            <ItemTitle className="overflow-hidden whitespace-nowrap w-full">
              <span className={cn("text-ellipsis overflow-hidden", titleClass)}>{title}</span>
            </ItemTitle>
          </ItemContent>
          <ItemActions>
            {additionalActions}
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