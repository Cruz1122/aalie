"""
Builder para patrón generic_recursive.

Árbol de llamadas clásico (fallback recursivo).

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
from ._call_utils import _format_param_value, build_recursive_node_data, call_depth, call_to_label


def _build_from_call_tree(
    trace: Dict[str, Any],
    pattern_kind: str,
    config: StructuredTraceRenderConfig,
    max_nodes: int = 100,
) -> StructuredTraceView:
    """Construye vista desde recursionTree (árbol de llamadas)."""
    rt = trace.get("recursionTree") or trace.get("callTreeSource")
    if not rt:
        return StructuredTraceView(patternKind=pattern_kind, nodes=[], edges=[])

    calls = rt.get("calls", [])
    root_ids = rt.get("root_calls", [])
    if not calls:
        return StructuredTraceView(patternKind=pattern_kind, nodes=[], edges=[])

    steps = trace.get("steps", [])
    cost_by_call = aggregate_metrics(steps, calls)
    calls_by_id: Dict[str, Dict[str, Any]] = {c["id"]: c for c in calls}
    if not root_ids:
        root_ids = [c["id"] for c in calls if c.get("depth", 0) == 0]

    nodes: List[StructuredTraceNode] = []
    edges: List[StructuredTraceEdge] = []
    execution_order_counter = [0]  # Mutable counter for nested function

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
            cost=cost,
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

        for child_id in call.get("children", []):
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

        # Mark when this call has fully returned so the UI can reveal the back edge later.
        if data is not None:
            data["returnOrder"] = execution_order_counter[0]

        if call.get("parent_id") or call.get("parentCallId"):
            parent_id = call.get("parent_id") or call.get("parentCallId")
            parent_node_id = f"call_{parent_id}"
            edges.append(
                StructuredTraceEdge(
                    id=f"e_ret_{call_id}_{parent_id}",
                    source=node_id,
                    target=parent_node_id,
                    label="return",
                )
            )

    for rid in root_ids:
        add_call(rid, 0)

    # Nodo final basado en retorno real de la llamada raíz.
    if root_ids:
        root_call = calls_by_id.get(root_ids[0]) or {}
        ret = root_call.get("return_value")
        if ret is not None:
            result_id = f"result_{root_ids[0]}"
            locale_key = str(config.locale).lower()[:2]
            title = "Resultado" if locale_key == "es" else "Result"
            result_label = f"{title}\n{_format_param_value(ret)}"
            nodes.append(
                StructuredTraceNode(
                    id=result_id,
                    role="result",
                    title=title,
                    lines=result_label.split("\n"),
                    data=build_recursive_node_data(
                        root_call,
                        node_type="output",
                        phase="return",
                        extra={"returnValue": ret},
                        depth=call_depth(root_call, 0) + 1,
                        execution_order=execution_order_counter[0],
                        return_order=execution_order_counter[0],
                    ),
                )
            )
            execution_order_counter[0] += 1
            edges.append(
                StructuredTraceEdge(
                    id=f"e_call_{root_ids[0]}_{result_id}",
                    source=f"call_{root_ids[0]}",
                    target=result_id,
                    label="return",
                )
            )

    return StructuredTraceView(
        patternKind=pattern_kind,
        nodes=nodes,
        edges=edges,
    )


def build_generic_recursive(
    trace: Dict[str, Any],
    classification: StructuralTraceClassification,
    config: StructuredTraceRenderConfig,
) -> StructuredTraceView:
    """Construye vista de árbol de llamadas genérico."""
    return _build_from_call_tree(
        trace,
        classification.patternKind,
        config=config,
    )
