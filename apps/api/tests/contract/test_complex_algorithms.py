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
    get_totals,
)


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
            result, "linear", expected_best="constant", expected_avg="constant", name="Complex WHILE"
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
