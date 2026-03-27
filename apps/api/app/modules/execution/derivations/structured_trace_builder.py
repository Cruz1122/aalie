"""
Orquestador del sistema de traza estructural.

Clasifica la traza, construye la vista estructurada y la convierte a grafo.
Punto de entrada único para el flujo: trace -> classification -> view -> graph.

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""
from typing import Any, Dict, Optional

from .builder_factory import build_structured_trace, structured_view_to_graph
from .structural_trace_classifier import classify_structural_trace
from .structured_trace_models import StructuredTraceRenderConfig


def build_structured_trace_result(
    trace: Dict[str, Any],
    config: Optional[StructuredTraceRenderConfig] = None,
) -> Dict[str, Any]:
    """
    Ejecuta el pipeline completo: clasificar -> construir -> convertir a grafo.

    Args:
        trace: ExecutionTrace enriquecido
        config: Configuración de renderizado (opcional)

    Returns:
        Dict con keys: patternKind, graph, classification (evidence, confidence)
    """
    classification = classify_structural_trace(trace)
    view = build_structured_trace(trace, classification, config)
    graph = structured_view_to_graph(view)

    return {
        "patternKind": classification.patternKind,
        "graph": graph,
        "classification": {
            "patternKind": classification.patternKind,
            "confidence": classification.confidence,
            "evidence": classification.evidence,
        },
    }
