import { describe, expect, it } from "vitest";

import {
  CUSTOM_MODEL_VALUE,
  getDefaultLlmModel,
  getProviderCatalog,
  validateLlmModelId,
} from "@/lib/llm-model-catalog";

describe("llm-model-catalog", () => {
  it("keeps a fast, balanced, and best option for supported providers", () => {
    const catalog = getProviderCatalog("openai");

    expect(catalog?.models.map((model) => model.tier)).toEqual([
      "fast",
      "balanced",
      "best",
    ]);
    expect(getDefaultLlmModel("openai")).toBe("gpt-6-luna");
    expect(catalog?.models.map((model) => model.id)).toEqual([
      "gpt-6-luna",
      "gpt-6.1-sol",
      "gpt-6-astra",
    ]);
    expect(
      getProviderCatalog("gemini")?.models.map((model) => model.id),
    ).toEqual([
      "gemini-3.1-flash-lite",
      "gemini-3.8-flash",
      "gemini-3.1-pro-preview",
    ]);
    expect(
      getProviderCatalog("anthropic")?.models.map((model) => model.id),
    ).toContain("claude-fable-5-1");
  });

  it("accepts exact provider model IDs while rejecting unsafe values", () => {
    expect(validateLlmModelId("anthropic/claude-opus-5.5")).toBe(true);
    expect(validateLlmModelId(CUSTOM_MODEL_VALUE)).toBe(false);
    expect(validateLlmModelId("gpt 5; drop table")).toBe(false);
    expect(validateLlmModelId("")).toBe(false);
  });
});
