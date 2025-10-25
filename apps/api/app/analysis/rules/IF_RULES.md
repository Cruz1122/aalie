# Reglas para Condicionales IF

## ¿Qué es?

La regla para contar un condicional IF en S3 (abierto) bajo peor caso. Separa tres cosas:

1. **Guardia (la condición)**: siempre se evalúa una vez
2. **Rama THEN**: líneas internas, ya multiplicadas por los bucles activos
3. **Rama ELSE (si existe)**: igual que THEN

En peor caso tomamos la rama dominante (la que "cuesta más") y lo dejamos anotado.

## Objetivo

Al visitar un nodo If:

1. **Emitir una fila por la guardia**: `ck="C_{…}"`, `count="1"`
2. **Visitar then y (si existe) else** en snapshots separados, recoger sus filas
3. **En worst**: elegir la rama dominante y añadir sus filas a rows
4. **Registrar en procedure** que se eligió max(then, else) y por qué

## Reglas Implementadas

### Guardia del IF
- **Evaluaciones**: siempre se evalúa **1 vez**
- **Fila generada**: `kind="if"`, `ck="C_{k}"`, `count="1"`

### Ramas THEN y ELSE
- **Snapshot separados**: cada rama se evalúa por separado
- **Multiplicadores respetados**: los multiplicadores de bucles activos se aplican automáticamente
- **Selección de rama dominante**: en modo "worst", se elige la rama con más "peso"

### Heurística de Selección
- **Sin ELSE**: solo se considera THEN
- **Con ELSE**: se compara el número de filas generadas por cada rama
- **Tie-break**: a favor de THEN si hay empate

## Implementación

### Método `visit_if(node, mode)`

```python
def visit_if(self, node, mode="worst"):
    line = node["pos"]["line"]
    
    # 1) Guardia
    ck_guard = self.C()  # -> "C_{k}"
    self.add_row(line, "if", ck_guard, "1")
    
    # Helper para snapshot
    def run_block_to_buffer(block_node):
        start = len(self.rows)
        if block_node:
            self.visit(block_node, mode)
        new_rows = self.rows[start:]
        self.rows = self.rows[:start]
        return new_rows
    
    # 2) THEN y 3) ELSE -> buffers
    then_buf = run_block_to_buffer(node.get("consequent"))
    else_buf = run_block_to_buffer(node.get("alternate"))
    
    # 4) Elegir rama dominante (worst)
    if mode == "worst":
        if not else_buf:
            chosen = then_buf
            annotate = "worst: then (no else)"
        else:
            chosen = then_buf if len(then_buf) >= len(else_buf) else else_buf
            annotate = "worst: max(then, else)"
        
        if chosen:
            chosen[0] = {**chosen[0], "note": annotate}
        self.rows.extend(chosen)
    
    # 5) Procedure
    self.add_procedure_step(
        r"IF: guardia evaluada una vez; en peor caso se toma \max(\text{then}, \text{else})."
    )
```

## Ejemplos de Uso

### IF Simple (sin ELSE)

```python
# if (A[j] <= pivot) then
#   temp <- A[j]
#   A[j] <- A[i]

# Resultado:
# Línea 5: if - C_{1} - 1 - Evaluación de la condición
# Línea 6: assign - C_{2} - 1 - worst: then (no else)
# Línea 7: assign - C_{3} - 1 - Asignación
```

### IF con ELSE

```python
# if (A[i] == target) then
#   found <- true
# else
#   found <- false
#   i <- i + 1

# Resultado:
# Línea 3: if - C_{1} - 1 - Evaluación de la condición
# Línea 6: assign - C_{3} - 1 - worst: max(then, else)
# Línea 7: assign - C_{4} - 1 - Asignación
```

### IF dentro de Bucle FOR

```python
# for j <- izq TO der - 1
#   if (A[j] <= pivot) then
#     temp <- A[j]
#     A[j] <- A[i]
#     i <- i + 1

# Resultado:
# Línea 5: for - C_{1} - ((der) - (1)) - (izq) + 2 - Cabecera del bucle
# Línea 6: if - C_{2} - (1)*(Σ_{j=izq}^{(der) - (1)} 1) - Evaluación de la condición
# Línea 7: assign - C_{3} - (1)*(Σ_{j=izq}^{(der) - (1)} 1) - worst: then (no else)
# Línea 8: assign - C_{4} - (1)*(Σ_{j=izq}^{(der) - (1)} 1) - Asignación
# Línea 9: assign - C_{5} - (1)*(Σ_{j=izq}^{(der) - (1)} 1) - Asignación
```

## Ecuación T_open Resultante

### IF Simple
```
T_open = C_{1}·(1) + C_{2}·(1) + C_{3}·(1)
```

### IF con ELSE
```
T_open = C_{1}·(1) + C_{3}·(1) + C_{4}·(1)
```

### IF dentro de Bucle FOR
```
T_open = C_{1}·((der) - (1)) - (izq) + 2) + C_{2}·((1)·(Σ_{j=izq}^{(der) - (1)} 1)) + C_{3}·((1)·(Σ_{j=izq}^{(der) - (1)} 1)) + C_{4}·((1)·(Σ_{j=izq}^{(der) - (1)} 1)) + C_{5}·((1)·(Σ_{j=izq}^{(der) - (1)} 1))
```

## Endpoints de Prueba

### `/analyze/if-example`
Prueba un condicional IF simple sin ELSE.

### `/analyze/if-with-else-example`
Prueba un condicional IF con ELSE para demostrar la selección de rama dominante.

### `/analyze/for-if-combined-example`
Prueba la combinación de bucles FOR con condicionales IF anidados.

## Criterio de Aceptación Cumplido

✅ **Para un if**:
- ✅ **Hay una fila para la guardia** (`C_{k}`, `count=1`)
- ✅ **En worst, se agrega una sola rama** (dominante) a rows con la nota correspondiente
- ✅ **procedure incluye la línea** "IF: guardia 1 vez; worst = max(then, else)"
- ✅ **Funciona adentro y afuera de bucles** (la multiplicación por bucles se aplica sola)

## Características Destacadas

1. **Snapshots Separados**: Cada rama se evalúa por separado para evitar interferencias
2. **Multiplicadores Preservados**: Los multiplicadores de bucles activos se aplican automáticamente
3. **Selección Inteligente**: Heurística simple pero efectiva para elegir la rama dominante
4. **Anotaciones Claras**: Cada fila tiene notas explicativas sobre la decisión tomada
5. **Integración Perfecta**: Funciona tanto independientemente como dentro de bucles

## Próximos Pasos

Esta implementación está lista para ser extendida con:
- Reglas específicas para bucles `WHILE`
- Análisis de expresiones más complejas
- Optimizaciones para casos especiales
- Modos de análisis adicionales (best, average)
