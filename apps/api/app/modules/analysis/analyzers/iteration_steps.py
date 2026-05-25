from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from .recursive_steps_core import (
    StepStatus,
    compute_overall_status,
    get_asymptotic_notation,
    locale_key,
    make_recursive_step,
)

_TEMPLATE_STRINGS: Dict[str, Dict[str, str]] = {
    "es": {
        "iteration.recurrence_detected.linear_shift": "Se detectó una recurrencia de la familia Resta y Vencerás: en cada paso, $T(n)$ depende de $T(n-1)$ y de un término adicional $g(n)$.",
        "iteration.recurrence_detected.generic": "Se detectó una recurrencia recursiva candidata para análisis por iteración.",
        "iteration.recurrence_detected.generic_upper": "Se detectó una recurrencia recursiva que no cierra de forma exacta, así que se construirá una cota superior por iteración.",
        "iteration.applicability_validated.supported": "La recurrencia sí entra en la cobertura actual del método: forma $T(n)=T(n-1)+g(n)$ con paso unitario.",
        "iteration.applicability_validated.partial": "La recurrencia admite un recorrido por iteración, pero el cierre exacto no está garantizado; se mostrará una derivación parcial o una cota defendible.",
        "iteration.applicability_validated.upper": "La recurrencia no cierra exactamente, pero sí permite construir una cota superior por iteración.",
        "iteration.applicability_validated.unsupported": "La forma detectada queda fuera de la cobertura actual del método de iteración.",
        "iteration.upper_bound_simplified.standard": "Se simplificó la recurrencia para dominarla con una desigualdad más fuerte y manejable.",
        "iteration.upper_bound_monotonicity.standard": "Como $T(n)$ es creciente, se acota el término desplazado y se obtiene la desigualdad clave antes de generalizar.",
        "iteration.upper_bound_iterated.standard": "Se iteró la desigualdad superior para observar cómo crece el término dominante.",
        "iteration.upper_bound_generalized.standard": "Se generalizó la desigualdad tras $k$ pasos para obtener una expresión cerrable por cota.",
        "iteration.upper_bound_resolved.standard": "Se resolvió la desigualdad hasta el caso base y se obtuvo una cota superior explícita.",
        "iteration.upper_bound_no_exact_closure.standard": "No se obtuvo una forma cerrada exacta; el análisis continúa con una cota superior defendible.",
        "iteration.upper_bound_decision.standard": "La cota superior obtenida permite decidir el comportamiento asintótico.",
        "iteration.base_case_identified.found": "Se identificó el caso base y la condición de cierre para detener el despliegue en un índice concreto.",
        "iteration.base_case_identified.partial": "Se detectó la condición de cierre, pero faltan datos para fijar completamente el valor base de referencia.",
        "iteration.initial_unrolling_built.standard": "Se expandieron las primeras iteraciones para observar cómo se acumulan términos de $g(\\cdot)$ sin perder la dependencia recursiva.",
        "iteration.k_pattern_generalized.standard": "A partir de las expansiones, se generalizó el patrón tras $k$ pasos para separar parte recursiva y acumulación.",
        "iteration.k_value_solved.standard": "Se resolvió $k$ imponiendo la condición de llegada al caso base.",
        "iteration.summation_built.standard": "Con el valor de $k$ se construyó la sumatoria canónica desde el caso base hasta $n$.",
        "iteration.summation_simplified.complete": "La sumatoria se cerró simbólicamente y quedó una expresión explícita para continuar.",
        "iteration.summation_simplified.partial": "No se obtuvo cierre elemental completo de la sumatoria; se conserva una forma simbólica válida.",
        "iteration.final_expression_built.complete": "Se construyó la forma final de $T(n)$ combinando valor base y resultado de la sumatoria.",
        "iteration.final_expression_built.partial": "La forma final de $T(n)$ es parcial por limitaciones acumuladas en el cierre simbólico.",
        "iteration.dominant_term_identified.complete": "Se identificó el término que domina el crecimiento cuando $n$ aumenta.",
        "iteration.dominant_term_identified.partial": "La identificación del término dominante es parcial y se apoya en la mejor simplificación disponible.",
        "iteration.asymptotic_concluded.complete": "Se concluyó la complejidad asintótica a partir de la forma final obtenida.",
        "iteration.asymptotic_concluded.partial": "La conclusión asintótica es parcial porque depende de una aproximación controlada.",
        "iteration.step_blocked.unsupported": "Este paso queda bloqueado porque la recurrencia no cumple la cobertura necesaria del método de iteración.",
        "concept.iteration.recurrence_detected": "Este método parte de una recurrencia recursiva y la expande paso a paso para separar la dependencia residual del costo acumulado. Si el cierre exacto no aparece, el mismo proceso sirve para justificar una cota superior o inferior defendible.",
        "concept.iteration.applicability_validated": "La cobertura prioriza formas que puedan iterarse con evidencia algebraica. Si la expansión exacta no cierra, el walkthrough puede terminar en una cota equivalente, superior, inferior o parcial, siempre que la recurrencia auxiliar sea defendible.",
        "concept.iteration.upper_bound_simplified": "Cuando la recurrencia no cierra de forma exacta, se la compara con una desigualdad más fuerte que sí permita iterar. Esa simplificación no busca igualdad, sino una cota superior válida.",
        "concept.iteration.upper_bound_monotonicity": "Antes de iterar la recurrencia, se justifica la desigualdad usando la monotonía de $T(n)$. Ese paso evita que la cota parezca inventada y deja claro de dónde sale la estimación.",
        "concept.iteration.upper_bound_iterated": "Iterar la desigualdad permite ver cómo se acumula la sobreestimación en cada nivel. La idea es conservar una forma controlable del crecimiento, no una solución exacta.",
        "concept.iteration.upper_bound_generalized": "La forma con $k$ pasos resume el efecto acumulado de la desigualdad. Esa generalización permite reemplazar la recurrencia original por una cota manejable.",
        "concept.iteration.upper_bound_resolved": "Al llevar la generalización hasta el caso base, se obtiene una cota superior explícita. Esa cota es suficiente para clasificar el crecimiento aunque no exista cierre exacto.",
        "concept.iteration.upper_bound_no_exact_closure": "Cuando no aparece una forma cerrada, el método no se detiene: pasa a una desigualdad superior que sí pueda iterarse de manera válida.",
        "concept.iteration.upper_bound_decision": "La decisión asintótica se toma sobre la cota superior obtenida, no sobre una solución exacta inexistente.",
        "concept.iteration.base_case_identified": "El despliegue iterativo necesita un punto de cierre. El caso base define dónde se detiene la expansión y desde qué valor conocido se reconstruye la solución completa.",
        "concept.iteration.initial_unrolling_built": "Desenrollar las primeras iteraciones permite observar la estructura acumulativa real y evita proponer un patrón general sin evidencia algebraica.",
        "concept.iteration.k_pattern_generalized": "Tras observar varias expansiones, se abstrae una forma con $k$ pasos: una parte recursiva residual y una suma de aportes de $g(\\cdot)$. Esta generalización es la base del cierre.",
        "concept.iteration.k_value_solved": "El valor de $k$ no se adivina: se obtiene imponiendo que el término recursivo residual llegue al caso base. Esto conecta la generalización con una condición concreta de parada.",
        "concept.iteration.summation_built": "Sustituir $k$ transforma la forma general en una sumatoria sobre índices explícitos. Esa sumatoria representa el costo acumulado total durante todas las expansiones.",
        "concept.iteration.summation_simplified": "Cuando se puede, la sumatoria se cierra simbólicamente. Si no, se mantiene la forma simbólica sin ocultar la limitación, porque sigue siendo matemáticamente útil para razonar crecimiento.",
        "concept.iteration.final_expression_built": "La forma final combina el valor base con la suma acumulada. Esta ecuación final es la referencia para identificar comportamiento asintótico.",
        "concept.iteration.dominant_term_identified": "La dominancia se determina sobre la forma final: se compara qué término crece más rápido para $n$ grande y ese término gobierna la complejidad.",
        "concept.iteration.asymptotic_concluded": "La notación asintótica resume el crecimiento de largo plazo. Si hubo simplificación parcial, la conclusión se marca como parcial para preservar trazabilidad.",
        "concept.iteration.blocked": "Cuando el método no aplica en la cobertura actual, los pasos siguientes se dejan explícitamente bloqueados en vez de fingir continuidad.",
        "warning.iteration.unsupported_non_unit_shift": "Cobertura actual: solo se soporta recurrencia de decremento unitario $T(n)=T(n-1)+g(n)$.",
        "warning.iteration.unsupported_non_linear_form": "La forma detectada pertenece a otra familia (Divide y Vencerás o Resta y Serás Vencido) y no se resuelve aquí con este walkthrough de iteración.",
        "warning.iteration.missing_base_case": "No hay suficiente información de caso base para cerrar completamente la solución.",
        "warning.iteration.summation_partial": "La sumatoria no se cerró de forma elemental con las reglas simbólicas actuales.",
        "warning.iteration.asymptotic_partial": "La cota asintótica proviene de una aproximación controlada y se reporta como parcial.",
    },
    "en": {
        "iteration.recurrence_detected.linear_shift": "A Resta y Vencerás recurrence was detected: at each step, $T(n)$ depends on $T(n-1)$ plus an additional term $g(n)$.",
        "iteration.recurrence_detected.generic": "A recursive recurrence candidate was detected for iteration-method analysis.",
        "iteration.recurrence_detected.generic_upper": "A recursive recurrence was detected that does not close exactly, so an upper bound will be constructed by iteration.",
        "iteration.applicability_validated.supported": "The recurrence is within current method coverage: shape $T(n)=T(n-1)+g(n)$ with unit decrement.",
        "iteration.applicability_validated.partial": "The recurrence can still be unfolded iteratively, but no exact closed form is guaranteed; a partial derivation or defensible bound will be shown.",
        "iteration.applicability_validated.upper": "The recurrence does not close exactly, but it does allow an upper bound to be constructed by iteration.",
        "iteration.applicability_validated.unsupported": "The detected shape is outside current coverage of the iteration method.",
        "iteration.upper_bound_simplified.standard": "The recurrence was simplified into a stronger and more manageable inequality.",
        "iteration.upper_bound_monotonicity.standard": "Since $T(n)$ is increasing, the shifted term is bounded first and the key inequality is obtained before generalization.",
        "iteration.upper_bound_iterated.standard": "The upper inequality was iterated to expose how the dominant term grows.",
        "iteration.upper_bound_generalized.standard": "The inequality was generalized after $k$ steps into a form that can be closed by bounding.",
        "iteration.upper_bound_resolved.standard": "The inequality was resolved down to the base case and produced an explicit upper bound.",
        "iteration.upper_bound_no_exact_closure.standard": "No exact closed form was obtained; the analysis continues with a defensible upper bound.",
        "iteration.upper_bound_decision.standard": "The resulting upper bound is enough to decide the asymptotic behavior.",
        "iteration.base_case_identified.found": "A base case and stopping condition were identified to terminate expansion at a concrete index.",
        "iteration.base_case_identified.partial": "A stopping condition was detected, but base-value data is incomplete for a fully closed solution.",
        "iteration.initial_unrolling_built.standard": "Initial expansions were built to expose how $g(\\cdot)$ accumulates while preserving recursive dependence.",
        "iteration.k_pattern_generalized.standard": "From those expansions, the pattern after $k$ steps was generalized into residual recursion plus accumulation.",
        "iteration.k_value_solved.standard": "The value of $k$ was solved by enforcing arrival to the base case.",
        "iteration.summation_built.standard": "After substituting $k$, the canonical summation from base index to $n$ was constructed.",
        "iteration.summation_simplified.complete": "The summation was symbolically closed into an explicit expression.",
        "iteration.summation_simplified.partial": "No full elementary closed form was obtained; a valid symbolic form is preserved.",
        "iteration.final_expression_built.complete": "The final form of $T(n)$ was built by combining base value and summation result.",
        "iteration.final_expression_built.partial": "The final form of $T(n)$ is partial due to accumulated symbolic limitations.",
        "iteration.dominant_term_identified.complete": "The growth-dominant term was identified for large $n$.",
        "iteration.dominant_term_identified.partial": "Dominant-term identification is partial and relies on the best available simplification.",
        "iteration.asymptotic_concluded.complete": "Asymptotic complexity was concluded from the final expression.",
        "iteration.asymptotic_concluded.partial": "Asymptotic conclusion is partial because it relies on a controlled approximation.",
        "iteration.step_blocked.unsupported": "This step is blocked because the recurrence does not meet current iteration-method coverage.",
        "concept.iteration.recurrence_detected": "This method starts from a recursive recurrence and expands it step by step to separate the residual dependence from accumulated work. If an exact closed form does not appear, the same process can justify a defensible upper or lower bound.",
        "concept.iteration.applicability_validated": "The walkthrough prioritizes shapes that can be iterated with algebraic evidence. If the exact expansion does not close, it may end in an equivalent, upper, lower, or partial bound, provided the auxiliary recurrence is defensible.",
        "concept.iteration.upper_bound_simplified": "When the recurrence does not close exactly, it is compared with a stronger inequality that is still iterable. The goal is not equality; it is a valid upper bound.",
        "concept.iteration.upper_bound_monotonicity": "Before iterating the recurrence, the inequality is justified using the monotonicity of $T(n)$. That step makes the bound explicit instead of looking invented.",
        "concept.iteration.upper_bound_iterated": "Iterating the inequality shows how the overestimate accumulates at each level. The objective is a controllable growth expression, not an exact solution.",
        "concept.iteration.upper_bound_generalized": "The $k$-step form summarizes the accumulated effect of the inequality. It lets us replace the original recurrence with a manageable bound.",
        "concept.iteration.upper_bound_resolved": "Once the generalized form reaches the base case, we obtain an explicit upper bound. That bound is enough to classify growth even without an exact closed form.",
        "concept.iteration.upper_bound_no_exact_closure": "When no closed form appears, the method does not stop: it moves to a valid upper inequality that can still be iterated.",
        "concept.iteration.upper_bound_decision": "The asymptotic decision is made from the upper bound obtained, not from a nonexistent exact solution.",
        "concept.iteration.base_case_identified": "Iterative unfolding needs a closure point. The base case tells where expansion stops and from which known value reconstruction begins.",
        "concept.iteration.initial_unrolling_built": "Unrolling the first iterations reveals the actual accumulation structure and prevents guessing a general pattern without algebraic evidence.",
        "concept.iteration.k_pattern_generalized": "After a few expansions, we generalize a $k$-step form: one residual recursive term and one accumulated summation term.",
        "concept.iteration.k_value_solved": "The value of $k$ is solved by enforcing that the residual recursive argument reaches the base case.",
        "concept.iteration.summation_built": "Substituting $k$ yields an explicit indexed summation that represents total accumulated non-recursive work.",
        "concept.iteration.summation_simplified": "When possible, the summation is closed symbolically. Otherwise, the symbolic summation is kept explicitly as a mathematically valid intermediate result.",
        "concept.iteration.final_expression_built": "The final expression combines base value and accumulated contribution. This is the expression used for asymptotic reasoning.",
        "concept.iteration.dominant_term_identified": "Dominance is decided on the final form by comparing long-run growth rates of its terms.",
        "concept.iteration.asymptotic_concluded": "Asymptotic notation summarizes long-run growth. If prior steps were partial, this conclusion is explicitly marked partial as well.",
        "concept.iteration.blocked": "When method assumptions fail, following steps are explicitly blocked instead of pretending complete coverage.",
        "warning.iteration.unsupported_non_unit_shift": "Current coverage only supports unit-decrement recurrences $T(n)=T(n-1)+g(n)$.",
        "warning.iteration.unsupported_non_linear_form": "Detected shape belongs to another family (Divide y Vencerás or Resta y Serás Vencido), so this iteration walkthrough is out of scope.",
        "warning.iteration.missing_base_case": "Base-case data is insufficient for a fully closed solution.",
        "warning.iteration.summation_partial": "Summation could not be fully closed with current symbolic rules.",
        "warning.iteration.asymptotic_partial": "Asymptotic bound comes from a controlled approximation and is therefore partial.",
    },
}


@dataclass
class IterationStepContext:
    locale: str
    recurrence_form: str
    g_n: str
    is_supported: bool
    bound_kind: str  # "equivalent" | "upper" | "lower" | "partial"
    support_code: Optional[str]
    base_case_index: Optional[int]
    base_case_value: Optional[str]
    expansions: List[str]
    general_form: str
    k_condition: str
    k_value: str
    summation_expression: str
    summation_evaluated: str
    final_expression: str
    dominant_term: str
    theta: str
    summation_partial: bool = False
    asymptotic_partial: bool = False
    missing_base_case: bool = False
    generic_walkthrough: bool = False
    upper_bound_walkthrough: bool = False
    show_monotonicity_step: bool = False
    key_inequality: Optional[str] = None


_ITERATION_STEP_DEFS: List[Dict[str, str]] = [
    {"id": "iter_s1", "kind": "recurrence_detected"},
    {"id": "iter_s2", "kind": "applicability_validated"},
    {"id": "iter_s3", "kind": "base_case_identified"},
    {"id": "iter_s4", "kind": "initial_unrolling_built"},
    {"id": "iter_s5", "kind": "k_pattern_generalized"},
    {"id": "iter_s6", "kind": "k_value_solved"},
    {"id": "iter_s7", "kind": "summation_built"},
    {"id": "iter_s8", "kind": "summation_simplified"},
    {"id": "iter_s9", "kind": "final_expression_built"},
    {"id": "iter_s10", "kind": "dominant_term_identified"},
    {"id": "iter_s11", "kind": "asymptotic_concluded"},
]


def _title(locale: str, es: str, en: str) -> str:
    return es if locale_key(locale) == "es" else en


def _warning_for_support_code(support_code: Optional[str]) -> Optional[str]:
    if support_code == "ITER_UNSUPPORTED_NON_UNIT_SHIFT":
        return "warning.iteration.unsupported_non_unit_shift"
    if support_code == "ITER_UNSUPPORTED_NON_LINEAR_FORM":
        return "warning.iteration.unsupported_non_linear_form"
    return "warning.iteration.unsupported_non_linear_form"


def build_iteration_step_bundle(ctx: IterationStepContext) -> Dict[str, Any]:
    steps: List[Dict[str, Any]] = []

    if ctx.generic_walkthrough and ctx.upper_bound_walkthrough:
        step1_summary = "iteration.recurrence_detected.generic_upper"
        steps.append(
            make_recursive_step(
                template_strings=_TEMPLATE_STRINGS,
                locale=ctx.locale,
                index=1,
                step_id="iter_u1",
                kind="recurrence_detected",
                title=_title(ctx.locale, "Recurrencia detectada", "Detected recurrence"),
                status="complete",
                confidence="high",
                summary_key=step1_summary,
                concept_key="concept.iteration.recurrence_detected",
                primary_latex=ctx.recurrence_form,
                payload={
                    "sourceExpression": ctx.recurrence_form,
                    "g_n": ctx.g_n,
                },
            )
        )

        applicability_status: StepStatus = "partial"
        if not ctx.asymptotic_partial and not ctx.summation_partial:
            applicability_status = "complete"
        steps.append(
            make_recursive_step(
                template_strings=_TEMPLATE_STRINGS,
                locale=ctx.locale,
                index=2,
                step_id="iter_u2",
                kind="applicability_validated",
                title=_title(ctx.locale, "Cota superior por iteración", "Upper bound by iteration"),
                status=applicability_status,
                confidence="high" if applicability_status == "complete" else "medium",
                summary_key="iteration.applicability_validated.upper",
                concept_key="concept.iteration.applicability_validated",
                primary_latex=ctx.recurrence_form,
                payload={"supportReason": ctx.support_code or "ITER_GENERIC_UPPER_BOUND"},
            )
        )

        steps.append(
            make_recursive_step(
                template_strings=_TEMPLATE_STRINGS,
                locale=ctx.locale,
                index=3,
                step_id="iter_u3",
                kind="base_case_identified",
                title=_title(ctx.locale, "Caso base", "Base case"),
                status="partial" if ctx.missing_base_case else "complete",
                confidence="medium" if ctx.missing_base_case else "high",
                summary_key=(
                    "iteration.base_case_identified.partial"
                    if ctx.missing_base_case
                    else "iteration.base_case_identified.found"
                ),
                concept_key="concept.iteration.base_case_identified",
                warning_key=(
                    "warning.iteration.missing_base_case" if ctx.missing_base_case else None
                ),
                primary_latex=(
                    f"T({ctx.base_case_index})={ctx.base_case_value}"
                    if ctx.base_case_index is not None and ctx.base_case_value is not None
                    else (f"T({ctx.base_case_index})" if ctx.base_case_index is not None else None)
                ),
                payload={
                    "baseCase": {
                        "index": ctx.base_case_index,
                        "value": ctx.base_case_value,
                    }
                },
            )
        )

        if ctx.show_monotonicity_step:
            steps.append(
                make_recursive_step(
                    template_strings=_TEMPLATE_STRINGS,
                    locale=ctx.locale,
                    index=4,
                    step_id="iter_u4",
                    kind="upper_bound_simplified",
                    title=_title(ctx.locale, "Desigualdad clave", "Key inequality"),
                    status="complete",
                    confidence="high",
                    summary_key="iteration.upper_bound_monotonicity.standard",
                    concept_key="concept.iteration.upper_bound_monotonicity",
                    primary_latex=ctx.key_inequality or ctx.general_form,
                    payload={
                        "monotonicityJustification": ctx.expansions[1]
                        if len(ctx.expansions) > 1
                        else None,
                        "derivedExpression": ctx.key_inequality or ctx.general_form,
                    },
                )
            )

        offset = 1 if ctx.show_monotonicity_step else 0
        for index, title_es, title_en, summary_key, concept_key, kind, default_status in [
            (
                4 + offset,
                "Simplificación para análisis asintótico",
                "Asymptotic simplification",
                "iteration.upper_bound_simplified.standard",
                "concept.iteration.upper_bound_simplified",
                "summation_simplified",
                "complete",
            ),
            (
                5 + offset,
                "Primeras expansiones",
                "Initial unrolling",
                "iteration.upper_bound_iterated.standard",
                "concept.iteration.upper_bound_iterated",
                "initial_unrolling_built",
                "complete",
            ),
            (
                6 + offset,
                "No hay cierre exacto",
                "No exact closure",
                "iteration.upper_bound_no_exact_closure.standard",
                "concept.iteration.upper_bound_no_exact_closure",
                "k_pattern_generalized",
                "partial",
            ),
            (
                7 + offset,
                "Construcción de cota superior",
                "Upper bound construction",
                "iteration.upper_bound_generalized.standard",
                "concept.iteration.upper_bound_generalized",
                "k_value_solved",
                "complete",
            ),
        ]:
            # if index==6 (No exact closure) but asymptotic info is solid, mark complete
            status = default_status
            if index == 6 + offset and not ctx.asymptotic_partial and not ctx.summation_partial:
                status = "complete"
            if ctx.show_monotonicity_step and index == 5:
                primary_latex = ctx.key_inequality or ctx.general_form
                payload_expr = ctx.key_inequality or ctx.general_form
            else:
                primary_latex = (
                    ctx.general_form
                    if index == 4 + offset
                    else ctx.expansions[0]
                    if (index == 5 + offset and ctx.expansions)
                    else ctx.general_form
                    if index == 6 + offset
                    else f"{ctx.k_condition}\\Rightarrow k={ctx.k_value}"
                )
                payload_expr = (
                    ctx.general_form
                    if index == 4 + offset
                    else ctx.expansions[0]
                    if (index == 5 + offset and ctx.expansions)
                    else ctx.general_form
                    if index == 6 + offset
                    else f"k={ctx.k_value}"
                )
            steps.append(
                make_recursive_step(
                    template_strings=_TEMPLATE_STRINGS,
                    locale=ctx.locale,
                    index=index,
                    step_id=f"iter_u{index}",
                    kind=kind,
                    title=_title(ctx.locale, title_es, title_en),
                    status=status,
                    confidence="high" if status == "complete" else "medium",
                    summary_key=summary_key,
                    concept_key=concept_key,
                    primary_latex=primary_latex,
                    payload={"derivedExpression": payload_expr},
                )
            )

        asymp_status = "partial" if ctx.asymptotic_partial or ctx.summation_partial else "complete"
        steps.append(
            make_recursive_step(
                template_strings=_TEMPLATE_STRINGS,
                locale=ctx.locale,
                index=8,
                step_id="iter_u8",
                kind="asymptotic_concluded",
                title=_title(ctx.locale, "Conclusión asintótica", "Asymptotic conclusion"),
                status=asymp_status,
                confidence="high" if asymp_status == "complete" else "medium",
                summary_key="iteration.upper_bound_decision.standard",
                concept_key="concept.iteration.upper_bound_decision",
                warning_key=(
                    "warning.iteration.asymptotic_partial" if asymp_status == "partial" else None
                ),
                primary_latex=get_asymptotic_notation(ctx.bound_kind, ctx.theta),
                payload={"boundKind": ctx.bound_kind, "theta": ctx.theta},
                codes=["ITER_GENERIC_UPPER_BOUND"],
            )
        )

        return {
            "method": "iteration",
            "version": "iter_steps_upper_v1",
            "overallStatus": compute_overall_status(steps),
            "steps": steps,
        }

    step1_summary = (
        "iteration.recurrence_detected.linear_shift"
        if ctx.is_supported and not ctx.generic_walkthrough
        else "iteration.recurrence_detected.generic"
    )
    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=1,
            step_id="iter_s1",
            kind="recurrence_detected",
            title=_title(ctx.locale, "Recurrencia detectada", "Detected recurrence"),
            status="complete",
            confidence="high",
            summary_key=step1_summary,
            concept_key="concept.iteration.recurrence_detected",
            primary_latex=ctx.recurrence_form,
            payload={
                "sourceExpression": ctx.recurrence_form,
                "g_n": ctx.g_n,
            },
        )
    )

    if not ctx.is_supported and not ctx.generic_walkthrough:
        warning_key = _warning_for_support_code(ctx.support_code)
        support_code = ctx.support_code or "ITER_UNSUPPORTED_NON_LINEAR_FORM"
        steps.append(
            make_recursive_step(
                template_strings=_TEMPLATE_STRINGS,
                locale=ctx.locale,
                index=2,
                step_id="iter_s2",
                kind="applicability_validated",
                title=_title(
                    ctx.locale,
                    "Validación de aplicabilidad",
                    "Applicability validation",
                ),
                status="unsupported",
                confidence="low",
                summary_key="iteration.applicability_validated.unsupported",
                concept_key="concept.iteration.applicability_validated",
                warning_key=warning_key,
                primary_latex=ctx.recurrence_form,
                payload={"supportReason": support_code},
                codes=[support_code],
            )
        )

        blocked_title_map = {
            "base_case_identified": _title(
                ctx.locale, "Caso base y cierre", "Base case and closure"
            ),
            "initial_unrolling_built": _title(
                ctx.locale, "Primeras expansiones", "Initial unrolling"
            ),
            "k_pattern_generalized": _title(
                ctx.locale, "Patrón tras k expansiones", "Pattern after k expansions"
            ),
            "k_value_solved": _title(ctx.locale, "Cálculo de k", "Solving k"),
            "summation_built": _title(
                ctx.locale, "Construcción de sumatoria", "Summation construction"
            ),
            "summation_simplified": _title(
                ctx.locale, "Simplificación de sumatoria", "Summation simplification"
            ),
            "final_expression_built": _title(
                ctx.locale, "Forma final de T(n)", "Final T(n) expression"
            ),
            "dominant_term_identified": _title(ctx.locale, "Término dominante", "Dominant term"),
            "asymptotic_concluded": _title(
                ctx.locale, "Conclusión asintótica", "Asymptotic conclusion"
            ),
        }

        for index, step_def in enumerate(_ITERATION_STEP_DEFS[2:], start=3):
            steps.append(
                make_recursive_step(
                    template_strings=_TEMPLATE_STRINGS,
                    locale=ctx.locale,
                    index=index,
                    step_id=step_def["id"],
                    kind=step_def["kind"],
                    title=blocked_title_map[step_def["kind"]],
                    status="unsupported",
                    confidence="low",
                    summary_key="iteration.step_blocked.unsupported",
                    concept_key="concept.iteration.blocked",
                    warning_key=warning_key,
                    payload={"supportReason": support_code},
                    codes=[support_code],
                    blocked_by=["iter_s2"],
                )
            )

        return {
            "method": "iteration",
            "version": "iter_steps_v1",
            "overallStatus": compute_overall_status(steps),
            "steps": steps,
        }

    applicability_status: StepStatus = "partial" if ctx.generic_walkthrough else "complete"
    applicability_summary_key = (
        "iteration.applicability_validated.partial"
        if ctx.generic_walkthrough
        else "iteration.applicability_validated.supported"
    )
    step3_status: StepStatus = (
        "partial" if (ctx.missing_base_case or ctx.generic_walkthrough) else "complete"
    )
    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=2,
            step_id="iter_s2",
            kind="applicability_validated",
            title=_title(ctx.locale, "Validación de aplicabilidad", "Applicability validation"),
            status=applicability_status,
            confidence="medium" if ctx.generic_walkthrough else "high",
            summary_key=applicability_summary_key,
            concept_key="concept.iteration.applicability_validated",
            primary_latex=ctx.recurrence_form,
            payload={"supportReason": ctx.support_code or "supported_iteration_walkthrough"},
        )
    )
    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=3,
            step_id="iter_s3",
            kind="base_case_identified",
            title=_title(ctx.locale, "Caso base y cierre", "Base case and closure"),
            status=step3_status,
            confidence="medium" if step3_status == "partial" else "high",
            summary_key=(
                "iteration.base_case_identified.partial"
                if step3_status == "partial"
                else "iteration.base_case_identified.found"
            ),
            concept_key="concept.iteration.base_case_identified",
            warning_key=(
                "warning.iteration.missing_base_case" if step3_status == "partial" else None
            ),
            primary_latex=(
                f"T({ctx.base_case_index})={ctx.base_case_value}"
                if ctx.base_case_index is not None and ctx.base_case_value is not None
                else (f"T({ctx.base_case_index})" if ctx.base_case_index is not None else None)
            ),
            payload={
                "baseCase": {
                    "index": ctx.base_case_index,
                    "value": ctx.base_case_value,
                }
            },
            codes=["ITER_MISSING_BASE_CASE"] if step3_status == "partial" else [],
        )
    )

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=4,
            step_id="iter_s4",
            kind="initial_unrolling_built",
            title=_title(ctx.locale, "Primeras expansiones", "Initial unrolling"),
            status="complete",
            confidence="high",
            summary_key="iteration.initial_unrolling_built.standard",
            concept_key="concept.iteration.initial_unrolling_built",
            primary_latex=ctx.expansions[0] if ctx.expansions else ctx.recurrence_form,
            items=[
                {
                    "id": f"iter_s4_e{idx+2}",
                    "kind": "transformation",
                    "latex": expansion,
                }
                for idx, expansion in enumerate(ctx.expansions[1:])
            ],
            payload={
                "sourceExpression": ctx.recurrence_form,
                "expansions": ctx.expansions,
            },
            derivation={
                "sourceExpression": ctx.recurrence_form,
                "derivedExpression": (
                    ctx.expansions[-1] if ctx.expansions else ctx.recurrence_form
                ),
            },
        )
    )

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=5,
            step_id="iter_s5",
            kind="k_pattern_generalized",
            title=_title(ctx.locale, "Patrón tras k expansiones", "Pattern after k expansions"),
            status="complete",
            confidence="high",
            summary_key="iteration.k_pattern_generalized.standard",
            concept_key="concept.iteration.k_pattern_generalized",
            primary_latex=ctx.general_form,
            payload={
                "derivedExpression": ctx.general_form,
            },
            derivation={
                "derivedExpression": ctx.general_form,
            },
        )
    )

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=6,
            step_id="iter_s6",
            kind="k_value_solved",
            title=_title(ctx.locale, "Cálculo de k", "Solving k"),
            status="complete",
            confidence="high",
            summary_key="iteration.k_value_solved.standard",
            concept_key="concept.iteration.k_value_solved",
            primary_latex=f"{ctx.k_condition}\\Rightarrow k={ctx.k_value}",
            payload={
                "sourceExpression": ctx.k_condition,
                "derivedExpression": f"k={ctx.k_value}",
                "substitutions": [{"symbol": "k", "value": ctx.k_value}],
            },
            derivation={
                "sourceExpression": ctx.k_condition,
                "derivedExpression": f"k={ctx.k_value}",
                "substitutions": [{"symbol": "k", "value": ctx.k_value}],
            },
        )
    )

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=7,
            step_id="iter_s7",
            kind="summation_built",
            title=_title(ctx.locale, "Construcción de sumatoria", "Summation construction"),
            status="complete",
            confidence="high",
            summary_key="iteration.summation_built.standard",
            concept_key="concept.iteration.summation_built",
            primary_latex=ctx.summation_expression,
            payload={
                "derivedExpression": ctx.summation_expression,
                "substitutions": [{"symbol": "k", "value": ctx.k_value}],
            },
            derivation={
                "derivedExpression": ctx.summation_expression,
                "substitutions": [{"symbol": "k", "value": ctx.k_value}],
            },
        )
    )

    step8_status: StepStatus = "partial" if ctx.summation_partial else "complete"
    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=8,
            step_id="iter_s8",
            kind="summation_simplified",
            title=_title(ctx.locale, "Simplificación de sumatoria", "Summation simplification"),
            status=step8_status,
            confidence="medium" if step8_status == "partial" else "high",
            summary_key=(
                "iteration.summation_simplified.partial"
                if step8_status == "partial"
                else "iteration.summation_simplified.complete"
            ),
            concept_key="concept.iteration.summation_simplified",
            warning_key=(
                "warning.iteration.summation_partial" if step8_status == "partial" else None
            ),
            primary_latex=ctx.summation_evaluated,
            payload={
                "symbolicResult": ctx.summation_evaluated,
                "supportReason": (
                    "ITER_SUMMATION_PARTIAL" if step8_status == "partial" else "complete"
                ),
            },
            derivation={
                "symbolicResult": ctx.summation_evaluated,
            },
            codes=["ITER_SUMMATION_PARTIAL"] if step8_status == "partial" else [],
        )
    )

    step9_status: StepStatus = (
        "partial" if step3_status == "partial" or step8_status == "partial" else "complete"
    )
    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=9,
            step_id="iter_s9",
            kind="final_expression_built",
            title=_title(ctx.locale, "Forma final de T(n)", "Final T(n) expression"),
            status=step9_status,
            confidence="medium" if step9_status == "partial" else "high",
            summary_key=(
                "iteration.final_expression_built.partial"
                if step9_status == "partial"
                else "iteration.final_expression_built.complete"
            ),
            concept_key="concept.iteration.final_expression_built",
            primary_latex=ctx.final_expression,
            payload={
                "derivedExpression": ctx.final_expression,
            },
            derivation={
                "derivedExpression": ctx.final_expression,
            },
            blocked_by=["iter_s3"] if step3_status == "partial" else [],
        )
    )

    step10_status: StepStatus = "partial" if step9_status == "partial" else "complete"
    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=10,
            step_id="iter_s10",
            kind="dominant_term_identified",
            title=_title(ctx.locale, "Término dominante", "Dominant term"),
            status=step10_status,
            confidence="medium" if step10_status == "partial" else "high",
            summary_key=(
                "iteration.dominant_term_identified.partial"
                if step10_status == "partial"
                else "iteration.dominant_term_identified.complete"
            ),
            concept_key="concept.iteration.dominant_term_identified",
            primary_latex=ctx.dominant_term,
            payload={"dominantTerm": ctx.dominant_term},
        )
    )

    has_prior_partial = any(s.get("status") in {"partial", "unsupported", "error"} for s in steps)
    step11_status: StepStatus = (
        "partial" if has_prior_partial or ctx.asymptotic_partial else "complete"
    )
    step11_warning_key = (
        "warning.iteration.asymptotic_partial"
        if step11_status == "partial" and ctx.asymptotic_partial
        else None
    )
    step11_codes = ["ITER_ASYMPTOTIC_HEURISTIC"] if ctx.asymptotic_partial else []

    # Convertir a notación correcta basada en bound_kind
    theta_with_notation = get_asymptotic_notation(ctx.bound_kind, ctx.theta)

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=11,
            step_id="iter_s11",
            kind="asymptotic_concluded",
            title=_title(ctx.locale, "Conclusión asintótica", "Asymptotic conclusion"),
            status=step11_status,
            confidence="medium" if step11_status == "partial" else "high",
            summary_key=(
                "iteration.asymptotic_concluded.partial"
                if step11_status == "partial"
                else "iteration.asymptotic_concluded.complete"
            ),
            concept_key="concept.iteration.asymptotic_concluded",
            warning_key=step11_warning_key,
            primary_latex=f"T(n) = {theta_with_notation}",
            payload={
                "asymptoticResult": theta_with_notation,
                "supportReason": (
                    "ITER_ASYMPTOTIC_HEURISTIC" if ctx.asymptotic_partial else "complete"
                ),
            },
            derivation={
                "asymptoticResult": theta_with_notation,
            },
            codes=step11_codes,
        )
    )

    return {
        "method": "iteration",
        "version": "iter_steps_v1",
        "overallStatus": compute_overall_status(steps),
        "steps": steps,
    }
