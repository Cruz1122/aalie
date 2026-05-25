"""
Factory de builders de StructuredTraceView.

Dado StructuralPatternKind, selecciona el builder apropiado.
Aplica layout para convertir StructuredTraceView a TraceGraph.

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""

from typing import Any, Callable, Dict, List, Optional

from ..schemas import GraphNodeData, TraceGraphEdge, TraceGraphNode
from .builders import (
    build_backtracking_stateful,
    build_binary_branch_recursive,
    build_divide_merge_recurse,
    build_divide_partition_recurse,
    build_generic_iterative,
    build_generic_recursive,
    build_hybrid_recursive_iterative,
    build_single_branch_recursive_search,
    build_tail_recursive_linear,
)
from .structural_trace_classifier import (
    StructuralPatternKind,
    StructuralTraceClassification,
)
from .structured_trace_models import (
    StructuredTraceEdge,
    StructuredTraceNode,
    StructuredTraceRenderConfig,
    StructuredTraceView,
)

BUILDER_REGISTRY: Dict[StructuralPatternKind, Callable[..., StructuredTraceView]] = {
    "generic_iterative": build_generic_iterative,
    "iterative_with_auxiliary_operation": build_generic_iterative,
    "generic_recursive": build_generic_recursive,
    "tail_recursive_linear": build_tail_recursive_linear,
    "single_branch_recursive_search": build_single_branch_recursive_search,
    "binary_branch_recursive": build_binary_branch_recursive,
    "multi_branch_recursive_fanout": build_generic_recursive,
    "divide_partition_recurse": build_divide_partition_recurse,
    "divide_merge_recurse": build_divide_merge_recurse,
    "divide_compute_recurse": build_single_branch_recursive_search,
    "backtracking_stateful": build_backtracking_stateful,
    "mutual_recursion": build_generic_recursive,
    "hybrid_recursive_iterative": build_hybrid_recursive_iterative,
    "unknown": build_generic_recursive,
}


def get_builder(
    pattern_kind: StructuralPatternKind,
) -> Callable[..., StructuredTraceView]:
    """Obtiene el builder para el patrón dado."""
    return BUILDER_REGISTRY.get(pattern_kind, build_generic_recursive)


def build_structured_trace(
    trace: Dict[str, Any],
    classification: StructuralTraceClassification,
    config: Optional[StructuredTraceRenderConfig] = None,
) -> StructuredTraceView:
    """
    Construye la vista estructurada usando el builder apropiado.

    Args:
        trace: ExecutionTrace enriquecido
        classification: Resultado del clasificador
        config: Configuración de renderizado (opcional)

    Returns:
        StructuredTraceView
    """
    if config is None:
        config = StructuredTraceRenderConfig()

    builder = get_builder(classification.patternKind)
    return builder(trace, classification, config)


def _apply_layout_linear(
    nodes: List[StructuredTraceNode], edges: List[StructuredTraceEdge]
) -> tuple:
    """Layout lineal vertical (iterativo, tail recursive)."""
    y_spacing = 80
    x, y = 0.0, 0.0

    graph_nodes: List[TraceGraphNode] = []
    graph_edges: List[TraceGraphEdge] = []

    for n in nodes:
        label = n.title
        if n.lines:
            node_type = n.data.get("nodeType") if n.data else None
            if node_type == "iteration":
                label = "\n".join(n.lines)
            else:
                label = "\n".join(n.lines[:3])
        data_dict: Dict[str, Any] = {"label": label}
        if n.data:
            data_dict.update(n.data)
        node_type = "default"
        if n.data and isinstance(n.data, dict):
            node_type = n.data.get("nodeType", "default") or "default"
        graph_nodes.append(
            TraceGraphNode(
                id=n.id,
                type=node_type,
                position={"x": x, "y": y},
                data=GraphNodeData(**data_dict),
            )
        )
        y += y_spacing

    graph_edges = [
        TraceGraphEdge(
            id=e.id,
            source=e.source,
            target=e.target,
            label=e.label,
            type="return" if (e.label or "").strip().lower() == "return" else "default",
        )
        for e in edges
    ]
    return graph_nodes, graph_edges


def _apply_layout_tree(
    nodes: List[StructuredTraceNode],
    edges: List[StructuredTraceEdge],
    root_ids: Optional[List[str]] = None,
) -> tuple:
    """Layout tipo árbol (recursivo)."""
    x_spacing = 280
    y_spacing = 140

    if root_ids is None:
        targets = {e.target for e in edges}
        sources = {e.source for e in edges}
        root_ids = list(sources - targets) if sources else []

    nodes_by_id = {n.id: n for n in nodes}
    children: Dict[str, List[str]] = {}
    for e in edges:
        if e.source not in nodes_by_id or e.target not in nodes_by_id:
            continue
        children.setdefault(e.source, [])
        if e.target not in children[e.source]:
            children[e.source].append(e.target)

    graph_nodes: List[TraceGraphNode] = []
    positioned_nodes: Dict[str, tuple[float, float]] = {}
    visited: set[str] = set()

    def to_graph_node(n: StructuredTraceNode, x: float, y: float) -> TraceGraphNode:
        label = n.title
        if n.lines:
            node_type = n.data.get("nodeType") if n.data else None
            if node_type == "iteration":
                label = "\n".join(n.lines)
            else:
                label = "\n".join(n.lines[:3])
        data_dict: Dict[str, Any] = {"label": label}
        if n.data:
            data_dict.update(n.data)
        node_type = "default"
        if n.data and isinstance(n.data, dict):
            node_type = n.data.get("nodeType", "default") or "default"
        return TraceGraphNode(
            id=n.id,
            type=node_type,
            position={"x": x, "y": y},
            data=GraphNodeData(**data_dict),
        )

    def layout_node(
        node_id: str, x: float, y: float, active_path: Optional[set[str]] = None
    ) -> None:
        n = nodes_by_id.get(node_id)
        if not n or node_id in visited:
            return
        if active_path is None:
            active_path = set()
        if node_id in active_path:
            return
        active_path.add(node_id)

        graph_nodes.append(to_graph_node(n, x, y))
        positioned_nodes[node_id] = (x, y)
        visited.add(node_id)

        ch = children.get(node_id, [])
        n_ch = len(ch)
        if n_ch == 0:
            active_path.remove(node_id)
            return
        total_width = (n_ch - 1) * x_spacing
        start_x = x - total_width / 2
        for i, child_id in enumerate(ch):
            cx = start_x + i * x_spacing
            cy = y + y_spacing
            layout_node(child_id, cx, cy, active_path)
        active_path.remove(node_id)

    for i, rid in enumerate(root_ids or []):
        layout_node(rid, i * x_spacing, 0)

    # Renderizar componentes desconectados / no alcanzables desde la(s) raíz(ces)
    orphan_ids = [node_id for node_id in nodes_by_id if node_id not in visited]
    if orphan_ids:
        orphan_y = y_spacing
        if positioned_nodes:
            orphan_y = max(y for _, y in positioned_nodes.values()) + y_spacing
        for i, node_id in enumerate(orphan_ids):
            layout_node(node_id, i * x_spacing, orphan_y)

    graph_edges: List[TraceGraphEdge] = []
    seen_edges: set[tuple[str, str, str, str]] = set()
    for e in edges:
        if e.source not in positioned_nodes or e.target not in positioned_nodes:
            continue
        key = (e.id, e.source, e.target, e.label)
        if key in seen_edges:
            continue
        seen_edges.add(key)
        graph_edges.append(
            TraceGraphEdge(
                id=e.id,
                source=e.source,
                target=e.target,
                label=e.label,
                type="return" if (e.label or "").strip().lower() == "return" else "default",
            )
        )

    return graph_nodes, graph_edges


def structured_view_to_graph(view: StructuredTraceView) -> Dict[str, Any]:
    """
    Convierte StructuredTraceView a TraceGraph con layout aplicado.

    Returns:
        Dict con keys nodes, edges (formato serializable para JSON)
    """
    pattern = view.patternKind
    nodes = view.nodes
    edges = view.edges

    linear_patterns = (
        "generic_iterative",
        "iterative_with_auxiliary_operation",
        "tail_recursive_linear",
    )

    if pattern in linear_patterns:
        graph_nodes, graph_edges = _apply_layout_linear(nodes, edges)
    else:
        targets = {e.target for e in edges}
        sources = {e.source for e in edges}
        root_ids = list(sources - targets) if sources else []
        # Caso: un solo nodo sin aristas (ej. factorial que retorna directo)
        if not root_ids and nodes:
            root_ids = [n.id for n in nodes]
        graph_nodes, graph_edges = _apply_layout_tree(nodes, edges, root_ids)

    return {
        "nodes": [n.model_dump() for n in graph_nodes],
        "edges": [e.model_dump() for e in graph_edges],
    }
