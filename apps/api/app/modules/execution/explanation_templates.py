"""
Generador de explicaciones deterministas por plantillas.

Sustituye texto libre del LLM por explicaciones predecibles.
El LLM puede quedar como enriquecimiento opcional.

Author: Plan diagramas deterministas
Version: 0.1.0
"""
from typing import Any, Dict, List


def _format_param_for_explanation(v: Any) -> str:
    """Formatea valor para explicación legible (listas enlazadas como 1→2→3)."""
    if v is None:
        return "null"
    if isinstance(v, (int, float, str)):
        return str(v)
    if isinstance(v, list):
        if len(v) <= 4:
            return "[" + ", ".join(str(x) for x in v) + "]"
        return f"[{len(v)} elementos]"
    if isinstance(v, dict) and ("siguiente" in v or "valor" in v):
        parts = []
        node = v
        for _ in range(6):
            if not node:
                break
            val = node.get("valor") or node.get("value")
            if val is not None:
                parts.append(str(val))
            node = node.get("siguiente") or node.get("next")
        return "→".join(parts) if parts else "lista"
    if isinstance(v, dict):
        return "[...]"
    return str(v)


def _t(key: str, **kwargs: Any) -> str:
    """Plantilla simple con placeholders {key}."""
    templates = {
        "condition_eval_true": "Se evalúa la condición {condition} y resulta verdadera.",
        "condition_eval_false": "Se evalúa la condición {condition} y resulta falsa.",
        "assign": "Se ejecuta la asignación {expr}.",
        "loop_iter_enter": "Se ejecuta la iteración {iteration} del ciclo ({var} = {value}).",
        "return_emit": "Se retorna el valor {value}.",
        "call_enter": "Se entra a la llamada {proc}({params}).",
        "print": "Se imprime {args}.",
    }
    tpl = templates.get(key, key)
    try:
        return tpl.format(**kwargs)
    except KeyError:
        return tpl


def explain_step(step: Dict[str, Any], locale: str = "en") -> str:
    """
    Genera explicación determinista para un paso de ejecución.

    Args:
        step: Paso con kind, description, decision, etc.
        locale: "en" | "es" (por ahora solo estructura, textos en español por defecto)

    Returns:
        Texto de explicación
    """
    kind = step.get("kind", "")
    decision = step.get("decision")
    desc = step.get("description", "")

    if kind == "condition_eval" and decision:
        cond = decision.get("conditionText", "?")
        result = decision.get("result", False)
        if locale == "en":
            return f"The condition {cond} evaluates to {str(result).lower()}."
        return _t("condition_eval_true" if result else "condition_eval_false", condition=cond)

    if kind == "assign":
        if locale == "en":
            return f"Assignment executed: {desc}"
        return _t("assign", expr=desc)

    if kind == "loop_iter_enter":
        it = step.get("iteration", {})
        var = it.get("loopVar", "i")
        val = it.get("currentValue", "?")
        idx = it.get("iteration", "?")
        if locale == "en":
            return f"Loop iteration {idx}: {var} = {val}"
        return _t("loop_iter_enter", iteration=idx, var=var, value=val)

    if kind == "return_emit":
        if "value" in desc.lower() or "retorno" in desc.lower():
            # Extraer valor de desc si es posible
            return _t("return_emit", value=desc.split(":")[-1].strip() if ":" in desc else "?")
        return _t("return_emit", value=desc)

    if kind == "call_enter":
        rec = step.get("recursion", {})
        proc = rec.get("procedure", "?")
        params = rec.get("params", {})
        pstr = ", ".join(f"{k}={_format_param_for_explanation(v)}" for k, v in params.items())
        if locale == "en":
            return f"Entering call {proc}({pstr})"
        return _t("call_enter", proc=proc, params=pstr)

    if kind == "print":
        if locale == "en":
            return f"Print: {desc}"
        return _t("print", args=desc)

    return desc or kind


def explain_steps(steps: List[Dict[str, Any]], locale: str = "en") -> List[str]:
    """Genera explicaciones para una lista de pasos."""
    return [explain_step(s, locale) for s in steps]


def _call_to_explanation_line(call: Dict[str, Any], locale: str) -> str:
    """Línea legible para una llamada: fn(nodo=1→2→3, valor=4) → resultado."""
    fn = call.get("function_name") or "proc"
    params = call.get("params", {})
    pstr = ", ".join(f"{k}={_format_param_for_explanation(v)}" for k, v in params.items())
    ret = call.get("return_value")
    base = call.get("is_base_case", False)
    if locale == "es":
        line = f"{fn}({pstr})"
        if base:
            line += " — caso base"
        if ret is not None:
            line += f" → {ret}"
    else:
        line = f"{fn}({pstr})"
        if base:
            line += " — base case"
        if ret is not None:
            line += f" → {ret}"
    return line


def explain_recursion_tree(trace: Dict[str, Any], locale: str = "en") -> str:
    """
    Explicación clara del árbol de llamadas recursivas.
    Usa nombres de parámetros (nodo, valor, n) y formato legible.

    Author: Mejora UX explicaciones (Bloque I)
    Version: 0.2.0
    """
    recursion_tree = trace.get("recursionTree", {})
    calls = recursion_tree.get("calls", [])

    if not calls:
        return ""

    n_calls = len(calls)
    base_calls = [c for c in calls if c.get("is_base_case")]
    n_base = len(base_calls)

    if locale == "es":
        intro = f"El algoritmo realiza {n_calls} llamada(s) recursiva(s)."
        if n_base > 0:
            intro += f" {n_base} de ellas son caso(s) base."
        intro += "\n\nFlujo de ejecución:"
    else:
        intro = f"The algorithm makes {n_calls} recursive call(s)."
        if n_base > 0:
            intro += f" {n_base} are base case(s)."
        intro += "\n\nExecution flow:"

    lines = [intro]
    for i, c in enumerate(calls[:15], 1):
        lines.append(f"{i}. {_call_to_explanation_line(c, locale)}")

    return "\n".join(lines)


def explain_minimal(trace: Dict[str, Any], locale: str = "en") -> str:
    """
    Nivel 1: explicación muy corta (1-2 frases).
    Ej: "Se entra a factorial(4)."

    Author: Plan refactor subsistema trace (Bloque I)
    Version: 0.1.0
    """
    recursion_tree = trace.get("recursionTree", {})
    calls = recursion_tree.get("calls", [])

    if not calls:
        return ""

    root_ids = recursion_tree.get("root_calls", [])
    root_id = root_ids[0] if root_ids else None
    root = (
        next((c for c in calls if c.get("id") == root_id), None)
        or next((c for c in calls if c.get("parent_id") is None), calls[0])
    )
    proc = root.get("function_name") or "proc"
    params = root.get("params", {})
    pstr = ", ".join(str(v) for v in params.values())

    if locale == "es":
        return f"Se entra a {proc}({pstr})."
    return f"Entering {proc}({pstr})."


def build_explanation_summary(trace: Dict[str, Any], locale: str = "en") -> str:
    """
    Resumen global del árbol de llamadas (1-2 frases).

    Author: Plan refactor subsistema trace (Bloque I)
    Version: 0.1.0
    """
    return explain_recursion_tree(trace, locale).split("\n\n")[0]


def build_explanation_events(
    trace: Dict[str, Any], locale: str = "en"
) -> List[Dict[str, Any]]:
    """
    Lista de eventos relevantes (call_enter, return_emit, condition_eval).

    Author: Plan refactor subsistema trace (Bloque I)
    Version: 0.1.0
    """
    steps = trace.get("steps", [])
    events: List[Dict[str, Any]] = []
    for s in steps:
        kind = s.get("kind", "")
        if kind in ("call_enter", "return_emit", "condition_eval"):
            events.append(
                {
                    "stepId": s.get("step_number"),
                    "kind": kind,
                    "text": explain_step(s, locale),
                }
            )
    return events[:30]


def explain_node(
    trace: Dict[str, Any], node_id: str, locale: str = "en"
) -> str:
    """
    Texto corto por nodo (para tooltip/panel futuro).

    Author: Plan refactor subsistema trace (Bloque I)
    Version: 0.1.0
    """
    recursion_tree = trace.get("recursionTree", {})
    calls = recursion_tree.get("calls", [])

    for c in calls:
        cid = c.get("call_id") or c.get("id")
        if str(cid) == str(node_id) or f"call_{cid}" == str(node_id):
            fn = c.get("function_name") or "proc"
            params = c.get("params", {})
            pstr = ", ".join(f"{k}={_format_param_for_explanation(v)}" for k, v in params.items())
            ret = c.get("return_value")
            base = c.get("is_base_case", False)
            if locale == "es":
                line = f"{fn}({pstr})"
                if base:
                    line += " (caso base)"
                if ret is not None:
                    line += f" → {ret}"
            else:
                line = f"{fn}({pstr})"
                if base:
                    line += " (base case)"
                if ret is not None:
                    line += f" → {ret}"
            return line
    return ""
