"""
Schemas Pydantic para traza de ejecución y diagramas.
Alineados con @aa/types (ExecutionTraceCanonical, CallTreeCanonical, DiagramPayload).

Author: Plan diagramas deterministas
Version: 0.1.0
"""
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


DiagramKind = Literal["execution_diagram", "call_tree", "recurrence_tree"]

ExecutionEventKind = Literal[
    "enter_block",
    "assign",
    "condition_eval",
    "loop_enter",
    "loop_iter_enter",
    "loop_iter_exit",
    "loop_exit",
    "call_enter",
    "call_spawn_child",
    "call_resume",
    "return_emit",
    "call_exit",
    "operation_enter",
    "operation_exit",
    "state_mutation",
    "result_emit",
    "print",
    "end",
]


class IterationInfo(BaseModel):
    """Información de iteración en un paso."""

    loopId: str
    index: Optional[int] = None


class RecursionInfo(BaseModel):
    """Información de recursión en un paso."""

    callId: str
    depth: int
    parentCallId: Optional[str] = None


class DecisionInfo(BaseModel):
    """Resultado de evaluación de condición."""

    conditionText: str
    result: bool


class CostInfo(BaseModel):
    """Costo estimado del paso."""

    primitiveOps: Optional[int] = None
    microseconds: Optional[float] = None
    tokens: Optional[int] = None


class SourceSpan(BaseModel):
    """Span de código fuente."""

    startLine: int
    endLine: int


class ExecutionStepCanonical(BaseModel):
    """Paso de ejecución canónico."""

    id: str
    stepNumber: int
    line: Optional[int] = None
    eventKind: ExecutionEventKind
    description: str = ""
    variablesSnapshot: Dict[str, Any] = Field(default_factory=dict)
    iteration: Optional[IterationInfo] = None
    recursion: Optional[RecursionInfo] = None
    decision: Optional[DecisionInfo] = None
    cost: Optional[CostInfo] = None
    sourceSpan: Optional[SourceSpan] = None


class BaseCaseInfo(BaseModel):
    """Información de caso base."""

    detected: bool
    conditionText: Optional[str] = None
    matched: Optional[bool] = None


class CallNodeCanonical(BaseModel):
    """Nodo del árbol de llamadas recursivas."""

    id: str
    functionName: str
    depth: int
    parentCallId: Optional[str] = None
    childCallIds: List[str] = Field(default_factory=list)
    argumentsSnapshot: Dict[str, Any] = Field(default_factory=dict)
    localStateOnEnter: Optional[Dict[str, Any]] = None
    localStateOnExit: Optional[Dict[str, Any]] = None
    entryLine: Optional[int] = None
    baseCase: Optional[BaseCaseInfo] = None
    returnValue: Optional[Any] = None
    localCost: Optional[Dict[str, int]] = None
    aggregateCost: Optional[Dict[str, int]] = None


class CallTreeCanonical(BaseModel):
    """Árbol de llamadas recursivas."""

    rootCallIds: List[str] = Field(default_factory=list)
    calls: List[CallNodeCanonical] = Field(default_factory=list)


class TraceSummary(BaseModel):
    """Resumen de la traza."""

    totalSteps: int
    kind: Literal["iterative", "recursive", "hybrid"]


class ExecutionTraceCanonical(BaseModel):
    """Traza de ejecución canónica."""

    kind: Literal["iterative", "recursive", "hybrid"]
    steps: List[ExecutionStepCanonical] = Field(default_factory=list)
    summary: TraceSummary
    callTree: Optional[CallTreeCanonical] = None


class ExplanationBlock(BaseModel):
    """Bloque de explicación."""

    stepId: Optional[str] = None
    text: str
    kind: Optional[str] = None


class GraphNodeData(BaseModel):
    """Datos de nodo del grafo."""

    model_config = ConfigDict(extra="allow")

    label: str = ""
    microseconds: Optional[float] = None
    tokens: Optional[int] = None


class TraceGraphNode(BaseModel):
    """Nodo del grafo visual."""

    id: str
    type: str = "default"
    position: Dict[str, float] = Field(default_factory=lambda: {"x": 0, "y": 0})
    data: GraphNodeData = Field(default_factory=lambda: GraphNodeData())
    parentId: Optional[str] = None


class TraceGraphEdge(BaseModel):
    """Arista del grafo visual."""

    id: str
    source: str
    target: str
    label: str = ""
    type: str = "default"


class TraceGraphCanonical(BaseModel):
    """Grafo visual para renderizado."""

    nodes: List[TraceGraphNode] = Field(default_factory=list)
    edges: List[TraceGraphEdge] = Field(default_factory=list)


class DiagramPayload(BaseModel):
    """Payload de diagrama (salida de builders deterministas)."""

    diagramKind: DiagramKind
    graph: TraceGraphCanonical
    explanationBlocks: Optional[List[ExplanationBlock]] = None


class RecurrenceNode(BaseModel):
    """Nodo del árbol de recurrencia analítico."""

    id: str
    subproblem: str
    sizeExpr: str
    workExpr: str
    level: int
    childIds: List[str] = Field(default_factory=list)


class RecurrenceExpansion(BaseModel):
    """Expansión de recurrencia para árbol analítico."""

    root: RecurrenceNode
    depthLimit: int
