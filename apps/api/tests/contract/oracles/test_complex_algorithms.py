# tests/integration/test_complex_algorithms.py
"""
Tests de integración para algoritmos complejos con casos raros.
Bucles anidados con límites variables, WHILE complejos, IF anidados.
Usa pseudocode como input y expectativas explícitas (auténticos).

Author: @Cruz1122
"""
import pytest

from app.modules.analysis.service import analyze_algorithm
from tests._support.assertions import (
    assert_all_cases_complexity,
    assert_notation_no_array_symbols,
    get_totals,
)

pytestmark = [pytest.mark.contract, pytest.mark.oracle, pytest.mark.iterative]

# Bucles anidados con límites variables: FOR i=1 TO n, FOR j=i TO n → Θ(n²)
NESTED_LOOPS_VARIABLE_LIMITS = """triangular(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    FOR j <- i TO n DO BEGIN
      x <- i + j;
    END
  END
END
"""

# WHILE con condición compuesta (i<=n AND A[i]>0) → O(n) worst
COMPLEX_WHILE = """searchPositive(A, n) BEGIN
  i <- 1;
  WHILE (i <= n AND A[i] > 0) DO BEGIN
    i <- i + 1;
  END
END
"""

# Doble FOR rectangular → Θ(n²)
COMPLEX_INDEXED_ARRAY = """doubleLoop(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    FOR j <- 1 TO n DO BEGIN
      A[i + j] <- A[i * 2] + A[j];
    END
  END
END
"""

# Bubble sort mejorado con bandera en condición AND usando igualdad explícita
BUBBLE_SORT_FLAG_EQ = """ordenamientoBurbujaMejorado(A, n) BEGIN
  i <- 1;
  intercambiado <- TRUE;
  WHILE (i < n AND intercambiado = TRUE) DO BEGIN
    intercambiado <- FALSE;
    FOR j <- 1 TO n - i DO BEGIN
      IF (A[j] > A[j+1]) THEN BEGIN
        temp <- A[j];
        A[j] <- A[j+1];
        A[j+1] <- temp;
        intercambiado <- VERDADERO;
      END
    END
    i <- i + 1;
  END
END
"""

# FOR con IF anidados (3 ramas) → O(n)
NESTED_IF_IN_FOR = """nestedIf(A, n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    IF (A[i] > 0) THEN BEGIN
      IF (A[i] > 100) THEN BEGIN
        x <- 1;
      END
      ELSE BEGIN
        x <- 2;
      END
    END
    ELSE BEGIN
      x <- 0;
    END
  END
END
"""

# Bubble sort mejorado con bandera de intercambio
BUBBLE_SORT_MEJORADO = """bubbleSortMejorado(A, n) BEGIN
  intercambiado <- TRUE;
  i <- 1;
  WHILE (i < n AND intercambiado) DO BEGIN
    intercambiado <- FALSE;
    FOR j <- 1 TO n - i DO BEGIN
      IF (A[j] > A[j+1]) THEN BEGIN
        temp <- A[j];
        A[j] <- A[j+1];
        A[j+1] <- temp;
        intercambiado <- TRUE;
      END
    END
    i <- i + 1;
  END
END
"""

# Bubble sort con longitud decreciente (variable en límite del FOR interno)
# Regresión: evita conteos negativos por sustitución incorrecta de "longitud"
BUBBLE_SORT_LONGITUD = """bubbleSortMejorado(A, n) BEGIN
    longitud <- n;
    swapped <- TRUE;
    WHILE (swapped = TRUE) DO BEGIN
        swapped <- FALSE;
        FOR j <- 1 TO longitud - 1 DO BEGIN
            IF (A[j] > A[j + 1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j + 1];
                A[j + 1] <- temp;
                swapped <- TRUE;
            END
        END
        longitud <- longitud - 1;
    END
END
"""

# WHILE con múltiples condiciones AND (control + datos1 + datos2)
MULTI_AND_DATA_WHILE = """multiAndData(A, B, n) BEGIN
  i <- 1;
  WHILE (i <= n AND A[i] > 0 AND B[i] > 0) DO BEGIN
    x <- A[i] + B[i];
    i <- i + 1;
  END
END
"""

# WHILE con múltiples límites simbólicos sobre la misma variable de control
MULTI_LIMIT_WHILE = """multiLimit(A, n, m) BEGIN
  i <- 1;
  WHILE (i <= n AND i <= m) DO BEGIN
    x <- A[i];
    i <- i + 1;
  END
END
"""

# WHILE anidado con reinicio de variable interna: Σ_{i=1}^{n} i → Θ(n²)
RESET_INNER_WHILE = """reinicioInterno(n) BEGIN
    i <- 1;
    j <- 1;
    WHILE (i <= n) DO BEGIN
        j <- 1;
        WHILE (j <= i) DO BEGIN
            x <- x + 1;
            j <- j + 1;
        END
        i <- i + 1;
    END
END
"""


class TestComplexAlgorithms:
    """Tests para algoritmos complejos con casos raros."""

    def test_nested_loops_variable_limits_quadratic(self):
        """Bucles FOR i=1..n, j=i..n (triangular): validar todos los casos Θ(n²)."""
        result = analyze_algorithm(NESTED_LOOPS_VARIABLE_LIMITS, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        assert_all_cases_complexity(result, "quadratic", name="Triangular loops")

    def test_nested_loops_variable_limits_all_cases(self):
        """Triangular loops: worst, best y avg deben analizarse correctamente."""
        result = analyze_algorithm(NESTED_LOOPS_VARIABLE_LIMITS, mode="all")
        assert result.get("ok", False)
        assert "worst" in result and result["worst"].get("ok")
        assert "byLine" in result["worst"] and len(result["worst"]["byLine"]) > 0
        totals = get_totals(result, "worst")
        assert "T_open" in totals and len(totals["T_open"]) > 0

    def test_complex_while_linear(self):
        """WHILE con condición compuesta: worst O(n). Best/avg teóricos O(1) (salida temprana)."""
        result = analyze_algorithm(COMPLEX_WHILE, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        assert_all_cases_complexity(
            result,
            "linear",
            expected_best="constant",
            expected_avg="constant",
            name="Complex WHILE",
        )

    def test_complex_while_all_cases(self):
        """Complex WHILE: worst, best y avg deben analizarse correctamente."""
        result = analyze_algorithm(COMPLEX_WHILE, mode="all")
        assert result.get("ok", False)
        for case in ("worst", "best", "avg"):
            data = result.get(case)
            if data == "same_as_worst":
                data = result.get("worst")
            if isinstance(data, dict):
                assert data.get("ok") and "byLine" in data and "totals" in data

    def test_complex_indexed_array_quadratic(self):
        """Doble FOR rectangular: validar todos los casos Θ(n²)."""
        result = analyze_algorithm(COMPLEX_INDEXED_ARRAY, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        assert_all_cases_complexity(result, "quadratic", name="Complex indexed array")

    def test_complex_indexed_array_all_cases(self):
        """Complex indexed: worst, best y avg deben analizarse correctamente."""
        result = analyze_algorithm(COMPLEX_INDEXED_ARRAY, mode="all")
        assert result.get("ok", False)
        assert "worst" in result and result["worst"].get("ok")
        totals = get_totals(result, "worst")
        assert "T_open" in totals

    def test_nested_if_in_for_linear(self):
        """FOR con IF anidados: validar todos los casos O(n)."""
        result = analyze_algorithm(NESTED_IF_IN_FOR, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        assert_all_cases_complexity(result, "linear", name="Nested IF in FOR")

    def test_nested_if_in_for_all_cases(self):
        """Nested IF in FOR: worst, best y avg deben analizarse correctamente."""
        result = analyze_algorithm(NESTED_IF_IN_FOR, mode="all")
        assert result.get("ok", False)
        for case in ("worst", "best", "avg"):
            data = result.get(case)
            if data == "same_as_worst":
                data = result.get("worst")
            if isinstance(data, dict):
                assert data.get("ok") and "byLine" in data and "totals" in data

    def test_bubble_sort_mejorado_all_cases(self):
        """Bubble sort mejorado: worst/avg Θ(n²), best Θ(n)."""
        result = analyze_algorithm(BUBBLE_SORT_MEJORADO, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        assert_all_cases_complexity(
            result,
            "quadratic",
            expected_best="linear",
            expected_avg="quadratic",
            name="BubbleSortMejorado",
        )
        # Sanity check: estructura mínima por caso
        for case in ("worst", "best", "avg"):
            data = result.get(case)
            if data == "same_as_worst":
                data = result.get("worst")
            if isinstance(data, dict):
                assert data.get("ok") and "byLine" in data and "totals" in data

    def test_bubble_sort_longitud_no_negative_counts(self):
        """Bubble sort con longitud decreciente: no debe haber conteos negativos (regresión)."""
        result = analyze_algorithm(BUBBLE_SORT_LONGITUD, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        for case in ("worst", "best", "avg"):
            data = result.get(case)
            if data == "same_as_worst":
                data = result.get("worst")
            if not isinstance(data, dict) or not data.get("ok"):
                continue
            for row in data.get("byLine", []):
                count = str(row.get("count", ""))
                # Regresión: count no debe ser "- n", "-n" ni expresiones negativas
                assert (
                    count != "- n" and count != "-n"
                ), f"Caso {case} línea {row.get('line')}: count negativo '{count}'"
                if count.startswith("-") and "n" in count:
                    pytest.fail(
                        f"Caso {case} línea {row.get('line')}: count negativo '{count}'"
                    )

    def test_bubble_sort_longitud_correct_complexity(self):
        """Bubble sort con longitud decreciente: Θ(n²) worst/avg, Θ(n) best; sin símbolos de array."""
        result = analyze_algorithm(BUBBLE_SORT_LONGITUD, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        assert_all_cases_complexity(
            result,
            "quadratic",
            expected_best="linear",
            expected_avg="quadratic",
            name="BubbleSortLongitud",
        )
        for case in ("worst", "best", "avg"):
            assert_notation_no_array_symbols(result, case)

    def test_bubble_sort_flag_eq_best_linear(self):
        """Bubble sort con bandera en condición AND (intercambiado = TRUE) debe ser lineal en best."""
        result = analyze_algorithm(BUBBLE_SORT_FLAG_EQ, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        # Peor caso cuadrático, mejor caso lineal, promedio cuadrático.
        assert_all_cases_complexity(
            result,
            "quadratic",
            expected_best="linear",
            expected_avg="quadratic",
            name="BubbleSortFlagEq",
        )

    def test_multi_and_data_while_cases(self):
        """WHILE con i<=n AND A[i]>0 AND B[i]>0: worst/avg O(n), best O(1) (salida temprana)."""
        result = analyze_algorithm(MULTI_AND_DATA_WHILE, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        # Worst lineal; best constante (caso prefijo positivo), avg lineal en el motor actual
        assert_all_cases_complexity(
            result,
            "linear",
            expected_best="constant",
            expected_avg="linear",
            name="Multi AND data WHILE",
        )

    def test_multi_limit_while_linear_all_cases(self):
        """WHILE con i<=n AND i<=m: worst/avg O(min(n,m)) ~ lineal; best O(1) (salida temprana)."""
        result = analyze_algorithm(MULTI_LIMIT_WHILE, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        # No asumimos que solo exista n: basta con que la clase sea lineal para worst/avg
        assert_all_cases_complexity(
            result,
            "linear",
            expected_best="constant",
            expected_avg="linear",
            name="Multi limit WHILE",
        )

    def test_reset_inner_while_quadratic(self):
        """WHILE externo i<=n y WHILE interno j<=i con reinicio: Θ(n²)."""
        result = analyze_algorithm(RESET_INNER_WHILE, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        assert_all_cases_complexity(result, "quadratic", name="Reset inner while")
