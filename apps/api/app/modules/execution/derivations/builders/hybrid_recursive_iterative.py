"""
Builder para patrón hybrid_recursive_iterative.

Bloque iterativo local + subllamadas recursivas.

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""
from typing import Any, Dict

from ..structural_trace_classifier import StructuralTraceClassification
from ..structured_trace_models import (
    StructuredTraceRenderConfig,
    StructuredTraceView,
)
from .generic_recursive import _build_from_call_tree


def build_hybrid_recursive_iterative(
    trace: Dict[str, Any],
    classification: StructuralTraceClassification,
    config: StructuredTraceRenderConfig,
) -> StructuredTraceView:
    """Construye vista para híbrido (recursión con bucles internos)."""
    return _build_from_call_tree(trace, classification.patternKind, config=config)
