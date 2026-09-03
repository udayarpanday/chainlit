import type { ModelCatalogItem, ReasoningSpec } from '@chainlit/react-client';

const asObject = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;

const normalizeReasoning = (value: unknown): ReasoningSpec => {
  const reasoning = asObject(value);
  if (!reasoning || reasoning.type === 'none') return { type: 'none' };

  if (reasoning.type === 'effort' && Array.isArray(reasoning.values)) {
    const values = reasoning.values.filter(
      (effort): effort is string => typeof effort === 'string'
    );
    return {
      type: 'effort',
      values,
      ...(typeof reasoning.default === 'string'
        ? { default: reasoning.default }
        : {})
    };
  }

  if (
    reasoning.type === 'max_tokens' &&
    typeof reasoning.min === 'number' &&
    typeof reasoning.max === 'number' &&
    typeof reasoning.step === 'number'
  ) {
    return {
      type: 'max_tokens',
      min: reasoning.min,
      max: reasoning.max,
      step: reasoning.step,
      ...(typeof reasoning.default === 'number'
        ? { default: reasoning.default }
        : {})
    };
  }

  return { type: 'none' };
};

const normalizeModel = (value: unknown): ModelCatalogItem | undefined => {
  const model = asObject(value);
  const id = Number(model?.id);
  const key = model?.key ?? model?.model;
  const name = model?.name ?? key;

  if (!model || !Number.isFinite(id) || !key || !name) return undefined;

  const providerLogoUrl = model.providerLogoUrl ?? model.provider_logo_url;
  const dataLocation = model.dataLocation ?? model.data_location;

  return {
    id,
    key: String(key),
    name: String(name),
    provider: String(model.provider ?? model.model_type ?? ''),
    ...(typeof providerLogoUrl === 'string' && providerLogoUrl
      ? { providerLogoUrl }
      : {}),
    ...(typeof dataLocation === 'string' && dataLocation
      ? { dataLocation }
      : {}),
    isToolsSupported: Boolean(
      model.isToolsSupported ?? model.is_tools_supported ?? true
    ),
    reasoning: normalizeReasoning(model.reasoning),
    isDefault: Boolean(model.isDefault ?? model.is_default)
  };
};

export const normalizeModelCatalogResponse = (
  payload: unknown
): ModelCatalogItem[] => {
  const envelope = asObject(payload);
  const rawModels = Array.isArray(payload)
    ? payload
    : Array.isArray(envelope?.results)
      ? envelope.results
      : Array.isArray(envelope?.models)
        ? envelope.models
        : Array.isArray(envelope?.data)
          ? envelope.data
          : [];

  const models = rawModels
    .map(normalizeModel)
    .filter((model): model is ModelCatalogItem => Boolean(model));

  return models.sort(
    (left, right) => Number(right.isDefault) - Number(left.isDefault)
  );
};
