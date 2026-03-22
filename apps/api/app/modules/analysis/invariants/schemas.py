"""Domain schemas for deterministic loop invariant generation."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional

LoopInvariantStatus = Literal["ok", "unavailable", "low_confidence"]
LoopInvariantReason = Literal[
    "no_supported_loop",
    "insufficient_evidence",
    "pattern_not_supported",
]
LoopNodeType = Literal["FOR", "WHILE", "REPEAT"]
PatternType = Literal[
    "binary_exponentiation_state",
    "binary_search_interval",
    "euclidean_gcd",
    "partition_by_pivot",
    "merge_progress",
    "filter_progress",
    "insertion_prefix_sorted",
    "selection_prefix_sorted",
    "loop_progress_only",
    "traversal",
    "search",
    "accumulation",
    "field_assignment_progress",
    "counting",
    "extrema",
    "prefix_progress",
    "two_pointer_like",
    "sorting_pass",
    "state_refinement",
    "unknown",
]

SUPPORTED_PATTERNS: tuple[PatternType, ...] = (
    "binary_exponentiation_state",
    "binary_search_interval",
    "euclidean_gcd",
    "partition_by_pivot",
    "merge_progress",
    "filter_progress",
    "insertion_prefix_sorted",
    "selection_prefix_sorted",
    "loop_progress_only",
    "traversal",
    "search",
    "accumulation",
    "field_assignment_progress",
    "counting",
    "extrema",
    "prefix_progress",
    "two_pointer_like",
    "sorting_pass",
    "state_refinement",
    "unknown",
)


@dataclass(slots=True)
class LoopFacts:
    """Structured local evidence extracted from one loop node."""

    node: Dict[str, Any]
    node_type: LoopNodeType
    depth: int
    order: int
    line_start: Optional[int]
    line_end: Optional[int]

    control_variables: List[str] = field(default_factory=list)
    condition_reads: List[str] = field(default_factory=list)
    body_reads: List[str] = field(default_factory=list)
    body_writes: List[str] = field(default_factory=list)
    accumulators: List[str] = field(default_factory=list)
    bound_variables: List[str] = field(default_factory=list)
    collection_variables: List[str] = field(default_factory=list)
    target_variables: List[str] = field(default_factory=list)
    key_updates: List[str] = field(default_factory=list)
    key_conditions: List[str] = field(default_factory=list)
    comparisons: List[str] = field(default_factory=list)
    detected_features: List[str] = field(default_factory=list)
    direction_by_control: Dict[str, str] = field(default_factory=dict)

    assignment_count: int = 0
    conditional_count: int = 0
    nested_loop_count: int = 0
    body_statement_count: int = 0
    non_trivial_statement_count: int = 0
    return_count: int = 0
    collection_read_count: int = 0
    collection_write_count: int = 0
    condition_comparison_count: int = 0
    swap_like_count: int = 0
    has_early_exit: bool = False

    # Optional anchors for specialized loop semantics.
    exponent_var: Optional[str] = None
    base_var: Optional[str] = None
    result_var: Optional[str] = None
    modulus_var: Optional[str] = None

    score: float = 0.0
    score_components: Dict[str, float] = field(default_factory=dict)


@dataclass(slots=True)
class ClassificationResult:
    pattern: PatternType
    confidence: float
    reasons: List[str] = field(default_factory=list)


@dataclass(slots=True)
class InvariantText:
    property_statement: str
    initialization: str
    maintenance: str
    finalization: str
    didactic_summary: str


def normalize_locale(locale: Optional[str]) -> str:
    normalized = (locale or "en").strip().lower()[:2]
    if normalized not in ("en", "es"):
        return "en"
    return normalized


def _fallback_copy(locale: str, status: LoopInvariantStatus) -> Dict[str, str]:
    if locale == "es":
        if status == "unavailable":
            return {
                "property": "No se identificó un ciclo soportado para construir un invariante formal.",
                "initialization": "Inicialización no disponible: el algoritmo no contiene un ciclo FOR/WHILE/REPEAT analizable.",
                "maintenance": "Mantenimiento no disponible: no hay evidencia local de un ciclo candidato.",
                "finalization": "Finalización no disponible: no se puede derivar una conclusión formal sin un ciclo candidato.",
                "summary": "El motor determinista no encontró un ciclo soportado en el AST.",
            }
        return {
            "property": "La evidencia local del ciclo seleccionado no es suficiente para fijar una propiedad invariante específica.",
            "initialization": "Inicialización: se reconoce el inicio del ciclo, pero no hay evidencia suficiente para formalizar una propiedad concreta.",
            "maintenance": "Mantenimiento: se observan actualizaciones iterativas, pero no basta para garantizar una relación semántica única.",
            "finalization": "Finalización: al terminar el ciclo, la relación exacta entre estado parcial y resultado no es demostrable con alta confianza.",
            "summary": "Se detectó un ciclo, pero la evidencia local es insuficiente para un invariant confiable.",
        }

    if status == "unavailable":
        return {
            "property": "No supported loop was identified to build a formal loop invariant.",
            "initialization": "Initialization unavailable: the algorithm has no analyzable FOR/WHILE/REPEAT loop.",
            "maintenance": "Maintenance unavailable: there is no local evidence for a loop candidate.",
            "finalization": "Finalization unavailable: no formal conclusion can be derived without a loop candidate.",
            "summary": "The deterministic engine did not find a supported loop in the AST.",
        }
    return {
        "property": "Local evidence on the selected loop is not sufficient to fix a specific invariant property.",
        "initialization": "Initialization: loop entry is recognized, but evidence is insufficient to formalize a concrete property.",
        "maintenance": "Maintenance: iterative updates are present, but they do not guarantee a unique semantic relation.",
        "finalization": "Finalization: when the loop ends, the exact relation between partial state and outcome cannot be proven with high confidence.",
        "summary": "A loop was detected, but local evidence is insufficient for a reliable invariant.",
    }


def empty_loop_invariant(
    *,
    locale: Optional[str],
    status: LoopInvariantStatus,
    reason: Optional[LoopInvariantReason],
) -> Dict[str, Any]:
    """Return fixed-shape payload for unavailable/low-confidence scenarios."""

    locale_value = normalize_locale(locale)
    text = _fallback_copy(locale_value, status)
    return {
        "status": status,
        "reason": reason,
        "selectedLoop": {
            "nodeType": None,
            "lineStart": None,
            "lineEnd": None,
            "depth": 0,
            "score": 0.0,
            "patternType": "unknown",
            "controlVariables": [],
            "stateVariables": [],
            "boundVariables": [],
            "collectionVariables": [],
            "targetVariables": [],
            "keyUpdates": [],
            "keyConditions": [],
        },
        "invariant": {
            "propertyStatement": text["property"],
            "initialization": text["initialization"],
            "maintenance": text["maintenance"],
            "finalization": text["finalization"],
        },
        "didacticSummary": text["summary"],
        "evidence": {
            "conditionReads": [],
            "bodyWrites": [],
            "bodyReads": [],
            "detectedFeatures": [],
            "classificationConfidence": None,
            "templateVariant": None,
        },
    }
