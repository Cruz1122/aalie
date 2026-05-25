# Demo: WHILE Loop with Linear Counter

**Objetivo:** Demostrar cómo el analizador reconoce un patrón de WHILE con contador lineal y cómo muestra el nivel de evidencia.

## Pseudocódigo

```pseudocode
linearSearch(A[n], n, x) BEGIN
    i <- 1;
    WHILE (i <= n AND A[i] != x) DO BEGIN
        i <- i + 1;
    END
    IF (i <= n) THEN BEGIN
        RETURN i;
    END
    RETURN -1;
END
```

## Pasos en UI

1. Ir a `/{locale}/analyzer`.
2. Escribir el pseudocódigo.
3. Hacer clic en **Analyze**.
4. Observar la clasificación: `iterative`.
5. En la sección de WHILE, ver el **Evidence Level**:
   - Debe mostrar "Linear Counter" o similar.
   - Nivel de confianza: `high` (patrón reconocido).
6. Revisar que el resultado muestra O(n).
7. Hacer clic en **View Procedure** para ver cómo el analizador modeló el WHILE.

## Resultado Esperado

- **Clasificación**: Iterative (WHILE pattern: linear counter)
- **Complejidad peor caso**: O(n) — el elemento no está o está al final
- **Complejidad mejor caso**: Ω(1) — el elemento está en la primera posición
- **Variabilidad de casos**: true (mejor caso ≠ peor caso)

## Qué Explicar al Estudiante

- El WHILE se analiza mediante reconocimiento de patrones, no mediante sumas cerradas como el FOR.
- El analizador detecta que `i` aumenta linealmente (i <- i + 1) y la condición depende de `i`.
- El patrón "linear counter" produce complejidad O(n) con alta confianza.
- Hay variabilidad de casos: el mejor caso es Ω(1) (encuentra al inicio), el peor es O(n) (no encuentra o está al final).
- La evidencia se muestra como un snippet del código que justifica la decisión.

## Error Común

**Error:** El estudiante escribe `i = i + 1` en lugar de `i <- i + 1`.
**Corrección:** En la gramática de AALIE, la asignación usa `<-`, no `=`. El `=` solo se usa en condiciones.

## Riesgo de Demo

**Riesgo:** El analizador podría no reconocer el patrón si la condición del WHILE es muy compleja (ej. múltiples condiciones con AND/OR anidados).
**Mitigación:** Usar la versión simplificada del ejemplo `linear-search` del catálogo de ejemplos, que está verificado como contractual.

## Fallback

Cargar `binary-search-iterativa` del catálogo de ejemplos (categoría `iterative`). También usa WHILE pero con patrón de búsqueda binaria (O(log n)). Sirve para mostrar otro patrón reconocido.
