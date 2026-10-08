import { beforeEach, describe, expect, it } from "vitest";

import {
  detectApiKeyProvider,
  getApiKey,
  getSelectedApiModel,
  setApiKey,
  setSelectedApiModel,
} from "@/hooks/useApiKey";

describe("useApiKey provider detection", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it.each([
    ["AIzaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "gemini"],
    ["sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "openai"],
    ["sk-ant-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "anthropic"],
    ["sk-or-v1-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "openrouter"],
    ["xai-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "xai"],
    ["gsk_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "groq"],
  ] as const)("detects %s as %s", (key, provider) => {
    expect(detectApiKeyProvider(key)).toBe(provider);
  });

  it("persists a model preference per detected provider", () => {
    expect(setApiKey("sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")).toBe(true);
    expect(getSelectedApiModel()).toBe("gpt-6-luna");
    expect(setSelectedApiModel("gpt-6-astra")).toBe(true);
    expect(getSelectedApiModel()).toBe("gpt-6-astra");
  });

  it("keeps the client API key in session storage and migrates legacy storage", () => {
    expect(setApiKey("sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")).toBe(true);
    expect(sessionStorage.getItem("llm_api_key")).toBe(
      "sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    );
    expect(localStorage.getItem("llm_api_key")).toBeNull();

    localStorage.setItem(
      "llm_api_key",
      "sk-proj-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    );
    sessionStorage.clear();

    expect(getApiKey()).toBe("sk-proj-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");
    expect(sessionStorage.getItem("llm_api_key")).toBe(
      "sk-proj-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    );
    expect(localStorage.getItem("llm_api_key")).toBeNull();
  });
});
