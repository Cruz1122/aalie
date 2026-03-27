"""
Builder para patrón tail_recursive_linear.

Cadena lineal (una llamada al final).

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""
from typing import Any, Dict

from ..structured_trace_models import (
    StructuredTraceView,
    StructuredTraceRenderConfig,
)
from ..structural_trace_classifier import StructuralTraceClassification
from .generic_recursive import _build_from_call_tree


def build_tail_recursive_linear(
    trace: Dict[str, Any],
    classification: StructuralTraceClassification,
    config: StructuredTraceRenderConfig,
) -> StructuredTraceView:
    """Construye vista lineal para recursión de cola."""
    return _build_from_call_tree(
        trace,
        classification.patternKind,
        config=config,
    )
