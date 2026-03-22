"""
Builder para patrón backtracking_stateful.

Nodo elección → subramas → undo.

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""
from typing import Dict, Any

from ..structured_trace_models import (
    StructuredTraceView,
    StructuredTraceRenderConfig,
)
from ..structural_trace_classifier import StructuralTraceClassification
from .generic_recursive import _build_from_call_tree


def build_backtracking_stateful(
    trace: Dict[str, Any],
    classification: StructuralTraceClassification,
    _config: StructuredTraceRenderConfig,
) -> StructuredTraceView:
    """Construye vista para backtracking (permutaciones, etc.)."""
    return _build_from_call_tree(trace, classification.patternKind)
