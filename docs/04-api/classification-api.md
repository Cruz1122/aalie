# API de clasificación

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/classification/router.py`, `apps/api/app/modules/classification/service.py`, `apps/web/src/app/api/llm/classify/route.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.1.8

## Propósito

Fijar el contrato de clasificación de algoritmo (iterativo/recursivo/híbrido/desconocido) y su uso desde el frontend.

## Alcance

Cubre `POST /classify` (backend) y `POST /api/llm/classify` (BFF). Aunque el BFF vive bajo `/api/llm/`, no usa LLM: es clasificación por AST heurístico.

## Fuente de verdad

- `apps/api/app/modules/classification/router.py`
- `apps/api/app/modules/classification/service.py`
- `apps/web/src/app/api/llm/classify/route.ts`

## Estructura

### Backend `POST /classify`

- Path: `/classify`
- Method: `POST`
- Consumidor principal: BFF `llm/classify`, flujo del analizador (backend interno)

#### Request

Acepta dos formatos de entrada:

```json
{ "source": "factorial(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN 1;\n  END\n  ELSE BEGIN\n    RETURN n * factorial(n - 1);\n  END\nEND" }
```

o (para evitar parseo redundante)

```json
{ "ast": { "type": "Program", "statements": [...] } }
```

Campos:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `source` | `string` | No* | Código fuente a clasificar |
| `ast` | `Dict` | No* | AST ya parseado (evita re-parseo) |

> \* Al menos uno debe estar presente.

#### Response

```json
{
  "ok": true,
  "kind": "recursive",
  "method": "ast",
  "errors": []
}
```

Campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `boolean` | Clasificación exitosa |
| `kind` | `"iterative"\|"recursive"\|"hybrid"\|"unknown"` | Tipo de algoritmo detectado |
| `method` | `"ast"` | Método de clasificación (siempre `"ast"`, heurístico) |
| `errors` | `Array\|null` | Errores si los hay |

#### Errores

| Código | Significado |
|--------|-------------|
| `200` con `ok=false` | Clasificación fallida (source vacío, AST inválido) |
| `500` | Error interno del backend |

### BFF `POST /api/llm/classify`

- Path: `/api/llm/classify`
- Method: `POST`
- Consumidor principal: UI (frontend)

Este BFF **no es un proxy directo**. Contiene lógica específica:

1. Rechaza `mode="llm"` con error `400` — el modo LLM está deshabilitado.
2. Siempre usa backend Python (`/classify`) como fuente única de verdad basada en AST.
3. Agrega `timestamp` a la respuesta.

#### Request

```json
{
  "source": "factorial(n) BEGIN\n  RETURN n * factorial(n - 1);\nEND",
  "mode": "local"
}
```

| Campo | Tipo | Default | Descripción |
|-------|------|---------|-------------|
| `source` | `string` | — | Código fuente a clasificar |
| `mode` | `"llm"\|"local"\|"auto"` | `"local"` | Modo de clasificación (`"llm"` rechazado con error) |

#### Response exitosa

```json
{
  "kind": "recursive",
  "method": "ast",
  "timestamp": "2026-05-18T12:00:00.000Z"
}
```

#### Response error

```json
{
  "error": "Classification LLM mode \"llm\" is disabled. Use mode \"local\" or omit mode to rely on backend classification."
}
```

```json
{
  "error": "Source code is required"
}
```

```json
{
  "error": "Internal server error",
  "details": "Backend error: 500..."
}
```

#### Códigos de error

| Código | Significado |
|--------|-------------|
| `400` | `mode="llm"` o `source` faltante |
| `500` | Error interno del BFF o backend no disponible |
| `502` | (interno) Backend respondió con error |

## Ejemplos

### Request con AST ya parseado

```json
{ "ast": { "type": "Program", "statements": [...] } }
```

Esto evita parseo redundante en el backend cuando el frontend ya tiene el AST del editor.

### Response para algoritmo híbrido

QuickSort con partición iterativa y llamada recursiva:

```json
{
  "ok": true,
  "kind": "hybrid",
  "method": "ast"
}
```

## Límites conocidos

- Clasificación usa AST heurístico, no LLM.
- El BFF existe por consumo frontend, no porque la clasificación sea parte del subsistema LLM.
- El BFF intenta llamar al backend hasta 2 veces si la primera falla (retry lógico).
- Si todas las llamadas fallan, retorna `kind: "unknown"` con `method: "error"`.

## Archivos relacionados

- `schemas/classification-schema.md`
- `analysis-api.md`
- `../03-specs/analysis-engine-spec.md`
