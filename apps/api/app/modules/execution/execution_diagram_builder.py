"""
Generador determinista de diagrama de seguimiento iterativo.

Convierte ExecutionTrace en DiagramPayload con diagramKind="execution_diagram".
Sin dependencia de LLM.

Author: Plan diagramas deterministas
Version: 0.1.0
"""
from typing import Any, Dict, List, Literal, Optional

from .schemas import (
    DiagramPayload,
    TraceGraphCanonical,
    TraceGraphNode,
    TraceGraphEdge,
    GraphNodeData,
)


DetailMode = Literal["detailed", "summary"]


def _step_to_label(step: Dict[str, Any]) -> str:
    """Genera label determinista corto para un paso."""
    kind = step.get("kind", "")
    desc = step.get("description", "")
    decision = step.get("decision")
    variables = step.get("variables", {})

    if kind == "condition_eval" and decision:
        cond = decision.get("conditionText", "?")
        result = decision.get("result", False)
        return f"IF {cond}\n{'Sí' if result else 'No'}"
    if kind == "assign":
        # Intentar extraer var = val de description
        if " = " in desc:
            return desc.split(" = ")[0].strip() + " ← " + desc.split(" = ")[-1].strip()
        return desc[:40] if desc else "assign"
    if kind == "loop_iter_enter":
        it = step.get("iteration", {})
        loop_var = it.get("loopVar", "i")
        val = it.get("currentValue", "?")
        return f"FOR {loop_var} = {val}"
    if kind == "return_emit":
        if "value" in str(desc).lower() or "retorno" in desc.lower():
            return "RETURN"
        return desc[:30] if desc else "RETURN"
    if kind == "call_enter":
        rec = step.get("recursion", {})
        proc = rec.get("procedure", "?")
        params = rec.get("params", {})
        pstr = ", ".join(f"{k}={v}" for k, v in params.items())
        return f"{proc}({pstr})"
    if kind == "print":
        return "PRINT"
    # Fallback
    return desc[:50] if desc else kind


def build_execution_diagram(
    trace: Dict[str, Any],
    mode: DetailMode = "detailed",
    max_nodes: int = 80,
) -> DiagramPayload:
    """
    Construye el diagrama de seguimiento a partir de la traza iterativa.

    Args:
        trace: Traza de ejecución con steps
        mode: "detailed" (todos los pasos) o "summary" (comprimir iteraciones)
        max_nodes: Límite de nodos para evitar explosión en bucles largos

    Returns:
        DiagramPayload con diagramKind="execution_diagram"
    """
    steps = trace.get("steps", [])
    if not steps:
        return DiagramPayload(
            diagramKind="execution_diagram",
            graph=TraceGraphCanonical(nodes=[], edges=[]),
        )

    nodes: List[TraceGraphNode] = []
    edges: List[TraceGraphEdge] = []
    step_to_node: Dict[int, str] = {}
    x_spacing = 180
    y_spacing = 80
    x, y = 0.0, 0.0

    # Compresión en modo summary: agrupar iteraciones consecutivas del mismo loop
    steps_to_render: List[Dict[str, Any]] = []
    if mode == "summary":
        i = 0
        while i < len(steps):
            s = steps[i]
            if s.get("kind") == "loop_iter_enter":
                # Agrupar bloque de iteraciones
                group = [s]
                j = i + 1
                while j < len(steps) and steps[j].get("kind") == "loop_iter_enter":
                    group.append(steps[j])
                    j += 1
                # Representar con primer y último
                if len(group) > 2:
                    steps_to_render.append(group[0])
                    steps_to_render.append({**group[-1], "description": f"... {len(group)-2} iteraciones ..."})
                else:
                    steps_to_render.extend(group)
                i = j
            else:
                steps_to_render.append(s)
                i += 1
    else:
        steps_to_render = list(steps)

    for idx, step in enumerate(steps_to_render):
        if len(nodes) >= max_nodes:
            break

        node_id = f"n_{idx}"
        step_to_node[idx] = node_id

        label = _step_to_label(step)
        data_dict: Dict[str, Any] = {"label": label}
        if step.get("tokens") is not None:
            data_dict["tokens"] = step["tokens"]
        if step.get("microseconds") is not None:
            data_dict["microseconds"] = step["microseconds"]
        data = GraphNodeData(**data_dict)

        nodes.append(
            TraceGraphNode(
                id=node_id,
                type="default",
                position={"x": x, "y": y},
                data=data,
            )
        )

        # Arista desde el paso anterior
        if idx > 0:
            prev_id = step_to_node.get(idx - 1, f"n_{idx - 1}")
            edge_label = ""
            if step.get("kind") == "condition_eval" and step.get("decision"):
                edge_label = "Sí" if step["decision"].get("result") else "No"
            edges.append(
                TraceGraphEdge(
                    id=f"e_{prev_id}_{node_id}",
                    source=prev_id,
                    target=node_id,
                    label=edge_label,
                    type="default",
                )
            )

        # Avanzar posición (flujo vertical)
        y += y_spacing

    return DiagramPayload(
        diagramKind="execution_diagram",
        graph=TraceGraphCanonical(nodes=nodes, edges=edges),
    )
