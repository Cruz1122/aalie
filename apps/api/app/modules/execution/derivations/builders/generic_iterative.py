"""
Builder para patrón generic_iterative.

Flujo lineal con nodos por paso/iteración.

Author: Plan Sistema Traza Estructural
Version: 0.1.0
"""

from typing import Any, Dict, List, Optional

from ..structural_trace_classifier import StructuralTraceClassification
from ..structured_trace_models import (
    StructuredTraceEdge,
    StructuredTraceNode,
    StructuredTraceRenderConfig,
    StructuredTraceView,
)


def _step_to_label(step: Dict[str, Any]) -> str:
    """Genera label corto para un paso."""
    kind = step.get("eventKind") or step.get("kind", "")
    desc = step.get("description", "")
    decision = step.get("decision")
    it = step.get("iteration", {})
    step_kind = step.get("kind") or ""

    if kind == "condition_eval" and decision:
        cond = decision.get("conditionText", "?")
        result = decision.get("result", False)
        return f"IF {cond}\n{'Sí' if result else 'No'}"
    if kind == "assign":
        if " = " in desc:
            return desc.split(" = ")[0].strip() + " ← " + desc.split(" = ")[-1].strip()
        return desc[:40] if desc else "assign"
    if kind == "loop_enter":
        if step_kind == "while":
            return "WHILE"
        if step_kind == "repeat":
            return "REPEAT"
        loop_var = it.get("loopVar", "i")
        val = it.get("currentValue", "?")
        return f"FOR {loop_var} = {val}"
    if kind == "loop_iter_enter":
        loop_var = it.get("loopVar", "iter")
        val = (
            it.get("currentValue")
            if it.get("currentValue") is not None
            else it.get("iteration", "?")
        )
        if step_kind == "for":
            return f"FOR {loop_var} = {val}"
        return f"{loop_var} = {val}"
    if kind == "loop_iter_exit":
        loop_var = it.get("loopVar", "iter")
        val = (
            it.get("currentValue")
            if it.get("currentValue") is not None
            else it.get("iteration", "?")
        )
        return f"Fin iter {loop_var}={val}"
    if kind == "loop_exit":
        exit_cond = it.get("exitCondition")
        if exit_cond:
            return f"Salida: {exit_cond}"
        if step_kind in ("while", "repeat"):
            return "Fin bucle"
        loop_var = it.get("loopVar", "i")
        return f"Fin bucle {loop_var}"
    if kind == "return_emit":
        if desc:
            return desc.replace("RETURN ", "RETURN ").strip()
        return "RETURN"
    if kind in ("call_enter", "call_spawn_child"):
        rec = step.get("recursion", {})
        proc = rec.get("procedure", "?")
        params = rec.get("params", {})
        pstr = ", ".join(str(v) for v in params.values())
        return f"{proc}({pstr})"
    if kind == "print":
        return "PRINT"
    if kind == "end":
        return "FIN"
    return desc[:50] if desc else kind


def build_generic_iterative(
    trace: Dict[str, Any],
    _classification: StructuralTraceClassification,
    config: StructuredTraceRenderConfig,
) -> StructuredTraceView:
    """Construye vista lineal para algoritmos iterativos."""
    steps = trace.get("steps", [])
    nodes: List[StructuredTraceNode] = []
    edges: List[StructuredTraceEdge] = []

    loop_stack: List[Dict[str, Any]] = []
    active_iterations: List[Optional[Dict[str, Any]]] = []
    prev_id: str | None = None

    def _add_costs(step: Dict[str, Any]) -> None:
        tokens = step.get("tokens", 0) or 0
        microseconds = step.get("microseconds", 0) or 0
        for active in active_iterations:
            if active is None:
                continue
            active["tokens"] += tokens
            active["microseconds"] += microseconds

    def _update_vars(step: Dict[str, Any]) -> None:
        vars_snapshot = step.get("variables")
        for active in active_iterations:
            if active is None:
                continue
            if isinstance(vars_snapshot, dict):
                active["last_vars"] = vars_snapshot

    def _iteration_path() -> str:
        return ".".join(str(ctx.get("iter_index", 0)) for ctx in loop_stack)

    def _add_node(
        node_id: str,
        label: str,
        role: str,
        data: Optional[Dict[str, Any]] = None,
        edge_label: str = "",
        edge_id_suffix: Optional[str] = None,
    ) -> None:
        nonlocal prev_id
        nodes.append(
            StructuredTraceNode(
                id=node_id,
                role=role,
                title=label,
                lines=[label],
                data=data if data else None,
            )
        )
        if prev_id:
            edge_id = f"e_{prev_id}_{node_id}"
            if edge_id_suffix:
                edge_id = f"{edge_id}_{edge_id_suffix}"
            edges.append(
                StructuredTraceEdge(
                    id=edge_id,
                    source=prev_id,
                    target=node_id,
                    label=edge_label,
                )
            )
        prev_id = node_id

    for idx, step in enumerate(steps):
        if len(nodes) >= 80:
            break
        event_kind = step.get("eventKind") or step.get("kind", "")
        step.get("kind") or ""
        step_num = step.get("step_number", idx + 1)

        if event_kind == "loop_enter":
            desc_upper = str(step.get("description", "") or "").upper()
            loop_var = (step.get("iteration") or {}).get("loopVar", "iter")
            loop_kind = "for"
            loop_label = f"FOR {loop_var}"
            if "WHILE" in desc_upper:
                loop_kind = "while"
                loop_label = "WHILE"
            elif "REPEAT" in desc_upper:
                loop_kind = "repeat"
                loop_label = "REPEAT"

            loop_stack.append(
                {
                    "iter_index": 0,
                    "first_edge_done": False,
                    "kind": loop_kind,
                }
            )
            active_iterations.append(None)
            _add_node(f"loop_enter_{step_num}", loop_label, "state_summary")
            _add_costs(step)
            _update_vars(step)
            continue

        if event_kind == "loop_exit":
            _add_costs(step)
            _update_vars(step)
            if loop_stack:
                loop_stack.pop()
            if active_iterations:
                active_iterations.pop()
            continue

        if event_kind == "loop_iter_enter":
            if loop_stack:
                loop_stack[-1]["iter_index"] += 1
            path = _iteration_path() or str(step.get("iteration", {}).get("iteration", "?"))
            iter_suffix = path.replace(".", "_")
            node_id = f"iter_{iter_suffix}_{step_num}"
            label = _step_to_label(step)
            if loop_stack:
                loop_kind = loop_stack[-1].get("kind")
                if loop_kind == "for" and not label.startswith("FOR "):
                    label = f"FOR {label}"
                elif loop_kind == "while" and "WHILE" not in label:
                    label = f"WHILE {label}"
            it = step.get("iteration", {})
            data: Dict[str, Any] = {
                "tokens": 0,
                "microseconds": 0,
                "iterationPath": path,
                "loopVar": it.get("loopVar", "iter"),
                "loopValue": (
                    it.get("currentValue")
                    if it.get("currentValue") is not None
                    else it.get("iteration")
                ),
                "nodeType": "iteration",
                "last_vars": (
                    step.get("variables") if isinstance(step.get("variables"), dict) else None
                ),
            }
            if active_iterations:
                active_iterations[-1] = data
            _add_costs(step)
            _update_vars(step)

            edge_label = ""
            if loop_stack and not loop_stack[-1].get("first_edge_done"):
                edge_label = "loop_start"
                loop_stack[-1]["first_edge_done"] = True
            vars_lines = []
            last_vars = data.get("last_vars") or {}
            loop_var = data.get("loopVar")
            if isinstance(last_vars, dict):
                for key in sorted(last_vars.keys()):
                    if loop_var and key == loop_var:
                        continue
                    vars_lines.append(f"{key} = {last_vars[key]}")
            lines = [label] + vars_lines
            nodes.append(
                StructuredTraceNode(
                    id=node_id,
                    role="iteration",
                    title=label,
                    lines=lines,
                    data=data,
                )
            )
            if prev_id:
                edge_id = f"e_{prev_id}_{node_id}_{iter_suffix}"
                edges.append(
                    StructuredTraceEdge(
                        id=edge_id,
                        source=prev_id,
                        target=node_id,
                        label=edge_label,
                    )
                )
            prev_id = node_id
            continue

        if event_kind == "loop_iter_exit":
            _add_costs(step)
            _update_vars(step)
            path = _iteration_path() or str(step.get("iteration", {}).get("iteration", "?"))
            iter_suffix = path.replace(".", "_")
            node_id = f"iter_end_{iter_suffix}_{step_num}"
            label = _step_to_label(step)
            _add_node(node_id, label, "state_summary")
            if active_iterations:
                active_iterations[-1] = None
            continue

        if loop_stack:
            _add_costs(step)
            _update_vars(step)
            if event_kind in ("condition_eval", "return_emit"):
                role = "branch_decision" if event_kind == "condition_eval" else "result"
                label = _step_to_label(step)
                in_loop_node_id = f"{step.get('id') or 'step'}_{step_num}"
                _add_node(in_loop_node_id, label, role)
            continue

        label = _step_to_label(step)
        role = "state_summary"
        if event_kind == "condition_eval":
            role = "branch_decision"
        elif event_kind == "return_emit":
            role = "result"

        data: Dict[str, Any] = {}
        if step.get("tokens") is not None:
            data["tokens"] = step["tokens"]
        if step.get("microseconds") is not None:
            data["microseconds"] = step["microseconds"]

        node_id = step.get("id") or f"step_{step_num}"
        _add_node(node_id, label, role, data)

    return StructuredTraceView(
        patternKind="generic_iterative",
        nodes=nodes,
        edges=edges,
    )
