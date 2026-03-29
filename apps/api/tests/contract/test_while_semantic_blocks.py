from app.modules.analysis.service import analyze_algorithm


BINARY_SEARCH = """binarySearch(A, n, x) BEGIN
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


TERNARY_SEARCH = """ternarySearchIterativo(A[n], n, x) BEGIN
  izq <- 1;
  der <- n;
  WHILE (izq <= der) DO BEGIN
    tercio <- (der - izq) DIV 3;
    m1 <- izq + tercio;
    m2 <- der - tercio;
    IF (A[m1] = x) THEN BEGIN
      RETURN m1;
    END
    IF (A[m2] = x) THEN BEGIN
      RETURN m2;
    END
    IF (x < A[m1]) THEN BEGIN
      der <- m1 - 1;
    END
    ELSE BEGIN
      IF (x > A[m2]) THEN BEGIN
        izq <- m2 + 1;
      END
      ELSE BEGIN
        izq <- m1 + 1;
        der <- m2 - 1;
      END
    END
  END
  RETURN -1;
END
"""


AMBIGUOUS_INTERVAL = """ambiguousInterval(n, step) BEGIN
  left <- 1;
  right <- n;
  WHILE (left <= right) DO BEGIN
    delta <- (right - left) / step;
    left <- left + delta;
  END
END
"""


def _worst_case(source: str) -> dict:
    result = analyze_algorithm(source, mode="all")
    assert result.get("ok", False), result
    return result["worst"]


def test_binary_search_publishes_semantic_while_block_without_t_while():
    worst = _worst_case(BINARY_SEARCH)
    totals = worst["totals"]
    t_open = totals.get("T_open", "")
    while_blocks = totals.get("whileBlocks") or []

    assert "t_while" not in t_open.lower()
    assert while_blocks
    assert while_blocks[0].get("patternUsed") == "binary_search_interval"
    assert while_blocks[0].get("status") == "available"
    assert "log" in str(totals.get("big_theta", "") or totals.get("big_o", "")).lower()
    assert any(row.get("loopBlockRef") == while_blocks[0]["id"] for row in worst["byLine"])


def test_ternary_search_publishes_interval_shrink_logarithmic_block():
    worst = _worst_case(TERNARY_SEARCH)
    totals = worst["totals"]
    t_open = totals.get("T_open", "")
    while_blocks = totals.get("whileBlocks") or []

    assert "t_while" not in t_open.lower()
    assert while_blocks
    assert while_blocks[0].get("patternUsed") == "interval_shrink"
    assert while_blocks[0].get("status") == "available"
    assert "\\log_{3}(n)" == while_blocks[0].get("iterationsExpr")
    assert "log" in str(totals.get("big_theta", "") or totals.get("big_o", "")).lower()


def test_partial_interval_shrink_keeps_structural_t_open_and_no_fake_o1():
    worst = _worst_case(AMBIGUOUS_INTERVAL)
    totals = worst["totals"]
    t_open = totals.get("T_open", "")
    while_blocks = totals.get("whileBlocks") or []

    assert while_blocks
    assert while_blocks[0].get("status") == "partial"
    assert "I_" in t_open
    assert totals.get("T_polynomial") is None
    assert totals.get("big_o") is None
    assert totals.get("big_theta") is None
