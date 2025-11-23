import { NextRequest, NextResponse } from "next/server";

import {
  getJobConfig,
  GEMINI_ENDPOINT_BASE,
  JobResolvedConfig
} from "../llm-config";

export const runtime = "nodejs";

// Validar formato de API_KEY de Gemini
function validateApiKey(key: string | undefined): boolean {
  if (!key || typeof key !== 'string') {
    return false;
  }
  const API_KEY_REGEX = /^AIza[0-9A-Za-z_-]{35,40}$/;
  return API_KEY_REGEX.test(key.trim());
}

type ClassifyResponse = { kind: "iterative" | "recursive" | "hybrid" | "unknown"; method?: string };
type ClassifyRequest = { source: string; mode?: "llm" | "local" | "auto" };

type GeminiTextPart = { text?: string };
type GeminiContent = { parts?: GeminiTextPart[] };
type GeminiCandidate = { content?: GeminiContent };
type GeminiResponse = { candidates?: GeminiCandidate[] };

/**
 * Obtiene la URL base del backend API.
 * Usa API_INTERNAL_BASE_URL en Docker o API_BASE_URL/fallback en desarrollo local.
 */
function getApiBase(): string {
  const a = process.env.API_INTERNAL_BASE_URL?.replace(/\/+$/, "");
  if (a) {
    return a.startsWith('http://') || a.startsWith('https://') ? a : `https://${a}`;
  }
  const b = process.env.API_BASE_URL?.replace(/\/+$/, "");
  if (b) {
    return b.startsWith('http://') || b.startsWith('https://') ? b : `https://${b}`;
  }
  return process.env.DOCKER ? "http://api:8000" : "http://localhost:8000";
}

/**
 * Llama al backend Python para clasificar el algoritmo usando AST.
 * Esta es la fuente única de verdad para clasificación.
 */
async function classifyWithBackend(source: string): Promise<ClassifyResponse["kind"]> {
  const apiBaseUrl = getApiBase();
  const url = `${apiBaseUrl}/classify`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source }),
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[Classify API] Backend error ${response.status}: ${errorText}`);
      throw new Error(`Backend error: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    
    const data = await response.json();
    
    if (!data || typeof data !== 'object') {
      console.error(`[Classify API] Invalid backend response:`, data);
      throw new Error("Backend response is not an object");
    }
    
    if (data.ok && data.kind) {
      return data.kind as ClassifyResponse["kind"];
    } else {
      console.error(`[Classify API] Backend response invalid:`, data);
      throw new Error(`Backend response invalid: ${data.errors?.[0]?.message || 'Unknown error'}`);
}
  } catch (error) {
    console.error(`[Classify API] Error calling backend at ${url}:`, error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Failed to connect to backend at ${url}. Check if the backend is running.`);
    }
    throw error;
  }
}

type ChatMessage = { role: string; content: string };

function buildClassifyMessages(config: JobResolvedConfig, source: string): Array<ChatMessage> {
  return [
    { role: "system", content: config.systemPrompt },
    { role: "user", content: `Clasifica este código de algoritmo y responde únicamente en JSON con el formato {"kind":"iterative|recursive|hybrid|unknown"}. Código:\n\n${source}` }
  ];
}


function parseKindFromGemini(data: GeminiResponse): ClassifyResponse["kind"] | null {
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string') return null;
  try {
    const parsed = JSON.parse(text);
    const kind = parsed.kind || parsed.classification || parsed.result;
    if (["iterative", "recursive", "hybrid", "unknown"].includes(kind)) {
      return kind as ClassifyResponse["kind"];
    }
  } catch {
    return null;
  }
  return null;
}

async function callGeminiLLM(
  config: JobResolvedConfig,
  messages: Array<ChatMessage>,
  apiKey: string
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
    responseMimeType: "application/json",
  };
  const body = {
    system_instruction: systemInstruction,
    contents,
    generationConfig,
  };
  const url = `${GEMINI_ENDPOINT_BASE}/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = (errorData && (errorData.error?.message || errorData.message)) || `HTTP ${response.status}`;
    throw new Error(`Gemini Error ${response.status}: ${errorMsg}`);
  }
  return await response.json();
}

async function classifyWithLLM(source: string, apiKey: string, mode?: "llm" | "local" | "auto"): Promise<ClassifyResponse["kind"]> {
  if (mode === "local") return classifyWithBackend(source);
  const config = getJobConfig('classify');
  const messages: Array<ChatMessage> = buildClassifyMessages(config, source);
  const data = await callGeminiLLM(config, messages, apiKey);
  const kind = parseKindFromGemini(data);
  if (kind) return kind;
  console.warn(`[Classify API] Fallback a backend Python: LLM response no válida`);
  return classifyWithBackend(source);
}

export async function POST(req: NextRequest) {
  try {
    const { source, mode, apiKey } = await req.json() as ClassifyRequest & { apiKey?: string };
    if (!source || typeof source !== 'string') {
      return NextResponse.json(
        { error: "Source code is required" }, 
        { status: 400 }
      );
    }
    
    // Usar backend Python por defecto (fuente única de verdad basada en AST)
    // El LLM solo se usa si explícitamente se solicita con mode="llm" y hay API key
    let kind: ClassifyResponse["kind"];
    let method: string;
    
    try {
      // Solo usar LLM si explícitamente se solicita y hay API key disponible
      if (mode === "llm") {
        const serverApiKey = process.env.API_KEY;
        const hasServerApiKey = validateApiKey(serverApiKey);
        const geminiApiKey = hasServerApiKey ? serverApiKey : (apiKey || null);
        
        if (geminiApiKey) {
          try {
            kind = await classifyWithLLM(source, geminiApiKey, mode);
            method = "llm";
          } catch (error) {
            // Fallback a backend Python si el LLM falla
            console.warn(`[Classify API] LLM falló, usando backend Python: ${error instanceof Error ? error.message : String(error)}`);
            kind = await classifyWithBackend(source);
            method = "ast_llm_fallback";
          }
        } else {
          // No hay API key, usar backend Python
          kind = await classifyWithBackend(source);
          method = "ast_no_api_key";
        }
      } else {
        // Por defecto, usar backend Python (fuente única de verdad basada en AST)
        try {
          kind = await classifyWithBackend(source);
          method = "ast";
        } catch (error) {
          // Si falla, intentar de nuevo con mejor logging
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`[Classify API] Error inicial en backend: ${errorMessage}`);
          throw error; // Relanzar para que se maneje en el catch externo
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[Classify API] Error, usando backend Python: ${errorMessage}`);
      try {
        kind = await classifyWithBackend(source);
        method = "ast_error_fallback";
      } catch (fallbackError) {
        // Si el backend también falla, retornar unknown
        console.error(`[Classify API] Backend también falló:`, fallbackError);
        kind = "unknown";
        method = "error";
      }
    }
    return NextResponse.json({ 
      kind,
      method,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Classify API] Error: ${errorMessage}`);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: errorMessage,
      }, 
      { status: 500 }
    );
  }
}
