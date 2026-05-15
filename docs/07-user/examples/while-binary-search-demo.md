# Demo: WHILE Binary Search Pattern

**Objetivo:** Demostrar el análisis de un WHILE con patrón de búsqueda binaria (reducción geométrica) y cómo el analizador identifica correctamente O(log n).

## Pseudocódigo

```pseudocode
binarySearchIter(A[n], n, x) BEGIN
    izq <- 1;
    der <- n;
    WHILE (izq <= der) DO BEGIN
        mitad <- (izq + der) DIV 2;
        IF (A[mitad] = x) THEN BEGIN
            RETURN mitad;
        END
        IF (x < A[mitad]) THEN BEGIN
            der <- mitad - 1;
        END
        ELSE BEGIN
            izq <- mitad + 1;
        END
    END
    RETURN -1;
END
```

## Pasos en UI

1. Ir a `/{locale}/analyzer`.
2. Escribir el pseudocódigo.
3. Hacer clic en **Analyze**.
4. Observar:
   - **Clasificación**: `iterative`
   - **Evidence Level**: "Binary Search" pattern, confianza `high`.
   - **Complejidad**: O(log n), Ω(1), Θ(log n).
5. Hacer clic en el snippet de evidencia para ver qué línea del código disparó el patrón.
6. (Opcional) Usar el **Trace** para simular con `n=10` y ver cómo el rango se reduce a la mitad en cada paso.

## Resultado Esperado

- **Clasificación**: Iterative (WHILE pattern: binary search)
- **Complejidad peor caso**: O(log n)
- **Complejidad mejor caso**: Ω(1) — el elemento está justo en la mitad
- **Complejidad promedio**: O(log n)

## Qué Explicar al Estudiante

- El analizador detecta que `mitad <- (izq + der) DIV 2` es un punto medio y que `der <- mitad - 1` e `izq <- mitad + 1` reducen el rango.
- El patrón "binary search" se reconoce por la combinación de: punto medio + reducción de rango + acceso indexado.
- WHILE con reducción geométrica produce O(log n), a diferencia del WHILE con contador lineal que produce O(n).
- La variabilidad de casos existe: mejor caso Ω(1), peor caso O(log n).

## Error Común

**Error:** El estudiante escribe `DIV 2` como `/ 2`.
**Corrección:** AALIE usa `DIV` para división entera. Para este algoritmo es importante porque los índices deben ser enteros.

## Riesgo de Demo

**Riesgo:** Si se escribe el código con errores de sintaxis (ej. falta `BEGIN`/`END` en el ELSE), el análisis falla en la etapa de parseo.
**Mitigación:** Usar el código exacto del ejemplo `binary-search-iterativa` del catálogo. Verificar que el código pegue correctamente.

## Fallback

Usar el ejemplo `ternary-search-iterativo` del catálogo. También usa WHILE con división en tercios y muestra O(log₃ n).
