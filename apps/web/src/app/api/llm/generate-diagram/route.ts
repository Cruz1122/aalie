import { NextRequest, NextResponse } from "next/server";

import { GEMINI_ENDPOINT_BASE } from "../llm-config";
import { getGenerateDiagramSystemPrompt } from "../prompts/generate-diagram";

export const runtime = "nodejs";

async function callGeminiLLM(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
) {
  const systemInstruction = {
    parts: [{ text: systemPrompt }],
  };
  const contents = [
    {
      role: "user",
      parts: [{ text: userPrompt }],
    },
  ];
  const generationConfig = {
    temperature: 0.3,
    maxOutputTokens: 3000,
    responseMimeType: "application/json",
  };
  const body = {
    system_instruction: systemInstruction,
    contents,
    generationConfig,
  };
  
  // Usar el modelo general
  const model = "gemini-2.0-flash";
  const url = `${GEMINI_ENDPOINT_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMsg =
      (errorData && (errorData.error?.message || errorData.message)) ||
      `HTTP ${response.status}`;
    throw new Error(`Gemini Error ${response.status}: ${errorMsg}`);
  }
  return await response.json();
}

function validateApiKey(key: string | undefined): boolean {
  if (!key || typeof key !== "string") {
    return false;
  }
  const API_KEY_REGEX = /^AIza[0-9A-Za-z_-]{35,40}$/;
  return API_KEY_REGEX.test(key.trim());
}

export async function POST(req: NextRequest) {
  try {
    const { trace, source, case: caseType, locale, apiKey: clientApiKeyFromBody } = await req.json();

    if (!trace || !source) {
      return NextResponse.json(
        {
          ok: false,
          error: "Se requiere trace y source",
        },
        { status: 400 }
      );
    }

    // Obtener API_KEY: prioridad a variables de entorno del servidor, luego al parámetro del request
    const serverApiKey = process.env.API_KEY;
    const hasServerApiKey = validateApiKey(serverApiKey);
    // En el servidor, getApiKey() siempre retorna null, así que usamos el parámetro del body
    const geminiApiKey = hasServerApiKey ? serverApiKey : (clientApiKeyFromBody || null);

    if (!geminiApiKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "API_KEY no proporcionada. Por favor, configura tu API_KEY de Gemini.",
        },
        { status: 400 }
      );
    }

    // Construir prompt para el LLM según el idioma del usuario
    const systemPrompt = getGenerateDiagramSystemPrompt(locale);

    const userPrompt = `Analiza el siguiente rastro de ejecución y construye el grafo para React Flow según las reglas indicadas.

1) PSEUDOCÓDIGO DEL ALGORITMO:
\`\`\`pseudocode
${source}
\`\`\`

2) CASO DE EJECUCIÓN:
${caseType}

3) RASTRO DE EJECUCIÓN (trace):
${JSON.stringify(trace, null, 2)}

IMPORTANTE: Para cada paso en trace.steps, estima microsegundos y tokens según el tipo de instrucción y su complejidad. Incluye estos valores en el objeto "stepCosts" mapeando step_number a {microseconds, tokens}.

Devuelve ÚNICAMENTE un objeto JSON válido con la estructura { "graph": { "nodes": [...], "edges": [...] }, "stepCosts": { "step_number": { "microseconds": number, "tokens": number } }, "explanation": "..." }.`;

    const response = await callGeminiLLM(systemPrompt, userPrompt, geminiApiKey);

    // Extraer respuesta del LLM
    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let result: unknown;
    try {
      result = typeof text === "string" ? JSON.parse(text) : text;
    } catch {
      // Si no es JSON válido, devolver un grafo vacío y la respuesta cruda como explicación
      result = {
        graph: { nodes: [], edges: [] },
        explanation:
          typeof text === "string"
            ? text
            : "No se pudo interpretar la respuesta del modelo como JSON.",
      };
    }

    // Normalizar y validar el grafo devuelto por el modelo
    const rawGraph =
      result &&
      typeof result === "object" &&
      (result as { graph?: unknown }).graph &&
      typeof (result as { graph: unknown }).graph === "object"
        ? ((result as { graph: unknown }).graph as {
            nodes?: Array<{
              id: string;
              type?: string;
              position?: { x: number; y: number };
              data?: { label?: string; microseconds?: number; tokens?: number };
              parentId?: string;
            }>;
            edges?: Array<{
              id: string;
              source?: string;
              target?: string;
              label?: string;
              type?: string;
            }>;
          })
        : { nodes: [], edges: [] };

    const nodes = Array.isArray(rawGraph.nodes) ? rawGraph.nodes : [];
    const nodeIdSet = new Set(nodes.map((n) => n.id));

    // Filtrar edges inválidos y asegurar label string
    const rawEdges = Array.isArray(rawGraph.edges) ? rawGraph.edges : [];
    const safeEdges = rawEdges
      .filter(
        (e) =>
          e &&
          typeof e.id === "string" &&
          typeof e.source === "string" &&
          typeof e.target === "string" &&
          nodeIdSet.has(e.source) &&
          nodeIdSet.has(e.target),
      )
      .map((e) => ({
        ...e,
        label:
          typeof e.label === "string"
            ? e.label
            : // Forzar string aunque el modelo no lo haya mandado
              "",
        type: e.type ?? "default",
      }));

    const safeGraph = {
      nodes: nodes.map((n) => ({
        ...n,
        type: n.type ?? "default",
        data: {
          label: n.data?.label ?? "",
          microseconds: typeof n.data?.microseconds === "number" ? n.data.microseconds : undefined,
          tokens: typeof n.data?.tokens === "number" ? n.data.tokens : undefined,
        },
      })),
      edges: safeEdges,
    };

    const safeExplanation =
      result &&
      typeof result === "object" &&
      typeof (result as { explanation?: unknown }).explanation === "string"
        ? (result as { explanation: string }).explanation
        : "";

    // Extraer stepCosts si existe
    const stepCosts =
      result &&
      typeof result === "object" &&
      (result as { stepCosts?: unknown }).stepCosts &&
      typeof (result as { stepCosts: unknown }).stepCosts === "object"
        ? (result as { stepCosts: Record<string, { microseconds?: number; tokens?: number }> }).stepCosts
        : undefined;

    return NextResponse.json({
      ok: true,
      graph: safeGraph,
      explanation: safeExplanation,
      stepCosts: stepCosts,
    });
  } catch (error) {
    console.error("[Generate Diagram API] Error:", error);

    const rawMessage =
      error instanceof Error ? error.message : "Error desconocido al generar el diagrama";

    const friendlyMessage = rawMessage.includes("fetch failed")
      ? "No se pudo contactar al LLM (servicio externo)."
      : rawMessage;

    return NextResponse.json(
      {
        ok: false,
        error: friendlyMessage,
      },
      { status: 503 }
    );
  }
}

