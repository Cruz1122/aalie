# API LLM

**Tipo:** normativa

## Propósito

Documentar los endpoints BFF del subsistema LLM y la forma de sus payloads visibles para frontend.

## Alcance

Cubre `/api/llm`, `/api/llm/status`, `/api/llm/classify`, `/llm` y `/llm/status`.

## Fuente de verdad

- `apps/web/src/app/api/llm/route.ts`
- `apps/web/src/app/api/llm/status/route.ts`
- `apps/api/app/modules/llm/router.py`
- `apps/api/app/modules/llm/service.py`
- `apps/api/app/modules/llm/config.py`

## Estructura

### `POST /api/llm`

- endpoint proxy del frontend hacia backend `/llm`;
- el navegador nunca llama proveedor externo directamente.

### `POST /llm`

- jobs: `parser_assist`, `general`, `repair`, `compare`, `explain`
- request base:

```json
{
  "job": "general",
  "prompt": "...",
  "schema": {},
  "context": "...",
  "chatHistory": [],
  "apiKey": "...",
  "locale": "es"
}
```

- response base:

```json
{
  "ok": true,
  "data": {},
  "model": "gemini-...",
  "requestId": "uuid"
}
```

### `GET /api/llm/status`

- proxy del frontend hacia backend `/llm/status`.

### `GET /llm/status`

- expone `config`, `jobs` y disponibilidad de API key del servidor;
- no expone la API key real.

### `POST /api/llm/classify`

- BFF de clasificación para UI;
- `mode="llm"` rechazado;
- usa backend Python como fuente de verdad.

## Ejemplos

- `repair` devuelve JSON estructurado con `code`, `removedLines`, `addedLines`.
- `compare` usa schema estricto y baja temperatura para contraste.

## Limites conocidos

- el backend esta preparado para multi-provider, pero actualmente solo implementa Gemini;
- errores de cuota, timeout o proveedor se normalizan en backend con `errorCode`.

## Archivos relacionados

- `schemas/llm-schema.md`
- `classification-api.md`
- `../02-architecture/llm-integration.md`
