# Schema de trace de ejecución

**Tipo:** normativa

## Propósito

Documentar el schema del payload de trace.

## Alcance

Schema documental para `/analyze/trace`.

## Fuente de verdad

- `apps/api/app/modules/execution/schemas.py`
- `apps/web/src/types/trace.ts`

## Estructura

### Request

- `source`
- `case`
- `input_size`
- `initial_variables`
- `locale`

### Response

- `ok`
- `trace`
- `algorithmKind`
- `derived`
- `metadata`

### `trace.steps[*]`

- `id`
- `stepNumber`
- `line`
- `eventKind`
- `description`
- `variablesSnapshot`
- `iteration?`
- `recursion?`
- `decision?`
- `cost?`
- `sourceSpan?`

## Ejemplos

- step `assign`
- step `call_enter`

## Limites conocidos

- algunos nombres legados del frontend (`step_number`, `kind`) conviven con la forma canónica del backend.

## Archivos relacionados

- `../execution-api.md`
- `../../03-specs/execution-trace-spec.md`
