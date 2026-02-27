"""
Tests de variaciones para verificar notación de bucles WHILE (bounded vs unbounded).

Verifica que la detección de bucles infinitos sea correcta: solo unbounded cuando
las variables de control NO mutan. Bubble sort mejorado con ordenado debe ser bounded.

Author: @Cruz1122
"""
import pytest
from app.modules.analysis.service import analyze_algorithm
from tests.integration.fixtures.algorithm_expectations import (
    assert_worst_complexity,
    get_by_line,
)


# --- Casos BOUNDED (variable de control muta) ---

BUBBLE_SORT_MEJORADO = """burbujaMejorada(A, n) BEGIN
  ordenado <- false;
  WHILE (ordenado = false) DO BEGIN
    ordenado <- true;
    FOR i <- 1 TO n - 1 DO BEGIN
      IF (A[i] > A[i + 1]) THEN BEGIN
        temp <- A[i];
        A[i] <- A[i + 1];
        A[i + 1] <- temp;
        ordenado <- false;
      END
    END
  END
END
"""

WHILE_FLAG_KILL = """flagLoop() BEGIN
  flag <- true;
  WHILE (flag = true) DO BEGIN
    flag <- false;
  END
END
"""

WHILE_ORDENADO_FALSE_KILL = """ordenadoKill() BEGIN
  ordenado <- false;
  WHILE (ordenado = false) DO BEGIN
    ordenado <- true;
  END
END
"""

WHILE_INCREMENT_MUST = """linear(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    x <- 1;
    i <- i + 1;
  END
END
"""


# --- Casos UNBOUNDED (variable de control no muta) ---

WHILE_FLAG_NO_KILL = """flagNoKill() BEGIN
  flag <- true;
  WHILE (flag = true) DO BEGIN
    x <- x + 1;
  END
END
"""

WHILE_NO_PROGRESS_MUST = """noProgress(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    IF (p) THEN BEGIN
      i <- i + 1;
    END
  END
END
"""


class TestWhileLoopNotationBounded:
    """Tests para bucles WHILE que deben ser BOUNDED (variable muta)."""

    def test_bubble_sort_mejorado_bounded(self):
        """Bubble sort mejorado: ordenado muta (true al inicio, false en swap) → bounded."""
        result = analyze_algorithm(BUBBLE_SORT_MEJORADO, mode="all")
        assert result.get("ok", False), f"Análisis falló: {result.get('errors', [])}"
        by_line = get_by_line(result, "worst")
        while_rows = [r for r in by_line if r.get("kind") == "while"]
        assert len(while_rows) > 0, "Debe haber al menos una fila WHILE"
        for wr in while_rows:
            assert not wr.get("unbounded", False), (
                f"Bubble sort mejorado: WHILE en línea {wr.get('line')} NO debe ser unbounded. "
                f"La variable ordenado muta (ordenado <- true en must)."
            )

    def test_bubble_sort_mejorado_not_constant(self):
        """Bubble sort mejorado worst case debe ser al menos O(n) (no O(1))."""
        result = analyze_algorithm(BUBBLE_SORT_MEJORADO, mode="all")
        assert result.get("ok", False)
        # El analizador puede devolver O(n) o O(n²) según cómo modele el while bounded.
        # Lo importante: no debe ser O(1) (el bucle interno FOR es O(n)).
        assert_worst_complexity(result, "linear", "Bubble Sort Mejorado")

    def test_while_flag_kill_bounded(self):
        """WHILE flag=true con flag <- false (must) → bounded."""
        result = analyze_algorithm(WHILE_FLAG_KILL, mode="all")
        assert result.get("ok", False)
        by_line = get_by_line(result, "worst")
        while_rows = [r for r in by_line if r.get("kind") == "while"]
        assert len(while_rows) > 0
        for wr in while_rows:
            assert not wr.get("unbounded", False), (
                f"WHILE flag kill debe ser bounded: {wr}"
            )

    def test_while_ordenado_false_kill_bounded(self):
        """WHILE ordenado=false con ordenado <- true (must) → bounded."""
        result = analyze_algorithm(WHILE_ORDENADO_FALSE_KILL, mode="all")
        assert result.get("ok", False)
        by_line = get_by_line(result, "worst")
        while_rows = [r for r in by_line if r.get("kind") == "while"]
        assert len(while_rows) > 0
        for wr in while_rows:
            assert not wr.get("unbounded", False), (
                f"WHILE ordenado=false con ordenado<-true debe ser bounded: {wr}"
            )

    def test_while_increment_must_bounded(self):
        """WHILE i<n con i <- i+1 (must) → bounded."""
        result = analyze_algorithm(WHILE_INCREMENT_MUST, mode="all")
        assert result.get("ok", False)
        by_line = get_by_line(result, "worst")
        while_rows = [r for r in by_line if r.get("kind") == "while"]
        assert len(while_rows) > 0
        for wr in while_rows:
            assert not wr.get("unbounded", False), (
                f"WHILE i<n con i<-i+1 debe ser bounded: {wr}"
            )


class TestWhileLoopNotationUnbounded:
    """Tests para bucles WHILE que deben ser UNBOUNDED (variable no muta)."""

    def test_while_flag_no_kill_unbounded(self):
        """WHILE flag=true sin tocar flag en cuerpo → unbounded."""
        result = analyze_algorithm(WHILE_FLAG_NO_KILL, mode="all")
        assert result.get("ok", False)
        by_line = get_by_line(result, "worst")
        while_rows = [r for r in by_line if r.get("kind") == "while"]
        assert len(while_rows) > 0
        for wr in while_rows:
            assert wr.get("unbounded", False), (
                f"WHILE flag=true sin kill debe ser unbounded: {wr}"
            )

    def test_while_no_progress_must_unbounded(self):
        """WHILE i<n con i<-i+1 solo en IF (may, no must) → unbounded."""
        result = analyze_algorithm(WHILE_NO_PROGRESS_MUST, mode="all")
        assert result.get("ok", False)
        by_line = get_by_line(result, "worst")
        while_rows = [r for r in by_line if r.get("kind") == "while"]
        assert len(while_rows) > 0
        for wr in while_rows:
            assert wr.get("unbounded", False), (
                f"WHILE i<n con update solo en rama condicional debe ser unbounded: {wr}"
            )
