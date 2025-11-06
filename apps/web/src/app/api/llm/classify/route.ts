import { NextRequest, NextResponse } from "next/server";

import {
  getJobConfig,
  LLMMode,
  LOCAL_ENDPOINT,
  LOCAL_API_KEY,
  REMOTE_API_KEY,
  REMOTE_ENDPOINT_BASE,
  JobResolvedConfig
} from "../llm-config";

export const runtime = "nodejs";

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
    console.log(`[Classify API] LM Studio no disponible: ${error}`);
    return false;
  }
}

type ChatMessage = { role: string; content: string };

async function callLocalLLM(
  config: JobResolvedConfig,
  messages: Array<ChatMessage>
) {
  const requestBody = {
    messages,
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    stream: false,
    response_format: { type: "json_object" },
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

function buildClassifyMessages(config: JobResolvedConfig, source: string): Array<ChatMessage> {
  return [
    { role: "system", content: config.systemPrompt },
    { role: "user", content: `Clasifica este código de algoritmo y responde únicamente en JSON con el formato {"kind":"iterative|recursive|hybrid|unknown"}. Código:\n\n${source}` }
  ];
}

async function callLLMWithMode(
  config: JobResolvedConfig,
  messages: Array<ChatMessage>,
  mode: LLMMode
) {
  if (mode === 'LOCAL') {
    const isLMStudioAvailable = await checkLMStudioConnectivity();
    if (isLMStudioAvailable) {
      try {
        return await callLocalLLM(config, messages);
      } catch (localError) {
        const errorMessage = localError instanceof Error ? localError.message : String(localError);
        console.warn(`[Classify API] Fallback a REMOTE: Error en LM Studio - ${errorMessage}`);
        return await callRemoteLLM(config, messages);
      }
    }
    console.warn(`[Classify API] Fallback a REMOTE: LM Studio no disponible en ${LOCAL_ENDPOINT}`);
    return await callRemoteLLM(config, messages);
  }
  return await callRemoteLLM(config, messages);
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

async function callRemoteLLM(
  config: JobResolvedConfig,
  messages: Array<ChatMessage>
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
  const url = `${REMOTE_ENDPOINT_BASE}/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(REMOTE_API_KEY)}`;
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

async function classifyWithLLM(source: string, mode?: "llm" | "local" | "auto"): Promise<ClassifyResponse["kind"]> {
  if (mode === "local") return heuristicClassify(source);
  const LLM_MODE: LLMMode = (process.env.LLM_MODE as LLMMode) || 'REMOTE';
  const config = getJobConfig('classify', LLM_MODE);
  const messages: Array<ChatMessage> = buildClassifyMessages(config, source);
  const data = await callLLMWithMode(config, messages, LLM_MODE);
  const kind = parseKindFromGemini(data);
  if (kind) return kind;
  console.warn(`[Classify API] Fallback a heurística: LLM response no válida`);
  return heuristicClassify(source);
}

export async function POST(req: NextRequest) {
  try {
    const { source, mode } = await req.json() as ClassifyRequest;
    if (!source || typeof source !== 'string') {
      return NextResponse.json(
        { error: "Source code is required" }, 
        { status: 400 }
      );
    }
    let kind: ClassifyResponse["kind"];
    let method: string;
    try {
      if (mode === "local") {
        kind = heuristicClassify(source);
        method = "heuristic";
      } else {
        kind = await classifyWithLLM(source, mode);
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
      mode: (process.env.LLM_MODE as LLMMode) || 'REMOTE',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Classify API] Error: ${errorMessage}`);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: errorMessage,
        mode: (process.env.LLM_MODE as LLMMode) || 'REMOTE'
      }, 
      { status: 500 }
    );
  }
}
