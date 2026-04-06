"use client";

import type { AssistantContext, ChatMessage } from "@/lib/assistant/types";

export type LLMIntent = "parser_assist" | "general";

export interface GeminiError extends Error {
  isGeminiError?: boolean;
}

export function createBotMessage(content: string): ChatMessage {
  return {
    id: `bot-${Date.now()}`,
    content,
    sender: "bot",
    timestamp: new Date(),
  };
}

export function inferIntentFromMessage(message: string): LLMIntent {
  const text = message.toLowerCase();

  const codeKeywords = [
    "begin",
    "end",
    "for ",
    "while",
    "repeat",
    "until",
    "codigo",
    "código",
    "pseudocodigo",
    "pseudocódigo",
    "syntax",
    "sintaxis",
    "implementacion",
    "implementación",
  ];

  const isCodeRelated = codeKeywords.some((keyword) => text.includes(keyword));
  return isCodeRelated ? "parser_assist" : "general";
}

export function isGeminiLikeError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  const err = error as GeminiError;
  if (err.isGeminiError) {
    return true;
  }

  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";

  return (
    rawMessage.includes("Gemini") ||
    rawMessage.includes("API_KEY") ||
    rawMessage.includes("LLM") ||
    rawMessage.includes("HTTP error! status: 400") ||
    rawMessage.includes("HTTP error! status: 500")
  );
}

export async function getLLMResponse(
  message: string,
  job: LLMIntent,
  chatHistory: ChatMessage[],
  apiKey: string | null,
  locale?: string,
  t?: (key: string) => string,
  assistantContext?: AssistantContext | null,
): Promise<string> {
  try {
    const historyForLLM = chatHistory.slice(-10).map((chatMessage) => ({
      role: chatMessage.sender === "user" ? "user" : "model",
      content: chatMessage.content,
    }));

    const body: {
      job: string;
      prompt: string;
      chatHistory: Array<{ role: string; content: string }>;
      apiKey?: string;
      locale?: string;
      assistantContext?: AssistantContext;
    } = {
      job,
      prompt: message,
      chatHistory: historyForLLM,
    };

    if (apiKey) {
      body.apiKey = apiKey;
    }
    if (locale) {
      body.locale = locale;
    }
    if (assistantContext) {
      body.assistantContext = assistantContext;
    }

    const response = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData?.error || `HTTP error! status: ${response.status}`;
      const error: GeminiError = new Error(errorMessage);
      error.isGeminiError =
        response.status === 500 ||
        response.status === 400 ||
        errorMessage.includes("Gemini") ||
        errorMessage.includes("API_KEY") ||
        errorMessage.includes("LLM");
      throw error;
    }

    const result = await response.json();

    if (!result.ok) {
      const errorMessage =
        result?.error || (t ? t("unknownLlmError") : "Unknown LLM error");
      const error: GeminiError = new Error(errorMessage);
      error.isGeminiError =
        errorMessage.includes("Gemini") ||
        errorMessage.includes("API_KEY") ||
        errorMessage.includes("LLM");
      throw error;
    }

    const content =
      result?.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    if (!content || String(content).trim().length === 0) {
      throw new Error(t ? t("emptyLlmResponse") : "Empty LLM response");
    }

    return String(content);
  } catch (error) {
    console.error("Error obteniendo respuesta LLM:", error);
    throw error;
  }
}
