# Schema de parseo

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/parsing/router.py`, `packages/types/src/index.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.2.1

## Propósito

Documentar la forma del request/response de parseo de pseudocódigo a AST.

## Alcance

Schema documental para `POST /grammar/parse` y `POST /api/grammar/parse`.

## Fuente de verdad

- `packages/types/src/index.ts` (tipos `GrammarParseRequest`, `GrammarParseResponse`)
- `apps/api/app/modules/parsing/router.py`

## Estructura

### Request

```json
{ "input": "factorial(n) BEGIN RETURN 1; END" }
```

o (compatibilidad legacy)

```json
{ "source": "factorial(n) BEGIN RETURN 1; END" }
```

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `input` | `string` | No* | Código fuente a parsear (prioritario) |
| `source` | `string` | No* | Alias legacy de `input` |

> \* Al menos uno debe estar presente. Si ambos están, `input` tiene prioridad.

### Response exitosa

```json
{
  "ok": true,
  "available": true,
  "runtime": "python",
  "error": null,
  "ast": { "type": "Program", "statements": [...] },
  "errors": []
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `boolean` | Parseo exitoso |
| `available` | `boolean` | Disponibilidad del runtime de gramática |
| `runtime` | `"python"` | Runtime del parser |
| `error` | `string\|null` | Mensaje resumido del primer error |
| `ast` | `Program\|null` | AST del pseudocódigo |
| `errors` | `Array<{line, column, message}>` | Lista canónica de errores |

### Response con error

```json
{
  "ok": false,
  "available": true,
  "runtime": "python",
  "error": "extraneous input 'END' expecting {';', '\\n'}",
  "ast": null,
  "errors": [
    { "line": 1, "column": 32, "message": "extraneous input 'END' expecting {';', '\\n'}" }
  ]
}
```

## Ejemplos

### Request exitoso con `input`

```json
{ "input": "linear_search(A, n, x) BEGIN\n  FOR i <- 0 TO n - 1 DO BEGIN\n    IF (A[i] = x) THEN BEGIN\n      RETURN i;\n    END\n  END\n  RETURN -1;\nEND" }
```

### Request con caracteres no ASCII (compatibilidad legacy)

```json
{ "source": "suma(a, b) BEGIN\n  RESULTADO <- a + b;\n  RETORNAR RESULTADO;\nEND" }
```

## Límites conocidos

- `error` es compatibilidad resumida; la lista canónica vive en `errors[]`.
- El AST sigue el schema de `packages/types/src/index.ts`, no el de ANTLR nativo.
- La estructura exacta del AST (`Program`, `Statement`, `Expression`, etc.) se especifica en `ast-schema.md`.

## Archivos relacionados

- `../parse-api.md`
- `../../03-specs/ast-schema.md`
- `../../03-specs/pseudocode-grammar-spec.md`
