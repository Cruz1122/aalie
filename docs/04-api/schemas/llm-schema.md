# Schema LLM

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/llm/schemas.py`, `apps/api/app/modules/llm/service.py`, `apps/api/app/modules/llm/config.py`
**Última revisión:** 2026-10-07
**Relacionado con informe técnico:** sección 4.2.5

## Propósito

Documentar la forma de los payloads LLM expuestos por el backend y el BFF.

## Alcance

Schema documental para `POST /llm`, `GET /llm/status` (backend) y sus proxies BFF.

## Fuente de verdad

- `apps/api/app/modules/llm/schemas.py` (clases `LLMRequest`, `LLMResponse`, `LLMStatusResponse`, `ChatMessage`)
- `apps/api/app/modules/llm/service.py`
- `apps/api/app/modules/llm/config.py`
- `apps/web/src/app/api/llm/route.ts`
- `apps/web/src/app/api/llm/status/route.ts`

## Schemas

### `LLMRequest`

```json
{
  "job": "general",
  "model": "gpt-6.1-sol",
  "prompt": "Explica la complejidad de O(log n)",
  "response_schema": { "type": "object", "properties": {} },
  "context": "El usuario está en el módulo de notación asintótica",
  "assistant_context": { "previousMessages": 3 },
  "chat_history": [
    { "role": "user", "content": "¿Qué es O(log n)?" }
  ],
  "api_key": "AIza..., sk-proj..., sk-ant..., sk-or-v1..., xai... o gsk_...",
  "locale": "es"
}
```

| Campo | Tipo | Default | Alias JSON | Descripción |
|-------|------|---------|------------|-------------|
| `job` | `Literal["parser_assist","general","repair","compare","explain"]` | `"general"` | — | Tipo de job LLM |
| `model` | `string\|null` | `null` | — | ID exacto del modelo solicitado; opcional para usar el default del job |
| `prompt` | `string` | — | — | Prompt principal |
| `response_schema` | `Dict\|null` | `null` | `schema` | Schema JSON esperado |
| `context` | `string\|null` | `null` | — | Contexto adicional |
| `assistant_context` | `Dict\|null` | `null` | `assistantContext` | Contexto estructurado del asistente |
| `chat_history` | `ChatMessage[]\|null` | `null` | `chatHistory` | Historial de conversación |
| `api_key` | `string\|null` | `null` | `apiKey` | API key del cliente |
| `locale` | `string\|null` | `null` | — | Idioma |

Límites de entrada: el body completo admite hasta **256 KiB** y el campo `prompt` hasta **128 KiB**. El límite ampliado del prompt permite que `compare` incluya el código, el análisis formal y los walkthroughs sin convertir el control de tamaño en un `422` para análisis recursivos realistas.

### `ChatMessage`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `role` | `string` | `"user"` o `"model"` |
| `content` | `string` | Contenido del mensaje |

### `LLMResponse`

```json
{
  "ok": true,
  "data": {
    "text": "O(log n) significa que el tiempo crece logarítmicamente...",
    "structured": null,
    "metadata": {
      "responseId": "uuid-xxx",
      "modelVersion": "gemini-3.8-flash",
      "finishReason": "stop",
      "usage": { "promptTokenCount": 50, "candidatesTokenCount": 150 }
    }
  },
  "model": "gemini-3.8-flash",
  "requestId": "uuid-yyy",
  "error": null,
  "errorCode": null
}
```

| Campo | Tipo | Alias JSON | Descripción |
|-------|------|------------|-------------|
| `ok` | `boolean` | — | Ejecución exitosa |
| `data.text` | `string\|null` | — | Texto plano de la respuesta |
| `data.structured` | `Dict\|null` | — | JSON estructurado (repair, compare) |
| `data.metadata` | `Dict` | — | Metadatos del proveedor |
| `model` | `string\|null` | — | Modelo usado |
| `request_id` | `string\|null` | `requestId` | ID único del request |
| `error` | `string\|null` | — | Mensaje de error |
| `error_code` | `string\|null` | `errorCode` | Código de error normalizado |

Códigos de error:

| Código | Significado |
|--------|-------------|
| `LLM_API_KEY_REQUIRED` | No hay API key válida (ni cliente ni servidor) |
| `LLM_PAYLOAD_TOO_LARGE` | El body LLM supera el límite de 256 KiB |
| `LLM_BAD_REQUEST` | Request inválido (prompt vacío, etc.) |
| `LLM_MODEL_INVALID` | El ID de modelo no cumple el formato permitido |
| `LLM_PROVIDER_ERROR` | Error del proveedor upstream |
| `LLM_SERVER_KEY_RESTRICTED` | La server key existe, pero la identidad no es `@ucaldas.edu.co` |
| `LLM_TIMEOUT` | Timeout de conexión con el proveedor |

### `LLMStatusResponse`

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

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `boolean` | Consulta exitosa |
| `status.timestamp` | `string` | Timestamp ISO 8601 |
| `status.config.provider` | `string` | Proveedor configurado |
| `status.config.timeouts` | `Dict` | Timeouts |
| `status.config.jobs` | `Dict` | Modelo por job |
| `status.jobs` | `Dict` | Modelos activos (mismo que config.jobs) |
| `status.apiKey.serverAvailable` | `boolean` | Si hay API key en servidor |
| `status.apiKey.configured` | `boolean` | Si existe una clave válida en runtime |
| `status.apiKey.provider` | `string\|null` | Proveedor detectado (`gemini`, `openai_compatible`, `anthropic`, `openrouter`, `xai` o `groq`) |
| `status.apiKey.serverModel` | `string\|null` | Modelo server-side; OpenAI institucional usa `gpt-5.4-mini` |

`serverAvailable` se calcula para la identidad autenticada de la petición. No indica el
valor de la clave y permanece `false` para usuarios anónimos o cuentas fuera de
`@ucaldas.edu.co`.

## Ejemplos

### Job `repair` con schema

Request:
```json
{
  "job": "repair",
  "prompt": "Arregla: factorial(n) BEGIN RETURN n * factorial(n - 1) END",
  "locale": "es"
}
```

Response:
```json
{
  "ok": true,
  "data": {
    "structured": {
      "code": "factorial(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN 1;\n  END\n  ELSE BEGIN\n    RETURN n * factorial(n - 1);\n  END\nEND",
      "removedLines": [],
      "addedLines": [2, 3, 4, 5, 6, 7]
    }
  },
  "model": "gemini-3.8-flash",
  "requestId": "uuid-xxx"
}
```

### Status con jobs activos

```json
{
  "ok": true,
  "status": {
    "timestamp": "2026-05-18T12:00:00Z",
    "config": {
      "provider": "gemini",
      "timeouts": { "requestSeconds": 30 },
      "jobs": { "general": "gemini-3.8-flash", "repair": "gemini-3.8-flash" }
    },
    "jobs": { "general": "gemini-3.8-flash", "repair": "gemini-3.8-flash" },
    "apiKey": { "serverAvailable": true }
  }
}
```

## Límites conocidos

- `data` depende del proveedor y del job; el contrato mínimo es el envelope del backend.
- Los campos `structured` y `text` son mutuamente excluyentes en la práctica (dependiendo del job).
- `data.metadata` puede variar según el proveedor (Gemini vs OpenAI-compatible).

## Archivos relacionados

- `../llm-api.md`
- `../../02-architecture/llm-integration.md`
