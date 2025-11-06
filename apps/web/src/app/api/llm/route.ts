import { NextRequest } from "next/server";

import {
  getJobConfig,
  LLMMode,
  LOCAL_ENDPOINT,
  LOCAL_API_KEY,
  REMOTE_API_KEY,
  REMOTE_ENDPOINT_BASE,
  JobResolvedConfig
} from "./llm-config";

export const runtime = "nodejs";

async function checkLMStudioConnectivity(): Promise<boolean> {
  try {
    const response = await fetch(`${LOCAL_ENDPOINT}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LOCAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    console.log(`[LLM API] LM Studio no disponible: ${error}`);
    return false;
  }
}

type ChatMessage = { role: string; content: string };

async function callLocalLLM(
  config: JobResolvedConfig,
  messages: Array<ChatMessage>,
  schema?: { type: string }
) {
  const requestBody = {
    messages,
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: false,
    ...(schema ? { response_format: { type: "json_object" } } : {}),
  };
  const response = await fetch(`${LOCAL_ENDPOINT}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOCAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
    throw new Error(`LM Studio Error ${response.status}: ${errorMsg}`);
  }
  return await response.json();
}

async function callRemoteLLM(
  config: JobResolvedConfig,
  messages: Array<ChatMessage>,
  schema?: { type: string }
) {
  const systemInstruction = {
    parts: [{ text: config.systemPrompt }],
  };
  const contents = messages.filter((m: ChatMessage) => m.role !== 'system').map((m: ChatMessage) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }));
  const generationConfig = {
    temperature: config.temperature,
    maxOutputTokens: config.maxTokens,
    ...(schema ? { responseMimeType: "application/json" } : {}),
  };
  const body = {
    system_instruction: systemInstruction,
    contents,
    generationConfig,
  };
  const url = `${REMOTE_ENDPOINT_BASE}/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(REMOTE_API_KEY)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = (errorData && (errorData.error?.message || errorData.message)) || `HTTP ${response.status}`;
    throw new Error(`Gemini Error ${response.status}: ${errorMsg}`);
  }
  return await response.json();
}

export async function POST(req: NextRequest) {
  try {
    const { job = 'general', prompt, schema, context, chatHistory } = await req.json();
    const LLM_MODE: LLMMode = (process.env.LLM_MODE as LLMMode) || 'REMOTE';
    const config = getJobConfig(job, LLM_MODE);
    const userPrompt = context ? `Contexto adicional: ${context}\n\n${prompt}` : prompt;
    const messages = [
      { role: "system", content: config.systemPrompt },
    ];
    if (chatHistory && Array.isArray(chatHistory)) {
      messages.push(...chatHistory.slice(-10));
    }
    messages.push({ role: 'user', content: userPrompt });
    let data;
    let actualMode = LLM_MODE;
    if (LLM_MODE === 'LOCAL') {
      const isLMStudioAvailable = await checkLMStudioConnectivity();
      if (isLMStudioAvailable) {
        try {
          data = await callLocalLLM(config, messages, schema);
        } catch (localError) {
          const errorMessage = localError instanceof Error ? localError.message : String(localError);
          console.warn(`[LLM API] Fallback a REMOTE: Error en LM Studio - ${errorMessage}`);
          actualMode = 'REMOTE';
          data = await callRemoteLLM(config, messages, schema);
        }
      } else {
        console.warn(`[LLM API] Fallback a REMOTE: LM Studio no disponible en ${LOCAL_ENDPOINT}`);
        actualMode = 'REMOTE';
        data = await callRemoteLLM(config, messages, schema);
      }
    } else {
      data = await callRemoteLLM(config, messages, schema);
    }
    // Normalización para intent-classify: eliminar saltos y restringir valores
    let intent: string | undefined;
    if ((job as string) === 'classify') {
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const trimmed = typeof text === 'string' ? text.trim().toLowerCase() : '';
      intent = trimmed === 'parser_assist' ? 'parser_assist' : 'general';
      // Mantener coherencia en data para consumidores existentes
      if (data?.candidates?.[0]?.content?.parts?.[0]) {
        data.candidates[0].content.parts[0].text = intent;
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      data,
      ...(intent ? { intent } : {}),
      mode: LLM_MODE,
      actualMode: actualMode,
      model: config.model,
      fallbackUsed: actualMode !== LLM_MODE
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[LLM API] Error en modo:`, error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error.message,
    }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
