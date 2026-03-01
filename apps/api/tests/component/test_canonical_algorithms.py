"""
Tests de component: hasta 15 algoritmos canónicos para el daily gate.
Carga pseudocódigo desde _support/algorithms/ y valida con _support.assertions.
"""
import pytest
from app.modules.analysis.service import analyze_algorithm
from tests._support.assertions import (
    assert_all_cases_complexity,
    assert_has_asymptotic_notation,
    assert_no_unknown_counts,
    get_totals,
)
from tests._support.loaders import load_algorithm

# (family, name, expected_worst_complexity)
CANONICAL = [
    ("math", "linear_search", "linear"),
    ("sorting", "insertion_sort", "quadratic"),
    ("sorting", "bubble_sort", "quadratic"),
    ("math", "while_linear", "linear"),
    ("math", "while_log", "log"),
    ("math", "euclides", "log"),
    ("divide_conquer", "merge_sort", "nlogn"),
    ("divide_conquer", "binary_search_recursive", "log"),
    ("math", "triangular_loops", "quadratic"),
    ("math", "rectangular_loops", "quadratic"),
]

# Best case teórico cuando difiere de worst (teoría de algoritmos)
BEST_BY_ALGORITHM = {
    "linear_search": "constant",
    "insertion_sort": "linear",
    "binary_search_recursive": "constant",
}


@pytest.mark.component
class TestCanonicalAlgorithms:
    """Algoritmos canónicos: análisis exitoso y complejidad esperada."""

    @pytest.mark.parametrize("family,name,expected", CANONICAL, ids=[f[1] for f in CANONICAL])
    def test_canonical_analyzes_successfully(self, family, name, expected):
        # Arrange
        source = load_algorithm(family, name)
        # Act
        result = analyze_algorithm(source, mode="all")
        # Assert
        assert result.get("ok"), f"{family}/{name}: {result.get('errors', [])}"
        assert "worst" in result

    @pytest.mark.parametrize("family,name,expected", CANONICAL, ids=[f[1] for f in CANONICAL])
    def test_canonical_worst_has_complexity(self, family, name, expected):
        # Arrange
        source = load_algorithm(family, name)
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok"), f"{family}/{name}: analizador falló: {result.get('errors', [])}"
        # Assert: validar todos los casos (worst, best, avg); best según teoría cuando difiere
        expected_best = BEST_BY_ALGORITHM.get(name, expected)
        assert_all_cases_complexity(result, expected, expected_best=expected_best, name=f"{family}/{name}")

    @pytest.mark.parametrize("family,name,expected", CANONICAL[:6], ids=[f[1] for f in CANONICAL[:6]])
    def test_canonical_has_asymptotic_notation(self, family, name, expected):
        source = load_algorithm(family, name)
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok"), f"{family}/{name}: analizador falló: {result.get('errors', [])}"
        totals = get_totals(result, "worst")
        assert totals, f"{family}/{name}: sin totals"
        assert_has_asymptotic_notation(result, "worst")
