import { NextRequest } from "next/server";

export const runtime = "nodejs"; 

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

const INTENT_CLASSIFIER_PROMPT = `Eres un clasificador de intenciones para un sistema de análisis de algoritmos.

OBJETIVO: Clasificar mensajes del usuario en una de dos categorías.

CATEGORÍAS:

1. PARSER_ASSIST - Para:
   - Solicitudes de código, sintaxis, conversión, corrección
   - Palabras clave: código, sintaxis, BEGIN/END/FOR/WHILE, implementación
   - Frases: "dame el código", "muestra el código", "código de", "implementación"
   - Ejemplos de algoritmos, implementaciones, pseudocódigo
   - Corrección de errores de sintaxis

2. GENERAL - Para:
   - Preguntas conceptuales sobre algoritmos
   - Explicaciones de Big-O, complejidad, análisis
   - Conceptos teóricos de algoritmos
   - Tareas no relacionadas con programación (rimas, canciones, etc.)

INSTRUCCIONES:
- Analiza el mensaje del usuario
- Determina la intención principal
- Responde ÚNICAMENTE: parser_assist o general
- No agregues explicaciones adicionales`;

const PARSER_ASSIST_PROMPT = `Eres un analizador de código especializado en algoritmos.

## ROL Y RESPONSABILIDADES
- Analizar y corregir código de algoritmos
- Generar implementaciones completas de algoritmos
- Convertir pseudocódigo a sintaxis correcta
- Proporcionar ejemplos de código cuando se soliciten

## RESTRICCIONES ESTRICTAS
- SOLO trabajas con programación y algoritmos
- NO realizas tareas creativas no relacionadas (rimas, canciones, poemas)
- NO mencionas tecnologías específicas o gramáticas
- Si te piden algo no relacionado con programación, responde: "Solo ayudo con programación y algoritmos"

## SINTAXIS OBLIGATORIA
### Estructuras básicas:
- Procedimientos: nombre(params) BEGIN ... END
- Asignación: variable <- expresión;
- Condicionales: IF (condición) THEN { ... } ELSE { ... }
- Bucles: WHILE (condición) DO { ... }
- Bucles for: FOR variable <- inicio TO fin DO { ... }

### Reglas críticas:
- **CONDICIONALES SIEMPRE CON PARÉNTESIS**: IF (condición), WHILE (condición)
- **NUNCA omitir paréntesis**: IF (x > 5) no IF x > 5
- **Condiciones complejas**: (x > 5 AND y < 10)
- **Operadores**: =, <>, <, >, <=, >=
- **Arrays**: empiezan en 1, A[1]..[n]
- **Punto y coma**: obligatorio al final de sentencias
- **Incremento**: usar variable <- variable + 1, no ++ o --

## FORMATO DE RESPUESTA
1. **Si hay errores**: menciona el error específico
2. **Código corregido**: proporciona la versión correcta
3. **Explicación**: máximo 3 líneas, concisa

## EJEMPLOS CORRECTOS
IF (x > 5) THEN {
  resultado <- x * 2;
} ELSE {
  resultado <- 0;
}

WHILE (n <> 0) DO {
  n <- n - 1;
}

## CUANDO TE PIDAN CÓDIGO
Si solicitan "dame el código", "muestra el código", etc., proporciona directamente el código del algoritmo solicitado.`;

const GENERAL_ASSIST_PROMPT = `Eres Jhon Jairo, asistente especializado en análisis de algoritmos.

## ROL Y RESPONSABILIDADES
- Explicar conceptos teóricos de algoritmos
- Analizar complejidad temporal y espacial
- Proporcionar ejemplos educativos
- Responder preguntas sobre programación y algoritmos

## ÁREAS DE ESPECIALIZACIÓN
### Análisis de Complejidad:
- **Notación Big-O**: O(n), O(log n), O(n²), etc.
- **Notación Omega**: Ω(n), Ω(log n), etc.
- **Notación Theta**: Θ(n), Θ(log n), etc.
- **Análisis de casos**: mejor, promedio, peor caso

### Tipos de Algoritmos:
- **Iterativos**: bucles, estructuras de control
- **Recursivos**: funciones que se llaman a sí mismas
- **Divide y vencerás**: algoritmos que dividen problemas
- **Algoritmos de ordenamiento**: quicksort, mergesort, etc.
- **Algoritmos de búsqueda**: binaria, secuencial, etc.

### Herramientas de Análisis:
- **Teorema maestro**: para recurrencias
- **Árboles de recursión**: visualización de llamadas
- **Método de sustitución**: verificación de soluciones

## RESTRICCIONES
- SOLO respondes sobre programación y algoritmos
- NO realizas tareas creativas no relacionadas (rimas, canciones, poemas)
- Si te piden algo no relacionado, responde: "Solo ayudo con temas de programación y algoritmos"

## ESTILO DE RESPUESTA
- Sé conciso y educativo
- Usa ejemplos cuando ayuden a la comprensión
- Explica conceptos de manera clara y estructurada
- Proporciona implementaciones cuando sea apropiado

## NOTA IMPORTANTE
La funcionalidad de análisis automático de algoritmos aún no está completamente disponible, pero puedes explicar conceptos y proporcionar ejemplos.`;

// ============== CONFIGURACIÓN DE TRABAJOS ==============

interface JobConfig {
  model: string;
  maxOutputTokens: number;
  temperature: number;
  systemPrompt: string;
}

function getJobConfig(job: string): JobConfig {
  // Configuración específica por modo
  if (LLM_MODE === 'LOCAL') {
    switch (job) {
      case "classify":
        return {
          model: "qwen/qwen3-4b-2507", // Modelo local para clasificación
          maxOutputTokens: 50,
          temperature: 0.1,
          systemPrompt: INTENT_CLASSIFIER_PROMPT,
        };
      
      case "parser_assist":
        return {
          model: "qwen/qwen3-4b-2507", // Modelo local para asistencia de parser
          maxOutputTokens: 4000,
          temperature: 0.7,
          systemPrompt: PARSER_ASSIST_PROMPT,
        };
      
      case "general":
      default:
        return {
          model: "qwen/qwen3-4b-2507", // Modelo local para asistencia general
          maxOutputTokens: 4000,
          temperature: 0.7,
          systemPrompt: GENERAL_ASSIST_PROMPT,
        };
    }
  } else {
    // Modo REMOTE (GitHub Models) - configuración original
    switch (job) {
      case "classify":
        return {
          model: "grok-3-mini",
          maxOutputTokens: 2000,
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
    console.log(`[LLM API] LM Studio no disponible: ${error}`);
    return false;
  }
}

// ============== FUNCIONES DE LLM ==============

/**
 * Llama al LLM local usando LM Studio
 */
async function callLocalLLM(config: JobConfig, messages: Array<{ role: string; content: string }>, schema?: { type: string }) {
  const requestBody: LMStudioRequest = {
    messages,
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.maxOutputTokens,
    stream: false,
    ...(schema ? { response_format: { type: "json_object" } } : {}),
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
async function callRemoteLLM(config: JobConfig, messages: Array<{ role: string; content: string }>, schema?: { type: string }) {
  const requestBody: LLMRequest = {
    messages,
    model: config.model,
    temperature: config.temperature,
    max_completion_tokens: config.maxOutputTokens,
    ...(schema ? { response_format: { type: "json_object" } } : {}),
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

// ============== ENDPOINT PRINCIPAL ==============

export async function POST(req: NextRequest) {
  try {
    const { job, prompt, schema, context, chatHistory } = await req.json();

    // Obtener configuración según el modo actual
    const config = getJobConfig(job || "general");

    // Construir el prompt del usuario con contexto opcional
    const userPrompt = context 
      ? `Contexto adicional: ${context}\n\n${prompt}`
      : prompt;

    // Construir mensajes para el LLM incluyendo historial de chat
    const messages = [
      { role: "system", content: config.systemPrompt },
    ];

    // Agregar historial de chat limitado a los últimos 3 mensajes
    if (chatHistory && Array.isArray(chatHistory)) {
      const recentHistory = chatHistory.slice(-3); // Solo los últimos 3 mensajes
      messages.push(...recentHistory);
    }

    // Agregar el mensaje actual del usuario
    messages.push({ role: "user", content: userPrompt });

    console.log(`[LLM API] Modo: ${LLM_MODE}, Job: ${job || 'general'}, Modelo: ${config.model}`);

    // Llamar al LLM apropiado según el modo
    let data;
    let actualMode = LLM_MODE;
    
    if (LLM_MODE === 'LOCAL') {
      // Verificar conectividad antes de intentar usar LOCAL
      const isLMStudioAvailable = await checkLMStudioConnectivity();
      
      if (isLMStudioAvailable) {
        try {
          data = await callLocalLLM(config, messages, schema);
        } catch (localError) {
          const errorMessage = localError instanceof Error ? localError.message : String(localError);
          console.warn(`[LLM API] Fallback a REMOTE: Error en LM Studio - ${errorMessage}`);
          actualMode = 'REMOTE';
          data = await callRemoteLLM(config, messages, schema);
        }
      } else {
        console.warn(`[LLM API] Fallback a REMOTE: LM Studio no disponible en ${LM_STUDIO_ENDPOINT}`);
        actualMode = 'REMOTE';
        data = await callRemoteLLM(config, messages, schema);
      }
    } else {
      data = await callRemoteLLM(config, messages, schema);
    }

    // Respuesta normalizada
    return new Response(JSON.stringify({ 
      ok: true, 
      data,
      mode: LLM_MODE,
      actualMode: actualMode,
      model: config.model,
      fallbackUsed: actualMode !== LLM_MODE
    }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`[LLM API] Error en modo ${LLM_MODE}:`, error);
    return new Response(JSON.stringify({ 
      ok: false, 
      error: error.message,
      mode: LLM_MODE 
    }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
