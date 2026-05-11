# Especificación de snapshot de análisis

**Tipo:** normativa

## Propósito

Definir el snapshot versionado como fuente única de verdad para UI coherente, export y consumo cruzado.

## Alcance

Aplica al schema `AalieAnalysisSnapshotV1` y a toda la salida de export.

## Fuente de verdad

- `packages/types/src/export-snapshot.ts`
- `apps/api/app/modules/export/constants.py`
- `apps/api/app/modules/export/snapshot_builder.py`

## Estructura

### Campos raiz obligatorios

- `schemaVersion` actual: `1.0.0`
- `schemaVersion`
- `snapshotId`
- `contentHash`
- `createdAt`
- `locale`
- `meta`
- `input`
- `internal`
- `globalResult`
- `comparative`
- `institutional`
- `algorithmType`
- `iterative`
- `recursive`

### Secciones clave

- `meta`: identificación, validez, warnings, limitaciones
- `input`: pseudocodigo original, parse observations, resumen de casos y trace
- `internal`: AST y artefactos intermedios no destinados a consumo institucional directo
- `globalResult`: resultados por caso
- `iterative` / `recursive`: detalle por familia de algoritmo

### Precedencia entre secciones

- `globalResult` es el resumen público primario del snapshot.
- `iterative` y `recursive` contienen detalle especializado por familia y no pueden contradecir `globalResult`.
- si `algorithmType = iterative`, `iterative` puede estar `available` y `recursive` debe estar `not_supported`, `not_applicable` o equivalente contractual.
- si `algorithmType = recursive`, aplica la regla simétrica.
- ante conflicto, el snapshot es inválido: no existe precedencia permisiva entre secciones contradictorias.

### Obligatoriedad por tipo de algoritmo

- para `algorithmType = iterative`, el snapshot debe incluir `globalResult`, `iterative.status`, resultado principal por caso y representación de costo por líneas o equivalente contractual consumido por UI/export.
- para `algorithmType = iterative`, `recursive` no debe transportar detalle metodológico activo; solo estado de no aplicabilidad.
- para `algorithmType = recursive`, el snapshot debe incluir `globalResult`, `recursive.status`, `recurrence_info` o equivalente contractual de recurrencia detectada, `default_method` cuando exista y detalle de método o estado inconcluso explícito.
- para `algorithmType = recursive`, `iterative` no debe reclamar disponibilidad analítica principal salvo como artefacto auxiliar explícitamente marcado.
- trace, warnings, metadatos y `snapshotId` son obligatorios para ambos tipos cuando el flujo que generó el snapshot los haya solicitado o materializado.

### Propiedad y compatibilidad

- el snapshot público es propiedad contractual del backend export y de `packages/types`.
- los consumidores pueden leer `internal`, pero no deben depender de él para render institucional estable.
- cambios backward compatible: agregar campos opcionales o subsecciones con `status`.
- cambios incompatibles: alterar semántica de campos públicos, remover campos requeridos o cambiar reglas de precedencia.

## Inputs

- `source`
- `locale`
- parse/cache de parse
- classify/cache de classify
- analyze/cache de analyze
- traceByCase
- opciones auxiliares de export

## Outputs

- snapshot JSON normalizado, versionado y hasheado.

## Invariantes

- `schemaVersion` debe coincidir entre backend y tipos compartidos;
- `contentHash` deriva del snapshot normalizado;
- `snapshotId` es estable para el mismo estado de entrada/resultado;
- las secciones faltantes se representan con `status`, no con recalculo fuera del snapshot.
- `globalResult`, `iterative` y `recursive` deben ser coherentes entre sí;
- `internal` no puede convertirse en única fuente necesaria para render público sin cambio explícito de contrato.

## Errores esperables

- secciones `not_implemented`, `missing_data` o `not_supported`;
- inconsistencia de versión entre código y spec;
- ausencia de parse/analyze/trace cacheados cuando el builder no logra reconstruirlos.

## Ejemplos

### Ejemplos validos

- snapshot iterativo con `iterative.status = available` y `recursive.status = not_supported`.
- snapshot recursivo con `recursive.methodDetails` y `callTrace` disponibles.

### Ejemplos no soportados

- exportar recalculando `T_open` fuera del snapshot;
- mutar manualmente `schemaVersion` sin actualizar código y checks.

## Limites conocidos

- Algunas subsecciones pueden declararse `not_implemented` aun dentro de un snapshot válido.
- `internal` puede incluir artefactos útiles para depuración, pero esos campos no deben tratarse como promesa institucional estable salvo que se promuevan explícitamente.
- La normalización de `recurrence` en export (`apps/api/app/modules/export/snapshot_builder.py`, `_normalize_recurrence`) puede ser un subconjunto estricto de la recurrencia devuelta por el analizador en vivo; campos auxiliares (por ejemplo `method_outcomes` en `recurrence_info`) no forman parte del snapshot exportado hasta que el builder los incorpore de forma explícita y versionada.

## Archivos relacionados

- `export-engine-spec.md`
- `execution-trace-spec.md`
- `../04-api/schemas/snapshot-schema.md`
