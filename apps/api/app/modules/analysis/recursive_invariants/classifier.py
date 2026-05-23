"""Recursion pattern classifier for recursive invariant generation."""

from __future__ import annotations

from typing import Set

from .schemas import (
    ClassificationResult,
    RecursiveFacts,
    _clamp_confidence,
)


def classify_recursion_pattern(facts: RecursiveFacts) -> ClassificationResult:
    """Classify recursion pattern using structural evidence from the AST.

    Args:
        facts: Extracted recursive facts from AST analysis

    Returns:
        ClassificationResult with detected pattern and confidence
    """

    # If no recursive calls detected, cannot classify
    if not facts.has_recursive_calls or facts.recursive_call_count == 0:
        return ClassificationResult(
            recursion_type="unknown",
            confidence=0.0,
            reasons=["No recursive calls detected"],
        )

    # Analyze call parameters to detect pattern type
    param_patterns: Set[str] = set()
    for call in facts.recursive_calls:
        for param in call.parameters:
            # Normalize parameter patterns (e.g., "n-1" -> "subtraction", "n/2" -> "division")
            if "-" in param:
                param_patterns.add("subtraction")
            elif "/" in param:
                param_patterns.add("division")
            elif "*" in param:
                param_patterns.add("multiplication")
            else:
                param_patterns.add("unknown")

    # If only one recursive call can execute per path, prefer single-branch divide-and-conquer.
    if getattr(facts, "calls_are_mutually_exclusive", False) or (
        getattr(facts, "max_recursive_calls_per_path", 0) <= 1 and facts.recursive_call_count >= 2
    ):
        reasons = [
            "Detected recursive calls in mutually exclusive branches",
            "Only one recursive branch executes per call (e.g., binary search pattern)",
        ]
        confidence = 0.88
        if facts.has_clear_base_case:
            confidence += 0.05
        if facts.has_clear_termination:
            confidence += 0.03
        return ClassificationResult(
            recursion_type="divide_conquer",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # If multiple recursive calls detected, prefer multiple_recursive classification
    if facts.recursive_call_count >= 2:
        reasons = [
            f"Detected {facts.recursive_call_count} independent recursive calls",
            "Multiple branches explored: characteristic of multiple recursion",
        ]

        confidence = 0.78
        if facts.has_clear_base_case:
            confidence += 0.08
        if facts.has_clear_termination:
            confidence += 0.05
        # Slight penalty if parameters don't strictly decrease
        if not facts.parameters_strictly_decrease:
            confidence -= 0.10

        return ClassificationResult(
            recursion_type="multiple_recursive",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # Detect linear recursion (n-k pattern, single call with shifts)
    if param_patterns == {"subtraction"} or (param_patterns <= {"subtraction", "unknown"}):
        reasons = [
            "Parameters consistently decrease by constants (e.g., n-1, n-2)",
            "Single recursion branch or linear shift pattern detected",
        ]

        # Confidence based on evidence clarity
        confidence = 0.82
        if facts.has_clear_base_case:
            confidence += 0.08
        if facts.parameters_strictly_decrease:
            confidence += 0.05
        if facts.has_clear_termination:
            confidence += 0.03

        return ClassificationResult(
            recursion_type="linear_recursive",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # Detect divide-and-conquer (n/b pattern with multiple calls)
    if "division" in param_patterns and facts.recursive_call_count >= 2:
        reasons = [
            "Problem divided into multiple subproblems",
            f"Detected {facts.recursive_call_count} recursive calls with division pattern",
            "Characteristic of divide-and-conquer strategy",
        ]

        confidence = 0.85
        if facts.has_clear_base_case:
            confidence += 0.08
        if facts.parameters_strictly_decrease:
            confidence += 0.05
        if facts.has_clear_termination:
            confidence += 0.03

        return ClassificationResult(
            recursion_type="divide_conquer",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # Detect divide-and-conquer (single call with division, but clearly DC structure)
    if "division" in param_patterns and facts.recursive_call_count == 1:
        reasons = [
            "Single recursive call with problem division",
            "May be tail-recursive or single-branch divide-and-conquer variant",
        ]

        confidence = 0.68
        if facts.has_clear_base_case:
            confidence += 0.08
        if facts.parameters_strictly_decrease:
            confidence += 0.10
        if facts.has_clear_termination:
            confidence += 0.05

        # If has multiplication or mixed patterns with division, likely divide-and-conquer
        if len(param_patterns) > 1 and "multiplication" in param_patterns:
            confidence += 0.15
            reasons.append("Combined with multiplication suggests recursive squaring")

        return ClassificationResult(
            recursion_type="divide_conquer",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # (handled earlier) multiple_recursive fallback removed here

    # Single recursive call = linear recursion
    if facts.recursive_call_count == 1:
        reasons = [
            "Single recursive call detected",
            "Linear progression through recursion tree",
        ]

        confidence = 0.75
        if facts.has_clear_base_case:
            confidence += 0.10
        if facts.parameters_strictly_decrease:
            confidence += 0.08
        if facts.has_clear_termination:
            confidence += 0.05

        return ClassificationResult(
            recursion_type="linear_recursive",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # Fallback: unable to classify with high confidence
    return ClassificationResult(
        recursion_type="unknown",
        confidence=0.3,
        reasons=[
            "Pattern does not match standard recursion categories",
            "May involve complex parameter transformations",
        ],
    )
