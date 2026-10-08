"use client";

import { useEffect, useRef, useState } from "react";

import {
  CUSTOM_MODEL_VALUE,
  getLlmModelSelection,
  resolveLlmModelSelection,
  validateLlmModelId,
  type ApiKeyProvider,
} from "@/lib/llm-model-catalog";
import { detectApiKeyProvider, getSelectedApiModel } from "@/hooks/useApiKey";

export function useApiKeyModelSelection(apiKey: string) {
  const provider = detectApiKeyProvider(apiKey);
  const [modelChoice, setModelChoice] = useState("");
  const [customModel, setCustomModel] = useState("");
  const previousProviderRef = useRef<ApiKeyProvider | null>(null);

  useEffect(() => {
    if (provider === previousProviderRef.current) return;

    previousProviderRef.current = provider;
    const selection = getLlmModelSelection(
      provider,
      getSelectedApiModel(provider),
    );
    setModelChoice(selection.choice);
    setCustomModel(selection.customModel);
  }, [provider]);

  const handleModelChoiceChange = (choice: string) => {
    setModelChoice(choice);
    if (choice !== CUSTOM_MODEL_VALUE) {
      setCustomModel("");
    }
  };

  const selectedModel = resolveLlmModelSelection(modelChoice, customModel);

  return {
    provider,
    modelChoice,
    customModel,
    selectedModel,
    isSelectedModelValid: validateLlmModelId(selectedModel),
    setModelChoice: handleModelChoiceChange,
    setCustomModel,
  };
}
