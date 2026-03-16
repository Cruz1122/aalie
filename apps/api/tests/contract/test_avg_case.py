# tests/integration/test_avg_case.py
"""
Tests de integración para caso promedio (average case analysis).
Usa pseudocode como input y verifica expectedRuns, A_of_n, avg_model_info.

Author: @Cruz1122
"""
import pytest
from app.modules.analysis.service import analyze_algorithm
from tests._support.assertions import notation_has_complexity


LINEAR_SEARCH = """linearSearch(A, n, x) BEGIN
  FOR i <- 1 TO n DO BEGIN
    IF (A[i] = x) THEN BEGIN
      RETURN i;
    END
  END
  RETURN -1;
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

SIMPLE_FOR = """simpleFor(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    x <- 1;
  END
END
"""

IF_BOTH_BRANCHES = """ifBoth(x) BEGIN
  IF (x > 0) THEN BEGIN
    y <- 1;
  END
  ELSE BEGIN
    y <- 0;
  END
END
"""

SIMPLE_ASSIGN = """simpleAssign() BEGIN
  x <- 1;
END
"""


class TestAvgCase:
    """Tests para análisis de caso promedio (auténticos con pseudocode)."""

    def test_linear_search_avg_has_expected_runs_and_a_of_n(self):
        """Búsqueda lineal avg debe tener expectedRuns y A_of_n con n."""
        result = analyze_algorithm(LINEAR_SEARCH, mode="all")
        assert result.get("ok", False)
        avg = result.get("avg")
        assert avg != "same_as_worst", "Linear search tiene variabilidad"
        assert isinstance(avg, dict)
        for row in avg.get("byLine", []):
            assert "expectedRuns" in row
            assert isinstance(row["expectedRuns"], str)
        totals = avg.get("totals", {})
        assert "avg_model_info" in totals
        assert "A_of_n" in totals
        a_of_n = totals.get("A_of_n", "")
        assert "n" in a_of_n.lower() or "frac" in a_of_n.lower(), (
            f"A_of_n debe contener n o fracción: {a_of_n}"
        )

    def test_linear_search_avg_has_model_info(self):
        """Búsqueda lineal avg debe tener avg_model_info con mode y note."""
        result = analyze_algorithm(LINEAR_SEARCH, mode="all")
        assert result.get("ok", False)
        avg = result.get("avg")
        if isinstance(avg, dict):
            model_info = avg.get("totals", {}).get("avg_model_info", {})
            assert "mode" in model_info
            assert "note" in model_info

    def test_bubble_sort_avg_quadratic(self):
        """Bubble sort avg case debe ser Θ(n²)."""
        result = analyze_algorithm(BUBBLE_SORT, mode="all")
        assert result.get("ok", False)
        avg = result.get("avg")
        if avg != "same_as_worst" and isinstance(avg, dict):
            totals = avg.get("totals", {})
            big_theta = totals.get("big_theta", "") or totals.get("big_o", "")
            assert notation_has_complexity(big_theta, "quadratic"), (
                f"Bubble sort avg debe ser Θ(n²): {big_theta}"
            )

    def test_bubble_sort_avg_has_expected_runs(self):
        """Bubble sort avg debe tener expectedRuns en cada fila."""
        result = analyze_algorithm(BUBBLE_SORT, mode="all")
        assert result.get("ok", False)
        avg = result.get("avg")
        if avg != "same_as_worst" and isinstance(avg, dict):
            for row in avg.get("byLine", []):
                assert "expectedRuns" in row

    def test_simple_for_avg_has_expected_runs(self):
        """FOR simple en avg debe tener expectedRuns."""
        result = analyze_algorithm(SIMPLE_FOR, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        assert result.get("ok", False)
        assert "byLine" in result
        for row in result["byLine"]:
            assert "expectedRuns" in row

    def test_if_with_probability_avg_case(self):
        """IF con ambas ramas en avg debe tener expectedRuns en guardia, then y else."""
        result = analyze_algorithm(IF_BOTH_BRANCHES, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        assert result.get("ok", False)
        rows = result.get("byLine", [])
        assert len(rows) >= 3
        for row in rows:
            assert "expectedRuns" in row

    def test_symbolic_model_avg_case(self):
        """Modelo simbólico debe tener avg_model_info con mode symbolic."""
        result = analyze_algorithm(SIMPLE_ASSIGN, mode="avg", avg_model={"mode": "symbolic", "predicates": {}})
        assert result.get("ok", False)
        totals = result.get("totals", {})
        assert "avg_model_info" in totals
        model_info = totals["avg_model_info"]
        assert model_info["mode"] == "symbolic"
        note = model_info.get("note", "").lower()
        assert "symbolic" in note or "simbólico" in note, f"note debe mencionar symbolic: {note}"

    def test_avg_case_has_a_of_n(self):
        """Caso promedio con FOR debe tener A_of_n en totals."""
        result = analyze_algorithm(SIMPLE_FOR, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        assert result.get("ok", False)
        totals = result.get("totals", {})
        assert "A_of_n" in totals
        assert "avg_model_info" in totals

    def test_linear_search_avg_foundation_well_founded(self):
        """Búsqueda lineal avg debe tener avg_foundation=well_founded (Modelo A, fórmulas cerradas)."""
        result = analyze_algorithm(LINEAR_SEARCH, mode="all")
        assert result.get("ok", False)
        avg = result.get("avg")
        assert avg != "same_as_worst" and isinstance(avg, dict)
        totals = avg.get("totals", {})
        assert "avg_foundation" in totals
        assert totals["avg_foundation"] == "well_founded", (
            f"Búsqueda lineal debe ser well_founded: {totals.get('avg_foundation')}"
        )

    def test_linear_search_avg_formula_contains_n_plus_1_over_2(self):
        """Búsqueda lineal A(n) debe contener (n+1)/2 o equivalente (E[iter] estándar)."""
        result = analyze_algorithm(LINEAR_SEARCH, mode="all")
        assert result.get("ok", False)
        avg = result.get("avg")
        assert avg != "same_as_worst" and isinstance(avg, dict)
        a_of_n = avg.get("totals", {}).get("A_of_n", "")
        t_poly = avg.get("totals", {}).get("T_polynomial", "")
        combined = (a_of_n + " " + t_poly).lower()
        # Debe contener n+1/2, (n+1)/2, frac con n, o similar
        has_expected = (
            "n+1" in combined or "n + 1" in combined
            or "frac" in combined
            or "n/2" in combined
        )
        assert has_expected, (
            f"A(n) o T_polynomial debe reflejar E[iter]=(n+1)/2: A_of_n={a_of_n}, T_polynomial={t_poly}"
        )

    def test_avg_unbounded_has_approximate_foundation(self):
        """Algoritmo con WHILE unbounded en avg debe tener avg_foundation=approximate."""
        source = """whileLoopExample(flag) BEGIN
    i <- 1;
    WHILE (i <= 10) DO BEGIN
        IF (flag = 1) THEN BEGIN
            i <- i + 1;
        END
    END
END
"""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False)
        avg = result.get("avg")
        if avg != "same_as_worst" and isinstance(avg, dict):
            totals = avg.get("totals", {})
            if "avg_foundation" in totals:
                assert totals["avg_foundation"] == "approximate", (
                    f"WHILE unbounded en avg debe ser approximate: {totals.get('avg_foundation')}"
                )
