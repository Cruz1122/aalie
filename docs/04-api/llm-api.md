# API LLM

**Tipo:** normativa

## Propósito

Documentar los endpoints BFF del subsistema LLM y la forma de sus payloads visibles para frontend.

## Alcance

Cubre `/api/llm`, `/api/llm/status` y `/api/llm/classify`.

## Fuente de verdad

- `apps/web/src/app/api/llm/route.ts`
- `apps/web/src/app/api/llm/status/route.ts`
- `apps/web/src/app/api/llm/llm-config.ts`

## Estructura

### `POST /api/llm`

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
  "model": "gemini-..."
}
```

### `GET /api/llm/status`

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

- este contrato depende del proveedor Gemini y puede requerir normalizacion adicional en consumidores;
- errores de cuota, timeout o proveedor se devuelven como errores del BFF.

## Archivos relacionados

- `schemas/llm-schema.md`
- `classification-api.md`
- `../02-architecture/llm-integration.md`
