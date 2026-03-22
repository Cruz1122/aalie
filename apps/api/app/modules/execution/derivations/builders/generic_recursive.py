"""
Builder para patrón generic_recursive.

Árbol de llamadas clásico (fallback recursivo).

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""
from typing import Any, Dict, List, Optional

from ...metrics_aggregator import aggregate_metrics
from ..structured_trace_models import (
    StructuredTraceView,
    StructuredTraceNode,
    StructuredTraceEdge,
    StructuredTraceRenderConfig,
)
from ..structural_trace_classifier import StructuralTraceClassification
from ._call_utils import call_to_label


def _build_from_call_tree(
    trace: Dict[str, Any],
    pattern_kind: str,
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
        if cost.get("tokens") is not None:
            data["tokens"] = cost["tokens"]
        if cost.get("aggregateTokens") is not None:
            data["aggregateTokens"] = cost["aggregateTokens"]
        if cost.get("microseconds") is not None:
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
            add_call(child_id)

    for rid in root_ids:
        add_call(rid)

    return StructuredTraceView(
        patternKind=pattern_kind,
        nodes=nodes,
        edges=edges,
    )


def build_generic_recursive(
    trace: Dict[str, Any],
    classification: StructuralTraceClassification,
    _config: StructuredTraceRenderConfig,
) -> StructuredTraceView:
    """Construye vista de árbol de llamadas genérico."""
    return _build_from_call_tree(trace, classification.patternKind)
