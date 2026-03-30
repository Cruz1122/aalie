import pytest

from app.modules.analysis.service import analyze_algorithm
pytestmark = [pytest.mark.unit, pytest.mark.fast]

SIMPLE_FOR = """simpleFor(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    x <- 1;
  END
END
"""

LINEAR_SEARCH = """linearSearch(A, n, x) BEGIN
  FOR i <- 1 TO n DO BEGIN
    IF (A[i] = x) THEN BEGIN
      RETURN i;
    END
  END
  RETURN -1;
END
"""

NESTED_TRIANGULAR = """nested(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    FOR j <- i TO n DO BEGIN
      x <- x + 1;
    END
  END
END
"""


def test_iterative_worst_case_emits_typed_line_and_case_walkthroughs():
    result = analyze_algorithm(SIMPLE_FOR, mode="worst", locale="es")

    assert result["ok"] is True
    bundle = (result.get("totals") or {}).get("step_by_step") or {}
    assert bundle.get("method") == "iterative_case"
    assert bundle.get("version") == "iter_case_steps_v1"
    assert bundle.get("overallStatus") == "complete"

    steps = bundle.get("steps") or []
    assert [step.get("kind") for step in steps[:3]] == [
        "line_groups_identified",
        "line_counts_summarized",
        "line_cost_sum_built",
    ]
    assert ((steps[0].get("payload") or {}).get("reportable")) is False
    assert ((steps[1].get("payload") or {}).get("reportable")) is False
    assert ((steps[2].get("payload") or {}).get("reportable")) is True
    assert not ((steps[0].get("math") or {}).get("primaryLatex"))
    assert "T(n)" in str((steps[2].get("math") or {}).get("primaryLatex") or "")
    assert str((steps[-1].get("math") or {}).get("primaryLatex") or "").startswith(
        "T(n) ="
    )
    assert [
        item.get("latex") for item in ((steps[-1].get("math") or {}).get("items") or [])
    ] == ["T(n) \\in O(n)", "T(n) \\in \\Omega(n)", "T(n) \\in \\Theta(n)"]
    assert "no crece más rápido" in str(steps[-1].get("conceptNote") or "")
    assert "crece al menos" in str(steps[-1].get("conceptNote") or "")
    assert "subíndice" in str(steps[1].get("conceptNote") or "")

    line_bundles = [
        row.get("step_by_step")
        for row in result.get("byLine", [])
        if row.get("step_by_step")
    ]
    assert line_bundles, "Las filas contables deben incluir walkthrough tipado"
    assert all(bundle.get("method") == "iterative_line" for bundle in line_bundles)
    assert all(
        (bundle.get("steps") or [])[-1].get("kind") == "line_cost_built"
        for bundle in line_bundles
    )
    closed_line_bundle = line_bundles[-1]
    closure_step = (closed_line_bundle.get("steps") or [])[2]
    assert closure_step.get("kind") == "line_count_summation_closed"
    assert "\\sum_{" in str((closure_step.get("math") or {}).get("primaryLatex") or "")
    assert " = n" in str(
        (((closure_step.get("math") or {}).get("items") or [{}])[0]).get("latex") or ""
    )
    assert "subíndice" in str(
        ((closed_line_bundle.get("steps") or [])[1].get("conceptNote") or "")
    )


def test_iterative_average_case_bundle_marks_reportable_steps_from_sum():
    result = analyze_algorithm(LINEAR_SEARCH, mode="all", locale="es")

    assert result["ok"] is True
    avg = result.get("avg")
    assert isinstance(avg, dict)

    bundle = (avg.get("totals") or {}).get("step_by_step") or {}
    assert bundle.get("method") == "iterative_case"

    steps = bundle.get("steps") or []
    assert len(steps) >= 3
    assert ((steps[0].get("payload") or {}).get("reportable")) is False
    assert ((steps[1].get("payload") or {}).get("reportable")) is False
    assert ((steps[2].get("payload") or {}).get("reportable")) is True
    assert not ((steps[0].get("math") or {}).get("primaryLatex"))
    assert not ((steps[1].get("math") or {}).get("primaryLatex"))
    assert "A(n)" in str((steps[2].get("math") or {}).get("primaryLatex") or "")
    assert "E[N_{\\ell}]" in str(steps[1].get("summary") or "")
    assert "subíndice" in str(steps[1].get("conceptNote") or "")


def test_iterative_nested_counts_render_nested_sigmas_instead_of_substack():
    result = analyze_algorithm(NESTED_TRIANGULAR, mode="worst", locale="es")

    assert result["ok"] is True
    accountable_rows = [row for row in result.get("byLine", []) if row.get("ck") != "—"]
    inner_row = next(row for row in accountable_rows if row.get("line") == 4)

    assert "\\substack" not in str(inner_row.get("count_raw") or "")
    assert "\\sum_{i=1}^{n}" in str(inner_row.get("count_raw") or "")
    assert "\\sum_{j=i}^{n}" in str(inner_row.get("count_raw") or "")
    assert "\\left(n + 1\\right)" in str(
        (
            (
                ((inner_row.get("step_by_step") or {}).get("steps") or [{}, {}, {}])[
                    2
                ].get("math")
                or {}
            ).get("items")
            or [{}]
        )[0].get("latex")
        or ""
    )
    assert "\\frac{n \\left(n + 1\\right)}{2}" in str(inner_row.get("count") or "")


def test_iterative_final_line_cost_uses_canonical_factored_form():
    result = analyze_algorithm(NESTED_TRIANGULAR, mode="worst", locale="es")

    assert result["ok"] is True
    accountable_rows = [row for row in result.get("byLine", []) if row.get("ck") != "—"]
    triangular_row = next(row for row in accountable_rows if row.get("line") == 3)
    final_step = ((triangular_row.get("step_by_step") or {}).get("steps") or [])[-1]
    final_latex = str((final_step.get("math") or {}).get("primaryLatex") or "")

    assert "\\frac{3 n \\left(n + 3\\right)}{2}" in final_latex
    assert "\\frac{3 n \\left(n + 3\\right)}{2}" in str(
        triangular_row.get("line_cost_final") or ""
    )

    inner_row = next(row for row in accountable_rows if row.get("line") == 4)
    inner_final_step = ((inner_row.get("step_by_step") or {}).get("steps") or [])[-1]
    inner_final_latex = str(
        (inner_final_step.get("math") or {}).get("primaryLatex") or ""
    )
    assert "n \\cdot \\left(n + 1\\right)" in inner_final_latex
    bundle = (result.get("totals") or {}).get("step_by_step") or {}
    steps = bundle.get("steps") or []
    closed_step = next(
        step for step in steps if step.get("kind") == "line_cost_sum_closed"
    )
    assert "\\frac{3 n \\left(n + 3\\right)}{2}" in str(
        (closed_step.get("math") or {}).get("primaryLatex") or ""
    )
