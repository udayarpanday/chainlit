import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilValue } from 'recoil';
import { toast } from 'sonner';

import {
  ModelCatalogItem,
  ModelReasoningSelection,
  activeModelOverrideState,
  modelCatalogState,
  useChatSession
} from '@chainlit/react-client';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandList
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';

import ModelRow from './ModelRow';
import { getInitialReasoning } from './reasoning';

interface Props {
  open: boolean;
  disabled?: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ModelPickerModal({
  open,
  disabled = false,
  onOpenChange
}: Props) {
  const { t } = useTranslation();
  const models = useRecoilValue(modelCatalogState) ?? [];
  const active = useRecoilValue(activeModelOverrideState);
  const { setModelOverride } = useChatSession();
  const [query, setQuery] = useState('');
  const [pendingModelId, setPendingModelId] = useState<number>();
  const [reasoningByModel, setReasoningByModel] = useState<
    Record<number, ModelReasoningSelection | undefined>
  >({});
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!models.length) {
      setReasoningByModel({});
      return;
    }

    setReasoningByModel((current) => {
      const next: Record<number, ModelReasoningSelection | undefined> = {};
      models.forEach((model) => {
        next[model.id] =
          current[model.id] ?? getInitialReasoning(model, active);
      });
      return next;
    });
  }, [models, active?.modelId]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      return;
    }
    window.setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

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
    reasoning = reasoningByModel[model.id]
  ) => {
    if (disabled || pendingModelId !== undefined) return;

    const nextReasoning =
      model.reasoning.type !== 'none' ? reasoning : undefined;
    const isAlreadyActive =
      active?.modelId === model.id &&
      JSON.stringify(active.reasoning ?? {}) ===
        JSON.stringify(nextReasoning ?? {});
    if (isAlreadyActive) return;

    setPendingModelId(model.id);
    const result = await setModelOverride({
      modelId: model.id,
      ...(nextReasoning ? { reasoning: nextReasoning } : {})
    });
    setPendingModelId(undefined);

    if (!result.ok) {
      toast.error(t('components.molecules.modelPicker.changeFailed'));
    } else if (result.active.reasoning) {
      updateReasoning(model.id, result.active.reasoning);
    }
  };

  const updateReasoning = (
    modelId: number,
    reasoning: ModelReasoningSelection
  ) => {
    setReasoningByModel((current) => ({ ...current, [modelId]: reasoning }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        container={
          window.cl_shadowRootElement?.isConnected
            ? window.cl_shadowRootElement
            : document.body
        }
        className="flex max-h-[88vh] w-[calc(100vw-1rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:w-[calc(100vw-2rem)]"
      >
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12">
          <DialogTitle>
            {t('components.molecules.modelPicker.title')}
          </DialogTitle>
        </DialogHeader>

        <Command shouldFilter={false} className="min-h-0 rounded-none">
          <div className="shrink-0 border-b bg-background px-4 py-3">
            <CommandInput
              ref={searchRef}
              value={query}
              onValueChange={setQuery}
              placeholder={t('components.molecules.modelPicker.search')}
              aria-label={t('components.molecules.modelPicker.search')}
              className="h-10"
            />
          </div>
          <CommandList className="max-h-none min-h-0 flex-1 overflow-y-auto px-2 py-1 sm:max-h-[62vh]">
            <CommandEmpty>
              {t('components.molecules.modelPicker.empty')}
            </CommandEmpty>
            <CommandGroup className="p-0">
              {visibleModels.map((model) => (
                <ModelRow
                  key={model.id}
                  model={model}
                  selected={active?.modelId === model.id}
                  pending={pendingModelId === model.id}
                  disabled={disabled || pendingModelId !== undefined}
                  reasoning={reasoningByModel[model.id]}
                  onSelect={() => void applyModel(model)}
                  onReasoningChange={(reasoning) =>
                    updateReasoning(model.id, reasoning)
                  }
                  onReasoningCommit={(reasoning) => {
                    updateReasoning(model.id, reasoning);
                    void applyModel(model, reasoning);
                  }}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
