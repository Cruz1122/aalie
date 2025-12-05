import { NextRequest, NextResponse } from "next/server";

import { getApiKey } from "@/hooks/useApiKey";

import { GEMINI_ENDPOINT_BASE } from "../llm-config";

export const runtime = "nodejs";

function validateApiKey(key: string | undefined): boolean {
  if (!key || typeof key !== "string") {
    return false;
  }
  const API_KEY_REGEX = /^AIza[0-9A-Za-z_-]{35,40}$/;
  return API_KEY_REGEX.test(key.trim());
}

export async function POST(req: NextRequest) {
  try {
    const { pseudocode, kind, depth_limit, hints, input_size } = await req.json();

    if (!pseudocode) {
      return NextResponse.json(
        { ok: false, error: "Pseudocódigo es requerido" },
        { status: 400 }
      );
    }

    // Obtener API_KEY (igual que generate-diagram)
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

    // Construir el prompt para el LLM (formato React Flow como generate-diagram)
    const systemPrompt = `Eres un asistente especializado en visualizar algoritmos recursivos como árboles de llamadas usando React Flow.

CONTEXTO
- Recibes pseudocódigo de un algoritmo recursivo o híbrido
- Tu tarea es construir un ÁRBOL DE LLAMADAS RECURSIVAS en formato React Flow
- NO necesitas analizar complejidad, solo visualizar las llamadas recursivas

SALIDA ESPERADA (MUY IMPORTANTE)
Debes responder SIEMPRE con un único objeto JSON VÁLIDO, sin texto adicional, sin comentarios, sin Markdown.

Estructura exacta:
{
  "graph": {
    "nodes": [
      {
        "id": "string único (ej: call_1, call_2)",
        "type": "default",
        "position": { "x": number, "y": number },
        "data": {
          "label": "nombre_funcion(params) → valor_retorno",
          "microseconds": number (opcional, tiempo estimado en microsegundos para esta llamada),
          "tokens": number (opcional, número de operaciones elementales para esta llamada)
        }
      }
    ],
    "edges": [
      {
        "id": "string único",
        "source": "id del nodo padre",
        "target": "id del nodo hijo",
        "label": "descripción de la llamada",
        "type": "default"
      }
    ]
  },
  "explanation": "Explicación en Markdown sobre el proceso recursivo (máx. 200 palabras)"
}

REGLAS PARA NODOS (CRÍTICO)
- Crea un nodo por cada llamada recursiva
- Labels DEBEN incluir:
  1. Nombre de función con valores ESPECÍFICOS de parámetros
  2. Estado de variables locales importantes (si aplica)
  3. Valor de retorno cuando esté disponible
- Formato sugerido para labels:
  * Simple: "factorial(5)\nn=5"
  * Con retorno: "factorial(1)\nn=1 → 1 (base)"
  * Con variables: "fib(3)\nn=3, a=1, b=1 → 2"
  * Arrays: "mergesort([3,1])\nsize=2 → [1,3]"
- EJEMPLOS CORRECTOS:
  * "factorial(5)\nn=5", "factorial(4)\nn=4", "factorial(3)\nn=3"
  * "fib(5)\nn=5", "fib(4)\nn=4", "fib(3)\nn=3 → 2"
- INCORRECTO: "factorial(n)", "fib(n-1)" (no usar variables genéricas)
- Marca casos base claramente con "(base)" en el label
- Limita a ${depth_limit || 10} niveles de profundidad
- Si hay más niveles, usa un nodo especial: "... más llamadas"
- Usa saltos de línea (\n) para separar información en el label

REGLAS PARA ARISTAS
- Conecta cada llamada padre → hijo(s)
- Aristas de LLAMADA (padre → hijo):
  * Labels descriptivos: "llamada", "f(n-1)", "f(n-2)", "izquierda", "derecha"
  * Color por defecto (gris)
- Aristas de RETORNO (hijo → padre):
  * CRÍTICO: Incluye "return" o "→" en el label
  * Ejemplos: "return 120", "→ 1", "retorna 2"
  * Se mostrarán en VERDE para distinguirlas
- TODA arista DEBE tener source, target y label
- Crea AMBOS tipos de aristas para mostrar el flujo completo

LAYOUT EN ÁRBOL
- Nivel 0 (llamada inicial) arriba: x=400, y=50
- Cada nivel de profundidad incrementa Y: depth * 120
- Distribuye hijos horizontalmente para evitar solapamiento:
  * Si un nodo tiene N hijos, distribuirlos en X: baseX + (i - N/2) * spacing
  * spacing sugerido: 150-200 por hijo
- NODO FINAL (CRÍTICO): 
  * Crea un nodo adicional con label "FIN\nResultado: valor_final"
  * Posición: Directamente debajo del nodo raíz (x=400, y = depth_del_ultimo_nodo + 150)
  * NO lo coloques muy lejos, debe estar cerca y fácilmente visible
  * El retorno final (desde el nodo raíz) debe conectarse directamente a este nodo FIN
  * Esta arista debe tener label con "return" o "→" para que se coloree en verde

ESTIMACIÓN DE COSTES (MICROSEGUNDOS Y TOKENS)
- Para cada nodo (llamada recursiva), debes estimar:
  - **microseconds**: Tiempo estimado de ejecución en microsegundos basado en:
    * Casos base: 0.5-2 μs (operaciones simples)
    * Llamadas recursivas: 1-10 μs base + tiempo de evaluación de parámetros
    * Operaciones dentro de la llamada: suma según tipo (asignaciones, comparaciones, etc.)
    * Considera la profundidad: llamadas más profundas pueden tener overhead adicional
  - **tokens**: Número de operaciones elementales (tokens computacionales):
    * Casos base: 1-3 tokens (operaciones simples)
    * Llamadas recursivas: 2-5 tokens base + tokens de evaluación de parámetros
    * Operaciones dentro de la llamada: suma según tipo
    * Cada llamada recursiva cuenta como 1 token adicional
- Incluye estos valores en data.microseconds y data.tokens de cada nodo

EXPLICACIÓN (Markdown)
- Describe el patrón recursivo del algoritmo
- Identifica caso(s) base claramente
- Explica cómo se combinan las soluciones
- Usa **negrita** para conceptos clave
- Usa \`código inline\` para variables y expresiones
- Menciona la complejidad aproximada si es evidente

RESTRICCIONES
- JSON puro sin bloques de código ni texto extra
- Todos los IDs únicos
- Todas las aristas con source, target y label válidos`;

    const userPrompt = `Genera un árbol de llamadas recursivas en formato React Flow para este algoritmo ${kind || "recursivo"}:

\`\`\`pseudocode
${pseudocode}
\`\`\`

${hints?.params?.length ? `Parámetros principales: ${hints.params.join(", ")}` : ""}
${input_size ? `Tamaño de entrada (n): ${input_size}` : ""}

Profundidad máxima: ${depth_limit || 10} niveles

IMPORTANTE: 
- La llamada inicial debe ser con n=${input_size || 5}
- Los índices de los arreglos en este sistema son BASE 1 (A[1]..A[n]); **no uses índices base 0** como 0 o n-1 en los labels ni en los ejemplos.
- Cada nodo debe mostrar:
  1. Función y parámetros ESPECÍFICOS (no genéricos)
  2. Variables locales relevantes y sus valores
  3. Valor de retorno cuando esté disponible
- Usa saltos de línea (\n) en los labels para separar información
- Ejemplo: "factorial(${input_size || 5})\nn=${input_size || 5}" luego "factorial(${(input_size || 5) - 1})\nn=${(input_size || 5) - 1}"
- NO uses notación genérica como "factorial(n)" o "factorial(n-1)"
- Calcula y muestra los valores concretos de retorno
- Marca claramente el caso base con "(base)" en el label
- Crea aristas de RETORNO (con "return" o "→" en el label) además de las de llamada
- Las aristas de retorno se mostrarán en VERDE automáticamente
- CRÍTICO SOBRE EL ARREGLO A (SI EL ALGORITMO USA ARRAYS):
  * Si el pseudocódigo tiene un parámetro tipo A[n] o un arreglo A, DEBES elegir un arreglo ordenado concreto y mostrarlo explícitamente en el label de la llamada raíz.
  * Añade SIEMPRE una línea extra en el label de la raíz con el arreglo, por ejemplo:
    - "A = [1, 3, 5, 7, 9]" (para n pequeño)
    - "A = [1, 3, 5, ..., 2n-1]" (para n grande; usa "..." pero muestra algunos valores concretos)
  * NO está permitido devolver solo "A" sin contenido; siempre muestra explícitamente parte de los valores del arreglo.
- CONSISTENCIA LÓGICA (CRÍTICO):
  * Si en la llamada raíz declaras un arreglo "A = [...]" y un valor "x = v":
    - Si el resultado final es -1, entonces **x NO debe aparecer en A**.
    - Si x SÍ aparece en A, el resultado final DEBE ser el índice correcto de x en A (no -1).
  * Asegúrate de que todas las comparaciones intermedias (x < A[mitad], x > A[mitad], x = A[mitad]) sean coherentes con los valores concretos de A y x que mostraste.
  * Ignora cualquier mención externa a "worst/best/average case": para este diagrama siempre queremos un ejemplo **típico** y lógicamente consistente, no necesariamente el peor caso.
- CRÍTICO SOBRE EL NODO FINAL:
  * Agrega un nodo final con id EXACTAMENTE "end_node" y label "FIN\nResultado: valor_final"
  * Posiciónalo cerca del nodo raíz (no muy abajo)
  * El retorno final (desde el nodo raíz) debe conectarse directamente a este nodo FIN
  * Esta arista final DEBE tener label "→ valor_final" o "return valor_final" para verse en verde
  * El nodo FIN debe estar claramente visible y accesible

Devuelve SOLO el JSON con la estructura especificada.`;

    // Llamar a Gemini (igual que generate-diagram)
    const model = "gemini-2.0-flash";
    const endpoint = `${GEMINI_ENDPOINT_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`;

    const systemInstruction = {
      parts: [{ text: systemPrompt }],
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: systemInstruction,
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8000,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const rawMsg =
        (errorData && (errorData.error?.message || errorData.message)) ||
        `HTTP ${response.status}`;
      const statusText = (errorData && errorData.error?.status) || "";

      console.error("Error de Gemini (recursion-diagram):", rawMsg, statusText);

      let friendly = "Error al llamar al LLM para generar el diagrama de recursión.";

      const combined = `${statusText} ${rawMsg}`.toUpperCase();

      if (combined.includes("RESOURCE_EXHAUSTED") || combined.includes("QUOTA")) {
        friendly =
          "Se agotó la cuota del modelo o el límite de uso. Intenta de nuevo más tarde o revisa tu cuota de la API.";
      } else if (
        combined.includes("MODEL_EXHAUSTED") ||
        combined.includes("MODEL_OVERLOADED") ||
        combined.includes("OVERLOADED") ||
        combined.includes("RATE_LIMIT")
      ) {
        friendly =
          "El modelo está sobrecargado o en rate limit. Intenta de nuevo en unos segundos.";
      } else if (combined.includes("NOT_FOUND") || combined.includes("MODEL")) {
        friendly =
          "El modelo configurado no está disponible. Verifica el nombre del modelo o tu configuración de LLM.";
      }

      return NextResponse.json(
        { ok: false, error: friendly },
        { status: response.status }
      );
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Respuesta vacía del LLM" },
        { status: 500 }
      );
    }

    // Extraer JSON de la respuesta (igual que generate-diagram)
    let result;
    try {
      // Intentar parsear directamente
      result = JSON.parse(text);
    } catch {
      // Si falla, buscar JSON entre ```json y ```
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[1]);
      } else {
        // Último intento: buscar cualquier objeto JSON
        const objMatch = text.match(/\{[\s\S]*\}/);
        if (objMatch) {
          result = JSON.parse(objMatch[0]);
        } else {
          throw new Error("No se encontró JSON en la respuesta");
        }
      }
    }

    // Validar que tenga la estructura esperada
    if (!result.graph || !result.graph.nodes || !result.graph.edges) {
      return NextResponse.json(
        {
          ok: false,
          error: "La respuesta del LLM no tiene la estructura esperada (graph.nodes, graph.edges)",
        },
        { status: 500 }
      );
    }

    // Preservar microseconds y tokens de los nodos si existen
    const processedGraph = {
      ...result.graph,
      nodes: Array.isArray(result.graph.nodes)
        ? result.graph.nodes.map((node: { data?: { label?: string; microseconds?: number; tokens?: number }; [key: string]: unknown }) => ({
            ...node,
            data: {
              label: node.data?.label || "",
              microseconds:
                typeof node.data?.microseconds === "number"
                  ? node.data.microseconds
                  : undefined,
              tokens:
                typeof node.data?.tokens === "number" ? node.data.tokens : undefined,
            },
          }))
        : [],
    };

    return NextResponse.json({
      ok: true,
      graph: processedGraph,
      explanation: result.explanation || "",
    });
  } catch (error) {
    console.error("Error en recursion-diagram:", error);

    const rawMessage =
      error instanceof Error ? error.message : "Error desconocido al generar el diagrama de recursión";

    const friendlyMessage = rawMessage.includes("fetch failed")
      ? "No se pudo contactar al servicio de LLM. Verifica tu conexión a Internet o intenta de nuevo más tarde."
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
