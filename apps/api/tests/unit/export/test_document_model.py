import pytest

from app.modules.export.document_model import (
    _localize_analysis_text,
    build_document_model,
)
from app.modules.export.i18n import get_export_i18n
from app.modules.export.snapshot_builder import build_export_state, build_snapshot

pytestmark = [pytest.mark.unit, pytest.mark.fast, pytest.mark.export]


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
                "kind": "line_counts_summarized",
                "title": "Conteos por línea",
                "status": "complete",
                "math": {"primaryLatex": None, "items": []},
                "summary": "Se resumen los conteos por línea.",
                "conceptNote": "Explicación de los conteos por línea.",
                "teachingNote": "Explicación de los conteos por línea.",
                "warning": None,
                "confidence": "high",
                "payload": {"reportable": False},
                "template": {
                    "summaryKey": "iter_case.counts.standard",
                    "conceptKey": "concept.iter_case.counts.standard",
                    "warningKey": None,
                    "params": {},
                },
                "audit": {"codes": [], "assumptions": [], "blockedBy": []},
            },
            {
                "id": "iter_case_s3",
                "index": 3,
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
            "loopInvariant": {
                "status": "ok",
                "selectedLoop": {
                    "nodeType": "WHILE",
                    "lineStart": 3,
                    "lineEnd": 15,
                    "depth": 0,
                    "score": 9.3,
                    "patternType": "sorting_pass",
                    "controlVariables": ["i"],
                    "stateVariables": ["A"],
                    "boundVariables": ["n"],
                    "collectionVariables": ["A"],
                    "targetVariables": [],
                    "keyUpdates": ["i <- i + 1", "i <- i - 1"],
                    "keyConditions": ["A[i] >= A[i - 1]"],
                },
                "invariant": {
                    "propertyStatement": "El prefijo ya recorrido mantiene progreso de orden local.",
                    "initialization": "Inicialización: el cursor empieza en una posición válida.",
                    "maintenance": "Mantenimiento: cada comparación conserva el invariante.",
                    "finalization": "Finalización: al terminar, no quedan inversiones adyacentes.",
                },
                "didacticSummary": "El ciclo avanza comparando y corrigiendo inversiones locales.",
                "evidence": {
                    "conditionReads": ["i", "n"],
                    "bodyWrites": ["i", "A"],
                    "bodyReads": ["A", "i"],
                    "detectedFeatures": ["adjacent_swap"],
                    "classificationConfidence": 0.93,
                    "templateVariant": "bubble_inner_pass",
                },
            },
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

    assert "Líneas consideradas" in pedagogical_titles
    assert "Conteos por línea" in pedagogical_titles
    assert "Suma global" in pedagogical_titles

    formulas_by_title = {
        block["step"]["title"]: block["step"].get("formula")
        for block in section.blocks
        if block.get("kind") == "pedagogicalStep"
    }
    assert formulas_by_title["Líneas consideradas"] is None
    assert formulas_by_title["Conteos por línea"] is None
    assert formulas_by_title["Suma global"] == "T(n) = 1 + n"


def test_build_document_model_keeps_all_iteration_expansions_in_pedagogical_step():
    snapshot = _snapshot_with_iterative_case_bundle()
    recursive_section = {
        "status": "available",
        "data": {
            "selectedMethod": {"method": "iteration"},
            "stepByStep": {
                "status": "available",
                "data": {
                    "method": "iteration",
                    "version": "iter_steps_v1",
                    "overallStatus": "complete",
                    "steps": [
                        {
                            "id": "iter_s4",
                            "index": 4,
                            "kind": "initial_unrolling_built",
                            "title": "Primeras expansiones",
                            "status": "complete",
                            "math": {
                                "primaryLatex": "T(n)=T(n-1)+1",
                                "items": [
                                    {
                                        "id": "iter_s4_e2",
                                        "kind": "transformation",
                                        "latex": "T(n)=T(n-2)+2",
                                    },
                                    {
                                        "id": "iter_s4_e3",
                                        "kind": "transformation",
                                        "latex": "T(n)=T(n-3)+3",
                                    },
                                ],
                            },
                            "summary": "Se expanden las primeras iteraciones.",
                            "conceptNote": "Las expansiones muestran el patrón.",
                            "teachingNote": "Las expansiones muestran el patrón.",
                            "warning": None,
                            "confidence": "high",
                            "payload": {},
                            "template": {
                                "summaryKey": "iteration.initial_unrolling_built.standard",
                                "conceptKey": "concept.iteration.initial_unrolling_built",
                                "warningKey": None,
                                "params": {},
                            },
                            "audit": {"codes": [], "assumptions": [], "blockedBy": []},
                        }
                    ],
                },
            },
        },
    }
    snapshot["recursive"] = recursive_section
    snapshot["algorithmType"] = "recursive"

    model = build_document_model(snapshot)
    section = next(section for section in model.sections if section.id == "recursive")
    pedagogical_step = next(
        block["step"] for block in section.blocks if block.get("kind") == "pedagogicalStep"
    )

    assert pedagogical_step["title"] == "Primeras expansiones"
    assert pedagogical_step["formula"] == (
        r"\begin{aligned}T(n)=T(n-1)+1 \\ T(n)=T(n-2)+2 \\ T(n)=T(n-3)+3\end{aligned}"
    )


def test_build_document_model_hides_internal_while_block_layers_from_snapshot():
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

    assert not any("Iteraciones del bloque" in str(formula) for formula in formulas)
    assert not any("Costo expandido del bloque" in str(formula) for formula in formulas)
    assert not any("binary_search_interval" in str(text) for text in paragraphs)


def test_build_document_model_hides_loop_invariant_technical_summary():
    snapshot = _snapshot_with_iterative_case_bundle()

    model = build_document_model(snapshot)
    section = next(
        section for section in model.sections if section.id == "iterative-invariant"
    )
    texts = []
    for block in section.blocks:
        if block.get("kind") == "paragraph" or block.get("kind") == "emphasis":
            texts.append(str(block.get("text")))
        elif block.get("kind") == "list":
            texts.extend(str(item) for item in (block.get("items") or []))
        elif block.get("kind") == "subsection":
            texts.append(str(block.get("title")))

    joined = " ".join(texts)
    assert "Resumen técnico" not in joined
    assert "Technical summary" not in joined
    assert "sorting_pass" not in joined
    assert "bubble_inner_pass" not in joined
    assert "0.93" not in joined
