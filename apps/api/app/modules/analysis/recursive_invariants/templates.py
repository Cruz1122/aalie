"""Template-based text generation for recursive invariants."""

from __future__ import annotations

from typing import Any, Dict, Optional

from .schemas import InvariantText, RecursiveFacts, RecursionType, normalize_locale


def _template_by_type_and_locale(
    recursion_type: RecursionType, template_key: str, locale: str
) -> Optional[str]:
    """Get template string by recursion type, template key, and locale."""

    templates = {
        # LINEAR RECURSIVE
        "linear_recursive": {
            "en": {
                "base_property": "If {{base_condition}}, the function returns {{base_result}}.",
                "inductive_hypothesis": "Assume f(k) works correctly for all k < n. "
                "That is, f(k) satisfies the required property.",
                "recursive_step": "For f(n), we compute f(n-1) and combine it with a constant amount of work "
                "({{work_term}}). By the inductive hypothesis, f(n-1) works correctly, "
                "so f(n) also satisfies the property.",
                "termination_guarantee": "Each call decreases n by a constant (1). Eventually, n reaches the base case, "
                "guaranteeing termination.",
                "didactic_summary": "This is a {{recursion_type}} pattern. The algorithm calls itself on a smaller instance "
                "and combines results. Each recursion level does constant work.",
            },
            "es": {
                "base_property": "Si {{base_condition}}, la función retorna {{base_result}}.",
                "inductive_hypothesis": "Asumimos que f(k) funciona correctamente para todo k < n. "
                "Es decir, f(k) satisface la propiedad requerida.",
                "recursive_step": "Para f(n), computamos f(n-1) y lo combinamos con una cantidad constante de trabajo "
                "({{work_term}}). Por la hipótesis inductiva, f(n-1) funciona correctamente, "
                "entonces f(n) también satisface la propiedad.",
                "termination_guarantee": "Cada llamada disminuye n por una constante (1). Eventualmente, n alcanza el caso base, "
                "garantizando la terminación.",
                "didactic_summary": "Este es un patrón {{recursion_type}}. El algoritmo se llama a sí mismo en una instancia más pequeña "
                "y combina resultados. Cada nivel de recursión hace trabajo constante.",
            },
        },
        # DIVIDE AND CONQUER
        "divide_conquer": {
            "en": {
                "base_property": "If {{base_condition}}, the function returns {{base_result}} without further recursion.",
                "inductive_hypothesis": "Assume f(k) works correctly for all strictly smaller instances k. "
                "That is, recursive calls to f with smaller arguments produce correct results.",
                "recursive_step": "For an instance of size n, we identify a smaller subproblem of size ~n/{{divisor}}, "
                "solve it recursively, and build the result in {{work_term}}. "
                "By the inductive hypothesis, the recursive call produces the correct result for the subproblem, "
                "so the final answer is also correct.",
                "termination_guarantee": "Each recursion reduces problem size (n → n/{{divisor}}). "
                "Size strictly decreases, eventually reaching the base case.",
                "didactic_summary": "This is a {{recursion_type}} pattern with logarithmic depth. "
                "One subproblem of size ~n/{{divisor}} is solved per level, yielding O(log n) depth. "
                "Per-call work is {{work_term}}, so total complexity is O(log n × {{work_term}}) = O(log n).",
            },
            "es": {
                "base_property": "Si {{base_condition}}, la función retorna {{base_result}} sin más recursión.",
                "inductive_hypothesis": "Asumimos que f(k) funciona correctamente para todas las instancias estrictamente más pequeñas k. "
                "Es decir, las llamadas recursivas a f con argumentos menores producen resultados correctos.",
                "recursive_step": "Para una instancia de tamaño n, identificamos un subproblema más pequeño de tamaño ~n/{{divisor}}, "
                "lo resolvemos recursivamente, y construimos el resultado en {{work_term}}. "
                "Por la hipótesis inductiva, la llamada recursiva produce el resultado correcto para el subproblema, "
                "así que la respuesta final también es correcta.",
                "termination_guarantee": "Cada recursión reduce el tamaño del problema (n → n/{{divisor}}). "
                "El tamaño disminuye estrictamente, eventualmente alcanzando el caso base.",
                "didactic_summary": "Este es un patrón {{recursion_type}} con profundidad logarítmica. "
                "Un subproblema de tamaño ~n/{{divisor}} se resuelve por nivel, lo que produce O(log n) de profundidad. "
                "El trabajo por llamada es {{work_term}}, entonces la complejidad total es O(log n × {{work_term}}) = O(log n).",
            },
        },
        # MULTIPLE RECURSIVE (generic fallback)
        "multiple_recursive": {
            "en": {
                "base_property": "If {{base_condition}}, the function returns {{base_result}} immediately.",
                "inductive_hypothesis": "Assume all recursive calls with strictly smaller inputs produce correct results.",
                "recursive_step": "The function combines results from {{num_recursive_calls}} recursive call(s) "
                "along with work term {{work_term}}. Formally, the recurrence has shape: {{recurrence_template}}. "
                "By the inductive hypothesis, all sub-results are correct.",
                "termination_guarantee": "Problem size decreases in each recursive branch; base cases stop recursion.",
                "didactic_summary": "This is a {{recursion_type}} pattern with {{num_recursive_calls}} recursive call(s). "
                "Each call performs {{work_term}} locally, but the total number of calls can grow exponentially depending on branching and shifts (e.g., Fibonacci yields exponential growth).",
            },
            "es": {
                "base_property": "Si {{base_condition}}, la función retorna {{base_result}} inmediatamente.",
                "inductive_hypothesis": "Asumimos que todas las llamadas recursivas con entradas estrictamente menores producen resultados correctos.",
                "recursive_step": "La función combina resultados de {{num_recursive_calls}} llamada(s) recursiva(s) "
                "junto con el término de trabajo {{work_term}}. Formalmente, la recurrencia tiene la forma: {{recurrence_template}}. "
                "Por la hipótesis inductiva, todos los sub-resultados son correctos.",
                "termination_guarantee": "El tamaño del problema disminuye en cada rama recursiva; los casos base detienen la recursión.",
                "didactic_summary": "Este es un patrón {{recursion_type}} con {{num_recursive_calls}} llamada(s) recursiva(s). "
                "Cada llamada realiza {{work_term}} localmente, pero el número total de llamadas puede crecer exponencialmente según el branching y los desplazamientos (por ejemplo, Fibonacci produce crecimiento exponencial).",
            },
        },
        # UNKNOWN/FALLBACK
        "unknown": {
            "en": {
                "base_property": "Base case: {{base_condition}} returns {{base_result}}.",
                "inductive_hypothesis": "Assume recursive calls with smaller inputs work correctly.",
                "recursive_step": "Recursive calls are made. Results are combined with work term {{work_term}}.",
                "termination_guarantee": "Problem size decreases, ensuring eventual termination.",
                "didactic_summary": "Recursive structure detected but pattern could not be fully classified.",
            },
            "es": {
                "base_property": "Caso base: {{base_condition}} retorna {{base_result}}.",
                "inductive_hypothesis": "Asumimos que las llamadas recursivas con entradas menores funcionan correctamente.",
                "recursive_step": "Se realizan llamadas recursivas. Los resultados se combinan con el término de trabajo {{work_term}}.",
                "termination_guarantee": "El tamaño del problema disminuye, asegurando terminación eventual.",
                "didactic_summary": "Estructura recursiva detectada pero el patrón no pudo ser completamente clasificado.",
            },
        },
    }

    pattern_templates = templates.get(recursion_type, templates.get("unknown", {}))
    return pattern_templates.get(locale, {}).get(template_key)


def _substitute_variables(template: str, context: Dict[str, Any]) -> str:
    """Substitute {{variable}} placeholders in template with context values."""
    result = template
    for key, value in context.items():
        result = result.replace("{{" + key + "}}", str(value))
    return result


def build_invariant_text(
    recursion_type: RecursionType,
    facts: RecursiveFacts,
    locale: Optional[str] = None,
) -> InvariantText:
    """Build complete invariant text sections from recursion facts and templates.

    Args:
        recursion_type: Type of recursion detected
        facts: Extracted recursive facts
        locale: Language code ("en" or "es")

    Returns:
        InvariantText with all narrative sections filled
    """

    locale_value = normalize_locale(locale)

    # Prepare substitution context
    context = {
        "recursion_type": recursion_type,
        "base_condition": facts.base_conditions[0] if facts.base_conditions else "base case",
        "base_result": facts.base_results[0] if facts.base_results else "result",
        "num_recursive_calls": max(facts.recursive_call_count, 1),
        # num_subproblems reflects actual subproblems resolved (1 if mutually exclusive branches)
        "num_subproblems": getattr(facts, "subproblems_per_call", max(facts.recursive_call_count, 2)),
        "divisor": 2,  # Default for divide-and-conquer; can be overridden
        # work_term describes local per-call work; total complexity depends on branching
        "work_term": "O(n)" if facts.recursion_type == "divide_conquer" else "O(1)",
        # recurrence_template is a human-friendly recurrence shape when possible
        "recurrence_template": _build_recurrence_template(facts),
    }

    # Get templates
    base_property_template = _template_by_type_and_locale(
        recursion_type, "base_property", locale_value
    )
    inductive_hypothesis_template = _template_by_type_and_locale(
        recursion_type, "inductive_hypothesis", locale_value
    )
    recursive_step_template = _template_by_type_and_locale(
        recursion_type, "recursive_step", locale_value
    )
    termination_guarantee_template = _template_by_type_and_locale(
        recursion_type, "termination_guarantee", locale_value
    )
    didactic_summary_template = _template_by_type_and_locale(
        recursion_type, "didactic_summary", locale_value
    )

    # Substitute variables
    base_property = _substitute_variables(
        base_property_template or "", context
    )
    inductive_hypothesis = _substitute_variables(
        inductive_hypothesis_template or "", context
    )
    recursive_step = _substitute_variables(
        recursive_step_template or "", context
    )
    termination_guarantee = _substitute_variables(
        termination_guarantee_template or "", context
    )
    didactic_summary = _substitute_variables(
        didactic_summary_template or "", context
    )

    return InvariantText(
        base_property=base_property,
        inductive_hypothesis=inductive_hypothesis,
        recursive_step=recursive_step,
        termination_guarantee=termination_guarantee,
        didactic_summary=didactic_summary,
    )


def _build_recurrence_template(facts: RecursiveFacts) -> str:
    """Build a simple recurrence template string from detected recursive calls.

    This creates a human-friendly template like "T(n) = T(n-1) + T(n-2) + O(1)" when shifts
    can be inferred, otherwise a generic description is returned.
    """
    if not facts or not facts.has_recursive_calls:
        return "T(n) = ..."

    shifts = []
    for call in facts.recursive_calls:
        # try to extract numeric shift from parameters like 'n-1' or 'n-2'
        if call.parameters:
            p = call.parameters[0]
            if isinstance(p, str) and "n" in p:
                shifts.append(p.replace(" ", ""))
            else:
                shifts.append("T(sub)")
        else:
            shifts.append("T(sub)")

    if not shifts:
        return "T(n) = sum recursive calls + O(work)"

    # join shifts into recurrence form
    return "T(n) = " + " + ".join([f"T({s})" if s.startswith("n") else s for s in shifts]) + " + O(work)"


def generate_recursion_type_label(
    recursion_type: RecursionType, locale: Optional[str] = None
) -> str:
    """Get human-readable label for recursion type."""
    locale_value = normalize_locale(locale)

    labels = {
        "en": {
            "linear_recursive": "Linear Recursion",
            "divide_conquer": "Divide-and-Conquer",
            "multiple_recursive": "Multiple Recursion",
            "unknown": "Unknown Recursion",
        },
        "es": {
            "linear_recursive": "Recursión Lineal",
            "divide_conquer": "Divide y Conquista",
            "multiple_recursive": "Recursión Múltiple",
            "unknown": "Recursión Desconocida",
        },
    }

    return labels.get(locale_value, {}).get(recursion_type, recursion_type)
