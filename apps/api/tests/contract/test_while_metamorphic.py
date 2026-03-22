"""
Pruebas metamórficas para el motor WHILE.

Verifican que renombrar variables no cambie el resultado del análisis.
Los asserts van contra estructura semántica, no contra frases traducidas.

Author: @Cruz1122
Version: 0.1.0
"""
import pytest
from app.modules.analysis.service import analyze_algorithm
from tests._support.assertions import get_totals


@pytest.mark.contract
@pytest.mark.while_domain
class TestWhileMetamorphic:
    """Pruebas metamórficas: renombrar variables no cambia clasificación."""

    def _analyze_and_get_notation(self, source: str, case: str = "worst") -> str:
        """Analiza y retorna la notación asintótica del caso indicado."""
        result = analyze_algorithm(source, mode="all", locale="en")
        if not result.get("ok"):
            return ""
        totals = get_totals(result, case)
        return totals.get("big_theta") or totals.get("big_o") or totals.get("big_omega") or ""

    def _analyze_and_get_status(self, source: str, case: str = "worst") -> str:
        """Analiza y retorna status (bounded/unbounded) si está disponible."""
        notation = self._analyze_and_get_notation(source, case)
        if not notation:
            return "unknown"
        if "O(" in notation or "Θ(" in notation or "Ω(" in notation or "theta" in notation.lower():
            return "bounded"
        if "∞" in notation or "infinity" in notation.lower():
            return "unbounded"
        return "bounded" if notation else "unknown"

    def test_linear_counter_rename_i_to_indice_limite(self):
        """Renombrar i por indiceLimite no cambia O(n)."""
        original = """linear(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    i <- i + 1;
  END
END
"""
        renamed = """linear(n) BEGIN
  indiceLimite <- 0;
  WHILE (indiceLimite < n) DO BEGIN
    indiceLimite <- indiceLimite + 1;
  END
END
"""
        orig_notation = self._analyze_and_get_notation(original)
        ren_notation = self._analyze_and_get_notation(renamed)
        # Ambos deben ser O(n) o equivalente (lineal)
        assert "n" in orig_notation or "1" in orig_notation, f"Original: {orig_notation}"
        assert "n" in ren_notation or "1" in ren_notation, f"Renamed: {ren_notation}"
        # Misma clase de complejidad (lineal vs lineal)
        orig_linear = "n" in orig_notation and "n^" not in orig_notation
        ren_linear = "n" in ren_notation and "n^" not in ren_notation
        assert orig_linear == ren_linear

    def test_flag_rename_to_seguir(self):
        """Renombrar flag por seguir no cambia bounded."""
        original = """flagTest() BEGIN
  flag <- TRUE;
  WHILE (flag) DO BEGIN
    flag <- FALSE;
  END
END
"""
        renamed = """flagTest() BEGIN
  seguir <- TRUE;
  WHILE (seguir) DO BEGIN
    seguir <- FALSE;
  END
END
"""
        orig_status = self._analyze_and_get_status(original)
        ren_status = self._analyze_and_get_status(renamed)
        assert orig_status == ren_status
