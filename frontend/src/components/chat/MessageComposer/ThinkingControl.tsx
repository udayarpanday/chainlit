import { cn } from '@/lib/utils';
import { Brain, Check, ChevronDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  ActiveModelOverride,
  ModelCatalogItem,
  ModelReasoningSelection
} from '@chainlit/react-client';

import {
  getEffortTranslationKey,
  getInitialReasoning,
  getOneClickReasoning,
  normalizeMaxTokenValue
} from '@/components/ModelPicker/reasoning';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface Props {
  model: ModelCatalogItem;
  active?: ActiveModelOverride;
  enabled: boolean;
  disabled: boolean;
  onToggle: () => void;
  onSelect: (selection: ModelReasoningSelection) => Promise<boolean>;
}

const isOffEffort = (effort: string) =>
  ['none', 'off', 'disabled'].includes(effort.toLowerCase());

export default function ThinkingControl({
  model,
  active,
  enabled,
  disabled,
  onToggle,
  onSelect
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  // Match the configured preset applied by the backend's think_enabled flag.
  // Manual and inherited selections come from the session override.
  const oneClick = getOneClickReasoning(model);
  const applied = enabled ? oneClick : getInitialReasoning(model, active);
  const spec = model.reasoning;
  const [tokens, setTokens] = useState(String(applied?.max_tokens ?? ''));

  useEffect(() => {
    setOpen(false);
    setTokens(String(applied?.max_tokens ?? ''));
  }, [model.id, applied?.max_tokens]);

  const effortLabel = (effort: string) => {
    if (isOffEffort(effort)) {
      return t('chat.input.reasoningOff', { defaultValue: 'Off' });
    }
    const key = getEffortTranslationKey(effort);
    const fallback = effort.replace(/[-_]/g, ' ');
    return key
      ? t(`components.molecules.modelPicker.${key}`, { defaultValue: fallback })
      : fallback.charAt(0).toUpperCase() + fallback.slice(1);
  };

  const currentEffort = applied?.effort;
  const off = currentEffort !== undefined && isOffEffort(currentEffort);
  const hasActiveEffort = currentEffort ? !off : (applied?.max_tokens ?? 0) > 0;
  const presetEffort = oneClick?.effort;
  const showEnableHint =
    off && !enabled && presetEffort && !isOffEffort(presetEffort);
  const label = currentEffort
    ? effortLabel(currentEffort)
    : applied?.max_tokens !== undefined
      ? t('chat.input.reasoningTokens', {
          defaultValue: '{{count}} tokens',
          count: applied.max_tokens
        })
      : t('components.molecules.modelPicker.thinking', {
          defaultValue: 'Thinking'
        });

  const select = async (selection: ModelReasoningSelection) => {
    if (disabled || pending) return;
    setPending(true);
    try {
      if (await onSelect(selection)) setOpen(false);
    } finally {
      setPending(false);
    }
  };

  if (spec.type === 'none') return null;

  return (
    <div
      className={cn(
        'mx-2 flex h-7 items-center rounded-full border text-xs font-medium text-muted-foreground',
        off
          ? 'border-muted-foreground/30 transition-colors hover:bg-muted/60'
          : hasActiveEffort
            ? 'border-border bg-muted'
            : 'border-border'
      )}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="think-toggle"
              type="button"
              aria-pressed={enabled}
              disabled={disabled || pending}
              onClick={onToggle}
              variant="ghost"
              size="sm"
              className="h-full gap-1.5 rounded-full px-2 text-xs text-inherit hover:bg-transparent hover:text-inherit"
            >
              <Brain
                className="!size-5 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              {label}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {showEnableHint
              ? t('chat.input.thinkEnableTooltip', {
                  defaultValue: 'Enable thinking at {{effort}}',
                  effort: effortLabel(presetEffort)
                })
              : t('chat.input.thinkTooltip', {
                  defaultValue: 'Think longer to handle complex tasks'
                })}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || pending}
            aria-label={t('chat.input.chooseReasoning', {
              defaultValue: 'Choose reasoning effort'
            })}
            className="h-full rounded-full pl-1 pr-2 text-inherit hover:bg-transparent hover:text-inherit"
          >
            <ChevronDown
              className="!size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="end"
          className="min-w-36 rounded-xl p-1.5"
        >
          {spec.type === 'effort' ? (
            spec.values.map((effort) => (
              <DropdownMenuItem
                key={effort}
                disabled={disabled || pending}
                onSelect={(event) => {
                  event.preventDefault();
                  void select({ effort });
                }}
                className="flex min-h-9 justify-between gap-6 rounded-lg px-3"
                role="menuitemradio"
                aria-checked={currentEffort === effort}
              >
                {effortLabel(effort)}
                {currentEffort === effort ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : null}
              </DropdownMenuItem>
            ))
          ) : (
            <div className="space-y-2 p-2">
              <label htmlFor="thinking-token-budget" className="text-sm">
                {t('components.molecules.modelPicker.thinkingTokens', {
                  defaultValue: 'Thinking token budget'
                })}
              </label>
              <Input
                id="thinking-token-budget"
                type="number"
                min={spec.min}
                max={spec.max}
                step={spec.step}
                value={tokens}
                disabled={disabled || pending}
                onChange={(event) => setTokens(event.target.value)}
              />
              <Button
                size="sm"
                disabled={
                  disabled ||
                  pending ||
                  !tokens.trim() ||
                  !Number.isFinite(Number(tokens))
                }
                onClick={() =>
                  void select({
                    max_tokens: normalizeMaxTokenValue(
                      Number(tokens),
                      spec.min,
                      spec.max,
                      spec.step
                    )
                  })
                }
              >
                {t('common.actions.apply', { defaultValue: 'Apply' })}
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
