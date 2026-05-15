# Schema del AST

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `packages/types/src/index.ts`, AST builders en `packages/grammar/py/src/aa_grammar/ast_builder.py` y `packages/grammar/src/ts/ast-builder.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Sección 2.2 (AST), Apéndice B (diagrama de tipos)

---

## Propósito

Definir la forma canónica del AST que comparten parser, analizador, trace y tipos frontend.

## Alcance

Aplica al AST retornado por `POST /grammar/parse` y al AST consumido por clasificación (`/classify`), análisis (`/analyze/open`), trace (`/analyze/trace`) y export (`/export/report`).

## Fuera de alcance

- Gramática subyacente (`Language.g4`) — cubierta por `pseudocode-grammar-spec.md`
- Árbol sintáctico concreto (CST) generado por ANTLR — el AST es una transformación del CST
- Validación semántica que require tabla de símbolos completa

## Contenido

### 1. Nodo base

```
BaseNode {
  type: string;     // identificador del tipo de nodo
  pos: Position;    // localización en el código fuente
}

Position {
  line: number;     // 1-based
  column: number;   // 0-based (caracter dentro de la línea)
}
```

**Todo nodo AST hereda de `BaseNode`.** `pos` permite localizar errores, generar trazas línea-por-línea, y vincular el análisis a la fuente original.

### 2. Nodos de nivel superior

#### `Program`
```
{
  type: "Program";
  pos: Position;
  body: (ProcDef | AstNode)[];  // procedimientos y sentencias sueltas
}
```
- Nodo raíz de todo AST válido.
- `body` contiene cero o más `ProcDef` y opcionalmente sentencias sueltas.

#### `ProcDef`
```
{
  type: "ProcDef";
  pos: Position;
  name: string;           // nombre del procedimiento
  params: ParamNode[];    // parámetros formales
  body: Block;            // cuerpo del procedimiento
}
```
- Corresponde a `ID LPAREN paramList? RPAREN block` en la gramática.
- El primer `ProcDef` en `Program.body` se trata como procedimiento principal.

### 3. Nodos de parámetros

#### `Param` (escalar)
```
{
  type: "Param";
  pos: Position;
  name: string;
}
```

#### `ArrayParam` (arreglo)
```
{
  type: "ArrayParam";
  pos: Position;
  name: string;
  start: Identifier | Literal;    // límite inferior del arreglo
  end?: Identifier | Literal;     // límite superior (opcional, ej. A[n] vs A[1]..[n])
}
```

#### `ObjectParam` (objeto)
```
{
  type: "ObjectParam";
  pos: Position;
  className: string;    // nombre de la clase (ej. "Nodo")
  name: string;         // nombre del objeto (ej. "raiz")
}
```

### 4. Nodos de sentencia (Statement)

#### `Block`
```
{
  type: "Block";
  pos: Position;
  body: AstNode[];      // lista de sentencias
}
```
- Representa `BEGIN ... END` o `{ ... }`.
- Siempre contiene una lista de nodos (puede ser vacía).

#### `Assign`
```
{
  type: "Assign";
  pos: Position;
  target: AstNode;      // lvalue (Identifier, Index, Field)
  value: AstNode;       // expresión asignada
}
```
- Corresponde a `lvalue <- expr`.

#### `DeclVector`
```
{
  type: "DeclVector";
  pos: Position;
  id: string;           // nombre del arreglo
  dims: AstNode[];      // dimensiones
}
```
- Corresponde a `ID indexSuffix+;` (declaración sin asignación).

#### `If`
```
{
  type: "If";
  pos: Position;
  test: AstNode;        // condición
  consequent: Block;    // rama THEN
  alternate?: Block;    // rama ELSE (opcional)
}
```
- Si no hay `ELSE`, `alternate` está ausente (no es un bloque vacío).
- `ELSE IF` se representa como `If` anidado dentro de `alternate` de otro `If`.

#### `While`
```
{
  type: "While";
  pos: Position;
  test: AstNode;        // condición
  body: Block;          // cuerpo del bucle
}
```

#### `For`
```
{
  type: "For";
  pos: Position;
  var: string;          // nombre de la variable de control
  start: AstNode;       // límite inferior (expresión)
  end: AstNode;         // límite superior (expresión)
  body: Block;
}
```
- Sin campo `step`; la semántica es siempre incremento en 1.

#### `Repeat`
```
{
  type: "Repeat";
  pos: Position;
  body: Block;          // cuerpo que se ejecuta al menos una vez
  test: AstNode;        // condición de salida (post-test)
}
```
- Corresponde a `REPEAT stmt+ UNTIL (expr)`.
- **Importante:** la condición `test` se evalúa después del cuerpo.

#### `Return`
```
{
  type: "Return";
  pos: Position;
  value: AstNode;       // expresión de retorno (siempre presente)
}
```

#### `Print`
```
{
  type: "Print";
  pos: Position;
  args: AstNode[];      // argumentos de print()
}
```
- Corresponde a `print(expr, expr, ...)`.

#### `Call` (como sentencia)
```
{
  type: "Call";
  pos: Position;
  callee: string;       // nombre del procedimiento llamado
  args: AstNode[];      // argumentos
  statement: boolean;   // true si es CALL sentencia, false si es expresión
  builtIn?: boolean;    // true si es una función incorporada (ej. LENGTH)
}
```
- `statement: true` cuando se usa con `CALL`.
- `statement: false` cuando es `callExpr` (llamada como expresión dentro de una asignación o condición).

### 5. Nodos de expresión (Expression)

#### `Literal`
```
{
  type: "Literal";
  pos: Position;
  value: number | boolean | string | null;
}
```

#### `Identifier`
```
{
  type: "Identifier";
  pos: Position;
  name: string;
}
```

#### `Binary`
```
{
  type: "Binary";
  pos: Position;
  op: "==" | "!=" | "<" | "<=" | ">" | ">="
    | "+" | "-" | "*" | "/" | "div" | "mod"
    | "and" | "or";
  left: AstNode;
  right: AstNode;
}
```
- Conjunto **cerrado** de operadores binarios. `div` y `mod` corresponden a los keywords `DIV` y `MOD`.

#### `Unary`
```
{
  type: "Unary";
  pos: Position;
  op: "not" | "-";
  arg: AstNode;
}
```
- `not` para negación lógica (`NOT a`).
- `-` para negación aritmética (`-a`).

#### `Index`
```
{
  type: "Index";
  pos: Position;
  target: AstNode;              // el arreglo (ej. Identifier "A")
  index?: AstNode;              // índice simple (ej. i en A[i])
  range?: { start: AstNode; end: AstNode };  // slice (ej. 1..n en A[1..n])
}
```
- Indexación **1-based**.
- `index` y `range` son mutuamente excluyentes (uno presente, el otro ausente).

#### `Field`
```
{
  type: "Field";
  pos: Position;
  target: AstNode;              // objeto base (ej. Identifier "raiz")
  name: string;                 // nombre del campo (ej. "izquierda")
}
```

### 6. Type union completo

```typescript
type AstNode =
  | Program | ProcDef | Block | Assign | DeclVector
  | If | While | For | Repeat | Return | Print | Call
  | Binary | Unary | Index | Field | Literal | Identifier
  | Param | ArrayParam | ObjectParam;
```

## Inputs

- Árbol sintáctico concreto (CST) generado por ANTLR desde `Language.g4`.
- El CST se transforma a AST canónico mediante builders dedicados (TS y Python).

## Outputs

- Objeto JSON serializable compatible con `packages/types/src/index.ts`.
- Si el parseo falla, no se produce AST; se retorna lista de errores.

## Contrato

1. Todo nodo tipado tiene `type` y `pos` (herencia de `BaseNode`).
2. `Program.body` contiene `ProcDef | AstNode`.
3. `ProcDef` expone `name`, `params`, `body`.
4. Operadores binarios y unarios se normalizan a un conjunto cerrado (ver `Binary.op` y `Unary.op` arriba).
5. `Call.statement` distingue llamada-sentencia de llamada-expresión.
6. `Block.body` es siempre una lista (posiblemente vacía).
7. `If.alternate` está ausente (no `null`) cuando no hay ELSE.
8. `For.var` es un string (nombre de la variable), no un nodo `Identifier`.

## Invariantes

- El AST canónico no depende del target de compilación (TS y Python producen la misma estructura).
- El AST no contiene nodos del CST intermedio de ANTLR (Context nodes).
- Una construcción parseable no implica que sea analizable por un método concreto.
- La semántica de tipos es ligera; el AST no reemplaza la resolución semántica posterior.

## Errores esperables

- **AST ausente:** cuando el parseo falla (errores léxicos o sintácticos).
- **Forma incompleta:** si el builder no puede traducir un nodo válido del parser a nodo canónico.
- **Propiedades faltantes:** la API de parseo puede retornar `errors` con `line`, `column`, `message`.

## Casos soportados

### Ejemplo: Asignación
```json
{
  "type": "Assign",
  "target": {
    "type": "Identifier",
    "name": "suma",
    "pos": { "line": 2, "column": 2 }
  },
  "value": {
    "type": "Literal",
    "value": 0,
    "pos": { "line": 2, "column": 11 }
  },
  "pos": { "line": 2, "column": 2 }
}
```

### Ejemplo: FOR loop
```json
{
  "type": "For",
  "var": "i",
  "start": { "type": "Literal", "value": 1, "pos": { "line": 3, "column": 10 } },
  "end": { "type": "Identifier", "name": "n", "pos": { "line": 3, "column": 15 } },
  "body": {
    "type": "Block",
    "body": [
      {
        "type": "Assign",
        "target": { "type": "Identifier", "name": "suma", "pos": { "line": 4, "column": 4 } },
        "value": {
          "type": "Binary",
          "op": "+",
          "left": { "type": "Identifier", "name": "suma", "pos": { "line": 4, "column": 12 } },
          "right": {
            "type": "Index",
            "target": { "type": "Identifier", "name": "A", "pos": { "line": 4, "column": 18 } },
            "index": { "type": "Identifier", "name": "i", "pos": { "line": 4, "column": 20 } },
            "pos": { "line": 4, "column": 18 }
          },
          "pos": { "line": 4, "column": 12 }
        },
        "pos": { "line": 4, "column": 4 }
      }
    ],
    "pos": { "line": 3, "column": 18 }
  },
  "pos": { "line": 3, "column": 2 }
}
```

## Casos no soportados

### Ejemplo: Nodo desconocido
```json
{
  "type": "MysteryNode"
}
```
No existe como tipo en el union `AstNode`; será rechazado por los validadores.

### Ejemplo: Assign mal formado
```json
{
  "type": "Assign",
  "target": null,
  "value": null
}
```
Todos los campos deben cumplir con el schema; `null` no es válido para `target` ni `value`.

## Evidencia desde código o configuración

- **Tipos canónicos:** `packages/types/src/index.ts` líneas 16-183 definen todas las interfaces.
- **Type union:** línea 162-183 define `AstNode` como union exhaustivo.
- **Compatibilidad TS vs Python:** ambos builders (`ast_builder.py` y `ast-builder.ts`) producen estructuras JSON equivalentes.
- **Parsing service:** `apps/api/app/modules/parsing/service.py` usa el parser generado y retorna `ParseResponse` con `ast?: Program`.

## Limitaciones

- La semántica de tipos es ligera; el AST no reemplaza la resolución semántica posterior.
- El AST canónico no garantiza que una construcción sea analizable por un método concreto.
- No hay distinción entre declaración e inicialización (ambas son `Assign`).
- El AST no preserva comentarios (son skipeados por el lexer).
- `DeclVector` es un nodo separado; la inicialización con valores por defecto no está soportada.

## Archivos relacionados

- `pseudocode-grammar-spec.md` — gramática que produce el CST
- `analysis-engine-spec.md` — pipeline que consume el AST
- `algorithm-classification-spec.md` — clasificación basada en AST
- `execution-trace-spec.md` — traza que recorre el AST
- `../04-api/schemas/parse-schema.md` — schema del request/response de parseo
