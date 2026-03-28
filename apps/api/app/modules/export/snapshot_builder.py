"""
Snapshot-input collection and deterministic metadata for export.
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

    structured_trace = ((trace.get("derived") or {}).get("structuredTrace") or {})
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
                _canonicalize_trace_step(step) for step in (trace_body.get("steps") or [])
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
    return dt.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace(
        "+00:00", "Z"
    )


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
        "method": classify_raw.get("method") if isinstance(classify_raw, dict) else None,
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
    snapshot_input["analysisId"] = str(payload.get("analysisId") or metadata["analysisId"])
    snapshot_input["snapshotId"] = str(payload.get("snapshotId") or metadata["snapshotId"])
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
