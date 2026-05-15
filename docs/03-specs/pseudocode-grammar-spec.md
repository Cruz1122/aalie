# Especificación de gramática de pseudocódigo

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `packages/grammar/grammar/Language.g4`, AST builders en `packages/grammar/py/src/aa_grammar/ast_builder.py` y `packages/grammar/src/ts/ast-builder.ts`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Secciones 2.1 (gramática), 2.2 (AST), Apéndice A (ejemplos)

---

## Propósito

Fijar la gramática soportada hoy por AALIE y separar claramente lo que la gramática acepta de lo que el motor posterior realmente analiza con cobertura fuerte.

## Alcance

Aplica al parser ANTLR4 (archivo `Language.g4`) y al AST canónico generado desde `source`. Aplica a ambos targets de compilación: TypeScript (frontend, `packages/grammar/src/ts/`) y Python (backend, `packages/grammar/py/src/aa_grammar/`).

## Fuera de alcance

- Validación semántica (tipos, ámbito de variables)
- Análisis de complejidad (cubierto por `analysis-engine-spec.md`)
- Comportamiento del editor Monaco (autocompletado, snippets)

## Contenido

### 1. Gramática efectiva soportada hoy

#### Estructura del programa

```
program  → classDef* (procDef | stmt)* EOF
```

Un `Program` puede contener:
- Definiciones de clase (`Class Nombre { ... }`) — **solo parseables, no analizadas**
- Definiciones de procedimiento (`nombre(parametros) BEGIN ... END`)
- Sentencias sueltas

#### Procedimientos

```
procDef  → ID '(' paramList? ')' block
block    → '{' stmt* '}' | BEGIN stmt* END
```

- `procDef` no tiene palabra clave `PROCEDURE` ni `FUNCTION`; el nombre es un identificador seguido de paréntesis.
- El cuerpo usa `BEGIN ... END` (estilo Pascal-like) o `{ ... }` (estilo C-like).
- **No hay tipo de retorno en la cabecera.** El retorno es implícito o explícito vía `RETURN`.

#### Parámetros

```
paramList → param (',' param)*
param     → arrayParam | objectParam | ID
arrayParam → ID arrayDim+ (RANGE arrayDim+)?
arrayDim  → '[' (ID | INT) ']'
objectParam → ID ID    // Clase nombre_objeto
```

Tres tipos de parámetros formales:
- **Escalar:** solo un `ID` (ej. `n`, `x`)
- **Arreglo multidimensional:** `A[n][m]` o `A[1]..[n]` con rango opcional
- **Objeto:** `Clase nombre` (ej. `Nodo raiz`)

#### Sentencias

```
stmt → assignmentStmt | callStmt | printStmt | ifStmt
     | whileStmt | repeatStmt | forStmt | returnStmt
     | block | declVectorStmt | ';'
```

| Sentencia | Sintaxis | Notas |
|---|---|---|
| Asignación | `lvalue <- expr ;` | Operador `<-`, `:=`, o unicode `🡨` `←` `⟵` |
| Llamada (sentencia) | `CALL nombre(args) ;` | Con palabra clave `CALL` |
| Llamada (expresión) | `nombre(args)` | Sin `CALL`, como expresión |
| Print | `print(args) ;` | Múltiples argumentos separados por coma |
| IF | `IF (expr) THEN block (ELSE ifStmt | block)?` | `ELSE` puede encadenar otro `IF` |
| WHILE | `WHILE (expr) DO block` | |
| REPEAT | `REPEAT stmt+ UNTIL (expr) ;` | Cuerpo ejecutado al menos una vez |
| FOR | `FOR ID <- expr TO expr DO block` | Sintaxis fija: `var <- start TO end` |
| RETURN | `RETURN expr ;` | Siempre lleva expresión |
| DeclVector | `ID indexSuffix+ ;` | Declaración de arreglo sin asignación |
| Block | `BEGIN ... END` o `{ ... }` | |

#### IF/ELSE

```
ifStmt → IF '(' expr ')' THEN block (ELSE (ifStmt | block))?
```

- `ELSE` puede seguir con otro `IF` completo (elsif-like) o con un bloque simple.
- No existe `ELSIF` / `ELSE IF` como token separado; se logra por anidación natural.

#### FOR loop

```
forStmt → FOR ID ASSIGN expr TO expr DO block
```

- La variable de control es un `ID` (no expresión).
- `start` y `end` son expresiones arbitrarias.
- **No tiene STEP.** La semántica es siempre incremento en 1.
- No existe `FOR ... DOWNTO` ni `FOR EACH`.

#### WHILE loop

```
whileStmt → WHILE '(' expr ')' DO block
```

- Condición entre paréntesis.
- Cuerpo en bloque obligatorio.

#### REPEAT loop

```
repeatStmt → REPEAT stmt+ UNTIL '(' expr ')' ';'?
```

- El cuerpo se ejecuta **al menos una vez**.
- La condición se evalúa al final (post-test loop, como `do...while`).
- El `';'` final es opcional.

#### CALL

```
callStmt → CALL ID '(' argList? ')' ';'?
callExpr → ID '(' argList? ')'
```

- **Distingo importante:** `CALL f(x)` es una sentencia; `f(x)` es una expresión (puede aparecer dentro de una asignación, condición, etc.).
- En el AST, `Call.statement` distingue ambas formas.

#### RETURN

```
returnStmt → RETURN expr ';'
```

- **Siempre lleva expresión.** No existe `RETURN` sin valor.
- Para retorno vacío, usar `RETURN 0` o `RETURN null`.

#### Arreglos

```
lvalue      → ID (fieldAccess | indexSuffix)*
indexSuffix → '[' expr (RANGE expr)? ']'
```

- Indexación **1-based**: `A[1]` es el primer elemento.
- Soporte para slicing: `A[1..n]`.
- Multi-dimensional: `A[i][j]`.
- Declaración: `A[1..n];` como `declVectorStmt`.

#### Objetos

```
fieldAccess → '.' ID
```

Acceso a campos de objetos: `raiz.izquierda`, `obj.campo`.

#### Comentarios

| Tipo | Sintaxis | Comportamiento |
|---|---|---|
| Linea oficial | `// texto` | Skipeado por el lexer |
| Legacy | `► texto` | Skipeado por el lexer (carácter Unicode) |

- La UI debe enseñar `//` como sintaxis oficial.
- `►` es solo compatibilidad legacy y no debe enseñarse en ejemplos, snippets ni microcopy.

### 2. Keywords (lista completa del lexer)

```
FOR, WHILE, IF, THEN, ELSE, BEGIN, END, TO, DO,
CALL, AND, OR, NOT, TRUE, FALSE, NULL, LENGTH,
DIV, MOD, CLASS, RETURN, REPEAT, UNTIL, PRINT
```

Los keywords son **case-insensitive** gracias a fragmentos de lexer como `F O R` → cualquier combinación de mayúsculas/minúsculas coincide.

### 3. Operadores

#### Aritméticos

| Operador | Token | Sintaxis |
|---|---|---|
| Suma | `+` | `a + b` |
| Resta | `-` | `a - b` (binario) / `-a` (unario) |
| Multiplicación | `*` | `a * b` |
| División real | `/` | `a / b` |
| División entera | `DIV` | `a DIV b` |
| Módulo | `MOD` | `a MOD b` |

#### Comparación

| Operador | Tokens | Sintaxis oficial |
|---|---|---|
| Igual | `=` | `a = b` |
| Distinto | `!=`, `<>`, `≠` | `a != b` |
| Menor | `<` | `a < b` |
| Menor o igual | `<=`, `≤` | `a <= b` |
| Mayor | `>` | `a > b` |
| Mayor o igual | `>=`, `≥` | `a >= b` |

#### Lógicos

| Operador | Token | Sintaxis |
|---|---|---|
| AND | `AND` | `a AND b` (no `&&`) |
| OR | `OR` | `a OR b` (no `||`) |
| NOT | `NOT` | `NOT a` (no `!`) |

#### Asignación

| Operador | Tokens |
|---|---|
| Asignación | `<-`, `:=`, `🡨`, `←`, `⟵` |

### 4. Literales

| Tipo | Sintaxis |
|---|---|
| Entero | `42`, `0`, `123` |
| Booleano | `TRUE`, `FALSE` |
| String | `"texto"` (doble comilla, con escapes `\"` y `\\`) |
| Null | `NULL` |

### 5. Comunes errores de parseo

| Error | Causa probable |
|---|---|
| `mismatched input ':' expecting {'<-', ':=', ...}` | Usar `=` en lugar de `<-` para asignación |
| `extraneous input 'THEN' expecting {...}` | Olvidar paréntesis en condición `IF` |
| `missing ';' at 'END'` | Punto y coma faltante antes de `END` |
| `no viable alternative at input 'FOR'` | Sintaxis `FOR` incorrecta (ej. falta `TO`) |
| `token recognition error at: ':'` | `:=` es válido pero `:` suelto no |
| `mismatched input '}' expecting ';'` | Bloque `{ }` dentro de `BEGIN END` mal cerrado |

### 6. Diferencias entre gramática surface y cobertura del motor

| Construcción | Parseable | Analizable | Notas |
|---|---|---|---|
| `ProcDef` con escalares | Sí | Sí | |
| `ProcDef` con arreglos | Sí | Sí | Nombres base se usan en sanitización |
| `ProcDef` con objetos | Sí | Parcial | Solo heurística de campos para BST/listas |
| `ClassDef` | Sí | No | Solo parseable, ignorado por análisis |
| `FOR` con límites constantes | Sí | Sí | Cierre exacto de sumatoria |
| `FOR` con límites variables | Sí | Sí | Expresiones simbólicas, SymPy closure |
| `WHILE` lineales | Sí | Sí | Patrón `linear_counter` (evidencia fuerte) |
| `WHILE` geométricos | Sí | Sí | Patrón `geometric_growth` |
| `WHILE` binaria | Sí | Sí | Patrón `binary_search_interval` |
| `WHILE` Euclides | Sí | Sí | Patrón `euclid_mod` |
| `WHILE` bandera | Sí | Sí | Patrón `flag_kill` |
| `WHILE` complejo | Sí | Parcial | `partial`, `unknown`, o `unbounded` |
| `REPEAT` | Sí | Parcial | Símbolo iterativo \(t_{repeat}\) |
| `RETURN` con expresión | Sí | Sí | Costo elemental |
| `CALL` a subrutina | Sí | Sí | Costo elemental |
| `print()` | Sí | Sí | Costo elemental |
| Objetos con field access | Sí | Parcial | Solo para guiar heurística de recurrencia |
| Strings y null | Sí | No | Ignorados en análisis de complejidad |

## Contrato

1. **Parseo exitoso** → AST canónico con nodo raíz `Program`.
2. **Parseo fallido** → lista de errores con `line`, `column`, `message`.
3. **Un `Program` puede contener `classDef*`** y luego `procDef | stmt`.
4. **Toda estructura de control usa `block` completo** (`BEGIN...END` o `{...}`).
5. **`returnStmt` exige expresión** (no existe `RETURN` sin argumento).
6. **`callStmt` con `CALL`**; **`callExpr` sin `CALL`**.
7. **La UI debe enseñar una sola sintaxis oficial visible en ASCII.**

## Invariantes

- La gramática puede aceptar más formas de entrada que las plenamente soportadas por el motor de análisis.
- Parsear correctamente no implica que WHILE, recurrencias o simplificaciones queden cubiertas con conclusión fuerte.
- La sintaxis oficial visible del producto es ASCII: `//`, `<-`, `<=`, `>=`, `!=`.
- Los alias Unicode y operadores alternativos existen a nivel de parseo solo como compatibilidad legacy.

## Errores esperables

- Tokens inesperados (ej. `:` donde se espera `<-`).
- Bloques incompletos (BEGIN sin END, `{` sin `}`).
- Paréntesis o corchetes no balanceados.
- Uso de construcciones fuera de la gramática (ej. `for each`, `switch`, `elif`).
- Asignación con `=` en lugar de `<-`.

## Casos soportados

### Ejemplo 1: Algoritmo iterativo con FOR
```
sumaArreglo(A[n]) BEGIN
  suma <- 0;
  FOR i <- 1 TO n DO BEGIN
    suma <- suma + A[i];
  END
  RETURN suma;
END
```

### Ejemplo 2: Algoritmo con WHILE geométrico
```
potenciaDos(n) BEGIN
  i <- 1;
  WHILE (i < n) DO BEGIN
    i <- i * 2;
  END
  RETURN i;
END
```

### Ejemplo 3: Algoritmo recursivo divide-and-conquer
```
mergesort(A[1]..[n]) BEGIN
  IF (n > 1) THEN BEGIN
    mitad <- n DIV 2;
    CALL mergesort(A[1]..[mitad]);
    CALL mergesort(A[mitad+1]..[n]);
    CALL merge(A[1]..[n], mitad);
  END
END
```

### Ejemplo 4: Algoritmo con REPEAT-UNTIL
```
buscar(A[n], x) BEGIN
  i <- 1;
  REPEAT
    IF (A[i] = x) THEN RETURN i;
    i <- i + 1;
  UNTIL (i > n);
  RETURN -1;
END
```

### Ejemplo 5: Objetos y field access
```
inOrder(raiz) BEGIN
  IF (raiz != NULL) THEN BEGIN
    CALL inOrder(raiz.izquierda);
    CALL print(raiz.valor);
    CALL inOrder(raiz.derecha);
  END
END
```

## Casos no soportados

### Ejemplo 1: Sintaxis Python-like (no existe en la gramática)
```
// Incorrecto: indentación no es bloque en AALIE
IF x > 0:
  RETURN x
```

### Ejemplo 2: For-Each (no existe en la gramática)
```
// Incorrecto: no hay for-each
FOR item IN A DO BEGIN
  PRINT(item);
END
```

### Ejemplo 3: Switch/Case (no existe en la gramática)
```
// Incorrecto: no hay switch
SWITCH (x) BEGIN
  CASE 1: PRINT("uno");
  CASE 2: PRINT("dos");
END
```

## Evidencia desde código o configuración

- **Grammar:** `packages/grammar/grammar/Language.g4` (154 líneas) — contiene todas las reglas de parser y lexer.
- **AST builders:** `packages/grammar/py/src/aa_grammar/ast_builder.py` (Python) y `packages/grammar/src/ts/ast-builder.ts` (TypeScript).
- **Keywords:** Definidos en las líneas 133-147 del `.g4` con fragmentos case-insensitive (líneas 127-131).
- **Operadores:** Líneas 123-125 del `.g4` para asignación, comparación y aritméticos.

## Limitaciones

- La gramática acepta arrays y objetos, pero el nivel de soporte analítico posterior depende del visitor y del método.
- La gramática no documenta por sí sola la cobertura matemática de recurrencias o WHILE.
- No hay soporte para `FOR ... DOWNTO`, `FOR ... STEP`, ni `FOR EACH`.
- No hay tipo de retorno en la cabecera de procedimiento.
- Los comentarios legacy (`►`) no deben enseñarse en la UI.
- `ClassDef` es parseable pero ignorado por todo el pipeline de análisis.

## Archivos relacionados

- `ast-schema.md` — estructura canónica del AST generado
- `analysis-engine-spec.md` — pipeline que consume el AST
- `iterative-analysis-spec.md` — análisis de algoritmos iterativos
- `algorithm-classification-spec.md` — clasificación de algoritmos
- `while-heuristics-spec.md` — cobertura WHILE
- `recurrence-methods-spec.md` — cobertura recursiva
- `../04-api/parse-api.md` — API de parseo
- `../04-api/schemas/parse-schema.md` — schema del request/response
