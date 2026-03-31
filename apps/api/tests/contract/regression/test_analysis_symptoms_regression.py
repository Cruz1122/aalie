"""
Regresiones para síntomas observados en validación del catálogo / informes de complejidad.

- Barrido lineal (WHILE) no debe cerrarse como Θ(1) en peor caso.
- Recursivos híbridos (insertion/selection con WHILE interno) deben mantener Θ(n²) worst.
- Cancelación simbólica (n·(-n+n) → 0): ver `test_iterative_analyzer.py::TestIterativeAnalyzer::test_sanitize_expression_reuses_main_symbol_for_bound_var_substitution`.

Comparación: exacta en clase asintótica inferida (`infer_complexity_class`), no en LaTeX literal.
"""

import pytest

from app.modules.analysis.service import analyze_algorithm
from tests._support.assertions import (
    get_notation_from_totals,
    infer_complexity_class,
    notation_has_complexity,
)
from tests.contract.oracles.test_recursive_algorithms import (
    INSERTION_SORT_RECURSIVE_PSEUDOCODE,
    RECURSIVE_SELECTION_SORT_PSEUDOCODE,
)

pytestmark = [pytest.mark.contract, pytest.mark.regression]

LINEAR_SEARCH_WHILE = """linearSearch(A, n, x) BEGIN
  i <- 1;
  WHILE (i <= n AND A[i] != x) DO BEGIN
    i <- i + 1;
  END
  IF (i <= n) THEN BEGIN
    RETURN i;
  END
  RETURN -1;
END
"""


class TestReportSymptomsWhile:
    def test_linear_scan_while_worst_not_constant_class(self):
        """Síntoma: Θ(1) incorrecto para barrido lineal con progreso en i."""
        result = analyze_algorithm(LINEAR_SEARCH_WHILE, mode="worst")
        assert result.get("ok"), result.get("errors", [])
        totals = result.get("totals", {}) or {}
        theta = get_notation_from_totals(totals)
        assert theta, "debe haber notación en totals"
        assert infer_complexity_class(theta) != "constant"
        assert notation_has_complexity(
            theta, "linear"
        ), f"worst debe ser al menos lineal en el barrido: {theta}"


class TestReportSymptomsHybridRecursive:
    def test_insertion_recursive_worst_quadratic(self):
        """Síntoma: híbrido decrease-and-conquer + WHILE interno → Θ(n²) worst."""
        result = analyze_algorithm(
            INSERTION_SORT_RECURSIVE_PSEUDOCODE,
            mode="worst",
            algorithm_kind="recursive",
        )
        assert result.get("ok"), result.get("errors", [])
        totals = result.get("totals", {}) or {}
        theta = get_notation_from_totals(totals)
        assert notation_has_complexity(
            theta, "quadratic"
        ), f"insertion recursivo worst debe ser cuadrático: {theta}"

    def test_selection_recursive_worst_quadratic(self):
        """Síntoma: selection recursivo con FOR interno → Θ(n²) worst."""
        result = analyze_algorithm(
            RECURSIVE_SELECTION_SORT_PSEUDOCODE,
            mode="worst",
            algorithm_kind="recursive",
        )
        assert result.get("ok"), result.get("errors", [])
        totals = result.get("totals", {}) or {}
        theta = get_notation_from_totals(totals)
        assert notation_has_complexity(
            theta, "quadratic"
        ), f"selection recursivo worst debe ser cuadrático: {theta}"
