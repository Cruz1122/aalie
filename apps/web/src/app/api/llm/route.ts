import { NextRequest } from "next/server";

export const runtime = "nodejs"; 

const token = process.env.GITHUB_TOKEN!;
const endpoint = "https://models.github.ai/inference";

interface GitHubModelsRequest {
  messages: Array<{ role: string; content: string }>;
  model: string;
  temperature: number;
  max_completion_tokens: number;
  response_format?: { type: string };
}

const INTENT_CLASSIFIER_PROMPT = `Clasifica el mensaje del usuario:

- Si menciona código, sintaxis, conversión, corrección, BEGIN/END/FOR/WHILE → responde: parser_assist
- Si es pregunta conceptual, explicación, Big-O, complejidad → responde: general

Responde solo: parser_assist o general`;

const PARSER_ASSIST_PROMPT = `Convierte pseudocódigo a sintaxis Language.g4.

REGLAS:
- Procedimientos: nombre(params) BEGIN ... END
- Asignación: variable <- expresión;
- IF (condición) THEN { ... } ELSE { ... }
- FOR variable <- inicio TO fin DO { ... }
- WHILE (condición) DO { ... }
- Operadores: = (igual), <> (diferente), <, >, <=, >=
- Arrays empiezan en 1: A[1]..[n]
- Punto y coma (;) al final de sentencias
- No usar ++ o --, usar <- variable + 1

EJEMPLO:
factorial(n) BEGIN
  resultado <- 1;
  FOR i <- 1 TO n DO {
    resultado <- resultado * i;
  }
  RETURN resultado;
END

Convierte el código del usuario manteniendo la lógica pero ajustando la sintaxis.`;

const GENERAL_ASSIST_PROMPT = `IMPORTANTE: La funcionalidad de análisis de algoritmos aún no está disponible. No puedes analizar, calcular complejidad o procesar algoritmos hasta que esta funcionalidad esté implementada.

Eres Jhon Jairo, asistente de análisis de algoritmos.

Responde preguntas sobre:
- Complejidad temporal y espacial (Big-O, Omega, Theta)
- Análisis de algoritmos iterativos y recursivos
- Teorema maestro y recurrencias
- Mejor caso, caso promedio y peor caso

Sé conciso, claro y educativo. Usa ejemplos cuando ayude.`;

interface JobConfig {
  model: string;
  maxOutputTokens: number;
  temperature: number;
  systemPrompt: string;
}

function getJobConfig(job: string): JobConfig {
  switch (job) {
    case "classify":
      return {
        model: "grok-3-mini",
        maxOutputTokens: 20,
        temperature: 0,
        systemPrompt: INTENT_CLASSIFIER_PROMPT
      };
    
    case "parser_assist":
      return {
        model: "gpt-5-nano",
        maxOutputTokens: 4000,
        temperature: 1,
        systemPrompt: PARSER_ASSIST_PROMPT
      };
    
    case "general":
    default:
      return {
        model: "gpt-5-nano",
        maxOutputTokens: 4000,
        temperature: 1,
        systemPrompt: GENERAL_ASSIST_PROMPT
      };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { job, prompt, schema, context } = await req.json();

    const config = getJobConfig(job || "general");

    const userPrompt = context 
      ? `Contexto adicional: ${context}\n\n${prompt}`
      : prompt;

    const messages = [
      { role: "system", content: config.systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        model: config.model,
        temperature: config.temperature,
        max_completion_tokens: config.maxOutputTokens,
        ...(schema ? { response_format: { type: "json_object" } } : {}),
      } as GitHubModelsRequest),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || `HTTP ${response.status}`;
      throw new Error(`Error ${response.status}: ${errorMsg}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("Error en LLM API:", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
