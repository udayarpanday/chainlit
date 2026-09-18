import type { ModelCatalogItem, ReasoningSpec } from '@chainlit/react-client';

const asObject = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object'
    ? (value as Record<string, unknown>)
    : undefined;

const parseObject = (value: unknown): Record<string, unknown> | undefined => {
  if (typeof value !== 'string') return asObject(value);
  try {
    return asObject(JSON.parse(value));
  } catch {
    return undefined;
  }
};

const normalizeReasoningConfig = (
  type: unknown,
  value: unknown
): ReasoningSpec | undefined => {
  const config = asObject(value);

  if (type === 'effort' && config && Array.isArray(config.values)) {
    const values = config.values.filter(
      (effort): effort is string => typeof effort === 'string'
    );
    return {
      type: 'effort',
      values,
      ...(typeof config.default === 'string' ? { default: config.default } : {})
    };
  }

  if (
    type === 'max_tokens' &&
    config &&
    typeof config.min === 'number' &&
    typeof config.max === 'number' &&
    typeof config.step === 'number'
  ) {
    return {
      type: 'max_tokens',
      min: config.min,
      max: config.max,
      step: config.step,
      ...(typeof config.default === 'number' ? { default: config.default } : {})
    };
  }
};

const normalizeReasoning = (
  value: unknown,
  reasoningType: unknown,
  supportedParametersValue: unknown
): ReasoningSpec => {
  const reasoning = asObject(value);
  if (reasoning) {
    if (reasoning.type === 'none') return { type: 'none' };
    const normalized = normalizeReasoningConfig(reasoning.type, reasoning);
    if (normalized) return normalized;
  }

  const supportedParameters = parseObject(supportedParametersValue);
  const type =
    reasoningType === 'effort' || reasoningType === 'max_tokens'
      ? reasoningType
      : supportedParameters?.reasoning_effort
        ? 'effort'
        : supportedParameters?.reasoning_max_tokens
          ? 'max_tokens'
          : 'none';
  const parameterConfig =
    type === 'effort'
      ? supportedParameters?.reasoning_effort
      : type === 'max_tokens'
        ? supportedParameters?.reasoning_max_tokens
        : undefined;

  const normalized = normalizeReasoningConfig(type, parameterConfig);
  if (normalized) return normalized;
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
    provider: String(model.provider ?? model.creator ?? model.model_type ?? ''),
    ...(typeof providerLogoUrl === 'string' && providerLogoUrl
      ? { providerLogoUrl }
      : {}),
    ...(typeof dataLocation === 'string' && dataLocation
      ? { dataLocation }
      : {}),
    isToolsSupported: Boolean(
      model.isToolsSupported ?? model.is_tools_supported ?? true
    ),
    reasoning: normalizeReasoning(
      model.reasoning,
      model.reasoningType ?? model.reasoning_type,
      model.supportedParameters ?? model.supported_parameters
    ),
    isDefault: Boolean(model.isDefault ?? model.is_default)
  };
};

export const normalizeModelCatalogResponse = (
  payload: unknown
): ModelCatalogItem[] => {
  const envelope = asObject(payload);
  const results = envelope?.results;
  const envelopeModels = envelope?.models;
  const data = envelope?.data;
  const rawModels = Array.isArray(payload)
    ? payload
    : Array.isArray(results)
      ? results
      : Array.isArray(envelopeModels)
        ? envelopeModels
        : Array.isArray(data)
          ? data
          : [];

  const models = rawModels
    .map(normalizeModel)
    .filter((model): model is ModelCatalogItem => Boolean(model));

  return models.sort(
    (left, right) => Number(right.isDefault) - Number(left.isDefault)
  );
};
