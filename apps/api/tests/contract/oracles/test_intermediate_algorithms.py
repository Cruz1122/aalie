# tests/integration/test_intermediate_algorithms.py
"""
Tests de integración para algoritmos de complejidad intermedia.
Verifica selection sort Θ(n²) y multiplicación de matrices Θ(n³).
Usa pseudocode como input y expectativas explícitas (auténticos).

Author: @Cruz1122
"""
import pytest

from app.modules.analysis.service import analyze_algorithm
from tests._support.assertions import (
    assert_all_cases_complexity,
    get_totals,
)

pytestmark = [pytest.mark.contract, pytest.mark.oracle, pytest.mark.iterative]

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

MATRIX_MULTIPLICATION = """matrixMult(n) BEGIN
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


class TestIntermediateAlgorithms:
    """Tests para algoritmos de complejidad intermedia."""

    def test_selection_sort_quadratic_worst(self):
        """Selection sort: validar todos los casos (worst, best, avg)."""
        result = analyze_algorithm(SELECTION_SORT, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        assert_all_cases_complexity(
            result,
            "quadratic",
            expected_best="quadratic",
            expected_avg="quadratic",
            name="Selection Sort",
        )

    def test_selection_sort_all_cases(self):
        """Selection sort: worst, best y avg deben analizarse correctamente."""
        result = analyze_algorithm(SELECTION_SORT, mode="all")
        assert result.get("ok", False)
        assert "worst" in result and result["worst"].get("ok")
        assert "best" in result
        best = result.get("best")
        if best != "same_as_worst" and isinstance(best, dict):
            assert best.get("ok") and "byLine" in best
        if result.get("avg") != "same_as_worst" and isinstance(result.get("avg"), dict):
            for row in result["avg"].get("byLine", []):
                assert "expectedRuns" in row

    def test_matrix_multiplication_cubic_worst(self):
        """Multiplicación de matrices: validar todos los casos Θ(n³)."""
        result = analyze_algorithm(MATRIX_MULTIPLICATION, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        assert_all_cases_complexity(
            result,
            "cubic",
            expected_best="cubic",
            expected_avg="cubic",
            name="Matrix Multiplication",
        )

    def test_matrix_multiplication_all_cases(self):
        """Matrix mult: worst, best y avg deben analizarse correctamente."""
        result = analyze_algorithm(MATRIX_MULTIPLICATION, mode="all")
        assert result.get("ok", False)
        assert "worst" in result and result["worst"].get("ok")
        totals = get_totals(result, "worst")
        assert "T_open" in totals and len(totals["T_open"]) > 0
        if result.get("avg") != "same_as_worst" and isinstance(result.get("avg"), dict):
            for row in result["avg"].get("byLine", []):
                assert "expectedRuns" in row
