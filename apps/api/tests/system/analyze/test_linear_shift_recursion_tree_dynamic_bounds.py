#!/usr/bin/env python3
"""
Valida que recurrencias linear_shift multi-rama:
- entren por recursion_tree,
- se etiqueten como cota superior (no equivalente),
- y usen base exponencial dinámica segun la ramificacion.
"""

import re

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


ALGORITHMS = [
    {
        "name": "fibonacci",
        "expected_branch_factor": 2,
        "source": """fibonacci(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN n;
  END
  RETURN fibonacci(n - 1) + fibonacci(n - 2);
END
""",
    },
    {
        "name": "tribonacci",
        "expected_branch_factor": 3,
        "source": """tribonacci(n) BEGIN
  IF (n <= 2) THEN BEGIN
    RETURN n;
  END
  RETURN tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3);
END
""",
    },
    {
        "name": "tetranacci",
        "expected_branch_factor": 4,
        "source": """tetranacci(n) BEGIN
  IF (n <= 3) THEN BEGIN
    RETURN n;
  END
  RETURN tetranacci(n - 1) + tetranacci(n - 2) + tetranacci(n - 3) + tetranacci(n - 4);
END
""",
    },
    {
        "name": "pentanacci",
        "expected_branch_factor": 5,
        "source": """pentanacci(n) BEGIN
  IF (n <= 4) THEN BEGIN
    RETURN n;
  END
  RETURN pentanacci(n - 1) + pentanacci(n - 2) + pentanacci(n - 3) + pentanacci(n - 4) + pentanacci(n - 5);
END
""",
    },
    {
        "name": "weighted_three_branch",
        "expected_branch_factor": 3,
        "source": """weightedThree(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN 1;
  END
  RETURN weightedThree(n - 1) + weightedThree(n - 1) + weightedThree(n - 2);
END
""",
    },
    {
        "name": "weighted_four_branch",
        "expected_branch_factor": 4,
        "source": """weightedFour(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN 1;
  END
  RETURN weightedFour(n - 1) + weightedFour(n - 1) + weightedFour(n - 2) + weightedFour(n - 2);
END
""",
    },
]


@pytest.mark.parametrize("case", ALGORITHMS, ids=[a["name"] for a in ALGORITHMS])
def test_linear_shift_recursion_tree_dynamic_upper_bound(case):
    source = case["source"]
    expected_b = case["expected_branch_factor"]

    detect = client.post("/analyze/detect-methods", json={"source": source})
    assert detect.status_code == 200
    detect_json = detect.json()

    outcomes = detect_json.get("recurrence_info", {}).get("method_outcomes", {})
    assert "recursion_tree" in outcomes, f"recursion_tree not available for {case['name']}"

    rt_outcome = outcomes["recursion_tree"]
    assert rt_outcome.get("bound_kind") == "upper", (
        f"expected bound_kind='upper' for {case['name']}, got {rt_outcome.get('bound_kind')}"
    )
    assert rt_outcome.get("bound_kind") != "equivalent"

    analyze = client.post(
        "/analyze/open",
        json={
            "source": source,
            "mode": "worst",
            "preferred_method": "recursion_tree",
            "locale": "es",
        },
    )
    assert analyze.status_code == 200
    analyze_json = analyze.json()
    assert analyze_json.get("ok"), f"analysis failed for {case['name']}: {analyze_json.get('errors')}"

    totals = analyze_json.get("totals", {})
    recurrence = totals.get("recurrence", {})
    assert recurrence.get("type") == "linear_shift"

    rt = totals.get("recursion_tree", {})
    assert rt, f"missing recursion_tree payload for {case['name']}"

    theta = str(rt.get("theta", ""))
    assert f"{expected_b}^n" in theta, f"theta mismatch for {case['name']}: {theta}"

    summation_expr = str((rt.get("summation") or {}).get("expression", ""))
    assert f"{expected_b}^i" in summation_expr, (
        f"summation base mismatch for {case['name']}: {summation_expr}"
    )

    steps = ((rt.get("step_by_step") or {}).get("steps") or [])
    assert len(steps) == 11, f"expected 11 steps for {case['name']}, got {len(steps)}"

    params_step = next((s for s in steps if s.get("id") == "rt_s3"), {})
    params_latex = str(params_step.get("math", {}).get("primaryLatex", ""))
    assert f"B={expected_b}" in params_latex, (
        f"branch factor mismatch in rt_s3 for {case['name']}: {params_latex}"
    )

    dominant_step = next((s for s in steps if s.get("id") == "rt_s10"), {})
    dominant_latex = str(dominant_step.get("math", {}).get("primaryLatex", ""))
    assert f"{expected_b}^n" in dominant_latex, (
        f"dominant term mismatch for {case['name']}: {dominant_latex}"
    )
    assert f"O({expected_b}^n)" in dominant_latex, (
        f"dominant O notation mismatch for {case['name']}: {dominant_latex}"
    )

    # Guard extra: no debe degradar a Theta en esta rama de cota superior.
    assert re.search(r"\\Theta\(", dominant_latex) is None
