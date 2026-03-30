import pytest

from app.modules.export.document_model import (
    _build_changes,
    _build_count_summation_expression,
    _build_gpu_cpu_blocks,
    _build_line_cost_table,
    _build_relevant_state_snapshot,
    _build_state_change_text,
    _build_step_context,
    _build_total_cost_expression,
    _clean_sentence,
    _confidence_descriptor,
    _ensure_tn_prefix,
    _event_label,
    _explain_pattern_name,
    _extract_selected_loop_lines,
    _format_linear_expression,
    _format_state_value,
    _parse_linear_count_expression,
    _pedagogical_hardware_reason,
    _pick_relevant_state_variable_names,
    _pick_stable_trace_inputs,
    _stable_value_fingerprint,
    _strip_leading_label,
    _wrap_summation_term,
)


pytestmark = [pytest.mark.unit, pytest.mark.fast, pytest.mark.export]

from app.modules.export.i18n import get_export_i18n


def test_line_cost_table_and_expression_helpers_cover_linear_paths():
    table_es = _build_line_cost_table(
        [
            {"line": 1, "kind": "assign", "ck": "C1", "count_raw": "n", "count": "n"},
            "bad-row",
        ],
        get_export_i18n("es"),
    )
    table_en = _build_line_cost_table([], get_export_i18n("en"))

    assert table_es.headers[0] == "Línea"
    assert table_es.rows == [["1", "assign", "C1", "n", "n"]]
    assert table_en.headers[0] == "Line"

    assert _wrap_summation_term("a+b") == "(a+b)"
    assert _wrap_summation_term("n") == "n"
    assert _wrap_summation_term("") == "0"

    assert _parse_linear_count_expression("n") == {"nCoeff": 1, "constant": 0}
    assert _parse_linear_count_expression("-n") == {"nCoeff": -1, "constant": 0}
    assert _parse_linear_count_expression("3n+2") == {"nCoeff": 3, "constant": 2}
    assert _parse_linear_count_expression("7") == {"nCoeff": 0, "constant": 7}
    assert _parse_linear_count_expression("x^2") is None

    assert _format_linear_expression({"nCoeff": 0, "constant": 0}) == "0"
    assert _format_linear_expression({"nCoeff": 1, "constant": -2}) == "n - 2"

    simplified = _build_count_summation_expression(
        [
            {"count": "n"},
            {"count": "2n+1"},
            {"count": "3"},
        ]
    )
    non_linear = _build_count_summation_expression(
        [
            {"count": "n"},
            {"count": "log n"},
        ]
    )

    assert simplified["structural"] == "n + (2n+1) + 3"
    assert simplified["simplified"] == "3n + 4"
    assert non_linear["simplified"] is None

    assert _build_total_cost_expression([]) == "T(n) = 0"
    assert (
        _build_total_cost_expression(
            [
                {"ck": "C1", "count": "n"},
                {"ck": "C2", "count_raw": "n-1"},
            ]
        )
        == "T(n) = C1\\left(n\\right) + C2\\left(n-1\\right)"
    )

    assert _ensure_tn_prefix("n + 1") == "T(n) = n + 1"
    assert _ensure_tn_prefix("T(n)=n+1") == "T(n)=n+1"


def test_loop_line_extraction_and_label_stripping():
    pseudocode = "a <- 1\nb <- 2\nWHILE x\nEND"

    assert _extract_selected_loop_lines(pseudocode, {"lineStart": 2, "lineEnd": 3}) == [
        {"lineNumber": 2, "text": "b <- 2"},
        {"lineNumber": 3, "text": "WHILE x"},
    ]
    assert (
        _extract_selected_loop_lines(pseudocode, {"lineStart": 4, "lineEnd": 2}) == []
    )
    assert _extract_selected_loop_lines(pseudocode, None) == []

    stripped = _strip_leading_label(
        "Resumen:  Dominante: O(n)", ["Resumen", "Dominante"]
    )
    assert stripped == "O(n)"


def test_state_and_trace_helpers_cover_change_and_stability_logic():
    steps = [
        {
            "stepNumber": 1,
            "eventKind": "loop_enter",
            "variables": {"i": 0, "n": 10, "const": 42},
            "variablesChanged": {},
            "iteration": {
                "loopVar": "i",
                "currentValue": 0,
                "maxValue": 10,
                "iteration": 1,
            },
            "description": "entry",
        },
        {
            "stepNumber": 2,
            "eventKind": "loop_iter_enter",
            "variables": {"i": 1, "n": 10, "const": 42},
            "variablesChanged": {"i": 1},
            "iteration": {
                "loopVar": "i",
                "currentValue": 1,
                "maxValue": 10,
                "iteration": 2,
            },
            "description": "iter",
        },
        {
            "stepNumber": 3,
            "eventKind": "assign",
            "variables": {"i": 2, "n": 10, "const": 42},
            "variablesChanged": {"i": 2},
            "iteration": {},
            "description": "assignment",
        },
    ]

    previous = steps[0]
    current = steps[1]

    assert _format_state_value(None) == "null"
    assert _format_state_value("__undefined__") == "-"
    assert _format_state_value([1, 2, 3, 4, 5, 6]).startswith("[1, 2, 3, 4, 5")
    assert _format_state_value({"a": 1, "b": 2, "c": 3, "d": 4}).startswith("{a:1")

    assert _event_label("assign", get_export_i18n("es")) == "Actualización"
    assert _event_label("unknown_event", get_export_i18n("en")) == "unknown_event"

    changes = _build_changes(current, previous)
    assert changes == [{"name": "i", "before": 0, "after": 1}]
    assert _build_changes({**current, "variablesChanged": {}}, previous) == []

    relevant = _pick_relevant_state_variable_names(
        {"controlVariables": ["i"], "stateVariables": ["n"]},
        steps,
    )
    assert relevant[0] == "i"
    assert "n" in relevant

    snapshot_changed = _build_relevant_state_snapshot(current, ["i", "n"], previous)
    snapshot_unchanged = _build_relevant_state_snapshot(current, ["n"], previous)
    assert snapshot_changed == "i=1, n=10"
    assert snapshot_unchanged == "-"

    assert _stable_value_fingerprint({"b": 2, "a": 1}) == '{"a": 1, "b": 2}'
    assert _stable_value_fingerprint(set([1, 2])) in {"{1, 2}", "{2, 1}"}

    stable_inputs = _pick_stable_trace_inputs(steps, excluded_names={"i"})
    stable_names = {item["name"] for item in stable_inputs}
    assert "const" in stable_names
    assert "n" in stable_names
    assert "i" not in stable_names

    context_enter = _build_step_context(steps[0], get_export_i18n("en"))
    context_iter = _build_step_context(steps[1], get_export_i18n("es"))
    context_fallback = _build_step_context(steps[2], get_export_i18n("en"))

    assert context_enter == "i=0..10"
    assert "iteración 2" in context_iter
    assert context_fallback == "assignment"

    assert _build_state_change_text(current, previous) == "i: 0 -> 1"
    assert (
        _build_state_change_text({**current, "variablesChanged": {}}, previous) == "-"
    )


def test_hardware_pedagogical_helpers_cover_narratives_and_patterns():
    i18n_es = get_export_i18n("es")
    i18n_en = get_export_i18n("en")

    assert _clean_sentence("  hola   .. mundo . ") == "hola. mundo."
    assert _confidence_descriptor("high", i18n_es) == "señal fuerte"
    assert _confidence_descriptor("medium", i18n_en) == "moderate signal"

    reduction = _explain_pattern_name("reduction", 0.82, i18n_en)
    divide = _explain_pattern_name("divide_conquer", 0.75, i18n_es)
    generic = _explain_pattern_name("custom", 0.5, i18n_en)
    assert "82%" in reduction
    assert "divide y vencerás" in divide.lower()
    assert 'Pattern "custom"' in generic

    assert "dependencia secuencial" in _pedagogical_hardware_reason(
        "Loop-carried dependency detected.", i18n_es
    )
    assert "parallel reduction" in _pedagogical_hardware_reason(
        "Scalar reduction in loop", i18n_en
    )

    blocks = _build_gpu_cpu_blocks(
        {
            "primaryRecommendation": "gpu",
            "confidence": "medium",
            "summary": "  candidate with parallel opportunities  ",
            "reasons": {
                "positive": ["scalar reduction pattern"],
                "blockers": ["loop-carried dependency in accumulation"],
                "opportunities": ["scalar reduction over chunks"],
            },
            "detectedPatterns": [{"name": "reduction", "confidence": 0.66}],
        },
        i18n_en,
    )

    assert blocks[0]["kind"] == "subsection"
    assert "Primary recommendation: GPU" in blocks[1]["text"]
    assert blocks[3]["title"] == "Pedagogical interpretation"
    interpretation_list = next(block for block in blocks if block["kind"] == "list")
    assert len(interpretation_list["items"]) >= 3
