"""Orchestrator for deterministic loop invariant generation."""

from __future__ import annotations

import re
from typing import Any, Dict, Optional

from .classifier import classify_loop_pattern
from .schemas import SUPPORTED_PATTERNS, empty_loop_invariant, normalize_locale
from .selector import select_significant_loop
from .templates import (
    build_invariant_text,
    generate_behaviour,
    resolve_template_variant,
)

_SPANISH_ACCENT_REPLACEMENTS: tuple[tuple[str, str], ...] = (
    ("iteracion", "iteración"),
    ("iteraciones", "iteraciones"),
    ("inicializacion", "inicialización"),
    ("finalizacion", "finalización"),
    ("condicion", "condición"),
    ("condiciones", "condiciones"),
    ("busqueda", "búsqueda"),
    ("maximo", "máximo"),
    ("minimo", "mínimo"),
    ("vacio", "vacío"),
    ("despues", "después"),
    ("precondicion", "precondición"),
    ("postcondicion", "postcondición"),
    ("semantica", "semántica"),
    ("sintactica", "sintáctica"),
    ("unica", "única"),
    ("solo", "solo"),
    ("posicion", "posición"),
    ("estan", "están"),
)


def _apply_spanish_accents(text: str) -> str:
    """Restore common Spanish accents in deterministic template output."""

    result = text
    for plain, accented in _SPANISH_ACCENT_REPLACEMENTS:
        pattern = re.compile(rf"\b{re.escape(plain)}\b", flags=re.IGNORECASE)

        def _replace(match: re.Match[str]) -> str:
            word = match.group(0)
            if word.isupper():
                return accented.upper()
            if word[:1].isupper():
                return accented[:1].upper() + accented[1:]
            return accented

        result = pattern.sub(_replace, result)
    return result


def _normalize_spanish_text_output(payload: Dict[str, Any], locale_value: str) -> None:
    if locale_value != "es":
        return

    invariant = payload.get("invariant")
    if isinstance(invariant, dict):
        for key in (
            "propertyStatement",
            "initialization",
            "maintenance",
            "finalization",
        ):
            value = invariant.get(key)
            if isinstance(value, str):
                invariant[key] = _apply_spanish_accents(value)

    didactic_summary = payload.get("didacticSummary")
    if isinstance(didactic_summary, str):
        payload["didacticSummary"] = _apply_spanish_accents(didactic_summary)


def generate_loop_invariant(
    ast: Optional[Dict[str, Any]], locale: Optional[str] = None
) -> Dict[str, Any]:
    """Build fixed-shape loop invariant payload from AST.

    This function is deterministic and uses only local AST evidence.
    """

    locale_value = normalize_locale(locale)

    if not isinstance(ast, dict):
        return empty_loop_invariant(
            locale=locale_value,
            status="unavailable",
            reason="no_supported_loop",
        )

    selection = select_significant_loop(ast)
    selected = selection.selected
    if selected is None:
        return empty_loop_invariant(
            locale=locale_value,
            status="unavailable",
            reason="no_supported_loop",
        )

    classification = classify_loop_pattern(selected)
    pattern = classification.pattern

    output_confidence = classification.confidence

    if pattern not in SUPPORTED_PATTERNS:
        template_variant = resolve_template_variant("unknown", selected)
        text = build_invariant_text(
            "unknown",
            selected,
            locale_value,
            template_variant=template_variant,
        )
        status = "low_confidence"
        reason = "pattern_not_supported"
        output_pattern = "unknown"
    else:
        template_variant = resolve_template_variant(pattern, selected)
        text = build_invariant_text(
            pattern,
            selected,
            locale_value,
            template_variant=template_variant,
        )
        output_pattern = pattern

        generic_or_guard_failed = template_variant in {
            "unknown",
            "state_refinement_generic",
            "object_field_refinement",
            "incremental_build",
            "extrema_generic",
        }
        ambiguous_accumulation = pattern == "accumulation" and len(selected.accumulators) > 1
        if (
            pattern == "unknown"
            or classification.confidence < 0.72
            or generic_or_guard_failed
            or ambiguous_accumulation
        ):
            status = "low_confidence"
            reason = "insufficient_evidence"
        else:
            status = "ok"
            reason = None

    # Calibrated confidence policy: low-confidence outcomes should not emit
    # near-certain scores, even when local syntactic evidence is strong.
    if status == "low_confidence":
        output_confidence = min(output_confidence, 0.69)

    state_variables = sorted(set(selected.body_writes).union(set(selected.accumulators)))

    detected_features = sorted(
        set(selected.detected_features)
        .union({f"pattern:{output_pattern}"})
        .union({f"template:{template_variant}"})
        .union({f"confidence:{output_confidence:.3f}"})
        .union({f"rule:{reason_text}" for reason_text in classification.reasons})
    )

    payload = {
        "status": status,
        "reason": reason,
        "selectedLoop": {
            "nodeType": selected.node_type,
            "lineStart": selected.line_start,
            "lineEnd": selected.line_end,
            "depth": selected.depth,
            "score": selected.score,
            "patternType": output_pattern,
            "controlVariables": selected.control_variables,
            "stateVariables": state_variables,
            "boundVariables": selected.bound_variables,
            "collectionVariables": selected.collection_variables,
            "targetVariables": selected.target_variables,
            "keyUpdates": selected.key_updates,
            "keyConditions": selected.key_conditions,
        },
        "invariant": {
            "propertyStatement": text.property_statement,
            "initialization": text.initialization,
            "maintenance": text.maintenance,
            "finalization": text.finalization,
        },
        "didacticSummary": text.didactic_summary,
        "behaviour": generate_behaviour(output_pattern, locale_value),
        "evidence": {
            "conditionReads": selected.condition_reads,
            "bodyWrites": selected.body_writes,
            "bodyReads": selected.body_reads,
            "detectedFeatures": detected_features,
            "classificationConfidence": output_confidence,
            "templateVariant": template_variant,
        },
    }
    _normalize_spanish_text_output(payload, locale_value)
    return payload
