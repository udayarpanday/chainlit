import type {
  ActiveModelOverride,
  ModelCatalogItem,
  ModelReasoningSelection
} from '@chainlit/react-client';

export const getInitialReasoning = (
  model: ModelCatalogItem,
  active?: ActiveModelOverride
): ModelReasoningSelection | undefined => {
  if (model.reasoning.type === 'none') return undefined;

  if (model.reasoning.type === 'effort') {
    const activeEffort =
      active?.modelId === model.id ? active.reasoning?.effort : undefined;
    const effort =
      activeEffort && model.reasoning.values.includes(activeEffort)
        ? activeEffort
        : (model.reasoning.default ?? model.reasoning.values[0]);
    return effort ? { effort } : undefined;
  }

  const activeTokens =
    active?.modelId === model.id ? active.reasoning?.max_tokens : undefined;
  const requestedTokens = activeTokens ?? model.reasoning.default;
  const tokens = requestedTokens ?? model.reasoning.min;
  const boundedTokens = Math.min(
    model.reasoning.max,
    Math.max(model.reasoning.min, tokens)
  );

  return { max_tokens: boundedTokens };
};

export const getEffortTranslationKey = (effort: string) => {
  switch (effort.toLowerCase().replace('_', '-')) {
    case 'none':
      return 'noThinking';
    case 'low':
      return 'low';
    case 'medium':
      return 'medium';
    case 'high':
      return 'high';
    case 'xhigh':
    case 'x-high':
      return 'xHigh';
    case 'max':
      return 'max';
    default:
      return undefined;
  }
};

export const normalizeMaxTokenValue = (
  value: number,
  min: number,
  max: number,
  step: number
) => {
  const bounded = Math.min(max, Math.max(min, value));
  const stepped = min + Math.round((bounded - min) / step) * step;
  return Math.min(max, Math.max(min, stepped));
};
