# Schema de clasificación

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/classification/router.py`, `apps/api/app/modules/classification/service.py`, `apps/web/src/app/api/llm/classify/route.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.2.6

## Propósito

Definir la forma mínima del payload de clasificación de algoritmos.

## Alcance

Schema documental para `POST /classify` (backend) y `POST /api/llm/classify` (BFF).

## Fuente de verdad

- `apps/api/app/modules/classification/router.py`
- `apps/api/app/modules/classification/service.py`
- `apps/web/src/app/api/llm/classify/route.ts`

## Schemas

### Request backend

```json
{ "source": "factorial(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN 1;\n  END\n  ELSE BEGIN\n    RETURN n * factorial(n - 1);\n  END\nEND" }
```

o

```json
{ "ast": { "type": "Program", "statements": [...] } }
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `source` | `string` | No* | Código fuente a clasificar |
| `ast` | `Dict` | No* | AST ya parseado (evita re-parseo) |

> \* Al menos uno debe estar presente.

### Response backend

```json
{
  "ok": true,
  "kind": "recursive",
  "method": "ast",
  "errors": []
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `boolean` | Clasificación exitosa |
| `kind` | `"iterative"\|"recursive"\|"hybrid"\|"unknown"` | Tipo de algoritmo detectado |
| `method` | `"ast"` | Método: siempre `"ast"` (heurístico por AST) |
| `errors` | `Array\|null` | Errores de clasificación |

### Request BFF

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `source` | `string` | — | Código fuente (obligatorio) |
| `mode` | `"llm"\|"local"\|"auto"` | `"local"` | Modo (`"llm"` rechazado con 400) |

```json
{
  "source": "factorial(n) BEGIN RETURN n * factorial(n - 1); END",
  "mode": "local"
}
```

### Response BFF exitosa

```json
{
  "kind": "recursive",
  "method": "ast",
  "timestamp": "2026-05-18T12:00:00.000Z"
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `kind` | `string` | Tipo de algoritmo |
| `method` | `string` | Método de clasificación |
| `timestamp` | `string` | Timestamp ISO 8601 (agregado por BFF) |

### Response BFF error

```json
{ "error": "Source code is required" }
```

```json
{ "error": "Classification LLM mode \"llm\" is disabled. Use mode \"local\" or omit mode to rely on backend classification." }
```

### Response de error listado

| Código | Significado |
|--------|-------------|
| `400` | `mode="llm"` o `source` faltante |
| `500` | Error interno |
| `502` | (interno) Backend no disponible |
| `503` | (interno) Error de conexión con backend |

## Ejemplos

### Request con AST ya parseado

```json
{
  "ast": {
    "type": "Program",
    "statements": [
      { "type": "AlgorithmDeclaration", "name": "linear_search", "params": ["A", "n", "x"] }
    ]
  }
}
```

Esto evita parseo redundante en el backend cuando el frontend ya tiene el AST del editor Monaco.

### Response para algoritmo iterativo

```json
{
  "ok": true,
  "kind": "iterative",
  "method": "ast",
  "errors": []
}
```

### Response para algoritmo desconocido

```json
{
  "ok": true,
  "kind": "unknown",
  "method": "ast",
  "errors": [{ "message": "No se detectaron llamadas recursivas ni bucles", "line": null, "column": null }]
}
```

## Límites conocidos

- El BFF agrega `timestamp`; el backend no.
- La clasificación usa AST heurístico, no LLM. `kind` se determina por inspección estructural del AST.
- `method` siempre es `"ast"` en el backend; puede ser `"ast_error_fallback"` o `"error"` en el BFF si hay fallos.

## Archivos relacionados

- `../classification-api.md`
- `../../03-specs/analysis-engine-spec.md`
