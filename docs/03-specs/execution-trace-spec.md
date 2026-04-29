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
- `derived.structuredTrace` es contractual para consumidores de diagramas; no es un adorno opcional del payload.

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

## Contrato de `derived.structuredTrace`

- `patternKind` clasifica la forma estructural reconocida para la visualización; si no hay clasificación defendible, debe ser `unknown`.
- `graph` es la representación serializable consumida por diagramas; debe poder estar vacío sin invalidar el trace base.
- `classification` resume la lectura estructural derivada y debe ser coherente con `patternKind`.
- si `structuredTrace` no puede derivarse, el trace base sigue siendo válido; los consumidores deben degradar visualmente sin reinterpretar `steps`.

## Modos de consumo de la traza recursiva

- **Vista automática**: consume `trace`, `callTreeSource` y `derived.structuredTrace` para construir el diagrama, el resumen y la explicación.
- **Seguimiento manual guiado**: consume exactamente los mismos artefactos, pero añade navegación por pasos o niveles para explicar expansión, llamadas y retornos de forma pedagógica.
- ambos modos comparten la misma fuente de verdad; la UI no puede inventar nodos, llamadas o retornos que no estén respaldados por la traza contractual.
- la navegación manual debe apoyarse en el orden real de ejecución y en la estructura derivada, no en heurísticas que contradigan el `trace` base.
- cuando la traza sea parcial, profunda o inconcluyente, el modo guiado debe degradar limpiamente mostrando solo lo derivable y marcando la ambigüedad.

## Invariantes

- los pasos se entregan en orden de ejecución;
- `summary.totalSteps` refleja longitud real de `steps`;
- `callTreeSource` y `structuredTrace` son consumidores auxiliares del mismo trace base;
- UI, export y tests consumen esta estructura sin reinterpretación ad hoc.
- `structuredTrace` nunca puede contradecir el `trace` base; si hay duda, degrada a `unknown`.

## Errores esperables

- parse inválido;
- AST ausente;
- error durante ejecución instrumentada;
- truncamiento por profundidad o seguridad.

## Ejemplos

### Ejemplos validos

- algoritmo iterativo: `trace.kind = iterative`, sin call tree obligatorio.
- algoritmo recursivo: `trace.kind = recursive`, con `callTreeSource` y `structuredTrace`.
- algoritmo recursivo con navegación guiada: mantiene el mismo contrato, pero la UI puede avanzar por expansión, descenso y retorno sin alterar el payload.

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
