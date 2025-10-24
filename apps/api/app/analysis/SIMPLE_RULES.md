# Reglas para Líneas "Simples"

## ¿Qué es?

Cubre lo que no es estructura de control: asignaciones, accesos/indexaciones, aritmética, llamadas, return y declaraciones.

La idea es descomponer la línea en operaciones elementales y asignar constantes C_{k} (con el generador ya implementado), sumándolas en el orden en que se visitan. El conteo por línea es 1 y luego se multiplica por el contexto de bucles (lo hace BaseAnalyzer.add_row).

## Reglas Implementadas

### 1) Asignación target <- expr

Emite 1 fila `kind="assign"`.

**ck** = suma de constantes por cada operación encontrada al caminar target y expr:

- **visitar target**:
  - si es un índice `A[i]` → pedir `C()` y sumarlo
  - si es acceso a campo `x.f` → pedir `C()` y sumarlo

- **visitar expr recursivamente**:
  - llamada en RHS → pedir `C()` (llamada) y seguir visitando args
  - índice/campo en RHS → pedir `C()` por cada acceso
  - operador aritmético `+,-,*,/,div,mod` → pedir `C()` por cada operación binaria/unaria visitada

- Al final de la visita, pedir una constante para la asignación misma y sumarla

**count** = "1" (el loop_stack multiplicará si procede)

### 2) Llamada como sentencia CALL f(args) o call-expr f(args)

**Sentencia**: emitir 1 fila `kind="call"`, ck = una constante para la llamada, más las constantes resultantes de visitar cada arg (por si hay índices/aritmética en los argumentos).

**Expresión**: no emite fila propia; devuelve su costo acumulado al contexto (por ejemplo en RHS de una asignación), y se incluirá en el ck de esa fila.

### 3) return expr

Emitir 1 fila `kind="return"`.

**ck** = (coste de visitar expr) + una constante extra para el return.

**count** = "1".

### 4) Declaración de vector local (si existe en tu AST como Decl/declVectorStmt)

Emitir 1 fila `kind="decl"`, ck = una constante.

Si la declaración incluye tamaños con expresiones (p. ej., `B[i+1]`), visita la expresión y suma esas constantes.

### 5) Otras líneas "simples"

Si aparece una línea sin categoría clara, usa `kind="other"`, ck = una constante (y anota en note qué fue).

## Implementación

### Visitantes de alto nivel

```python
def visit_assign(self, node, mode="worst"):
    line = node["pos"]["line"]
    ck_terms = []

    # target (p.ej., A[i] o x.f)
    ck_terms += self._cost_of_lvalue(node["target"])

    # expr (recorre y collecciona constantes)
    ck_terms += self._cost_of_expr(node["value"])

    # constante de la propia asignación
    ck_terms.append(self.C())  # -> "C_{k}"

    ck = " + ".join(ck_terms)
    self.add_row(line, "assign", ck, "1")

def visit_call_stmt(self, node, mode="worst"):
    line = node["pos"]["line"]
    ck_terms = [ self.C() ]  # costo de la llamada
    for arg in node.get("args", []):
        ck_terms += self._cost_of_expr(arg)
    ck = " + ".join(ck_terms)
    self.add_row(line, "call", ck, "1")

def visit_return(self, node, mode="worst"):
    line = node["pos"]["line"]
    ck_terms = self._cost_of_expr(node["value"])
    ck_terms.append(self.C())  # costo del return
    self.add_row(line, "return", " + ".join(ck_terms), "1")
```

### Utilidades para descomponer expresiones

```python
def _cost_of_lvalue(self, lv) -> list[str]:
    terms = []
    t = lv
    # ID simple: no agrega nada
    if t["type"] == "Index":
        # A[i] o anidado
        terms.append(self.C())  # costo de indexación
        terms += self._cost_of_expr(t["index"])
        terms += self._cost_of_lvalue(t["target"]) if t["target"]["type"] in ("Index","Field") else []
    elif t["type"] == "Field":
        terms.append(self.C())  # costo de acceso a campo
        terms += self._cost_of_lvalue(t["target"]) if t["target"]["type"] in ("Index","Field") else []
    return terms

def _cost_of_expr(self, e) -> list[str]:
    if e is None:
        return []
    t = e["type"]
    if t in ("Literal","Identifier","TRUE","FALSE","NULL"):
        return []
    if t == "Index":
        # costo del acceso + coste de evaluar índice + objetivo si anidado
        return [ self.C() ] + self._cost_of_expr(e["index"]) + \
               (self._cost_of_expr(e["target"]) if e["target"]["type"] == "Index" else [])
    if t == "Field":
        return [ self.C() ] + self._cost_of_expr(e["target"])
    if t == "Binary":
        # visita izquierda, derecha y agrega costo de la operación
        return self._cost_of_expr(e["left"]) + self._cost_of_expr(e["right"]) + [ self.C() ]
    if t == "Unary":
        return self._cost_of_expr(e["arg"]) + [ self.C() ]
    if t == "Call":
        # costo de la llamada + args
        terms = [ self.C() ]
        for a in e.get("args", []):
            terms += self._cost_of_expr(a)
        return terms
    # otros tipos
    return [ self.C() ]  # fallback prudente
```

## Ejemplos de Uso

### Asignaciones Simples

```python
# pivot <- A[der]
# i <- izq - 1
# temp <- A[j]
# A[j] <- A[i]
# A[i] <- temp

# Resultado:
# Línea 1: assign - C_{1} + C_{2} - 1
# Línea 2: assign - C_{3} + C_{4} - 1
# Línea 3: assign - C_{5} + C_{6} - 1
# Línea 4: assign - C_{7} + C_{8} + C_{9} - 1
# Línea 5: assign - C_{10} + C_{11} - 1
```

### Llamadas a Función

```python
# CALL swap(A, i, j)
# CALL partition(A, izq, der)

# Resultado:
# Línea 1: call - C_{1} - 1
# Línea 2: call - C_{2} - 1
```

### Returns

```python
# return i
# return A[i] + 1

# Resultado:
# Línea 1: return - C_{1} - 1
# Línea 2: return - C_{2} + C_{3} + C_{4} - 1
```

## Ecuación T_open Resultante

### Asignaciones Simples
```
T_open = (C_{1} + C_{2})·(1) + (C_{3} + C_{4})·(1) + (C_{5} + C_{6})·(1) + (C_{7} + C_{8} + C_{9})·(1) + (C_{10} + C_{11})·(1)
```

### Llamadas a Función
```
T_open = (C_{1})·(1) + (C_{2})·(1)
```

### Returns
```
T_open = (C_{1})·(1) + (C_{2} + C_{3} + C_{4})·(1)
```

## Endpoints de Prueba

### `/analyze/simple-example`
Prueba asignaciones simples con diferentes tipos de expresiones.

### `/analyze/call-example`
Prueba llamadas a función como sentencias.

### `/analyze/return-example`
Prueba statements de return con diferentes tipos de expresiones.

## Criterio de Aceptación Cumplido

✅ **Para un archivo sin estructuras de control**, el motor produce la tabla completa y un T_open correcto.

✅ **En presencia de FOR/IF ya implementados**, estas líneas aparecen multiplicadas por el loop_stack cuando corresponda.

✅ **El procedimiento lista** en lenguaje claro cómo se descompone cada tipo de línea.

## Características Destacadas

1. **Descomposición Automática**: Cada expresión se descompone automáticamente en operaciones elementales
2. **Costo Determinista**: El orden de visita izquierda→derecha da un ck determinista
3. **Integración Perfecta**: Funciona perfectamente con bucles FOR e IF ya implementados
4. **Fallback Prudente**: Para tipos desconocidos, asigna una constante por seguridad
5. **Costo Acumulativo**: Las constantes se suman en el orden de visita

## Qué verás en tu quicksort

- `pivot <- A[der]` → una fila assign con ck ≈ `C_{a}` (index) + `C_{b}` (assign)
- `i <- izq - 1` → `C_{a}` (aritmética) + `C_{b}` (assign)
- Swaps dentro del IF → varias filas assign con combinaciones de indexaciones y asignaciones

No cambias nada de FOR/IF: estas reglas complementan lo que ya contamos.

## Próximos Pasos

Esta implementación está lista para ser integrada con:
- El parser del AST real
- Reglas específicas para bucles `WHILE`
- Análisis de expresiones más complejas
- Optimizaciones para casos especiales
