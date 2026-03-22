"""
Builder para patrón single_branch_recursive_search.

Nodo decisión → una rama activa (búsqueda binaria).

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


def build_single_branch_recursive_search(
    trace: Dict[str, Any],
    classification: StructuralTraceClassification,
    _config: StructuredTraceRenderConfig,
) -> StructuredTraceView:
    """Construye vista para búsqueda con una rama efectiva."""
    return _build_from_call_tree(trace, classification.patternKind)
