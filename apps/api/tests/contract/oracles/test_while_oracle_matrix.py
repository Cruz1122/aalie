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
    "name,source,expected_theta,expected_pattern,expected_block_status,expected_iteration_class,expected_invariant_pattern",
    [
        (
            "flag_kill",
            FLAG_KILL,
            "\\Theta(1)",
            "flag_kill",
            "available",
            "constant",
            "loop_progress_only",
        ),
        (
            "binary_interval",
            BINARY_INTERVAL,
            "\\Theta(\\log(x))",
            "binary_search_interval",
            "available",
            "logarithmic",
            "binary_search_interval",
        ),
        (
            "guard_compound",
            GUARD_COMPOUND,
            "\\Theta(n)",
            "linear_counter",
            "available",
            "linear",
            "loop_progress_only",
        ),
        (
            "interval_shrink",
            INTERVAL_SHRINK,
            "\\Theta(\\frac{\\\\log{\\left(n \\right)}}{\\\\log{\\left(2 \\right)}})",
            "binary_search_interval",
            "available",
            "logarithmic",
            "loop_progress_only",
        ),
        (
            "ambiguous_updates",
            AMBIGUOUS_UPDATES,
            "\\infty",
            None,
            "unbounded",
            None,
            "loop_progress_only",
        ),
    ],
)
def test_while_oracle_matrix_contract_and_class(
    name,
    source,
    expected_theta,
    expected_pattern,
    expected_block_status,
    expected_iteration_class,
    expected_invariant_pattern,
):
    result = analyze_algorithm(source, mode="worst")
    assert result.get("ok"), f"{name}: {result.get('errors', [])}"
    totals = result.get("totals", {})
    loop_invariant = result.get("loopInvariant", {})
    while_blocks = totals.get("whileBlocks") or []
    assert while_blocks, f"{name}: whileBlocks ausente"
    primary_block = while_blocks[0]

    assert totals.get("big_theta") == expected_theta
    assert primary_block.get("patternUsed") == expected_pattern
    assert primary_block.get("status") == expected_block_status
    assert primary_block.get("iterationsClass") == expected_iteration_class
    assert loop_invariant.get("status") == "ok"
    assert (
        loop_invariant.get("selectedLoop", {}).get("patternType")
        == expected_invariant_pattern
    )
