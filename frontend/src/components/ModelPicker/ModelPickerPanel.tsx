import { Command as CommandPrimitive } from 'cmdk';
import { ArrowLeft, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  ModelCatalogItem,
  ModelReasoningSelection,
  activeModelOverrideState,
  modelCatalogState,
  useChatSession
} from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList
} from '@/components/ui/command';

import ModelRow from './ModelRow';
import { getInitialReasoning } from './reasoning';

interface Props {
  disabled?: boolean;
  onBack: () => void;
  onSelected: () => void;
  agentUuid?: string;
}

export default function ModelPickerPanel({
  disabled = false,
  onBack,
  onSelected,
  agentUuid
}: Props) {
  const { t } = useTranslation();
  const catalog = useRecoilValue(modelCatalogState);
  const models = useMemo(() => catalog ?? [], [catalog]);
  const active = useRecoilValue(activeModelOverrideState);
  const setActive = useSetRecoilState(activeModelOverrideState);
  const { setModelOverride } = useChatSession();
  const [query, setQuery] = useState('');
  const [highlightedModelId, setHighlightedModelId] = useState('');
  const [pendingModelId, setPendingModelId] = useState<number>();
  const [reasoningByModel, setReasoningByModel] = useState<
    Record<number, ModelReasoningSelection | undefined>
  >({});
  const searchRef = useRef<HTMLInputElement>(null);
  const committedModelId = active?.modelId;

  useEffect(() => {
    if (!models.length) {
      setReasoningByModel({});
      return;
    }

    setReasoningByModel((current) => {
      const next: Record<number, ModelReasoningSelection | undefined> = {};
      models.forEach((model) => {
        next[model.id] =
          model.id === active?.modelId
            ? getInitialReasoning(model, active)
            : (current[model.id] ?? getInitialReasoning(model, active));
      });
      return next;
    });
  }, [models, active]);

  useEffect(() => {
    const selectedModel =
      models.find((model) => model.id === committedModelId) ??
      models.find((model) => model.isDefault) ??
      models[0];
    setHighlightedModelId(selectedModel ? String(selectedModel.id) : '');
    window.setTimeout(() => searchRef.current?.focus(), 50);
  }, [committedModelId, models]);

  const visibleModels = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return models;
    return models.filter((model) =>
      [model.name, model.key, model.provider].some((value) =>
        value.toLowerCase().includes(normalizedQuery)
      )
    );
  }, [models, query]);

  const applyModel = async (
    model: ModelCatalogItem,
    reasoning = reasoningByModel[model.id],
    notifyOnSuccess = false
  ) => {
    if (disabled || pendingModelId !== undefined) return;

    const nextReasoning =
      model.reasoning.type !== 'none' ? reasoning : undefined;
    const isAlreadyActive =
      active?.modelId === model.id &&
      JSON.stringify(active.reasoning ?? {}) ===
        JSON.stringify(nextReasoning ?? {});
    if (isAlreadyActive) {
      setActive({
        modelId: model.id,
        key: model.key,
        ...(nextReasoning ? { reasoning: nextReasoning } : {})
      });
      if (notifyOnSuccess) {
        toast.success(`${model.name} selected`);
        onSelected();
      }
      return;
    }

    setPendingModelId(model.id);
    const result = await setModelOverride(
      {
        modelId: model.id,
        key: model.key,
        ...(nextReasoning ? { reasoning: nextReasoning } : {})
      },
      agentUuid
    );
    setPendingModelId(undefined);

    if (!result.ok) {
      toast.error(t('components.molecules.modelPicker.changeFailed'));
      return;
    }

    const committedReasoning =
      result.active.modelId === model.id
        ? result.active.reasoning
        : nextReasoning;
    setActive({
      modelId: model.id,
      key: model.key,
      ...(committedReasoning ? { reasoning: committedReasoning } : {})
    });
    if (committedReasoning) {
      updateReasoning(model.id, committedReasoning);
    }
    if (notifyOnSuccess) {
      toast.success(`${model.name} selected`);
      onSelected();
    }
  };

  const updateReasoning = (
    modelId: number,
    reasoning: ModelReasoningSelection
  ) => {
    setReasoningByModel((current) => ({ ...current, [modelId]: reasoning }));
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onBack}
          aria-label={t('common.actions.back', { defaultValue: 'Back' })}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <h3 className="font-medium">
          {t('components.molecules.modelPicker.model')}
        </h3>
      </div>
      <Command
        shouldFilter={false}
        value={highlightedModelId}
        onValueChange={setHighlightedModelId}
        className="min-h-0 rounded-none"
      >
        <div className="shrink-0 border-b px-3 py-2.5">
          <div className="relative flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            />
            <CommandPrimitive.Input
              ref={searchRef}
              value={query}
              onValueChange={setQuery}
              placeholder={t('components.molecules.modelPicker.search')}
              aria-label={t('components.molecules.modelPicker.search')}
              className="flex h-10 w-full rounded-xl border border-transparent bg-white/55 py-2 pl-9 pr-3 text-base shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:ring-offset-1 focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            />
          </div>
        </div>
        <CommandList className="max-h-[280px] overflow-y-auto p-2 [scrollbar-width:thin]">
          <CommandEmpty>
            {t('components.molecules.modelPicker.empty')}
          </CommandEmpty>
          <CommandGroup className="p-0">
            {visibleModels.map((model) => (
              <ModelRow
                key={model.id}
                model={model}
                selected={committedModelId === model.id}
                pending={pendingModelId === model.id}
                disabled={disabled || pendingModelId !== undefined}
                reasoning={reasoningByModel[model.id]}
                onSelect={() =>
                  void applyModel(model, reasoningByModel[model.id], true)
                }
                onReasoningChange={(reasoning) =>
                  updateReasoning(model.id, reasoning)
                }
                onReasoningCommit={(reasoning) => {
                  updateReasoning(model.id, reasoning);
                  if (committedModelId === model.id) {
                    void applyModel(model, reasoning);
                  }
                }}
              />
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );
}
