"""System tests for focused loop-invariant behavior (core lane)."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


def _analyze_loop_invariant(source: str, locale: str = "en"):
    response = client.post(
        "/analyze/open",
        json={
            "source": source,
            "mode": "worst",
            "locale": locale,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "ok" in data
    return data


def _assert_loop_invariant_shape(payload):
    assert "loopInvariant" in payload
    li = payload["loopInvariant"]
    assert "status" in li
    assert "reason" in li
    assert "selectedLoop" in li
    assert "invariant" in li
    assert "didacticSummary" in li
    assert "evidence" in li

    selected = li["selectedLoop"]
    assert {
        "nodeType",
        "lineStart",
        "lineEnd",
        "depth",
        "score",
        "patternType",
    } <= set(selected.keys())


@pytest.mark.parametrize(
    "name,source,expected_patterns,expected_node_type",
    [
        (
            "sum_array",
            """
sumArray(A[n], n) BEGIN
    sum <- 0;
    FOR i <- 1 TO n DO BEGIN
        sum <- sum + A[i];
    END
    RETURN sum;
END
""",
            {"accumulation", "traversal"},
            "FOR",
        ),
        (
            "search_while",
            """
linearSearchWhile(A[n], n, x) BEGIN
    i <- 1;
    WHILE (i <= n) DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
        i <- i + 1;
    END
    RETURN -1;
END
""",
            {"search"},
            "WHILE",
        ),
        (
            "extrema",
            """
minArray(A[n], n) BEGIN
    minVal <- A[1];
    FOR i <- 2 TO n DO BEGIN
        IF (A[i] < minVal) THEN BEGIN
            minVal <- A[i];
        END
    END
    RETURN minVal;
END
""",
            {"extrema"},
            "FOR",
        ),
        (
            "loop_progress_only",
            """
linear(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    x <- 1;
    i <- i + 1;
  END
END
""",
            {"loop_progress_only"},
            "WHILE",
        ),
        (
            "renamed_linear_search",
            """
lookupOdd(_rack_77[n_lim], n_lim, needle_5) BEGIN
    FOR zzCursor_3 <- 1 TO n_lim DO BEGIN
        IF (_rack_77[zzCursor_3] = needle_5) THEN BEGIN
            RETURN zzCursor_3;
        END
    END
    RETURN -1;
END
""",
            {"search"},
            "FOR",
        ),
    ],
)
def test_loop_invariant_core_patterns(
    name, source, expected_patterns, expected_node_type
):
    data = _analyze_loop_invariant(source, locale="en")
    assert data["ok"] is True, name
    _assert_loop_invariant_shape(data)
    selected = data["loopInvariant"]["selectedLoop"]
    assert selected["nodeType"] == expected_node_type, name
    assert selected["patternType"] in expected_patterns, (name, selected["patternType"])


def test_loop_invariant_core_stability_same_input():
    source = """
acc(A[n], n) BEGIN
    sum <- 0;
    FOR i <- 1 TO n DO BEGIN
        sum <- sum + A[i];
    END
    RETURN sum;
END
"""
    first = _analyze_loop_invariant(source, locale="es")
    second = _analyze_loop_invariant(source, locale="es")
    assert (
        first["loopInvariant"]["selectedLoop"]
        == second["loopInvariant"]["selectedLoop"]
    )
    assert first["loopInvariant"]["invariant"] == second["loopInvariant"]["invariant"]
