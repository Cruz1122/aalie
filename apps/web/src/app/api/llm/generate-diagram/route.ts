import { NextRequest, NextResponse } from "next/server";
import { getApiKey } from "@/hooks/useApiKey";
import { GEMINI_ENDPOINT_BASE } from "../llm-config";

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
  const model = "gemini-2.0-flash-lite";
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
    const { trace, source, case: caseType } = await req.json();

    if (!trace || !source) {
      return NextResponse.json(
        {
          ok: false,
          error: "Se requiere trace y source",
        },
        { status: 400 }
      );
    }

    // Obtener API_KEY
    const serverApiKey = process.env.API_KEY;
    const hasServerApiKey = validateApiKey(serverApiKey);
    const clientApiKey = getApiKey();
    const geminiApiKey = hasServerApiKey ? serverApiKey : clientApiKey || null;

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

    // Construir prompt para el LLM orientado a React Flow
    const systemPrompt = `Eres un asistente especializado en transformar rastros de ejecución de algoritmos en diagramas de flujo interactivos usando React Flow.

CONTEXTO DEL SISTEMA
- El backend ya ha analizado el algoritmo y generado un rastro de ejecución JSON (trace).
- El rastro describe pasos concretos de ejecución: número de paso, línea, tipo (assign, if, for, while, call, return, etc.), valores de variables, información de iteración/recursión, etc.
- Tu tarea NO es analizar complejidad ni corregir el algoritmo. Tu única responsabilidad es CONSTRUIR un diagrama entendible a partir de ese rastro y redactar una explicación corta.
- El frontend usará React Flow para renderizar el grafo. Necesitamos que devuelvas nodos y aristas en un formato JSON muy específico.

ENTRADAS QUE RECIBIRÁS
1) Pseudocódigo del algoritmo (bloque etiquetado como pseudocode ... \`\`\`).
2) Caso de ejecución seleccionado: "worst", "best" o "avg".
3) Rastro de ejecución trace con esta forma general:
{
  "steps": [
    {
      "step_number": number,
      "line": number,
      "kind": string,
      "variables": { },
      "iteration"?: {
        "loopVar"?: string,
        "currentValue"?: number,
        "maxValue"?: number,
        "iteration"?: number
      },
      "recursion"?: {
        "depth": number,
        "callId": string,
        "params": { },
        "procedure"?: string
      },
      "cost"?: string,
      "accumulated_cost"?: string,
      "description"?: string
    }
  ],
  "recursionTree"?: {
    "calls": [
      { "id": string, "depth": number, "params": { }, "children": string[] }
    ],
    "root_calls": string[]
  }
}

SALIDA ESPERADA (MUY IMPORTANTE)
Debes responder SIEMPRE con un único objeto JSON VÁLIDO, sin texto adicional, sin comentarios, sin Markdown.

Estructura exacta de la respuesta:
{
  "graph": {
    "nodes": [
      {
        "id": "string",
        "type": "default",
        "position": { "x": number, "y": number },
        "data": {
          "label": "texto corto que aparecerá en el nodo"
        },
        "parentId": "string opcional para agrupar"
      }
    ],
    "edges": [
      {
        "id": "string",
        "source": "id de nodo origen",
        "target": "id de nodo destino",
        "label": "texto que aparecerá sobre la arista (OBLIGATORIO)",
        "type": "default"
      }
    ]
  },
  "explanation": "explicación en lenguaje natural (máx. 200 palabras) sobre el comportamiento del algoritmo en el caso dado"
}

REGLAS PARA NODOS
- Crea nodos legibles, con etiquetas cortas y descriptivas en data.label.
- NO incluyas pseudocódigo completo dentro del nodo; resume:
  - Para un IF: "IF A[i] == x"
  - Para un FOR: "FOR i = 1..n"
  - Para un RETURN: "RETURN i", "RETURN -1"
  - Para asignaciones: "i <- i + 1", "x <- A[i]"
- Mantén una estructura de flujo clara:
  - Un nodo de inicio (ej. "Inicio").
  - Nodos para decisiones (IF, condiciones de bucles).
  - Nodos para acciones (asignaciones, returns, llamadas).

REGLAS PARA ARISTAS (CRÍTICO)
- TODA arista DEBE tener "source" y "target" válidos.
- Los labels son ESPECIALES:
  - Para IF:
    - Rama verdadera: usa labels como "Sí" o "True" (recomendado).
    - Rama falsa: usa labels como "No" o "False" (recomendado).
  - Para bucles:
    - Transición de cuerpo a siguiente iteración: labels como "siguiente iteración", "i++", o "repetir" son útiles pero opcionales.
    - Salida del bucle cuando la condición falla: labels como "condición falsa" o "fin bucle" son útiles pero opcionales.
  - Para flujos secuenciales simples (por ejemplo de una asignación a la siguiente), PUEDES dejar el label vacío o no usarlo si no aporta información.
- Puedes usar expresiones como i < n, A[i] == x, etc. tanto en labels de nodos como de aristas cuando ayuden a entender el flujo.

LAYOUT Y POSICIONES
- Asigna posiciones simples y razonables:
  - Usa una cuadrícula:
    - Eje X por “nivel lógico” (inicio → decisiones → returns).
    - Eje Y para separar ramas (ej.: rama "Sí" arriba, rama "No" abajo).
- No es necesario que las posiciones sean perfectas; el objetivo es que no se solapen demasiado.

USO DEL RASTRO (trace)
- Usa steps para decidir qué nodos crear:
  - Puedes agrupar múltiples asignaciones secuenciales en un solo nodo si eso simplifica el diagrama.
  - Para recursión, puedes usar la información de recursionTree para mostrar un árbol simple de llamadas (nodos por llamada, aristas padre→hijo con labels como "subproblema").
- No inventes pasos que no estén justificados por el rastro.

EXPLICACIÓN
- En explanation, describe brevemente:
  - Cómo fluye el algoritmo en el caso dado (best/worst/avg).
- Puedes usar expresiones completas como A[i] == x sin restricciones aquí (no afecta al parser de React Flow).

RESTRICCIONES FINALES
- Devuelve SIEMPRE JSON puro, sin bloques de código, sin comentarios, sin texto narrativo fuera del JSON.
- Asegúrate de que:
  - Todos los IDs de nodos y edges son únicos.
  - Todas las aristas tienen "source", "target" y "label" válidos.
  - La estructura coincide exactamente con el esquema indicado.`;

    const userPrompt = `Analiza el siguiente rastro de ejecución y construye el grafo para React Flow según las reglas indicadas.

1) PSEUDOCÓDIGO DEL ALGORITMO:
\`\`\`pseudocode
${source}
\`\`\`

2) CASO DE EJECUCIÓN:
${caseType}

3) RASTRO DE EJECUCIÓN (trace):
${JSON.stringify(trace, null, 2)}

Devuelve ÚNICAMENTE un objeto JSON válido con la estructura { "graph": { "nodes": [...], "edges": [...] }, "explanation": "..." }.`;

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

    const safeGraph =
      result &&
      typeof result === "object" &&
      (result as { graph?: unknown }).graph &&
      typeof (result as { graph: unknown }).graph === "object"
        ? (result as { graph: unknown }).graph
        : { nodes: [], edges: [] };

    const safeExplanation =
      result &&
      typeof result === "object" &&
      typeof (result as { explanation?: unknown }).explanation === "string"
        ? (result as { explanation: string }).explanation
        : "";

    return NextResponse.json({
      ok: true,
      graph: safeGraph,
      explanation: safeExplanation,
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

