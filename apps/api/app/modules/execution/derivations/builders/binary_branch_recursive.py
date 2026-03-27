"""
Builder para patrón binary_branch_recursive.

Árbol binario (Fibonacci, etc.).

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


def build_binary_branch_recursive(
    trace: Dict[str, Any],
    classification: StructuralTraceClassification,
    config: StructuredTraceRenderConfig,
) -> StructuredTraceView:
    """Construye vista de árbol binario."""
    return _build_from_call_tree(trace, classification.patternKind, config=config)
