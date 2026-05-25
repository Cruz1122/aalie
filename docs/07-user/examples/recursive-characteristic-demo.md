# Demo: Fibonacci — Characteristic Equation

**Objetivo:** Demostrar el análisis de una recurrencia lineal mediante ecuación característica. El estudiante debe entender cómo Fibonacci genera T(n) = T(n-1) + T(n-2) + O(1) y cómo se resuelve.

## Pseudocódigo

```pseudocode
fib(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    ELSE BEGIN
        RETURN fib(n - 1) + fib(n - 2);
    END
END
```

## Pasos en UI

1. Ir a `/{locale}/analyzer`.
2. Escribir el pseudocódigo.
3. Hacer clic en **Analyze**.
4. En el selector de métodos, notar que:
   - **Characteristic Equation** es el método recomendado.
   - **Iteration Method** también puede estar disponible.
   - Master Theorem **no** es aplicable (la recurrencia no es de la forma aT(n/b)).
5. Seleccionar **Characteristic Equation** (o aceptar default).
6. Observar los step bundles:
   - Step 1: Recurrencia homogénea: T(n) - T(n-1) - T(n-2) = 0
   - Step 2: Ecuación característica: r² - r - 1 = 0
   - Step 3: Raíces: r₁ = φ (≈1.618), r₂ = -1/φ (≈-0.618)
   - Step 4: Solución general: T(n) = A·φⁿ + B·(-1/φ)ⁿ
   - Step 5: T(n) = Θ(φⁿ) = Θ(2ⁿ)
7. (Opcional) Ver el **Recursion Tree** para visualizar la expansión exponencial.

## Resultado Esperado

- **Método**: Ecuación Característica
- **Recurrencia**: T(n) = T(n-1) + T(n-2) + O(1)
- **Complejidad**: Θ(φⁿ) ≈ Θ(1.618ⁿ) que es O(2ⁿ)
- **Status**: `complete` (o `partial` si no se puede simplificar completamente)

## Qué Explicar al Estudiante

- Fibonacci tiene dos llamadas recursivas, pero no es divide y vencerás: ambas restan (n-1 y n-2) en lugar de dividir.
- La recurrencia es lineal homogénea con coeficientes constantes: se puede resolver con ecuación característica.
- La ecuación r² - r - 1 = 0 tiene raíces reales: φ y -1/φ.
- La solución es exponencial: T(n) = Θ(φⁿ).
- Comparar con merge sort: ambas tienen 2 llamadas, pero una es Θ(n log n) y la otra Θ(2ⁿ). La diferencia está en cómo se reduce el tamaño del problema.
- La ecuación característica solo funciona para recurrencias lineales con coeficientes constantes.

## Error Común

**Error:** El estudiante confunde la función del algoritmo (Fibonacci) con la función de complejidad. Fibonacci(n) = φⁿ/√5, pero la complejidad T(n) también es exponencial porque cada llamada genera 2 subproblemas.
**Corrección:** Distinguir entre el valor de salida del algoritmo y el costo de computarlo.

## Riesgo de Demo

**Riesgo:** Si el backend devuelve `partial` en lugar de `complete`, el estudiante puede pensar que el análisis falló.
**Mitigación:** Explicar que `partial` significa que la solución está incompleta pero aún útil. El engine puede obtener Θ(φⁿ) pero no necesariamente los coeficientes exactos.

## Fallback

Usar `josephus-recursivo` del catálogo. También usa ecuación característica (o iteración) y tiene recursión lineal decreciente.
