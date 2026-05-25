# Schema de export report

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/export/router.py`, `apps/api/app/modules/export/engine.py`, `apps/api/app/modules/export/service.py`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.2.4

## Propósito

Documentar el request de export y los metadatos contractuales de la respuesta.

## Alcance

Schema documental para `POST /export/report`.

## Fuente de verdad

- `apps/api/app/modules/export/router.py`
- `apps/api/app/modules/export/engine.py`
- `apps/api/app/modules/export/service.py`

## Schemas

### Request

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `source` | `string` | — | Código fuente (obligatorio) |
| `formats` | `string[]` | `[]` | Formatos solicitados: `"markdown"`, `"latex"`, `"pdf"`, `"zip"` |
| `locale` | `string` | — | Idioma del reporte (`"es"` o `"en"`) |
| `includeTraceCases` | `string[]` | `[]` | Casos de trace a incluir: `"worst"`, `"best"`, `"avg"` |
| `cachedParse` | `Dict\|null` | `null` | AST pre-calculado (evita re-parseo) |
| `cachedClassify` | `Dict\|null` | `null` | Clasificación pre-calculada |
| `cachedAnalyze` | `Dict\|null` | `null` | Análisis pre-calculado |
| `cachedTraceByCase` | `Dict\|null` | `null` | Trazas pre-calculadas por caso |
| `requestOrigin` | `string\|null` | `null` | Origin HTTP (para callbacks LLM) |

```json
{
  "source": "factorial(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN 1;\n  END\n  ELSE BEGIN\n    RETURN n * factorial(n - 1);\n  END\nEND",
  "formats": ["markdown", "pdf"],
  "locale": "es",
  "includeTraceCases": ["worst", "best"],
  "cachedParse": { ... },
  "cachedClassify": { "ok": true, "kind": "recursive" },
  "cachedAnalyze": { "ok": true, "byLine": [...] }
}
```

### Response exitosa

La respuesta exitosa es binaria o textual, no JSON. Los metadatos se transportan en headers HTTP.

| Header | Tipo | Descripción |
|--------|------|-------------|
| `Content-Type` | `string` | MIME type del artefacto (`text/markdown`, `application/pdf`, `application/zip`, etc.) |
| `Content-Disposition` | `string` | `attachment; filename="report.ext"` |
| `X-Snapshot-Id` | `string\|null` | ID del snapshot usado para la exportación |
| `X-Content-Hash` | `string\|null` | Hash SHA-256 del contenido |

### Response de error

```json
{
  "ok": false,
  "error": "Field 'source' is required.",
  "kind": "validation",
  "logs": "LaTeX error: ...",
  "compilerLogs": "! Undefined control sequence...",
  "assetManifest": ["report.md", "report.pdf"],
  "workDir": "/tmp/export-abc123"
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `false` | Indicador de error |
| `error` | `string` | Mensaje de error |
| `kind` | `string\|null` | Tipo de error: `"validation"`, `"compilation"`, `"internal"` |
| `logs` | `string\|null` | Logs del proceso de export (truncados a 4000 chars) |
| `compilerLogs` | `string\|null` | Logs del compilador LaTeX |
| `assetManifest` | `string[]\|null` | Lista de archivos generados |
| `workDir` | `string\|null` | Directorio temporal de trabajo |

## Ejemplos

### Request con caches previas

```json
{
  "source": "bubble_sort(A, n) BEGIN\n  FOR i <- 0 TO n - 2 DO BEGIN\n    FOR j <- 0 TO n - i - 2 DO BEGIN\n      IF (A[j] > A[j + 1]) THEN BEGIN\n        temp <- A[j];\n        A[j] <- A[j + 1];\n        A[j + 1] <- temp;\n      END\n    END\n  END\nEND",
  "formats": ["markdown"],
  "locale": "en",
  "includeTraceCases": ["worst"],
  "cachedAnalyze": {
    "ok": true,
    "byLine": [...],
    "totals": { "T_open": "3n² + 5n + 2", "T_polynomial": "O(n²)" }
  }
}
```

### Response ZIP con múltiples artefactos

Headers:
```
Content-Type: application/zip
Content-Disposition: attachment; filename="analysis-export-abc123.zip"
X-Snapshot-Id: snap-abc123
X-Content-Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

Contenido del ZIP:
- `report.md` — Reporte en Markdown
- `report.pdf` — Reporte en PDF
- `snapshot.json` — Snapshot versionado
- `manifest.json` — Manifiesto del export

## Límites conocidos

- `mimeType` y `filename` son parte del contrato de implementación, pero en HTTP se exponen por headers.
- `logs` y `compilerLogs` se truncan a 4000 caracteres para evitar respuestas excesivas.
- El export PDF depende de `pdflatex` disponible en el runtime.
- Si no se proporcionan caches, el backend regenera el análisis completo.

## Archivos relacionados

- `../execution-api.md`
- `snapshot-schema.md`
- `../../03-specs/export-engine-spec.md`
- `../../03-specs/report-snapshot-spec.md`
