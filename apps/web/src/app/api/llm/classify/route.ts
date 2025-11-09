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

type ClassifyResponse = { kind: "iterative" | "recursive" | "hybrid" | "unknown" };
type ClassifyRequest = { source: string; mode?: "llm" | "local" | "auto" };

type GeminiTextPart = { text?: string };
type GeminiContent = { parts?: GeminiTextPart[] };
type GeminiCandidate = { content?: GeminiContent };
type GeminiResponse = { candidates?: GeminiCandidate[] };

function getProcedureName(source: string): string {
  const lines = source.split('\n');
  const procRegex = /\b(procedure|function)\s+(\w+)/i;
  for (const line of lines) {
    const procMatch = procRegex.exec(line);
    if (procMatch) return procMatch[2].toLowerCase();
  }
  return '';
}

function hasRecursiveCall(lines: string[], procedureName: string): boolean {
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if ((lowerLine.includes(procedureName) && lowerLine.includes('call')) ||
        (lowerLine.includes(procedureName) && lowerLine.includes('('))) {
      return true;
    }
  }
  return false;
}

function classifyByFlags(hasIterative: boolean, hasRecursive: boolean): ClassifyResponse["kind"] {
  if (hasIterative && hasRecursive) return "hybrid";
  if (hasRecursive) return "recursive";
  if (hasIterative) return "iterative";
  return "unknown";
}

function heuristicClassify(source: string): ClassifyResponse["kind"] {
  try {
    const text = source.toLowerCase();
    const hasIterative = /\b(for|while|repeat)\b/.test(text);
    const lines = source.split('\n');
    const procedureName = getProcedureName(source);
    const hasRecursive = procedureName ? hasRecursiveCall(lines, procedureName) : false;
    return classifyByFlags(hasIterative, hasRecursive);
  } catch {
    return "unknown";
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
  if (mode === "local") return heuristicClassify(source);
  const config = getJobConfig('classify');
  const messages: Array<ChatMessage> = buildClassifyMessages(config, source);
  const data = await callGeminiLLM(config, messages, apiKey);
  const kind = parseKindFromGemini(data);
  if (kind) return kind;
  console.warn(`[Classify API] Fallback a heurística: LLM response no válida`);
  return heuristicClassify(source);
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
    
    // Obtener API_KEY: prioridad a variables de entorno del servidor, luego al parámetro del request
    // Si hay API_KEY en el servidor, no se requiere que el cliente la envíe
    const serverApiKey = process.env.API_KEY;
    const hasServerApiKey = validateApiKey(serverApiKey);
    
    // Usar API_KEY del servidor si está disponible, si no, usar la del cliente
    const geminiApiKey = hasServerApiKey ? serverApiKey : (apiKey || null);
    
    let kind: ClassifyResponse["kind"];
    let method: string;
    try {
      if (mode === "local") {
        kind = heuristicClassify(source);
        method = "heuristic";
      } else if (!geminiApiKey) {
        // Si no hay API_KEY, usar heurística
        kind = heuristicClassify(source);
        method = "heuristic_no_api_key";
      } else {
        kind = await classifyWithLLM(source, geminiApiKey, mode);
        method = "llm";
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[Classify API] Fallback a heurística: ${errorMessage}`);
      kind = heuristicClassify(source);
      method = "heuristic_fallback";
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
