"""
Reusable trace service for execution-trace generation.
"""

from __future__ import annotations

import re
from typing import Any, Dict, Optional

from ..classification.service import classify_algorithm as classify_algo
from ..execution.derivations.structured_trace_builder import (
    build_structured_trace_result,
)
from ..execution.derivations.structured_trace_models import StructuredTraceRenderConfig
from ..execution.executor import CodeExecutor
from ..parsing.service import parse_source


def build_default_trace_inputs(
    source: str,
    case: str = "worst",
) -> Dict[str, Optional[Dict[str, Any]] | int]:
    """
    Builds the default trace inputs used by export and the frontend trace view.
    """
    default_n = 5
    uses_x = re.search(r"(^|[^A-Za-z0-9_])x([^A-Za-z0-9_]|$)", source, re.I) is not None
    uses_array_a = re.search(r"(^|[^A-Za-z0-9_])A\s*\[", source) is not None
    has_zero_check = (
        re.search(r"n\s*[=<>]=\s*0|n\s*=\s*0|IF\s*\(\s*n\s*[=<>]=\s*0", source, re.I)
        is not None
    )
    is_sorting_like = (
        re.search(
            r"(merge|quick|heap|bubble|insertion|selection|sort|ordenar|mezclar|particionar)",
            source,
            re.I,
        )
        is not None
    )

    n = 0 if case == "worst" and has_zero_check else default_n
    safe_n = max(1, n)
    asc_array = [index + 1 for index in range(safe_n)]
    desc_array = list(reversed(asc_array))
    selected_array = asc_array if case == "best" and is_sorting_like else (
        desc_array if is_sorting_like else asc_array
    )

    variables: Dict[str, Any] = {}
    if uses_array_a and n > 0:
        variables["A"] = selected_array

    if uses_x and n > 0:
        if case == "best":
            variables["x"] = selected_array[0]
        elif case == "avg":
            variables["x"] = selected_array[len(selected_array) // 2]
        else:
            variables["x"] = selected_array[-1]

    return {
        "input_size": n,
        "initial_variables": variables or None,
    }


def build_trace_result(
    source: str,
    case: str = "worst",
    input_size: Optional[int] = None,
    initial_variables: Optional[Dict[str, Any]] = None,
    locale: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generates the same trace payload returned by `/analyze/trace`, but as a
    reusable service for internal callers such as export.
    """
    try:
        parse_result = parse_source(source)
        if not parse_result.get("ok", False):
            return {"ok": False, "errors": parse_result.get("errors", [])}

        ast = parse_result.get("ast")
        if not ast:
            return {
                "ok": False,
                "errors": [
                    {
                        "message": "No se pudo obtener el AST del código",
                        "line": None,
                        "column": None,
                    }
                ],
            }

        classification_result = classify_algo(ast=ast)
        algorithm_kind = classification_result.get("kind", "unknown")

        locale_val = (locale or "en").lower()[:2]
        if locale_val not in ("en", "es"):
            locale_val = "en"

        executor = CodeExecutor(
            ast,
            input_size,
            case,
            initial_variables=initial_variables,
            locale=locale_val,
        )
        trace = executor.execute()

        steps = trace.get("steps", [])
        recursion_tree = trace.get("recursionTree", {})
        calls = recursion_tree.get("calls", [])
        max_depth = max((c.get("depth", 0) for c in calls), default=0)
        trace_enriched: Dict[str, Any] = {
            **trace,
            "callTreeSource": recursion_tree if recursion_tree else None,
            "kind": algorithm_kind,
            "summary": {
                "totalSteps": len(steps),
                "totalCalls": len(calls),
                "maxRecursionDepth": max_depth,
                "algorithmKind": algorithm_kind,
            },
            "diagnostics": {
                "truncated": trace.get("recursion_truncated", False),
                "truncationReason": (
                    "max_depth" if trace.get("recursion_truncated") else None
                ),
                "warnings": [],
            },
        }

        import logging as _logging

        derived: Dict[str, Any] = {}
        try:
            structured_trace = build_structured_trace_result(
                trace_enriched, StructuredTraceRenderConfig(locale=locale_val)
            )
            derived["structuredTrace"] = {
                "patternKind": structured_trace["patternKind"],
                "graph": structured_trace["graph"],
                "classification": structured_trace["classification"],
            }
        except Exception as exc:
            _logging.getLogger(__name__).warning(
                "build_structured_trace_result failed: %s", str(exc), exc_info=True
            )
            derived["structuredTrace"] = {
                "patternKind": "unknown",
                "graph": {"nodes": [], "edges": []},
                "classification": {
                    "patternKind": "unknown",
                    "confidence": 0.0,
                    "evidence": [],
                },
                "buildError": str(exc),
            }

        return {
            "ok": True,
            "trace": trace_enriched,
            "algorithmKind": algorithm_kind,
            "derived": derived,
            "metadata": {
                "pseudocode": source,
                "inputSize": input_size,
                "case": case,
                "message": "Trace generado correctamente",
            },
        }
    except Exception as exc:
        return {
            "ok": False,
            "errors": [
                {
                    "message": f"Error generando rastro: {str(exc)}",
                    "line": None,
                    "column": None,
                }
            ],
        }
