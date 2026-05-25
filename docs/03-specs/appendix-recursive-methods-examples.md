# Apéndice: Ejemplos de métodos de recurrencia

**Tipo:** descriptiva
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/analysis/analyzers/master_steps.py`, `apps/api/app/modules/analysis/analyzers/iteration_steps.py`, `apps/api/app/modules/analysis/analyzers/recursion_tree_steps.py`, `apps/api/app/modules/analysis/analyzers/characteristic_steps.py`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Apéndice D — Métodos de recurrencia

## Propósito

Para cada método de resolución de recurrencias soportado por AALIE, este apéndice muestra: nombre del método, formas de recurrencia aplicables, pseudocódigo de ejemplo, ecuación de recurrencia, solución paso a paso, y resultado esperado.

---

## 1. Master Theorem — Merge Sort

### Información del método

| Propiedad | Valor |
|-----------|-------|
| **Método** | `master_theorem` |
| **Forma aplicable** | `divide_conquer` (`T(n) = a·T(n/b) + f(n)`) |
| **Familia** | `divide_conquer` |
| **Prioridad** | 1 (por defecto para divide_conquer) |

### Pseudocódigo

```pseudocode
mergesort(A[1]..[n]) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN;
    END
    mid <- n DIV 2;
    CALL mergesort(A[1..mid]);
    CALL mergesort(A[mid+1..n]);
    CALL merge(A[1..n], mid);
END
```

### Recurrencia

```
T(n) = 2·T(n/2) + Θ(n)

  a = 2      (número de subproblemas)
  b = 2      (factor de reducción)
  f(n) = n   (costo de dividir y combinar)
```

### Solución paso a paso

1. **Calcular log_b(a)**: `log₂(2) = 1`.
2. **Comparar f(n) con n^log_b(a)**: `f(n) = n = n¹ = n^log_b(a)`.
3. **Identificar caso**: `f(n) = Θ(n^log_b(a))` → **Caso 2 del Master Theorem**.
4. **Aplicar caso 2**: `T(n) = Θ(n^log_b(a) · log n) = Θ(n · log n)`.
5. **Verificar regularidad** (caso 3 no aplica): No necesaria para caso 2.

### Resultado esperado

```
Θ(n · log n)
```

### Notas

- El procedimiento auxiliar `merge` se trata como costo `Θ(n)` dentro de la recurrencia; no se expande.
- Métodos alternativos aplicables: recursion tree, iteration.

---

## 2. Master Theorem — Binary Search

### Información del método

| Propiedad | Valor |
|-----------|-------|
| **Método** | `master_theorem` |
| **Forma aplicable** | `divide_conquer` |
| **Familia** | `divide_conquer` |
| **Prioridad** | 1 |

### Pseudocódigo

```pseudocode
busquedaBinaria(A[n], x) BEGIN
    low <- 1;
    high <- n;
    WHILE (low <= high) DO BEGIN
        mid <- (low + high) DIV 2;
        IF (A[mid] = x) THEN BEGIN
            RETURN mid;
        END
        IF (A[mid] < x) THEN BEGIN
            low <- mid + 1;
        END ELSE BEGIN
            high <- mid - 1;
        END
    END
    RETURN -1;
END
```

Nota: Binary search es tradicionalmente iterativo (WHILE). Se modela como `divide_conquer` para efectos pedagógicos del Master Theorem; en la práctica el motor lo trata como WHILE `binary_search_interval`.

### Recurrencia

```
T(n) = T(n/2) + Θ(1)

  a = 1      (un solo subproblema)
  b = 2      (factor de reducción)
  f(n) = 1   (costo de comparación)
```

### Solución paso a paso

1. **Calcular log_b(a)**: `log₂(1) = 0`.
2. **Comparar f(n) con n^log_b(a)**: `f(n) = 1 = n⁰ = n^log_b(a)`.
3. **Identificar caso**: `f(n) = Θ(n^log_b(a))` → **Caso 2**.
4. **Aplicar caso 2**: `T(n) = Θ(n^log_b(a) · log n) = Θ(1 · log n) = Θ(log n)`.

### Resultado esperado

```
Θ(log n)
```

---

## 3. Iteration Method — Factorial

### Información del método

| Propiedad | Valor |
|-----------|-------|
| **Método** | `iteration` |
| **Forma aplicable** | `linear_shift`, `divide_conquer` |
| **Familia** | `linear_shift` |
| **Prioridad** | 2 (por defecto para linear_shift) |

### Pseudocódigo

```pseudocode
factorial(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN n * factorial(n - 1);
END
```

### Recurrencia

```
T(n) = T(n-1) + Θ(1)

  Forma: linear_shift (a=1, b=1)
  T(1) = Θ(1)   (caso base)
```

### Solución paso a paso (Iteration Method)

1. **Expandir la recurrencia**:
   ```
   T(n) = T(n-1) + c
   T(n-1) = T(n-2) + c
   T(n-2) = T(n-3) + c
   ```

2. **Sustitución regresiva**:
   ```
   T(n) = T(n-1) + c
        = [T(n-2) + c] + c
        = T(n-2) + 2c
        = [T(n-3) + c] + 2c
        = T(n-3) + 3c
   ```

3. **Detectar el patrón después de k pasos**:
   ```
   T(n) = T(n-k) + k·c
   ```

4. **Aplicar caso base** (cuando `n - k = 1`, es decir `k = n-1`):
   ```
   T(n) = T(1) + (n-1)·c
        = Θ(1) + (n-1)·Θ(1)
   ```

5. **Simplificar**:
   ```
   T(n) = Θ(n)
   ```

### Resultado esperado

```
Θ(n)
```

### Notas

- También aplicable: characteristic equation (ecuación característica de primer orden).
- Es tail recursion: `T(n) = T(n-1) + Θ(1)` es lineal.
- Clasificación pedagógica: `linear_shift` (Resta y Vencerás).

---

## 4. Recursion Tree — T(n) = 3T(n/2) + n

### Información del método

| Propiedad | Valor |
|-----------|-------|
| **Método** | `recursion_tree` |
| **Forma aplicable** | `divide_conquer` |
| **Familia** | `divide_conquer` |
| **Prioridad** | 3 (alternativa pedagógica) |

### Pseudocódigo (ejemplo hipotético)

```pseudocode
algoritmoEjemplo(A[n]) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN A[1];
    END
    CALL algoritmoEjemplo(A[1..n/2]);
    CALL algoritmoEjemplo(A[1..n/2]);
    CALL algoritmoEjemplo(A[1..n/2]);
    PARA i <- 1 TO n DO BEGIN
        suma <- suma + A[i];
    END
    RETURN suma;
END
```

### Recurrencia

```
T(n) = 3·T(n/2) + n

  a = 3      (tres llamadas recursivas)
  b = 2      (mitad del tamaño)
  f(n) = n   (costo de combinar)
```

### Solución paso a paso (Recursion Tree)

1. **Construir el árbol de recurrencia**:
   - **Nivel 0 (raíz)**: costo `n`, se divide en 3 subproblemas de tamaño `n/2`.
   - **Nivel 1**: 3 nodos, cada uno con costo `n/2`. Costo total del nivel: `3 · (n/2) = (3/1)·(n/2)`.
   - **Nivel 2**: `3² = 9` nodos, cada uno con costo `n/4`. Costo total del nivel: `3² · (n/2²) = (3²/2²)·n`.
   - **Nivel k**: `3^k` nodos, cada uno con costo `n/2^k`. Costo total del nivel: `3^k · n/2^k = (3/2)^k · n`.

2. **Número de niveles**: el árbol tiene `log₂(n) + 1` niveles (desde tamaño `n` hasta `1`).

3. **Sumar todos los niveles**:
   ```
   T(n) = n · Σ_{k=0}^{log₂(n)} (3/2)^k
   ```

4. **Identificar serie geométrica**: `r = 3/2 > 1`, por lo que domina el último término.

5. **Cerrar la suma**:
   ```
   T(n) = n · ( (3/2)^{log₂(n)+1} - 1 ) / (3/2 - 1)
        = n · Θ( (3/2)^{log₂(n)} )
        = n · Θ( n^{log₂(3/2)} )
        = Θ( n^{1 + log₂(3) - 1} )
        = Θ( n^{log₂(3)} )
   ```

6. **Simplificar**: `log₂(3) ≈ 1.585`.
   ```
   T(n) = Θ(n^{log₂(3)}) ≈ Θ(n^{1.585})
   ```

### Resultado esperado

```
Θ(n^{log₂(3)}) ≈ Θ(n^{1.585})
```

### Notas

- Master Theorem caso 1: `f(n) = n = O(n^{log₂(3) - ε})` con `ε ≈ 0.585` → `T(n) = Θ(n^{log₂(3)})`.
- La solución por recursion tree es útil pedagógicamente porque muestra visualmente por qué domina el costo de las hojas sobre el costo de combinar.

---

## 5. Characteristic Equation — Fibonacci

### Información del método

| Propiedad | Valor |
|-----------|-------|
| **Método** | `characteristic_equation` |
| **Forma aplicable** | `linear_shift` |
| **Familia** | `linear_shift` |
| **Prioridad** | 2 (cuando iteration no da cierre exacto) |

### Pseudocódigo

```pseudocode
fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN fibonacci(n - 1) + fibonacci(n - 2);
END
```

### Recurrencia

```
T(n) = T(n-1) + T(n-2) + Θ(1)

  Forma: linear_shift con dos ramas de diferente tamaño
  T(0) = Θ(1)   (caso base)
  T(1) = Θ(1)   (caso base)
```

### Solución paso a paso (Characteristic Equation)

1. **Escribir la recurrencia homogénea**: Ignoramos el término no homogéneo `Θ(1)` para la solución homogénea.
   ```
   T(n) - T(n-1) - T(n-2) = 0
   ```

2. **Formar la ecuación característica**: Reemplazamos `T(n-k)` por `r^{n-k}`.
   ```
   r^n - r^{n-1} - r^{n-2} = 0
   r^{n-2} · (r² - r - 1) = 0
   ```
   La ecuación característica es:
   ```
   r² - r - 1 = 0
   ```

3. **Resolver las raíces**:
   ```
   r = [1 ± √(1 + 4)] / 2
   r₁ = (1 + √5) / 2 ≈ 1.618  (φ, razón áurea)
   r₂ = (1 - √5) / 2 ≈ -0.618 (ψ)
   ```

4. **Solución homogénea**:
   ```
   T_h(n) = A · φⁿ + B · ψⁿ
   ```

5. **Solución particular**: Para el término constante `Θ(1)`, proponemos `T_p(n) = C`.
   ```
   C - C - C = 1  →  -C = 1  →  C = -1
   T_p(n) = -1
   ```

6. **Solución general**:
   ```
   T(n) = A · φⁿ + B · ψⁿ - 1
   ```

7. **Aplicar condiciones iniciales**:
   - `T(0) = 1`: `A + B - 1 = 1` → `A + B = 2`
   - `T(1) = 1`: `A·φ + B·ψ - 1 = 1` → `A·φ + B·ψ = 2`

   Resolviendo:
   ```
   A = 2(1 - ψ) / (φ - ψ) = (2 + √5) / √5
   B = 2(φ - 1) / (φ - ψ) = (2 - √5) / √5
   ```

8. **Simplificar asintóticamente**: Como `|φ| > 1` y `|ψ| < 1`, el término `φⁿ` domina.
   ```
   T(n) = Θ(φⁿ) donde φ ≈ 1.618
   ```

### Resultado esperado

```
Θ(φⁿ) ≈ Θ(1.618ⁿ)
```

### Notas

- Versión con memoization (DP): `T(n) = T(n-1) + Θ(1)` → `Θ(n)`.
- El método de iteration también puede aplicarse pero no da cierre exacto para recurrencias de orden superior.
- La ecuación característica es el método por defecto para `linear_shift` cuando `a > 1`.

---

## Resumen de métodos

| # | Método | Pseudocódigo | Recurrencia | Resultado |
|---|--------|-------------|-------------|-----------|
| 1 | Master Theorem (caso 2) | Merge Sort | `T(n)=2T(n/2)+n` | `Θ(n·log n)` |
| 2 | Master Theorem (caso 2) | Binary Search | `T(n)=T(n/2)+1` | `Θ(log n)` |
| 3 | Iteration | Factorial | `T(n)=T(n-1)+1` | `Θ(n)` |
| 4 | Recursion Tree | 3-way split | `T(n)=3T(n/2)+n` | `Θ(n^{log₂(3)})` |
| 5 | Characteristic Equation | Fibonacci | `T(n)=T(n-1)+T(n-2)+1` | `Θ(φⁿ)` |

## Archivos relacionados

- `recurrence-methods-spec.md`
- `appendix-supported-pseudocode.md`
- `analysis-engine-spec.md`
- `../09-decisions/adr-010-deterministic-engine-over-llm-analysis.md`
