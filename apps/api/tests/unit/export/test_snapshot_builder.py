import pytest

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


def _base_payload() -> dict:
    return {
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


def test_build_export_state_generates_deterministic_metadata():
    payload = _base_payload()

    state_a = build_export_state(payload)
    state_b = build_export_state(
        {**payload, "requestOrigin": "https://frontend.example"}
    )

    assert (
        state_a["snapshotInput"]["analysisId"] == state_b["snapshotInput"]["analysisId"]
    )
    assert (
        state_a["snapshotInput"]["snapshotId"] == state_b["snapshotInput"]["snapshotId"]
    )
    assert (
        state_a["snapshotInput"]["createdAt"] == state_b["snapshotInput"]["createdAt"]
    )


def test_build_export_state_normalizes_formats_and_defaults():
    payload = _base_payload()
    payload["formats"] = ["markdown", "pdf", "markdown", "other"]

    state = build_export_state(payload)

    assert state["render"]["formats"] == ["markdown", "pdf"]
    assert state["options"]["includeGpuCpu"] is True


def test_build_snapshot_includes_iterative_case_step_by_step():
    state = build_export_state(_base_payload())

    snapshot = build_snapshot(state["snapshotInput"], state["options"])

    iterative_data = (snapshot.get("iterative") or {}).get("data") or {}
    bundle = (iterative_data.get("caseStepByStep") or {}).get("worst") or {}
    assert bundle.get("method") == "iterative_case"
    assert bundle.get("version") == "iter_case_steps_v1"


def test_build_snapshot_copies_while_blocks_into_iterative_and_global_case():
    state = build_export_state(_base_payload())

    snapshot = build_snapshot(state["snapshotInput"], state["options"])

    iterative_data = (snapshot.get("iterative") or {}).get("data") or {}
    while_blocks = (iterative_data.get("whileBlocks") or {}).get("worst") or []
    global_case = ((snapshot.get("globalResult") or {}).get("cases") or {}).get(
        "worst"
    ) or {}

    assert while_blocks
    assert while_blocks[0].get("patternUsed") == "binary_search_interval"
    assert (global_case.get("whileBlocks") or [])[0].get("id") == "while_L4"
