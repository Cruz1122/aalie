"""
Generador determinista de árbol de recurrencia (analítico).

Convierte totals.recursion_tree del análisis en DiagramPayload con diagramKind="recurrence_tree".
No depende del trace; usa el resultado del analizador recursivo.

Author: Plan diagramas deterministas
Version: 0.1.0
"""
from typing import Any, Dict, List, Optional

from .schemas import (
    DiagramPayload,
    TraceGraphCanonical,
    TraceGraphNode,
    TraceGraphEdge,
    GraphNodeData,
)


def build_recurrence_tree(recursion_tree: Dict[str, Any]) -> DiagramPayload:
    """
    Construye el árbol de recurrencia analítico desde totals.recursion_tree.

    Args:
        recursion_tree: Resultado del método de árbol de recursión (RecursiveAnalyzer)

    Returns:
        DiagramPayload con diagramKind="recurrence_tree"
    """
    table = recursion_tree.get("table_by_levels", [])
    levels = recursion_tree.get("levels", [])

    if not table and not levels:
        return DiagramPayload(
            diagramKind="recurrence_tree",
            graph=TraceGraphCanonical(nodes=[], edges=[]),
        )

    nodes: List[TraceGraphNode] = []
    edges: List[TraceGraphEdge] = []
    x_spacing = 200
    y_spacing = 90

    # Usar table_by_levels si existe, sino levels
    rows = table if table else [
        {
            "level": lv.get("level", i),
            "num_nodes": lv.get("num_nodes_latex", str(lv.get("num_nodes", 1))),
            "subproblem_size": lv.get("subproblem_size_latex", lv.get("subproblem_size", "?")),
            "cost_per_node": lv.get("cost_per_node_latex", lv.get("cost_per_node", "?")),
            "total_cost": lv.get("total_cost_latex", lv.get("total_cost", "?")),
        }
        for i, lv in enumerate(levels)
    ]

    prev_id: Optional[str] = None
    for i, row in enumerate(rows):
        level = row.get("level", i)
        num_nodes = row.get("num_nodes", "1")
        sub_size = row.get("subproblem_size", "n")
        cost_node = row.get("cost_per_node", "c")
        total = row.get("total_cost", "?")

        node_id = f"rt_L{level}"
        label = f"Nivel {level}\nT({sub_size})\n{cost_node} × {num_nodes}\n= {total}"
        nodes.append(
            TraceGraphNode(
                id=node_id,
                type="default",
                position={"x": 0, "y": i * y_spacing},
                data=GraphNodeData(label=label),
            )
        )
        if prev_id:
            edges.append(
                TraceGraphEdge(
                    id=f"e_{prev_id}_{node_id}",
                    source=prev_id,
                    target=node_id,
                    label="",
                    type="default",
                )
            )
        prev_id = node_id

    return DiagramPayload(
        diagramKind="recurrence_tree",
        graph=TraceGraphCanonical(nodes=nodes, edges=edges),
    )
