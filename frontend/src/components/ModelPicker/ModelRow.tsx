import { cn } from '@/lib/utils';
import { Check, LoaderCircle, TriangleAlert } from 'lucide-react';
import type {
  ComponentType,
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  SVGProps
} from 'react';
import { useTranslation } from 'react-i18next';

import type {
  ModelCatalogItem,
  ModelReasoningSelection
} from '@chainlit/react-client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CommandItem } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import ChFlag from '@/assets/ch.svg?react';
import EuFlag from '@/assets/eu.svg?react';
import UsFlag from '@/assets/us.svg?react';

import { getEffortTranslationKey, normalizeMaxTokenValue } from './reasoning';

interface Props {
  model: ModelCatalogItem;
  selected: boolean;
  pending: boolean;
  disabled: boolean;
  reasoning?: ModelReasoningSelection;
  onSelect: () => void;
  onReasoningChange: (reasoning: ModelReasoningSelection) => void;
  onReasoningCommit: (reasoning: ModelReasoningSelection) => void;
}

type FlagIcon = ComponentType<SVGProps<SVGSVGElement>>;

const regionFlagIcons: Record<string, FlagIcon> = {
  SWITZERLAND: ChFlag,
  EUROPE: EuFlag,
  'UNITED STATES': UsFlag
};

const providerColors = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700'
];

const stopPropagation = (event: PointerEvent | MouseEvent | KeyboardEvent) =>
  event.stopPropagation();

const getProviderInitials = (provider: string) => {
  const words = provider.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
};

const getProviderColor = (provider: string) => {
  const index = Array.from(provider).reduce(
    (sum, character) => sum + character.charCodeAt(0),
    0
  );
  return providerColors[index % providerColors.length];
};

export default function ModelRow({
  model,
  selected,
  pending,
  disabled,
  reasoning,
  onSelect,
  onReasoningChange,
  onReasoningCommit
}: Props) {
  const { t } = useTranslation();
  const region = model.dataLocation?.toUpperCase();
  const FlagIcon = region ? regionFlagIcons[region] : undefined;
  const regionLabel = region
    ? t('components.molecules.modelPicker.dataRegion', { region })
    : undefined;
  const maxTokensSpec =
    model.reasoning.type === 'max_tokens' ? model.reasoning : undefined;

  const effortLabel = (effort: string) => {
    const key = getEffortTranslationKey(effort);
    return key
      ? t(`components.molecules.modelPicker.${key}`)
      : effort.replace(/[-_]/g, ' ');
  };

  return (
    <CommandItem
      value={String(model.id)}
      onSelect={onSelect}
      disabled={disabled}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'my-1 min-h-[76px] cursor-pointer rounded-xl border border-transparent px-3 py-3 data-[selected=true]:bg-accent/50',
        selected && '!border-primary/50 !bg-primary/10 text-primary'
      )}
    >
      <Avatar className="size-10 rounded-xl border bg-background">
        {model.providerLogoUrl ? (
          <AvatarImage
            src={model.providerLogoUrl}
            alt={`${model.provider} logo`}
            className="object-contain p-1.5"
          />
        ) : null}
        <AvatarFallback
          className={cn(
            'rounded-xl text-xs font-semibold',
            getProviderColor(model.provider)
          )}
        >
          {getProviderInitials(model.provider)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium">{model.name}</span>
          {model.isDefault ? (
            <Badge
              variant="secondary"
              className="h-5 shrink-0 px-2 text-[10px] font-medium"
            >
              {t('components.molecules.modelPicker.default')}
            </Badge>
          ) : null}
        </div>
        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{model.provider}</span>
          {region ? (
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    aria-label={regionLabel}
                    className="flex min-w-5 shrink-0 items-center justify-center text-xs leading-none"
                  >
                    {FlagIcon ? (
                      <FlagIcon
                        aria-hidden="true"
                        className="h-4 w-5 rounded-[2px] object-cover"
                      />
                    ) : (
                      'N/A'
                    )}
                  </span>
                </TooltipTrigger>
                <TooltipContent>{regionLabel}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : null}
          {!model.isToolsSupported ? (
            <TooltipProvider delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={t(
                      'components.molecules.modelPicker.toolsUnsupported'
                    )}
                    className="inline-flex shrink-0 cursor-help text-amber-600"
                    onPointerDown={stopPropagation}
                    onClick={stopPropagation}
                    onKeyDown={stopPropagation}
                  >
                    <TriangleAlert aria-hidden="true" className="size-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipPortal
                  container={
                    window.cl_shadowRootElement?.isConnected
                      ? window.cl_shadowRootElement
                      : document.body
                  }
                >
                  <TooltipContent className="z-[10000]">
                    {t('components.molecules.modelPicker.toolsUnsupported')}
                  </TooltipContent>
                </TooltipPortal>
              </Tooltip>
            </TooltipProvider>
          ) : null}
        </div>
      </div>

      <div
        className={cn(
          'ml-auto flex shrink-0 items-center justify-end gap-2',
          maxTokensSpec ? 'w-[180px] sm:w-[280px]' : 'w-[150px] sm:w-[190px]'
        )}
        onPointerDown={stopPropagation}
        onClick={stopPropagation}
        onKeyDown={stopPropagation}
      >
        {pending ? (
          <LoaderCircle
            aria-label={t('common.status.loading')}
            className="size-4 animate-spin text-primary"
          />
        ) : selected ? (
          <Check aria-hidden="true" className="size-4 text-primary" />
        ) : null}

        {model.reasoning.type === 'none' ? (
          <span className="text-xs text-muted-foreground">
            {t('components.molecules.modelPicker.noThinking')}
          </span>
        ) : null}

        {model.reasoning.type === 'effort' ? (
          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground xl:inline">
              {t('components.molecules.modelPicker.thinking')}
            </span>
            <Select
              value={reasoning?.effort}
              disabled={disabled}
              onValueChange={(effort) => {
                const next = { effort };
                onReasoningChange(next);
                onReasoningCommit(next);
              }}
            >
              <SelectTrigger
                aria-label={t('components.molecules.modelPicker.thinking')}
                className="h-8 w-[104px] px-2"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                container={
                  window.cl_shadowRootElement?.isConnected
                    ? window.cl_shadowRootElement
                    : document.body
                }
                className="z-[10000]"
              >
                {model.reasoning.values.map((effort) => (
                  <SelectItem key={effort} value={effort}>
                    {effortLabel(effort)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        {maxTokensSpec ? (
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Slider
              aria-label={t('components.molecules.modelPicker.thinking')}
              disabled={disabled}
              min={maxTokensSpec.min}
              max={maxTokensSpec.max}
              step={maxTokensSpec.step}
              value={[reasoning?.max_tokens ?? maxTokensSpec.min]}
              onValueChange={([max_tokens]) =>
                onReasoningChange({ max_tokens })
              }
              onValueCommit={([max_tokens]) =>
                onReasoningCommit({ max_tokens })
              }
              className="min-w-16 flex-1"
            />
            <Input
              aria-label={t('components.molecules.modelPicker.thinkingTokens')}
              type="number"
              disabled={disabled}
              min={maxTokensSpec.min}
              max={maxTokensSpec.max}
              step={maxTokensSpec.step}
              value={reasoning?.max_tokens ?? maxTokensSpec.min}
              onChange={(event) => {
                const max_tokens = Number(event.target.value);
                if (Number.isFinite(max_tokens)) {
                  onReasoningChange({ max_tokens });
                }
              }}
              onBlur={() => {
                if (reasoning?.max_tokens === undefined) return;
                onReasoningCommit({
                  max_tokens: normalizeMaxTokenValue(
                    reasoning.max_tokens,
                    maxTokensSpec.min,
                    maxTokensSpec.max,
                    maxTokensSpec.step
                  )
                });
              }}
              onKeyDown={(event) => {
                event.stopPropagation();
                if (event.key === 'Enter') event.currentTarget.blur();
              }}
              className="h-8 w-[86px] shrink-0 px-2 text-xs"
            />
          </div>
        ) : null}
      </div>
    </CommandItem>
  );
}
