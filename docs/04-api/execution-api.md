# API de ejecución, trace y export

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/analysis/router.py`, `apps/api/app/modules/export/router.py`, `apps/web/src/app/api/analyze/trace/route.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.1.4, 4.1.5

## Propósito

Documentar los contratos runtime que materializan ejecución concreta (trace) y export de resultados.

## Alcance

Cubre `POST /analyze/trace`, `POST /export/report` y sus consumidores. No cubre snapshot (ver `schemas/snapshot-schema.md`).

## Fuente de verdad

- `apps/api/app/modules/analysis/router.py:74` — trace
- `apps/api/app/modules/analysis/trace_service.py` — lógica de trace
- `apps/api/app/modules/analysis/schemas.py:159` — `TraceRequest`
- `apps/api/app/modules/export/router.py:22` — export
- `apps/web/src/app/api/analyze/trace/route.ts` — BFF trace
- `apps/web/src/app/api/analyze/open/route.ts` — BFF analyze (export usa analyze internamente)

## Estructura

### `POST /analyze/trace`

- Path: `/analyze/trace`
- Method: `POST`
- Consumidor principal: `TraceDedicatedView` (UI), BFF `api/analyze/trace`

#### Request `TraceRequest`

```json
{
  "source": "factorial(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN 1;\n  END\n  ELSE BEGIN\n    RETURN n * factorial(n - 1);\n  END\nEND",
  "case": "worst",
  "input_size": 4,
  "initial_variables": {},
  "locale": "en"
}
```

Campos:

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `source` | `string` | — | Código fuente a trazar |
| `case` | `"worst"\|"best"\|"avg"` | `"worst"` | Caso de análisis |
| `input_size` | `int\|null` | `null` | Tamaño de entrada concreto (ej: n=4) |
| `initial_variables` | `Dict\|null` | `null` | Variables iniciales (ej: arrays para ordenamiento) |
| `locale` | `"es"\|"en"\|null` | `null` | Idioma para descripciones de pasos |

#### Response

```json
{
  "ok": true,
  "trace": {
    "algorithmKind": "recursive",
    "steps": [
      {
        "id": "step_1",
        "stepNumber": 1,
        "line": 1,
        "eventKind": "call_enter",
        "description": "Llamada a factorial(n=4)",
        "variablesSnapshot": { "n": 4 },
        "cost": "1"
      }
    ],
    "derived": {}
  }
}
```

Campos del step:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | `string` | Identificador único del paso |
| `stepNumber` | `int` | Número de paso (1-indexed) |
| `line` | `int` | Línea del pseudocódigo |
| `eventKind` | `string` | Tipo: `"assign"`, `"if"`, `"call_enter"`, `"call_exit"`, `"return"`, `"loop"`, `"condition"`, etc. |
| `description` | `string` | Descripción legible del paso |
| `variablesSnapshot` | `Dict` | Estado de variables en este punto |
| `iteration` | `int\|null` | Número de iteración si está dentro de un bucle |
| `recursion` | `Dict\|null` | Profundidad/pila de recursión |
| `decision` | `Dict\|null` | Resultado de condición (true/false) |
| `cost` | `string\|null` | Costo del paso en notación |
| `sourceSpan` | `{start,end}\|null` | Ubicación exacta en el código fuente |

### `POST /export/report`

- Path: `/export/report`
- Method: `POST`
- Consumidor principal: UI (export del analizador)

#### Request mínimo

```json
{
  "source": "factorial(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN 1;\n  END\n  ELSE BEGIN\n    RETURN n * factorial(n - 1);\n  END\nEND",
  "formats": ["markdown"],
  "locale": "es",
  "includeTraceCases": ["worst"]
}
```

Campos adicionales opcionales:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `cachedParse` | `object\|null` | AST pre-calculado para evitar re-parseo |
| `cachedClassify` | `object\|null` | Clasificación pre-calculada |
| `cachedAnalyze` | `object\|null` | Análisis pre-calculado |
| `cachedTraceByCase` | `object\|null` | Trazas pre-calculadas por caso |
| `requestOrigin` | `string\|null` | Origin HTTP para callbacks LLM |

#### Response exitosa

- Cuerpo binario o texto del artefacto
- `Content-Type` determinado por `mimeType`
- `Content-Disposition: attachment; filename="report.ext"`
- Header `X-Snapshot-Id`: ID del snapshot usado
- Header `X-Content-Hash`: Hash SHA-256 del contenido

#### Response de error

```json
{
  "ok": false,
  "error": "Field 'source' is required.",
  "kind": "validation",
  "logs": "...",
  "compilerLogs": "...",
  "assetManifest": [...],
  "workDir": "/tmp/export-xxx"
}
```

Códigos de error:

| Código | Significado |
|--------|-------------|
| `400` | `source` vacío o faltante |
| `500` | Error interno del export (error de compilación LaTeX, etc.) |

## Ejemplos

- Trace worst-case con inputs autogenerados para un algoritmo iterativo;
- Trace recursivo de factorial con n=4 muestra 4 llamadas anidadas y sus retornos;
- Export ZIP con `report.md`, `report.pdf`, `snapshot.json` y `manifest.json`;
- Export Markdown genera documento autocontenido con análisis, tabla de costos y conclusiones.

## Límites conocidos

- Trace usa inputs concretos; no genera trazas simbólicas;
- Export PDF depende de `pdflatex` disponible en runtime;
- `export/report` falla con `400` si falta `source`;
- Si el snapshot no existe, export regenera el análisis completo.

## Archivos relacionados

- `schemas/execution-schema.md`
- `schemas/export-report-schema.md`
- `schemas/snapshot-schema.md`
- `../03-specs/execution-trace-spec.md`
- `../03-specs/export-engine-spec.md`
- `../03-specs/report-snapshot-spec.md`
