"""
Builder para patrón divide_merge_recurse.

Llamada → subllamadas → nodo merge (mergesort).

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""
from typing import Any, Dict, List

from ...metrics_aggregator import aggregate_metrics
from ..structural_trace_classifier import StructuralTraceClassification
from ..structured_trace_models import (
    StructuredTraceEdge,
    StructuredTraceNode,
    StructuredTraceRenderConfig,
    StructuredTraceView,
)
from ._call_utils import call_to_label


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

    cost_by_call = aggregate_metrics(trace.get("steps", []), calls)
    calls_by_id = {c["id"]: c for c in calls}
    if not root_ids:
        root_ids = [c["id"] for c in calls if c.get("depth", 0) == 0]

    nodes: List[StructuredTraceNode] = []
    edges: List[StructuredTraceEdge] = []
    max_nodes = 100

    def add_call(call_id: str) -> None:
        if len(nodes) >= max_nodes:
            return
        call = calls_by_id.get(call_id)
        if not call:
            return

        node_id = f"call_{call_id}"
        label = call_to_label(call, config.locale)
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
            locale_key = str(config.locale).lower()[:2]
            merge_title = "mezcla" if locale_key == "es" else "merge"
            merge_line = "mezclar(Izq, Der) -> A" if locale_key == "es" else "merge(L, R) -> A"
            merge_id = f"merge_{call_id}"
            nodes.append(
                StructuredTraceNode(
                    id=merge_id,
                    role="merge",
                    title=merge_title,
                    lines=[merge_line],
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

    return StructuredTraceView(
        patternKind=classification.patternKind,
        nodes=nodes,
        edges=edges,
    )
