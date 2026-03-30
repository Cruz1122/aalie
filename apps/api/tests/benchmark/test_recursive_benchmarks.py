import time

import pytest

from app.modules.analysis.service import analyze_algorithm

TRIBONACCI_RECURSIVE_PSEUDOCODE = """tribonacci(n) BEGIN
  IF (n <= 2) THEN BEGIN
    RETURN n;
  END
  RETURN tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3);
END
"""

pytestmark = [pytest.mark.slow, pytest.mark.benchmark, pytest.mark.recursive]


def test_tribonacci_characteristic_runtime_regression_guard():
    """Guard no bloqueante de rendimiento para evitar regresión extrema en Tribonacci."""
    start = time.perf_counter()
    result = analyze_algorithm(
        TRIBONACCI_RECURSIVE_PSEUDOCODE,
        mode="worst",
        preferred_method="characteristic_equation",
    )
    elapsed = time.perf_counter() - start

    assert result.get("ok"), result.get("errors", [])