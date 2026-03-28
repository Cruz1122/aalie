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
- `internal`: AST, clasificación, recurrencia, matemática intermedia
- `globalResult`: resultados por caso
- `iterative` / `recursive`: detalle por familia de algoritmo

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

- Algunas subsecciones pueden declararse `not_implemented` aun dentro de un snapshot valido.

## Archivos relacionados

- `export-engine-spec.md`
- `execution-trace-spec.md`
- `../04-api/schemas/snapshot-schema.md`
