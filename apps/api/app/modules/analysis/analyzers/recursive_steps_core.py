from __future__ import annotations

import re
from typing import Any, Dict, List, Literal, Optional

StepStatus = Literal["complete", "partial", "unsupported", "error"]
StepConfidence = Literal["high", "medium", "low"]


def locale_key(locale: str) -> str:
    return "es" if str(locale).lower().startswith("es") else "en"


def get_asymptotic_notation(bound_kind: str, result: str) -> str:
    """
    Convierte resultado a notación asintótica correcta según bound_kind.

    Args:
        bound_kind: "equivalent" | "upper" | "lower" | "partial"
        result: Expresión asintótica (ej. φⁿ, n², n)

    Returns:
        Notación asintótica (ej. Θ(φⁿ), O(n²), Ω(n))
    """

    def _unwrap(expression: str) -> str:
        expression = str(expression).strip()
        expression = re.sub(r"^T\(n\)\s*=\s*", "", expression).strip()
        for prefix in ("\\Theta(", "O(", "\\Omega("):
            if expression.startswith(prefix) and expression.endswith(")"):
                expression = expression[len(prefix) : -1].strip()
                break
        return expression

    # Limpiar resultado de notaciones previas y prefijos como T(n)=
    result = _unwrap(result)
    while True:
        unwrapped = _unwrap(result)
        if unwrapped == result:
            break
        result = unwrapped

    if bound_kind == "equivalent":
        return f"\\Theta({result})"
    elif bound_kind == "upper":
        return f"O({result})"
    elif bound_kind == "lower":
        return f"\\Omega({result})"
    else:  # "partial"
        return f"\\approx {result}"


def render_template(
    template_strings: Dict[str, Dict[str, str]],
    locale: str,
    key: str,
    params: Optional[Dict[str, Any]] = None,
) -> str:
    table = template_strings.get(locale_key(locale), template_strings.get("en", {}))
    template = table.get(key, key)
    safe_params = {k: str(v) for k, v in (params or {}).items()}
    try:
        return template.format(**safe_params)
    except Exception:
        return template


def compute_overall_status(steps: List[Dict[str, Any]]) -> StepStatus:
    statuses = [s.get("status", "complete") for s in steps]
    if "error" in statuses:
        return "error"
    if "unsupported" in statuses:
        return "unsupported"
    if "partial" in statuses:
        return "partial"
    return "complete"


def make_recursive_step(
    *,
    template_strings: Dict[str, Dict[str, str]],
    locale: str,
    index: int,
    step_id: str,
    kind: str,
    title: str,
    status: StepStatus,
    confidence: StepConfidence,
    summary_key: str,
    concept_key: str,
    warning_key: Optional[str] = None,
    params: Optional[Dict[str, Any]] = None,
    primary_latex: Optional[str] = None,
    items: Optional[List[Dict[str, str]]] = None,
    payload: Optional[Dict[str, Any]] = None,
    derivation: Optional[Dict[str, Any]] = None,
    codes: Optional[List[str]] = None,
    assumptions: Optional[List[str]] = None,
    blocked_by: Optional[List[str]] = None,
) -> Dict[str, Any]:
    summary = render_template(template_strings, locale, summary_key, params)
    concept = render_template(template_strings, locale, concept_key, params)
    warning = (
        render_template(template_strings, locale, warning_key, params) if warning_key else None
    )
    step: Dict[str, Any] = {
        "id": step_id,
        "index": index,
        "kind": kind,
        "title": title,
        "status": status,
        "math": {
            "primaryLatex": primary_latex,
            "items": items or [],
        },
        "summary": summary,
        "conceptNote": concept,
        "teachingNote": concept,
        "warning": warning,
        "confidence": confidence,
        "payload": payload or {},
        "template": {
            "summaryKey": summary_key,
            "conceptKey": concept_key,
            "warningKey": warning_key,
            "params": params or {},
        },
        "audit": {
            "codes": codes or [],
            "assumptions": assumptions or [],
            "blockedBy": blocked_by or [],
        },
    }
    if derivation:
        step["derivation"] = derivation
    return step
