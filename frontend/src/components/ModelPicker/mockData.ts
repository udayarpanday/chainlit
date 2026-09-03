import type {
  ActiveModelOverride,
  ModelCatalogItem
} from '@chainlit/react-client';

export const isModelPickerMockEnabled = true;

export const mockModelCatalog: ModelCatalogItem[] = [
  {
    id: 9001,
    key: 'gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    dataLocation: 'US',
    isToolsSupported: true,
    reasoning: {
      type: 'effort',
      values: ['none', 'low', 'medium', 'high', 'x-high'],
      default: 'medium'
    },
    isDefault: true
  },
  {
    id: 9002,
    key: 'claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    dataLocation: 'EU',
    isToolsSupported: true,
    reasoning: {
      type: 'effort',
      values: ['low', 'medium', 'high'],
      default: 'high'
    },
    isDefault: false
  },
  {
    id: 9003,
    key: 'mistral-large-latest',
    name: 'Mistral Large',
    provider: 'Mistral AI',
    dataLocation: 'CH',
    isToolsSupported: true,
    reasoning: { type: 'none' },
    isDefault: false
  },
  {
    id: 9004,
    key: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    dataLocation: 'CH',
    isToolsSupported: false,
    reasoning: {
      type: 'max_tokens',
      min: 1024,
      max: 32768,
      step: 1024,
      default: 8192
    },
    isDefault: false
  },
  {
    id: 9005,
    key: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    dataLocation: 'APAC',
    isToolsSupported: true,
    reasoning: {
      type: 'effort',
      values: ['low', 'medium', 'high', 'max'],
      default: 'medium'
    },
    isDefault: false
  }
];

const mockModelIds = new Set(mockModelCatalog.map((model) => model.id));

export const isMockModelCatalog = (models: ModelCatalogItem[] | undefined) => {
  if (!models?.length) return false;
  return models.every((model) => mockModelIds.has(model.id));
};

export const mockActiveModel: ActiveModelOverride = {
  modelId: mockModelCatalog[0].id,
  reasoning: { effort: 'medium' }
};
