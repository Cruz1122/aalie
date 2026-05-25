# API de parseo

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/parsing/router.py`, `apps/web/src/app/api/grammar/parse/route.ts`, `packages/types/src/index.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** sección 4.1.1

## Propósito

Definir el contrato de parseo de pseudocódigo a AST, tanto en backend como en su proxy frontend.

## Alcance

Cubre `POST /grammar/parse` (backend) y `POST /api/grammar/parse` (BFF).

## Fuente de verdad

- `apps/api/app/modules/parsing/router.py`
- `apps/web/src/app/api/grammar/parse/route.ts`
- `packages/types/src/index.ts` (tipos `GrammarParseRequest`, `GrammarParseResponse`)

## Estructura

### Backend `POST /grammar/parse`

- Path: `/grammar/parse`
- Method: `POST`
- Consumidor principal: BFF `api/grammar/parse`, worker de parseo, flujo del analizador

#### Request

Acepta dos formas para compatibilidad legacy:

```json
{ "input": "factorial(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN 1;\n  END\nEND" }
```

o

```json
{ "source": "factorial(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN 1;\n  END\nEND" }
```

Campos:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| `input` | `string` | No* | Código fuente a parsear |
| `source` | `string` | No* | Alias legacy de `input` |

> \* Al menos uno debe estar presente; si ambos están, `input` tiene prioridad.

#### Response

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

Campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `ok` | `boolean` | Parseo exitoso |
| `available` | `boolean` | Disponibilidad del grammar runtime |
| `runtime` | `"python"` | Runtime del parser |
| `error` | `string\|null` | Mensaje resumido del primer error si `ok=false` |
| `ast` | `Program\|null` | AST completo si `ok=true` |
| `errors` | `Array<{line, column, message}>` | Lista canónica de errores de parseo |

### BFF `POST /api/grammar/parse`

- Path: `/api/grammar/parse`
- Method: `POST`
- Consumidor principal: UI (Monaco Editor, flujo de análisis)

Proxy que envía `{ input }` al backend y retransmite la respuesta. No altera el contrato funcional. En caso de error de conexión retorna `503`; si la respuesta del backend tiene forma inesperada retorna `502`.

#### Errores

| Código | Significado |
|--------|-------------|
| `400` | Parse inválido (`ok=false`, `errors[]` con detalles) |
| `500` | Fallo interno del backend |
| `502` | Proxy con respuesta inesperada del backend |
| `503` | Backend no disponible (error de conexión) |

## Ejemplos

### Request exitoso

```json
{
  "source": "factorial(n) BEGIN\n  IF (n <= 1) THEN BEGIN\n    RETURN 1;\n  END\n  ELSE BEGIN\n    RETURN n * factorial(n - 1);\n  END\nEND"
}
```

### Response exitoso

```json
{
  "ok": true,
  "available": true,
  "runtime": "python",
  "error": null,
  "ast": {
    "type": "Program",
    "statements": [
      {
        "type": "AlgorithmDeclaration",
        "name": "factorial",
        "params": ["n"],
        "body": {
          "type": "Block",
          "statements": [
            {
              "type": "IfStatement",
              "condition": { "type": "BinaryOp", "op": "<=", "left": { "type": "Identifier", "name": "n" }, "right": { "type": "Literal", "value": 1 } },
              "thenBody": { "type": "Block", "statements": [{ "type": "ReturnStatement", "value": { "type": "Literal", "value": 1 } }] },
              "elseBody": { "type": "Block", "statements": [{ "type": "ReturnStatement", "value": { "type": "BinaryOp", "op": "*", "left": { "type": "Identifier", "name": "n" }, "right": { "type": "CallExpression", "callee": { "type": "Identifier", "name": "factorial" }, "args": [{ "type": "BinaryOp", "op": "-", "left": { "type": "Identifier", "name": "n" }, "right": { "type": "Literal", "value": 1 } }] } } }] }
            }
          ]
        }
      }
    ]
  },
  "errors": []
}
```

### Request con error de sintaxis

```json
{
  "input": "factorial(n) BEGIN RETURN 1 END"
}
```
*(Falta `;` al final de `RETURN 1`)*

### Response con error

```json
{
  "ok": false,
  "available": true,
  "runtime": "python",
  "error": "Missing semicolon at line 1",
  "ast": null,
  "errors": [
    { "line": 1, "column": 32, "message": "extraneous input 'END' expecting {';', '\\n'}" }
  ]
}
```

## Compatibilidad

- El backend conserva compatibilidad `input | source`;
- El proxy Next hoy entrega `input`;
- El parser mantiene compatibilidad legacy para algunos símbolos no ASCII, pero la sintaxis oficial visible del producto sigue siendo ASCII.

## Límites conocidos

- `ok=true` solo garantiza AST válido, no cobertura posterior del analizador.
- El AST sigue el schema de `packages/types/src/index.ts`, no el de ANTLR nativo.

## Archivos relacionados

- `schemas/parse-schema.md`
- `../03-specs/pseudocode-grammar-spec.md`
- `../03-specs/ast-schema.md`
