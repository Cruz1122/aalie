"""
Capa formal de derivaciones del trace.

Entrada: ExecutionTrace
Salida: artefactos derivados serializables (structuredTrace).
Ninguna derivación ejecuta pseudocódigo.

Author: Plan refactor subsistema trace
Version: 0.1.0
"""

from ..explanation_templates import explain_step, explain_steps
from ..metrics_aggregator import aggregate_metrics
from .structural_trace_classifier import (
    StructuralPatternKind,
    StructuralTraceClassification,
    classify_structural_trace,
)
from .structured_trace_builder import build_structured_trace_result

__all__ = [
    "explain_step",
    "explain_steps",
    "aggregate_metrics",
    "classify_structural_trace",
    "StructuralTraceClassification",
    "StructuralPatternKind",
    "build_structured_trace_result",
]
