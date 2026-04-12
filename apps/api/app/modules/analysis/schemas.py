"""
Modelos Pydantic para el módulo de analysis.
"""

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class AvgModelConfig(BaseModel):
    mode: str = "uniform"  # "uniform" | "symbolic"
    predicates: Optional[Dict[str, str]] = None  # ej: {"A[j] > A[j+1]": "1/2"}


class AnalyzeRequest(BaseModel):
    source: str
    mode: str = "worst"  # "worst" | "best" | "avg" | "all"
    avgModel: Optional[AvgModelConfig] = None  # Modelo probabilístico para caso promedio
    algorithm_kind: Optional[str] = None  # "iterative" | "recursive" | "hybrid" | "unknown"
    preferred_method: Optional[str] = (
        None  # "characteristic_equation" | "iteration" | "recursion_tree" | "master"
    )
    locale: Optional[str] = None  # "en" | "es" - idioma para etiquetas del procedimiento


class LineCost(BaseModel):
    line: int
    kind: str  # "assign" | "if" | "for" | "while" | "repeat" | "call" | "return" | "decl" | "other"
    ck: str
    ops: Optional[int] = None  # Operaciones elementales por ejecución
    count: str
    count_raw: str  # Sumatorias sin simplificar
    note: Optional[str] = None
    unbounded: Optional[bool] = None  # True si el bucle puede no terminar
    unbounded_kind: Optional[str] = None  # "non_terminating" | "unknown"
    loopBlockRef: Optional[str] = None


class LoopInvariantSelectedLoop(BaseModel):
    nodeType: Optional[Literal["FOR", "WHILE", "REPEAT"]] = None
    lineStart: Optional[int] = None
    lineEnd: Optional[int] = None
    depth: int = 0
    score: float = 0.0
    patternType: Literal[
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
        "counting",
        "extrema",
        "prefix_progress",
        "two_pointer_like",
        "sorting_pass",
        "state_refinement",
        "unknown",
    ] = "unknown"
    controlVariables: List[str] = Field(default_factory=list)
    stateVariables: List[str] = Field(default_factory=list)
    boundVariables: List[str] = Field(default_factory=list)
    collectionVariables: List[str] = Field(default_factory=list)
    targetVariables: List[str] = Field(default_factory=list)
    keyUpdates: List[str] = Field(default_factory=list)
    keyConditions: List[str] = Field(default_factory=list)


class LoopInvariantSections(BaseModel):
    propertyStatement: str
    initialization: str
    maintenance: str
    finalization: str


class LoopInvariantEvidence(BaseModel):
    conditionReads: List[str] = Field(default_factory=list)
    bodyWrites: List[str] = Field(default_factory=list)
    bodyReads: List[str] = Field(default_factory=list)
    detectedFeatures: List[str] = Field(default_factory=list)
    classificationConfidence: Optional[float] = None
    templateVariant: Optional[str] = None


class LoopInvariantPayload(BaseModel):
    status: Literal["ok", "unavailable", "low_confidence"]
    reason: Optional[
        Literal["no_supported_loop", "insufficient_evidence", "pattern_not_supported"]
    ] = None
    selectedLoop: LoopInvariantSelectedLoop
    invariant: LoopInvariantSections
    didacticSummary: str
    behaviour: str | None = None
    evidence: LoopInvariantEvidence


class AnalyzeOpenResponse(BaseModel):
    ok: bool = True
    byLine: List[LineCost]
    totals: Dict[str, Any]
    loopInvariant: Optional[LoopInvariantPayload] = None


class AnalyzeError(BaseModel):
    ok: bool = False
    errors: List[Dict[str, Any]]


class TraceRequest(BaseModel):
    source: str
    case: str = "worst"  # "worst" | "best" | "avg"
    input_size: Optional[int] = None  # Tamaño de entrada concreto (ej: n=4)
    initial_variables: Optional[Dict[str, Any]] = None  # Variables iniciales (ej: arrays)
    locale: Optional[str] = None  # "en" | "es" - idioma para descripciones de pasos


class TraceResponse(BaseModel):
    ok: bool = True
    trace: Dict[str, Any]  # Rastro de ejecución completo
