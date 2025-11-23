import { NextRequest } from "next/server";

import {
  getJobConfig,
  GEMINI_ENDPOINT_BASE,
  JobResolvedConfig
} from "./llm-config";

export const runtime = "nodejs";

type ChatMessage = { role: string; content: string };

async function callGeminiLLM(
  config: JobResolvedConfig,
  messages: Array<ChatMessage>,
  apiKey: string,
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
  const url = `${GEMINI_ENDPOINT_BASE}/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
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

// Validar formato de API_KEY de Gemini
function validateApiKey(key: string | undefined): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }
  const API_KEY_REGEX = /^AIza[0-9A-Za-z_-]{35,40}$/;
  return API_KEY_REGEX.test(key.trim());
}

export async function POST(req: NextRequest) {
  try {
    const { job = 'general', prompt, schema, context, chatHistory, apiKey } = await req.json();
    
    // Obtener API_KEY: prioridad a variables de entorno del servidor, luego al parámetro del request
    // Si hay API_KEY en el servidor, no se requiere que el cliente la envíe
    const serverApiKey = process.env.API_KEY;
    const hasServerApiKey = validateApiKey(serverApiKey);
    
    // Usar API_KEY del servidor si está disponible, si no, usar la del cliente
    const geminiApiKey = hasServerApiKey ? serverApiKey : (apiKey || null);
    
    if (!geminiApiKey) {
      return new Response(JSON.stringify({ 
        ok: false, 
        error: "API_KEY no proporcionada. Por favor, configura tu API_KEY de Gemini o configura API_KEY en las variables de entorno del servidor.",
      }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    
    const config = getJobConfig(job);
    const userPrompt = context ? `Contexto adicional: ${context}\n\n${prompt}` : prompt;
    const messages = [
      { role: "system", content: config.systemPrompt },
    ];
    if (chatHistory && Array.isArray(chatHistory)) {
      messages.push(...chatHistory.slice(-10));
    }
    messages.push({ role: 'user', content: userPrompt });
    
    // Usar schema del job si está definido, o el schema del request
    const finalSchema = config.schema || schema;
    const data = await callGeminiLLM(config, messages, geminiApiKey, finalSchema);
    
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
      model: config.model,
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[LLM API] Error:`, error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error.message,
    }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
