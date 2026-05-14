"""Domain schemas for deterministic recursive invariant generation."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional

RecursiveInvariantStatus = Literal["ok", "unavailable", "low_confidence"]
RecursiveInvariantReason = Literal[
    "no_recursive_calls",
    "complex_recursion",
    "insufficient_evidence",
]
RecursionType = Literal[
    "linear_recursive",
    "divide_conquer",
    "multiple_recursive",
    "unknown",
]


@dataclass(slots=True)
class RecursiveCallInfo:
    """Information about a single recursive call site."""

    call_expr: str  # e.g., "f(n-1)" or "f(n/2)"
    parameters: List[str] = field(default_factory=list)  # e.g., ["n-1"] or ["n/2"]
    parameter_count: int = 1
    path: List[str] = field(default_factory=list)  # path of branch decisions leading to this call


@dataclass(slots=True)
class RecursiveFacts:
    """Structured local evidence extracted from recursive algorithm."""

    has_recursive_calls: bool = False
    recursive_call_count: int = 0
    recursive_calls: List[RecursiveCallInfo] = field(default_factory=list)

    base_conditions: List[str] = field(default_factory=list)  # e.g., ["n <= 1", "n == 0"]
    base_results: List[str] = field(default_factory=list)  # e.g., ["return 1"]

    size_parameters: List[str] = field(default_factory=list)  # e.g., ["n"]
    recursion_type: RecursionType = "unknown"

    # Confidence metrics
    has_clear_base_case: bool = False
    has_clear_termination: bool = False
    parameters_strictly_decrease: bool = False

    detected_features: List[str] = field(default_factory=list)

    # Are recursive calls mutually exclusive (i.e., located in different branches that cannot both execute)?
    calls_are_mutually_exclusive: bool = False

    # Number of subproblems actually resolved per call (1 if mutually exclusive branches, else recursive_call_count)
    subproblems_per_call: int = 0

    # Maximum number of recursive calls that can execute in a single execution path.
    max_recursive_calls_per_path: int = 0

    # Estimated local work term performed per recursive level (e.g., O(1), O(n), O(n^2)).
    local_work_term: str = "O(1)"

    # Estimated total asymptotic complexity for explanatory summary (best-effort heuristic).
    estimated_total_complexity: str = "O(n)"


@dataclass(slots=True)
class ClassificationResult:
    """Result of recursive pattern classification."""

    recursion_type: RecursionType
    confidence: float  # 0.0 to 1.0
    reasons: List[str] = field(default_factory=list)


@dataclass(slots=True)
class InvariantText:
    """Generated narrative sections for recursive invariant."""

    base_property: str
    inductive_hypothesis: str
    recursive_step: str
    termination_guarantee: str
    didactic_summary: str


SUPPORTED_PATTERNS: tuple[RecursionType, ...] = (
    "linear_recursive",
    "divide_conquer",
    "multiple_recursive",
    "unknown",
)


def _clamp_confidence(value: float) -> float:
    """Clamp confidence to [0.0, 1.0]."""
    return max(0.0, min(1.0, value))


def normalize_locale(locale: Optional[str]) -> str:
    """Normalize locale to 'en' or 'es'."""
    if not locale:
        return "en"
    normalized = locale.lower().strip()
    if normalized.startswith("es"):
        return "es"
    return "en"


def empty_recursive_invariant(
    *,
    locale: Optional[str],
    status: RecursiveInvariantStatus,
    reason: Optional[RecursiveInvariantReason] = None,
) -> Dict[str, Any]:
    """Generate empty/unavailable recursive invariant with proper structure."""

    locale_value = normalize_locale(locale)

    fallback_text = {
        "base_property": "",
        "inductive_hypothesis": "",
        "recursive_step": "",
        "termination_guarantee": "",
    }

    fallback_summary = (
        "Invariante recursivo no disponible"
        if locale_value == "es"
        else "Recursive invariant unavailable"
    )

    return {
        "status": status,
        "reason": reason,
        "recursiveStructure": {
            "baseCondition": "",
            "baseResult": "",
            "recursiveCallPattern": [],
        },
        "invariant": fallback_text,
        "didacticSummary": fallback_summary,
        "confidence": 0.0,
        "evidence": {
            "detectedRecursiveCalls": [],
            "baseConditions": [],
            "recursionType": "unknown",
        },
    }
