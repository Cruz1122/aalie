# API LLM

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/llm/router.py`, `apps/api/app/modules/llm/schemas.py`, `apps/api/app/modules/llm/service.py`, `apps/api/app/modules/llm/config.py`, `apps/web/src/app/api/llm/route.ts`, `apps/web/src/app/api/llm/status/route.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.1.6

## Propósito

Documentar los endpoints del subsistema LLM (backend + BFF) y la forma de sus payloads expuestos al frontend.

## Alcance

Cubre `POST /llm`, `GET /llm/status` (backend), `POST /api/llm`, `GET /api/llm/status` (BFF), y la lógica de jobs LLM.

## Fuente de verdad

- `apps/api/app/modules/llm/router.py`
- `apps/api/app/modules/llm/schemas.py`
- `apps/api/app/modules/llm/service.py`
- `apps/api/app/modules/llm/config.py`
- `apps/web/src/app/api/llm/route.ts`
- `apps/web/src/app/api/llm/status/route.ts`

## Estructura

### `POST /llm` (backend)

- Path: `/llm`
- Method: `POST`
- Consumidor principal: BFF `api/llm`

Ejecuta un job LLM contra el proveedor configurado (Gemini por defecto).

#### Request `LLMRequest`

```json
{
  "job": "general",
  "prompt": "Explica la complejidad de una búsqueda binaria",
  "schema": { "type": "object", "properties": {} },
  "context": "El usuario está estudiando algoritmos de búsqueda",
  "assistantContext": { "previousAnalysis": "O(log n)" },
  "chatHistory": [
    { "role": "user", "content": "¿Qué es búsqueda binaria?" },
    { "role": "model", "content": "Es un algoritmo de búsqueda en arreglos ordenados." }
  ],
  "apiKey": "opcional-clave-cliente",
  "locale": "es"
}
```

Campos:

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `job` | `"parser_assist"\|"general"\|"repair"\|"compare"\|"explain"` | `"general"` | Tipo de job LLM |
| `prompt` | `string` | — | Prompt principal para el modelo |
| `schema` | `Dict\|null` | `null` | Schema JSON esperado en la respuesta (alias: `response_schema`) |
| `context` | `string\|null` | `null` | Contexto adicional para el modelo |
| `assistantContext` | `Dict\|null` | `null` | Contexto estructurado del asistente (alias: `assistant_context`) |
| `chatHistory` | `ChatMessage[]\|null` | `null` | Historial de conversación (alias: `chat_history`) |
| `apiKey` | `string\|null` | `null` | API key del cliente (se prefiere server key via env) |
| `locale` | `"es"\|"en"\|null` | `null` | Idioma para respuestas |

#### Response `LLMResponse`

```json
{
  "ok": true,
  "data": {
    "text": "La búsqueda binaria tiene complejidad O(log n)...",
    "structured": null,
    "metadata": {
      "responseId": "uuid",
      "modelVersion": "gemini-2.5-flash",
      "finishReason": "stop",
      "usage": { "promptTokenCount": 45, "candidatesTokenCount": 120 }
    }
  },
  "model": "gemini-2.5-flash",
  "requestId": "a1b2c3d4-...",
  "error": null,
  "errorCode": null
}
```

Campos de error:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `error` | `string\|null` | Mensaje de error legible |
| `errorCode` | `string\|null` | Código de error: `LLM_API_KEY_REQUIRED`, `LLM_BAD_REQUEST`, etc. |
| `status` | `int` | Código HTTP (incluido solo en errores) |

#### Jobs disponibles

| Job | Propósito | Temperatura | Modelo default | Schema forzado |
|-----|-----------|-------------|----------------|----------------|
| `parser_assist` | Asistencia para escribir pseudocódigo válido | 0.7 | `gemini-2.5-flash` | No |
| `general` | Consulta general sobre análisis de algoritmos | 0.7 | `gemini-2.5-flash` | No |
| `repair` | Corregir pseudocódigo con errores de sintaxis | 0.5 | `gemini-2.5-flash` | `{code, removedLines, addedLines}` |
| `compare` | Comparar análisis formal con estimación del LLM | 0.1 | `gemini-2.5-flash` | `{analysis, note}` |
| `explain` | Explicación pedagógica de conceptos | 0.35 | `gemini-2.5-flash` | No |

### `GET /llm/status` (backend)

- Path: `/llm/status`
- Method: `GET`
- Consumidor principal: BFF `api/llm/status`

#### Response `LLMStatusResponse`

```json
{
  "ok": true,
  "status": {
    "timestamp": "2026-05-18T12:00:00+00:00",
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
    "jobs": {
      "parser_assist": "gemini-2.5-flash",
      "general": "gemini-2.5-flash",
      "repair": "gemini-2.5-flash",
      "compare": "gemini-2.5-flash",
      "explain": "gemini-2.5-flash"
    },
    "apiKey": {
      "serverAvailable": true
    }
  }
}
```

Campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `boolean` | Status consultado exitosamente |
| `status.timestamp` | `string` (ISO 8601) | Momento de la consulta |
| `status.config.provider` | `string` | Proveedor configurado (`gemini` u `openai_compatible`) |
| `status.config.timeouts` | `Dict` | Timeouts configurados |
| `status.config.jobs` | `Dict` | Modelos configurados por job |
| `status.jobs` | `Dict` | Modelos activos por job (duplicado de config.jobs) |
| `status.apiKey.serverAvailable` | `boolean` | Si hay API key configurada en servidor |

### `POST /api/llm` (BFF)

- Path: `/api/llm`
- Method: `POST`
- Consumidor principal: UI

Proxy que reenvía el payload al backend `POST /llm`. El navegador nunca llama al proveedor directamente. En caso de error de conexión retorna `500`; si la respuesta del backend tiene forma inesperada retorna `502`.

### `GET /api/llm/status` (BFF)

- Path: `/api/llm/status`
- Method: `GET`
- Consumidor principal: UI

Proxy que reenvía al backend `GET /llm/status`. Mismos errores de conexión que `/api/llm`.

## Configuración de modelos por entorno

Los modelos se configuran mediante variables de entorno en `apps/api/.env`:

| Variable | Job |
|----------|-----|
| `LLM_MODEL_CLASSIFY` | Clasificación |
| `LLM_MODEL_PARSER_ASSIST` | parser_assist |
| `LLM_MODEL_GENERAL` | general |
| `LLM_MODEL_REPAIR` | repair |
| `LLM_MODEL_COMPARE` | compare |
| `LLM_MODEL_RECURSION_DIAGRAM` | Diagramas de recursión |
| `LLM_MODEL_GENERATE_DIAGRAM` | Generación de diagramas |

Variables adicionales de configuración LLM:

| Variable | Default | Descripción |
|----------|---------|-------------|
| `LLM_PROVIDER` | `gemini` | Proveedor (`gemini` u `openai_compatible`) |
| `LLM_TIMEOUT_SECONDS` | `30` | Timeout de requests al proveedor |
| `LLM_TEMPERATURE_{JOB}` | (por job) | Temperatura específica por job |
| `LLM_MAX_TOKENS_{JOB}` | (por job) | Máximo de tokens por job |
| `LLM_DISABLE_THINKING_{JOB}` | (por job) | Deshabilitar thinking para jobs estructurados |

## Ejemplos

- `repair`: devuelve JSON estructurado con `code`, `removedLines`, `addedLines` — el backend normaliza alias del proveedor.
- `compare`: usa schema estricto y temperatura baja (0.1) para contraste determinista.
- `parser_assist`: incluye reglas gramaticales en el system prompt para que el LLM genere código parseable.

## Límites conocidos

- El backend está preparado para multi-provider, pero actualmente solo implementa Gemini y OpenAI-compatible.
- Errores de cuota, timeout o proveedor se normalizan en backend con `errorCode`.
- `apiKey` enviada por cliente se prefiere sobre server key; si ninguna es válida, se retorna `LLM_API_KEY_REQUIRED`.
- `data` en la respuesta depende del proveedor y del job; el contrato mínimo es el envelope del backend.

## Archivos relacionados

- `schemas/llm-schema.md`
- `classification-api.md`
- `../02-architecture/llm-integration.md`
