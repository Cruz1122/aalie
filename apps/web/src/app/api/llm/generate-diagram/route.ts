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
          "label": "texto corto que aparecerá en el nodo",
          "microseconds": number (opcional, tiempo estimado en microsegundos),
          "tokens": number (opcional, número de operaciones elementales)
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
  "stepCosts": {
    "step_number": {
      "microseconds": number,
      "tokens": number
    }
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
- No inventes pasos que no estén justificados por el rastro.

ESTIMACIÓN DE COSTES (MICROSEGUNDOS Y TOKENS)
- Para cada paso en trace.steps, debes estimar:
  - **microseconds**: Tiempo estimado de ejecución en microsegundos basado en:
    * Asignaciones simples: 0.1-0.5 μs
    * Operaciones aritméticas: 0.2-1 μs
    * Comparaciones: 0.1-0.5 μs
    * Accesos a arrays: 0.3-1 μs
    * Condicionales (IF): 0.2-0.8 μs (solo evaluación de condición)
    * Bucles: tiempo de condición + cuerpo (multiplicado por iteraciones)
    * Llamadas a funciones: 1-5 μs base + tiempo de ejecución
    * Returns: 0.1-0.3 μs
  - **tokens**: Número de operaciones elementales (tokens computacionales):
    * Asignación: 1 token
    * Operación aritmética (+, -, *, /): 1-2 tokens según complejidad
    * Comparación (<, >, ==, !=): 1 token
    * Acceso a array: 1 token
    * Condicional (IF): 1 token (evaluación) + tokens del cuerpo ejecutado
    * Bucle: tokens de condición + tokens del cuerpo (por iteración)
    * Llamada a función: tokens de evaluación de argumentos + tokens de ejecución
    * Return: 1 token
- Incluye estos valores en el objeto "stepCosts" mapeando step_number a {microseconds, tokens}
- También puedes incluir microseconds y tokens en data de los nodos del grafo si corresponde

MANEJO ESPECIAL PARA ALGORITMOS RECURSIVOS
- Si trace.recursionTree existe con datos:
  - Genera un ÁRBOL DE LLAMADAS RECURSIVAS en lugar de un diagrama de flujo secuencial
  - Para cada llamada en recursionTree.calls, crea un nodo que represente esa llamada
  - Usa la estructura:
    * Nodo id: usa el call.id (ej: "call_1", "call_2")
    * Nodo label: incluye el nombre del procedimiento y parámetros (ej: "factorial(5)", "fib(3)")
    * Si call.return_value existe, agrégalo al label (ej: "factorial(5) → 120")
    * Si call.is_base_case es true, marca el nodo de alguna forma (ej: agregar "(base)" al label)
  - Para las aristas:
    * Usa call.children para crear aristas del padre a cada hijo
    * Labels como "llamada recursiva", "f(n-1)", "f(n-2)" son apropiados
  - Layout en forma de árbol:
    * Profundidad 0 en la parte superior (x=400, y=50)
    * Cada nivel de profundidad incrementa Y (ej: depth * 150)
    * Distribuye horizontalmente los hijos para evitar solapamiento
- Si hay recursionTree, IGNORA los steps individuales para el diagrama principal
- La explicación debe describir el patrón recursivo, casos base, y cómo se combinan las soluciones

EXPLICACIÓN
- En explanation, describe brevemente:
  - Cómo fluye el algoritmo en el caso dado (best/worst/avg).
- Puedes usar expresiones completas como A[i] == x sin restricciones aquí (no afecta al parser de React Flow).
- IMPORTANTE: Usa formato Markdown en la explicación para destacar términos clave:
  - Usa **negrita** para conceptos importantes o nombres de variables clave
  - Usa \`código inline\` para valores, expresiones o nombres de variables (ej: \`i\`, \`A[i]\`, \`n\`)
  - Usa *cursiva* para énfasis suave
  - Mantén la explicación clara y estructurada
  - NO modifiques la estructura JSON, solo formatea el CONTENIDO del string "explanation"

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

