"""
Orquestador del sistema de traza estructural.

Clasifica la traza, construye la vista estructurada y la convierte a grafo.
Punto de entrada único para el flujo: trace -> classification -> view -> graph.

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""
from typing import Any, Dict, Optional

from .structural_trace_classifier import classify_structural_trace, StructuralTraceClassification
from .builder_factory import build_structured_trace, structured_view_to_graph
from .builders._call_utils import _format_param_value
from .structured_trace_models import StructuredTraceRenderConfig
from .structured_trace_models import StructuredTraceNode, StructuredTraceEdge


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
    view = _append_output_node_if_missing(view, trace)
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


def _append_output_node_if_missing(view: Any, trace: Dict[str, Any]) -> Any:
    """Agrega un nodo de salida con el ultimo snapshot si no existe uno."""
    if not view or not getattr(view, "nodes", None):
        return view

    for node in view.nodes:
        if isinstance(node.data, dict) and node.data.get("nodeType") == "output":
            return view

    steps = trace.get("steps", [])
    should_append = _should_append_output_node(steps)

    # #region agent log
    try:
        import json as _json, time as _time
        _log_payload = {
            "sessionId": "1b7cca",
            "runId": "initial",
            "hypothesisId": "H2",
            "location": "execution/structured_trace_builder.py:_append_output_node_if_missing",
            "message": "output_node_decision",
            "data": {
                "shouldAppend": bool(should_append),
                "hasSteps": bool(steps),
            },
            "timestamp": int(_time.time() * 1000),
        }
        with open("c:\\dev\\algorithmic-analysis\\debug-1b7cca.log", "a", encoding="utf-8") as _f:
            _f.write(_json.dumps(_log_payload) + "\n")
    except Exception:
        pass
    # #endregion agent log

    if not should_append:
        return view

    last_vars = _get_last_variables_snapshot(steps)
    if not last_vars:
        return view

    preferred_keys = ["A", "arr", "array", "lista", "list", "resultado", "result", "res"]
    var_lines = []
    for key in preferred_keys:
        if key in last_vars:
            var_lines.append(f"{key} = {_format_param_value(last_vars[key])}")
    if not var_lines:
        for key, value in last_vars.items():
            var_lines.append(f"{key} = {_format_param_value(value)}")
    var_lines = var_lines[:3]

    label = "Salida"
    lines = [label, *var_lines] if var_lines else [label]

    existing_ids = {n.id for n in view.nodes}
    base_id = "output_final"
    node_id = base_id
    counter = 1
    while node_id in existing_ids:
        node_id = f"{base_id}_{counter}"
        counter += 1

    view.nodes.append(
        StructuredTraceNode(
            id=node_id,
            role="result",
            title=label,
            lines=lines,
            data={"nodeType": "output"},
        )
    )

    source_id = _infer_output_source_id(view)
    if source_id:
        view.edges.append(
            StructuredTraceEdge(
                id=f"e_{source_id}_{node_id}",
                source=source_id,
                target=node_id,
                label="",
            )
        )

    return view


def _get_last_variables_snapshot(steps: Any) -> Optional[Dict[str, Any]]:
    """Obtiene el ultimo snapshot de variables disponible."""
    if not steps:
        return None
    for step in reversed(steps):
        vars_snapshot = step.get("variables") if isinstance(step, dict) else None
        if isinstance(vars_snapshot, dict) and vars_snapshot:
            return vars_snapshot
    return None


def _should_append_output_node(steps: Any) -> bool:
    """Solo agrega salida cuando hay mutaciones de arrays en la traza.

    Considera tanto diffs (`variables_changed` / `variablesChanged`) como snapshots
    (`variables` / `variablesSnapshot`) para ser robusto frente a cambios de modelo.
    """
    if not steps:
        return False

    preferred_keys = {"A", "arr", "array", "lista", "list"}
    for step in steps:
        if not isinstance(step, dict):
            continue
        vars_changed = step.get("variables_changed") or step.get("variablesChanged")
        vars_snapshot = step.get("variables") or step.get("variablesSnapshot")

        # Revisar primero diffs de variables si existen
        if isinstance(vars_changed, dict):
            for key in vars_changed.keys():
                # Si alguna clave relevante cambia, asumimos que hay mutación de estructura de salida
                if key in preferred_keys:
                    return True

        # Fallback: revisar snapshot completo de variables por si no hay diff disponible
        if isinstance(vars_snapshot, dict):
            for key in vars_snapshot.keys():
                # Si existe alguna clave relevante en el snapshot, asumimos que representa la estructura de salida
                if key in preferred_keys:
                    return True
    return False


def _infer_output_source_id(view: Any) -> Optional[str]:
    """Elige el nodo origen para conectar la salida segun el tipo de vista."""
    node_ids = [n.id for n in view.nodes]
    if not node_ids:
        return None

    sources = {e.source for e in view.edges}
    targets = {e.target for e in view.edges}

    linear_patterns = {
        "generic_iterative",
        "iterative_with_auxiliary_operation",
        "tail_recursive_linear",
    }

    if view.patternKind in linear_patterns:
        sinks = [n for n in node_ids if n not in sources]
        return sinks[-1] if sinks else node_ids[-1]

    roots = [n for n in node_ids if n not in targets]
    return roots[0] if roots else node_ids[0]
