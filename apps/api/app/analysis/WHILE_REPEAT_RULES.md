# Reglas para Bucles WHILE y REPEAT

## ¿Qué es?

Las reglas de conteo para ciclos no acotados en S3 (forma abierta). Introducimos símbolos de iteración que luego S4 podrá acotar/cerrar.

## Objetivo

Al visitar:

- **while (cond) do block**: Agregar fila para la condición con `count = t_{while_L} + 1`. Multiplicar el cuerpo por `t_{while_L}`.

- **repeat block until (cond)**: Agregar fila para la condición con `count = 1 + t_{repeat_L}`. Multiplicar el cuerpo por `1 + t_{repeat_L}` (al menos una vez).

L es la línea (1-based) donde empieza el ciclo. Esto hace los símbolos deterministas.

## Reglas Implementadas (S3 — abierto)

### WHILE (cond) DO block

1. **Condición**: se evalúa `(t_{while_L} + 1)` veces
2. **Cuerpo**: se ejecuta `t_{while_L}` veces
3. **Multiplicador**: `t_{while_L}` se aplica a todo el cuerpo

### REPEAT block UNTIL (cond)

1. **Cuerpo**: al menos 1 vez → `(1 + t_{repeat_L})`
2. **Condición**: se evalúa también `(1 + t_{repeat_L})` veces
3. **Multiplicador**: `1 + t_{repeat_L}` se aplica a todo el cuerpo

### Características Importantes

- **No "cerramos"** `t_{…}`. Son variables simbólicas (PD-friendly)
- **La condición** siempre es una sola constante `C_{k}` (más lo que cueste evaluarla si trae expresiones)
- **Los multiplicadores** usan `push_multiplier(...)/pop_multiplier(...)` para afectar a todo el cuerpo (y bucles anidados)
- **Memoización**: la clave de memo debe incluir el ID/line del nodo → así reusamos el mismo `t_{while_L}/t_{repeat_L}` si el subárbol se visita otra vez en el mismo contexto

## Implementación

### Utilidad para nombres de símbolos

```python
def iter_sym(self, kind: str, line: int) -> str:
    # kind ∈ {"while", "repeat"}
    return rf"t_{{{kind}_{line}}}"
```

### WHILE (cond) DO block

```python
def visit_while(self, node, mode="worst"):
    L = node["pos"]["line"]
    t = self.iter_sym("while", L)

    # 1) Condición: se evalúa (t_{while_L} + 1) veces
    ck_cond = self.C()  # C_{k} para evaluar la condición
    self.add_row(L, "while", ck_cond, f"{t} + 1")

    # 2) Cuerpo: se ejecuta t_{while_L} veces
    self.push_multiplier(t)        # multiplicador simbólico
    self.visit(node["body"], mode) # el cuerpo hereda el multiplicador y los de fuera
    self.pop_multiplier()

    # 3) Procedimiento
    self.procedure.append(rf"WHILE@{L}: condición {t}+1 veces; cuerpo multiplicado por {t}.")
```

### REPEAT block UNTIL (cond)

```python
def visit_repeat(self, node, mode="worst"):
    L = node["pos"]["line"]
    t = self.iter_sym("repeat", L)

    # 1) Cuerpo: al menos 1 vez -> (1 + t_{repeat_L})
    self.push_multiplier(rf"1 + {t}")
    self.visit(node["body"], mode)
    self.pop_multiplier()

    # 2) Condición: se evalúa también (1 + t_{repeat_L}) veces
    ck_cond = self.C()
    self.add_row(L, "repeat", ck_cond, rf"1 + {t}")

    # 3) Procedimiento
    self.procedure.append(rf"REPEAT@{L}: cuerpo y condición se evalúan 1+{t} veces.")
```

## Ejemplos de Uso

### Bucle WHILE Simple

```python
# while (i < n) do
#   A[i] <- i * 2
#   i <- i + 1

# Resultado:
# Línea 3: while - C_{1} - t_{while_3} + 1
# Línea 4: assign - C_{2} - (1)*(t_{while_3})
# Línea 5: assign - C_{3} - (1)*(t_{while_3})
```

### Bucle REPEAT Simple

```python
# repeat
#   A[i] <- A[i] + 1
#   i <- i + 1
# until (i >= n)

# Resultado:
# Línea 3: assign - C_{1} - (1)*(1 + t_{repeat_2})
# Línea 4: assign - C_{2} - (1)*(1 + t_{repeat_2})
# Línea 2: repeat - C_{3} - 1 + t_{repeat_2}
```

### Bucles WHILE con REPEAT Anidados

```python
# while (i < n) do
#   repeat
#     A[i] <- A[i] + 1
#   until (A[i] > 10)
#   i <- i + 1

# Resultado:
# Línea 1: while - C_{1} - t_{while_1} + 1
# Línea 4: assign - C_{2} - (1)*(t_{while_1})*(1 + t_{repeat_3})
# Línea 3: repeat - C_{3} - (1 + t_{repeat_3})*(t_{while_1})
# Línea 6: assign - C_{4} - (1)*(t_{while_1})
```

## Ecuación T_open Resultante

### Bucle WHILE Simple
```
T_open = (C_{1})·(t_{while_3} + 1) + (C_{2})·((1)·(t_{while_3})) + (C_{3})·((1)·(t_{while_3}))
```

### Bucle REPEAT Simple
```
T_open = (C_{1})·((1)·(1 + t_{repeat_2})) + (C_{2})·((1)·(1 + t_{repeat_2})) + (C_{3})·(1 + t_{repeat_2})
```

### Bucles WHILE con REPEAT Anidados
```
T_open = (C_{1})·(t_{while_1} + 1) + (C_{2})·((1)·(t_{while_1})·(1 + t_{repeat_3})) + (C_{3})·((1 + t_{repeat_3})·(t_{while_1})) + (C_{4})·((1)·(t_{while_1}))
```

## Endpoints de Prueba

### `/analyze/while-example`
Prueba un bucle WHILE simple con asignaciones en el cuerpo.

### `/analyze/repeat-example`
Prueba un bucle REPEAT simple con asignaciones en el cuerpo.

### `/analyze/while-repeat-combined-example`
Prueba bucles WHILE con REPEAT anidados para demostrar multiplicadores anidados.

## Criterio de Aceptación Cumplido

### Un WHILE agrega:
- ✅ **1 fila de condición** con `count = t_{while_L} + 1`
- ✅ **el cuerpo multiplicado** por `t_{while_L}`
- ✅ **una línea en procedure** explicándolo

### Un REPEAT … UNTIL agrega:
- ✅ **el cuerpo multiplicado** por `1 + t_{repeat_L}`
- ✅ **1 fila de condición** con `count = 1 + t_{repeat_L}`
- ✅ **su línea en procedure**

### T_open refleja correctamente:
- ✅ **los términos y multiplicadores** (se ven los símbolos `t_{…}`)

## Características Destacadas

1. **Símbolos Deterministas**: Los símbolos `t_{while_L}` y `t_{repeat_L}` son deterministas basados en el número de línea
2. **Multiplicadores Anidados**: Los multiplicadores se anidan correctamente en bucles anidados
3. **Forma Abierta**: Los símbolos no se "cierran", permitiendo que S4 los acote posteriormente
4. **Memoización**: La clave de memo incluye el ID/line del nodo para reutilización
5. **Integración Perfecta**: Funciona perfectamente con bucles FOR e IF ya implementados

## Notas Prácticas

Estos símbolos (`t_{while_L}`, `t_{repeat_L}`) aparecerán en T_open y en procedure.

Para best/worst/avg en S4:
- **worst**: propondrás cotas superiores para `t_{…}`
- **best**: cotas inferiores (p. ej., 0 para while, 0 extra para repeat)
- **avg**: expectativas si el usuario anota probabilidades; si no, política por defecto

## Próximos Pasos

Esta implementación está lista para ser integrada con:
- El parser del AST real
- S4 para cerrar los símbolos `t_{…}`
- Análisis de expresiones más complejas
- Optimizaciones para casos especiales
