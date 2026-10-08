export type ApiKeyProvider =
  | "gemini"
  | "openai"
  | "anthropic"
  | "openrouter"
  | "xai"
  | "groq";

export type ModelTier = "fast" | "balanced" | "best";

export interface LlmModelOption {
  id: string;
  label: string;
  tier: ModelTier;
}

export interface LlmProviderCatalog {
  label: string;
  models: readonly LlmModelOption[];
}

export interface LlmModelSelection {
  choice: string;
  customModel: string;
}

/**
 * Model IDs are deliberately kept visible in the UI. The custom input below
 * this catalog remains available for provider IDs that are not listed here.
 */
export const LLM_PROVIDER_CATALOG: Record<ApiKeyProvider, LlmProviderCatalog> =
  {
    openai: {
      label: "OpenAI",
      models: [
        { id: "gpt-6-luna", label: "GPT-6 Luna", tier: "fast" },
        { id: "gpt-6.1-sol", label: "GPT-6.1 Sol", tier: "balanced" },
        { id: "gpt-6-astra", label: "GPT-6 Astra", tier: "best" },
      ],
    },
    gemini: {
      label: "Google Gemini",
      models: [
        {
          id: "gemini-3.1-flash-lite",
          label: "Gemini 3.1 Flash-Lite",
          tier: "fast",
        },
        {
          id: "gemini-3.8-flash",
          label: "Gemini 3.8 Flash",
          tier: "balanced",
        },
        {
          id: "gemini-3.1-pro-preview",
          label: "Gemini 3.1 Pro Preview",
          tier: "best",
        },
      ],
    },
    anthropic: {
      label: "Anthropic Claude",
      models: [
        { id: "claude-haiku-5-5", label: "Claude Haiku 5.5", tier: "fast" },
        {
          id: "claude-sonnet-5-5",
          label: "Claude Sonnet 5.5",
          tier: "balanced",
        },
        { id: "claude-opus-5-5", label: "Claude Opus 5.5", tier: "best" },
        {
          id: "claude-fable-5-1",
          label: "Claude Fable 5.1",
          tier: "best",
        },
      ],
    },
    openrouter: {
      label: "OpenRouter",
      models: [
        {
          id: "openai/gpt-6-luna",
          label: "OpenAI / GPT-6 Luna",
          tier: "fast",
        },
        {
          id: "google/gemini-3.8-flash",
          label: "Google / Gemini 3.8 Flash",
          tier: "balanced",
        },
        {
          id: "openai/gpt-6.1-sol",
          label: "OpenAI / GPT-6.1 Sol",
          tier: "balanced",
        },
        {
          id: "openai/gpt-6-astra",
          label: "OpenAI / GPT-6 Astra",
          tier: "best",
        },
        {
          id: "anthropic/claude-opus-5.5",
          label: "Anthropic / Claude Opus 5.5",
          tier: "best",
        },
        {
          id: "anthropic/claude-fable-5.1",
          label: "Anthropic / Claude Fable 5.1",
          tier: "best",
        },
      ],
    },
    xai: {
      label: "xAI",
      models: [{ id: "grok-4.7", label: "Grok 4.7", tier: "best" }],
    },
    groq: {
      label: "Groq",
      models: [
        {
          id: "openai/gpt-oss-20b",
          label: "OpenAI / GPT-OSS 20B",
          tier: "fast",
        },
        {
          id: "qwen/qwen3.8-27b",
          label: "Qwen 3.8 27B",
          tier: "balanced",
        },
        {
          id: "openai/gpt-oss-120b",
          label: "OpenAI / GPT-OSS 120B",
          tier: "best",
        },
      ],
    },
  };

export const CUSTOM_MODEL_VALUE = "__custom__";

const MODEL_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;

export function getProviderCatalog(
  provider: ApiKeyProvider | null | undefined,
): LlmProviderCatalog | null {
  return provider ? LLM_PROVIDER_CATALOG[provider] : null;
}

export function getDefaultLlmModel(
  provider: ApiKeyProvider | null | undefined,
): string | null {
  return getProviderCatalog(provider)?.models[0]?.id ?? null;
}

export function getLlmModelSelection(
  provider: ApiKeyProvider | null | undefined,
  selectedModel: string | null | undefined = getDefaultLlmModel(provider),
): LlmModelSelection {
  if (!provider) {
    return { choice: "", customModel: "" };
  }

  const listedModels = getProviderCatalog(provider)?.models ?? [];
  const isListedModel = listedModels.some(
    (model) => model.id === selectedModel,
  );

  return {
    choice: selectedModel && isListedModel ? selectedModel : CUSTOM_MODEL_VALUE,
    customModel: selectedModel && !isListedModel ? selectedModel : "",
  };
}

export function resolveLlmModelSelection(
  choice: string,
  customModel: string,
): string {
  return choice === CUSTOM_MODEL_VALUE ? customModel.trim() : choice.trim();
}

export function validateLlmModelId(model: string): boolean {
  return MODEL_ID_PATTERN.test(model.trim());
}

export function getLlmProviderLabel(
  provider: ApiKeyProvider | null | undefined,
): string {
  return getProviderCatalog(provider)?.label ?? "Proveedor no reconocido";
}
