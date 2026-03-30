import pytest

from app.modules.analysis.service import analyze_algorithm
from tests._support.assertions import notation_has_complexity

pytestmark = [pytest.mark.contract, pytest.mark.oracle, pytest.mark.recursive]

TRIBONACCI = """tribonacci(n) BEGIN
  IF (n <= 2) THEN BEGIN
    RETURN n;
  END
  RETURN tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3);
END
"""


def test_tribonacci_oracle_characteristic():
    result = analyze_algorithm(TRIBONACCI, mode="worst", preferred_method="characteristic_equation")
    assert result.get("ok"), result.get("errors", [])
    char_eq = result.get("totals", {}).get("characteristic_equation", {})
    assert char_eq.get("method") == "characteristic_equation"
    assert notation_has_complexity(char_eq.get("theta", ""), "exponential")
