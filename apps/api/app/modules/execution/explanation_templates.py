"""
Generador de explicaciones deterministas por plantillas.

Sustituye texto libre del LLM por explicaciones predecibles.
El LLM puede quedar como enriquecimiento opcional.

Author: Plan diagramas deterministas
Version: 0.1.0
"""
from typing import Any, Dict, List


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
        pstr = ", ".join(f"{k}={v}" for k, v in params.items())
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


def explain_recursion_tree(trace: Dict[str, Any], locale: str = "en") -> str:
    """
    Genera explicación determinista para el árbol de llamadas recursivas.

    Usa explain_steps para los pasos de call_enter y return_emit, o un resumen
    basado en recursionTree.calls si no hay steps detallados.

    Args:
        trace: Trace completo con steps y/o recursionTree
        locale: "en" | "es"

    Returns:
        Texto de explicación
    """
    steps = trace.get("steps", [])
    recursion_tree = trace.get("recursionTree", {})
    calls = recursion_tree.get("calls", [])

    if not calls:
        return ""

    # Resumen del árbol
    n_calls = len(calls)
    base_calls = [c for c in calls if c.get("is_base_case")]
    n_base = len(base_calls)

    if locale == "es":
        intro = f"Árbol de llamadas con {n_calls} nodo(s)."
        if n_base > 0:
            intro += f" {n_base} caso(s) base."
    else:
        intro = f"Call tree with {n_calls} node(s)."
        if n_base > 0:
            intro += f" {n_base} base case(s)."

    # Explicaciones de pasos significativos (call_enter, return_emit)
    rec_steps = [
        s for s in steps
        if s.get("kind") in ("call_enter", "return_emit")
        and s.get("recursion")
    ]
    if rec_steps:
        explanations = [explain_step(s, locale) for s in rec_steps[:20]]
        body = "\n\n".join(explanations)
        return f"{intro}\n\n{body}"

    # Fallback: descripción por llamadas
    parts = [intro]
    for c in calls[:10]:
        fn = c.get("function_name") or "proc"
        params = c.get("params", {})
        pstr = ", ".join(str(v) for v in params.values())
        ret = c.get("return_value")
        base = c.get("is_base_case", False)
        line = f"- {fn}({pstr})"
        if base:
            line += " (base)"
        if ret is not None:
            line += f" → {ret}"
        parts.append(line)

    return "\n".join(parts)
