"""Orchestrator for deterministic recursive invariant generation."""

from __future__ import annotations

from typing import Any, Dict, Optional

from .classifier import classify_recursion_pattern
from .extractor import extract_recursive_facts
from .schemas import (
    RecursiveFacts,
    RecursiveInvariantStatus,
    empty_recursive_invariant,
    normalize_locale,
)
from .templates import (
    build_invariant_text,
)


def generate_recursive_invariant(
    ast: Optional[Dict[str, Any]] = None,
    facts: Optional[RecursiveFacts] = None,
    locale: Optional[str] = None,
) -> Dict[str, Any]:
    """Build fixed-shape recursive invariant payload from AST or extracted facts.

    This function is deterministic and uses only local AST evidence.

    Args:
        ast: Algorithm AST (alternative to providing facts)
        facts: Pre-extracted recursive facts (alternative to providing ast)
        locale: Language code ("en" or "es")

    Returns:
        Dict with status, recursiveStructure, invariant sections, confidence, evidence
    """

    locale_value = normalize_locale(locale)

    # Extract facts if not provided
    if facts is None:
        if ast is None:
            return empty_recursive_invariant(
                locale=locale_value,
                status="unavailable",
                reason="no_recursive_calls",
            )
        facts = extract_recursive_facts(ast)

    # If no recursion detected
    if not facts.has_recursive_calls:
        return empty_recursive_invariant(
            locale=locale_value,
            status="unavailable",
            reason="no_recursive_calls",
        )

    # Classify recursion pattern
    classification = classify_recursion_pattern(facts)
    recursion_type = classification.recursion_type
    confidence = classification.confidence

    # Build invariant text
    text = build_invariant_text(recursion_type, facts, locale=locale_value)

    # Determine status based on confidence
    if confidence >= 0.75:
        status: RecursiveInvariantStatus = "ok"
    elif confidence >= 0.50:
        status = "low_confidence"
    else:
        status = "unavailable"

    # Build recursive structure information
    recursive_call_patterns = []
    for call in facts.recursive_calls:
        recursive_call_patterns.append(
            {
                "calls": call.call_expr,
                "parameters": call.parameters,
            }
        )

    base_condition = facts.base_conditions[0] if facts.base_conditions else ""
    base_result = facts.base_results[0] if facts.base_results else ""

    recursive_structure = {
        "baseCondition": base_condition,
        "baseResult": base_result,
        "recursiveCallPattern": recursive_call_patterns,
    }

    # Build evidence
    evidence = {
        "detectedRecursiveCalls": [call.call_expr for call in facts.recursive_calls],
        "baseConditions": facts.base_conditions,
        "recursionType": recursion_type,
    }

    # Assemble complete payload
    return {
        "status": status,
        "reason": "insufficient_evidence" if status == "unavailable" else None,
        "recursiveStructure": recursive_structure,
        "invariant": {
            "baseProperty": text.base_property,
            "inductiveHypothesis": text.inductive_hypothesis,
            "recursiveStep": text.recursive_step,
            "terminationGarantee": text.termination_guarantee,
        },
        "didacticSummary": text.didactic_summary,
        "confidence": confidence,
        "evidence": evidence,
    }
