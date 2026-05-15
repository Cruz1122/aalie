# Demo: Merge Sort — Master Theorem

**Objetivo:** Demostrar el análisis recursivo con Teorema Maestro. El estudiante debe entender cómo la recurrencia T(n) = 2T(n/2) + O(n) se resuelve mediante el caso 2 del Maestro.

## Pseudocódigo

```pseudocode
mergeSort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        medio <- (inicio + fin) DIV 2;
        CALL mergeSort(A, inicio, medio);
        CALL mergeSort(A, medio + 1, fin);
        CALL merge(A, inicio, medio, fin);
    END
    RETURN 0;
END
```

Nota: La función auxiliar `merge` no es necesaria para el análisis de recurrencia, pero debe existir en el código completo. Se puede incluir su definición vacía o real.

## Pasos en UI

1. Ir a `/{locale}/analyzer`.
2. Escribir el pseudocódigo (usar `CALL` para las llamadas recursivas).
3. Hacer clic en **Analyze**.
4. Cuando aparezca el **selector de métodos**, observar que:
   - **Master Theorem** aparece como default (recomendado).
   - **Recursion Tree** y **Iteration Method** también están disponibles.
   - **Characteristic Equation** está atenuado (no aplicable).
5. Aceptar el default (Master Theorem) y hacer clic en **Continue**.
6. Observar los step bundles del Maestro:
   - Step 1: Identificar a=2, b=2, f(n)=n
   - Step 2: Calcular log_b(a) = log_2(2) = 1
   - Step 3: Comparar f(n) = n con n^log_b(a) = n^1
   - Step 4: f(n) = Θ(n^log_b(a)) → Case 2
   - Step 5: T(n) = Θ(n log n)
7. (Opcional) Cambiar a **Recursion Tree** view para ver el árbol de llamadas.

## Resultado Esperado

- **Método**: Teorema Maestro (Caso 2)
- **Recurrencia**: T(n) = 2T(n/2) + n
- **Complejidad**: Θ(n log n)
- **Status**: `complete`

## Qué Explicar al Estudiante

- El Teorema Maestro requiere la forma T(n) = aT(n/b) + f(n).
- Merge Sort tiene a=2 (dos llamadas recursivas), b=2 (división en mitades), f(n)=n (merge lineal).
- log_b(a) = log_2(2) = 1 → n^1 = n.
- f(n) = n = Θ(n^1), por lo tanto es Caso 2.
- El Caso 2 da T(n) = Θ(n^log_b(a) * log n) = Θ(n log n).
- El selector de métodos permite explorar otros métodos para comparar.

## Error Común

**Error:** El estudiante no usa `CALL` para las llamadas recursivas.
**Corrección:** Sin `CALL`, el analizador no detecta recursión y clasifica como `iterative` (incorrectamente). Toda llamada recursiva debe precederse con `CALL`.

## Riesgo de Demo

**Riesgo:** Si el backend no tiene implementado el método seleccionado, puede fallar o devolver `unsupported`.
**Mitigación:** Usar el ejemplo `merge-sort` del catálogo, que está verificado para TM y AR.

## Fallback

Usar `binary-reduction-sum-divide-and-conquer` del catálogo. También usa Master Theorem (a=2, b=2, f(n)=1) y produce Θ(n).
