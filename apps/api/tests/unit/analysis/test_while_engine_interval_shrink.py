from app.modules.analysis.while_engine.engine import WhileAnalysisInput, WhileEngine
from app.modules.parsing.service import parse_source


def _while_from_source(source: str):
    ast = parse_source(source)["ast"]
    proc = ast["body"][0]
    while_node = next(stmt for stmt in proc["body"]["body"] if stmt["type"] == "While")
    return proc["body"], while_node


def test_binary_search_interval_emits_available_semantic_block():
    parent, while_node = _while_from_source(
        """binarySearch(A, n, x) BEGIN
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
END
"""
    )

    result = WhileEngine().analyze(
        WhileAnalysisInput(while_node=while_node, parent_context=parent, mode="worst")
    )

    assert result.pattern_used == "binary_search_interval"
    assert result.iterations_expr == "\\log_{2}(n)"
    assert result.cost_block is not None
    assert result.cost_block.status == "available"
    assert result.cost_block.evidence_level == "strong"
    assert result.cost_block.iterations_class == "logarithmic"


def test_ternary_search_interval_shrink_emits_available_semantic_block():
    parent, while_node = _while_from_source(
        """ternarySearchIterativo(A[n], n, x) BEGIN
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
END
"""
    )

    result = WhileEngine().analyze(
        WhileAnalysisInput(while_node=while_node, parent_context=parent, mode="worst")
    )

    assert result.pattern_used == "interval_shrink"
    assert result.iterations_expr == "\\log_{3}(n)"
    assert result.cost_block is not None
    assert result.cost_block.status == "available"
    assert result.cost_block.evidence_level == "strong"
    assert result.cost_block.iterations_class == "logarithmic"


def test_interval_shrink_without_proven_factor_degrades_to_partial():
    parent, while_node = _while_from_source(
        """ambiguousInterval(n, step) BEGIN
  left <- 1;
  right <- n;
  WHILE (left <= right) DO BEGIN
    delta <- (right - left) / step;
    left <- left + delta;
  END
END
"""
    )

    result = WhileEngine().analyze(
        WhileAnalysisInput(while_node=while_node, parent_context=parent, mode="worst")
    )

    assert result.pattern_used == "interval_shrink"
    assert result.status == "unknown"
    assert result.iterations_expr is None
    assert result.cost_block is not None
    assert result.cost_block.status == "partial"
    assert result.cost_block.iterations_expr is None
