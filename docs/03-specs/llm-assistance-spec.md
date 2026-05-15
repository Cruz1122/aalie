# Especificación de asistencia LLM

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/llm/` (router.py, service.py, config.py, schemas.py, providers.py)
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 6 — Asistencia externa (LLM)

## Propósito

Definir el contrato del subsistema LLM de AALIE: arquitectura, proveedores, tipos de trabajo (jobs), inyección de contexto, resolución de API key, manejo de degradación y límites conocidos. Este subsistema es el único punto de integración con modelos de lenguaje externos y no participa en el análisis formal de algoritmos.

## Alcance

Aplica a:
- endpoints `/llm` (POST) y `/llm/status` (GET)
- proveedores Gemini y OpenAI-compatible
- los 5 jobs formales (`general`, `repair`, `compare`, `explain`, `parser_assist`)
- inyección de contexto del asistante (`assistantContext`)
- resolución de API key (backend > client)
- manejo de errores y degradación

No aplica a:
- análisis formal de algoritmos (100% determinista, sin LLM)
- calificación de quizzes vía LLM
- generación de preguntas de quiz vía LLM
- entrenamiento o fine-tuning de modelos ML
- RAG (retrieval augmented generation) — no implementado
- clasificación o inferencia semántica sobre el banco de preguntas

## Arquitectura

```
UI (frontend)
  → BFF (backend-for-frontend, apps/web)
    → FastAPI LLM module (apps/api/app/modules/llm/)
      → GeminiProvider (primary, urllib.request)
      → OpenAICompatibleProvider (secondary, urllib.request)
        → External provider API
```

El frontend envía requests al BFF, que a su vez llama al backend LLM module. El backend se comunica directamente con el proveedor externo vía HTTP POST (`urllib.request`). No hay cola de mensajes ni caché de respuestas.

## Proveedores

### Gemini (primario)

- **Provider class:** `GeminiProvider` en `providers.py`
- **Endpoint base:** configurable vía `GEMINI_ENDPOINT_BASE` (default: `https://generativelanguage.googleapis.com/v1beta/models`)
- **API key:** formato Gemini (`AIza...`), validado por regex `^AIza[0-9A-Za-z_-]{35,40}$`
- **Autenticación:** query parameter `?key=` en la URL
- **Endpoint final:** `{endpoint_base}/{model}:generateContent?key={api_key}`
- **Max retries:** 3 (con backoff de 0.5s)
- **Response extraction:** `candidates[0].content.parts[0].text`
- **Structured output (JSON):** vía `generationConfig.responseMimeType = "application/json"`
- **Thinking disable:** vía `generationConfig.thinkingConfig.thinkingBudget = 0`; si el modelo rechaza (HTTP 400), reintenta sin disable_thinking

### OpenAI-compatible (secundario)

- **Provider class:** `OpenAICompatibleProvider` en `providers.py`
- **Endpoint base:** configurable vía `OPENAI_COMPATIBLE_ENDPOINT_BASE` (default: `https://api.openai.com/v1/chat/completions`)
- **API key:** formato Bearer token en header `Authorization`
- **Max retries:** 2 (con backoff de 0.5s)
- **Response extraction:** `choices[0].message.content`
- **Structured output (JSON):** vía `response_format = {"type": "json_object"}`

### Selección de proveedor

- `LLM_PROVIDER` env var: `"gemini"` (default) o `"openai_compatible"`
- Se construye en `create_provider()` al momento de cada request

## Variables de entorno

| Variable | Default | Propósito |
|---|---|---|
| `LLM_PROVIDER` | `"gemini"` | Proveedor activo: `gemini` o `openai_compatible` |
| `API_KEY` | — | API key del backend (Gemini) |
| `GEMINI_ENDPOINT_BASE` | `https://generativelanguage.googleapis.com/v1beta/models` | Endpoint base para Gemini |
| `OPENAI_COMPATIBLE_ENDPOINT_BASE` | `https://api.openai.com/v1/chat/completions` | Endpoint para OpenAI-compatible |
| `LLM_MODEL_GENERAL` | `"gemini-2.5-flash"` | Modelo para job `general` |
| `LLM_MODEL_REPAIR` | `"gemini-2.5-flash"` | Modelo para job `repair` |
| `LLM_MODEL_COMPARE` | `"gemini-2.5-flash"` | Modelo para job `compare` |
| `LLM_MODEL_EXPLAIN` | `"gemini-2.5-flash"` | Modelo para job `explain` |
| `LLM_MODEL_PARSER_ASSIST` | `"gemini-2.5-flash"` | Modelo para job `parser_assist` |
| `LLM_TIMEOUT_SECONDS` | `30` | Timeout por request al proveedor |
| `LLM_TEMPERATURE_{JOB}` | (por job, ver tabla) | Temperatura del modelo por job |
| `LLM_MAX_TOKENS_{JOB}` | (por job, ver tabla) | Máximo de tokens de salida por job |
| `LLM_DISABLE_THINKING_{JOB}` | (por job, ver tabla) | Deshabilitar thinking por job |

## Jobs

### Tabla de configuración por job

| Job | Temperatura default | Max tokens default | Disable thinking | Schema | Descripción |
|---|---|---|---|---|---|
| `parser_assist` | 0.7 | 4000 | Sí | — | Asistente de pseudocódigo para el editor |
| `general` | 0.7 | 5000 | No | — | Chat general sobre algoritmos |
| `repair` | 0.5 | 2500 | Sí | `REPAIR_SCHEMA` | Reparación de pseudocódigo con errores |
| `compare` | 0.1 | 3500 | Sí | `COMPARE_SCHEMA` | Comparación de análisis formal vs estimación LLM |
| `explain` | 0.35 | 1800 | Sí | — | Explicación pedagógica de conceptos |

### Descripción de jobs

#### `general`
- **Propósito:** Chat técnico general sobre análisis de algoritmos
- **System prompt:** Asistente técnico para análisis de algoritmos, con reglas de gramática de pseudocódigo
- **Input:** `prompt`, `context`, `assistantContext`, `chatHistory` (opcional)
- **Output:** texto libre con posible pseudocódigo
- **Locale:** es/en (selecciona system prompt correspondiente)
- **Restricción:** no debe mostrar identificadores internos del catálogo (`skill.*`, `topic.*`)

#### `repair`
- **Propósito:** Corregir pseudocódigo con errores de sintaxis para que sea parseable por la gramática del proyecto
- **System prompt:** Instrucciones estrictas de gramática + formato de salida JSON
- **Input:** `prompt` (código con errores), contexto opcional
- **Output:** JSON estructurado con `code`, `removedLines[]`, `addedLines[]`
- **Response schema:** `REPAIR_SCHEMA` (objeto con `code: string`, `removedLines: number[]`, `addedLines: number[]`)
- **Alias soportados en parsing:** `codigo_corregido`, `codigoCorregido`, `corrected_code`, `correctedCode`, `pseudocode`, `codigo`
- **Validación post-procesamiento:** verifica que `code` no esté vacío; busca JSON en codeblock si el parseo directo falla

#### `compare`
- **Propósito:** Comparar el análisis formal de AALIE con una estimación independiente del LLM
- **System prompt:** "Compara el análisis formal recibido con tu estimación independiente"
- **Input:** contexto del análisis formal + prompt
- **Output:** JSON con `analysis` (objeto) y `note` (string)
- **Response schema:** `COMPARE_SCHEMA`
- **Temperatura baja (0.1):** para respuestas consistentes y reproducibles

#### `explain`
- **Propósito:** Explicación pedagógica de conceptos de complejidad
- **System prompt:** "Explica conceptos de análisis de complejidad con enfoque pedagógico"
- **Input:** `prompt` con la pregunta del estudiante
- **Output:** texto explicativo
- **Locale:** es/en

#### `parser_assist`
- **Propósito:** Asistente de pseudocódigo integrado en el editor de código
- **System prompt:** Experto en pseudocódigo académico para análisis de algoritmos, con reglas estrictas de gramática
- **Input:** `prompt` (posible solicitud de código), contexto del editor
- **Output:** bloque de pseudocódigo válido + explicación breve
- **Locale:** es/en

### Jobs adicionales (endpoints BFF, no backend directo)

Los siguientes jobs se manejan en el BFF y no tienen endpoint directo en el módulo LLM del backend:

| Job | Descripción |
|---|---|
| `classify` | Clasificación de técnica de algoritmo (divide_and_conquer, greedy, etc.) |
| `recursion_diagram` | Generación de diagrama de recursión |
| `generate_diagram` | Generación de diagrama Mermaid desde descripción |

Estos jobs consumen el endpoint `/llm` con `job="general"` pero con `system_prompt` personalizado seteado desde el BFF.

## Inyección de contexto

### `context` (string)
- Texto adicional concatenado antes del prompt del usuario
- Separado por doble nueva línea
- Uso típico: fragmentos de documentación, resultados de análisis, pseudocódigo

### `assistantContext` (objeto)
- Objeto JSON con datos estructurados del asistente (dashboard de quizzes, revisión de sesión)
- Se serializa como JSON y se antepone al prompt
- **Sanitización:** `_redact_assistant_context_for_llm()` elimina identificadores internos (`skillIds`, `weakSkillIds`) y los reemplaza por conteos anonimizados (`weakSkillIdCount`)
- Propósito: permitir que el LLM responda sobre el progreso del estudiante sin exponer identificadores internos del catálogo

### `chatHistory`
- Lista de mensajes previos (`ChatMessage[]` con `role` y `content`)
- Se toman los últimos 10 mensajes
- Se construye el array de mensajes para el proveedor: `[...chatHistory[-10:], {role: "user", content: user_prompt}]`

## Resolución de API key

1. Si el request incluye `apiKey` y es válida (formato Gemini): se usa la key del cliente.
2. Si no hay key del cliente o es inválida: se usa `API_KEY` del entorno del backend.
3. Si ninguna está disponible: el request falla con `LLM_API_KEY_REQUIRED`.

```
resolve_api_key(request_api_key):
  1. validate(request_api_key) → usar client key
  2. os.getenv("API_KEY") → usar server key
  3. return None → LLM_API_KEY_REQUIRED
```

La respuesta incluye `used_server_key: bool` para trazabilidad.

## Formatos de request y response

### Request (`POST /llm`)

```json
{
  "job": "general",
  "prompt": "Explica qué es O(n log n)",
  "context": "El estudiante está viendo merge sort",
  "assistantContext": { "quizDashboard": { "weakSkillIdCount": 3 } },
  "chatHistory": [
    { "role": "user", "content": "¿Qué es big O?" },
    { "role": "model", "content": "Big O describe..." }
  ],
  "apiKey": "AIza...",
  "locale": "es"
}
```

### Response exitosa

```json
{
  "ok": true,
  "job": "general",
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "requestId": "uuid",
  "data": {
    "text": "O(n log n) significa...",
    "structured": null,
    "metadata": {
      "responseId": "...",
      "modelVersion": "gemini-2.5-flash",
      "finishReason": "STOP",
      "usage": { ... }
    }
  },
  "status": 200
}
```

### Response con error

```json
{
  "ok": false,
  "error": "API key LLM no disponible",
  "errorCode": "LLM_API_KEY_REQUIRED",
  "requestId": "uuid",
  "status": 400
}
```

### Status (`GET /llm/status`)

```json
{
  "ok": true,
  "status": {
    "timestamp": "2026-05-14T10:00:00.000Z",
    "config": {
      "provider": "gemini",
      "timeouts": { "requestSeconds": 30 },
      "jobs": {
        "parser_assist": "gemini-2.5-flash",
        "general": "gemini-2.5-flash",
        "repair": "gemini-2.5-flash",
        "compare": "gemini-2.5-flash",
        "explain": "gemini-2.5-flash"
      }
    },
    "jobs": { ... },
    "apiKey": {
      "serverAvailable": true
    }
  }
}
```

## System prompts

Definidos en `config.py` como `SYSTEM_PROMPTS[locale][job]`.

### Reglas gramaticales comunes (español)

```
Usa EXCLUSIVAMENTE la gramatica del proyecto.
Todo algoritmo debe tener forma nombre(params) BEGIN ... END.
No uses prefijos ALGORITHM/PROCEDURE/FUNCTION ni END IF/END WHILE/END FOR.
Para cerrar bloques usa solo END.
IF debe ser IF (condicion) THEN BEGIN ... END y ELSE BEGIN ... END.
WHILE y FOR requieren DO antes del bloque.
Usa asignacion <-, modulo MOD, division entera DIV, y ; al final de cada sentencia interna.
No uses tipos en variables ni sintaxis de otros lenguajes.
```

### Reglas gramaticales comunes (inglés)

```
Use EXCLUSIVELY the project's grammar.
Every algorithm must use name(params) BEGIN ... END.
Do not use ALGORITHM/PROCEDURE/FUNCTION prefixes nor END IF/END WHILE/END FOR.
Close control blocks with END only.
IF must be IF (condition) THEN BEGIN ... END and ELSE BEGIN ... END.
WHILE and FOR require DO before the block.
Use <- assignment, MOD for modulo, DIV for integer division, and ; at the end of internal statements.
Do not use typed variables or syntax from other languages.
```

### Regla común a todos los jobs

Ningún job debe exponer identificadores internos del catálogo (`skill.*`, `topic.*`, etc.). Solo debe usar texto legible presente en el contexto del usuario.

## System prompt injection (BFF)

El endpoint backend `/llm` acepta `system_prompt` desde el `ProviderRequest` pero este se deriva del `job` y `locale` en el backend, no se pasa desde el BFF directamente como campo del request. El BFF puede seleccionar el `job` adecuado para obtener el system prompt correspondiente.

Para jobs personalizados (`classify`, `recursion_diagram`, `generate_diagram`), el BFF envía un request con `job="general"` pero incluye las instrucciones personalizadas en el campo `context` o `prompt`.

## Degradación sin API key

### `/llm/status`
- `apiKey.serverAvailable` = `false`
- El endpoint responde OK, indicando que no hay key disponible

### `/llm` (POST)
- Retorna `HTTP 400` con `errorCode: "LLM_API_KEY_REQUIRED"`
- Mensaje: `"API key LLM no disponible"`
- No se contacta al proveedor

### Manejo de errores del proveedor

| Condición | ErrorCode | HTTP Status | Comportamiento |
|---|---|---|---|
| Sin API key | `LLM_API_KEY_REQUIRED` | 400 | Rechazo inmediato |
| Prompt vacío | `LLM_BAD_REQUEST` | 400 | Rechazo inmediato |
| Timeout de conexión | `LLM_TIMEOUT` | 504 | Reintento (3 para Gemini, 2 para OpenAI) |
| Rate limit (HTTP 429) | `LLM_RATE_LIMIT` | 429 | Sin reintento |
| Error 4xx no manejado | `LLM_BAD_REQUEST` | 400 | Sin reintento |
| Error 5xx | `LLM_UPSTREAM` | 502 | Sin reintento |
| Error de conexión | `LLM_UNAVAILABLE` | 503 | Sin reintento |
| Error interno inesperado | `LLM_INTERNAL_ERROR` | 500 | Log de excepción |

## No RAG

El subsistema LLM **no implementa Retrieval Augmented Generation**. Todo el contexto enviado al proveedor debe incluirse explícitamente en el request (`context`, `assistantContext`, `chatHistory`). No hay búsqueda vectorial, índices de embeddings, ni recuperación automática de documentos.

## No ML

No hay entrenamiento, fine-tuning, ni modelos de ML propios. Todo el poder de inferencia lingüística proviene exclusivamente de los proveedores externos.

## Riesgos

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Disponibilidad del proveedor | El LLM no responde | Error controlado con `LLM_UNAVAILABLE` |
| Límites de cuota (rate limit) | Requests rechazados | Error `LLM_RATE_LIMIT`, reintento limitado |
| Variabilidad en calidad de respuesta | Respuesta inexacta o no parseable | Post-procesamiento con `_extract_json_object`, validación de estructura |
| Costo del proveedor | Costos operativos | Sin mitigación actual |
| Exposición de datos | Identificadores internos visibles | `_redact_assistant_context_for_llm()` sanitiza el contexto |
| Latencia de red | Tiempo de respuesta impredecible | Timeout configurable (`LLM_TIMEOUT_SECONDS`, default 30s) |

## Invariantes

1. El análisis formal de algoritmos es 100% determinista y no utiliza LLM.
2. La evaluación de quizzes no utiliza LLM.
3. Todos los jobs post-procesan la respuesta para extraer JSON estructurado cuando corresponde.
4. La sanitización de contexto se aplica antes de enviar al proveedor.
5. No se almacenan respuestas del LLM para reuso.
6. El proveedor se selecciona por request, no por sesión.
7. El timeout aplica por request individual, no por pipeline completo.
8. Misma entrada + misma configuración = misma llamada al proveedor (sin caché).

## Casos soportados

1. **Chat general:** usuario pregunta sobre complejidad → LLM responde con explicación.
2. **Reparación de código:** usuario envía pseudocódigo con errores → LLM devuelve JSON con corrección.
3. **Comparación de análisis:** análisis formal de AALIE vs estimación LLM → JSON con comparación.
4. **Asistencia en editor:** usuario escribe pseudocódigo → asistente sugiere correcciones.
5. **Dashboard contextual:** LLM recibe datos anonimizados del progreso del estudiante.
6. **Diagramas (BFF):** descripción de algoritmo → LLM genera código Mermaid.

## Casos no soportados

1. **RAG:** no hay recuperación automática de documentos.
2. **Fine-tuning:** no hay entrenamiento de modelos.
3. **Generación de quizzes:** las preguntas no se generan por LLM.
4. **Calificación de quizzes:** la evaluación no usa LLM.
5. **Inferencia semántica sobre banco:** no se usa LLM para clasificar preguntas.
6. **Streaming:** no hay soporte para respuestas streaming.
7. **Múltiples proveedores simultáneos:** solo un proveedor activo por request.

## Recomendación operacional

Gemini es el proveedor recomendado como primario por:
- Compatibilidad nativa con el formato de API key del proyecto
- Soporte para `thinkingConfig` y control fino de generación
- Endpoint de pago por uso sin cargo fijo
- Documentación y SDK estables

OpenAI-compatible como fallback para entornos que ya tienen integración OpenAI.

## Archivos relacionados

- `../02-architecture/llm-architecture.md`
- `../08-content/llm-context-guide.md`
- `../04-api/llm-api.md`
