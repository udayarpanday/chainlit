import { useState } from 'react';
import { useRecoilValue } from 'recoil';

import { Translator } from '@chainlit/app/src/components/i18n';
import { Button } from '@chainlit/app/src/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@chainlit/app/src/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@chainlit/app/src/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@chainlit/app/src/components/ui/tooltip';
import { promptState } from '@chainlit/react-client';

type ContextTab = 'context' | 'exact';

type ReadableValueProps = {
  label?: string;
  value: unknown;
  depth?: number;
};

const isTokenBoundary = (value: string, index: number) => {
  const char = value[index];

  return !char || !/[A-Za-z0-9_]/.test(char);
};

const readQuotedString = (value: string, startIndex: number) => {
  const quote = value[startIndex];
  let content = '';
  let index = startIndex + 1;

  while (index < value.length) {
    const char = value[index];

    if (char === '\\') {
      const nextChar = value[index + 1];

      switch (nextChar) {
        case 'n':
          content += '\n';
          break;
        case 'r':
          content += '\r';
          break;
        case 't':
          content += '\t';
          break;
        case '\\':
          content += '\\';
          break;
        case '"':
          content += '"';
          break;
        case "'":
          content += "'";
          break;
        default:
          content += nextChar ?? '';
      }

      index += 2;
      continue;
    }

    if (char === quote) {
      return {
        value: content,
        endIndex: index + 1
      };
    }

    content += char;
    index += 1;
  }

  return undefined;
};

const pythonLiteralToJson = (value: string) => {
  let jsonValue = '';
  let index = 0;

  while (index < value.length) {
    const char = value[index];

    if (char === "'" || char === '"') {
      const quotedValue = readQuotedString(value, index);

      if (!quotedValue) return value;

      jsonValue += JSON.stringify(quotedValue.value);
      index = quotedValue.endIndex;
      continue;
    }

    if (
      value.startsWith('True', index) &&
      isTokenBoundary(value, index - 1) &&
      isTokenBoundary(value, index + 4)
    ) {
      jsonValue += 'true';
      index += 4;
      continue;
    }

    if (
      value.startsWith('False', index) &&
      isTokenBoundary(value, index - 1) &&
      isTokenBoundary(value, index + 5)
    ) {
      jsonValue += 'false';
      index += 5;
      continue;
    }

    if (
      value.startsWith('None', index) &&
      isTokenBoundary(value, index - 1) &&
      isTokenBoundary(value, index + 4)
    ) {
      jsonValue += 'null';
      index += 4;
      continue;
    }

    jsonValue += char;
    index += 1;
  }

  return jsonValue;
};

const parseJsonString = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue.startsWith('{') && !trimmedValue.startsWith('[')) {
    return value;
  }

  try {
    return JSON.parse(trimmedValue);
  } catch {
    try {
      return JSON.parse(pythonLiteralToJson(trimmedValue));
    } catch {
      return value;
    }
  }
};

const parseNestedJsonValues = (value: unknown): unknown => {
  if (typeof value === 'string') {
    const parsedValue = parseJsonString(value);

    if (parsedValue === value) return value;

    return parseNestedJsonValues(parsedValue);
  }

  if (Array.isArray(value)) {
    return value.map(parseNestedJsonValues);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        parseNestedJsonValues(nestedValue)
      ])
    );
  }

  return value;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const formatLabel = (label?: string) => {
  if (!label) return '';
  if (/^\d+$/.test(label)) return `${Number(label) + 1}`;

  return label
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const ReadablePrimitive = ({ value }: { value: unknown }) => {
  if (typeof value === 'string') {
    const isMultiline = value.includes('\n');

    return isMultiline ? (
      <pre className="whitespace-pre-wrap break-words rounded bg-muted/40 p-2 font-sans text-sm leading-relaxed">
        {value}
      </pre>
    ) : (
      <span className="break-words text-sm">{value || '-'}</span>
    );
  }

  if (typeof value === 'boolean') {
    return <span className="text-sm">{value ? 'Yes' : 'No'}</span>;
  }

  if (typeof value === 'number') {
    return <span className="text-sm">{value}</span>;
  }

  if (value === null) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  if (value === undefined) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  return <span className="text-sm text-muted-foreground">{String(value)}</span>;
};

const shouldHideField = (label?: string, sectionLabel?: string) =>
  label === 'parameters' && sectionLabel === 'function';

const ReadableValue = ({ label, value, depth = 0 }: ReadableValueProps) => {
  if (Array.isArray(value)) {
    return (
      <div className={depth ? 'ml-4 space-y-3 border-l pl-4' : 'space-y-3'}>
        {label ? (
          <h4 className="text-sm font-semibold">{formatLabel(label)}</h4>
        ) : null}
        {value.length ? (
          value.map((item, index) => (
            <div key={index} className="space-y-2 rounded border p-3">
              <ReadableValue
                label={String(index)}
                value={item}
                depth={depth + 1}
              />
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )}
      </div>
    );
  }

  if (isRecord(value)) {
    const entries = Object.entries(value).filter(
      ([entryLabel]) => !shouldHideField(entryLabel, label)
    );

    return (
      <div className={depth ? 'ml-4 space-y-2 border-l pl-4' : 'space-y-2'}>
        {label ? (
          <h4 className="text-sm font-semibold">{formatLabel(label)}</h4>
        ) : null}
        {entries.length ? (
          entries.map(([entryLabel, entryValue]) => (
            <ReadableValue
              key={entryLabel}
              label={entryLabel}
              value={entryValue}
              depth={depth + 1}
            />
          ))
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(7rem,13rem)_1fr] gap-3 border-b py-2 last:border-b-0">
      {label ? (
        <div className="break-words text-sm font-medium text-muted-foreground">
          {formatLabel(label)}
        </div>
      ) : null}
      <div className={label ? '' : 'col-span-2'}>
        <ReadablePrimitive value={value} />
      </div>
    </div>
  );
};

const ViewContext = () => {
  const [open, setOpen] = useState(false);
  const context = useRecoilValue(promptState);

  if (!context?.is_superuser) return null;

  const contextPrompt = context?.context_prompt || '';
  const exactContextValue = parseNestedJsonValues(
    context?.context_prompt_exact_sent_to_llm ?? ''
  );

  const tabs: { id: ContextTab; label: string }[] = [
    {
      id: 'context',
      label: 'Context prompt'
    },
    {
      id: 'exact',
      label: 'Exact sent to LLM'
    }
  ];

  return (
    <div>
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="opacity-30"
              size="icon"
              variant="ghost"
              onClick={() => setOpen(true)}
            >
              <Translator path="chat.context.title" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <Translator path="chat.context.modal_title_tip" />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="
            z-[9999]
            sm:max-w-[425px]
            lg:max-w-[1200px]
            h-[70vh]
            flex flex-col
            min-h-0
            overflow-hidden
          "
        >
          <DialogHeader>
            <DialogTitle>
              <Translator path="chat.context.modal_title" />
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="context" className="flex flex-1 flex-col min-h-0">
            <TabsList className="w-fit">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent
                key={tab.id}
                value={tab.id}
                className="flex-1 min-h-0 overflow-auto overscroll-contain touch-pan-y rounded-md border p-3"
                onWheelCapture={(e) => e.stopPropagation()}
                onTouchMoveCapture={(e) => e.stopPropagation()}
              >
                {tab.id === 'exact' ? (
                  <div className="text-sm">
                    <ReadableValue value={exactContextValue} />
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
                    {contextPrompt}
                  </pre>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ViewContext;
