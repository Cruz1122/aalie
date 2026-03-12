"""
Generador determinista de árbol de llamadas recursivas.

Convierte CallTree (del trace) en DiagramPayload con diagramKind="call_tree".
Sin dependencia de LLM.

Author: Plan diagramas deterministas
Version: 0.1.0
"""
from typing import Any, Dict, List, Optional, Set

from .schemas import (
    DiagramPayload,
    TraceGraphCanonical,
    TraceGraphNode,
    TraceGraphEdge,
    GraphNodeData,
)


def _call_to_label(call: Dict[str, Any]) -> str:
    """Genera label para un nodo de llamada en formato funcion(a, b, c)."""
    params = call.get("params", {})
    pstr = ", ".join(str(v) for v in params.values())
    fn = call.get("function_name") or "proc"
    bc = call.get("base_case") or {}
    base = call.get("is_base_case", False) or (
        bc.get("detected", False) and bc.get("matched", False)
    )
    ret = call.get("return_value")
    parts = [f"{fn}({pstr})"]
    if base:
        parts.append("(base)")
    if ret is not None:
        parts.append(f"→ {ret}")
    return "\n".join(parts)


def _aggregate_cost_per_call(
    calls: List[Dict[str, Any]], steps: List[Dict[str, Any]]
) -> Dict[str, Dict[str, Any]]:
    """Suma tokens y microseconds de steps por callId."""
    cost_by_call: Dict[str, Dict[str, Any]] = {}
    for step in steps:
        rec = step.get("recursion")
        if not rec:
            continue
        call_id = rec.get("callId")
        if not call_id:
            continue
        if call_id not in cost_by_call:
            cost_by_call[call_id] = {"tokens": 0, "microseconds": 0.0}
        cost_by_call[call_id]["tokens"] += step.get("tokens") or 0
        cost_by_call[call_id]["microseconds"] += step.get("microseconds") or 0.0
    return cost_by_call


def build_call_tree(
    recursion_tree: Dict[str, Any],
    max_nodes: int = 100,
    collapse_repeated: bool = True,
    steps: Optional[List[Dict[str, Any]]] = None,
) -> DiagramPayload:
    """
    Construye el árbol de llamadas recursivas a partir del trace.

    Args:
        recursion_tree: {calls: [...], root_calls: [...]} del trace
        max_nodes: Límite de nodos (Fibonacci puede explotar)
        collapse_repeated: Colapsar firmas repetidas (ej. fib(3)×2)
        steps: Pasos del trace para asociar tokens/microseconds por llamada

    Returns:
        DiagramPayload con diagramKind="call_tree"
    """
    calls = recursion_tree.get("calls", [])
    root_ids = recursion_tree.get("root_calls", [])

    if not calls:
        return DiagramPayload(
            diagramKind="call_tree",
            graph=TraceGraphCanonical(nodes=[], edges=[]),
        )

    calls_by_id: Dict[str, Dict[str, Any]] = {c["id"]: c for c in calls}
    if not root_ids and calls:
        root_ids = [c["id"] for c in calls if c.get("depth", 0) == 0]

    cost_by_call = _aggregate_cost_per_call(calls, steps or [])

    nodes: List[TraceGraphNode] = []
    edges: List[TraceGraphEdge] = []
    x_spacing = 280
    y_spacing = 140

    def layout_tree(call_id: str, x: float, y: float, depth: int) -> None:
        if len(nodes) >= max_nodes:
            return
        call = calls_by_id.get(call_id)
        if not call:
            return

        node_id = f"call_{call_id}"
        label = _call_to_label(call)
        cost = cost_by_call.get(call_id, {})
        node_data = GraphNodeData(
            label=label,
            tokens=cost.get("tokens") or None,
            microseconds=cost.get("microseconds") or None,
        )
        nodes.append(
            TraceGraphNode(
                id=node_id,
                type="default",
                position={"x": x, "y": y},
                data=node_data,
            )
        )

        children = call.get("children", [])
        n = len(children)
        if n == 0:
            return

        total_width = (n - 1) * x_spacing
        start_x = x - total_width / 2
        for i, child_id in enumerate(children):
            if len(nodes) >= max_nodes:
                break
            cx = start_x + i * x_spacing
            cy = y + y_spacing
            edge_id = f"e_{call_id}_{child_id}"
            edges.append(
                TraceGraphEdge(
                    id=edge_id,
                    source=node_id,
                    target=f"call_{child_id}",
                    label="call",
                    type="default",
                )
            )
            layout_tree(child_id, cx, cy, depth + 1)

    # Layout desde raíces
    n_roots = len(root_ids)
    start_x = -(n_roots - 1) * x_spacing / 2 if n_roots > 1 else 0
    for i, rid in enumerate(root_ids):
        layout_tree(rid, start_x + i * x_spacing, 0, 0)

    return DiagramPayload(
        diagramKind="call_tree",
        graph=TraceGraphCanonical(nodes=nodes, edges=edges),
    )
