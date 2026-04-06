# Schema LLM

**Tipo:** normativa

## Propósito

Documentar la forma base de los payloads LLM expuestos por el BFF.

## Alcance

Schema documental para `/api/llm` y `/api/llm/status`.

## Fuente de verdad

- `apps/web/src/app/api/llm/route.ts`
- `apps/web/src/app/api/llm/llm-config.ts`

## Estructura

### Request base

- `job`
- `prompt`
- `schema?`
- `context?`
- `chatHistory?`
- `apiKey?`
- `locale?`

### Response base

- `ok`
- `data?`
- `model?`
- `error?`

### Status response

- `ok`
- `status.timestamp`
- `status.config`
- `status.jobs`
- `status.apiKey.serverAvailable`

## Ejemplos

- `job=repair` con schema JSON
- `status` con jobs activos

## Limites conocidos

- `data` depende del proveedor y del job; el contrato mínimo es el envelope del BFF.

## Archivos relacionados

- `../llm-api.md`
- `../../02-architecture/llm-integration.md`
