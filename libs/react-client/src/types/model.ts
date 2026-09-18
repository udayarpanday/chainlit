export type ReasoningSpec =
  | { type: 'none' }
  | { type: 'effort'; values: string[]; default?: string }
  | {
      type: 'max_tokens';
      min: number;
      max: number;
      step: number;
      default?: number;
    };

export type ModelReasoningSelection = {
  effort?: string;
  max_tokens?: number;
};

export type ModelCatalogItem = {
  id: number;
  key: string;
  name: string;
  provider: string;
  providerLogoUrl?: string;
  dataLocation?: string;
  isToolsSupported: boolean;
  reasoning: ReasoningSpec;
  isDefault: boolean;
};

export type ActiveModelOverride = {
  modelId: number;
  key?: string;
  reasoning?: ModelReasoningSelection;
};

export type SetModelOverrideResponse =
  | {
      ok: true;
      active: ActiveModelOverride;
    }
  | {
      ok: false;
      error?: {
        code?: string;
        message?: string;
      };
    };
