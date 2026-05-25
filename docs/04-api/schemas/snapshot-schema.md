# Schema de snapshot

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `packages/types/src/export-snapshot.ts`, `apps/api/app/modules/export/constants.py`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.2.8

## Propósito

Referenciar la forma del snapshot público versionado usado como fuente única de verdad para exportaciones.

## Alcance

Schema documental para `AalieAnalysisSnapshotV1`.

## Fuente de verdad

- `packages/types/src/export-snapshot.ts`
- `apps/api/app/modules/export/constants.py`

## Estructura

### Campos raíz

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `schemaVersion` | `string` | Versión del schema (ej: `"1.0.0"`) |
| `snapshotId` | `string` | Identificador único del snapshot |
| `contentHash` | `string` | Hash SHA-256 del contenido analizado |
| `createdAt` | `string` | Timestamp ISO 8601 de creación |
| `locale` | `string` | Idioma del snapshot (`"es"` o `"en"`) |
| `meta` | `Dict` | Metadatos del snapshot (versión de API, etc.) |
| `input` | `Dict` | Input original: código fuente y config |
| `internal` | `Dict` | Datos internos del análisis (AST, clasificación, trace) |
| `globalResult` | `Dict` | Resultado global del análisis |
| `comparative` | `Dict\|null` | Resultados comparativos (LLM, GPU vs CPU) |
| `institutional` | `Dict` | Metadatos institucionales (autor, curso) |

```json
{
  "schemaVersion": "1.0.0",
  "snapshotId": "snap-abc123",
  "contentHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "createdAt": "2026-05-18T12:00:00.000Z",
  "locale": "es",
  "meta": {
    "appVersion": "0.1.0"
  },
  "input": {
    "source": "factorial(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN 1;\n  END\n  ELSE BEGIN\n    RETURN n * factorial(n - 1);\n  END\nEND",
    "mode": "worst",
    "algorithm_kind": "recursive",
    "preferred_method": "master",
    "locale": "es"
  },
  "internal": {
    "parse": { "ok": true, "ast": {} },
    "classify": { "ok": true, "kind": "recursive", "method": "ast" },
    "analysis": { "ok": true, "byLine": [], "totals": {} },
    "traceByCase": {}
  },
  "globalResult": {
    "T_open": "n",
    "T_polynomial": "O(n)",
    "procedure": []
  },
  "comparative": null,
  "institutional": {
    "author": "Juan Camilo Cruz Parra",
    "course": "Análisis de Algoritmos"
  }
}
```

## Ejemplos

### Snapshot version `1.0.0`

```json
{
  "schemaVersion": "1.0.0",
  "snapshotId": "snap-xyz789",
  "contentHash": "abc123def456",
  "createdAt": "2026-05-18T10:30:00.000Z",
  "locale": "en",
  "input": { "source": "linear_search(...)", "mode": "all" },
  "internal": { ... },
  "globalResult": { "T_open": "n", "T_polynomial": "O(n)" },
  "institutional": {}
}
```

### Snapshot con comparative LLM

```json
{
  "comparative": {
    "llm": {
      "model": "gemini-2.5-flash",
      "analysis": "O(n)",
      "note": "Coincide con el análisis formal"
    }
  }
}
```

## Límites conocidos

- El detalle profundo vive en la spec de snapshot; este archivo resume el shape.
- `schemaVersion` sigue semver estricto para detectar cambios breaking.
- `comparative` puede ser `null` si no hay datos de comparación (LLM no configurado, etc.).

## Archivos relacionados

- `../../03-specs/report-snapshot-spec.md`
- `export-report-schema.md`
- `../execution-api.md`
