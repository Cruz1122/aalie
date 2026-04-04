from __future__ import annotations

from typing import Any, Optional

from tests._support.assertions import assert_all_cases_complexity


def assert_analysis_oracle(
    result: dict[str, Any],
    *,
    expected_worst: str,
    expected_best: Optional[str] = None,
    expected_avg: Optional[str] = None,
    name: str = "",
) -> None:
    """Canonical oracle assertion for semantic complexity expectations."""
    assert result.get(
        "ok"
    ), f"{name}: analyze_algorithm failed: {result.get('errors', [])}"
    assert_all_cases_complexity(
        result,
        expected_worst,
        expected_best=expected_best,
        expected_avg=expected_avg,
        name=name,
    )
