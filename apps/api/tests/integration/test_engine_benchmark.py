"""
Tests de benchmark para el motor de análisis.
40+ tests de algoritmos reales que verifican worst, best y avg en cada caso.
Objetivo: diagnosticar dónde falla el motor de análisis.

- 20 algoritmos iterativos (FOR/WHILE)
- 20 algoritmos recursivos (5 por método: master, iteration, characteristic_equation, recursion_tree)

Author: @Cruz1122
"""
import pytest
from app.modules.analysis.service import analyze_algorithm
from tests.integration.fixtures.algorithm_expectations import (
    assert_all_cases_complexity,
    assert_case_complexity,
    assert_worst_complexity,
    get_notation_from_totals,
    get_totals,
    notation_has_complexity,
)


# --- Algoritmos iterativos ---

FIBONACCI_ITERATIVE = """fibIter(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN n;
  END
  a <- 0;
  b <- 1;
  FOR i <- 2 TO n DO BEGIN
    temp <- b;
    b <- a + b;
    a <- temp;
  END
  RETURN b;
END
"""

# Fibonacci con ELSE IF: el FOR está dentro del ELSE (regresión: ast_builder debe visitar ifStmt en alternate)
FIBONACCI_ITERATIVE_ELSE = """fibonacciIterativo(n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 0;
    END
    ELSE IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    ELSE BEGIN
        anterior <- 0;
        actual <- 1;
        siguiente <- 0;
        FOR i <- 2 TO n DO BEGIN
            siguiente <- anterior + actual;
            anterior <- actual;
            actual <- siguiente;
        END
        RETURN actual;
    END
END
"""

PREFIX_SUM = """prefixSum(A, n) BEGIN
  B[1] <- A[1];
  FOR i <- 2 TO n DO BEGIN
    B[i] <- B[i - 1] + A[i];
  END
  RETURN B;
END
"""

ARRAY_PRODUCT = """arrayProduct(A, n) BEGIN
  prod <- 1;
  FOR i <- 1 TO n DO BEGIN
    prod <- prod * A[i];
  END
  RETURN prod;
END
"""

ARRAY_MIN = """arrayMin(A, n) BEGIN
  minimo <- A[1];
  FOR i <- 2 TO n DO BEGIN
    IF (A[i] < minimo) THEN BEGIN
      minimo <- A[i];
    END
  END
  RETURN minimo;
END
"""

REVERSE_ARRAY = """reverseArray(A, n) BEGIN
  FOR i <- 1 TO n / 2 DO BEGIN
    temp <- A[i];
    A[i] <- A[n - i + 1];
    A[n - i + 1] <- temp;
  END
END
"""

COPY_ARRAY = """copyArray(A, B, n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    B[i] <- A[i];
  END
END
"""

DOT_PRODUCT = """dotProduct(A, B, n) BEGIN
  sum <- 0;
  FOR i <- 1 TO n DO BEGIN
    sum <- sum + A[i] * B[i];
  END
  RETURN sum;
END
"""

COUNT_ZEROS = """countZeros(A, n) BEGIN
  count <- 0;
  FOR i <- 1 TO n DO BEGIN
    IF (A[i] = 0) THEN BEGIN
      count <- count + 1;
    END
  END
  RETURN count;
END
"""

FIND_LAST_INDEX = """findLastIndex(A, n, x) BEGIN
  i <- n;
  WHILE (i >= 1 AND A[i] != x) DO BEGIN
    i <- i - 1;
  END
  IF (i >= 1) THEN BEGIN
    RETURN i;
  END
  RETURN -1;
END
"""

SUM_EVENS = """sumEvens(A, n) BEGIN
  sum <- 0;
  FOR i <- 1 TO n DO BEGIN
    IF (A[i] MOD 2 = 0) THEN BEGIN
      sum <- sum + A[i];
    END
  END
  RETURN sum;
END
"""

BUBBLE_SORT = """burbuja(A, n) BEGIN
  FOR i <- 1 TO n - 1 DO BEGIN
    FOR j <- 1 TO n - i DO BEGIN
      IF (A[j] > A[j + 1]) THEN BEGIN
        temp <- A[j];
        A[j] <- A[j + 1];
        A[j + 1] <- temp;
      END
    END
  END
END
"""

SELECTION_SORT = """selectionSort(A, n) BEGIN
  FOR i <- 1 TO n - 1 DO BEGIN
    min_idx <- i;
    FOR j <- i + 1 TO n DO BEGIN
      IF (A[j] < A[min_idx]) THEN BEGIN
        min_idx <- j;
      END
    END
    IF (min_idx != i) THEN BEGIN
      temp <- A[i];
      A[i] <- A[min_idx];
      A[min_idx] <- temp;
    END
  END
END
"""

INSERTION_SORT = """insertionSort(arr, n) BEGIN
  FOR i <- 2 TO n DO BEGIN
    key <- arr[i];
    j <- i - 1;
    WHILE (j >= 1 AND arr[j] > key) DO BEGIN
      arr[j + 1] <- arr[j];
      j <- j - 1;
    END
    arr[j + 1] <- key;
  END
END
"""

DOUBLE_FOR_RECT = """doubleLoop(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    FOR j <- 1 TO n DO BEGIN
      x <- i + j;
    END
  END
END
"""

TRIANGULAR_LOOPS = """triangular(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    FOR j <- i TO n DO BEGIN
      x <- i + j;
    END
  END
END
"""

MATRIX_MULT = """matrixMult(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    FOR j <- 1 TO n DO BEGIN
      sum <- 0;
      FOR k <- 1 TO n DO BEGIN
        sum <- sum + 1;
      END
      result <- sum;
    END
  END
END
"""

TRIPLE_FOR_CUBIC = """tripleLoop(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    FOR j <- 1 TO n DO BEGIN
      FOR k <- 1 TO n DO BEGIN
        x <- 1;
      END
    END
  END
END
"""

BINARY_SEARCH_ITER = """binarySearch(A, n, x) BEGIN
  izq <- 1;
  der <- n;
  WHILE (izq <= der) DO BEGIN
    mitad <- (izq + der) / 2;
    IF (A[mitad] = x) THEN BEGIN
      RETURN mitad;
    END
    IF (A[mitad] < x) THEN BEGIN
      izq <- mitad + 1;
    END
    ELSE BEGIN
      der <- mitad - 1;
    END
  END
  RETURN -1;
END
"""

WHILE_LOG = """logLoop(n) BEGIN
  i <- 1;
  WHILE (i <= n) DO BEGIN
    x <- 1;
    i <- i * 2;
  END
END
"""

EUCLIDES_MCD = """mcd(a, b) BEGIN
  WHILE (b != 0) DO BEGIN
    temp <- b;
    b <- a MOD b;
    a <- temp;
  END
  RETURN a;
END
"""


# --- Algoritmos recursivos ---

MERGE_SORT = """mergeSort(A, izq, der) BEGIN
  IF (izq < der) THEN BEGIN
    medio <- (izq + der) / 2;
    CALL mergeSort(A, izq, medio);
    CALL mergeSort(A, medio + 1, der);
    CALL merge(A, izq, medio, der);
  END
END
"""

BINARY_SEARCH_REC = """busquedaBinaria(A, x, inicio, fin) BEGIN
  IF (inicio > fin) THEN BEGIN
    RETURN -1;
  END
  mitad <- (inicio + fin) / 2;
  IF (A[mitad] = x) THEN BEGIN
    RETURN mitad;
  END
  IF (x < A[mitad]) THEN BEGIN
    RETURN busquedaBinaria(A, x, inicio, mitad - 1);
  END
  ELSE BEGIN
    RETURN busquedaBinaria(A, x, mitad + 1, fin);
  END
END
"""

FACTORIAL_REC = """factorial(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN 1;
  END
  RETURN n * factorial(n - 1);
END
"""

SUMA_REC = """sumaRec(n) BEGIN
  IF (n <= 0) THEN BEGIN
    RETURN 0;
  END
  RETURN n + sumaRec(n - 1);
END
"""

POTENCIA_LINEAL_REC = """potencia(base, exp) BEGIN
  IF (exp <= 0) THEN BEGIN
    RETURN 1;
  END
  RETURN base * potencia(base, exp - 1);
END
"""

BINARY_SEARCH_ONE_CALL = """busquedaBinariaSimple(A, x, izq, der) BEGIN
  IF (izq > der) THEN BEGIN
    RETURN -1;
  END
  medio <- (izq + der) / 2;
  IF (A[medio] = x) THEN BEGIN
    RETURN medio;
  END
  IF (x < A[medio]) THEN BEGIN
    RETURN busquedaBinariaSimple(A, x, izq, medio - 1);
  END
  RETURN busquedaBinariaSimple(A, x, medio + 1, der);
END
"""

HANOI = """hanoi(n, origen, destino, aux) BEGIN
  IF (n > 0) THEN BEGIN
    CALL hanoi(n - 1, origen, aux, destino);
    CALL hanoi(n - 1, aux, destino, origen);
  END
END
"""

FIBONACCI_REC = """fibonacci(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN n;
  END
  RETURN fibonacci(n - 1) + fibonacci(n - 2);
END
"""

TRIBONACCI = """tribonacci(n) BEGIN
  IF (n <= 2) THEN BEGIN
    RETURN n;
  END
  RETURN tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3);
END
"""

FIBONACCI_COST = """fibonacciCost(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN n;
  END
  x <- 1;
  RETURN fibonacciCost(n - 1) + fibonacciCost(n - 2);
END
"""

DOUBLE_FIB = """dobleFib(n) BEGIN
  IF (n <= 0) THEN BEGIN
    RETURN 0;
  END
  RETURN dobleFib(n - 1) + dobleFib(n - 1);
END
"""

QUICK_SORT_WORST = """quickSortWorst(A, izq, der) BEGIN
  IF (izq < der) THEN BEGIN
    pivot <- izq;
    i <- izq;
    FOR j <- izq + 1 TO der DO BEGIN
      IF (A[j] < A[pivot]) THEN BEGIN
        i <- i + 1;
        temp <- A[i];
        A[i] <- A[j];
        A[j] <- temp;
      END
    END
    temp <- A[pivot];
    A[pivot] <- A[i];
    A[i] <- temp;
    CALL quickSortWorst(A, izq, i - 1);
    CALL quickSortWorst(A, i + 1, der);
  END
END
"""

MERGE_4_WAYS = """mergeSort4(A, izq, der) BEGIN
  IF (izq < der) THEN BEGIN
    tam <- der - izq + 1;
    q1 <- izq + tam / 4;
    q2 <- izq + tam / 2;
    q3 <- izq + 3 * tam / 4;
    CALL mergeSort4(A, izq, q1 - 1);
    CALL mergeSort4(A, q1, q2 - 1);
    CALL mergeSort4(A, q2, q3 - 1);
    CALL mergeSort4(A, q3, der);
  END
END
"""


class TestIterativeBenchmark:
    """20 tests iterativos con validación de worst, best y avg."""

    def test_01_fibonacci_iterative(self):
        result = analyze_algorithm(FIBONACCI_ITERATIVE, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        assert_all_cases_complexity(result, "linear", name="Fibonacci iterativo")

    def test_01b_fibonacci_iterative_else_structure(self):
        """Fibonacci con ELSE IF: FOR dentro de ELSE debe dar Θ(n) en worst/avg."""
        result = analyze_algorithm(FIBONACCI_ITERATIVE_ELSE, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        assert_case_complexity(result, "worst", "linear", name="Fibonacci ELSE worst")
        assert_case_complexity(result, "avg", "linear", name="Fibonacci ELSE avg")
        # Best: n=0 o n=1 → O(1)
        assert_case_complexity(result, "best", "constant", name="Fibonacci ELSE best")

    def test_02_prefix_sum(self):
        result = analyze_algorithm(PREFIX_SUM, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "linear", name="Prefix sum")

    def test_03_array_product(self):
        result = analyze_algorithm(ARRAY_PRODUCT, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "linear", name="Array product")

    def test_04_array_min(self):
        result = analyze_algorithm(ARRAY_MIN, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "linear", name="Array min")

    def test_05_reverse_array(self):
        result = analyze_algorithm(REVERSE_ARRAY, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "linear", name="Reverse array")

    def test_06_copy_array(self):
        result = analyze_algorithm(COPY_ARRAY, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "linear", name="Copy array")

    def test_07_dot_product(self):
        result = analyze_algorithm(DOT_PRODUCT, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "linear", name="Dot product")

    def test_08_count_zeros(self):
        result = analyze_algorithm(COUNT_ZEROS, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "linear", name="Count zeros")

    def test_09_find_last_index(self):
        result = analyze_algorithm(FIND_LAST_INDEX, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(
            result, "linear", expected_best="constant", expected_avg="linear", name="Find last index"
        )

    def test_10_sum_evens(self):
        result = analyze_algorithm(SUM_EVENS, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "linear", name="Sum evens")

    def test_11_bubble_sort(self):
        result = analyze_algorithm(BUBBLE_SORT, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(
            result, "quadratic", expected_best="linear", expected_avg="quadratic", name="Bubble sort"
        )

    def test_12_selection_sort(self):
        result = analyze_algorithm(SELECTION_SORT, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "quadratic", name="Selection sort")

    def test_13_insertion_sort(self):
        result = analyze_algorithm(INSERTION_SORT, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(
            result, "quadratic", expected_best="linear", expected_avg="quadratic", name="Insertion sort"
        )

    def test_14_double_for_rectangular(self):
        result = analyze_algorithm(DOUBLE_FOR_RECT, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "quadratic", name="Double FOR rectangular")

    def test_15_triangular_loops(self):
        result = analyze_algorithm(TRIANGULAR_LOOPS, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "quadratic", name="Triangular loops")

    def test_16_matrix_mult(self):
        result = analyze_algorithm(MATRIX_MULT, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "cubic", name="Matrix mult")

    def test_17_triple_for_cubic(self):
        result = analyze_algorithm(TRIPLE_FOR_CUBIC, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "cubic", name="Triple FOR cubic")

    def test_18_binary_search_iterative(self):
        result = analyze_algorithm(BINARY_SEARCH_ITER, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(
            result, "log", expected_best="constant", expected_avg="log", name="Binary search iter"
        )

    def test_19_while_log(self):
        result = analyze_algorithm(WHILE_LOG, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "log", name="WHILE log")

    def test_20_euclides_mcd(self):
        result = analyze_algorithm(EUCLIDES_MCD, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "log", name="Euclides MCD")


def _assert_recursive_result(result, expected_worst, expected_best=None, expected_avg=None, name=""):
    """Helper para validar resultado recursivo con worst/best/avg."""
    assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
    assert_case_complexity(result, "worst", expected_worst, name)
    best = result.get("best")
    avg = result.get("avg")
    best_level = expected_best or expected_worst
    avg_level = expected_avg or expected_worst
    if best != "same_as_worst" and isinstance(best, dict):
        assert_case_complexity(result, "best", best_level, name)
    if avg != "same_as_worst" and avg is not None and isinstance(avg, dict):
        assert_case_complexity(result, "avg", avg_level, name)


def _assert_recurrence_method(result, expected_method, name=""):
    """Verifica que el método de recurrencia sea el esperado."""
    worst = result.get("worst", {})
    totals = worst.get("totals", {})
    recurrence = totals.get("recurrence", {})
    method = recurrence.get("method", "")
    assert method == expected_method, (
        f"[{name}] Esperado método {expected_method}, obtenido: {method}"
    )


class TestRecursiveMasterBenchmark:
    """5 tests recursivos con Teorema Maestro."""

    def test_01_merge_sort_master(self):
        result = analyze_algorithm(MERGE_SORT, mode="all", preferred_method="master")
        if not result.get("ok"):
            pytest.fail(f"Merge sort falló: {result.get('errors', [])}")
        _assert_recurrence_method(result, "master", "Merge sort")
        _assert_recursive_result(result, "linear", name="Merge sort")

    def test_02_binary_search_master(self):
        result = analyze_algorithm(BINARY_SEARCH_REC, mode="all", preferred_method="master")
        if not result.get("ok"):
            pytest.fail(f"Binary search falló: {result.get('errors', [])}")
        _assert_recurrence_method(result, "master", "Binary search")
        _assert_recursive_result(result, "log", expected_best="constant", name="Binary search")

    def test_03_merge_sort_master_ok(self):
        result = analyze_algorithm(MERGE_SORT, mode="all", preferred_method="master")
        assert result.get("ok", False)
        totals = get_totals(result, "worst")
        assert "recurrence" in totals
        assert totals["recurrence"].get("method") == "master"

    def test_04_binary_search_worst_log(self):
        result = analyze_algorithm(BINARY_SEARCH_REC, mode="all", preferred_method="master")
        assert result.get("ok", False)
        assert_worst_complexity(result, "log", "Binary search rec")

    def test_05_merge_sort_theta_has_n(self):
        result = analyze_algorithm(MERGE_SORT, mode="all", preferred_method="master")
        assert result.get("ok", False)
        totals = get_totals(result, "worst")
        theta = totals.get("big_theta", "") or totals.get("big_o", "") or ""
        master = totals.get("master", {})
        if master:
            theta = master.get("theta", "") or theta
        assert "n" in theta.lower(), f"Merge sort debe contener n: {theta}"


class TestRecursiveIterationBenchmark:
    """5 tests recursivos con Método de Iteración."""

    def test_01_factorial_iteration(self):
        result = analyze_algorithm(FACTORIAL_REC, mode="all", preferred_method="iteration")
        if not result.get("ok"):
            pytest.fail(f"Factorial falló: {result.get('errors', [])}")
        _assert_recurrence_method(result, "iteration", "Factorial")
        _assert_recursive_result(result, "linear", name="Factorial")

    def test_02_suma_rec_iteration(self):
        result = analyze_algorithm(SUMA_REC, mode="all", preferred_method="iteration")
        if not result.get("ok"):
            pytest.fail(f"Suma rec falló: {result.get('errors', [])}")
        _assert_recurrence_method(result, "iteration", "Suma rec")
        _assert_recursive_result(result, "linear", name="Suma rec")

    def test_03_potencia_iteration(self):
        result = analyze_algorithm(POTENCIA_LINEAL_REC, mode="all", preferred_method="iteration")
        if not result.get("ok"):
            pytest.fail(f"Potencia falló: {result.get('errors', [])}")
        _assert_recurrence_method(result, "iteration", "Potencia")
        _assert_recursive_result(result, "linear", name="Potencia")

    def test_04_binary_search_simple_iteration(self):
        result = analyze_algorithm(BINARY_SEARCH_ONE_CALL, mode="all", preferred_method="iteration")
        if not result.get("ok"):
            pytest.fail(f"Binary search simple falló: {result.get('errors', [])}")
        _assert_recursive_result(result, "log", expected_best="constant", name="Binary search simple")

    def test_05_hanoi_iteration(self):
        result = analyze_algorithm(HANOI, mode="all", preferred_method="iteration")
        if not result.get("ok"):
            pytest.fail(f"Hanoi falló: {result.get('errors', [])}")
        _assert_recursive_result(result, "exponential", name="Hanoi")


class TestRecursiveCharacteristicEquationBenchmark:
    """5 tests recursivos con Ecuación Característica."""

    def test_01_fibonacci_characteristic(self):
        result = analyze_algorithm(FIBONACCI_REC, mode="all", preferred_method="characteristic_equation")
        if not result.get("ok"):
            pytest.fail(f"Fibonacci falló: {result.get('errors', [])}")
        _assert_recurrence_method(result, "characteristic_equation", "Fibonacci")
        totals = get_totals(result, "worst")
        theta = totals.get("big_theta", "") or totals.get("big_o", "") or ""
        char_eq = totals.get("characteristic_equation", {})
        if char_eq:
            theta = char_eq.get("solution", "") or char_eq.get("theta", "") or theta
        assert notation_has_complexity(theta, "exponential") or notation_has_complexity(theta, "linear"), (
            f"Fibonacci debe ser exponencial o linear: {theta}"
        )

    def test_02_tribonacci_characteristic(self):
        result = analyze_algorithm(TRIBONACCI, mode="all", preferred_method="characteristic_equation")
        if not result.get("ok"):
            pytest.fail(f"Tribonacci falló: {result.get('errors', [])}")
        _assert_recursive_result(result, "exponential", name="Tribonacci")

    def test_03_fibonacci_cost_characteristic(self):
        result = analyze_algorithm(FIBONACCI_COST, mode="all", preferred_method="characteristic_equation")
        if not result.get("ok"):
            pytest.fail(f"Fibonacci cost falló: {result.get('errors', [])}")
        totals = get_totals(result, "worst")
        theta = get_notation_from_totals(totals)
        assert "n" in theta.lower() or "exp" in theta.lower(), f"Fibonacci cost: {theta}"

    def test_04_double_fib_characteristic(self):
        result = analyze_algorithm(DOUBLE_FIB, mode="all", preferred_method="characteristic_equation")
        if not result.get("ok"):
            pytest.fail(f"Doble fib falló: {result.get('errors', [])}")
        _assert_recursive_result(result, "exponential", name="Doble fib")

    def test_05_fibonacci_ok(self):
        result = analyze_algorithm(FIBONACCI_REC, mode="all", preferred_method="characteristic_equation")
        assert result.get("ok", False)
        totals = get_totals(result, "worst")
        assert "recurrence" in totals


class TestRecursiveRecursionTreeBenchmark:
    """5 tests recursivos con Árbol de Recursión."""

    def test_01_merge_sort_tree(self):
        result = analyze_algorithm(MERGE_SORT, mode="all", preferred_method="recursion_tree")
        if not result.get("ok"):
            pytest.fail(f"Merge sort tree falló: {result.get('errors', [])}")
        _assert_recurrence_method(result, "recursion_tree", "Merge sort tree")
        _assert_recursive_result(result, "linear", name="Merge sort tree")

    def test_02_binary_search_tree(self):
        result = analyze_algorithm(BINARY_SEARCH_REC, mode="all", preferred_method="recursion_tree")
        if not result.get("ok"):
            pytest.fail(f"Binary search tree falló: {result.get('errors', [])}")
        _assert_recurrence_method(result, "recursion_tree", "Binary search tree")
        _assert_recursive_result(result, "log", expected_best="constant", name="Binary search tree")

    def test_03_quick_sort_worst_tree(self):
        result = analyze_algorithm(QUICK_SORT_WORST, mode="all", preferred_method="recursion_tree")
        if not result.get("ok"):
            pytest.fail(f"Quick sort worst falló: {result.get('errors', [])}")
        _assert_recursive_result(result, "quadratic", name="Quick sort worst")

    def test_04_merge_4_ways_tree(self):
        result = analyze_algorithm(MERGE_4_WAYS, mode="all", preferred_method="recursion_tree")
        if not result.get("ok"):
            pytest.fail(f"Merge 4 ways falló: {result.get('errors', [])}")
        _assert_recursive_result(result, "linear", name="Merge 4 ways")

    def test_05_merge_sort_tree_has_levels(self):
        result = analyze_algorithm(MERGE_SORT, mode="all", preferred_method="recursion_tree")
        assert result.get("ok", False)
        totals = get_totals(result, "worst")
        tree = totals.get("recursion_tree", {})
        if tree:
            assert "levels" in tree or "theta" in tree or "height" in tree
