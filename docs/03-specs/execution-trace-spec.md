# Especificación de trace de ejecución

**Tipo:** normativa

## Propósito

Definir la estructura JSON del trace y su relación contractual con UI, export y tests.

## Alcance

Aplica a `/analyze/trace`, `trace_service`, `execution/schemas` y consumidores frontend/export.

## Fuente de verdad

- `apps/api/app/modules/execution/schemas.py`
- `apps/api/app/modules/analysis/trace_service.py`
- `apps/web/src/types/trace.ts`

## Estructura

### Envelope

- `ok`
- `trace`
- `algorithmKind`
- `derived`
- `metadata`

### Cuerpo `trace`

- `kind`
- `steps`
- `summary`
- `diagnostics`
- `callTreeSource`

### Step kinds (`eventKind`)

- `enter_block`
- `assign`
- `condition_eval`
- `loop_enter`
- `loop_iter_enter`
- `loop_iter_exit`
- `loop_exit`
- `call_enter`
- `call_spawn_child`
- `call_resume`
- `return_emit`
- `call_exit`
- `operation_enter`
- `operation_exit`
- `state_mutation`
- `result_emit`
- `print`
- `end`

### Artefactos derivados

- `derived.structuredTrace.patternKind`
- `derived.structuredTrace.graph`
- `derived.structuredTrace.classification`

## Inputs

- `source`
- `case`
- `input_size`
- `initial_variables`
- `locale`

## Outputs

- trace canónico serializable;
- call tree si aplica;
- summary, diagnostics y structuredTrace.

## Invariantes

- los pasos se entregan en orden de ejecución;
- `summary.totalSteps` refleja longitud real de `steps`;
- `callTreeSource` y `structuredTrace` son consumidores auxiliares del mismo trace base;
- UI, export y tests consumen esta estructura sin reinterpretación ad hoc.

## Errores esperables

- parse inválido;
- AST ausente;
- error durante ejecución instrumentada;
- truncamiento por profundidad o seguridad.

## Ejemplos

### Ejemplos validos

- algoritmo iterativo: `trace.kind = iterative`, sin call tree obligatorio.
- algoritmo recursivo: `trace.kind = recursive`, con `callTreeSource` y `structuredTrace`.

### Ejemplos no soportados

- asumir que el trace demuestra por sí solo la complejidad asintótica;
- consumir `structuredTrace` sin tolerar `patternKind = unknown`.

## Limites conocidos

- los inputs automáticos para trace son heurísticas pedagógicas, no pruebas universales.
- puede haber truncamiento seguro en trazas profundas.

## Archivos relacionados

- `../02-architecture/execution-trace-architecture.md`
- `report-snapshot-spec.md`
- `../04-api/execution-api.md`
