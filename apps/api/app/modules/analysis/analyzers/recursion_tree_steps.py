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
        "tree.recurrence_detected.standard": "Se detectó una recurrencia de familia Divide y Vencerás para analizar por árbol de recursión.",
        "tree.applicability.supported": "La recurrencia cumple la forma base del método: $T(n)=aT(n/b)+f(n)$ con parámetros válidos.",
        "tree.applicability.unsupported": "La recurrencia detectada queda fuera de la cobertura formal actual del árbol de recursión simbólico.",
        "tree.parameters.extracted": "Se extrajeron los parámetros estructurales del árbol: ramificación, reducción de tamaño y costo externo.",
        "tree.level_model.built": "Se modeló el nivel $i$ con número de nodos, tamaño de subproblema y costo por nodo.",
        "tree.level_cost.computed": "El costo total del nivel se obtuvo como número de nodos por costo de cada nodo.",
        "tree.height.determined": "Se determinó la altura imponiendo llegada al caso base.",
        "tree.leaf_cost.computed": "Se calculó el número de hojas y su contribución al costo total.",
        "tree.total_sum.built": "Se construyó la sumatoria total del árbol con niveles internos y contribución terminal.",
        "tree.total_sum.simplified.complete": "La sumatoria total se simplificó a una forma cerrada utilizable para concluir complejidad.",
        "tree.total_sum.simplified.partial": "La simplificación de la sumatoria quedó parcial; se conserva una forma simbólica válida.",
        "tree.dominant_term.identified.complete": "Se identificó el término dominante según la distribución de costo entre niveles.",
        "tree.dominant_term.identified.partial": "La dominancia se identificó parcialmente con la mejor evidencia simbólica disponible.",
        "tree.asymptotic_conclusion.complete": "Se concluyó la complejidad asintótica final del método de árbol de recursión.",
        "tree.asymptotic_conclusion.partial": "La conclusión asintótica se reporta como parcial por limitaciones previas en el cierre simbólico.",
        "tree.asymptotic_conclusion.unsupported": "No hay conclusión cerrada del método con la cobertura actual para este caso.",
        "tree.step_blocked.unsupported": "Este paso queda bloqueado porque la recurrencia no cumple la aplicabilidad formal actual del método.",
        "concept.tree.recurrence_detected": "Primero fijamos la ecuación exacta que vamos a analizar. Esto evita mezclar fórmulas de otros métodos y deja claro qué estructura matemática se está resolviendo.",
        "concept.tree.recursion_tree_applicability_check": "El árbol de recursión simbólico se usa sobre todo en Divide y Vencerás con reducción uniforme. Para familias de Resta y Vencerás o Resta y Serás Vencido, esta versión del método no es la más representativa y se reporta explícitamente.",
        "concept.tree.tree_parameters_extracted": "Los parámetros $a$, $b$ y $f(n)$ determinan la geometría del árbol: cuántos nodos nacen por nivel, cómo cambia el tamaño del subproblema y qué costo local aporta cada nodo.",
        "concept.tree.level_model_built": "Modelar el nivel $i$ permite separar estructura y costo: cuántos subproblemas hay, de qué tamaño son y qué cuesta resolver cada uno. Ese modelo es la base del análisis por niveles.",
        "concept.tree.level_cost_computed": "En árbol de recursión, el costo de un nivel no se adivina: se multiplica nodos por costo por nodo. Esa regla traduce la estructura del árbol en una expresión de costo acumulado.",
        "concept.tree.tree_height_determined": "La altura se obtiene con la condición de cierre del tamaño de subproblema. Resolver esa ecuación indica cuántos niveles se expanden antes de llegar al caso base.",
        "concept.tree.leaf_cost_computed": "Las hojas representan subproblemas terminales. Su cantidad y costo deben modelarse explícitamente porque, según el caso, pueden dominar el total.",
        "concept.tree.total_tree_sum_built": "La complejidad total surge de sumar el costo de todos los niveles relevantes. Esta suma conserva la trazabilidad matemática del método.",
        "concept.tree.total_tree_sum_simplified": "Después de construir la suma, se simplifica cuando es posible. Si no cierra en forma elemental, se mantiene una forma parcial válida para no ocultar límites del motor simbólico.",
        "concept.tree.dominant_term_identified": "El término dominante se identifica comparando cómo crece el costo entre niveles (raíz, niveles intermedios u hojas). Ese paso conecta la suma con la cota asintótica.",
        "concept.tree.asymptotic_conclusion": "La conclusión asintótica resume el crecimiento de largo plazo de $T(n)$ y debe reflejar el estado real de soporte: completo, parcial o no soportado.",
        "concept.tree.blocked": "Cuando el método no aplica formalmente, los pasos siguientes se marcan como bloqueados para mantener transparencia matemática.",
        "warning.tree.unsupported_form": "Cobertura actual: este walkthrough del árbol se soporta para la familia Divide y Vencerás, $T(n)=aT(n/b)+f(n)$ con reducción uniforme.",
        "warning.tree.invalid_parameters": "Parámetros inválidos para el modelo del árbol: se requiere $a\\ge 1$ y $b>1$.",
        "warning.tree.sum_partial": "No fue posible cerrar completamente la sumatoria con las reglas simbólicas actuales.",
        "warning.tree.tree_inconsistent": "Se detectó inconsistencia entre artefactos del árbol y el modelo simbólico esperado.",
        "warning.tree.asymptotic_partial": "La cota final se reporta como parcial porque depende de simplificación o heurística controlada.",
    },
    "en": {
        "tree.recurrence_detected.standard": "A Divide y Vencerás recurrence was detected for recursion-tree analysis.",
        "tree.applicability.supported": "The recurrence matches the base method form: $T(n)=aT(n/b)+f(n)$ with valid parameters.",
        "tree.applicability.unsupported": "Detected recurrence falls outside formal current coverage of symbolic recursion-tree walkthrough.",
        "tree.parameters.extracted": "Structural parameters were extracted: branching factor, size reduction, and external work.",
        "tree.level_model.built": "Level $i$ model was built with node count, subproblem size, and per-node cost.",
        "tree.level_cost.computed": "Total level cost was computed as node count times per-node cost.",
        "tree.height.determined": "Tree height was determined by enforcing base-case reach condition.",
        "tree.leaf_cost.computed": "Leaf count and leaf contribution to total cost were computed.",
        "tree.total_sum.built": "Total tree summation was built with internal levels and terminal contribution.",
        "tree.total_sum.simplified.complete": "Total summation was simplified to a closed form suitable for complexity conclusion.",
        "tree.total_sum.simplified.partial": "Summation simplification is partial; a valid symbolic form is preserved.",
        "tree.dominant_term.identified.complete": "Dominant term was identified from cost distribution across levels.",
        "tree.dominant_term.identified.partial": "Dominance was identified partially with best available symbolic evidence.",
        "tree.asymptotic_conclusion.complete": "Final asymptotic complexity was concluded for recursion-tree method.",
        "tree.asymptotic_conclusion.partial": "Asymptotic conclusion is partial due to previous symbolic closure limitations.",
        "tree.asymptotic_conclusion.unsupported": "No closed method conclusion is available under current coverage.",
        "tree.step_blocked.unsupported": "This step is blocked because recurrence does not meet formal current method applicability.",
        "concept.tree.recurrence_detected": "We first pin down the exact recurrence under analysis. This prevents mixing formulas from other methods and keeps the mathematical target explicit.",
        "concept.tree.recursion_tree_applicability_check": "This symbolic recursion-tree walkthrough is mainly for Divide y Vencerás with uniform reduction. For Resta y Vencerás or Resta y Serás Vencido, this version is less representative and is explicitly marked out of scope.",
        "concept.tree.tree_parameters_extracted": "Parameters $a$, $b$, and $f(n)$ define tree geometry: branching per level, subproblem shrink rate, and local work per node.",
        "concept.tree.level_model_built": "Level-$i$ modeling separates structure from cost: how many subproblems exist, what size they have, and what each one costs.",
        "concept.tree.level_cost_computed": "In recursion-tree analysis, level cost is derived, not guessed: node count multiplied by per-node cost.",
        "concept.tree.tree_height_determined": "Height comes from base-case closure condition. Solving that equation gives the number of expansion levels.",
        "concept.tree.leaf_cost_computed": "Leaves are terminal subproblems. Their count and cost must be explicit because they can dominate the full complexity.",
        "concept.tree.total_tree_sum_built": "Total complexity is built by summing relevant level costs. This preserves mathematical traceability of the method.",
        "concept.tree.total_tree_sum_simplified": "After building the sum, we simplify when possible. If no elementary closure exists, a valid partial symbolic form is retained.",
        "concept.tree.dominant_term_identified": "Dominant term is identified by comparing level growth (root, internal levels, or leaves), linking sum structure to asymptotic behavior.",
        "concept.tree.asymptotic_conclusion": "Asymptotic conclusion summarizes long-run growth of $T(n)$ and must reflect real support status: complete, partial, or unsupported.",
        "concept.tree.blocked": "When method assumptions fail, downstream steps are marked blocked to preserve mathematical transparency.",
        "warning.tree.unsupported_form": "Current coverage: this walkthrough is supported for Divide y Vencerás recurrences of the form $T(n)=aT(n/b)+f(n)$ with uniform reduction.",
        "warning.tree.invalid_parameters": "Invalid tree-model parameters: required $a\\ge 1$ and $b>1$.",
        "warning.tree.sum_partial": "Could not fully close the summation with current symbolic rules.",
        "warning.tree.tree_inconsistent": "An inconsistency was detected between produced tree artifacts and expected symbolic model.",
        "warning.tree.asymptotic_partial": "Final bound is partial because it relies on symbolic approximation/heuristic.",
    },
}


@dataclass
class RecursionTreeStepContext:
    locale: str
    recurrence_form: str
    recurrence_type: str
    a: Optional[int]
    b: Optional[float]
    f_n: str
    n0: Optional[int]
    is_supported: bool
    support_code: Optional[str]
    level_model_latex: Optional[str]
    level_cost_latex: Optional[str]
    height_latex: Optional[str]
    leaf_count_latex: Optional[str]
    leaf_cost_latex: Optional[str]
    total_expression_latex: Optional[str]
    simplified_expression_latex: Optional[str]
    dominant_level: Optional[str]
    dominant_reason_latex: Optional[str]
    theta_latex: Optional[str]
    summation_partial: bool = False
    tree_inconsistent: bool = False
    asymptotic_partial: bool = False


_STEP_DEFS: List[Dict[str, str]] = [
    {"id": "rt_s1", "kind": "recurrence_detected"},
    {"id": "rt_s2", "kind": "recursion_tree_applicability_check"},
    {"id": "rt_s3", "kind": "tree_parameters_extracted"},
    {"id": "rt_s4", "kind": "level_model_built"},
    {"id": "rt_s5", "kind": "level_cost_computed"},
    {"id": "rt_s6", "kind": "tree_height_determined"},
    {"id": "rt_s7", "kind": "leaf_cost_computed"},
    {"id": "rt_s8", "kind": "total_tree_sum_built"},
    {"id": "rt_s9", "kind": "total_tree_sum_simplified"},
    {"id": "rt_s10", "kind": "dominant_term_identified"},
    {"id": "rt_s11", "kind": "asymptotic_conclusion"},
]


def _title(locale: str, es: str, en: str) -> str:
    return es if locale_key(locale) == "es" else en


def _unsupported_warning_for(code: Optional[str]) -> str:
    if code == "RT_INVALID_PARAMETERS":
        return "warning.tree.invalid_parameters"
    return "warning.tree.unsupported_form"


def build_recursion_tree_step_bundle(ctx: RecursionTreeStepContext) -> Dict[str, Any]:
    steps: List[Dict[str, Any]] = []

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=1,
            step_id="rt_s1",
            kind="recurrence_detected",
            title=_title(ctx.locale, "Recurrencia detectada", "Detected recurrence"),
            status="complete",
            confidence="high",
            summary_key="tree.recurrence_detected.standard",
            concept_key="concept.tree.recurrence_detected",
            primary_latex=ctx.recurrence_form,
            payload={
                "sourceExpression": ctx.recurrence_form,
                "recurrenceType": ctx.recurrence_type,
            },
        )
    )

    if not ctx.is_supported:
        support_code = ctx.support_code or "RT_UNSUPPORTED_FORM"
        warning_key = _unsupported_warning_for(support_code)
        steps.append(
            make_recursive_step(
                template_strings=_TEMPLATE_STRINGS,
                locale=ctx.locale,
                index=2,
                step_id="rt_s2",
                kind="recursion_tree_applicability_check",
                title=_title(
                    ctx.locale, "Aplicabilidad del método", "Method applicability"
                ),
                status="unsupported",
                confidence="low",
                summary_key="tree.applicability.unsupported",
                concept_key="concept.tree.recursion_tree_applicability_check",
                warning_key=warning_key,
                primary_latex=ctx.recurrence_form,
                payload={"supportReason": support_code},
                codes=[support_code],
            )
        )

        blocked_titles = {
            "tree_parameters_extracted": _title(
                ctx.locale, "Parámetros del árbol", "Tree parameters"
            ),
            "level_model_built": _title(
                ctx.locale, "Modelo del nivel i", "Level-i model"
            ),
            "level_cost_computed": _title(ctx.locale, "Costo por nivel", "Level cost"),
            "tree_height_determined": _title(
                ctx.locale, "Altura del árbol", "Tree height"
            ),
            "leaf_cost_computed": _title(ctx.locale, "Costo de hojas", "Leaf cost"),
            "total_tree_sum_built": _title(
                ctx.locale, "Suma total del árbol", "Total tree sum"
            ),
            "total_tree_sum_simplified": _title(
                ctx.locale, "Simplificación de suma", "Sum simplification"
            ),
            "dominant_term_identified": _title(
                ctx.locale, "Término dominante", "Dominant term"
            ),
            "asymptotic_conclusion": _title(
                ctx.locale, "Conclusión asintótica", "Asymptotic conclusion"
            ),
        }

        for index, step_def in enumerate(_STEP_DEFS[2:], start=3):
            steps.append(
                make_recursive_step(
                    template_strings=_TEMPLATE_STRINGS,
                    locale=ctx.locale,
                    index=index,
                    step_id=step_def["id"],
                    kind=step_def["kind"],
                    title=blocked_titles[step_def["kind"]],
                    status="unsupported",
                    confidence="low",
                    summary_key="tree.step_blocked.unsupported",
                    concept_key="concept.tree.blocked",
                    warning_key=warning_key,
                    payload={"supportReason": support_code},
                    codes=[support_code],
                    blocked_by=["rt_s2"],
                )
            )

        return {
            "method": "recursion_tree",
            "version": "rt_steps_v1",
            "overallStatus": compute_overall_status(steps),
            "steps": steps,
        }

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=2,
            step_id="rt_s2",
            kind="recursion_tree_applicability_check",
            title=_title(
                ctx.locale, "Aplicabilidad del método", "Method applicability"
            ),
            status="complete",
            confidence="high",
            summary_key="tree.applicability.supported",
            concept_key="concept.tree.recursion_tree_applicability_check",
            primary_latex=ctx.recurrence_form,
            payload={"supportReason": "supported_divide_conquer_v1"},
        )
    )

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=3,
            step_id="rt_s3",
            kind="tree_parameters_extracted",
            title=_title(ctx.locale, "Parámetros del árbol", "Tree parameters"),
            status="complete",
            confidence="high",
            summary_key="tree.parameters.extracted",
            concept_key="concept.tree.tree_parameters_extracted",
            primary_latex=f"a={ctx.a},\\;b={ctx.b},\\;f(n)={ctx.f_n},\\;n_0={ctx.n0}",
            payload={
                "a": ctx.a,
                "b": ctx.b,
                "f_n": ctx.f_n,
                "n0": ctx.n0,
            },
        )
    )

    step4_status: StepStatus = "partial" if ctx.tree_inconsistent else "complete"
    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=4,
            step_id="rt_s4",
            kind="level_model_built",
            title=_title(ctx.locale, "Modelo del nivel i", "Level-i model"),
            status=step4_status,
            confidence="medium" if step4_status == "partial" else "high",
            summary_key="tree.level_model.built",
            concept_key="concept.tree.level_model_built",
            warning_key=(
                "warning.tree.tree_inconsistent" if step4_status == "partial" else None
            ),
            primary_latex=ctx.level_model_latex,
            payload={"derivedExpression": ctx.level_model_latex},
            codes=["RT_TREE_INCONSISTENT"] if step4_status == "partial" else [],
        )
    )

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=5,
            step_id="rt_s5",
            kind="level_cost_computed",
            title=_title(ctx.locale, "Costo por nivel", "Level cost"),
            status="complete",
            confidence="high",
            summary_key="tree.level_cost.computed",
            concept_key="concept.tree.level_cost_computed",
            primary_latex=ctx.level_cost_latex,
            payload={"levelCost": ctx.level_cost_latex},
        )
    )

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=6,
            step_id="rt_s6",
            kind="tree_height_determined",
            title=_title(ctx.locale, "Altura del árbol", "Tree height"),
            status="complete",
            confidence="high",
            summary_key="tree.height.determined",
            concept_key="concept.tree.tree_height_determined",
            primary_latex=ctx.height_latex,
            payload={"height": ctx.height_latex},
        )
    )

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=7,
            step_id="rt_s7",
            kind="leaf_cost_computed",
            title=_title(ctx.locale, "Costo de hojas", "Leaf cost"),
            status="complete",
            confidence="high",
            summary_key="tree.leaf_cost.computed",
            concept_key="concept.tree.leaf_cost_computed",
            primary_latex=ctx.leaf_cost_latex,
            items=(
                [
                    {
                        "id": "rt_s7_leaf_count",
                        "kind": "result",
                        "latex": ctx.leaf_count_latex,
                    }
                ]
                if ctx.leaf_count_latex
                else []
            ),
            payload={
                "leafCount": ctx.leaf_count_latex,
                "leafCost": ctx.leaf_cost_latex,
            },
        )
    )

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=8,
            step_id="rt_s8",
            kind="total_tree_sum_built",
            title=_title(ctx.locale, "Suma total del árbol", "Total tree sum"),
            status="complete",
            confidence="high",
            summary_key="tree.total_sum.built",
            concept_key="concept.tree.total_tree_sum_built",
            primary_latex=ctx.total_expression_latex,
            payload={"totalExpression": ctx.total_expression_latex},
        )
    )

    step9_status: StepStatus = "partial" if ctx.summation_partial else "complete"
    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=9,
            step_id="rt_s9",
            kind="total_tree_sum_simplified",
            title=_title(ctx.locale, "Simplificación de suma", "Sum simplification"),
            status=step9_status,
            confidence="medium" if step9_status == "partial" else "high",
            summary_key=(
                "tree.total_sum.simplified.partial"
                if step9_status == "partial"
                else "tree.total_sum.simplified.complete"
            ),
            concept_key="concept.tree.total_tree_sum_simplified",
            warning_key=(
                "warning.tree.sum_partial" if step9_status == "partial" else None
            ),
            primary_latex=ctx.simplified_expression_latex,
            payload={"simplifiedExpression": ctx.simplified_expression_latex},
            codes=["RT_SUMMATION_PARTIAL"] if step9_status == "partial" else [],
        )
    )

    step10_status: StepStatus = "partial" if ctx.tree_inconsistent else "complete"
    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=10,
            step_id="rt_s10",
            kind="dominant_term_identified",
            title=_title(ctx.locale, "Término dominante", "Dominant term"),
            status=step10_status,
            confidence="medium" if step10_status == "partial" else "high",
            summary_key=(
                "tree.dominant_term.identified.partial"
                if step10_status == "partial"
                else "tree.dominant_term.identified.complete"
            ),
            concept_key="concept.tree.dominant_term_identified",
            warning_key=(
                "warning.tree.tree_inconsistent" if step10_status == "partial" else None
            ),
            primary_latex=ctx.dominant_reason_latex,
            payload={
                "dominantLevel": ctx.dominant_level,
                "derivedExpression": ctx.dominant_reason_latex,
            },
            codes=["RT_TREE_INCONSISTENT"] if step10_status == "partial" else [],
        )
    )

    step11_status: StepStatus = "partial" if ctx.asymptotic_partial else "complete"
    step11_summary = (
        "tree.asymptotic_conclusion.partial"
        if step11_status == "partial"
        else "tree.asymptotic_conclusion.complete"
    )
    step11_warning = (
        "warning.tree.asymptotic_partial" if step11_status == "partial" else None
    )

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=11,
            step_id="rt_s11",
            kind="asymptotic_conclusion",
            title=_title(ctx.locale, "Conclusión asintótica", "Asymptotic conclusion"),
            status=step11_status,
            confidence="medium" if step11_status == "partial" else "high",
            summary_key=step11_summary,
            concept_key="concept.tree.asymptotic_conclusion",
            warning_key=step11_warning,
            primary_latex=ctx.theta_latex,
            payload={"asymptoticResult": ctx.theta_latex},
            codes=["RT_ASYMPTOTIC_HEURISTIC"] if step11_status == "partial" else [],
        )
    )

    return {
        "method": "recursion_tree",
        "version": "rt_steps_v1",
        "overallStatus": compute_overall_status(steps),
        "steps": steps,
    }
