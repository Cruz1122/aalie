"""Detect recurrence family and applicable methods for recursive sources."""

from __future__ import annotations

from typing import Any

from .common import ensure_apps_api_on_path


def _coverage_notes(recurrence_info: dict[str, Any] | None) -> list[str]:
    notes = [
        "A method may still yield partial or unsupported bundles without invalidating the family detection."
    ]
    if not isinstance(recurrence_info, dict):
        return notes

    dp_validation = recurrence_info.get("dp_validation")
    if isinstance(dp_validation, dict):
        for reason in dp_validation.get("reasons") or []:
            notes.append(str(reason))
    return notes


def detect_recursive_family(
    source: str,
    algorithm_kind: str | None = None,
) -> dict[str, Any]:
    """Return family/method guidance for recursive analysis work."""

    ensure_apps_api_on_path()

    if not isinstance(source, str) or not source.strip():
        return {
            "ok": False,
            "errors": [{"code": "missing_source", "message": "source is required."}],
        }

    from app.modules.analysis.service import detect_methods
    from app.modules.classification.service import classify_algorithm

    detected_kind = algorithm_kind
    if not detected_kind:
        classification = classify_algorithm(source=source)
        if not classification.get("ok", False):
            return {
                "ok": False,
                "errors": classification.get("errors", []),
            }
        detected_kind = classification.get("kind")

    if detected_kind not in {"recursive", "hybrid"}:
        return {
            "ok": True,
            "status": "unsupported",
            "algorithm_kind": detected_kind,
            "family": None,
            "applicable_methods": [],
            "default_method": None,
            "justification": [
                "Source is not classified as recursive or hybrid, so recurrence-family detection is not applicable."
            ],
            "coverage_notes": _coverage_notes(None),
        }

    detect_result = detect_methods(source=source, algorithm_kind=detected_kind)
    if not detect_result.get("ok", False):
        return {
            "ok": True,
            "status": "inconclusive",
            "algorithm_kind": detected_kind,
            "family": None,
            "applicable_methods": [],
            "default_method": None,
            "justification": [
                *(error.get("message", "") for error in detect_result.get("errors", []))
            ],
            "coverage_notes": _coverage_notes(None),
        }

    recurrence_info = detect_result.get("recurrence_info") or {}
    family = recurrence_info.get("type")
    strategy = recurrence_info.get("strategy_family") or {}
    applicable_methods = detect_result.get("applicable_methods", [])
    default_method = detect_result.get("default_method")

    justification = []
    if recurrence_info.get("form"):
        justification.append(f"Detected recurrence form: {recurrence_info['form']}")
    if strategy.get("label"):
        justification.append(
            f"Strategy family: {strategy['label']} ({strategy.get('description', '').strip()})"
        )
    if default_method:
        justification.append(f"Default method under current contract: {default_method}")
    if not justification:
        justification.append(
            "No recurrence family could be defended from current evidence."
        )

    status = "available" if family else "inconclusive"
    return {
        "ok": True,
        "status": status,
        "algorithm_kind": detected_kind,
        "family": family,
        "applicable_methods": applicable_methods,
        "default_method": default_method,
        "justification": justification,
        "coverage_notes": _coverage_notes(recurrence_info),
        "recurrence_info": recurrence_info,
    }
