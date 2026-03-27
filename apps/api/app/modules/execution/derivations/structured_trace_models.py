"""
Modelos para la vista estructurada de trazas.

StructuredTraceView es la salida de los builders; se convierte a TraceGraph
con layout para renderizado.

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Literal, Optional

from .structural_trace_classifier import StructuralPatternKind

StructuredNodeRole = Literal[
    "call",
    "operation",
    "result",
    "base_return",
    "state_summary",
    "iteration",
    "branch_decision",
    "merge",
    "choice",
    "undo",
]


@dataclass
class StructuredTraceNode:
    """Nodo de la vista estructurada."""

    id: str
    role: StructuredNodeRole
    title: str
    lines: List[str] = field(default_factory=list)
    data: Optional[Dict[str, Any]] = None  # tokens, microseconds, etc.


@dataclass
class StructuredTraceEdge:
    """Arista de la vista estructurada."""

    id: str
    source: str
    target: str
    label: str = ""


@dataclass
class StructuredTraceView:
    """Vista estructurada lista para convertir a grafo con layout."""

    patternKind: StructuralPatternKind
    nodes: List[StructuredTraceNode]
    edges: List[StructuredTraceEdge]


@dataclass
class StructuredTraceRenderConfig:
    """Configuración de renderizado por patrón."""

    showOperationNode: bool = True
    showStateSnapshots: bool = True
    showLocalResults: bool = True
    showConditionEvaluations: bool = True
    maxSnapshotsPerOperation: int = 4
    collapseRepeatedCalls: bool = False
    locale: str = "en"
