import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import {
  getEmbeddedAssistantChatStorageKey,
  getAssistantChatStorageKey,
  useChatHistory,
} from "@/hooks/useChatHistory";
import type { ChatMessage } from "@/lib/assistant/types";

const buildMessage = (id: string): ChatMessage => ({
  id,
  content: "hola",
  sender: "user",
  timestamp: new Date("2026-04-05T10:00:00.000Z"),
});

describe("useChatHistory", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("shares embedded assistant history across surfaces in localStorage", () => {
    const analyzerKey = getAssistantChatStorageKey("analyzer");
    const examplesKey = getAssistantChatStorageKey("examples");

    const analyzerHistory = renderHook(() =>
      useChatHistory(analyzerKey, { storage: "local" }),
    );
    act(() => {
      analyzerHistory.result.current.setMessages([buildMessage("analyzer-1")]);
    });

    const examplesHistory = renderHook(() =>
      useChatHistory(examplesKey, { storage: "local" }),
    );
    expect(examplesHistory.result.current.messages).toHaveLength(1);
    expect(examplesHistory.result.current.messages[0]?.id).toBe("analyzer-1");
  });

  it("migrates embedded history from sessionStorage when localStorage is empty", () => {
    const storageKey = getEmbeddedAssistantChatStorageKey();
    sessionStorage.setItem(
      storageKey,
      JSON.stringify([buildMessage("legacy-1")]),
    );

    const history = renderHook(() =>
      useChatHistory(storageKey, {
        storage: "local",
        fallbackStorage: "session",
      }),
    );

    expect(history.result.current.messages).toHaveLength(1);
    expect(history.result.current.messages[0]?.id).toBe("legacy-1");
    expect(localStorage.getItem(storageKey)).toContain("legacy-1");
  });
});
