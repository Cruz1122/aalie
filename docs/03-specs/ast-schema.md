# Schema del AST

**Tipo:** normativa

## Propósito

Definir la forma canónica del AST que comparten parser, analizador, trace y tipos frontend.

## Alcance

Aplica al AST retornado por parse y al AST consumido por clasificación y análisis.

## Fuente de verdad

- `packages/types/src/index.ts`
- AST builders TS/Python del paquete de gramática

## Estructura

### Nodos base

- `BaseNode`: `type`, `pos`
- `Position`: `line`, `column`

### Nodos principales

- `Program`
- `ProcDef`
- `Block`
- `Assign`
- `DeclVector`
- `If`
- `While`
- `For`
- `Repeat`
- `Return`
- `Print`
- `Call`
- `Binary`
- `Unary`
- `Index`
- `Field`
- `Literal`
- `Identifier`
- `Param`, `ArrayParam`, `ObjectParam`

## Inputs

- árbol sintáctico construido desde `Language.g4`

## Outputs

- objeto JSON serializable compatible con `@aa/types`

## Invariantes

- todo nodo tipado tiene `type` y `pos`;
- `Program.body` contiene `ProcDef | AstNode`;
- `ProcDef` expone `name`, `params`, `body`;
- operadores binarios y unarios se normalizan a un conjunto cerrado;
- `Call.statement` distingue llamada-sentencia de llamada-expresión.

## Errores esperables

- AST ausente cuando parse falla;
- forma incompleta si el builder no puede traducir un nodo válido de parser a nodo canónico.

## Ejemplos

### Ejemplos validos

```json
{
  "type": "Identifier",
  "name": "n",
  "pos": { "line": 1, "column": 10 }
}
```

```json
{
  "type": "For",
  "var": "i",
  "start": { "type": "Literal", "value": 1, "pos": { "line": 2, "column": 12 } },
  "end": { "type": "Identifier", "name": "n", "pos": { "line": 2, "column": 17 } },
  "body": { "type": "Block", "body": [], "pos": { "line": 2, "column": 22 } },
  "pos": { "line": 2, "column": 3 }
}
```

### Ejemplos no soportados

```json
{
  "type": "MysteryNode"
}
```

```json
{
  "type": "Assign",
  "target": null,
  "value": null
}
```

## Limites conocidos

- La semántica de tipos es ligera; el AST no reemplaza la resolución semántica posterior.
- El AST canónico no garantiza que una construcción sea analizable por un método concreto.

## Archivos relacionados

- `pseudocode-grammar-spec.md`
- `analysis-engine-spec.md`
- `../04-api/schemas/parse-schema.md`
