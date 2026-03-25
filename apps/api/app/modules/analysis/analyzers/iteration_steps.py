from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from .recursive_steps_core import (
    StepStatus,
    compute_overall_status,
    locale_key,
    make_recursive_step,
)


_TEMPLATE_STRINGS: Dict[str, Dict[str, str]] = {
    "es": {
        "iteration.recurrence_detected.linear_shift": "Se detectó una recurrencia de decremento unitario: en cada paso, $T(n)$ depende de $T(n-1)$ y de un término adicional $g(n)$.",
        "iteration.recurrence_detected.generic": "Se detectó una recurrencia recursiva candidata para análisis por iteración.",
        "iteration.applicability_validated.supported": "La recurrencia sí entra en la cobertura V1 del método: forma $T(n)=T(n-1)+g(n)$ con paso unitario.",
        "iteration.applicability_validated.unsupported": "La forma detectada queda fuera de la cobertura V1 del método de iteración.",
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

        "concept.iteration.recurrence_detected": "El método de iteración trabaja desplegando recursivamente una forma concreta de recurrencia. Por eso primero se fija con precisión qué depende de $T(n-1)$ y qué parte corresponde al costo externo $g(n)$.",
        "concept.iteration.applicability_validated": "Para evitar conclusiones inválidas, la cobertura V1 se restringe a decremento unitario. Si la forma es de divide-and-conquer o tiene desplazamientos no unitarios, este método no se aplica de forma canónica en esta versión.",
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

        "warning.iteration.unsupported_non_unit_shift": "Cobertura V1: solo se soporta recurrencia de decremento unitario $T(n)=T(n-1)+g(n)$.",
        "warning.iteration.unsupported_non_linear_form": "La forma detectada corresponde a otra familia de recurrencias (por ejemplo divide-and-conquer) y no se resuelve aquí por iteración V1.",
        "warning.iteration.missing_base_case": "No hay suficiente información de caso base para cerrar completamente la solución.",
        "warning.iteration.summation_partial": "La sumatoria no se cerró de forma elemental con las reglas simbólicas actuales.",
        "warning.iteration.asymptotic_partial": "La cota asintótica proviene de una aproximación controlada y se reporta como parcial.",
    },
    "en": {
        "iteration.recurrence_detected.linear_shift": "A unit-decrement recurrence was detected: at each step, $T(n)$ depends on $T(n-1)$ plus an additional term $g(n)$.",
        "iteration.recurrence_detected.generic": "A recursive recurrence candidate was detected for iteration-method analysis.",
        "iteration.applicability_validated.supported": "The recurrence is within V1 coverage: shape $T(n)=T(n-1)+g(n)$ with unit decrement.",
        "iteration.applicability_validated.unsupported": "The detected shape is outside V1 coverage of the iteration method.",
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
        "iteration.step_blocked.unsupported": "This step is blocked because the recurrence does not meet iteration-method V1 coverage.",

        "concept.iteration.recurrence_detected": "The iteration method unfolds a specific recurrence shape. We first pin down what belongs to $T(n-1)$ dependence and what belongs to external work $g(n)$.",
        "concept.iteration.applicability_validated": "To avoid invalid conclusions, V1 is intentionally restricted to unit decrement recurrences. Divide-and-conquer or non-unit shifts are marked unsupported here.",
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

        "warning.iteration.unsupported_non_unit_shift": "V1 coverage only supports unit-decrement recurrences $T(n)=T(n-1)+g(n)$.",
        "warning.iteration.unsupported_non_linear_form": "Detected shape belongs to another recurrence family (for example divide-and-conquer), so iteration V1 does not solve it here.",
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

    step1_summary = (
        "iteration.recurrence_detected.linear_shift"
        if ctx.is_supported
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

    if not ctx.is_supported:
        warning_key = _warning_for_support_code(ctx.support_code)
        support_code = ctx.support_code or "ITER_UNSUPPORTED_NON_LINEAR_FORM"
        steps.append(
            make_recursive_step(
                template_strings=_TEMPLATE_STRINGS,
                locale=ctx.locale,
                index=2,
                step_id="iter_s2",
                kind="applicability_validated",
                title=_title(ctx.locale, "Validación de aplicabilidad", "Applicability validation"),
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
            "base_case_identified": _title(ctx.locale, "Caso base y cierre", "Base case and closure"),
            "initial_unrolling_built": _title(ctx.locale, "Primeras expansiones", "Initial unrolling"),
            "k_pattern_generalized": _title(ctx.locale, "Patrón tras k expansiones", "Pattern after k expansions"),
            "k_value_solved": _title(ctx.locale, "Cálculo de k", "Solving k"),
            "summation_built": _title(ctx.locale, "Construcción de sumatoria", "Summation construction"),
            "summation_simplified": _title(ctx.locale, "Simplificación de sumatoria", "Summation simplification"),
            "final_expression_built": _title(ctx.locale, "Forma final de T(n)", "Final T(n) expression"),
            "dominant_term_identified": _title(ctx.locale, "Término dominante", "Dominant term"),
            "asymptotic_concluded": _title(ctx.locale, "Conclusión asintótica", "Asymptotic conclusion"),
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

    step3_status: StepStatus = "partial" if ctx.missing_base_case else "complete"
    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=2,
            step_id="iter_s2",
            kind="applicability_validated",
            title=_title(ctx.locale, "Validación de aplicabilidad", "Applicability validation"),
            status="complete",
            confidence="high",
            summary_key="iteration.applicability_validated.supported",
            concept_key="concept.iteration.applicability_validated",
            primary_latex=ctx.recurrence_form,
            payload={"supportReason": "supported_unit_shift_v1"},
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
                "warning.iteration.missing_base_case"
                if step3_status == "partial"
                else None
            ),
            primary_latex=(
                f"T({ctx.base_case_index})={ctx.base_case_value}"
                if ctx.base_case_index is not None and ctx.base_case_value is not None
                else f"T({ctx.base_case_index})" if ctx.base_case_index is not None else None
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
                {"id": f"iter_s4_e{idx+2}", "kind": "transformation", "latex": expansion}
                for idx, expansion in enumerate(ctx.expansions[1:])
            ],
            payload={
                "sourceExpression": ctx.recurrence_form,
                "expansions": ctx.expansions,
            },
            derivation={
                "sourceExpression": ctx.recurrence_form,
                "derivedExpression": ctx.expansions[-1] if ctx.expansions else ctx.recurrence_form,
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
                "warning.iteration.summation_partial"
                if step8_status == "partial"
                else None
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
        "partial"
        if step3_status == "partial" or step8_status == "partial"
        else "complete"
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
            primary_latex=f"T(n) = {ctx.theta}",
            payload={
                "asymptoticResult": ctx.theta,
                "supportReason": (
                    "ITER_ASYMPTOTIC_HEURISTIC" if ctx.asymptotic_partial else "complete"
                ),
            },
            derivation={
                "asymptoticResult": ctx.theta,
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
