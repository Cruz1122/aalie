import { NextRequest } from "next/server";

import {
  buildAssistantSystemSupplement,
  formatAssistantContextForPrompt,
} from "@/lib/assistant/context-format";
import type { AssistantContext } from "@/lib/assistant/types";

import {
  getJobConfig,
  GEMINI_ENDPOINT_BASE,
  JobResolvedConfig,
} from "./llm-config";

export const runtime = "nodejs";

type ChatMessage = { role: string; content: string };

function isQuotaLikeError(message: string): boolean {
  return /quota|resource exhausted|resource_exhausted|billing|insufficient quota/i.test(
    message,
  );
}

async function callGeminiLLM(
  config: JobResolvedConfig,
  messages: Array<ChatMessage>,
  apiKey: string,
  schema?: { type: string },
  disableThinking = false,
) {
  const systemInstruction = {
    parts: [{ text: config.systemPrompt }],
  };
  const contents = messages
    .filter((m: ChatMessage) => m.role !== "system")
    .map((m: ChatMessage) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));
  const generationConfig = {
    temperature: config.temperature,
    maxOutputTokens: config.maxTokens,
    ...(schema ? { responseMimeType: "application/json" } : {}),
    ...(disableThinking ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
  };
  const body = {
    system_instruction: systemInstruction,
    contents,
    generationConfig,
  };
  const bodyWithoutThinking = {
    system_instruction: systemInstruction,
    contents,
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      ...(schema ? { responseMimeType: "application/json" } : {}),
    },
  };
  const url = `${GEMINI_ENDPOINT_BASE}/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  let response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok && disableThinking && response.status === 400) {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(bodyWithoutThinking),
    });
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg =
      (errorData && (errorData.error?.message || errorData.message)) ||
      `HTTP ${response.status}`;
    const providerStatus = String(errorData?.error?.status || "");
    const rawCombined = `${providerStatus} ${errorMsg}`.trim();

    if (response.status === 429) {
      if (isQuotaLikeError(rawCombined)) {
        throw new Error(`LLM_QUOTA_EXCEEDED: ${errorMsg}`);
      }
      throw new Error(`LLM_RATE_LIMIT: ${errorMsg}`);
    }

    if (response.status === 403 && isQuotaLikeError(rawCombined)) {
      throw new Error(`LLM_QUOTA_EXCEEDED: ${errorMsg}`);
    }

    if (response.status === 408 || response.status === 504) {
      throw new Error(`LLM_TIMEOUT: ${errorMsg}`);
    }

    if (response.status >= 500) {
      throw new Error(`LLM_SERVER_ERROR: ${errorMsg}`);
    }

    throw new Error(`Gemini Error ${response.status}: ${errorMsg}`);
  }
  return await response.json();
}

// Validar formato de API_KEY de Gemini
function validateApiKey(key: string | undefined): boolean {
  if (!key || typeof key !== "string") {
    return false;
  }
  const API_KEY_REGEX = /^AIza[0-9A-Za-z_-]{35,40}$/;
  return API_KEY_REGEX.test(key.trim());
}

export async function POST(req: NextRequest) {
  try {
    const {
      job = "general",
      prompt,
      schema,
      context,
      assistantContext,
      chatHistory,
      apiKey,
      locale,
    } = await req.json();

    // Obtener API_KEY: prioridad a variables de entorno del servidor, luego al parámetro del request
    // Si hay API_KEY en el servidor, no se requiere que el cliente la envíe
    const serverApiKey = process.env.API_KEY;
    const hasServerApiKey = validateApiKey(serverApiKey);

    // Usar API_KEY del servidor si está disponible, si no, usar la del cliente
    const geminiApiKey = hasServerApiKey ? serverApiKey : apiKey || null;

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({
          ok: false,
          error:
            "API_KEY no proporcionada. Por favor, configura tu API_KEY de Gemini o configura API_KEY en las variables de entorno del servidor.",
        }),
        {
          status: 400,
          headers: { "content-type": "application/json" },
        },
      );
    }

    const config = getJobConfig(job, locale);
    const resolvedAssistantContext = assistantContext as
      | AssistantContext
      | undefined;
    const effectiveConfig: JobResolvedConfig = resolvedAssistantContext
      ? {
          ...config,
          systemPrompt: `${config.systemPrompt}\n\n${buildAssistantSystemSupplement(
            resolvedAssistantContext,
          )}`,
        }
      : config;
    const promptBlocks = [
      resolvedAssistantContext
        ? formatAssistantContextForPrompt(resolvedAssistantContext)
        : null,
      context ? `Contexto adicional: ${context}` : null,
      prompt,
    ].filter((entry): entry is string => Boolean(entry));
    const userPrompt = promptBlocks.join("\n\n");
    const messages = [
      { role: "system", content: effectiveConfig.systemPrompt },
    ];
    if (chatHistory && Array.isArray(chatHistory)) {
      messages.push(...chatHistory.slice(-10));
    }
    messages.push({ role: "user", content: userPrompt });

    // Usar schema del job si está definido, o el schema del request
    const finalSchema = effectiveConfig.schema || schema;
    const data = await callGeminiLLM(
      effectiveConfig,
      messages,
      geminiApiKey,
      finalSchema,
      (job as string) === "compare",
    );

    return new Response(
      JSON.stringify({
        ok: true,
        data,
        model: effectiveConfig.model,
      }),
      {
        status: 200,
        headers: { "content-type": "application/json" },
      },
    );
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[LLM API] Error:`, error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "content-type": "application/json" },
      },
    );
  }
}
