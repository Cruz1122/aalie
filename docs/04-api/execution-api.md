# API de ejecución, trace y export

**Tipo:** normativa

## Propósito

Documentar los contratos runtime que materializan ejecución concreta y export de resultados.

## Alcance

Cubre `/analyze/trace`, `/export/report` y sus consumidores.

## Fuente de verdad

- `apps/api/app/modules/analysis/router.py`
- `apps/api/app/modules/export/router.py`
- `apps/web/src/app/api/analyze/trace/route.ts`

## Estructura

### `POST /analyze/trace`

- path: `/analyze/trace`
- method: `POST`
- consumidor principal: `TraceDedicatedView`

#### Request

```json
{
  "source": "...",
  "case": "worst|best|avg",
  "input_size": 5,
  "initial_variables": {},
  "locale": "es|en"
}
```

#### Response

- `ok`
- `trace`
- `algorithmKind`
- `derived`
- `metadata`

### `POST /export/report`

- path: `/export/report`
- method: `POST`
- consumidor principal: export del analizador

#### Request mínimo

```json
{
  "source": "...",
  "formats": ["markdown", "pdf"],
  "locale": "es",
  "includeTraceCases": ["worst"]
}
```

#### Response

- artefacto binario o texto con `Content-Disposition`
- `X-Snapshot-Id`
- `X-Content-Hash`

## Ejemplos

- trace worst-case con inputs autogenerados para un algoritmo iterativo;
- export ZIP con `report.md`, `report.pdf`, `snapshot.json` y `manifest.json`.

## Limites conocidos

- trace usa inputs concretos;
- export PDF depende de `pdflatex`;
- `export/report` falla con `400` si falta `source`.

## Archivos relacionados

- `schemas/execution-schema.md`
- `schemas/export-report-schema.md`
- `../03-specs/execution-trace-spec.md`
- `../03-specs/export-engine-spec.md`
