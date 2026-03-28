"""Diagnose WHILE cases using existing engine signals plus contractual rules."""

from __future__ import annotations

from typing import Any

from .common import ensure_apps_api_on_path

SUPPORTED_PATTERNS = (
    "linear_counter",
    "geometric_growth",
    "flag_kill",
    "euclid_mod",
    "binary_search_interval",
)
AMBIGUOUS_REASON_CODES = {
    "while_two_vars",
    "while_or_unknown",
    "while_and_unknown",
    "while_unbounded_unknown",
    "while_no_updates",
    "while_bool_revived",
    "while_bool_compound_unknown",
}
CONTRADICTORY_REASON_CODES = {"while_reset", "while_no_progress_must"}


def _collect_assigned_identifiers(node: Any, output: set[str]) -> None:
    if isinstance(node, dict):
        if str(node.get("type", "")).lower() == "assign":
            target = node.get("target", {})
            if (
                isinstance(target, dict)
                and str(target.get("type", "")).lower() == "identifier"
                and target.get("name")
            ):
                output.add(str(target.get("name")))
        for child in node.values():
            _collect_assigned_identifiers(child, output)
    elif isinstance(node, list):
        for item in node:
            _collect_assigned_identifiers(item, output)


def _collect_while_contexts(
    node: Any,
    current_block: dict[str, Any] | None = None,
    procedure_name: str | None = None,
    output: list[dict[str, Any]] | None = None,
) -> list[dict[str, Any]]:
    if output is None:
        output = []
    if isinstance(node, dict):
        node_type = str(node.get("type", "")).lower()
        if node_type == "procdef":
            body = node.get("body")
            _collect_while_contexts(
                body,
                current_block=body if isinstance(body, dict) else current_block,
                procedure_name=node.get("name"),
                output=output,
            )
            return output
        if node_type == "block":
            block = node
            for stmt in node.get("body", []):
                _collect_while_contexts(
                    stmt,
                    current_block=block,
                    procedure_name=procedure_name,
                    output=output,
                )
            return output
        if node_type == "while":
            output.append(
                {
                    "while_node": node,
                    "parent_context": current_block,
                    "procedure_name": procedure_name,
                    "line": ((node.get("pos") or {}).get("line")),
                }
            )
        for child in node.values():
            _collect_while_contexts(
                child,
                current_block=current_block,
                procedure_name=procedure_name,
                output=output,
            )
    elif isinstance(node, list):
        for item in node:
            _collect_while_contexts(
                item,
                current_block=current_block,
                procedure_name=procedure_name,
                output=output,
            )
    return output


def _update_summary(updates: dict[str, Any]) -> dict[str, Any]:
    summary: dict[str, Any] = {}
    for var_name, value in updates.items():
        summary[var_name] = {
            "must_updates": [
                {
                    key: update.get(key)
                    for key in (
                        "type",
                        "operator",
                        "constant",
                        "value",
                        "other_var",
                        "monotone",
                    )
                    if key in update
                }
                for update in getattr(value, "must_updates", [])
            ],
            "may_updates": [
                {
                    key: update.get(key)
                    for key in (
                        "type",
                        "operator",
                        "constant",
                        "value",
                        "other_var",
                        "monotone",
                    )
                    if key in update
                }
                for update in getattr(value, "may_updates", [])
            ],
            "kills_guard_must": getattr(value, "kills_guard_must", False),
            "revives_guard_may": getattr(value, "revives_guard_may", False),
            "monotone_progress_must": getattr(value, "monotone_progress_must", False),
        }
    return summary


def _resolve_dominant_controller(engine_result: Any, control: Any) -> str | None:
    return (
        getattr(engine_result, "dominant_controller", None)
        or getattr(engine_result, "variable", None)
        or ((getattr(engine_result, "evidence", None) or {}).get("var"))
        or getattr(control, "primary_numeric_controller", None)
        or getattr(control, "primary_boolean_controller", None)
    )


def _detect_contradictions(
    guard: Any,
    updates: dict[str, Any],
    engine_result: Any,
    dominant_controller: str | None,
) -> list[str]:
    contradictions: list[str] = []
    if getattr(engine_result, "reason_code", None) in CONTRADICTORY_REASON_CODES:
        contradictions.append(
            f"reason_code={getattr(engine_result, 'reason_code')} indicates incompatible progress evidence"
        )
    if dominant_controller:
        controller_summary = updates.get(dominant_controller)
        if controller_summary:
            has_reset = any(
                update.get("type") == "reset"
                for update in (
                    list(getattr(controller_summary, "must_updates", []))
                    + list(getattr(controller_summary, "may_updates", []))
                )
            )
            if has_reset:
                contradictions.append(
                    f"controller '{dominant_controller}' is reset inside the loop"
                )
    if getattr(guard, "kind", None) == "rel" and not dominant_controller and getattr(engine_result, "status", None) == "bounded":
        contradictions.append(
            "bounded result lacks a defensible dominant controller in the current evidence"
        )
    return contradictions


def _detect_ambiguity(
    guard: Any,
    control: Any,
    engine_result: Any,
    while_count: int,
) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    reason_code = getattr(engine_result, "reason_code", None)
    if while_count > 1:
        reasons.append("source contains multiple WHILE loops; only the first one was diagnosed")
    if reason_code in AMBIGUOUS_REASON_CODES:
        reasons.append(f"reason_code={reason_code} is explicitly non-conclusive")
    if getattr(guard, "kind", None) in {"and", "or"} and not getattr(
        engine_result, "pattern_used", None
    ):
        reasons.append("compound guard without a strong winning pattern")
    coupled = list(getattr(control, "coupled_controllers", []) or [])
    if len(coupled) >= 2 and not getattr(engine_result, "pattern_used", None):
        reasons.append("multiple coupled controllers remain unresolved")
    return (len(reasons) > 0, reasons)


def _resolve_evidence_level(
    engine_result: Any,
    updates: dict[str, Any],
    dominant_controller: str | None,
    contradictions: list[str],
    ambiguity: bool,
) -> str:
    if contradictions:
        return "contradictory"

    controller_summary = updates.get(dominant_controller) if dominant_controller else None
    has_monotone_progress = bool(
        controller_summary and getattr(controller_summary, "monotone_progress_must", False)
    )
    has_bounded_flag_kill = bool(
        controller_summary and getattr(controller_summary, "kills_guard_must", False)
    )
    strong = all(
        [
            getattr(engine_result, "pattern_used", None) in SUPPORTED_PATTERNS,
            bool(getattr(engine_result, "iterations_expr", None)),
            bool(dominant_controller),
            has_monotone_progress or has_bounded_flag_kill or getattr(engine_result, "pattern_used", None) == "euclid_mod",
            not ambiguity,
        ]
    )
    if strong:
        return "strong"
    if getattr(engine_result, "status", None) == "bounded" and (
        getattr(engine_result, "pattern_used", None)
        or has_monotone_progress
        or has_bounded_flag_kill
    ):
        return "medium"
    return "weak"


def _build_explanation(
    guard: Any,
    updates: dict[str, Any],
    control: Any,
    progress: Any,
    engine_result: Any,
    ambiguity_reasons: list[str],
    contradictions: list[str],
    dominant_controller: str | None,
) -> list[str]:
    explanation = [
        f"guard.kind={getattr(guard, 'kind', 'unknown')}",
        f"engine.status={getattr(engine_result, 'status', 'unknown')}",
        f"engine.reason_code={getattr(engine_result, 'reason_code', 'unknown')}",
    ]
    if dominant_controller:
        explanation.append(f"dominant_controller={dominant_controller}")
    if getattr(engine_result, "pattern_used", None):
        explanation.append(f"pattern_used={engine_result.pattern_used}")
    if getattr(engine_result, "iterations_expr", None):
        explanation.append(f"iterations_expr={engine_result.iterations_expr}")
    if getattr(engine_result, "asymptotic_class", None):
        explanation.append(f"asymptotic_class={engine_result.asymptotic_class}")
    if getattr(progress, "evidence", None):
        explanation.extend(f"progress:{item}" for item in progress.evidence)
    if getattr(control, "coupled_controllers", None):
        explanation.append(
            "coupled_controllers=" + ", ".join(getattr(control, "coupled_controllers"))
        )
    if any(getattr(summary, "monotone_progress_must", False) for summary in updates.values()):
        explanation.append("at least one guard variable has must monotone progress")
    explanation.extend(f"ambiguity:{item}" for item in ambiguity_reasons)
    explanation.extend(f"contradiction:{item}" for item in contradictions)
    explanation.extend(getattr(engine_result, "diagnostics", []) or [])
    return explanation


def evaluate_while_case(source: str, mode: str = "worst") -> dict[str, Any]:
    """Diagnose one WHILE case from source code."""

    ensure_apps_api_on_path()

    if mode not in {"worst", "best", "avg"}:
        return {
            "ok": False,
            "errors": [{"code": "invalid_mode", "message": "mode must be worst, best or avg."}],
        }
    if not isinstance(source, str) or not source.strip():
        return {
            "ok": False,
            "errors": [{"code": "missing_source", "message": "source is required."}],
        }

    from app.modules.parsing.service import parse_source
    from app.modules.analysis.while_engine.control_variables import detect_control_variables
    from app.modules.analysis.while_engine.engine import WhileAnalysisInput, WhileEngine
    from app.modules.analysis.while_engine.guard_analysis import analyze_guard_for_engine
    from app.modules.analysis.while_engine.progress_proofs import prove_progress
    from app.modules.analysis.while_engine.update_analysis import analyze_updates

    parse_result = parse_source(source)
    if not parse_result.get("ok", False):
        return {
            "ok": False,
            "errors": parse_result.get("errors", []),
        }

    ast = parse_result.get("ast") or {}
    while_contexts = _collect_while_contexts(ast)
    if not while_contexts:
        return {
            "ok": False,
            "errors": [{"code": "no_while_found", "message": "No WHILE loop found in source."}],
        }

    selected = while_contexts[0]
    while_node = selected["while_node"]
    parent_context = selected["parent_context"]

    guard = analyze_guard_for_engine(while_node.get("test"))
    vars_used = set(getattr(guard, "vars_used", set()) or set())
    assigned_identifiers: set[str] = set()
    _collect_assigned_identifiers(while_node.get("body"), assigned_identifiers)
    vars_used.update(assigned_identifiers)
    updates = analyze_updates(while_node, vars_used, guard, parent_context)
    control = detect_control_variables(guard, updates)
    progress = prove_progress(guard, updates, control)
    engine = WhileEngine()
    engine_result = engine.analyze(
        WhileAnalysisInput(
            while_node=while_node,
            parent_context=parent_context,
            procedure_context=parent_context,
            mode=mode,
        )
    )

    dominant_controller = _resolve_dominant_controller(engine_result, control)
    contradictions = _detect_contradictions(
        guard=guard,
        updates=updates,
        engine_result=engine_result,
        dominant_controller=dominant_controller,
    )
    ambiguity, ambiguity_reasons = _detect_ambiguity(
        guard=guard,
        control=control,
        engine_result=engine_result,
        while_count=len(while_contexts),
    )
    evidence_level = _resolve_evidence_level(
        engine_result=engine_result,
        updates=updates,
        dominant_controller=dominant_controller,
        contradictions=contradictions,
        ambiguity=ambiguity,
    )

    return {
        "ok": True,
        "procedure": selected.get("procedure_name"),
        "while_count": len(while_contexts),
        "selected_loop": {"line": selected.get("line")},
        "pattern_detected": getattr(engine_result, "pattern_used", None),
        "status": getattr(engine_result, "status", None),
        "termination": getattr(engine_result, "termination", None),
        "reason_code": getattr(engine_result, "reason_code", None),
        "evidence_level": evidence_level,
        "dominant_controller": dominant_controller,
        "iterations_expr": getattr(engine_result, "iterations_expr", None),
        "asymptotic_class": getattr(engine_result, "asymptotic_class", None),
        "ambiguity": ambiguity,
        "ambiguity_reasons": ambiguity_reasons,
        "contradictions": contradictions,
        "why": _build_explanation(
            guard=guard,
            updates=updates,
            control=control,
            progress=progress,
            engine_result=engine_result,
            ambiguity_reasons=ambiguity_reasons,
            contradictions=contradictions,
            dominant_controller=dominant_controller,
        ),
        "guard": {
            "kind": getattr(guard, "kind", None),
            "vars_used": sorted(getattr(guard, "vars_used", set()) or []),
            "atoms": getattr(guard, "atoms", []),
            "has_array_access": getattr(guard, "has_array_access", False),
        },
        "updates": _update_summary(updates),
        "progress": {
            "proven": getattr(progress, "proven", False),
            "bound_kind": getattr(progress, "bound_kind", None),
            "must_progress": getattr(progress, "must_progress", False),
            "may_stall": getattr(progress, "may_stall", False),
            "may_reset": getattr(progress, "may_reset", False),
            "evidence": list(getattr(progress, "evidence", []) or []),
        },
        "supported_patterns": list(SUPPORTED_PATTERNS),
    }
