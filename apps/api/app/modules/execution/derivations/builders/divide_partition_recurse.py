"""
Builder para patrón divide_partition_recurse.

Llamada → operación lateral → resultado → 2 subllamadas (quicksort).

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
from ._call_utils import build_recursive_node_data, call_depth, call_to_label


def build_divide_partition_recurse(
    trace: Dict[str, Any],
    classification: StructuralTraceClassification,
    config: StructuredTraceRenderConfig,
) -> StructuredTraceView:
    """
    Construye vista tipo quicksort: operación partition + 2 subllamadas.
    Si config.showOperationNode=False, se comporta como generic_recursive.
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
    execution_order_counter = [0]

    def add_call(call_id: str, fallback_depth: int = 0) -> None:
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
        phase = "return" if is_base else "expansion"
        current_depth = call_depth(call, fallback_depth)

        cost = cost_by_call.get(call_id, {})
        data = build_recursive_node_data(
            call,
            node_type=role,
            phase=phase,
            is_base_case=is_base,
            cost={
                "tokens": cost.get("tokens"),
                "microseconds": cost.get("aggregateMicroseconds"),
                "aggregateTokens": cost.get("aggregateTokens"),
            },
            depth=current_depth,
            execution_order=execution_order_counter[0],
        )
        execution_order_counter[0] += 1

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
        if len(children) == 2 and config.showOperationNode:
            locale_key = str(config.locale).lower()[:2]
            op_title = "particionar" if locale_key == "es" else "partition"
            op_line = (
                "particionar(A, p, r) -> q" if locale_key == "es" else "partition(A, p, r) -> q"
            )
            q_line = "q = indice pivote" if locale_key == "es" else "q = pivot index"
            op_id = f"op_{call_id}"
            nodes.append(
                StructuredTraceNode(
                    id=op_id,
                    role="operation",
                    title=op_title,
                    lines=[op_line],
                    data=build_recursive_node_data(
                        call,
                        node_type="operation",
                        phase="construction",
                        depth=current_depth,
                        execution_order=execution_order_counter[0],
                    ),
                )
            )
            execution_order_counter[0] += 1
            edges.append(
                StructuredTraceEdge(id=f"e_{call_id}_op", source=node_id, target=op_id, label="")
            )
            res_id = f"res_{call_id}"
            nodes.append(
                StructuredTraceNode(
                    id=res_id,
                    role="result",
                    title="q",
                    lines=[q_line],
                    data=build_recursive_node_data(
                        call,
                        node_type="result",
                        phase="analysis",
                        depth=current_depth + 1,
                        execution_order=execution_order_counter[0],
                    ),
                )
            )
            execution_order_counter[0] += 1
            edges.append(
                StructuredTraceEdge(id=f"e_{op_id}_{res_id}", source=op_id, target=res_id, label="")
            )
            for i, child_id in enumerate(children):
                child_node_id = f"call_{child_id}"
                edge_label = "left" if i == 0 else "right"
                edges.append(
                    StructuredTraceEdge(
                        id=f"e_{res_id}_{child_node_id}",
                        source=res_id,
                        target=child_node_id,
                        label=edge_label,
                    )
                )
                add_call(child_id, current_depth + 1)
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
                add_call(child_id, current_depth + 1)

    for rid in root_ids:
        add_call(rid, 0)

    return StructuredTraceView(
        patternKind=classification.patternKind,
        nodes=nodes,
        edges=edges,
    )
