# API LLM

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/llm/router.py`, `apps/api/app/modules/llm/schemas.py`, `apps/api/app/modules/llm/service.py`, `apps/api/app/modules/llm/config.py`, `apps/web/src/app/api/llm/route.ts`, `apps/web/src/app/api/llm/status/route.ts`
**Última revisión:** 2026-10-07
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

Ejecuta un job LLM contra el proveedor configurado. Si no se define `LLM_PROVIDER`, la
clave selecciona automáticamente Gemini (`AIza...`), OpenAI (`sk-proj...`), Anthropic
(`sk-ant...`), OpenRouter (`sk-or-v1...`), xAI (`xai...`) o Groq (`gsk_...`).

#### Request `LLMRequest`

```json
{
  "job": "general",
  "model": "gpt-6.1-sol",
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
| `model` | `string\|null` | `null` | ID exacto del modelo; si se omite usa el default del proveedor/job |
| `prompt` | `string` | — | Prompt principal para el modelo |
| `schema` | `Dict\|null` | `null` | Schema JSON esperado en la respuesta (alias: `response_schema`) |
| `context` | `string\|null` | `null` | Contexto adicional para el modelo |
| `assistantContext` | `Dict\|null` | `null` | Contexto estructurado del asistente (alias: `assistant_context`) |
| `chatHistory` | `ChatMessage[]\|null` | `null` | Historial de conversación (alias: `chat_history`) |
| `apiKey` | `string\|null` | `null` | API key propia del cliente; si es válida se usa antes que la clave del servidor |
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
      "modelVersion": "gemini-3.8-flash",
      "finishReason": "stop",
      "usage": { "promptTokenCount": 45, "candidatesTokenCount": 120 }
    }
  },
  "model": "gemini-3.8-flash",
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
| `parser_assist` | Asistencia para escribir pseudocódigo válido | 0.7 | `gemini-3.8-flash` | No |
| `general` | Consulta general sobre análisis de algoritmos | 0.7 | `gemini-3.8-flash` | No |
| `repair` | Corregir pseudocódigo con errores de sintaxis | 0.5 | `gemini-3.8-flash` | `{code, removedLines, addedLines}` |
| `compare` | Comparar análisis formal con estimación del LLM | 0.1 | `gemini-3.8-flash` | `{analysis, note}` |
| `explain` | Explicación pedagógica de conceptos | 0.35 | `gemini-3.8-flash` | No |

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
        "parser_assist": "gemini-3.8-flash",
        "general": "gemini-3.8-flash",
        "repair": "gemini-3.8-flash",
        "compare": "gemini-3.8-flash",
        "explain": "gemini-3.8-flash"
      }
    },
    "jobs": {
      "parser_assist": "gemini-3.8-flash",
      "general": "gemini-3.8-flash",
      "repair": "gemini-3.8-flash",
      "compare": "gemini-3.8-flash",
      "explain": "gemini-3.8-flash"
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
| `status.config.provider` | `string` | Proveedor configurado (`gemini`, `openai_compatible`, `anthropic`, `openrouter`, `xai` o `groq`) |
| `status.config.timeouts` | `Dict` | Timeouts configurados |
| `status.config.jobs` | `Dict` | Modelos configurados por job |
| `status.jobs` | `Dict` | Modelos activos por job (duplicado de config.jobs) |
| `status.apiKey.serverAvailable` | `boolean` | Si hay API key configurada en servidor |
| `status.apiKey.configured` | `boolean` | Si existe una clave válida en runtime, sin revelar su valor |
| `status.apiKey.provider` | `string\|null` | Proveedor detectado para la clave server-side |
| `status.apiKey.serverModel` | `string\|null` | Modelo institucional; para OpenAI es `gpt-5.4-mini` |

`serverAvailable` es contextual: solo es `true` para una sesión autenticada cuyo correo
termina exactamente en `@ucaldas.edu.co`. La clave nunca se incluye en respuestas ni se
envía al navegador. Una clave server-side OpenAI usada por esa ruta fuerza el modelo
`gpt-5.4-mini`.

### `POST /api/llm` (BFF)

- Path: `/api/llm`
- Method: `POST`
- Consumidor principal: UI

Proxy que reenvía el payload al backend `POST /llm`. El navegador nunca llama al proveedor directamente. En caso de error de conexión retorna `500`; si la respuesta del backend tiene forma inesperada retorna `502`.
El backend también impone un límite independiente de 256 KiB y límites de cardinalidad del historial, incluso cuando se accede directamente.

Para cuentas `@ucaldas.edu.co`, el BFF aplica una cuota separada de 5 requests por minuto
por usuario. Tres excesos de cuota LLM dentro de cinco minutos activan un bloqueo temporal
persistido; por defecto dura una hora y responde `403 ACCOUNT_TEMPORARILY_BLOCKED`. El
backend repite la cuota en un bucket separado para proteger llamadas directas al API.

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
| `LLM_PROVIDER` | vacío (detección automática) | Proveedor (`gemini`, `openai_compatible`, `anthropic`, `openrouter`, `xai` o `groq`); una clave reconocida tiene prioridad |
| `API_KEY` | — | Clave server-side (`AIza...`, `sk-proj...`, `sk-ant...`, `sk-or-v1...`, `xai...` o `gsk_...`); solo se habilita automáticamente para `@ucaldas.edu.co` |
| `OPENAI_API_KEY` | — | Clave OpenAI server-side alternativa; tiene prioridad sobre `API_KEY` |
| `OPENAI_COMPATIBLE_ENDPOINT_BASE` | `https://api.openai.com/v1/chat/completions` | Endpoint compatible con OpenAI |
| `OPENROUTER_ENDPOINT_BASE` | `https://openrouter.ai/api/v1/chat/completions` | Endpoint OpenRouter |
| `XAI_ENDPOINT_BASE` | `https://api.x.ai/v1/chat/completions` | Endpoint xAI |
| `GROQ_ENDPOINT_BASE` | `https://api.groq.com/openai/v1/chat/completions` | Endpoint Groq |
| `ANTHROPIC_ENDPOINT_BASE` | `https://api.anthropic.com/v1/messages` | Endpoint Anthropic |
| `AALIE_RATE_LIMIT_LLM_UCALDAS_AUTH` | `5` | Requests LLM por ventana de 60 segundos para cuentas institucionales |
| `AALIE_RATE_LIMIT_LLM_BACKEND_AUTH` | `5` | Cuota server-side para impedir bypass del BFF en llamadas directas |
| `AALIE_RATE_LIMIT_SERVICE_TOKEN` | fallback a `RATE_LIMIT_HMAC_SECRET` | Credencial privada del BFF para `/internal/rate-limits/check`; separar en producción |
| `AALIE_ABUSE_STRIKES_TO_BAN` | `3` | Excesos LLM dentro de la ventana de abuso antes del bloqueo |
| `AALIE_ABUSE_STRIKE_WINDOW_SECONDS` | `300` | Ventana para acumular excesos |
| `AALIE_ABUSE_BAN_SECONDS` | `3600` | Duración del bloqueo temporal |
| `LLM_TIMEOUT_SECONDS` | `30` | Timeout de requests al proveedor |
| `LLM_TEMPERATURE_{JOB}` | (por job) | Temperatura específica por job |
| `LLM_MAX_TOKENS_{JOB}` | (por job) | Máximo de tokens por job |
| `LLM_DISABLE_THINKING_{JOB}` | (por job) | Deshabilitar thinking para jobs estructurados |

## Ejemplos

- `repair`: devuelve JSON estructurado con `code`, `removedLines`, `addedLines` — el backend normaliza alias del proveedor.
- `compare`: usa schema estricto y temperatura baja (0.1) para contraste determinista.
- `parser_assist`: incluye reglas gramaticales en el system prompt para que el LLM genere código parseable.

## Límites conocidos

- El backend implementa Gemini, proveedores compatibles con OpenAI (OpenAI, OpenRouter, xAI y Groq) y la API nativa de Anthropic.
- Los presets del frontend muestran IDs de ejemplo por proveedor; la opción personalizado permite usar cualquier ID válido que el proveedor acepte.
- Las claves introducidas por el cliente se mantienen en `sessionStorage` durante la sesión del navegador; las claves de servidor permanecen únicamente en el runtime del backend.
- Errores de cuota, timeout o proveedor se normalizan en backend con `errorCode`.
- `apiKey` enviada por cliente se prefiere sobre la server key; la server key solo se resuelve automáticamente para una identidad `@ucaldas.edu.co`.
- `LLM_SERVER_KEY_RESTRICTED` se retorna cuando hay una server key configurada pero la cuenta no tiene autorización institucional.
- El proveedor compatible con OpenAI usa `max_completion_tokens` para modelos GPT-6 y la ruta institucional fija `gpt-5.4-mini`.
- `data` en la respuesta depende del proveedor y del job; el contrato mínimo es el envelope del backend.

## Archivos relacionados

- `schemas/llm-schema.md`
- `classification-api.md`
- `../02-architecture/llm-integration.md`
