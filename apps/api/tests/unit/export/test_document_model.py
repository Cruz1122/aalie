import pytest

from app.modules.export.document_model import (
    _localize_analysis_text,
    build_document_model,
)


pytestmark = [pytest.mark.unit, pytest.mark.fast, pytest.mark.export]

from app.modules.export.i18n import get_export_i18n
from app.modules.export.snapshot_builder import build_export_state, build_snapshot


def _iterative_case_bundle() -> dict:
    return {
        "method": "iterative_case",
        "version": "iter_case_steps_v1",
        "overallStatus": "complete",
        "steps": [
            {
                "id": "iter_case_s1",
                "index": 1,
                "kind": "line_groups_identified",
                "title": "Líneas consideradas",
                "status": "complete",
                "math": {"primaryLatex": None, "items": []},
                "summary": "Resumen previo por líneas.",
                "conceptNote": "Explicación previa por líneas.",
                "teachingNote": "Explicación previa por líneas.",
                "warning": None,
                "confidence": "high",
                "payload": {"reportable": False},
                "template": {
                    "summaryKey": "iter_case.lines.standard",
                    "conceptKey": "concept.iter_case.lines",
                    "warningKey": None,
                    "params": {},
                },
                "audit": {"codes": [], "assumptions": [], "blockedBy": []},
            },
            {
                "id": "iter_case_s2",
                "index": 2,
                "kind": "line_cost_sum_built",
                "title": "Suma global",
                "status": "complete",
                "math": {"primaryLatex": "T(n) = 1 + n", "items": []},
                "summary": "Se construye la suma global.",
                "conceptNote": "Explicación de la suma global.",
                "teachingNote": "Explicación de la suma global.",
                "warning": None,
                "confidence": "high",
                "payload": {"reportable": True},
                "template": {
                    "summaryKey": "iter_case.sum.standard",
                    "conceptKey": "concept.iter_case.sum",
                    "warningKey": None,
                    "params": {},
                },
                "audit": {"codes": [], "assumptions": [], "blockedBy": []},
            },
        ],
    }


def _snapshot_with_iterative_case_bundle() -> dict:
    payload = {
        "source": "sumatoria(n) BEGIN RETURN n; END",
        "formats": ["markdown"],
        "locale": "es",
        "cachedParse": {
            "ok": True,
            "available": True,
            "runtime": "python",
            "error": None,
            "ast": {"type": "Program", "body": []},
            "errors": [],
        },
        "cachedClassify": {"ok": True, "kind": "iterative", "method": "ast"},
        "cachedAnalyze": {
            "ok": True,
            "has_case_variability": False,
            "worst": {
                "ok": True,
                "byLine": [],
                "totals": {
                    "T_open": "1",
                    "T_polynomial": "1",
                    "big_o": "O(1)",
                    "big_omega": "\\Omega(1)",
                    "big_theta": "\\Theta(1)",
                    "whileBlocks": [
                        {
                            "id": "while_L4",
                            "line": 4,
                            "status": "available",
                            "patternUsed": "binary_search_interval",
                            "evidenceLevel": "strong",
                            "iterationsExpr": "\\log_{2}(n)",
                            "iterationsClass": "logarithmic",
                            "expandedCostExpr": "\\log_{2}(n) \\cdot C_{iter}",
                            "diagnostics": ["Binary search"],
                        }
                    ],
                    "procedure": [],
                    "step_by_step": _iterative_case_bundle(),
                    "notes": [],
                },
            },
            "best": "same_as_worst",
            "avg": "same_as_worst",
        },
        "cachedTraceByCase": {"worst": {"ok": True, "trace": {"steps": []}}},
    }
    state = build_export_state(payload)
    return build_snapshot(state["snapshotInput"], state["options"])


def test_localize_analysis_text_translates_master_case_references_to_spanish():
    i18n = get_export_i18n("es")

    assert (
        _localize_analysis_text(
            "The recurrence is classified as Case 3 (subject to regularity).",
            i18n,
        )
        == "La recurrencia se clasifica como Caso 3 (sujeto a regularidad)."
    )


def test_localize_analysis_text_translates_master_case_references_to_english():
    i18n = get_export_i18n("en")

    assert (
        _localize_analysis_text(
            "La recurrencia se clasifica como Caso 2.",
            i18n,
        )
        == "The recurrence is classified as Case 2."
    )


def test_localize_analysis_text_translates_master_step_titles():
    assert (
        _localize_analysis_text("Case evaluation", get_export_i18n("es"))
        == "Evaluación de caso"
    )
    assert (
        _localize_analysis_text("Evaluación de caso", get_export_i18n("en"))
        == "Case evaluation"
    )


def test_build_document_model_prefers_iterative_case_bundle_from_reportable_step():
    snapshot = _snapshot_with_iterative_case_bundle()

    model = build_document_model(snapshot)
    section = next(
        section for section in model.sections if section.id == "iterative-cases"
    )
    pedagogical_titles = [
        block["step"]["title"]
        for block in section.blocks
        if block.get("kind") == "pedagogicalStep"
    ]

    assert "Suma global" in pedagogical_titles
    assert "Líneas consideradas" not in pedagogical_titles


def test_build_document_model_renders_while_block_layers_from_snapshot():
    snapshot = _snapshot_with_iterative_case_bundle()

    model = build_document_model(snapshot)
    section = next(
        section for section in model.sections if section.id == "iterative-cases"
    )
    formulas = [
        block.get("formula")
        for block in section.blocks
        if block.get("kind") == "formula"
    ]
    paragraphs = [
        block.get("text")
        for block in section.blocks
        if block.get("kind") == "paragraph"
    ]

    assert any("Iteraciones del bloque" in str(formula) for formula in formulas)
    assert any("Costo expandido del bloque" in str(formula) for formula in formulas)
    assert any("binary_search_interval" in str(text) for text in paragraphs)
