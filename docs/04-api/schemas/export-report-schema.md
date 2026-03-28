# Schema de export report

**Tipo:** normativa

## Propósito

Documentar el request de export y los metadatos contractuales de la respuesta.

## Alcance

Schema documental para `/export/report`.

## Fuente de verdad

- `apps/api/app/modules/export/router.py`
- `apps/api/app/modules/export/engine.py`

## Estructura

### Request

- `source: string`
- `formats?: string[]`
- `locale?: string`
- `includeTraceCases?: string[]`
- caches opcionales: `cachedParse`, `cachedClassify`, `cachedAnalyze`, `cachedTraceByCase`

### Response exitosa

- cuerpo binario o texto del artefacto
- `Content-Disposition`
- `X-Snapshot-Id`
- `X-Content-Hash`

### Response de error

- `ok: false`
- `error`
- `kind?`
- `logs?`
- `compilerLogs?`
- `assetManifest?`
- `workDir?`

## Ejemplos

- request con `formats=["markdown"]`
- request con caches previas para estabilidad de export

## Limites conocidos

- `mimeType` y `filename` son parte del contrato de implementacion, pero en HTTP se exponen por headers.

## Archivos relacionados

- `../execution-api.md`
- `snapshot-schema.md`
- `../../03-specs/export-engine-spec.md`
