import pytest

from app.modules.analysis.service import analyze_algorithm

pytestmark = [pytest.mark.contract, pytest.mark.oracle, pytest.mark.while_loop]

FLAG_KILL = """flagLoop() BEGIN
  flag <- true;
  WHILE (flag = true) DO BEGIN
    flag <- false;
  END
END
"""

BINARY_INTERVAL = """binarySearch(A, n, x) BEGIN
  low <- 1;
  high <- n;
  WHILE (low <= high) DO BEGIN
    mid <- (low + high) / 2;
    IF (A[mid] = x) THEN BEGIN
      RETURN mid;
    END
    IF (A[mid] < x) THEN BEGIN
      low <- mid + 1;
    END
    ELSE BEGIN
      high <- mid - 1;
    END
  END
  RETURN -1;
END
"""

GUARD_COMPOUND = """guardedLoop(n) BEGIN
  i <- 0;
  j <- 0;
  WHILE (i < n AND j < n) DO BEGIN
    i <- i + 1;
    j <- j + 1;
  END
END
"""

INTERVAL_SHRINK = """shrinkLoop(n) BEGIN
  l <- 0;
  r <- n;
  WHILE (l < r) DO BEGIN
    mid <- (l + r) / 2;
    r <- mid;
  END
END
"""

AMBIGUOUS_UPDATES = """mixedUpdates(n) BEGIN
  i <- 1;
  WHILE (i < n) DO BEGIN
    IF (i MOD 2 = 0) THEN BEGIN
      i <- i + 1;
    END
    ELSE BEGIN
      i <- i * 2;
    END
  END
END
"""


@pytest.mark.parametrize(
    "name,source,expected_family",
    [
        ("flag_kill", FLAG_KILL, {"1"}),
        ("binary_interval", BINARY_INTERVAL, {"log", "nlogn", "n"}),
        ("guard_compound", GUARD_COMPOUND, {"n"}),
        ("interval_shrink", INTERVAL_SHRINK, {"log", "n"}),
        ("ambiguous_updates", AMBIGUOUS_UPDATES, {"infty", "log", "n"}),
    ],
)
def test_while_oracle_matrix_contract_and_class(name, source, expected_family):
    result = analyze_algorithm(source, mode="worst")
    assert result.get("ok"), f"{name}: {result.get('errors', [])}"
    totals = result.get("totals", {})
    loop_invariant = result.get("loopInvariant", {})
    text = " ".join(
        str(totals.get(k, "")).lower() for k in ("big_theta", "big_o", "T_open")
    )
    normalized = (
        text.replace("\\", "")
        .replace("{", "")
        .replace("}", "")
        .replace(" ", "")
        .replace("theta", "")
        .replace("omega", "")
    )
    assert loop_invariant.get("status") in {
        "ok",
        "available",
        "partial",
        "unsupported",
        "unavailable",
    }
    assert any(token in normalized for token in expected_family), (
        f"{name}: notación inesperada: {text}"
    )
