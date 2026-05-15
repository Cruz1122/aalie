# Oráculos de algoritmos

**Tipo:** normativa
**Estado:** final
**Audiencia:** dev | evaluador
**Fuente de verdad:** `apps/api/tests/contract/oracles/`, `apps/api/tests/_shared/helpers/analysis_oracle.py`
**Última revisión:** 2026-05-18
**Relacionado con informe técnico:** oráculos, testing-strategy, benchmarking

## Propósito

Centralizar los algoritmos de referencia y sus expectativas oficiales. Cada oráculo valida que el motor produce el resultado semántico correcto para un algoritmo dado, no solo que no explota.

## Alcance

Aplica a suites `component`, `contract` y `system`. Los oráculos viven en `tests/contract/oracles/` (15 archivos).

## Tabla de oráculos

| ID | Algoritmo | Familia | Pseudocódigo (esencia) | Expected | Tipo de validación | Test |
|---|---|---|---|---|---|---|
| ITR-01 | `linear_search` | FOR loop linear | `FOR i ← 1 TO n DO IF A[i]=x THEN RETURN i` | worst=Θ(n), best=Θ(1), avg=Θ(n) | equivalencia simbólica (clase asintótica) | `test_iterative_oracles.py::test_iterative_oracle_algorithms` |
| ITR-02 | `bubble_sort` | FOR nested loops | `FOR i←1 TO n-1 DO FOR j←1 TO n-i DO IF A[j]>A[j+1] THEN swap` | worst=Θ(n²), best=Θ(n²), avg=Θ(n²) | equivalencia simbólica (clase asintótica) | `test_algorithms.py::test_bubble_sort_quadratic_worst` |
| ITR-03 | `insertion_sort` | IF worst/best case | `FOR i←2 TO n DO key←A[i]; j←i-1; WHILE j≥1 AND A[j]>key DO A[j+1]←A[j]` | worst=Θ(n²), best=Θ(n), avg=Θ(n²) | equivalencia simbólica (worst/best/avg distintas) | `test_algorithms.py::test_insertion_sort_quadratic_worst` |
| WHL-01 | `while_linear` (counter) | WHILE linear counter | `i←0; WHILE i<n DO i←i+1` | worst=Θ(n), best=Θ(n), avg=Θ(n) | equivalencia simbólica + pattern `linear_counter` | `test_while_oracles.py::test_while_oracle_algorithms` |
| WHL-02 | `while_log` (geometric) | WHILE geometric growth | `i←1; WHILE i≤n DO i←i*2` | worst=Θ(log n), best=Θ(log n), avg=Θ(log n) | equivalencia simbólica + pattern `linear_counter` | `test_while_oracles.py::test_while_oracle_algorithms` |
| WHL-03 | `euclides` (MCD) | WHILE Euclidean algorithm | `WHILE b≠0 DO temp←b; b←a MOD b; a←temp` | worst=Θ(log(min(a,b))), best=Θ(log(min(a,b))), avg=Θ(log(min(a,b))) | equivalencia simbólica + notación específica | `test_while_algorithms.py::test_euclides_specific_notation` |
| WHL-04 | `binarySearch` | WHILE binary search | `WHILE low≤high DO mid←(low+high)/2; IF A[mid]=x THEN RETURN; low←mid+1 / high←mid-1` | worst=Θ(log n) | pattern `binary_search_interval` + notación exacta | `test_while_oracle_matrix.py::test_while_oracle_matrix_contract_and_class` |
| WHL-05 | `ambiguous_updates` | WHILE non-conclusive | `WHILE i<n DO IF i MOD 2=0 THEN i←i+1 ELSE i←i*2` | status=`unbounded`, big_theta=`\infty` | estado contractual `unbounded` | `test_while_oracle_matrix.py::test_while_oracle_matrix_contract_and_class` |
| REC-01 | `mergeSort` | Divide & conquer | `IF izq<der THEN medio←(izq+der)/2; CALL mergeSort(A,izq,medio); CALL mergeSort(A,medio+1,der); CALL merge(A,izq,medio,der)` | worst=Θ(n log n), best=Θ(n log n), avg=Θ(n log n); métodos=[master, recursion_tree, iteration] | equivalencia simbólica + step bundle 10 pasos (master), 11 pasos (recursion tree) | `test_recursive_oracles.py::test_recursive_oracle_merge_sort`, `test_recursive_algorithms.py::test_master_step_bundle_contract_for_merge_sort` |
| REC-02 | `binarySearchRecursive` | Divide & conquer (rama única) | `IF inicio>fin THEN RETURN -1; mitad←(inicio+fin)/2; IF x<A[mitad] THEN RETURN busquedaBinaria(...)` | worst=Θ(log n), best=Θ(1), avg=Θ(log n) | equivalencia simbólica + método iteration da Θ(log n) | `test_recursive_algorithms.py::test_binary_search_recursive_theta_log_n` |
| REC-03 | `factorial` | Recursive linear | `IF n≤1 THEN RETURN 1; RETURN n*factorial(n-1)` | worst=Θ(n), best=Θ(n), avg=Θ(n); DP rejected (no overlap) | equivalencia simbólica + bundle iteration 11 pasos | `test_recursive_oracles.py::test_recursive_oracle_factorial`, `test_recursive_algorithms.py::test_iteration_step_bundle_contract_for_unit_shift` |
| REC-04 | `fibonacci` | Recursive DP | `IF n≤1 THEN RETURN n; RETURN fibonacci(n-1)+fibonacci(n-2)` | worst=exponential; DP validation=clear; pattern=rolling_window; space=O(1) | ecuación característica + validación DP + crecimiento ~φⁿ | `test_recursive_algorithms.py::test_fibonacci_confirms_dp_with_rolling_window` |
| REC-05 | `sparseRec` (linear_shift) | Recurrence out of coverage | `IF n≤3 THEN RETURN 1; RETURN sparseRec(n-1)+sparseRec(n-4)` | método=characteristic_equation; recurrencia=linear_shift; DP pattern=tabulation | status `partial` (CEQ no resuelve constantes simbólicas), pero theta exponencial | `test_recursive_algorithms.py::test_sparse_linear_recurrence_detects_linear_shift_family` |
| REC-06 | `maxPorMitades` | Deterministic same_as_worst | `IF inicio=fin THEN RETURN A[inicio]; medio; izq←maxPorMitades(...); der←maxPorMitades(...)` | worst=Θ(n), best=Θ(n), avg=Θ(n); `has_case_variability=false` | best/avg = `same_as_worst` (determinista) | `test_recursive_algorithms.py::test_max_por_mitades_is_deterministic_theta_n` |

## Validación por familia

### Iterativos (FOR)
| ID | Pseudocódigo | worst | best | avg |
|---|---|---|---|---|
| ITR-01 | `linear_search` | Θ(n) | Θ(1) | Θ(n) |
| ITR-02 | `bubble_sort` | Θ(n²) | Θ(n²) | Θ(n²) |
| ITR-03 | `insertion_sort` | Θ(n²) | Θ(n) | Θ(n²) |
| ITR-04 | `selection_sort` | Θ(n²) | Θ(n²) | Θ(n²) |
| ITR-05 | `matrix_mult` | Θ(n³) | Θ(n³) | Θ(n³) |
| ITR-06 | `triangular loops` | Θ(n²) | Θ(n²) | Θ(n²) |
| ITR-07 | `countingSort` | Θ(n+k) | Θ(n+k) | Θ(n+k) |
| ITR-08 | `mergeTwoSorted` | Θ(n+m) | Θ(n+m) | Θ(n+m) |

### WHILE
| ID | Pseudocódigo | worst | best | avg |
|---|---|---|---|---|
| WHL-01 | `while_linear` (i++) | Θ(n) | Θ(n) | Θ(n) |
| WHL-02 | `while_log` (i*=2) | Θ(log n) | Θ(log n) | Θ(log n) |
| WHL-03 | `euclides` (MCD) | Θ(log(min(a,b))) | Θ(log(min(a,b))) | Θ(log(min(a,b))) |
| WHL-04 | `binarySearch` | Θ(log n) | Θ(1) | Θ(log n) |
| WHL-05 | `ambiguous_updates` | unbounded | unbounded | unbounded |
| WHL-06 | `flag_kill` (bounded) | Θ(1) | Θ(1) | Θ(1) |
| WHL-07 | `bubbleSortMejorado` | Θ(n²) | Θ(n) | Θ(n²) |
| WHL-08 | `nestedWhile` (i<n, j<n) | Θ(n²) | Θ(n²) | Θ(n²) |
| WHL-09 | `divLoop` (i/=2) | Θ(log n) | Θ(log n) | Θ(log n) |
| WHL-10 | `mergeTwoWhile` | Θ(n+m) | Θ(n+m) | Θ(n+m) |
| WHL-11 | `tripleWhile` | Θ(n³) | Θ(n³) | Θ(n³) |
| WHL-12 | `countingSort` | Θ(n+k) | Θ(n+k) | Θ(n+k) |

### Recursivos
| ID | Pseudocódigo | worst | best | avg | Método preferido |
|---|---|---|---|---|---|
| REC-01 | `mergeSort(A,izq,der)` | Θ(n log n) | Θ(n log n) | Θ(n log n) | master |
| REC-02 | `binarySearchRec(A,x,ini,fin)` | Θ(log n) | Θ(1) | Θ(log n) | iteration |
| REC-03 | `factorial(n)` | Θ(n) | Θ(n) | Θ(n) | iteration |
| REC-04 | `fibonacci(n)` | exponencial | exponencial | exponencial | characteristic_equation |
| REC-05 | `hanoi(n,origen,destino,aux)` | Θ(2ⁿ) | Θ(2ⁿ) | Θ(2ⁿ) | characteristic_equation |
| REC-06 | `tetranacci(n)` | exponencial (~1.93ⁿ) | exponencial | exponencial | characteristic_equation |
| REC-07 | `tribonacci(n)` | exponencial | exponencial | exponencial | characteristic_equation |
| REC-08 | `maxPorMitades(A,ini,fin)` | Θ(n) | Θ(n) | Θ(n) | master (same_as_worst) |
| REC-09 | `sparseRec(n)` (n-1, n-4) | exponencial (partial) | exponencial (partial) | exponencial (partial) | characteristic_equation |
| REC-10 | `quickSort(A,izq,der)` | Θ(n²) | Θ(n log n) | Θ(n log n) | recursion_tree |
| REC-11 | `insertionSortRec(A,n)` | Θ(n²) | Θ(n) | Θ(n²) | iteration |
| REC-12 | `exponenciacionRapida(x,n)` | Θ(log n) | Θ(log n) | Θ(log n) | master |

## Metamórficos

Estos oráculos validan que renombrar variables no cambia la clasificación:

| ID | Propiedad | Test |
|---|---|---|
| MET-01 | Renombrar `i` → `indiceLimite` no cambia O(n) | `test_while_metamorphic.py::test_linear_counter_rename_i_to_indice_limite` |
| MET-02 | Renombrar `flag` → `seguir` no cambia bounded/unbounded status | `test_while_metamorphic.py::test_flag_rename_to_seguir` |

## Bounded / Unbounded WHILE

| ID | Pseudocódigo | status | Patrón |
|---|---|---|---|
| BND-01 | `WHILE flag=true DO flag←false` | bounded (Θ(1)) | flag_kill |
| BND-02 | `BubbleSort mejorado con WHILE(intercambiado)` | bounded (Θ(n)..Θ(n²)) | loop_progress |
| BND-03 | `WHILE i<n DO i←i+1` | bounded (Θ(n)) | linear_counter |
| UNB-01 | `WHILE flag=true DO x←x+1` (no muta flag) | unbounded | none |
| UNB-02 | `WHILE i<n DO IF p THEN i←i+1` (update in IF, not must) | unbounded | none |

## Bundle step-by-step contracts

Cada método de análisis recursivo entrega un bundle de pasos tipados:

| Método | Versión | Pasos | Archivo de test |
|---|---|---|---|
| `master` | `master_steps_v1` | 10 | `test_recursive_algorithms.py::test_master_step_bundle_contract_for_merge_sort` |
| `recursion_tree` | `rt_steps_v1` | 11 | `test_recursive_algorithms.py::test_recursion_tree_step_bundle_contract_for_merge_sort` |
| `iteration` | `iter_steps_v1` | 11 | `test_recursive_algorithms.py::test_iteration_step_bundle_contract_for_unit_shift` |
| `characteristic_equation` | `ceq_steps_v1` | 12 | `test_recursive_algorithms.py::test_characteristic_step_bundle_contract_for_constant_non_homogeneous` |

## Archivos relacionados

- `testing-strategy.md`
- `benchmarking.md`
- `technique-detection-oracles.md`
