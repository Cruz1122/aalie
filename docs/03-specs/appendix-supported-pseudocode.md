# Apéndice: Ejemplos de pseudocódigo soportado

**Tipo:** descriptiva
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/analysis/tests/`, `packages/content-data/examples/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Apéndice B — Pseudocódigo soportado

## Propósito

Colección de ejemplos de pseudocódigo válido que AALIE puede parsear y analizar correctamente. Cada ejemplo incluye una explicación de por qué funciona, qué construcciones gramaticales utiliza y qué resultado produce el análisis.

## Convenciones gramaticales

Todos los ejemplos siguen la gramática AALIE:
- `nombre(params) BEGIN ... END` para definición de algoritmo
- `<-` para asignación
- `;` al final de cada sentencia interna
- `MOD` para módulo, `DIV` para división entera
- `IF (cond) THEN BEGIN ... END` y `ELSE BEGIN ... END`
- `FOR v <- a TO b DO BEGIN ... END` (STEP no soportado)
- `WHILE (cond) DO BEGIN ... END`
- `REPEAT ... UNTIL (cond)`
- `RETURN expr`
- `print(expr)`
- `CALL proc(args)`

---

## 1. Asignación simple y aritmética

```pseudocode
sumaDosNumeros(a, b) BEGIN
    resultado <- a + b;
    RETURN resultado;
END
```

### Explicación
- **Construcciones**: definición de procedimiento con parámetros, asignación, operación aritmética, return.
- **Línea 1 (definición)**: `sumaDosNumeros(a, b) BEGIN` — no se cuenta como línea de costo (es estructural).
- **Línea 2**: `resultado <- a + b` — asignación C_1, costo: 1 (asignación) + 0 (lvalue) + 1 (suma) = 2 ops.
- **Línea 3**: `RETURN resultado` — C_2, costo: 1 (return) + 0 (expr) = 1 op.
- **Resultado**: `T_open = C_1*1 + C_2*1` → Θ(1). Sin loops, sin variabilidad.

---

## 2. FOR loop (lineal)

```pseudocode
sumaArreglo(A[n]) BEGIN
    suma <- 0;
    FOR i <- 1 TO n DO BEGIN
        suma <- suma + A[i];
    END
    RETURN suma;
END
```

### Explicación
- **Construcciones**: FOR loop con límite simbólico `n`.
- **Cabecera FOR**: se evalúa `n + 2` veces (una por cada iteración + una extra para la condición de salida).
- **Cuerpo FOR**: se ejecuta `n` veces (i = 1..n).
- **Línea 2 (suma <- 0)**: C_1, ejecutada 1 vez.
- **Línea 3 (cabecera FOR)**: C_2 · (n+1).
- **Línea 4 (cuerpo)**: suma <- suma + A[i] — C_3 · n. Costo por ejecución: 1 (asignación) + 1 (acceso arreglo A[i]) + 1 (suma) = 3 ops.
- **Línea 6 (RETURN)**: C_4 · 1.
- **Resultado**: `T_open = C_1 + C_2·(n+1) + C_3·n + C_4` → simplifica a `(C_2 + C_3)·n + (C_1 + C_2 + C_4)` → Θ(n). Sin variabilidad (worst = best).

---

## 3. FOR anidados (bubble sort)

```pseudocode
burbuja(A[n]) BEGIN
    FOR i <- 1 TO n DO BEGIN
        FOR j <- 1 TO n-1 DO BEGIN
            IF (A[j] > A[j+1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j+1];
                A[j+1] <- temp;
            END
        END
    END
END
```

### Explicación
- **Construcciones**: FOR anidados, IF con comparación, acceso a arreglo, asignaciones de swap.
- **FOR externo**: i = 1..n, cuerpo ejecutado n veces.
- **FOR interno**: j = 1..n-1, ejecutado n-1 veces por cada iteración externa → n·(n-1) ≈ n² ejecuciones del cuerpo.
- **IF**: guardia evaluado n·(n-1) veces. El THEN se ejecuta condicionalmente (worst case: todas las iteraciones).
- **Resultado worst case**: `T_open = C_1 + C_2·(n+1) + C_3·n·(n) + C_4·n·(n-1) + (C_5 + C_6 + C_7 + C_8)·n·(n-1)` → Θ(n²). Sin variabilidad (worst = best porque no hay early return ni condición asimétrica en el IF que afecte el conteo de líneas).

---

## 4. IF/ELSE con comparación

```pseudocode
maximo(a, b) BEGIN
    IF (a > b) THEN BEGIN
        resultado <- a;
    END ELSE BEGIN
        resultado <- b;
    END
    RETURN resultado;
END
```

### Explicación
- **Construcciones**: IF/ELSE con comparación aritmética.
- **IF guardia**: evaluado siempre 1 vez (C_1).
- **THEN**: ejecutado si a > b. En worst case, se toma la rama de mayor costo (ambas ramas tienen 1 asignación, mismo costo).
- **ELSE**: ejecutado si a <= b.
- **Resultado worst case**: `T_open = C_1 + max(C_2, C_3) + C_4` → Θ(1).
- **Variabilidad**: worst = best (mismo costo en ambas ramas).

---

## 5. WHILE lineal (linear counter)

```pseudocode
busquedaLineal(A[n], x) BEGIN
    i <- 1;
    WHILE (i <= n AND A[i] != x) DO BEGIN
        i <- i + 1;
    END
    RETURN i;
END
```

### Explicación
- **Construcciones**: WHILE con patrón `linear_counter`.
- **Variable de control**: `i` con actualización monótona `i <- i + 1`.
- **Guard**: `i <= n AND A[i] != x` — compuesto, interpretable.
- **Patrón detectado**: `linear_counter` con evidencia strong.
- **Worst case**: `t_while = n` (el elemento no está o está al final). `T_open = C_1 + C_2·(n+1) + C_3·n + C_4` → Θ(n).
- **Best case**: `t_while = 1` (elemento está en primera posición). `T_open = C_1 + C_2·2 + C_3·1 + C_4` → Θ(1).
- **Average case**: (n+1)/2 iteraciones (modelo uniforme). `A(n) = C_1 + C_2·((n+1)/2+1) + C_3·(n+1)/2 + C_4` → Θ(n).
- **Variabilidad**: Sí (worst ≠ best).

---

## 6. WHILE binary search (binary_search_interval)

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

### Explicación
- **Construcciones**: WHILE con patrón `binary_search_interval`.
- **Variable de control**: intervalo `[low, high]` que se reduce a la mitad cada iteración.
- **Patrón detectado**: `binary_search_interval` con evidencia strong.
- **Actualización**: `low <- mid + 1` o `high <- mid - 1`, donde `mid <- (low + high) DIV 2`.
- **Iteraciones**: `t_while = log₂(n) + 1` (worst case, no encontrar el elemento).
- **Resultado worst case**: `T_open = C_1 + C_2 + C_3·(log₂(n)+2) + C_4·(log₂(n)+1) + ...` → Θ(log n).
- **Variabilidad**: Sí, best = Θ(1) (elemento encontrado en la primera comparación).
- **Nota**: La división entera `DIV` es esencial para la corrección del algoritmo.

---

## 7. WHILE Euclidean algorithm (euclid_mod)

```pseudocode
mcd(a, b) BEGIN
    WHILE (b != 0) DO BEGIN
        r <- a MOD b;
        a <- b;
        b <- r;
    END
    RETURN a;
END
```

### Explicación
- **Construcciones**: WHILE con patrón `euclid_mod`.
- **Variable de control**: argumentos `(a, b)` que se transforman por módulo.
- **Patrón detectado**: `euclid_mod` con evidencia strong.
- **Iteraciones**: `t_while = O(log(min(a, b)))` — el módulo reduce el tamaño del segundo argumento al menos a la mitad cada dos iteraciones.
- **Resultado worst case**: `T_open = C_1·(t+1) + C_2·t + C_3·t + C_4·t + C_5` donde `t = O(log(min(a,b)))`.
- **Notación final**: `Θ(log(min(a,b)))`.
- **Nota**: Este ejemplo usa parámetros escalares `a` y `b` sin tamaño de entrada `n`. Los parámetros de tamaño se preservan como símbolos especiales durante la sanitización.

---

## 8. Recursivo: factorial

```pseudocode
factorial(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN n * factorial(n - 1);
END
```

### Explicación
- **Construcciones**: recursión directa con linear shift.
- **Recurrencia**: `T(n) = T(n-1) + Θ(1)`.
- **Familia**: `linear_shift` con `a=1, b=1`.
- **Método aplicable**: iteration (por defecto), characteristic equation.
- **Expansión**: `T(n) = T(n-1) + c = T(n-2) + 2c = ... = T(1) + (n-1)·c = Θ(1) + Θ(n) = Θ(n)`.
- **Resultado**: `Θ(n)` — Resta y Vencerás (a=1, f(n)=Θ(1) → O(n)).
- **Clasificación técnica**: recursive. Clasificación pedagógica: linear_shift (tail recursion).

---

## 9. Recursivo: merge sort

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

### Explicación
- **Construcciones**: recursión con división a la mitad, llamadas recursivas múltiples, llamada a procedimiento auxiliar (`merge`).
- **Recurrencia**: `T(n) = 2·T(n/2) + Θ(n)`.
- **Familia**: `divide_conquer` con `a=2, b=2, f(n)=Θ(n)`.
- **Método por defecto**: Master Theorem (caso 2).
- **Master Theorem**: `log_b(a) = log₂(2) = 1`. `f(n) = Θ(n^1) = Θ(n^log_b(a))` → Caso 2 → `Θ(n·log n)`.
- **Métodos alternativos**: recursion tree (niveles log₂(n)+1, cada nivel costo n → n·log₂(n) + n), iteration.
- **Resultado**: `Θ(n·log n)` — Divide y Vencerás.
- **Nota**: El procedimiento auxiliar `merge` no se analiza recursivamente aquí; se trata como costo simbólico `Θ(n)` dentro de la recurrencia.

---

## 10. Recursivo: Fibonacci

```pseudocode
fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN fibonacci(n - 1) + fibonacci(n - 2);
END
```

### Explicación
- **Construcciones**: recursión múltiple con dos llamadas de diferentes tamaños.
- **Recurrencia**: `T(n) = T(n-1) + T(n-2) + Θ(1)`.
- **Familia**: `linear_shift` con `a=2` (dos ramas, aunque de diferentes tamaños).
- **Método por defecto**: characteristic equation.
- **Ecuación característica**: `r² - r - 1 = 0` → raíces `φ = (1+√5)/2` y `ψ = (1-√5)/2`.
- **Solución homogénea**: `T(n) = A·φⁿ + B·ψⁿ`.
- **Solución particular**: constante (para el Θ(1) no homogéneo).
- **Resultado**: `Θ(φⁿ)` donde `φ ≈ 1.618` — exponencial.
- **Versión con memoization**: `T(n) = T(n-1) + Θ(1)` → `Θ(n)` (DP).

## Archivos relacionados

- `pseudocode-grammar-spec.md`
- `ast-schema.md`
- `analysis-engine-spec.md`
- `iterative-analysis-spec.md`
- `recurrence-methods-spec.md`
- `appendix-while-patterns-examples.md`
- `appendix-recursive-methods-examples.md`
