"""
Builder para patrón divide_merge_recurse.

Llamada → subllamadas → nodo merge (mergesort).

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""
from typing import Any, Dict, List

from ...metrics_aggregator import aggregate_metrics
from ..structured_trace_models import (
    StructuredTraceView,
    StructuredTraceNode,
    StructuredTraceEdge,
    StructuredTraceRenderConfig,
)
from ..structural_trace_classifier import StructuralTraceClassification
from ._call_utils import call_to_label, _format_param_value


def build_divide_merge_recurse(
    trace: Dict[str, Any],
    classification: StructuralTraceClassification,
    config: StructuredTraceRenderConfig,
) -> StructuredTraceView:
    """
    Construye vista tipo mergesort: subllamadas primero, luego merge.
    """
    rt = trace.get("recursionTree") or trace.get("callTreeSource")
    if not rt:
        return StructuredTraceView(
            patternKind=classification.patternKind,
            nodes=[],
            edges=[],
        )

    calls = rt.get("calls", [])
    root_ids = rt.get("root_calls", [])
    if not calls:
        return StructuredTraceView(
            patternKind=classification.patternKind,
            nodes=[],
            edges=[],
        )

    steps = trace.get("steps", [])
    cost_by_call = aggregate_metrics(steps, calls)
    calls_by_id = {c["id"]: c for c in calls}
    if not root_ids:
        root_ids = [c["id"] for c in calls if c.get("depth", 0) == 0]

    nodes: List[StructuredTraceNode] = []
    edges: List[StructuredTraceEdge] = []
    max_nodes = 100

    def build_exit_lines(snapshot: Dict[str, Any]) -> List[str]:
        preferred_keys = ["A", "arr", "array", "lista", "list"]
        lines: List[str] = []
        for key in preferred_keys:
            if key in snapshot:
                lines.append(f"{key} = {_format_param_value(snapshot[key])}")
        if not lines:
            for key, value in snapshot.items():
                lines.append(f"{key} = {_format_param_value(value)}")
        return lines[:4]

    def get_root_exit_snapshot(root_call_id: str) -> Dict[str, Any]:
        for step in reversed(steps):
            if step.get("kind") != "call_exit":
                continue
            recursion = step.get("recursion") or {}
            if recursion.get("callId") == root_call_id or recursion.get("depth") == 0:
                return step.get("variables") or {}
        return {}

    def add_call(call_id: str) -> None:
        if len(nodes) >= max_nodes:
            return
        call = calls_by_id.get(call_id)
        if not call:
            return

        node_id = f"call_{call_id}"
        label = call_to_label(call)
        bc = call.get("base_case") or {}
        is_base = call.get("is_base_case", False) or (
            bc.get("detected", False) and bc.get("matched", False)
        )
        role = "base_return" if is_base else "call"

        cost = cost_by_call.get(call_id, {})
        data: Dict[str, Any] = {}
        if cost.get("tokens"):
            data["tokens"] = cost["tokens"]
        if cost.get("microseconds"):
            data["microseconds"] = cost["microseconds"]

        nodes.append(
            StructuredTraceNode(
                id=node_id,
                role=role,
                title=label,
                lines=[label],
                data=data if data else None,
            )
        )

        children = call.get("children", [])
        if len(children) >= 2 and config.showOperationNode:
            merge_id = f"merge_{call_id}"
            nodes.append(
                StructuredTraceNode(
                    id=merge_id,
                    role="merge",
                    title="merge",
                    lines=["merge(L, R) → A"],
                )
            )
            for child_id in children:
                child_node_id = f"call_{child_id}"
                edges.append(
                    StructuredTraceEdge(
                        id=f"e_{call_id}_{child_id}",
                        source=node_id,
                        target=child_node_id,
                        label="call",
                    )
                )
                add_call(child_id)
            for child_id in children:
                child_node_id = f"call_{child_id}"
                edges.append(
                    StructuredTraceEdge(
                        id=f"e_{child_id}_merge",
                        source=child_node_id,
                        target=merge_id,
                        label="",
                    )
                )
        else:
            for child_id in children:
                child_node_id = f"call_{child_id}"
                edges.append(
                    StructuredTraceEdge(
                        id=f"e_{call_id}_{child_id}",
                        source=node_id,
                        target=child_node_id,
                        label="call",
                    )
                )
                add_call(child_id)

    for rid in root_ids:
        add_call(rid)

    # Agregar nodo de salida con ultimo snapshot de variables para la raiz
    if root_ids:
        root_id = root_ids[0]
        exit_snapshot = get_root_exit_snapshot(root_id)
        if exit_snapshot:
            exit_lines = ["Salida", *build_exit_lines(exit_snapshot)]
        else:
            exit_lines = ["Salida"]
        exit_node_id = f"exit_{root_id}"
        nodes.append(
            StructuredTraceNode(
                id=exit_node_id,
                role="result",
                title="Salida",
                lines=exit_lines,
                data={"nodeType": "output"},
            )
        )
        merge_node_id = f"merge_{root_id}"
        source_node_id = merge_node_id if any(n.id == merge_node_id for n in nodes) else f"call_{root_id}"
        edges.append(
            StructuredTraceEdge(
                id=f"e_{source_node_id}_{exit_node_id}",
                source=source_node_id,
                target=exit_node_id,
                label="",
            )
        )

    return StructuredTraceView(
        patternKind=classification.patternKind,
        nodes=nodes,
        edges=edges,
    )
