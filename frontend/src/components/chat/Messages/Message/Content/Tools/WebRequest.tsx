import { Card } from '@/components/ui/card';
import { Item, ItemContent, ItemMedia, ItemTitle } from '@/components/ui/item';
import type { IStep } from '@chainlit/react-client';
import { Globe } from 'lucide-react';
import { useMemo } from 'react';

export const WebRequest = ({ step }: { step: IStep }) => {
  // const inputJson = JSON.parse(step.input ?? '{}');
  const inputJson = useMemo(() => {
    if (step.showInput === "json") {
      const json = JSON.parse(step.input ?? '{}');
      console.log(json);
      if (json.input && typeof json.input === 'string') {
        try {
          return JSON.parse(json.input.replace(/'/g, '"'));
        } catch(e) {
          return { url: 'failed'}
        }
      }

      return json;
    }

    return {};
  }, [step]);
  console.log(inputJson);

  return (
    <Card>
      <Item size="sm" variant="outline">
        <ItemMedia variant="icon">
          <Globe />
        </ItemMedia>
        <ItemContent className="overflow-hidden">
          <ItemTitle className="overflow-hidden whitespace-nowrap">
            <span className="text-ellipsis overflow-hidden">{inputJson.url ?? 'no url data for web request'}</span>
          </ItemTitle>
        </ItemContent>
      </Item>
    </Card>
  )
}