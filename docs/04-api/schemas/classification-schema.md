# Schema de clasificación

**Tipo:** normativa

## Propósito

Definir la forma mínima del payload de clasificación.

## Alcance

Schema documental para `/classify` y su BFF.

## Fuente de verdad

- `apps/api/app/modules/classification/service.py`
- `apps/web/src/app/api/llm/classify/route.ts`

## Estructura

### Request backend

- `source?: string`
- `ast?: object`

### Response backend

- `ok: boolean`
- `kind?: "iterative" | "recursive" | "hybrid" | "unknown"`
- `method?: "ast"`
- `errors?: []`

### Response BFF

- `kind`
- `method`
- `timestamp`

## Ejemplos

- request con AST ya parseado

## Limites conocidos

- el BFF agrega `timestamp`; el backend no.

## Archivos relacionados

- `../classification-api.md`
- `../../03-specs/analysis-engine-spec.md`
