import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type ClassifyResponse = { kind: "iterative" | "recursive" | "hybrid" | "unknown" };
type ClassifyRequest = { 
  source: string; 
  mode?: "llm" | "local" | "auto";
};

// ============== CONFIGURACIÓN DE MODOS ==============

type LLMMode = 'LOCAL' | 'REMOTE';

// Configuración de modo LLM
const LLM_MODE: LLMMode = (process.env.LLM_MODE as LLMMode) || 'REMOTE';

// Configuración para modo REMOTE (GitHub Models)
const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_ENDPOINT = "https://models.github.ai/inference";

// Configuración para modo LOCAL (LM Studio)
const LM_STUDIO_ENDPOINT = process.env.LM_STUDIO_ENDPOINT || "http://localhost:1234/v1";
const LM_STUDIO_API_KEY = process.env.LM_STUDIO_API_KEY || "lm-studio";

// ============== INTERFACES ==============

interface LLMRequest {
  messages: Array<{ role: string; content: string }>;
  model: string;
  temperature: number;
  max_completion_tokens: number;
  response_format?: { type: string };
}

interface LMStudioRequest {
  messages: Array<{ role: string; content: string }>;
  model: string;
  temperature: number;
  max_tokens: number;
  stream?: boolean;
  response_format?: { type: string };
}

// ============== PROMPT DE CLASIFICACIÓN ==============

const ALGORITHM_CLASSIFIER_PROMPT = `Eres un clasificador especializado en algoritmos de programación.

OBJETIVO: Clasificar código de algoritmos en una de estas categorías:

CATEGORÍAS:
1. "iterative" - Algoritmos que usan bucles (for, while, repeat) sin recursión
2. "recursive" - Algoritmos que se llaman a sí mismos recursivamente
3. "hybrid" - Algoritmos que combinan bucles y recursión
4. "unknown" - Código que no se puede clasificar claramente

REGLAS DE CLASIFICACIÓN:
- Si hay bucles (for, while, repeat) Y NO hay llamadas recursivas → "iterative"
- Si hay llamadas recursivas Y NO hay bucles → "recursive"  
- Si hay AMBOS bucles y recursión → "hybrid"
- Si no hay ni bucles ni recursión → "unknown"

INSTRUCCIONES:
- Analiza el código proporcionado
- Identifica la presencia de bucles y recursión
- Responde ÚNICAMENTE con una de las categorías: iterative, recursive, hybrid, unknown
- No agregues explicaciones adicionales`;

// ============== FUNCIÓN HEURÍSTICA ==============

function heuristicClassify(source: string): ClassifyResponse["kind"] {
  try {
    const text = source.toLowerCase();
    
    // Detectar bucles iterativos
    const hasIterative = /\b(for|while|repeat)\b/.test(text);
    
    // Detectar llamadas recursivas (búsqueda simple)
    const lines = source.split('\n');
    let procedureName = '';
    
    // Buscar definición de procedimiento
    const procRegex = /\b(procedure|function)\s+(\w+)/i;
    for (const line of lines) {
      const procMatch = procRegex.exec(line);
      if (procMatch) {
        procedureName = procMatch[2].toLowerCase();
        break;
      }
    }
    
    // Buscar llamadas recursivas
    let hasRecursive = false;
    if (procedureName) {
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        if ((lowerLine.includes(procedureName) && lowerLine.includes('call')) || 
            (lowerLine.includes(procedureName) && lowerLine.includes('('))) {
          hasRecursive = true;
          break;
        }
      }
    }
    
    // Clasificación
    if (hasIterative && hasRecursive) {
      return "hybrid";
    } else if (hasRecursive) {
      return "recursive";
    } else if (hasIterative) {
      return "iterative";
    }
    
    return "unknown";
  } catch {
    return "unknown";
  }
}

// ============== FUNCIONES DE CONECTIVIDAD ==============

/**
 * Verifica si LM Studio está disponible
 */
async function checkLMStudioConnectivity(): Promise<boolean> {
  try {
    const response = await fetch(`${LM_STUDIO_ENDPOINT}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${LM_STUDIO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(5000), // 5 segundos timeout
    });
    return response.ok;
  } catch (error) {
    console.log(`[Classify API] LM Studio no disponible: ${error}`);
    return false;
  }
}

// ============== FUNCIONES DE LLM ==============

/**
 * Llama al LLM local usando LM Studio
 */
async function callLocalLLM(messages: Array<{ role: string; content: string }>) {
  const requestBody: LMStudioRequest = {
    messages,
    model: "qwen/qwen3-4b-2507", // Modelo local para clasificación
    temperature: 0.1,
    max_tokens: 50,
    stream: false,
    response_format: { type: "json_object" }
  };

  const response = await fetch(`${LM_STUDIO_ENDPOINT}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LM_STUDIO_API_KEY}`,
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

/**
 * Llama al LLM remoto usando GitHub Models
 */
async function callRemoteLLM(messages: Array<{ role: string; content: string }>) {
  const requestBody: LLMRequest = {
    messages,
    model: "grok-3-mini",
    temperature: 0,
    max_completion_tokens: 50,
    response_format: { type: "json_object" }
  };

  const response = await fetch(`${GITHUB_ENDPOINT}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
    throw new Error(`GitHub Models Error ${response.status}: ${errorMsg}`);
  }

  return await response.json();
}

// ============== FUNCIÓN PRINCIPAL DE CLASIFICACIÓN ==============

async function classifyWithLLM(source: string, mode?: "llm" | "local" | "auto"): Promise<ClassifyResponse["kind"]> {
  // Si se especifica modo "local", usar heurística directamente
  if (mode === "local") {
    return heuristicClassify(source);
  }

  // Construir mensajes para el LLM
  const messages = [
    { role: "system", content: ALGORITHM_CLASSIFIER_PROMPT },
    { role: "user", content: `Clasifica este código de algoritmo:\n\n${source}` }
  ];

  console.log(`[Classify API] Modo: ${LLM_MODE}, Source length: ${source.length}`);

  let data;
  
  if (LLM_MODE === 'LOCAL') {
    // Verificar conectividad antes de intentar usar LOCAL
    const isLMStudioAvailable = await checkLMStudioConnectivity();
    
    if (isLMStudioAvailable) {
      try {
        data = await callLocalLLM(messages);
      } catch (localError) {
        const errorMessage = localError instanceof Error ? localError.message : String(localError);
        console.warn(`[Classify API] Fallback a REMOTE: Error en LM Studio - ${errorMessage}`);
        data = await callRemoteLLM(messages);
      }
    } else {
      console.warn(`[Classify API] Fallback a REMOTE: LM Studio no disponible en ${LM_STUDIO_ENDPOINT}`);
      data = await callRemoteLLM(messages);
    }
  } else {
    data = await callRemoteLLM(messages);
  }

  // Extraer la clasificación de la respuesta
  const content = data?.choices?.[0]?.message?.content;
  if (content) {
    try {
      const parsed = JSON.parse(content);
      const kind = parsed.kind || parsed.classification || parsed.result;
      if (["iterative", "recursive", "hybrid", "unknown"].includes(kind)) {
        return kind as ClassifyResponse["kind"];
      }
    } catch (parseError) {
      console.warn(`[Classify API] Error parsing LLM response: ${parseError}`);
    }
  }

  // Fallback a heurística si el LLM no responde correctamente
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

    console.log(`[Classify API] Request - Source length: ${source.length}, Mode: ${mode || 'auto'}`);

    // Intentar clasificar con LLM o heurística según el modo
    let kind: ClassifyResponse["kind"];
    let method: string;
    
    try {
      if (mode === "local") {
        // Forzar modo heurístico
        kind = heuristicClassify(source);
        method = "heuristic";
      } else {
        // Usar LLM con fallback automático
        kind = await classifyWithLLM(source, mode);
        method = LLM_MODE === 'LOCAL' ? "llm_local" : "llm_remote";
      }
    } catch (error) {
      // Fallback a heurística si falla el LLM
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`[Classify API] Fallback a heurística: ${errorMessage}`);
      kind = heuristicClassify(source);
      method = "heuristic_fallback";
    }

    console.log(`[Classify API] Result - Kind: ${kind}, Method: ${method}`);

    return NextResponse.json({ 
      kind,
      method,
      mode: LLM_MODE,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Classify API] Error: ${errorMessage}`);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: errorMessage,
        mode: LLM_MODE
      }, 
      { status: 500 }
    );
  }
}
