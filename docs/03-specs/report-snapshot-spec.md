# Especificación de snapshot de análisis

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/export/snapshot_builder.py`, `apps/api/app/modules/export/models.py`, `apps/api/app/modules/export/constants.py`, `apps/api/app/modules/export/section_status.py`, `packages/types/src/export-snapshot.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 5.1 — Snapshot de análisis

## Propósito

Definir el snapshot versionado como fuente única de verdad para UI coherente, export estable y consumo cruzado entre servicios. El snapshot congela el estado completo del análisis en un instante y es la base de toda renderización posterior.

## Alcance

Aplica al schema `AalieAnalysisSnapshotV1`, al builder `build_snapshot()` en `snapshot_builder.py`, a la función `build_export_state()`, y a todos los consumidores del snapshot (UI, export engine, comparativas).

## Fuente de alcance

No cubre: análisis en vivo no cacheado, mutación directa del snapshot después de construcción, recalculo de `T_open` o `contentHash` fuera del builder.

## Contenido

### 1. Versión del schema

```
schemaVersion: "1.0.0"
```

Definida en `constants.py` como `SNAPSHOT_SCHEMA_VERSION`. Debe coincidir entre backend y tipos compartidos (`packages/types`). Cualquier cambio incompatible requiere un bump de versión.

### 2. Identificadores

- **`snapshotId`**: UUID v5 basado en namespace `SNAPSHOT_NAMESPACE` (`8ea7d65c-f598-49ea-8fdd-28289954182d`) + hash SHA-256 del payload de entrada normalizado. Estable para el mismo estado de entrada/resultado.
- **`analysisId`**: UUID v5 basado en namespace `ANALYSIS_NAMESPACE` (`3f239c5d-2970-4cec-8b6d-d11aa2d7a7aa`) + mismo hash. Vincula el snapshot a una sesión de análisis específica.
- **`contentHash`**: SHA-256 del snapshot completo normalizado (sin `createdAt`). Se recalcula dentro de `build_snapshot()` para garantizar integridad.

### 3. Estructura raíz

```json
{
  "schemaVersion": "1.0.0",
  "snapshotId": "uuid-v5",
  "contentHash": "sha-256-hex",
  "createdAt": "2026-05-14T10:30:00.000Z",
  "locale": "es",
  "algorithmType": "iterative | recursive | hybrid | dummy | unknown",
  "meta": { ... },
  "input": { ... },
  "internal": { ... },
  "globalResult": { ... },
  "iterative": { ... },
  "recursive": { ... },
  "comparative": { ... },
  "institutional": { ... }
}
```

### 4. Secciones detalladas

#### `meta`
- `analysisId`: string
- `sourceOrigin`: `"editor"` | `"api"` | `"cli"`
- `algorithm`: `{ name: string, parameters: string[] }`
- `algorithmTypeDetected`: `"iterative" | "recursive" | "hybrid" | "dummy" | "unknown"`
- `methodsApplied`: string[] — métodos usados en análisis
- `methodsAvailable`: string[] — métodos detectados como aplicables
- `hasCaseVariability`: bool — si best ≠ worst
- `validity`: `{ parseOk, analysisOk, traceOk }` — checker de integridad
- `warnings`: `[{ code, message, severity, source }]` — advertencias del pipeline
- `limitations`: string[] — mensajes de limitaciones

#### `input`
- `originalPseudocode`: string — código fuente original
- `normalizedPseudocode`: section (not_implemented actualmente)
- `procedureName`: string — nombre del procedimiento principal
- `parameters`: string[] — parámetros formales
- `parsingObservations`: `{ ok, available, runtime, error, errors }` — resultado del parse
- `analysisSummary`: `{ hasCaseVariability, availableCases }`
- `traceSummary`: section con datos de trace por caso

#### `internal`
- `ast`: section (available | missing_data) — AST completo
- `classification`: section — `{ kind, method }`
- `recurrence`: section — recurrencia normalizada
- `intermediateMath`: section — todos los artefactos matemáticos intermedios (proof, characteristic_equation, iteration, master, recursion_tree)

#### `globalResult`
- `cases`: `{ worst, best, avg }` — cada caso contiene:
  - `case`: string
  - `T_open`: string — expresión de costo abierto
  - `T_polynomial`: string — forma polinomial
  - `big_o`: string
  - `big_omega`: string
  - `big_theta`: string
  - `whileBlocks`: array — bloques WHILE detectados
  - `explanationSteps`: array — pasos pedagógicos
  - `raw`: dict — datos completos del analizador

#### `iterative` (section)
- `lineCostTable`: `{ worst, best, avg }` — costo por línea por caso
- `whileBlocks`: `{ worst, best, avg }` — bloques WHILE por caso
- `summations`: `{ worst, best, avg }` — T_open por caso
- `simplificationSteps`: `{ worst, best, avg }` — procedimiento paso a paso
- `asymptoticProcedure`: `{ worst, best, avg }` — notas asintóticas
- `caseStepByStep`: `{ worst, best, avg }` — bundles paso a paso
- `trace`: section — trace de ejecución por caso
- `loopInvariant`: section (not_implemented actualmente)

#### `recursive` (section)
- `recurrence`: section — recurrencia normalizada
- `selectedMethod`: section — método usado
- `methodsAvailable`: section — métodos aplicables
- `methodDetails`: `[{ method, detail }]` — detalle por método
- `presentation`: `{ summary, conceptNote, warning, supportReason, renderHints }`
- `rootsAndMultiplicities`: section — raíces de ecuación característica
- `stepByStep`: section — bundle paso a paso seleccionado
- `closedForm`: section — `{ homogeneousSolution, particularSolution, generalSolution, closedForm, theta, baseCases }`
- `recursionTreeSerializable`: section (not_implemented)
- `callTrace`: section — trace con call tree

#### `comparative`
- `llm`: section — comparación con LLM (available | not_requested)
- `gpuCpu`: section — comparación GPU/CPU (available | not_requested)

#### `institutional`
- `disclaimer`: string — texto de descargo institucional (localizado)
- `caseLimitations`: string[] — limitaciones por caso
- `generalLimitations`: string[] — limitaciones generales (localizadas)

### 5. section status pattern

Cada subsección usa el formato `{ "status": string, "data"?: any, "warnings"?: [], "todos"?: [] }`.

| Status | Significado |
|--------|-------------|
| `available` | Datos presentes y utilizables |
| `missing_data` | Datos esperados pero no disponibles |
| `not_supported` | Funcionalidad no soportada para este algoritmo |
| `not_implemented` | Funcionalidad no implementada (con `todos`) |
| `not_requested` | Funcionalidad no solicitada en esta exportación |

### 6. Precedencia entre secciones

1. `globalResult` es el resumen público primario del snapshot.
2. `iterative` y `recursive` contienen detalle especializado por familia y **no pueden contradecir** `globalResult`.
3. Si `algorithmType = iterative`, `iterative` debe tener `status = available` y `recursive` debe tener `status = not_supported`.
4. Si `algorithmType = recursive`, aplica la regla simétrica.
5. Si `algorithmType = hybrid`, ambas secciones pueden tener `status = available`.
6. Ante conflicto entre secciones, el snapshot es inválido: no existe precedencia permisiva entre secciones contradictorias.
7. `internal` no puede convertirse en única fuente necesaria para render público sin cambio explícito de contrato.

### 7. Invalidation

Un nuevo snapshot es necesario cuando:
- El código fuente cambia.
- La configuración de análisis cambia (locale, avg_model, preferred_method).
- Los caches de parse/classify/analyze/trace se actualizan.
- `schemaVersion` cambia por evolución del contrato.

El `snapshotId` es estable para el mismo estado de entrada; si los inputs no cambian, el snapshot es el mismo.

### 8. Missing states

- Campos opcionales no presentes: se omiten durante la serialización (`_strip_undefined_deep` elimina `null`s excepto para campos conservados explícitamente).
- Subsecciones no disponibles: se representan con `status` apropiado, no con omisión silenciosa.
- `contentHash` se calcula sobre el snapshot sin `createdAt` (para estabilidad).
- `normalizedPseudocode` y `loopInvariant` están marcados como `not_implemented`.

### 9. Invariantes

1. `schemaVersion` debe coincidir entre backend y tipos compartidos.
2. `contentHash` deriva del snapshot normalizado (sin `createdAt`).
3. `snapshotId` es estable para el mismo estado de entrada/resultado.
4. Las secciones faltantes se representan con `status`, no con recalculo fuera del snapshot.
5. `globalResult`, `iterative` y `recursive` deben ser coherentes entre sí.
6. `internal` no puede convertirse en única fuente necesaria para render público.
7. La normalización de recurrencia en snapshot puede ser un subconjunto de la recurrencia del analizador en vivo.
8. Los warnings se recolectan en `_collect_warnings()` desde parse, analyze y trace.

### 10. Errores esperables

- Secciones `not_implemented`, `missing_data` o `not_supported`.
- Inconsistencia de versión entre código y spec.
- Ausencia de parse/analyze/trace cacheados cuando el builder no logra reconstruirlos.
- `build_export_state` lanza `ValueError` si `source` está vacío.
- Parseo no disponible: `parsingObservations.available = false`.
- Análisis fallido: `validity.analysisOk = false`.

### 11. Casos soportados

1. **Snapshot iterativo completo**: `algorithmType = iterative`, `iterative.status = available`, `recursive.status = not_supported`, con `lineCostTable`, `whileBlocks`, `summations`, trace disponible.
2. **Snapshot recursivo completo**: `algorithmType = recursive`, `recursive.status = available`, `iterative.status = not_supported`, con `recurrence`, `methodDetails`, `stepByStep`, `callTrace`.
3. **Snapshot híbrido**: `algorithmType = hybrid`, ambas secciones disponibles.
4. **Snapshot con error de parse**: `validity.parseOk = false`, warnings con `PARSE_FAILED`.
5. **Snapshot con trace truncado**: warnings con `TRACE_TRUNCATED`.

### 12. Casos no soportados

1. Exportar recalculando `T_open` fuera del snapshot.
2. Mutar manualmente `schemaVersion` sin actualizar código y checks.
3. Depender de `internal` para render institucional estable.
4. Asumir que `loopInvariant` está disponible (es `not_implemented`).

### 13. Evidencia

- `build_snapshot()` en `snapshot_builder.py` construye el snapshot completo a partir de `snapshot_input`.
- `build_export_state()` coordina la recolección de datos (parse, classify, analyze, detectMethods, traceByCase).
- `_derive_metadata()` genera `analysisId`, `snapshotId` y `createdAt`.
- `_normalize_recurrence()` serializa la recurrencia en formato canónico (3 variantes).
- `_resolve_report_trace_graph()` construye el grafo de trace para el reporte.
- `_collect_warnings()` recolecta advertencias de todas las etapas.

### 14. Limitaciones

- Algunas subsecciones pueden declararse `not_implemented` aun dentro de un snapshot válido.
- `internal` puede incluir artefactos útiles para depuración, pero esos campos no deben tratarse como promesa institucional estable.
- La normalización de `recurrence` puede ser un subconjunto estricto de la recurrencia devuelta por el analizador; campos auxiliares (`method_outcomes`) no forman parte del snapshot hasta que el builder los incorpore explícitamente.
- `loopInvariant` y `normalizedPseudocode` están pendientes de implementación.
- `symbolicRecurrenceTree` completo no está implementado.

## Archivos relacionados

- `export-engine-spec.md`
- `execution-trace-spec.md`
- `../02-architecture/report-architecture.md`
- `../04-api/schemas/snapshot-schema.md`
