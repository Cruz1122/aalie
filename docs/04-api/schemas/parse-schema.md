# Schema de parseo

**Tipo:** normativa

## Propósito

Documentar la forma del request/response de parseo.

## Alcance

Schema documental para `/grammar/parse`.

## Fuente de verdad

- `packages/types/src/index.ts`
- `apps/api/app/modules/parsing/router.py`

## Estructura

### Request

- `source?: string`
- `input?: string`

### Response

- `ok: boolean`
- `available?: boolean`
- `runtime?: "python"`
- `error?: string | null`
- `ast?: Program | null`
- `errors?: Array<{ line, column, message }>`

## Ejemplos

- request con `source`
- response `ok=false` con `errors`

## Limites conocidos

- `error` es compatibilidad resumida; la lista canónica vive en `errors[]`.

## Archivos relacionados

- `../parse-api.md`
- `../../03-specs/ast-schema.md`
