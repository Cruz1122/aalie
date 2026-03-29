"""
Snapshot-input collection and pure-Python snapshot construction for export.
"""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from ..analysis.service import analyze_algorithm, detect_methods
from ..analysis.trace_service import build_default_trace_inputs, build_trace_result
from ..classification.service import classify_algorithm
from ..parsing.adapter import is_grammar_available
from ..parsing.service import parse_source
from .constants import (
    DEFAULT_GENERAL_LIMITATIONS_EN,
    DEFAULT_GENERAL_LIMITATIONS_ES,
    DEFAULT_SOURCE_ORIGIN,
    INSTITUTIONAL_DISCLAIMER_TEXT,
    SNAPSHOT_NOT_IMPLEMENTED_TODOS,
    SNAPSHOT_SCHEMA_VERSION,
)
from .section_status import create_section, mark_not_implemented

DEFAULT_FORMATS = ["markdown", "latex"]
SUPPORTED_FORMATS = {"markdown", "latex", "pdf"}
SUPPORTED_TRACE_CASES = {"worst", "best", "avg"}
SUPPORTED_ALGORITHM_KINDS = {"iterative", "recursive", "hybrid", "dummy"}
ANALYSIS_NAMESPACE = uuid.UUID("3f239c5d-2970-4cec-8b6d-d11aa2d7a7aa")
SNAPSHOT_NAMESPACE = uuid.UUID("8ea7d65c-f598-49ea-8fdd-28289954182d")


def _normalize_locale(locale: Optional[str]) -> str:
    return "es" if str(locale or "en").lower().startswith("es") else "en"


def _normalize_formats(formats: Any) -> List[str]:
    if not isinstance(formats, list) or len(formats) == 0:
        return DEFAULT_FORMATS.copy()
    normalized = [
        str(item)
        for item in formats
        if isinstance(item, str) and item in SUPPORTED_FORMATS
    ]
    return list(dict.fromkeys(normalized)) or DEFAULT_FORMATS.copy()


def _normalize_trace_cases(cases: Any) -> Optional[List[str]]:
    if not isinstance(cases, list) or len(cases) == 0:
        return None
    normalized = [
        str(item)
        for item in cases
        if isinstance(item, str) and item in SUPPORTED_TRACE_CASES
    ]
    unique = list(dict.fromkeys(normalized))
    return unique or None


def _normalize_algorithm_kind(kind: Any) -> str:
    normalized = str(kind or "").lower()
    return normalized if normalized in SUPPORTED_ALGORITHM_KINDS else "unknown"


def _build_parse_payload(source: str) -> Dict[str, Any]:
    result = parse_source(source)
    return {
        "ok": result["ok"],
        "available": is_grammar_available(),
        "runtime": "python",
        "error": result["errors"][0]["message"] if result["errors"] else None,
        "ast": result["ast"],
        "errors": result["errors"],
    }


def _stable_json(value: Any) -> str:
    return json.dumps(
        value,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    )


def _stable_stringify(value: Any) -> str:
    if value is None or not isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False, separators=(",", ":"))
    if isinstance(value, list):
        return "[" + ",".join(_stable_stringify(item) for item in value) + "]"
    entries = sorted(value.items(), key=lambda item: item[0])
    return (
        "{"
        + ",".join(
            json.dumps(key, ensure_ascii=False) + ":" + _stable_stringify(nested)
            for key, nested in entries
        )
        + "}"
    )


def _canonicalize_trace_step(step: Any) -> Any:
    if not isinstance(step, dict):
        return step
    return {
        key: value
        for key, value in step.items()
        if key not in {"microseconds", "tokens"}
    }


def _canonicalize_trace_response(trace: Any) -> Any:
    if not isinstance(trace, dict):
        return trace

    structured_trace = (trace.get("derived") or {}).get("structuredTrace") or {}
    graph = structured_trace.get("graph") or {}
    nodes = []
    for node in graph.get("nodes") or []:
        if not isinstance(node, dict):
            continue
        data = node.get("data") if isinstance(node.get("data"), dict) else {}
        nodes.append(
            {
                "id": node.get("id"),
                "type": node.get("type"),
                "position": node.get("position"),
                "data": {
                    "label": data.get("label"),
                },
                "parentId": node.get("parentId"),
            }
        )

    edges = []
    for edge in graph.get("edges") or []:
        if not isinstance(edge, dict):
            continue
        edges.append(
            {
                "id": edge.get("id"),
                "source": edge.get("source"),
                "target": edge.get("target"),
                "label": edge.get("label"),
                "type": edge.get("type"),
            }
        )

    trace_body = trace.get("trace") or {}
    return {
        "ok": trace.get("ok"),
        "algorithmKind": trace.get("algorithmKind"),
        "trace": {
            "kind": trace_body.get("kind"),
            "steps": [
                _canonicalize_trace_step(step)
                for step in (trace_body.get("steps") or [])
            ],
            "summary": trace_body.get("summary"),
            "diagnostics": trace_body.get("diagnostics"),
            "callTreeSource": trace_body.get("callTreeSource")
            or trace_body.get("recursionTree"),
        },
        "derived": {
            "structuredTrace": {
                "patternKind": structured_trace.get("patternKind"),
                "graph": {
                    "nodes": nodes,
                    "edges": edges,
                },
                "classification": structured_trace.get("classification"),
            }
        },
    }


def _iso_utc(dt: datetime) -> str:
    return (
        dt.astimezone(timezone.utc)
        .isoformat(timespec="milliseconds")
        .replace("+00:00", "Z")
    )


def _strip_undefined_deep(value: Any) -> Any:
    if isinstance(value, list):
        return [_strip_undefined_deep(item) for item in value]
    if isinstance(value, dict):
        output: Dict[str, Any] = {}
        for key, nested in value.items():
            if nested is None and key not in {
                "error",
                "available",
                "runtime",
                "ast",
                "best",
                "avg",
                "worst",
                "summary",
                "diagnostics",
                "callTreeSource",
                "reportTraceGraph",
            }:
                continue
            output[key] = _strip_undefined_deep(nested)
        return output
    return value


def _deep_copy(value: Any) -> Any:
    return json.loads(json.dumps(value, ensure_ascii=False))


def _extract_algorithm_from_ast(ast: Any) -> Dict[str, Any]:
    body = ast.get("body") if isinstance(ast, dict) else None
    if not isinstance(body, list):
        return {"name": "UnknownProcedure", "parameters": []}
    procedure = next(
        (
            node
            for node in body
            if isinstance(node, dict) and node.get("type") == "ProcDef"
        ),
        None,
    )
    name = str((procedure or {}).get("name") or "UnknownProcedure")
    params = (procedure or {}).get("params")
    parameters = []
    if isinstance(params, list):
        for param in params:
            if not isinstance(param, dict):
                continue
            normalized = str(param.get("name") or "").strip()
            if normalized:
                parameters.append(normalized)
    return {"name": name, "parameters": parameters}


def _resolve_same_as_worst(
    worst: Any,
    best: Any,
    avg: Any,
) -> Dict[str, Any]:
    return {
        "worst": worst,
        "best": worst if best == "same_as_worst" else best,
        "avg": worst if avg == "same_as_worst" else avg,
    }


def _normalize_recurrence_type(value: Any) -> Optional[str]:
    normalized = str(value or "")
    if normalized in {"divide_conquer", "divide_conquer_multi", "linear_shift"}:
        return normalized
    return None


def _normalize_recurrence(value: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(value, dict):
        return None
    recurrence_type = _normalize_recurrence_type(value.get("type"))
    if not recurrence_type:
        return None
    if recurrence_type == "divide_conquer":
        return {
            "type": recurrence_type,
            "form": str(value.get("form") or ""),
            "a": int(value.get("a") or 0),
            "b": int(value.get("b") or 0),
            "f": str(value.get("f") or ""),
            "n0": int(value.get("n0") or 0),
            "method": value.get("method"),
            "notes": [str(item) for item in (value.get("notes") or [])],
        }
    if recurrence_type == "divide_conquer_multi":
        raw_terms = value.get("terms") or []
        return {
            "type": recurrence_type,
            "form": str(value.get("form") or ""),
            "terms": [
                {"a": int(term.get("a") or 0), "b": int(term.get("b") or 0)}
                for term in raw_terms
                if isinstance(term, dict)
            ],
            "a": int(value.get("a") or 0),
            "f": str(value.get("f") or ""),
            "n0": int(value.get("n0") or 0),
            "method": value.get("method"),
            "notes": [str(item) for item in (value.get("notes") or [])],
        }
    return {
        "type": recurrence_type,
        "form": str(value.get("form") or ""),
        "order": int(value.get("order") or 0),
        "shifts": [int(item) for item in (value.get("shifts") or [])],
        "coefficients": [int(item) for item in (value.get("coefficients") or [])],
        "g(n)": value.get("g(n)") if isinstance(value.get("g(n)"), str) else None,
        "n0": int(value.get("n0") or 0),
        "method": value.get("method"),
        "notes": [str(item) for item in (value.get("notes") or [])],
    }


def _normalize_trace_graph_from_structured(
    trace: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    structured = (trace.get("derived") or {}).get("structuredTrace") or {}
    graph = structured.get("graph") or {}
    nodes = []
    for node in graph.get("nodes") or []:
        if not isinstance(node, dict):
            continue
        node_id = str(node.get("id") or "").strip()
        if not node_id:
            continue
        data = node.get("data") if isinstance(node.get("data"), dict) else {}
        nodes.append(
            {
                "id": node_id,
                "type": str(node.get("type") or "default"),
                "position": {
                    "x": float((node.get("position") or {}).get("x") or 0),
                    "y": float((node.get("position") or {}).get("y") or 0),
                },
                "data": {
                    "label": str(data.get("label") or node_id),
                    "microseconds": (
                        data.get("microseconds")
                        if isinstance(data.get("microseconds"), (int, float))
                        else None
                    ),
                    "tokens": (
                        data.get("tokens")
                        if isinstance(data.get("tokens"), (int, float))
                        else None
                    ),
                },
                "parentId": (
                    node.get("parentId")
                    if isinstance(node.get("parentId"), str)
                    else None
                ),
            }
        )
    if not nodes:
        return None
    node_ids = {node["id"] for node in nodes}
    edges = []
    for index, edge in enumerate(graph.get("edges") or []):
        if not isinstance(edge, dict):
            continue
        source = str(edge.get("source") or "").strip()
        target = str(edge.get("target") or "").strip()
        if not source or not target or source not in node_ids or target not in node_ids:
            continue
        edges.append(
            {
                "id": str(edge.get("id") or f"edge_{index}"),
                "source": source,
                "target": target,
                "label": str(edge.get("label") or ""),
                "type": str(edge.get("type") or "smoothstep"),
            }
        )
    return {
        "graph": {"nodes": nodes, "edges": edges},
        "patternKind": structured.get("patternKind"),
        "classification": structured.get("classification"),
        "summary": (trace.get("trace") or {}).get("summary"),
        "diagnostics": (trace.get("trace") or {}).get("diagnostics"),
    }


def _normalize_trace_graph_from_call_tree(
    trace: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    trace_payload = trace.get("trace") if isinstance(trace.get("trace"), dict) else {}
    call_tree = trace_payload.get("callTreeSource") or trace_payload.get(
        "recursionTree"
    )
    if not isinstance(call_tree, dict):
        return None
    calls = [item for item in (call_tree.get("calls") or []) if isinstance(item, dict)]
    if not calls:
        return None
    nodes = []
    for call in calls:
        node_id = str(call.get("id") or "").strip()
        if not node_id:
            continue
        fn = str(
            call.get("function_name")
            or call.get("functionName")
            or call.get("procedure")
            or "call"
        )
        params = call.get("params") if isinstance(call.get("params"), dict) else {}
        params_str = ", ".join(
            f"{key}={json.dumps(value, ensure_ascii=False)}"
            for key, value in params.items()
        )
        label = f"{fn}({params_str})" if params_str else f"{fn}(...)"
        if "return_value" in call:
            label = (
                f"{label}\n→ {json.dumps(call.get('return_value'), ensure_ascii=False)}"
            )
        nodes.append(
            {
                "id": node_id,
                "type": "default",
                "position": {"x": int(call.get("depth") or 0) * 240, "y": 0},
                "data": {"label": label},
                "parentId": (
                    call.get("parent_id")
                    if isinstance(call.get("parent_id"), str)
                    else None
                ),
            }
        )
    node_ids = {node["id"] for node in nodes}
    edges = []
    for call in calls:
        parent = str(call.get("id") or "").strip()
        if not parent or parent not in node_ids:
            continue
        for child_id in call.get("children") or []:
            child = str(child_id or "").strip()
            if not child or child not in node_ids:
                continue
            edges.append(
                {
                    "id": f"edge_{parent}_{child}",
                    "source": parent,
                    "target": child,
                    "label": "",
                    "type": "smoothstep",
                }
            )
    return {
        "graph": {"nodes": nodes, "edges": edges},
        "patternKind": "generic_recursive",
        "classification": {
            "patternKind": "generic_recursive",
            "confidence": "low",
            "evidence": ["fallback_from_call_tree_source"],
        },
        "summary": trace_payload.get("summary"),
        "diagnostics": trace_payload.get("diagnostics"),
    }


def _resolve_report_trace_graph(
    trace: Optional[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    if not trace or not trace.get("ok"):
        return None
    return _normalize_trace_graph_from_structured(
        trace
    ) or _normalize_trace_graph_from_call_tree(trace)


def _build_case_result(case_name: str, data: Any) -> Optional[Dict[str, Any]]:
    if not isinstance(data, dict) or not data.get("ok"):
        return None
    totals = data.get("totals") or {}
    return {
        "case": case_name,
        "T_open": totals.get("T_open"),
        "T_polynomial": totals.get("T_polynomial"),
        "big_o": totals.get("big_o"),
        "big_omega": totals.get("big_omega"),
        "big_theta": totals.get("big_theta"),
        "whileBlocks": totals.get("whileBlocks") or [],
        "explanationSteps": totals.get("procedure") or [],
        "raw": data,
    }


def _collect_warnings(snapshot_input: Dict[str, Any]) -> List[Dict[str, Any]]:
    warnings: List[Dict[str, Any]] = []
    parse_payload = snapshot_input.get("parse")
    if isinstance(parse_payload, dict) and not parse_payload.get("ok"):
        warnings.append(
            {
                "code": "PARSE_FAILED",
                "message": parse_payload.get("error") or "Parsing failed",
                "severity": "critical",
                "source": "parse",
            }
        )
    analyze_payload = snapshot_input.get("analyze")
    if isinstance(analyze_payload, dict) and not analyze_payload.get("ok"):
        errors = analyze_payload.get("errors") or []
        first = errors[0] if isinstance(errors, list) and errors else {}
        warnings.append(
            {
                "code": "ANALYSIS_FAILED",
                "message": (first or {}).get("message") or "Analysis failed",
                "severity": "critical",
                "source": "analysis",
            }
        )
    trace_by_case = snapshot_input.get("traceByCase") or {}
    if isinstance(trace_by_case, dict):
        for case_name, trace in trace_by_case.items():
            if not isinstance(trace, dict) or not trace.get("ok"):
                warnings.append(
                    {
                        "code": f"TRACE_FAILED_{str(case_name).upper()}",
                        "message": (
                            ((trace or {}).get("errors") or [{}])[0].get("message")
                            if isinstance((trace or {}).get("errors"), list)
                            else f"Trace unavailable for {case_name}"
                        ),
                        "severity": "warning",
                        "source": "trace",
                    }
                )
                continue
            diagnostics = (trace.get("trace") or {}).get("diagnostics") or {}
            if diagnostics.get("truncated"):
                warnings.append(
                    {
                        "code": f"TRACE_TRUNCATED_{str(case_name).upper()}",
                        "message": diagnostics.get("truncationReason")
                        and f"Trace truncated ({diagnostics.get('truncationReason')}) for {case_name}"
                        or f"Trace truncated for {case_name}",
                        "severity": "warning",
                        "source": "trace",
                    }
                )
    return warnings


def _infer_algorithm_type(snapshot_input: Dict[str, Any]) -> str:
    kind = str(((snapshot_input.get("classify") or {}).get("kind")) or "").lower()
    if kind in {"iterative", "recursive", "hybrid", "dummy"}:
        return kind
    worst = ((snapshot_input.get("analyze") or {}).get("worst")) or {}
    totals = (worst or {}).get("totals") or {}
    if isinstance(totals, dict) and totals.get("recurrence"):
        return "recursive"
    return "unknown"


def _build_recursive_presentation(step_by_step: Any) -> Optional[Dict[str, Any]]:
    steps = (
        (step_by_step or {}).get("steps") if isinstance(step_by_step, dict) else None
    )
    if not isinstance(steps, list) or not steps:
        return None
    first = steps[0] if isinstance(steps[0], dict) else {}
    warning = next(
        (
            str(step.get("warning")).strip()
            for step in steps
            if isinstance(step, dict) and step.get("warning")
        ),
        None,
    )
    support_reason = next(
        (
            str((((step.get("derivation") or {}).get("supportReason")))).strip()
            for step in steps
            if isinstance(step, dict)
            and isinstance(step.get("derivation"), dict)
            and (step.get("derivation") or {}).get("supportReason")
        ),
        None,
    )
    return {
        "summary": str(first.get("summary") or "").strip() or None,
        "conceptNote": str(first.get("conceptNote") or "").strip() or None,
        "warning": warning or None,
        "supportReason": support_reason or None,
        "renderHints": {
            "stepExplanationStyle": "italic",
            "latexExplanationSize": "footnotesize",
            "markdownExplanationStyle": "italic",
        },
    }


def build_snapshot(
    snapshot_input: Dict[str, Any], options: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    locale = _normalize_locale(snapshot_input.get("locale"))
    analysis_id = str(snapshot_input.get("analysisId") or "")
    snapshot_id = str(snapshot_input.get("snapshotId") or "")
    created_at = str(snapshot_input.get("createdAt") or "")
    parse_payload = (
        snapshot_input.get("parse")
        if isinstance(snapshot_input.get("parse"), dict)
        else None
    )
    analyze_payload = (
        snapshot_input.get("analyze")
        if isinstance(snapshot_input.get("analyze"), dict)
        else None
    )
    parse_ast = (
        parse_payload.get("ast") if parse_payload and parse_payload.get("ok") else None
    )
    algorithm_info = _extract_algorithm_from_ast(
        parse_ast if isinstance(parse_ast, dict) else {}
    )

    normalized_cases = _resolve_same_as_worst(
        (analyze_payload or {}).get("worst"),
        (analyze_payload or {}).get("best"),
        (analyze_payload or {}).get("avg"),
    )
    selected_case = (
        normalized_cases["worst"]
        or normalized_cases["best"]
        or normalized_cases["avg"]
        or None
    )
    loop_invariant = (
        (analyze_payload or {}).get("loopInvariant")
        or (
            (selected_case or {}).get("loopInvariant")
            if isinstance(selected_case, dict)
            else None
        )
        or None
    )
    totals = (
        (selected_case or {}).get("totals") if isinstance(selected_case, dict) else {}
    )
    normalized_recurrence = _normalize_recurrence((totals or {}).get("recurrence"))
    method_details = [
        (
            {
                "method": "characteristic_equation",
                "detail": totals.get("characteristic_equation"),
            }
            if isinstance(totals, dict) and totals.get("characteristic_equation")
            else None
        ),
        (
            {"method": "iteration", "detail": totals.get("iteration")}
            if isinstance(totals, dict) and totals.get("iteration")
            else None
        ),
        (
            {"method": "recursion_tree", "detail": totals.get("recursion_tree")}
            if isinstance(totals, dict) and totals.get("recursion_tree")
            else None
        ),
        (
            {"method": "master", "detail": totals.get("master")}
            if isinstance(totals, dict) and totals.get("master")
            else None
        ),
    ]
    method_details = [detail for detail in method_details if detail]

    if normalized_recurrence and normalized_recurrence.get("method") == "iteration":
        selected_step_by_step = (
            (totals.get("iteration") or {}).get("step_by_step")
        ) or ((totals.get("characteristic_equation") or {}).get("step_by_step"))
    elif (
        normalized_recurrence
        and normalized_recurrence.get("method") == "characteristic_equation"
    ):
        selected_step_by_step = (
            (totals.get("characteristic_equation") or {}).get("step_by_step")
        ) or ((totals.get("iteration") or {}).get("step_by_step"))
    elif (
        normalized_recurrence
        and normalized_recurrence.get("method") == "recursion_tree"
    ):
        selected_step_by_step = (
            ((totals.get("recursion_tree") or {}).get("step_by_step"))
            or ((totals.get("master") or {}).get("step_by_step"))
            or ((totals.get("characteristic_equation") or {}).get("step_by_step"))
            or ((totals.get("iteration") or {}).get("step_by_step"))
        )
    elif normalized_recurrence and normalized_recurrence.get("method") == "master":
        selected_step_by_step = (
            ((totals.get("master") or {}).get("step_by_step"))
            or ((totals.get("characteristic_equation") or {}).get("step_by_step"))
            or ((totals.get("iteration") or {}).get("step_by_step"))
        )
    else:
        selected_step_by_step = (
            ((totals.get("characteristic_equation") or {}).get("step_by_step"))
            or ((totals.get("iteration") or {}).get("step_by_step"))
            or ((totals.get("master") or {}).get("step_by_step"))
            or ((totals.get("recursion_tree") or {}).get("step_by_step"))
        )
    recursive_presentation = _build_recursive_presentation(selected_step_by_step)

    methods_applied = []
    if normalized_recurrence and normalized_recurrence.get("method"):
        methods_applied.append(normalized_recurrence["method"])
    methods_applied.extend(detail["method"] for detail in method_details)
    methods_applied = list(dict.fromkeys(methods_applied))

    detect_methods_payload = (
        snapshot_input.get("detectMethods")
        if isinstance(snapshot_input.get("detectMethods"), dict)
        else None
    )
    if detect_methods_payload and detect_methods_payload.get("ok"):
        methods_available = (
            detect_methods_payload.get("applicable_methods") or methods_applied
        )
    else:
        methods_available = methods_applied

    warnings = _collect_warnings(snapshot_input)
    trace_by_case = (
        snapshot_input.get("traceByCase")
        if isinstance(snapshot_input.get("traceByCase"), dict)
        else {}
    )
    trace_summary_data = []
    for case_name, trace in trace_by_case.items():
        if not isinstance(trace, dict):
            continue
        trace_data = trace.get("trace") if isinstance(trace.get("trace"), dict) else {}
        summary = (
            trace_data.get("summary")
            if isinstance(trace_data.get("summary"), dict)
            else {}
        )
        diagnostics = (
            trace_data.get("diagnostics")
            if isinstance(trace_data.get("diagnostics"), dict)
            else {}
        )
        trace_summary_data.append(
            {
                "case": case_name,
                "kind": trace_data.get("kind") or trace.get("algorithmKind"),
                "totalSteps": summary.get("totalSteps"),
                "totalCalls": summary.get("totalCalls"),
                "maxRecursionDepth": summary.get("maxRecursionDepth"),
                "truncated": diagnostics.get("truncated"),
                "warnings": diagnostics.get("warnings") or [],
            }
        )

    algorithm_type = _infer_algorithm_type(snapshot_input)
    comparative_llm = (options or {}).get("llm")
    comparative_gpu_cpu = (options or {}).get("gpuCpu")

    snapshot_without_hash: Dict[str, Any] = {
        "schemaVersion": SNAPSHOT_SCHEMA_VERSION,
        "snapshotId": snapshot_id,
        "createdAt": created_at,
        "locale": locale,
        "algorithmType": algorithm_type,
        "meta": {
            "analysisId": analysis_id,
            "sourceOrigin": snapshot_input.get("sourceOrigin") or DEFAULT_SOURCE_ORIGIN,
            "algorithm": algorithm_info,
            "algorithmTypeDetected": algorithm_type,
            "methodsApplied": methods_applied,
            "methodsAvailable": methods_available,
            "hasCaseVariability": bool(
                (analyze_payload or {}).get("has_case_variability")
            ),
            "validity": {
                "parseOk": bool((parse_payload or {}).get("ok")),
                "analysisOk": bool((analyze_payload or {}).get("ok")),
                "traceOk": all(
                    (trace.get("ok") if isinstance(trace, dict) else True)
                    for trace in trace_by_case.values()
                ),
            },
            "warnings": warnings,
            "limitations": [warning["message"] for warning in warnings],
        },
        "input": {
            "originalPseudocode": snapshot_input.get("source"),
            "normalizedPseudocode": mark_not_implemented(
                SNAPSHOT_NOT_IMPLEMENTED_TODOS["normalizedPseudocode"]
            ),
            "procedureName": algorithm_info["name"],
            "parameters": algorithm_info["parameters"],
            "parsingObservations": {
                "ok": bool((parse_payload or {}).get("ok")),
                "available": (parse_payload or {}).get("available"),
                "runtime": (parse_payload or {}).get("runtime"),
                "error": (parse_payload or {}).get("error"),
                "errors": (parse_payload or {}).get("errors"),
            },
            "analysisSummary": {
                "hasCaseVariability": bool(
                    (analyze_payload or {}).get("has_case_variability")
                ),
                "availableCases": [
                    case_name for case_name, value in normalized_cases.items() if value
                ],
            },
            "traceSummary": (
                create_section("available", trace_summary_data)
                if trace_summary_data
                else create_section("not_requested")
            ),
        },
        "internal": {
            "ast": (
                create_section("available", parse_ast)
                if parse_ast
                else create_section("missing_data")
            ),
            "classification": (
                create_section(
                    "available",
                    {
                        "kind": _infer_algorithm_type(snapshot_input),
                        "method": (
                            (snapshot_input.get("classify") or {}).get("method")
                        ),
                    },
                )
                if ((snapshot_input.get("classify") or {}).get("kind"))
                else create_section("missing_data")
            ),
            "recurrence": (
                create_section("available", normalized_recurrence)
                if normalized_recurrence
                else create_section("not_supported")
            ),
            "intermediateMath": (
                create_section(
                    "available",
                    {
                        "proof": (totals or {}).get("proof"),
                        "characteristicEquation": (totals or {}).get(
                            "characteristic_equation"
                        ),
                        "characteristicEquationStepByStep": (
                            (totals or {}).get("characteristic_equation") or {}
                        ).get("step_by_step"),
                        "iteration": (totals or {}).get("iteration"),
                        "iterationStepByStep": (
                            (totals or {}).get("iteration") or {}
                        ).get("step_by_step"),
                        "master": (totals or {}).get("master"),
                        "masterStepByStep": ((totals or {}).get("master") or {}).get(
                            "step_by_step"
                        ),
                        "recursionTree": (totals or {}).get("recursion_tree"),
                        "recursionTreeStepByStep": (
                            (totals or {}).get("recursion_tree") or {}
                        ).get("step_by_step"),
                    },
                )
                if selected_case
                else create_section("missing_data")
            ),
        },
        "globalResult": {
            "cases": {
                "worst": _build_case_result("worst", normalized_cases["worst"]),
                "best": _build_case_result("best", normalized_cases["best"]),
                "avg": _build_case_result("avg", normalized_cases["avg"]),
            }
        },
        "iterative": create_section(
            "available",
            {
                "lineCostTable": {
                    "worst": (
                        ((normalized_cases["worst"] or {}).get("byLine"))
                        if isinstance(normalized_cases["worst"], dict)
                        else None
                    ),
                    "best": (
                        ((normalized_cases["best"] or {}).get("byLine"))
                        if isinstance(normalized_cases["best"], dict)
                        else None
                    ),
                    "avg": (
                        ((normalized_cases["avg"] or {}).get("byLine"))
                        if isinstance(normalized_cases["avg"], dict)
                        else None
                    ),
                },
                "whileBlocks": {
                    "worst": (
                        (
                            ((normalized_cases["worst"] or {}).get("totals") or {}).get(
                                "whileBlocks"
                            )
                        )
                        if isinstance(normalized_cases["worst"], dict)
                        else None
                    ),
                    "best": (
                        (
                            ((normalized_cases["best"] or {}).get("totals") or {}).get(
                                "whileBlocks"
                            )
                        )
                        if isinstance(normalized_cases["best"], dict)
                        else None
                    ),
                    "avg": (
                        (
                            ((normalized_cases["avg"] or {}).get("totals") or {}).get(
                                "whileBlocks"
                            )
                        )
                        if isinstance(normalized_cases["avg"], dict)
                        else None
                    ),
                },
                "summations": {
                    "worst": (
                        (
                            ((normalized_cases["worst"] or {}).get("totals") or {}).get(
                                "T_open"
                            )
                        )
                        if isinstance(normalized_cases["worst"], dict)
                        else None
                    ),
                    "best": (
                        (
                            ((normalized_cases["best"] or {}).get("totals") or {}).get(
                                "T_open"
                            )
                        )
                        if isinstance(normalized_cases["best"], dict)
                        else None
                    ),
                    "avg": (
                        (
                            ((normalized_cases["avg"] or {}).get("totals") or {}).get(
                                "T_open"
                            )
                        )
                        if isinstance(normalized_cases["avg"], dict)
                        else None
                    ),
                },
                "simplificationSteps": {
                    "worst": (
                        (
                            ((normalized_cases["worst"] or {}).get("totals") or {}).get(
                                "procedure"
                            )
                        )
                        if isinstance(normalized_cases["worst"], dict)
                        else None
                    ),
                    "best": (
                        (
                            ((normalized_cases["best"] or {}).get("totals") or {}).get(
                                "procedure"
                            )
                        )
                        if isinstance(normalized_cases["best"], dict)
                        else None
                    ),
                    "avg": (
                        (
                            ((normalized_cases["avg"] or {}).get("totals") or {}).get(
                                "procedure"
                            )
                        )
                        if isinstance(normalized_cases["avg"], dict)
                        else None
                    ),
                },
                "asymptoticProcedure": {
                    "worst": (
                        (
                            ((normalized_cases["worst"] or {}).get("totals") or {}).get(
                                "notes"
                            )
                        )
                        if isinstance(normalized_cases["worst"], dict)
                        else None
                    ),
                    "best": (
                        (
                            ((normalized_cases["best"] or {}).get("totals") or {}).get(
                                "notes"
                            )
                        )
                        if isinstance(normalized_cases["best"], dict)
                        else None
                    ),
                    "avg": (
                        (
                            ((normalized_cases["avg"] or {}).get("totals") or {}).get(
                                "notes"
                            )
                        )
                        if isinstance(normalized_cases["avg"], dict)
                        else None
                    ),
                },
                "caseStepByStep": {
                    "worst": (
                        (
                            ((normalized_cases["worst"] or {}).get("totals") or {}).get(
                                "step_by_step"
                            )
                        )
                        if isinstance(normalized_cases["worst"], dict)
                        else None
                    ),
                    "best": (
                        (
                            ((normalized_cases["best"] or {}).get("totals") or {}).get(
                                "step_by_step"
                            )
                        )
                        if isinstance(normalized_cases["best"], dict)
                        else None
                    ),
                    "avg": (
                        (
                            ((normalized_cases["avg"] or {}).get("totals") or {}).get(
                                "step_by_step"
                            )
                        )
                        if isinstance(normalized_cases["avg"], dict)
                        else None
                    ),
                },
                "trace": (
                    create_section(
                        "available",
                        {
                            case_name: (
                                {
                                    "steps": ((trace.get("trace") or {}).get("steps"))
                                    or [],
                                    "summary": (
                                        (trace.get("trace") or {}).get("summary")
                                    ),
                                    "diagnostics": (
                                        (trace.get("trace") or {}).get("diagnostics")
                                    ),
                                    "callTreeSource": (
                                        (trace.get("trace") or {}).get("callTreeSource")
                                    )
                                    or (
                                        (trace.get("trace") or {}).get("recursionTree")
                                    ),
                                    "reportTraceGraph": _resolve_report_trace_graph(
                                        trace
                                    ),
                                }
                                if isinstance(trace, dict)
                                and isinstance(trace.get("trace"), dict)
                                else None
                            )
                            for case_name, trace in trace_by_case.items()
                        },
                    )
                    if trace_summary_data
                    else create_section("not_requested")
                ),
                "loopInvariant": (
                    create_section("available", loop_invariant)
                    if loop_invariant
                    else mark_not_implemented(
                        SNAPSHOT_NOT_IMPLEMENTED_TODOS["loopInvariant"]
                    )
                ),
            },
        ),
        "recursive": (
            create_section(
                "available",
                {
                    "recurrence": create_section("available", normalized_recurrence),
                    "selectedMethod": (
                        create_section("available", normalized_recurrence.get("method"))
                        if normalized_recurrence and normalized_recurrence.get("method")
                        else create_section("missing_data")
                    ),
                    "methodsAvailable": (
                        create_section("available", methods_available)
                        if methods_available
                        else create_section("missing_data")
                    ),
                    "methodDetails": (
                        create_section("available", method_details)
                        if method_details
                        else create_section("missing_data")
                    ),
                    "presentation": recursive_presentation,
                    "rootsAndMultiplicities": (
                        create_section(
                            "available",
                            (
                                (totals.get("characteristic_equation") or {}).get(
                                    "roots"
                                )
                            ),
                        )
                        if isinstance(totals, dict)
                        and isinstance(totals.get("characteristic_equation"), dict)
                        and (totals.get("characteristic_equation") or {}).get("roots")
                        else create_section("not_supported")
                    ),
                    "stepByStep": (
                        create_section("available", selected_step_by_step)
                        if selected_step_by_step
                        else create_section("not_supported")
                    ),
                    "closedForm": (
                        create_section(
                            "available",
                            {
                                "homogeneousSolution": (
                                    (totals.get("characteristic_equation") or {}).get(
                                        "homogeneous_solution"
                                    )
                                ),
                                "particularSolution": (
                                    (totals.get("characteristic_equation") or {}).get(
                                        "particular_solution"
                                    )
                                ),
                                "generalSolution": (
                                    (totals.get("characteristic_equation") or {}).get(
                                        "general_solution"
                                    )
                                ),
                                "closedForm": (
                                    (totals.get("characteristic_equation") or {}).get(
                                        "closed_form"
                                    )
                                ),
                                "theta": (
                                    (totals.get("characteristic_equation") or {}).get(
                                        "theta"
                                    )
                                ),
                                "baseCases": (
                                    (totals.get("characteristic_equation") or {}).get(
                                        "base_cases"
                                    )
                                ),
                            },
                        )
                        if isinstance(totals, dict)
                        and totals.get("characteristic_equation")
                        else create_section("not_supported")
                    ),
                    "recursionTreeSerializable": (
                        create_section("available", totals.get("recursion_tree"))
                        if isinstance(totals, dict) and totals.get("recursion_tree")
                        else create_section(
                            "not_implemented",
                            todos=[
                                SNAPSHOT_NOT_IMPLEMENTED_TODOS["symbolicRecurrenceTree"]
                            ],
                        )
                    ),
                    "callTrace": (
                        create_section(
                            "available",
                            {
                                case_name: (
                                    {
                                        "steps": (
                                            (trace.get("trace") or {}).get("steps")
                                        )
                                        or [],
                                        "callTreeSource": (
                                            (trace.get("trace") or {}).get(
                                                "callTreeSource"
                                            )
                                        )
                                        or (
                                            (trace.get("trace") or {}).get(
                                                "recursionTree"
                                            )
                                        ),
                                        "summary": (
                                            (trace.get("trace") or {}).get("summary")
                                        ),
                                        "diagnostics": (
                                            (trace.get("trace") or {}).get(
                                                "diagnostics"
                                            )
                                        ),
                                        "reportTraceGraph": _resolve_report_trace_graph(
                                            trace
                                        ),
                                    }
                                    if isinstance(trace, dict)
                                    and isinstance(trace.get("trace"), dict)
                                    else None
                                )
                                for case_name, trace in trace_by_case.items()
                            },
                        )
                        if trace_summary_data
                        else create_section("not_requested")
                    ),
                },
            )
            if normalized_recurrence
            else create_section("not_supported")
        ),
        "comparative": {
            "llm": (
                create_section("available", comparative_llm)
                if comparative_llm
                else create_section("not_requested")
            ),
            "gpuCpu": (
                create_section("available", comparative_gpu_cpu)
                if comparative_gpu_cpu
                else create_section("not_requested")
            ),
        },
        "institutional": {
            "disclaimer": INSTITUTIONAL_DISCLAIMER_TEXT[locale],
            "caseLimitations": [warning["message"] for warning in warnings],
            "generalLimitations": (
                DEFAULT_GENERAL_LIMITATIONS_ES
                if locale == "es"
                else DEFAULT_GENERAL_LIMITATIONS_EN
            ),
        },
    }

    normalized = _strip_undefined_deep(snapshot_without_hash)
    content_hash = hashlib.sha256(
        _stable_stringify(normalized).encode("utf-8")
    ).hexdigest()
    snapshot = _deep_copy(snapshot_without_hash)
    snapshot["contentHash"] = content_hash
    return snapshot


def _derive_metadata(
    snapshot_input: Dict[str, Any], include_gpu_cpu: bool
) -> Dict[str, str]:
    seed_payload = {
        "source": snapshot_input.get("source"),
        "locale": snapshot_input.get("locale"),
        "sourceOrigin": snapshot_input.get("sourceOrigin"),
        "parse": snapshot_input.get("parse"),
        "classify": {
            "kind": (snapshot_input.get("classify") or {}).get("kind"),
            "method": (snapshot_input.get("classify") or {}).get("method"),
        },
        "analyze": snapshot_input.get("analyze"),
        "detectMethods": snapshot_input.get("detectMethods"),
        "traceByCase": snapshot_input.get("traceByCase"),
        "includeGpuCpu": include_gpu_cpu,
    }
    seed_hash = hashlib.sha256(_stable_json(seed_payload).encode("utf-8")).hexdigest()
    created_at_base = datetime(2000, 1, 1, tzinfo=timezone.utc)
    created_at = created_at_base + timedelta(days=int(seed_hash[:8], 16) % 36525)
    return {
        "analysisId": str(uuid.uuid5(ANALYSIS_NAMESPACE, seed_hash)),
        "snapshotId": str(uuid.uuid5(SNAPSHOT_NAMESPACE, seed_hash)),
        "createdAt": _iso_utc(created_at),
    }


def build_export_state(payload: Dict[str, Any]) -> Dict[str, Any]:
    source = str(payload.get("source") or "")
    if not source.strip():
        raise ValueError("Field 'source' is required.")

    locale = _normalize_locale(payload.get("locale"))
    parse_result = payload.get("cachedParse") or _build_parse_payload(source)
    classify_raw = payload.get("cachedClassify") or classify_algorithm(source=source)
    classify_result = {
        "kind": classify_raw.get("kind") if isinstance(classify_raw, dict) else None,
        "method": (
            classify_raw.get("method") if isinstance(classify_raw, dict) else None
        ),
    }
    algorithm_kind = _normalize_algorithm_kind(
        payload.get("algorithmKind") or classify_result.get("kind")
    )
    trace_cases = _normalize_trace_cases(payload.get("includeTraceCases")) or (
        ["worst", "best", "avg"]
        if algorithm_kind in {"iterative", "hybrid"}
        else ["worst"]
    )

    analyze_result = payload.get("cachedAnalyze") or analyze_algorithm(
        source=source,
        mode="all",
        api_key=payload.get("apiKey"),
        avg_model={"mode": "uniform", "predicates": {}},
        algorithm_kind=algorithm_kind,
        preferred_method=payload.get("preferredMethod"),
        locale=locale,
    )

    detect_methods_result = None
    if algorithm_kind in {"recursive", "hybrid"}:
        detect_methods_result = detect_methods(
            source=source,
            algorithm_kind=algorithm_kind,
        )

    trace_by_case: Dict[str, Any] = dict(payload.get("cachedTraceByCase") or {})
    for case_name in trace_cases:
        if case_name in trace_by_case:
            continue
        trace_input = build_default_trace_inputs(source, case_name)
        trace_by_case[case_name] = build_trace_result(
            source=source,
            case=case_name,
            input_size=trace_input["input_size"],
            initial_variables=trace_input["initial_variables"],
            locale=locale,
        )
    trace_by_case = {
        case_name: _canonicalize_trace_response(trace)
        for case_name, trace in trace_by_case.items()
    }

    snapshot_input: Dict[str, Any] = {
        "source": source,
        "locale": locale,
        "sourceOrigin": payload.get("sourceOrigin"),
        "parse": parse_result,
        "classify": classify_result,
        "analyze": analyze_result,
        "detectMethods": detect_methods_result,
        "traceByCase": trace_by_case,
    }

    metadata = _derive_metadata(
        snapshot_input,
        include_gpu_cpu=payload.get("includeGpuCpu", True) is not False,
    )
    snapshot_input["analysisId"] = str(
        payload.get("analysisId") or metadata["analysisId"]
    )
    snapshot_input["snapshotId"] = str(
        payload.get("snapshotId") or metadata["snapshotId"]
    )
    snapshot_input["createdAt"] = str(payload.get("createdAt") or metadata["createdAt"])

    return {
        "snapshotInput": snapshot_input,
        "render": {
            "formats": _normalize_formats(payload.get("formats")),
            "includeSnapshotJson": payload.get("includeSnapshotJson", True),
            "includeZipBundle": payload.get("includeZipBundle", True),
            "pdfTimeoutMs": payload.get("pdfTimeoutMs"),
            "debug": bool(payload.get("debug")),
        },
        "options": {
            "includeGpuCpu": payload.get("includeGpuCpu", True) is not False,
            "includeLlm": bool(payload.get("includeLlm")),
            "llmPayload": payload.get("llmPayload"),
            "apiKey": payload.get("apiKey"),
            "requestOrigin": payload.get("requestOrigin"),
        },
    }
