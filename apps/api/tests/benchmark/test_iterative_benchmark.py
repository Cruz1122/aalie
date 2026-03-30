import time

import pytest

from app.modules.analysis.service import analyze_algorithm

pytestmark = [pytest.mark.benchmark, pytest.mark.slow, pytest.mark.iterative]

SOURCE = """linear(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    x <- i;
  END
END
"""


def test_iterative_benchmark_analysis_time():
    start = time.perf_counter()
    result = analyze_algorithm(SOURCE, mode="all")
    elapsed = time.perf_counter() - start
    assert result.get("ok"), result.get("errors", [])
    assert elapsed < 10
