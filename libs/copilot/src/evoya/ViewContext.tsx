import { Copy } from 'lucide-react';
import { useState } from 'react';
import { useRecoilValue } from 'recoil';
import { toast } from 'sonner';
import { useCopyToClipboard } from 'usehooks-ts';

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

const TAB_LABELS: Record<ContextTab, string> = {
  exact: 'Last prompt sent to LLM',
  context: 'Context summary'
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

const getEntryPriority = (label: string) => {
  if (label === 'messages') return -1;
  if (label === 'tools') return 1;

  return 0;
};

const sortEntries = (entries: [string, unknown][]) =>
  [...entries].sort(
    ([leftLabel], [rightLabel]) =>
      getEntryPriority(leftLabel) - getEntryPriority(rightLabel)
  );

const formatLabel = (label?: string) => {
  if (!label) return '';
  if (/^\d+$/.test(label)) return `${Number(label) + 1}`;

  return label
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getItemLabel = (label: string | undefined, index: number) => {
  const baseLabel = formatLabel(label || 'Item');
  const singularLabel = baseLabel.endsWith('s')
    ? baseLabel.slice(0, -1)
    : baseLabel;

  return `${singularLabel} ${index + 1}`;
};

const formatPrimitiveValue = (value: unknown) => {
  if (typeof value === 'string') return value || '-';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') return String(value);
  if (value === null || value === undefined) return '-';

  return String(value);
};

const escapeCodeFence = (value: string) => value.replace(/```/g, '\\`\\`\\`');

const toMarkdown = (value: unknown, label?: string, depth = 0): string => {
  if (Array.isArray(value)) {
    if (!value.length) {
      return label ? `- **${formatLabel(label)}:** -` : '-';
    }

    const blocks: string[] = [];

    if (label) {
      blocks.push(
        `${'#'.repeat(Math.min(depth + 2, 6))} ${formatLabel(label)}`
      );
    }

    value.forEach((item, index) => {
      if (isRecord(item) || Array.isArray(item)) {
        blocks.push(
          `${'#'.repeat(Math.min(depth + 3, 6))} ${getItemLabel(label, index)}`
        );
        blocks.push(toMarkdown(item, undefined, depth + 1));
      } else {
        blocks.push(`- ${formatPrimitiveValue(item)}`);
      }
    });

    return blocks.join('\n\n');
  }

  if (isRecord(value)) {
    const entries = sortEntries(
      Object.entries(value).filter(
        ([entryLabel]) => !shouldHideField(entryLabel, label)
      )
    );

    if (!entries.length) {
      return label ? `- **${formatLabel(label)}:** -` : '-';
    }

    const blocks: string[] = [];

    if (label) {
      blocks.push(
        `${'#'.repeat(Math.min(depth + 2, 6))} ${formatLabel(label)}`
      );
    }

    entries.forEach(([entryLabel, entryValue]) => {
      blocks.push(toMarkdown(entryValue, entryLabel, depth + (label ? 1 : 0)));
    });

    return blocks.join('\n\n');
  }

  if (typeof value === 'string' && value.includes('\n')) {
    const content = escapeCodeFence(value);

    if (label) {
      return [
        `${'#'.repeat(Math.min(depth + 2, 6))} ${formatLabel(label)}`,
        `\`\`\`text\n${content}\n\`\`\``
      ].join('\n\n');
    }

    return `\`\`\`text\n${content}\n\`\`\``;
  }

  if (label) {
    return `- **${formatLabel(label)}:** ${formatPrimitiveValue(value)}`;
  }

  return formatPrimitiveValue(value);
};

const buildMarkdownDocument = (tab: ContextTab, value: unknown) => {
  const title = TAB_LABELS[tab];

  if (tab === 'context' && typeof value === 'string') {
    const content = value.trim()
      ? `\`\`\`text\n${escapeCodeFence(value)}\n\`\`\``
      : '-';

    return `# ${title}\n\n${content}`;
  }

  return `# ${title}\n\n${toMarkdown(value)}`;
};

const ReadablePrimitive = ({ value }: { value: unknown }) => {
  if (typeof value === 'string') {
    const isMultiline = value.includes('\n');

    return isMultiline ? (
      <pre className="whitespace-pre-wrap break-words rounded-md bg-muted/40 p-2.5 font-sans text-sm leading-6">
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
      <div
        className={
          depth
            ? 'ml-3 space-y-2.5 border-l border-border/70 pl-3'
            : 'space-y-2.5'
        }
      >
        {label ? (
          <h4 className="text-sm font-semibold leading-5">
            {formatLabel(label)}
          </h4>
        ) : null}
        {value.length ? (
          value.map((item, index) => (
            <div key={index} className="space-y-2 rounded-md border p-2.5">
              <ReadableValue
                label={getItemLabel(label, index)}
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
    const entries = sortEntries(
      Object.entries(value).filter(
        ([entryLabel]) => !shouldHideField(entryLabel, label)
      )
    );

    return (
      <div
        className={
          depth
            ? 'ml-3 space-y-1.5 border-l border-border/70 pl-3'
            : 'space-y-1.5'
        }
      >
        {label ? (
          <h4 className="text-sm font-semibold leading-5">
            {formatLabel(label)}
          </h4>
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
    <div className="grid grid-cols-[minmax(5.5rem,8.5rem)_minmax(0,1fr)] gap-x-2 gap-y-1 border-b py-1.5 last:border-b-0">
      {label ? (
        <div className="break-words text-sm font-medium leading-5 text-muted-foreground">
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
  const [activeTab, setActiveTab] = useState<ContextTab>('exact');
  const [, copyToClipboard] = useCopyToClipboard();
  const context = useRecoilValue(promptState);

  if (!context?.is_superuser) return null;

  const contextPrompt = context?.context_prompt || '';
  const exactContextValue = parseNestedJsonValues(
    context?.context_prompt_exact_sent_to_llm ?? ''
  );

  const tabs: { id: ContextTab; label: string }[] = [
    {
      id: 'exact',
      label: TAB_LABELS.exact
    },
    {
      id: 'context',
      label: TAB_LABELS.context
    }
  ];

  const handleCopyMarkdown = async () => {
    try {
      const markdown = buildMarkdownDocument(
        activeTab,
        activeTab === 'exact' ? exactContextValue : contextPrompt
      );
      const didCopy = await copyToClipboard(markdown);

      if (!didCopy) {
        throw new Error('Clipboard copy failed');
      }

      toast.success(`${TAB_LABELS[activeTab]} copied as Markdown`);
    } catch {
      toast.error('Unable to copy Markdown');
    }
  };

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

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent
            className="
              z-[9999]
              flex
              h-[98vh]
              min-h-0
              w-[96vw]
              max-w-[1500px]
              flex-col
              overflow-hidden
            "
          >
            <DialogHeader className="gap-3">
              <DialogTitle>
                <Translator path="chat.context.modal_title" />
              </DialogTitle>
            </DialogHeader>

            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as ContextTab)}
              className="flex min-h-0 flex-1 flex-col gap-3"
            >
              <div>
                <TabsList className="w-fit">
                  {tabs.map((tab) => (
                    <TabsTrigger key={tab.id} value={tab.id}>
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleCopyMarkdown}
                      aria-label={`Copy ${TAB_LABELS[activeTab]} as Markdown`}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy current tab as Markdown</TooltipContent>
                </Tooltip>
              </div>

              {tabs.map((tab) => (
                <TabsContent
                  key={tab.id}
                  value={tab.id}
                  className="flex-1 min-h-0 overflow-auto overscroll-contain touch-pan-y rounded-md border p-4"
                  onWheelCapture={(e) => e.stopPropagation()}
                  onTouchMoveCapture={(e) => e.stopPropagation()}
                >
                  {tab.id === 'exact' ? (
                    <div className="text-sm">
                      <ReadableValue value={exactContextValue} />
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6">
                      {contextPrompt}
                    </pre>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </DialogContent>
        </Dialog>
      </TooltipProvider>
    </div>
  );
};

export default ViewContext;
