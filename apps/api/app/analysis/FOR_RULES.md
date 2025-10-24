# Reglas para Bucles FOR

## ¿Qué es?

La primera regla "real" de conteo. Implementa cómo se contabiliza un bucle FOR según la guía y cómo multiplica al cuerpo del bucle. Deja todo en forma abierta (con sumatorias) para que S4 pueda cerrar.

## Objetivo

Al visitar un nodo For, emitir:

1. **Una fila para la cabecera del for** (evaluación de la condición/actualización)
2. **Un multiplicador (sumatoria)** que afecte a todas las líneas dentro del bucle
3. **Pasos en procedure** explicando la decisión

## Reglas Implementadas

### Cabecera del FOR
- Se evalúa **(b − a + 2)** veces
- Donde `a` es el valor inicial y `b` es el valor final
- Se agrega una fila con `kind="for"`

### Cuerpo del FOR
- Se ejecuta **(b − a + 1)** veces
- Para mantener estructura de anidación y dependencias, se representa como sumatoria:
  ```
  Σ_{v = a}^{b} 1
  ```
- Si `a` o `b` dependen de un índice exterior, la sumatoria se anida naturalmente

### Nota Importante
Aunque `(b−a+1)` y `Σ 1` son equivalentes, usar `Σ` preserva la forma triangular en bucles anidados y evita perder dependencia de índices.

## Implementación

### Método `visit_for(node, mode)`

```python
def visit_for(self, node, mode="worst"):
    # Extraer información del nodo
    line = node["pos"]["line"]
    v = node["var"]                       # p.ej., "j"
    a = self._expr_to_str(node["start"])  # p.ej., "izq"
    b = self._expr_to_str(node["end"])    # p.ej., "der - 1"

    # 1) Cabecera (b - a + 2)
    ck_header = self.C()  # devuelve "C_{k}" siguiente
    header_count = f"({b}) - ({a}) + 2"
    self.add_row(line, "for", ck_header, header_count)

    # 2) Multiplicador del cuerpo: Σ_{v=a}^{b} 1
    mult = f"\\sum_{{{v}={a}}}^{{{b}}} 1"
    self.push_multiplier(mult)
    self.visit(node["body"], mode)  # aquí se multiplican las filas internas
    self.pop_multiplier()

    # 3) Procedure (pasos explicativos)
    self.add_procedure_step(rf"En \textbf{{for}}\, {v}={a}\ldots{b}, cabecera: ({b})-({a})+2.")
    self.add_procedure_step(rf"Cuerpo multiplicado por \sum_{{{v}={a}}}^{{{b}}} 1.")
```

## Ejemplos de Uso

### Bucle FOR Simple

```python
# for j <- izq TO der - 1
#   A[j] <- A[i]

# Resultado:
# Línea 5: for - C_{1} - ((der) - (1)) - (izq) + 2
# Línea 6: assign - C_{2} - (1)*(\sum_{j=izq}^{(der) - (1)} 1)
```

### Bucles FOR Anidados

```python
# for i <- 1 TO n
#   for j <- 1 TO m
#     A[i][j] <- i * j

# Resultado:
# Línea 1: for - C_{1} - (n) - (1) + 2
# Línea 2: for - C_{2} - ((m) - (1) + 2)*(\sum_{i=1}^{n} 1)
# Línea 3: assign - C_{3} - (1)*(\sum_{i=1}^{n} 1)*(\sum_{j=1}^{m} 1)
```

## Ecuación T_open Resultante

Para un bucle FOR simple:
```
T_open = C_{1}·((b) - (a) + 2) + C_{2}·((1)·(Σ_{v=a}^{b} 1))
```

Para bucles FOR anidados:
```
T_open = C_{1}·((n) - (1) + 2) + C_{2}·(((m) - (1) + 2)·(Σ_{i=1}^{n} 1)) + C_{3}·((1)·(Σ_{i=1}^{n} 1)·(Σ_{j=1}^{m} 1))
```

## Endpoints de Prueba

### `/analyze/for-example`
Prueba un bucle FOR simple con asignaciones en el cuerpo.

### `/analyze/nested-for-example`
Prueba bucles FOR anidados para demostrar sumatorias anidadas.

## Criterio de Aceptación Cumplido

✅ **Al pasar un AST con un for**, el analizador:
- ✅ Agrega una fila de cabecera con `(b-a+2)`
- ✅ Multiplica el cuerpo por `Σ_{v=a}^{b} 1`
- ✅ Actualiza procedure con los dos pasos
- ✅ T_open refleja ambos términos correctamente

## Próximos Pasos

Esta implementación está lista para ser extendida con:
- Reglas específicas para condicionales `IF`
- Reglas específicas para bucles `WHILE`
- Análisis de expresiones más complejas
- Optimizaciones para casos especiales
