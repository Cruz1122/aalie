import pytest

from app.modules.analysis.service import analyze_algorithm
from app.modules.analysis.while_engine.engine import WhileAnalysisInput, WhileEngine
from app.modules.parsing.service import parse_source

pytestmark = [pytest.mark.unit, pytest.mark.fast]


GNOME_SORT = """gnomeSort(A[n], n) BEGIN
  i <- 2;
  WHILE (i <= n) DO BEGIN
    IF (i = 1) THEN BEGIN
      i <- i + 1;
    END
    ELSE BEGIN
      IF (A[i] >= A[i - 1]) THEN BEGIN
        i <- i + 1;
      END
      ELSE BEGIN
        temp <- A[i];
        A[i] <- A[i - 1];
        A[i - 1] <- temp;
        i <- i - 1;
      END
    END
  END
  RETURN 0;
END
"""


def _while_from_source(source: str):
    ast = parse_source(source)["ast"]
    proc = ast["body"][0]
    while_node = next(stmt for stmt in proc["body"]["body"] if stmt["type"] == "While")
    return proc["body"], while_node


def test_gnome_sort_pattern_emits_quadratic_semantic_block_in_worst_case():
    parent, while_node = _while_from_source(GNOME_SORT)

    result = WhileEngine().analyze(
        WhileAnalysisInput(while_node=while_node, parent_context=parent, mode="worst")
    )

    assert result.pattern_used == "gnome_sort_cursor"
    assert result.reason_code == "while_gnome_sort_cursor"
    assert result.iterations_expr == "n^2"
    assert result.cost_block is not None
    assert result.cost_block.status == "available"
    assert result.cost_block.iterations_class == "quadratic"


def test_gnome_sort_analysis_keeps_best_linear_and_avoids_infinite_worst_avg():
    result = analyze_algorithm(GNOME_SORT, mode="all")

    assert result.get("ok"), result.get("errors", [])

    worst = result["worst"]["totals"]
    best = result["best"]["totals"]
    avg = result["avg"]["totals"]

    assert worst.get("big_theta") in {"\\Theta(n^2)", "\\Theta(n^{2})"}
    assert avg.get("big_theta") in {"\\Theta(n^2)", "\\Theta(n^{2})"}
    assert best.get("big_theta") == "\\Theta(n)"

    assert worst.get("whileBlocks")[0].get("patternUsed") == "gnome_sort_cursor"
    assert avg.get("whileBlocks")[0].get("patternUsed") == "gnome_sort_cursor"
    assert worst.get("big_theta") != "\\infty"
    assert avg.get("big_theta") != "\\infty"
