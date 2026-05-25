# Especificación de trace de ejecución

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/execution/schemas.py`, `apps/api/app/modules/execution/trace_builder.py`, `apps/api/app/modules/execution/executor.py`, `apps/api/app/modules/execution/environment.py`, `apps/api/app/modules/execution/derivations/structured_trace_builder.py`, `apps/api/app/modules/analysis/trace_service.py`, `apps/web/src/types/trace.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 4.4 — Traza de ejecución

## Propósito

Definir la estructura JSON del trace de ejecución, los campos de request y response, los tipos de eventos, los artefactos derivados, el árbol de llamadas recursivas, el resumen, los diagnósticos, y las reglas de truncamiento. El trace es un artefacto **pedagógico**, no una prueba asintótica.

## Alcance

Aplica a `/analyze/trace`, `trace_service`, `execution/schemas`, `execution/trace_builder`, `execution/derivations/`, y todos los consumidores (UI, export, tests). Aplica también a la generación heurística de inputs por defecto.

## Fuera de alcance

No cubre: demostración de complejidad asintótica (el trace es ilustrativo), análisis semántico profundo, verificación formal.

## Contenido

### 1. Request fields

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `source` | string | sí | Pseudocódigo fuente |
| `case` | string | sí | `worst` | `best` | `avg` | `current` |
| `input_size` | int | no | Tamaño de entrada; si se omite, se usa heurística (ver sección 10) |
| `initial_variables` | dict | no | Variables iniciales; si se omite, se generan automáticamente |
| `locale` | string | no | `en` | `es` |

### 2. Response envelope

```json
{
  "ok": true,
  "trace": { ... },
  "algorithmKind": "iterative",
  "derived": { ... },
  "metadata": {
    "pseudocode": "...",
    "inputSize": 5,
    "case": "worst",
    "message": "Trace generado correctamente"
  }
}
```

### 3. Cuerpo `trace` (response)

- `kind`: `iterative` | `recursive` | `hybrid`
- `steps`: `List[ExecutionStep]` — en orden de ejecución
- `summary`: `TraceSummary`
- `diagnostics`: `Dict` con `truncated`, `truncationReason`, `warnings`
- `callTreeSource`: `CallTree` (solo para recursivos)
- `recursionTree`: `RecursionTree` (alias, compatibilidad)

### 4. Event kinds (`eventKind`)

| Kind | Descripción | Costo (tokens) |
|------|-------------|----------------|
| `enter_block` | Entrada a bloque de código | 0 |
| `assign` | Asignación de variable | 1 |
| `condition_eval` | Evaluación de condición | 2 |
| `loop_enter` | Entrada al ciclo | 1 |
| `loop_iter_enter` | Inicio de iteración | 1 |
| `loop_iter_exit` | Fin de iteración | 1 |
| `loop_exit` | Salida del ciclo | 1 |
| `call_enter` | Entrada a llamada de procedimiento | 2 |
| `call_spawn_child` | Llamada a subprocedimiento desde llamada actual | 2 |
| `call_resume` | Reanudación después de llamada hija | 1 |
| `return_emit` | Emisión de valor de retorno | 1 |
| `call_exit` | Salida de llamada | 1 |
| `operation_enter` | Inicio de operación compuesta | 2 |
| `operation_exit` | Fin de operación compuesta | 1 |
| `state_mutation` | Mutación de estado interno | 1 |
| `result_emit` | Emisión de resultado final | 1 |
| `print` | Impresión | 2 |
| `end` | Fin de ejecución | 0 |

### 5. Estructura de `ExecutionStep`

```json
{
  "id": "step_1",
  "stepNumber": 1,
  "line": 5,
  "eventKind": "assign",
  "description": "i <- 0",
  "variablesSnapshot": { "i": 0, "n": 5 },
  "variables_changed": { "i": 0 },
  "iteration": {
    "loopId": "while_L3",
    "index": null
  },
  "recursion": {
    "callId": "call_1",
    "depth": 0,
    "parentCallId": null
  },
  "decision": {
    "conditionText": "i < n",
    "result": true
  },
  "cost": {
    "primitiveOps": 1,
    "microseconds": 3.0,
    "tokens": 1
  },
  "sourceSpan": {
    "startLine": 5,
    "endLine": 5
  }
}
```

### 6. `summary`

```json
{
  "totalSteps": 42,
  "totalCalls": 15,
  "maxRecursionDepth": 5,
  "algorithmKind": "recursive"
}
```

### 7. `diagnostics`

```json
{
  "truncated": true,
  "truncationReason": "max_depth",
  "warnings": [
    "Trace truncated at recursion depth 10 (safety limit)"
  ]
}
```

### 8. `callTreeSource` (CallTreeCanonical)

```json
{
  "rootCallIds": ["call_1"],
  "calls": [
    {
      "id": "call_1",
      "functionName": "mergeSort",
      "depth": 0,
      "parentCallId": null,
      "childCallIds": ["call_2", "call_3"],
      "argumentsSnapshot": { "arr": [3,1,2], "low": 0, "high": 2 },
      "localStateOnEnter": { "arr": [3,1,2] },
      "localStateOnExit": { "arr": [1,2,3] },
      "entryLine": 1,
      "baseCase": { "detected": true, "conditionText": "low >= high", "matched": false },
      "returnValue": null,
      "localCost": { "primitiveOps": 5 },
      "aggregateCost": { "primitiveOps": 25 }
    }
  ]
}
```

### 9. `structuredTrace` (artefacto derivado)

Construido por `structured_trace_builder.py` pipeline:

1. `classify_structural_trace(trace)` → classification (patternKind, confidence, evidence)
2. `build_structured_trace(trace, classification)` → view estructurada
3. `structured_view_to_graph(view)` → grafo serializable

Retorna:
```json
{
  "patternKind": "binary_tree_recursion",
  "graph": { "nodes": [...], "edges": [...] },
  "classification": {
    "patternKind": "binary_tree_recursion",
    "confidence": 0.85,
    "evidence": ["two_recursive_calls", "balanced_splits"]
  }
}
```

Si la derivación falla, `patternKind` es `"unknown"`, `graph` vacío, `confidence: 0.0`.

**Contractual**: `structuredTrace` es obligatorio para consumidores de diagramas. Puede tener `patternKind = "unknown"` sin invalidar el trace base. Nunca puede contradecir el trace base.

### 10. Input heuristics (generación de inputs por defecto)

`build_default_trace_inputs()` en `trace_service.py`:

- `default_n = 5` (tamaño de entrada pedagógico, no asintótico).
- Si el código menciona `x`, se asigna `x` según el caso:
  - `best`: primer elemento del arreglo
  - `avg`: elemento medio
  - `worst`: último elemento
- Si el código menciona `A[`, se genera arreglo `[1..n]` (ascendente para best, descendente para worst).
- Si el código contiene palabras clave de ordenamiento, `best` usa arreglo ordenado ascendente.
- Si el código tiene `n >= 0` check, `worst` usa `n=0` (caso base).
- El trace es pedagógico, no una prueba de complejidad.

### 11. Truncation

- `max depth`: el ejecutor puede truncar la recursión a una profundidad segura (configurable).
- `max steps`: límite de pasos totales para evitar timeouts.
- Cuando se trunca, `diagnostics.truncated = true` y `diagnostics.truncationReason` explica la causa.
- Los consumidores deben tolerar trazas truncadas sin asumir completitud.

### 12. Invariantes

1. Los pasos se entregan en orden de ejecución.
2. `summary.totalSteps` refleja la longitud real de `steps`, incluso si hay truncamiento.
3. `callTreeSource` y `structuredTrace` son consumidores auxiliares del mismo trace base; no pueden contradecirlo.
4. UI, export y tests consumen esta estructura sin reinterpretación ad hoc.
5. `structuredTrace` nunca puede contradecir el trace base; si hay duda, degrada a `unknown`.
6. Los costos (`primitiveOps`, `microseconds`, `tokens`) son heurísticas deterministas, no mediciones reales.
7. `_estimate_step_cost` asigna tokens por tipo de evento (asignación=1, condición=2, llamada=2).
8. `MICROSECONDS_PER_TOKEN = 3.0` es una constante heurística global.

### 13. Errores esperables

- Parse inválido → `ok: false`, `errors: ["Parse error"]`.
- AST ausente → `ok: false`, `errors: ["No se pudo obtener el AST del código"]`.
- Error durante ejecución instrumentada → `ok: false`, `errors: ["Error generando rastro: {msg}"]`.
- Truncamiento por profundidad o seguridad → trace parcial con `diagnostics.truncated = true`.

### 14. Casos soportados

1. **Iterativo simple**: `trace.kind = "iterative"`, sin `callTreeSource`, con `structuredTrace.patternKind = "linear_counter"`.
2. **Recursivo divide-and-conquer**: `trace.kind = "recursive"`, con `callTreeSource` poblado, `structuredTrace.patternKind = "binary_tree_recursion"`.
3. **Recursivo linear_shift**: `trace.kind = "recursive"`, con `callTreeSource` de una sola rama, `structuredTrace.patternKind = "linear_recursion"`.
4. **Híbrido**: `trace.kind = "hybrid"`, ambos artefactos presentes.
5. **Con truncamiento**: trace válido pero incompleto, `diagnostics.truncated = true`.

### 15. Casos no soportados

1. Asumir que el trace demuestra por sí solo la complejidad asintótica.
2. Consumir `structuredTrace` sin tolerar `patternKind = "unknown"`.
3. Depender de `microseconds` o `tokens` como mediciones precisas (son heurísticas).
4. Reconstruir el call tree a partir de `steps` cuando `callTreeSource` no está presente.

### 16. Evidencia

- `schemas.py` define `ExecutionEventKind` (18 literales), `ExecutionStepCanonical`, `CallTreeCanonical`, `TraceSummary`.
- `trace_builder.py` implementa `TraceBuilder` con `add_step()`, `enter_recursion()`, `record_return_value()`, `record_base_case()`, `build()`.
- `trace_service.py` implementa `build_trace_result()` y `build_default_trace_inputs()`.
- `structured_trace_builder.py` implementa el pipeline clasificación → vista → grafo.

### 17. Limitaciones

- Los inputs automáticos para trace son heurísticas pedagógicas (n=5), no reflejan comportamiento asintótico.
- Puede haber truncamiento seguro en trazas profundas.
- El costo en microsegundos y tokens es una estimación basada en tipo de evento, no en medición real.
- `baseCase.detected` es una heurística conservadora; puede no detectar casos base no estructurales.

## Archivos relacionados

- `../02-architecture/execution-trace-architecture.md`
- `report-snapshot-spec.md`
- `export-engine-spec.md`
- `../04-api/execution-api.md`
