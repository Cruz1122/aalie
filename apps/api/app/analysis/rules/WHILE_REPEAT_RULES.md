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

- **Análisis de Cierre**: El sistema intenta analizar el cierre del bucle WHILE en todos los modos (best, average, worst)
  - Busca el valor inicial de la variable de control en el contexto padre
  - Identifica la regla de cambio de la variable en el cuerpo
  - Calcula el número de iteraciones cuando es posible
  - Si el análisis es exitoso, usa expresiones concretas en lugar de símbolos
- **Modo Promedio**: Prioriza el uso de probabilidades cuando están disponibles (E[#iteraciones] = 1/p)
  - Si no hay probabilidad disponible, intenta análisis de cierre como fallback
- **Símbolos Iterativos**: Cuando no se puede cerrar el bucle, se usan símbolos `t_{while_L}` o `\bar{t}_{while_L}` (para promedio)
  - Estos símbolos son variables simbólicas no acotadas (PD-friendly)
  - `close_summation` detecta estos símbolos y genera pasos educativos apropiados
  - No se intenta cerrar símbolos iterativos, solo se simplifican algebraicamente
- **La condición** siempre es una sola constante `C_{k}` (más lo que cueste evaluarla si trae expresiones)
- **Los multiplicadores** usan `push_multiplier(...)/pop_multiplier(...)` para afectar a todo el cuerpo (y bucles anidados)
- **Memoización**: la clave de memo debe incluir el ID/line del nodo → así reusamos el mismo `t_{while_L}/t_{repeat_L}` si el subárbol se visita otra vez en el mismo contexto
- **Rastreo de Variables**: El sistema rastrea asignaciones a la variable de control antes del while para determinar el valor inicial

## Implementación

### Utilidad para nombres de símbolos

```python
def iter_sym(self, kind: str, line: int) -> str:
    # kind ∈ {"while", "repeat"}
    return rf"t_{{{kind}_{line}}}"
```

### WHILE (cond) DO block

**Estrategia Unificada**:

1. **Modo Promedio**: 
   - Intentar obtener probabilidad de salida desde `avgModel`
   - Si está disponible: usar E[#iteraciones] = 1/p
   - Si no está disponible: continuar con análisis de cierre

2. **Análisis de Cierre** (todos los modos):
   - Extraer información de la condición (variable, límite, operador)
   - Buscar valor inicial de la variable en el contexto padre
   - Analizar cuerpo para encontrar cambio de la variable
   - Calcular número de iteraciones
   - Si es exitoso: usar expresión concreta (ej: `(i-1) - 0 + 1 = i`)
   - Si falla: usar símbolo iterativo con nota mejorada

3. **Fallback**:
   - Usar símbolo `t_{while_L}` (o `\bar{t}_{while_L}` en promedio)
   - Generar nota explicativa sobre el símbolo iterativo

```python
def visitWhile(self, node, mode="worst", parent_context=None):
    L = node.get("pos", {}).get("line", 0)
    t = self.iter_sym("while", L)
    
    # Paso 1: Intentar probabilidad en modo promedio
    if mode == "avg":
        exit_prob = self._get_while_exit_probability(node)
        if exit_prob:
            # Usar E[#iteraciones] = 1/p
            # ... (código de probabilidad)
            return
    
    # Paso 2: Intentar análisis de cierre (todos los modos)
    closure_info = self._analyze_while_closure(node, parent_context)
    
    if closure_info and closure_info.get("success"):
        # Usar expresión concreta: iterations_expr + 1
        iterations_expr = sympify(closure_info["iterations"])
        cond_count = iterations_expr + Integer(1)
        # ... (código con expresión concreta)
    else:
        # Paso 3: Fallback - usar símbolo iterativo
        t_sym = Symbol(t, real=True)
        cond_count = t_sym + Integer(1)
        # ... (código con símbolo)
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

## Análisis de Cierre de WHILE

El sistema intenta analizar el cierre de bucles WHILE en todos los modos para determinar el número exacto de iteraciones.

### Proceso de Análisis

1. **Extracción de Condición**: Analiza la condición del while para identificar:
   - Variable de control (ej: `j`)
   - Límite de la condición (ej: `0`)
   - Operador de comparación (ej: `>`)

2. **Búsqueda de Valor Inicial**: Busca asignaciones a la variable de control antes del while:
   - Analiza el bloque padre que contiene el while
   - Encuentra la última asignación a la variable antes de la línea del while
   - Extrae el valor de la asignación (ej: `i - 1`)

3. **Análisis del Cuerpo**: Busca cambios a la variable de control en el cuerpo:
   - Identifica asignaciones a la variable (ej: `j <- j - 1`)
   - Determina la regla de cambio (operador y constante)

4. **Cálculo de Iteraciones**: Calcula el número de iteraciones basándose en:
   - Valor inicial de la variable
   - Regla de cambio
   - Límite de la condición
   - Operador de comparación

### Ejemplo: Insertion Sort

```pseudocode
FOR i <- 2 TO n DO BEGIN
    clave <- A[i];
    j <- i - 1;                    # Valor inicial: j = i - 1
    WHILE (j > 0 AND A[j] > clave) DO BEGIN
        A[j + 1] <- A[j];
        j <- j - 1;                # Cambio: j decrementa en 1
    END
END
```

**Análisis**:
- Variable de control: `j`
- Valor inicial: `i - 1` (encontrado en el bloque padre)
- Cambio: `j <- j - 1` (decrementa en 1)
- Límite: `0`
- Operador: `>`
- Iteraciones: `(i - 1) - 0 = i - 1` (en el peor caso)

### Manejo de Símbolos Iterativos

Cuando el análisis de cierre falla (por ejemplo, condiciones complejas con AND/OR que dependen de datos), el sistema usa símbolos iterativos:

- **Best/Worst**: `t_{while_L}` - Variable iterativa no acotada
- **Average**: `\bar{t}_{while_L}` - Esperanza de número de iteraciones

El sistema `close_summation` detecta estos símbolos y:
- No intenta cerrarlos (son variables simbólicas válidas)
- Genera pasos educativos explicando qué representan
- Simplifica algebraicamente (ej: `t + 1`, `2*t`)
- Indica que requieren análisis adicional para acotar

## Notas Prácticas

### Cuando se Usa Expresión Concreta

- El análisis de cierre es exitoso
- Se encuentra valor inicial de la variable
- Se identifica la regla de cambio
- Se puede calcular el número de iteraciones

**Ejemplo**: `(i - 1) + 1` para la condición del while en insertion sort

### Cuando se Usa Símbolo Iterativo

- El análisis de cierre falla
- No se puede determinar el valor inicial
- La condición es demasiado compleja
- La regla de cambio no es determinística

**Ejemplo**: `t_{while_327} + 1` para condiciones complejas

### Consistencia entre Modos

- **Best/Worst/Average**: Todos intentan el análisis de cierre
- **Average**: Prioriza probabilidad si está disponible, pero puede usar análisis de cierre como fallback
- **Presentación**: Mismo tipo de información cuando el análisis de cierre funciona

Para best/worst/avg en S4:
- **worst**: propondrás cotas superiores para `t_{…}`
- **best**: cotas inferiores (p. ej., 0 para while, 0 extra para repeat)
- **avg**: expectativas si el usuario anota probabilidades; si no, política por defecto o análisis de cierre

## Próximos Pasos

Esta implementación está lista para ser integrada con:
- El parser del AST real
- S4 para cerrar los símbolos `t_{…}`
- Análisis de expresiones más complejas
- Optimizaciones para casos especiales
