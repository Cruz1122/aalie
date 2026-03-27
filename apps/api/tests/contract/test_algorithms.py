# tests/integration/test_algorithms.py
"""
Tests de integración para algoritmos completos.
Verifica el análisis de algoritmos complejos como insertion sort y bubble sort.
Usa pseudocode como input y expectativas explícitas de complejidad (auténticos).

Author: @Cruz1122
"""
from app.modules.analysis.service import analyze_algorithm
from tests._support.assertions import (
    assert_all_cases_complexity,
    get_by_line,
)

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

DECREASING_LIMIT_ALIAS = """limiteVariable(n) BEGIN
    k <- n;
    FOR i <- 1 TO n DO BEGIN
        FOR j <- 1 TO k DO BEGIN
            x <- x + 1;
        END
        k <- k - 1;
    END
END
"""


class TestAlgorithms:
    """Tests de integración para algoritmos completos (insertion sort, bubble sort)."""

    def test_insertion_sort_analyzes_successfully(self):
        """Insertion sort debe analizarse correctamente con pipeline completo."""
        result = analyze_algorithm(INSERTION_SORT, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        assert "worst" in result
        worst = result["worst"]
        assert worst.get("ok", False)
        assert "byLine" in worst and len(worst["byLine"]) > 0
        assert "totals" in worst and "T_open" in worst["totals"]
        t_open = worst["totals"]["T_open"]
        assert isinstance(t_open, str) and len(t_open) > 0

    def test_insertion_sort_quadratic_worst(self):
        """Insertion sort: validar todos los casos (worst/avg Θ(n²), best Θ(n) si aplica)."""
        result = analyze_algorithm(INSERTION_SORT, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(
            result, "quadratic", expected_best="linear", expected_avg="quadratic", name="Insertion Sort"
        )

    def test_insertion_sort_by_line_fields(self):
        """Todas las filas de byLine deben tener count_raw, count; ck única; ops cuando > 1."""
        result = analyze_algorithm(INSERTION_SORT, mode="all")
        assert result.get("ok", False)
        by_line = get_by_line(result, "worst")
        has_ops_gt_1 = False
        for row in by_line:
            assert "count_raw" in row, f"Fila {row.get('line')} debe tener count_raw"
            assert "count" in row, f"Fila {row.get('line')} debe tener count"
            assert isinstance(row["count_raw"], str)
            assert isinstance(row["count"], str)
            # ck debe ser única constante (C_k), no suma compuesta como "C_1 + C_2"
            ck = row.get("ck", "")
            assert " + " not in ck, f"ck debe ser única por línea, no suma: {ck}"
            if row.get("ops", 1) > 1:
                has_ops_gt_1 = True
        assert has_ops_gt_1, "Al menos una fila debe tener ops > 1 (ej. asignación con array)"

    def test_bubble_sort_analyzes_successfully(self):
        """Bubble sort debe analizarse correctamente con pipeline completo."""
        result = analyze_algorithm(BUBBLE_SORT, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        assert "worst" in result
        worst = result["worst"]
        assert worst.get("ok", False)
        assert "byLine" in worst and len(worst["byLine"]) > 0
        assert "totals" in worst and "T_open" in worst["totals"]

    def test_bubble_sort_quadratic_worst(self):
        """Bubble sort: validar todos los casos (worst, best, avg)."""
        result = analyze_algorithm(BUBBLE_SORT, mode="all")
        assert result.get("ok", False)
        # Peor caso y caso promedio cuadráticos; mejor caso lineal (lista ya ordenada).
        assert_all_cases_complexity(
            result,
            "quadratic",
            expected_best="quadratic",
            expected_avg="quadratic",
            name="Bubble Sort",
        )

    def test_bubble_sort_no_unknown_in_count(self):
        """Ninguna fila debe tener count 'unknown' (salvo unbounded)."""
        result = analyze_algorithm(BUBBLE_SORT, mode="all")
        assert result.get("ok", False)
        by_line = get_by_line(result, "worst")
        for row in by_line:
            if row.get("unbounded"):
                continue
            count = str(row.get("count", ""))
            assert "unknown" not in count.lower(), (
                f"Línea {row.get('line')} tiene count unknown: {count}"
            )

    def test_decreasing_limit_alias_quadratic(self):
        """FOR con límite decreciente por alias (k <- n; k <- k-1): debe ser Θ(n²)."""
        result = analyze_algorithm(DECREASING_LIMIT_ALIAS, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        assert_all_cases_complexity(result, "quadratic", name="Decreasing limit alias")
