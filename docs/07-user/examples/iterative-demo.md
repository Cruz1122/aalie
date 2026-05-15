# Demo: Simple FOR Loop Analysis

**Objetivo:** Demostrar el análisis de un algoritmo iterativo con un único bucle FOR. El estudiante debe comprender la relación entre el número de iteraciones y la complejidad lineal.

## Pseudocódigo

```pseudocode
sumaArreglo(A[n], n) BEGIN
    suma <- 0;
    FOR i <- 1 TO n DO BEGIN
        suma <- suma + A[i];
    END
    RETURN suma;
END
```

## Pasos en UI

1. Ir a `/{locale}/analyzer`.
2. Escribir el pseudocódigo en el editor Monaco.
3. Verificar que no haya errores de sintaxis (subrayados rojos).
4. Hacer clic en **Analyze**.
5. Observar el panel de resultados:
   - **Clasificación**: `iterative`
   - **T(n)**: ecuación de eficiencia (ej. T(n) = 3n + 5)
   - **T_polynomial**: forma agrupada (ej. 3n + 5)
   - **Big O**: `O(n)`
   - **Big Ω**: `Ω(n)`
   - **Big Θ**: `Θ(n)`
6. Hacer clic en **View Procedure** para ver el desglose paso a paso de la suma de costos.
7. Hacer clic en una línea de la tabla **By-Line Costs** para ver el detalle de esa línea.

## Resultado Esperado

- **Clasificación**: Iterative
- **Complejidad**: O(n)
- **T(n)**: `T(n) = 1 + 3(n+1) + 2n + 1` → `3n + 5`
- **Por línea**:
  | Línea | Costo ck | Conteo | Operaciones |
  |-------|----------|--------|-------------|
  | suma <- 0 | 1 | 1 | 1 |
  | FOR i <- 1 TO n | 3 | n+1 | 3(n+1) |
  | suma <- suma + A[i] | 2 | n | 2n |
  | RETURN suma | 1 | 1 | 1 |

## Qué Explicar al Estudiante

- El bucle FOR tiene un costo de cabecera (inicialización, comparación, incremento) que se ejecuta `n+1` veces.
- El cuerpo del bucle se ejecuta `n` veces.
- La suma de costos produce T(n) = 3n + 5, que es O(n).
- El RETURN y la asignación inicial son costos constantes (O(1)).
- La notación Θ(n) es posible porque el peor caso y el mejor caso son iguales (no hay variabilidad).

## Error Común

**Error:** El estudiante cree que la cabecera del FOR se ejecuta `n` veces.
**Corrección:** La cabecera incluye la inicialización (1 vez), la comparación (`n+1` veces: `n` exitosas + 1 fallida) y el incremento (`n` veces). Total: `1 + (n+1) + n = 2n+2` pero el analizador puede simplificarlo a `3(n+1)` si agrupa de otra forma.

## Riesgo de Demo

**Riesgo:** Si el backend no está corriendo, el análisis falla con un error de red.
**Mitigación:** Verificar que `http://localhost:8000/health` responda OK antes de la demo.

## Fallback

Si el análisis falla, se puede usar el código de demostración en `docs/07-user/examples/example_fibonacci_iterative.txt` que también es iterativo. Alternativamente, mostrar capturas de pantalla de un análisis exitoso.
