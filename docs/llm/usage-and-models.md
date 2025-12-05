# Usos de LLM, Jobs y Modelos

## Descripción General

El sistema utiliza modelos de lenguaje grande (LLM) de Google Gemini para diversas tareas relacionadas con el análisis de algoritmos. La configuración está centralizada y cada "job" (tarea) tiene asignado un modelo específico optimizado para ese propósito.

## Configuración Centralizada

**Ubicación**: `apps/web/src/app/api/llm/llm-config.ts`

### Estructura de Configuración

```typescript
export type LLMJob =
  | "classify"        // ⚠️ LEGACY - No se usa, clasificación es por heurística
  | "parser_assist"   // Asistencia para generar/corregir código
  | "general"         // Chatbot general
  | "simplifier"      // Simplificación matemática
  | "repair"          // Reparación de código con errores
  | "compare";        // Comparación de análisis

export const GEMINI_MODELS = {
  classify: "gemini-2.0-flash-lite",      // ⚠️ LEGACY - No se usa
  parser_assist: "gemini-2.5-flash",
  general: "gemini-2.5-flash",
  simplifier: "gemini-2.5-flash",
  repair: "gemini-2.5-flash",
  compare: "gemini-2.5-pro",
};
```

## Jobs Disponibles

### ⚠️ LEGACY: Classify (NO SE USA)

**Estado**: **DEPRECADO** - No se utiliza en producción

**Razón**: La clasificación de algoritmos se realiza completamente por **heurística** en el backend Python mediante el endpoint `/classify`. No se usa LLM para esta tarea.

**Modelo anterior**: `gemini-2.0-flash-lite`

**Nota**: Aunque el job existe en la configuración, **no hay ningún endpoint activo** que lo use. La clasificación es 100% determinista y basada en análisis del AST.

---

### 1. Parser Assist

**Propósito**: Generar código de algoritmos y asistir en corrección de sintaxis

**Modelo**: `gemini-2.5-flash`

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

### 3. Simplifier

**Propósito**: Simplificar expresiones matemáticas de análisis

**Modelo**: `gemini-2.5-flash`

**Configuración**:
- `maxTokens`: 8000
- `temperature`: 0 (completamente determinista)

**Uso**:
```typescript
// Usado internamente por el backend durante análisis

// El backend llama a este job para simplificar sumatorias
// y expresiones algebraicas complejas
```

**Características**:
- Simplifica sumatorias a formas cerradas
- Elimina paréntesis innecesarios
- Agrupa términos similares
- Genera forma polinómica T(n) = an² + bn + c
- Respeta notación original (n vs N)

**Uso**: Interno del backend, no expuesto directamente al frontend

### 4. Repair

**Propósito**: Reparar código con errores de sintaxis

**Modelo**: `gemini-2.5-flash`

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

### 5. Compare

**Propósito**: Comparar análisis del sistema con análisis del LLM

**Modelo**: `gemini-2.5-pro` (modelo más potente para análisis preciso)

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

### 6. Recursion Diagram (Adicional)

**Propósito**: Generar diagramas de árbol de recursión

**Modelo**: `gemini-2.0-flash` (usado en endpoint específico)

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

### Gemini 2.5 Flash

**Usado en**: `parser_assist`, `general`, `simplifier`, `repair`

**Características**:
- Rápido y eficiente
- Bueno para tareas de generación y análisis
- Costo moderado
- Límite de contexto: 1M tokens

**Precios** (a diciembre 2024):
- Input: $0.075 por millón de tokens
- Output: $0.30 por millón de tokens

### Gemini 2.5 Pro

**Usado en**: `compare`

**Características**:
- Más potente y preciso
- Mejor para análisis matemático complejo
- Costo más alto
- Límite de contexto: 2M tokens

**Precios**:
- Input: $1.25 por millón de tokens
- Output: $5.00 por millón de tokens

### Gemini 2.0 Flash (Lite)

**Usado en**: `recursion-diagram` (endpoint específico)

**Características**:
- Versión ligera y rápida
- Bueno para generación de diagramas
- Costo bajo

**Nota**: El job `classify` está configurado con `gemini-2.0-flash-lite` pero **NO SE USA** en producción.

## Endpoints de LLM

### Estructura de Endpoints

```
/api/llm/
├── route.ts              # Endpoint principal (POST /api/llm)
├── recursion-diagram/    # Generación de diagramas recursivos
└── status/               # Validación de API key
```

### Endpoint Principal: POST /api/llm

**Request**:
```typescript
{
  "job": "parser_assist" | "general" | "simplifier" | "repair" | "compare",
  "message"?: string,      // Para parser_assist y general
  "history"?: Message[],   // Para general (contexto del chat)
  "code"?: string,         // Para repair
  "errors"?: Error[],      // Para repair
  "systemAnalysis"?: any,  // Para compare
  "source"?: string        // Para compare
}
```

**Response**:
```typescript
{
  "text": string,          // Respuesta del LLM
  "tokensUsed": number,
  "cost": number
}
```

### Middleware Común

```typescript
// apps/web/src/app/api/llm/route.ts

export async function POST(request: Request) {
  // Obtener API key (prioridad: header > env)
  const apiKey = request.headers.get('X-API-Key') || 
                 process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: 'API key required' },
      { status: 401 }
    );
  }

  // Obtener configuración del job
  const { job } = await request.json();
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
Clasificación de intención (local, sin LLM)
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
# .env.local

# API key del servidor (fallback si usuario no proporciona la suya)
GEMINI_API_KEY=AIza...

# Configuración de LLM
NEXT_PUBLIC_DEFAULT_MODEL=gemini-2.5-flash
NEXT_PUBLIC_MAX_TOKENS=16000
```

### Prioridad de API Keys

1. **API key del usuario** (header `X-API-Key`) - Prioridad más alta
2. **API key del servidor** (`GEMINI_API_KEY` en env) - Fallback

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
// Cache en memoria para resultados de simplifier
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
| `parser_assist` | gemini-2.5-flash | Generación de código | `/api/llm` |
| `general` | gemini-2.5-flash | Chatbot general | `/api/llm` |
| `simplifier` | gemini-2.5-flash | Simplificación matemática | Interno backend |
| `repair` | gemini-2.5-flash | Reparación de código | `/api/llm` |
| `compare` | gemini-2.5-pro | Comparación de análisis | `/api/llm` |
| (recursion_diagram) | gemini-2.0-flash | Diagramas recursivos | `/api/llm/recursion-diagram` |

### ❌ Jobs Legacy (NO Se Usan)

| Job | Modelo | Estado | Razón |
|-----|--------|--------|-------|
| `classify` | gemini-2.0-flash-lite | **DEPRECADO** | Clasificación es por heurística en `/classify` (backend Python) |

## Referencias

- [API Key Configuration](../app/api-key-configuration.md) - Configuración de API key
- [LLM Comparison](../app/llm-comparison.md) - Comparación con análisis de LLM
- [Pseudocode Tracking](../app/pseudocode-tracking.md) - Seguimiento de ejecución
- [Request Flow](../development/request-flow.md) - Flujo de peticiones
- [Google Gemini API Documentation](https://ai.google.dev/docs)
