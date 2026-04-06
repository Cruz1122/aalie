import pytest

from app.modules.analysis.service import analyze_algorithm

pytestmark = [pytest.mark.slow, pytest.mark.recursive]

TRIBONACCI = """tribonacci(n) BEGIN
  IF (n <= 2) THEN BEGIN
    RETURN n;
  END
  RETURN tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3);
END
"""


def test_tribonacci_heavy_case_remains_stable():
    result = analyze_algorithm(
        TRIBONACCI, mode="worst", preferred_method="characteristic_equation"
    )
    assert result.get("ok"), result.get("errors", [])
