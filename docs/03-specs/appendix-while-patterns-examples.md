# Apéndice: Ejemplos de patrones WHILE

**Tipo:** descriptiva
**Estado:** final
**Audiencia:** dev
**Fuente de verdad:** `apps/api/app/modules/analysis/while_engine/patterns/`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** Apéndice C — Patrones WHILE

## Propósito

Catálogo detallado de los 12 patrones WHILE que AALIE puede detectar, con criterios de detección, pseudocódigo de ejemplo, complejidad esperada y nivel de evidencia requerido.

---

## 1. linear_counter

| Propiedad | Valor |
|---|---|
| **Patrón** | `linear_counter` |
| **Clase asintótica** | Θ(n) |
| **Nivel de evidencia requerido** | strong |
| **Orden en `_PATTERNS`** | 7 |

### Criterio de detección
- Variable de control con actualización monótona aditiva (`v <- v + c` o `v <- v - c` donde `c` es constante positiva).
- Guard comparativo con límite (`v < n`, `v <= n`, `v > n`, `v >= n`).
- Dirección de actualización compatible con la condición de salida.

### Pseudocódigo

```pseudocode
busquedaLineal(A[n], x) BEGIN
    i <- 1;
    WHILE (i <= n AND A[i] != x) DO BEGIN
        i <- i + 1;
    END
    RETURN i;
END
```

### Análisis
- Variable de control: `i`
- Actualización: `i <- i + 1` (monótona creciente)
- Guard: `i <= n` (límite superior)
- Total de iteraciones (worst): `t = n`
- Costo por iteración: C_cuerpo (guard + cuerpo)
- Costo total: `C_1 + C_guard·(n+1) + C_cuerpo·n + C_return`
- `T_open = Θ(n)`
- Best case: `t = 1` (elemento en primera posición)

### Variaciones detectadas
- `i <- i - 1` con guard `i >= 1` (decremento)
- `i <- i + 2` con guard `i <= n` (paso constante > 1)
- Guard compuesto con AND/OR

### Evidencia
- `while-heuristics-spec.md` sección 10
- Tests en `apps/api/app/modules/analysis/while_engine/tests/test_linear_counter.py`

---

## 2. geometric_growth

| Propiedad | Valor |
|---|---|
| **Patrón** | `geometric_growth` |
| **Clase asintótica** | Θ(log n) |
| **Nivel de evidencia requerido** | strong |
| **Orden en `_PATTERNS`** | 8 |

### Criterio de detección
- Variable de control con actualización multiplicativa (`v <- v * k` o `v <- v / k` donde `k > 1`).
- Guard comparativo con límite.
- Dirección compatible con la condición de salida.

### Pseudocódigo

```pseudocode
potenciaDos(n) BEGIN
    i <- 1;
    WHILE (i <= n) DO BEGIN
        i <- i * 2;
    END
    RETURN i;
END
```

### Análisis
- Variable de control: `i`
- Actualización: `i <- i * 2` (crecimiento geométrico)
- Guard: `i <= n`
- Iteraciones: `t = ⌊log₂(n)⌋ + 1`
- `T_open = Θ(log n)`

### Variaciones detectadas
- `i <- i * 3`, `i <- i * k` (cualquier base > 1)
- `i <- i / 2` con guard `i >= 1` (decremento geométrico)
- `i <- i * 2` con guard `i < n`

### Evidencia
- Tests en `apps/api/app/modules/analysis/while_engine/tests/test_geometric_growth.py`

---

## 3. binary_search_interval

| Propiedad | Valor |
|---|---|
| **Patrón** | `binary_search_interval` |
| **Clase asintótica** | Θ(log n) |
| **Nivel de evidencia requerido** | strong |
| **Orden en `_PATTERNS`** | 11 |

### Criterio de detección
- Dos variables que definen un intervalo `[low, high]`.
- Actualización tipo `mid <- (low + high) // 2` (o DIV).
- El intervalo se reduce a la mitad en cada iteración.
- Guard del tipo `low <= high`.

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

### Análisis
- Variables de control: `low`, `high` (intervalo)
- Actualización: `low <- mid + 1` o `high <- mid - 1`
- Reducción: el intervalo se reduce a la mitad cada iteración
- Iteraciones (worst): `t = ⌊log₂(n)⌋ + 1`
- `T_open = Θ(log n)`
- Best case: `Θ(1)` (elemento encontrado en mid inicial)

### Variaciones detectadas
- Cálculo de mid con `(low + high) / 2` o `(low + high) DIV 2`
- Cierre de intervalo: `low = mid + 1`, `high = mid - 1`, o `low = mid`, `high = mid`

### Evidencia
- Tests en `apps/api/app/modules/analysis/while_engine/tests/test_binary_search.py`

---

## 4. euclid_mod

| Propiedad | Valor |
|---|---|
| **Patrón** | `euclid_mod` |
| **Clase asintótica** | Θ(log min(a,b)) |
| **Nivel de evidencia requerido** | strong |
| **Orden en `_PATTERNS`** | 10 |

### Criterio de detección
- Operador MOD sobre variables del guard.
- El tamaño del segundo argumento decrece por módulo.
- Guard compara contra cero (`b != 0`).

### Pseudocódigo

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

### Análisis
- Variables de control: `a`, `b`
- Actualización: `r <- a MOD b` → `b <- r` (el nuevo b = a mod b, que es < b)
- Guard: `b != 0`
- Iteraciones: `O(log(min(a, b)))` — el módulo reduce el segundo argumento al menos a la mitad cada dos iteraciones (teorema de Lamé).
- `T_open = Θ(log(min(a, b)))`
- Parámetros `a` y `b` se preservan como símbolos especiales durante sanitización.

### Evidencia
- Tests en `apps/api/app/modules/analysis/while_engine/tests/test_euclid_mod.py`

---

## 5. flag_kill

| Propiedad | Valor |
|---|---|
| **Patrón** | `flag_kill` |
| **Clase asintótica** | O(n) worst, O(1) best |
| **Nivel de evidencia requerido** | strong |
| **Orden en `_PATTERNS`** | 9 |

### Criterio de detección
- Variable booleana en el guard.
- La variable se establece a `false` (o la negación) en el cuerpo del bucle.
- Sin reasignación a `true` en caminos ejecutables después de matarse.

### Pseudocódigo

```pseudocode
burbujaMejorada(A[n]) BEGIN
    swapped <- true;
    WHILE (swapped) DO BEGIN
        swapped <- false;
        FOR i <- 1 TO n-1 DO BEGIN
            IF (A[i] > A[i+1]) THEN BEGIN
                temp <- A[i];
                A[i] <- A[i+1];
                A[i+1] <- temp;
                swapped <- true;
            END
        END
    END
    RETURN;
END
```

### Análisis
- Variable de control: `swapped`
- Actualización: `swapped <- false` al inicio del cuerpo, `swapped <- true` si hay swap.
- Guard: `swapped` (verdadero mientras haya swaps)
- Best case: `t = 1` (arreglo ordenado, sin swaps en primera pasada)
- Worst case: `t = n` (arreglo en orden inverso, cada pasada mueve un elemento)
- Costo por iteración: O(n) (el FOR interno)
- `T_open(worst) = Θ(n²)`
- `T_open(best) = Θ(n)`

### Variaciones detectadas
- `flag <- true` → `flag <- false` en el cuerpo
- Guard `WHILE (flag = true)` o `WHILE (flag)`
- Múltiples banderas (solo la dominante se usa para la cota)

### Evidencia
- Tests en `apps/api/app/modules/analysis/while_engine/tests/test_flag_kill.py`

---

## 6. interval_shrink

| Propiedad | Valor |
|---|---|
| **Patrón** | `interval_shrink` |
| **Clase asintótica** | Θ(n) |
| **Nivel de evidencia requerido** | strong |
| **Orden en `_PATTERNS`** | 12 |

### Criterio de detección
- Una variable de intervalo que se actualiza monótonamente hacia la otra.
- Sin reducción multiplicativa (diferencia de binary_search_interval).
- Guard del tipo `i <= j` o `i < j`.

### Pseudocódigo

```pseudocode
seleccion(A[n]) BEGIN
    i <- 1;
    WHILE (i <= n) DO BEGIN
        min_idx <- i;
        j <- i + 1;
        WHILE (j <= n) DO BEGIN
            IF (A[j] < A[min_idx]) THEN BEGIN
                min_idx <- j;
            END
            j <- j + 1;
        END
        temp <- A[i];
        A[i] <- A[min_idx];
        A[min_idx] <- temp;
        i <- i + 1;
    END
    RETURN;
END
```

### Análisis (WHILE externo)
- Variables de control: `i`, `n`
- Actualización: `i <- i + 1` (monótona creciente hacia n)
- Guard: `i <= n`
- Iteraciones: `t = n`
- El WHILE externo es en realidad un `linear_counter`; el `interval_shrink` se aplica al contexto de intervalo.

### Evidencia
- Tests en `apps/api/app/modules/analysis/while_engine/tests/test_interval_shrink.py`

---

## 7. merge_two_pointers

| Propiedad | Valor |
|---|---|
| **Patrón** | `merge_two_pointers` |
| **Clase asintótica** | Θ(n) |
| **Nivel de evidencia requerido** | strong |
| **Orden en `_PATTERNS`** | 6 |

### Criterio de detección
- Dos índices independientes que avanzan monótonamente en paralelo.
- Guard compuesto típicamente con AND.
- Los índices avanzan en direcciones compatibles.

### Pseudocódigo

```pseudocode
merge(A[n], B[m], C[n+m]) BEGIN
    i <- 1;
    j <- 1;
    k <- 1;
    WHILE (i <= n AND j <= m) DO BEGIN
        IF (A[i] <= B[j]) THEN BEGIN
            C[k] <- A[i];
            i <- i + 1;
        END ELSE BEGIN
            C[k] <- B[j];
            j <- j + 1;
        END
        k <- k + 1;
    END
    WHILE (i <= n) DO BEGIN
        C[k] <- A[i];
        i <- i + 1;
        k <- k + 1;
    END
    WHILE (j <= m) DO BEGIN
        C[k] <- B[j];
        j <- j + 1;
        k <- k + 1;
    END
    RETURN;
END
```

### Análisis (primer WHILE)
- Variables de control: `i`, `j`
- Actualización: `i <- i + 1` o `j <- j + 1` por iteración
- Guard: `i <= n AND j <= m`
- Iteraciones: `t = n + m - 1` (cada iteración consume un elemento)
- `T_open = Θ(n + m)` (lineal en el tamaño total)

### Evidencia
- Tests en `apps/api/app/modules/analysis/while_engine/tests/test_merge_two_pointers.py`

---

## 8. sentinel_scan

| Propiedad | Valor |
|---|---|
| **Patrón** | `sentinel_scan` |
| **Clase asintótica** | Θ(n) |
| **Nivel de evidencia requerido** | medium |
| **Orden en `_PATTERNS`** | 3 |

### Criterio de detección
- Guard con comparación de elemento contra valor.
- Ausencia de índice explícito como variable de control (o índice secundario).
- Búsqueda lineal con centinela.

### Pseudocódigo

```pseudocode
busquedaCentinela(A[n], x) BEGIN
    A[n+1] <- x;
    i <- 1;
    WHILE (A[i] != x) DO BEGIN
        i <- i + 1;
    END
    IF (i <= n) THEN BEGIN
        RETURN i;
    END ELSE BEGIN
        RETURN -1;
    END
END
```

### Análisis
- Guard: `A[i] != x` (comparación de elemento)
- Variable de control implícita: `i`
- Actualización: `i <- i + 1`
- Iteraciones: `t = posición de x + 1` (worst: n+1)
- `T_open = Θ(n)` worst, `Θ(1)` best

### Evidencia
- Tests en `apps/api/app/modules/analysis/while_engine/tests/test_sentinel_scan.py`

---

## 9. shrinking_window_bidirectional

| Propiedad | Valor |
|---|---|
| **Patrón** | `shrinking_window_bidirectional` |
| **Clase asintótica** | Θ(n) |
| **Nivel de evidencia requerido** | strong |
| **Orden en `_PATTERNS`** | 2 |

### Criterio de detección
- Dos índices que convergen desde extremos opuestos.
- Actualizaciones monótonas: izquierda avanza, derecha retrocede.
- Guard del tipo `i <= j` o `i < j`.

### Pseudocódigo (Dutch National Flag - partición)

```pseudocode
particion(A[n], x) BEGIN
    i <- 1;
    j <- n;
    WHILE (i <= j) DO BEGIN
        WHILE (i <= n AND A[i] < x) DO BEGIN
            i <- i + 1;
        END
        WHILE (j >= 1 AND A[j] > x) DO BEGIN
            j <- j - 1;
        END
        IF (i <= j) THEN BEGIN
            temp <- A[i];
            A[i] <- A[j];
            A[j] <- temp;
            i <- i + 1;
            j <- j - 1;
        END
    END
    RETURN;
END
```

### Análisis
- Variables de control: `i` (avanza desde 1), `j` (retrocede desde n)
- Guard: `i <= j`
- Iteraciones totales combinadas: Θ(n) (cada elemento se visita una vez)
- `T_open = Θ(n)`

### Evidencia
- Tests en `apps/api/app/modules/analysis/while_engine/tests/test_shrinking_window.py`

---

## 10. gnome_sort_cursor

| Propiedad | Valor |
|---|---|
| **Patrón** | `gnome_sort_cursor` |
| **Clase asintótica** | O(n²) |
| **Nivel de evidencia requerido** | medium |
| **Orden en `_PATTERNS`** | 1 |

### Criterio de detección
- Cursor que avanza y retrocede condicionalmente tras swap.
- Dos punteros acoplados: uno avanza, el otro retrocede cuando hay intercambio.

### Pseudocódigo

```pseudocode
gnomeSort(A[n]) BEGIN
    i <- 1;
    WHILE (i < n) DO BEGIN
        IF (A[i] > A[i+1]) THEN BEGIN
            temp <- A[i];
            A[i] <- A[i+1];
            A[i+1] <- temp;
            IF (i > 1) THEN BEGIN
                i <- i - 1;
            END
        END ELSE BEGIN
            i <- i + 1;
        END
    END
    RETURN;
END
```

### Análisis
- Variable de control: `i`
- Actualización: avanza `i <- i + 1` si no hay swap, retrocede `i <- i - 1` si hay swap.
- Guard: `i < n`
- Worst case: O(n²) (arreglo en orden inverso, el cursor retrocede n pasos por cada avance)
- Best case: Θ(n) (arreglo ordenado, solo avanza)

### Evidencia
- Tests en `apps/api/app/modules/analysis/while_engine/tests/test_gnome_sort.py`

---

## 11. gap_shrink_then_scan

| Propiedad | Valor |
|---|---|
| **Patrón** | `gap_shrink_then_scan` |
| **Clase asintótica** | O(n²) / O(n log n) |
| **Nivel de evidencia requerido** | medium |
| **Orden en `_PATTERNS`** | 4 |

### Criterio de detección
- Variable `gap` que decrece multiplicativamente (gap <- gap / k).
- Escaneo anidado dentro del gap.
- Comb Sort o Shell Sort externo.

### Pseudocódigo

```pseudocode
combSort(A[n]) BEGIN
    gap <- n;
    swapped <- true;
    WHILE (gap > 1 OR swapped) DO BEGIN
        gap <- max(1, gap DIV 2);
        swapped <- false;
        FOR i <- 1 TO n - gap DO BEGIN
            IF (A[i] > A[i + gap]) THEN BEGIN
                temp <- A[i];
                A[i] <- A[i + gap];
                A[i + gap] <- temp;
                swapped <- true;
            END
        END
    END
    RETURN;
END
```

### Análisis
- Gap decrece geométricamente: `gap, gap/2, gap/4, ..., 1`
- Por cada gap, escaneo O(n)
- Total iteraciones de gap: O(log n)
- `T_open = O(n log n)` (con factor de reducción 2) o `O(n²)` (con factor de reducción mayor)
- La evidencia es medium porque el costo exacto depende del factor de reducción del gap.

### Evidencia
- Tests en `apps/api/app/modules/analysis/while_engine/tests/test_gap_shrink.py`

---

## 12. phase_loop_composition

| Propiedad | Valor |
|---|---|
| **Patrón** | `phase_loop_composition` |
| **Clase asintótica** | O(√n) / O(log n) |
| **Nivel de evidencia requerido** | medium |
| **Orden en `_PATTERNS`** | 5 |

### Criterio de detección
- Dos fases detectables: salto multiplicativo seguido de barrido lineal.
- Jump Search, Exponential Search.

### Pseudocódigo

```pseudocode
jumpSearch(A[n], x) BEGIN
    step <- floor(sqrt(n));
    prev <- 1;
    WHILE (A[min(step, n)] < x) DO BEGIN
        prev <- step + 1;
        step <- step + floor(sqrt(n));
        IF (prev > n) THEN BEGIN
            RETURN -1;
        END
    END
    WHILE (prev <= n AND A[prev] < x) DO BEGIN
        prev <- prev + 1;
    END
    IF (prev <= n AND A[prev] = x) THEN BEGIN
        RETURN prev;
    END
    RETURN -1;
END
```

### Análisis
- Fase 1 (salto): O(√n) iteraciones (saltos de tamaño √n)
- Fase 2 (barrido): O(√n) iteraciones (barrido lineal dentro del bloque)
- `T_open = O(√n)`

### Evidencia
- Tests en `apps/api/app/modules/analysis/while_engine/tests/test_phase_loop.py`

---

## Resumen de patrones

| # | Patrón | Clase | Evidence | Detecta |
|---|---|---|---|---|
| 1 | `linear_counter` | Θ(n) | strong | Contador lineal i ← i ± c |
| 2 | `geometric_growth` | Θ(log n) | strong | Crecimiento i ← i × k |
| 3 | `binary_search_interval` | Θ(log n) | strong | Búsqueda binaria, intervalo [low, high] |
| 4 | `euclid_mod` | Θ(log min) | strong | Algoritmo de Euclides vía MOD |
| 5 | `flag_kill` | O(n)/O(1) | strong | Bandera booleana |
| 6 | `interval_shrink` | Θ(n) | strong | Intervalo lineal |
| 7 | `merge_two_pointers` | Θ(n) | strong | Dos punteros en paralelo |
| 8 | `sentinel_scan` | Θ(n) | medium | Búsqueda con centinela |
| 9 | `shrinking_window_bidirectional` | Θ(n) | strong | Ventana desde extremos |
| 10 | `gnome_sort_cursor` | O(n²) | medium | Cursor que retrocede tras swap |
| 11 | `gap_shrink_then_scan` | O(n²)/O(n log n) | medium | Gap que decrece + escaneo |
| 12 | `phase_loop_composition` | O(√n)/O(log n) | medium | Salto + barrido |

## Archivos relacionados

- `while-heuristics-spec.md`
- `iterative-analysis-spec.md`
- `appendix-supported-pseudocode.md`
