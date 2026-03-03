# Usos de LLM, Jobs y Modelos

## Descripción General

El sistema usa endpoints LLM en `apps/web/src/app/api/llm/*` con configuración centralizada por variables de entorno. Cada job tiene un modelo asignado y parámetros de inferencia definidos en `llm-config.ts`.

## Configuración Centralizada

**Ubicación**: `apps/web/src/app/api/llm/llm-config.ts`

### Estructura de Configuración

```typescript
export type LLMJob =
  | "parser_assist"   // Asistencia para generar/corregir código
  | "general"         // Chatbot general
  | "repair"          // Reparación de código con errores
  | "compare";        // Comparación de análisis

export const GEMINI_MODELS = {
  parser_assist: getEnvOrDefault("LLM_MODEL_PARSER_ASSIST", DEFAULT_GEMINI_MODELS.parser_assist),
  general: getEnvOrDefault("LLM_MODEL_GENERAL", DEFAULT_GEMINI_MODELS.general),
  repair: getEnvOrDefault("LLM_MODEL_REPAIR", DEFAULT_GEMINI_MODELS.repair),
  compare: getEnvOrDefault("LLM_MODEL_COMPARE", DEFAULT_GEMINI_MODELS.compare),
};

export const GEMINI_ENDPOINT_BASE =
  getEnvOrDefault("GEMINI_ENDPOINT_BASE", DEFAULT_GEMINI_ENDPOINT_BASE);
```

## Sistema de Prompts por Idioma

Los prompts del LLM están parametrizados por el idioma del usuario (`locale`). El frontend envía el parámetro `locale` en el body de las requests a `/api/llm`, y el sistema selecciona el prompt adecuado.

### Configuración

- **getJobConfig(job, locale)**: Devuelve la configuración completa del job incluyendo el system prompt en el idioma correcto
- **getPromptByLocale(job, locale)**: Obtiene el prompt del sistema según el job y el locale (`"es"` | `"en"`)
- **Instrucciones de idioma**: Para jobs como `parser_assist` y `general`, se añade dinámicamente una instrucción que obliga al LLM a responder en español o inglés según el locale

### Uso

```typescript
// El frontend envía locale en cada request
body: JSON.stringify({
  job: "parser_assist",
  message: "Dame el código de merge sort",
  locale: "es",  // opcional, default "es"
});
```

### Documentación detallada

Para más información sobre internacionalización, labels de backend y el flujo completo de locale, ver [Internacionalización, Labels y Prompts](../app/i18n-labels-prompts.md).

## Jobs Disponibles

| Job | Propósito | Endpoint | Modelo (env) |
|-----|-----------|----------|--------------|
| `parser_assist` | Generación/corrección de pseudocódigo | `POST /api/llm` | `LLM_MODEL_PARSER_ASSIST` |
| `general` | Respuesta conversacional general | `POST /api/llm` | `LLM_MODEL_GENERAL` |
| `repair` | Reparación de código con errores | `POST /api/llm` | `LLM_MODEL_REPAIR` |
| `compare` | Comparación sistema vs LLM | `POST /api/llm` | `LLM_MODEL_COMPARE` |
| `recursion_diagram` | Diagrama de recursión | `POST /api/llm/recursion-diagram` | `LLM_MODEL_RECURSION_DIAGRAM` |
| `generate_diagram` | Diagrama de flujo/trace | `POST /api/llm/generate-diagram` | `LLM_MODEL_GENERATE_DIAGRAM` |

### 1. Parser Assist

**Propósito**: Generar código de algoritmos y asistir en corrección de sintaxis

**Modelo**: `gemini-3-flash-preview`

**Configuración**:
- `maxTokens`: 16000
- `temperature`: 0.7 (creativo pero coherente)

**Uso**:
```typescript
// apps/web/src/components/ChatBot.tsx

// Cuando el usuario pide código o implementación
const response = await fetch("/api/llm", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": apiKey
  },
  body: JSON.stringify({
    job: "parser_assist",
    message: "Dame el código de merge sort"
  })
});
```

**Características**:
- Genera código en la gramática del proyecto (Language.g4)
- Corrige errores de sintaxis
- Convierte descripciones a pseudocódigo válido
- Proporciona ejemplos de algoritmos

**Endpoint**: `POST /api/llm` (con `job: "parser_assist"`)

### 2. General

**Propósito**: Chatbot general para explicaciones y consultas teóricas

**Modelo**: `gemini-2.5-flash`

**Configuración**:
- `maxTokens`: 16000
- `temperature`: 0.7 (conversacional)

**Uso**:
```typescript
// apps/web/src/components/ChatBot.tsx

const response = await fetch("/api/llm", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": apiKey
  },
  body: JSON.stringify({
    job: "general",
    message: "¿Qué es el teorema maestro?",
    history: previousMessages
  })
});
```

**Características**:
- Explica conceptos de algoritmos
- Analiza complejidad temporal y espacial
- Responde preguntas sobre programación
- Mantiene contexto de conversación

**Endpoint**: `POST /api/llm` (con `job: "general"`)

### 3. Repair

**Propósito**: Reparar código con errores de sintaxis

**Modelo**: `gemini-3-flash-preview`

**Configuración**:
- `maxTokens`: 16000
- `temperature`: 0.5 (balance entre determinismo y creatividad)

**Uso**:
```typescript
// apps/web/src/components/RepairModal.tsx

const response = await fetch("/api/llm", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": apiKey
  },
  body: JSON.stringify({
    job: "repair",
    code: codeWithErrors,
    errors: parseErrors
  })
});
```

**Características**:
- Corrige errores de sintaxis
- Mantiene la lógica original
- Reporta líneas modificadas/eliminadas
- Respeta reglas de la gramática

**Endpoint**: `POST /api/llm` (con `job: "repair"`)

**Response**:
```typescript
{
  "code": "código corregido",
  "removedLines": [3, 5],
  "addedLines": [4, 6, 7]
}
```

### 4. Compare

**Propósito**: Comparar análisis del sistema con análisis del LLM

**Modelo**: `gemini-3-flash-preview` (modelo configurado para análisis preciso)

**Configuración**:
- `maxTokens`: 8000
- `temperature`: 0.1 (muy determinista)

**Uso**:
```typescript
// apps/web/src/app/analyzer/page.tsx

const response = await fetch('/api/llm', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': apiKey
  },
  body: JSON.stringify({
    job: 'compare',
    systemAnalysis: analysisResult,
    source: code
  })
});
```

**Características**:
- Valida corrección matemática del análisis
- Proporciona análisis independiente
- Detecta discrepancias
- Genera nota de validación (≤100 caracteres)

**Endpoint**: `POST /api/llm` (con `job: "compare"`)

**Response**:
```typescript
{
  "analysis": {
    "worst": {
      "T_open": "...",
      "T_polynomial": "...",
      "big_o": "O(n²)",
      "big_omega": "Ω(n²)",
      "big_theta": "Θ(n²)"
    }
  },
  "note": "😊 Excelente, T_open y cotas correctas"
}
```

**Documentación**: [LLM Comparison](../app/llm-comparison.md)

### 5. Recursion Diagram (Adicional)

**Propósito**: Generar diagramas de árbol de recursión

**Modelo**: `gemini-2.5-flash` (usado en endpoint específico)

**Uso**:
```typescript
// apps/web/src/components/RecursionTreeView.tsx

const response = await fetch("/api/llm/recursion-diagram", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": apiKey
  },
  body: JSON.stringify({
    source: code,
    inputs: { n: 5 }
  })
});
```

**Características**:
- Genera diagramas Mermaid de árboles de recursión
- Incluye explicación del proceso
- Proporciona valores de entrada/salida de cada llamada

**Endpoint**: `POST /api/llm/recursion-diagram`

**Documentación**: [Pseudocode Tracking](../app/pseudocode-tracking.md)

## Modelos de Gemini Usados

### Gemini 3 Flash Preview

**Usado en**: `parser_assist`, `repair`, `compare`

**Características**:
- Rápido y eficiente
- Bueno para tareas de generación y análisis
- Costo moderado
- Límite de contexto: 1M tokens

**Precios** (a diciembre 2024):
- Input: $0.075 por millón de tokens
- Output: $0.30 por millón de tokens

### Gemini 2.5 Flash

**Usado en**: `general`, `recursion_diagram`, `generate_diagram`

**Características**:
- Más potente y preciso
- Mejor para análisis matemático complejo
- Costo más alto
- Límite de contexto: 2M tokens

**Precios**:
- Input: $1.25 por millón de tokens
- Output: $5.00 por millón de tokens

## Endpoints de LLM

### Estructura de Endpoints

```
/api/llm/
├── route.ts              # Endpoint principal (POST /api/llm)
├── classify/             # Endpoint auxiliar de clasificación
├── recursion-diagram/    # Generación de diagramas recursivos
└── status/               # Estado global de jobs/modelos activos
```

### Endpoint Principal: POST /api/llm

**Request**:
```typescript
{
  "job": "parser_assist" | "general" | "repair" | "compare",
  "prompt": string,
  "chatHistory"?: Array<{ role: string; content: string }>,
  "apiKey"?: string,
  "locale"?: "es" | "en",
  "context"?: string
}
```

### Middleware Común

```typescript
// apps/web/src/app/api/llm/route.ts

export async function POST(request: Request) {
  // Obtener API key (prioridad: servidor > body)
  const serverApiKey = process.env.API_KEY;
  const body = await request.json();
  const apiKey = serverApiKey || body.apiKey || null;

  if (!apiKey) {
    return Response.json(
      { error: 'API key required' },
      { status: 400 }
    );
  }

  // Obtener configuración del job
  const { job } = body;
  const config = getJobConfig(job);

  // Llamar a Gemini
  const result = await callGeminiLLM(config, request, apiKey);

  return Response.json(result);
}
```

## Flujo de Uso en Diferentes Funcionalidades

### 1. Chatbot Interactivo

```
Usuario envía mensaje
    ↓
Clasificación de intención (`job: classify`)
    ↓
Si es "parser_assist" → POST /api/llm (job: parser_assist)
Si es "general" → POST /api/llm (job: general)
    ↓
LLM procesa con contexto
    ↓
Retorna respuesta conversacional
```

### 2. Reparación de Código

```
Usuario tiene código con errores
    ↓
Abre RepairModal
    ↓
POST /api/llm (job: repair)
    ↓
LLM corrige sintaxis
    ↓
Retorna código corregido + líneas modificadas
```

### 3. Comparación de Análisis

```
Usuario solicita comparación
    ↓
POST /api/llm (job: compare)
    ↓
LLM analiza código independientemente
    ↓
Compara con análisis del sistema
    ↓
Retorna análisis + nota de validación
```

### 4. Generación de Diagramas Recursivos

```
Usuario solicita trace de algoritmo recursivo
    ↓
POST /api/llm/recursion-diagram
    ↓
LLM genera diagrama Mermaid
    ↓
Construye árbol de recursión
    ↓
Retorna visualización
```

## Variables de Entorno Relacionadas

### Frontend (Next.js)

```env
# apps/web/.env

# Endpoint base del proveedor Gemini
GEMINI_ENDPOINT_BASE=https://generativelanguage.googleapis.com/v1beta/models

# Modelos por job
LLM_MODEL_CLASSIFY=gemini-2.5-flash-lite
LLM_MODEL_PARSER_ASSIST=gemini-3-flash-preview
LLM_MODEL_GENERAL=gemini-2.5-flash
LLM_MODEL_REPAIR=gemini-3-flash-preview
LLM_MODEL_COMPARE=gemini-3-flash-preview
LLM_MODEL_RECURSION_DIAGRAM=gemini-2.5-flash
LLM_MODEL_GENERATE_DIAGRAM=gemini-2.5-flash

# API key opcional del servidor Next.js para /api/llm/*
API_KEY=
```

### Prioridad de API Keys

1. **API key del servidor** (`API_KEY` en env) - Prioridad más alta
2. **API key del usuario** (enviada en body como `apiKey`) - Fallback

### Fallback por defecto (si faltan env)

```typescript
export const DEFAULT_GEMINI_ENDPOINT_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

export const DEFAULT_GEMINI_MODELS = {
  classify: "gemini-3-flash-preview",
  parser_assist: "gemini-2.5-flash",
  general: "gemini-3-flash-preview",
  repair: "gemini-2.5-flash",
  compare: "gemini-2.5-flash",
} as const;

export const DEFAULT_GEMINI_DIAGRAM_MODELS = {
  recursion_diagram: "gemini-3-flash-preview",
  generate_diagram: "gemini-3-flash-preview",
} as const;
```

## Monitoreo y Logging

### Logging de Uso

```typescript
// Cada llamada a LLM registra:
console.log('[LLM Usage]', {
  job: 'parser_assist',
  model: 'gemini-2.5-flash',
  tokens: 1250,
  cost: '$0.00125',
  success: true
});
```

### Métricas Típicas

```typescript
const metrics = {
  parser_assist: {
    avgTokens: 2500,
    avgCost: 0.0025,
    avgLatency: 1800  // ms
  },
  general: {
    avgTokens: 1200,
    avgCost: 0.0012,
    avgLatency: 1200
  },
  compare: {
    avgTokens: 3500,
    avgCost: 0.0175,  // Pro es más caro
    avgLatency: 2500
  }
};
```

## Optimizaciones

### Cache de Resultados

```typescript
// Cache en memoria para resultados de jobs LLM
const cache = new Map<string, CachedResult>();

export async function callGeminiWithCache(
  config: JobConfig,
  prompt: string,
  apiKey: string
): Promise<GeminiResult> {
  const cacheKey = `${config.job}_${hashPrompt(prompt)}`;

  const cached = cache.get(cacheKey);
  if (cached && !isExpired(cached)) {
    return cached.result;
  }

  const result = await callGeminiLLM(config, prompt, apiKey);
  
  cache.set(cacheKey, {
    result,
    timestamp: Date.now(),
    ttl: 3600000  // 1 hora
  });

  return result;
}
```

### Rate Limiting

```typescript
// Límite de 60 requests por minuto por API key
const rateLimiter = new Map<string, number[]>();

export function checkRateLimit(apiKey: string): boolean {
  const now = Date.now();
  const requests = rateLimiter.get(apiKey) || [];

  const recentRequests = requests.filter(
    time => now - time < 60000
  );

  if (recentRequests.length >= 60) {
    return false;
  }

  recentRequests.push(now);
  rateLimiter.set(apiKey, recentRequests);

  return true;
}
```

## Resumen de Jobs Activos vs Legacy

### ✅ Jobs Activos (En Uso)

| Job | Modelo | Uso | Endpoint |
|-----|--------|-----|----------|
| `classify` | gemini-2.5-flash-lite | Clasificación de intención | `/api/llm` |
| `parser_assist` | gemini-3-flash-preview | Generación de código | `/api/llm` |
| `general` | gemini-2.5-flash | Chatbot general | `/api/llm` |
| `repair` | gemini-3-flash-preview | Reparación de código | `/api/llm` |
| `compare` | gemini-3-flash-preview | Comparación de análisis | `/api/llm` |
| `recursion_diagram` | gemini-2.5-flash | Diagramas recursivos | `/api/llm/recursion-diagram` |
| `generate_diagram` | gemini-2.5-flash | Diagramas de trace | `/api/llm/generate-diagram` |

### ℹ️ Clasificación heurística del backend

La clasificación determinista de algoritmos en backend Python (`/classify`) sigue existiendo y es independiente del job `classify` del chat.

## Referencias

- [API Key Configuration](../app/api-key-configuration.md) - Configuración de API key
- [LLM Comparison](../app/llm-comparison.md) - Comparación con análisis de LLM
- [Pseudocode Tracking](../app/pseudocode-tracking.md) - Seguimiento de ejecución
- [Request Flow](../development/request-flow.md) - Flujo de peticiones
- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Internacionalización, Labels y Prompts](../development/i18n-labels-prompts.md)
