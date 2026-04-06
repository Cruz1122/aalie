# Schema de snapshot

**Tipo:** normativa

## Propósito

Referenciar la forma del snapshot público versionado.

## Alcance

Schema documental para `AalieAnalysisSnapshotV1`.

## Fuente de verdad

- `packages/types/src/export-snapshot.ts`
- `apps/api/app/modules/export/constants.py`

## Estructura

### Campos raices

- `schemaVersion: "1.0.0"`
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

## Ejemplos

- snapshot version `1.0.0`

## Limites conocidos

- el detalle profundo vive en la spec de snapshot; este archivo resume el shape.

## Archivos relacionados

- `../../03-specs/report-snapshot-spec.md`
- `export-report-schema.md`
