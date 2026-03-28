"""Return minimum structured-oracle guidance for AALIE changes."""

from __future__ import annotations

from typing import Any

from .catalog import build_contract_impact
from .common import ensure_apps_api_on_path, extract_types_snapshot_schema_version
from .detect_recursive_family import detect_recursive_family
from .evaluate_while_case import evaluate_while_case


def _source_has_while(ast: Any) -> bool:
    if isinstance(ast, dict):
        node_type = str(ast.get("type", "")).lower()
        if node_type == "while":
            return True
        return any(_source_has_while(child) for child in ast.values())
    if isinstance(ast, list):
        return any(_source_has_while(item) for item in ast)
    return False


def _normalized_focus(focus: str | None) -> str | None:
    if not focus:
        return None
    return focus.strip().lower().replace("-", "_").replace(" ", "_")


def _resolve_focus(
    source: str,
    focus: str | None,
    changed_paths: list[str] | None,
) -> str:
    requested = _normalized_focus(focus)
    if requested in {"export", "snapshot", "export_snapshot"}:
        return "export_snapshot"
    if requested in {"while", "while_analysis"}:
        return "while"
    if requested in {"recursive", "recurrence", "recursive_analysis"}:
        return "recursive"
    if requested in {"core", "core_analysis", "analysis", "classification", "parsing"}:
        return "core_analysis"

    if changed_paths:
        impact = build_contract_impact(changed_paths)
        areas = impact.get("areas", [])
        if "export_snapshot" in areas:
            return "export_snapshot"
        if "while_engine" in areas:
            return "while"
        if "recursive_analysis" in areas:
            return "recursive"
        if "core_analysis" in areas:
            return "core_analysis"

    if not source.strip():
        return "core_analysis"

    ensure_apps_api_on_path()
    from app.modules.classification.service import classify_algorithm
    from app.modules.parsing.service import parse_source

    parse_result = parse_source(source)
    ast = parse_result.get("ast") if parse_result.get("ok") else None
    if ast and _source_has_while(ast):
        return "while"

    classification = classify_algorithm(source=source)
    kind = classification.get("kind") if classification.get("ok") else None
    if kind in {"recursive", "hybrid"}:
        return "recursive"
    return "core_analysis"


def _export_stub(source: str, changed_paths: list[str] | None) -> dict[str, Any]:
    ensure_apps_api_on_path()
    from app.modules.classification.service import classify_algorithm

    classification = classify_algorithm(source=source) if source.strip() else {"ok": False}
    detected_kind = classification.get("kind") if classification.get("ok") else "<iterative|recursive|hybrid|unknown>"
    schema_version = extract_types_snapshot_schema_version() or "1.0.0"
    impact = build_contract_impact(changed_paths or [])
    return {
        "comparison_mode": "contractual",
        "required_fields": [
            "schemaVersion",
            "algorithmType",
            "globalResult.cases",
            "iterative.status",
            "recursive.status",
            "contentHash",
            "snapshotId",
        ],
        "minimum_expected": {
            "schemaVersion": schema_version,
            "algorithmType": detected_kind,
            "globalResult": {
                "cases": {
                    "worst": "<present or null>",
                    "best": "<present or null>",
                    "avg": "<present or null>",
                }
            },
            "iterative": {"status": "<available|not_supported|not_requested|missing_data>"},
            "recursive": {"status": "<available|not_supported|not_requested|missing_data>"},
        },
        "suggested_assertions": [
            "Assert schemaVersion matches the shared snapshot contract.",
            "Assert globalResult and specialized sections do not contradict each other.",
            "Assert export uses snapshot data instead of recomputation-sensitive fields.",
            "Assert snapshotId/contentHash stay stable for identical inputs.",
        ],
        "recommended_test_files": impact.get("tests_to_run", []),
        "notes": [
            "Prefer snapshot contract assertions over renderer-internal assertions.",
            "Never make internal the only source required for public rendering.",
        ],
    }


def _while_stub(source: str, changed_paths: list[str] | None) -> dict[str, Any]:
    diagnosis = evaluate_while_case(source=source, mode="worst")
    impact = build_contract_impact(changed_paths or [])
    strong_symbolic = diagnosis.get("ok") and diagnosis.get("status") == "bounded" and diagnosis.get(
        "evidence_level"
    ) == "strong"
    return {
        "comparison_mode": "symbolic" if strong_symbolic else "contractual",
        "required_fields": [
            "status",
            "reason_code",
            "pattern_detected",
            "evidence_level",
            "iterations_expr",
            "asymptotic_class",
        ],
        "minimum_expected": {
            "status": "<bounded|unknown|unbounded|not_proven>",
            "reason_code": "<stable while reason code>",
            "pattern_detected": "<pattern or null>",
            "evidence_level": "<strong|medium|weak|contradictory>",
            "iterations_expr": "<symbolic expression or null>",
            "asymptotic_class": "<Big-O class or null>",
        },
        "suggested_contract_values": {
            key: diagnosis.get(key)
            for key in (
                "status",
                "reason_code",
                "pattern_detected",
                "evidence_level",
                "iterations_expr",
                "asymptotic_class",
            )
            if diagnosis.get("ok")
        },
        "suggested_assertions": [
            "Compare symbolic iteration bounds semantically when evidence is strong.",
            "Accept unknown/inconclusive outputs explicitly when the current coverage cannot prove more.",
            "Assert no optimistic conclusion is emitted when ambiguity or contradiction is present.",
        ],
        "recommended_test_files": impact.get("tests_to_run", []),
        "notes": [
            "A strong WHILE expected should validate pattern, evidence and bound together.",
            "For ambiguous loops, assert the non-conclusive contract rather than forcing a bound.",
        ],
    }


def _recursive_stub(source: str, changed_paths: list[str] | None) -> dict[str, Any]:
    diagnosis = detect_recursive_family(source=source)
    impact = build_contract_impact(changed_paths or [])
    symbolic = diagnosis.get("status") == "available"
    return {
        "comparison_mode": "symbolic" if symbolic else "contractual",
        "required_fields": [
            "family",
            "applicable_methods",
            "default_method",
            "status",
        ],
        "minimum_expected": {
            "status": "<available|unsupported|inconclusive>",
            "family": "<divide_conquer|divide_conquer_multi|linear_shift|None>",
            "applicable_methods": ["<method names>"],
            "default_method": "<preferred contractual method or None>",
        },
        "suggested_contract_values": {
            key: diagnosis.get(key)
            for key in ("status", "family", "applicable_methods", "default_method")
        },
        "suggested_assertions": [
            "Assert family detection before method-specific bundle expectations.",
            "Compare recurrence family and default_method contractually.",
            "Allow partial or unsupported downstream bundles when the family is still correctly detected.",
        ],
        "recommended_test_files": impact.get("tests_to_run", []),
        "notes": [
            "Method-specific algebra can be symbolic; family/default_method should remain contractual.",
            "Do not force Master or characteristic-equation expectations outside their covered families.",
        ],
    }


def _core_analysis_stub(source: str, changed_paths: list[str] | None) -> dict[str, Any]:
    ensure_apps_api_on_path()
    from app.modules.classification.service import classify_algorithm

    classification = classify_algorithm(source=source) if source.strip() else {"ok": False}
    detected_kind = classification.get("kind") if classification.get("ok") else "<iterative|recursive|hybrid|unknown>"
    impact = build_contract_impact(changed_paths or [])
    return {
        "comparison_mode": "symbolic",
        "required_fields": [
            "kind",
            "totals.T_open",
            "totals.big_theta",
            "byLine",
        ],
        "minimum_expected": {
            "kind": detected_kind,
            "totals": {
                "T_open": "<symbolic expression or exact string>",
                "big_theta": "<asymptotic class>",
            },
            "byLine": "<structured per-line cost table>",
        },
        "suggested_assertions": [
            "Use symbolic equivalence for T_open or asymptotic expressions when possible.",
            "Keep expected outputs structured; avoid comment-only or status-only assertions.",
            "If the correct result is partial or unsupported, assert that contract explicitly.",
        ],
        "recommended_test_files": impact.get("tests_to_run", []),
        "notes": [
            "Core-analysis tests should prefer algorithm oracles over implementation-detail snapshots.",
        ],
    }


def generate_test_oracle_stub(
    source: str = "",
    focus: str | None = None,
    changed_paths: list[str] | None = None,
) -> dict[str, Any]:
    """Return minimum expected-output guidance for a source/change."""

    changed_paths = changed_paths or []
    if not source.strip() and not changed_paths and not focus:
        return {
            "ok": False,
            "errors": [
                {
                    "code": "missing_inputs",
                    "message": "Provide source, focus, or changed_paths to infer the oracle shape.",
                }
            ],
        }

    resolved_focus = _resolve_focus(source=source, focus=focus, changed_paths=changed_paths)
    if resolved_focus == "export_snapshot":
        payload = _export_stub(source=source, changed_paths=changed_paths)
    elif resolved_focus == "while":
        payload = _while_stub(source=source, changed_paths=changed_paths)
    elif resolved_focus == "recursive":
        payload = _recursive_stub(source=source, changed_paths=changed_paths)
    else:
        payload = _core_analysis_stub(source=source, changed_paths=changed_paths)

    return {
        "ok": True,
        "focus": resolved_focus,
        **payload,
    }
