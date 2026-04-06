"""System integration tests for loop-invariant within full analysis pipeline."""

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = [pytest.mark.system, pytest.mark.slow]

client = TestClient(app)


def _analyze(source: str, locale: str = "en"):
    response = client.post(
        "/analyze/open",
        json={
            "source": source,
            "mode": "all",
            "locale": locale,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert "ok" in data
    return data


def test_mode_all_exposes_loop_invariant_only_top_level():
    source = """
scan(A[n], n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        x <- A[i];
    END
END
"""
    data = _analyze(source, locale="en")
    assert data["ok"] is True
    assert "loopInvariant" in data
    assert "worst" in data
    assert "best" in data
    assert "loopInvariant" not in data["worst"]


@pytest.mark.parametrize(
    "name,source,expected_pattern",
    [
        (
            "selection_prefix_sorted",
            """
selectionSort(A, n) BEGIN
  FOR i <- 1 TO n - 1 DO BEGIN
    min_idx <- i;
    FOR j <- i + 1 TO n DO BEGIN
      IF (A[j] < A[min_idx]) THEN BEGIN
        min_idx <- j;
      END
    END
    IF (min_idx != i) THEN BEGIN
      temp <- A[i];
      A[i] <- A[min_idx];
      A[min_idx] <- temp;
    END
  END
END
""",
            "selection_prefix_sorted",
        ),
        (
            "insertion_prefix_sorted",
            """
insertionSort(arr, n) BEGIN
  FOR i <- 2 TO n DO BEGIN
    key <- arr[i];
    j <- i - 1;
    WHILE (j >= 1 AND arr[j] > key) DO BEGIN
      arr[j + 1] <- arr[j];
      j <- j - 1;
    END
    arr[j + 1] <- key;
  END
END
""",
            "insertion_prefix_sorted",
        ),
    ],
)
def test_loop_invariant_integration_heavy_patterns(name, source, expected_pattern):
    data = _analyze(source, locale="en")
    assert data["ok"] is True, name
    selected = data["loopInvariant"]["selectedLoop"]
    assert selected["patternType"] == expected_pattern, (name, selected)
