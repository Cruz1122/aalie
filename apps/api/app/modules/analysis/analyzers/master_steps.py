from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from .recursive_steps_core import (
    compute_overall_status,
    locale_key,
    make_recursive_step,
)

_TEMPLATE_STRINGS: Dict[str, Dict[str, str]] = {
    "es": {
        "master.recurrence_detected.standard": "Se detectó una recurrencia de la familia Divide y Vencerás, candidata natural para Teorema Maestro.",
        "master.master_form_validated.supported": "La forma $T(n)=aT(n/b)+f(n)$ es válida con $a\\ge 1$ y $b>1$.",
        "master.master_form_validated.unsupported": "La recurrencia no cumple la forma estándar requerida por el Teorema Maestro en esta cobertura.",
        "master.master_parameters_extracted.standard": "Se extrajeron los parámetros estructurales $(a,b,f(n))$ para construir la comparación de crecimiento.",
        "master.critical_exponent_computed.standard": "Se calculó el exponente crítico $p=\\log_b(a)$, que define la frontera de crecimiento recursivo.",
        "master.reference_growth_built.standard": "Se construyó la función de referencia $n^p$ para comparar $f(n)$ contra la contribución del árbol recursivo.",
        "master.growth_comparison_performed.less": "$f(n)$ crece más lento que $n^p$ por margen polinómico, por lo que apunta al Caso 1.",
        "master.growth_comparison_performed.equal": "$f(n)$ y $n^p$ tienen el mismo orden asintótico, por lo que apunta al Caso 2.",
        "master.growth_comparison_performed.greater": "$f(n)$ crece más rápido que $n^p$ por margen polinómico, por lo que apunta al Caso 3.",
        "master.growth_comparison_performed.partial": "La comparación entre $f(n)$ y $n^p$ quedó parcial con la cobertura simbólica actual.",
        "master.growth_comparison_performed.intermediate": "Se detectó una zona intermedia entre casos estándar; el Teorema Maestro clásico no aplica de forma directa.",
        "master.master_case_evaluated.case1": "La recurrencia se clasifica como Caso 1.",
        "master.master_case_evaluated.case2": "La recurrencia se clasifica como Caso 2.",
        "master.master_case_evaluated.case3": "La recurrencia se clasifica como Caso 3 (sujeto a regularidad).",
        "master.master_case_evaluated.unsupported": "No se pudo asignar un caso válido del Teorema Maestro con la evidencia disponible.",
        "master.regularity_checked.holds": "La condición de regularidad del Caso 3 se verificó y permite concluir el caso.",
        "master.regularity_checked.fails": "La condición de regularidad del Caso 3 no se cumple; no se puede aplicar el teorema en este punto.",
        "master.regularity_checked.not_required": "La regularidad no aplica porque el caso candidato no es el Caso 3.",
        "master.regularity_checked.partial": "No se pudo certificar completamente la regularidad con las reglas simbólicas disponibles.",
        "master.master_applicability_decided.applicable": "Se confirma aplicabilidad del Teorema Maestro para esta recurrencia.",
        "master.master_applicability_decided.unsupported": "Se concluye que el Teorema Maestro no aplica en esta recurrencia bajo cobertura actual.",
        "master.master_applicability_decided.partial": "La aplicabilidad quedó parcial por información matemática incompleta.",
        "master.asymptotic_conclusion.complete": "Se obtuvo la conclusión asintótica final de forma completa usando el caso validado.",
        "master.asymptotic_conclusion.partial": "La conclusión asintótica se reporta como parcial por limitaciones previas.",
        "master.asymptotic_conclusion.unsupported": "No hay conclusión asintótica cerrada con Teorema Maestro para este caso.",
        "concept.master.recurrence_detected": "Primero confirmamos la familia de recurrencia: aquí estamos en Divide y Vencerás. Este método solo aplica cuando el problema se reduce por escala $n/b$ y aparece un costo adicional $f(n)$.",
        "concept.master.master_form_validated": "Esta validación evita confundir familias: Teorema Maestro es para Divide y Vencerás, no para Resta y Vencerás ni para Resta y Serás Vencido. Si la forma no coincide, se detiene explícitamente.",
        "concept.master.master_parameters_extracted": "Los parámetros $a$, $b$ y $f(n)$ capturan la dinámica del árbol recursivo: cuántos subproblemas hay, cómo se reduce su tamaño y cuánto trabajo externo aporta cada nivel.",
        "concept.master.critical_exponent_computed": "El exponente crítico $p=\\log_b(a)$ resume el costo acumulado de la parte recursiva pura. Es la referencia central para decidir cuál término domina.",
        "concept.master.reference_growth_built": "La función $n^p$ actúa como frontera: comparar $f(n)$ contra esa referencia determina si domina la parte recursiva, si están equilibradas o si domina el trabajo externo.",
        "concept.master.growth_comparison_performed": "La clasificación se basa en relación asintótica estructural entre $f(n)$ y $n^p$: menor, igual o mayor por margen polinómico. Si cae en zona intermedia, el teorema clásico no cierra.",
        "concept.master.master_case_evaluated": "Este paso traduce la comparación de crecimiento en un caso candidato (1, 2 o 3). Esa elección determina la forma de $\\Theta(\\cdot)$, pero Caso 3 aún requiere regularidad.",
        "concept.master.regularity_checked": "En Caso 3 se exige que el trabajo externo siga dominando al bajar de escala: $a f(n/b) \\le c f(n)$ con $c<1$. Sin esa condición, la conclusión estándar no es válida.",
        "concept.master.master_applicability_decided": "Aquí se consolida si el método realmente aplica con soporte matemático suficiente. Cuando no aplica, el sistema lo declara en vez de forzar una respuesta.",
        "concept.master.asymptotic_conclusion": "La conclusión final resume el crecimiento asintótico de $T(n)$ usando solo pasos validados. Si hubo cobertura parcial, la salida conserva esa trazabilidad.",
        "warning.master.unsupported_form": "Cobertura actual: solo recurrencias estándar de la forma $T(n)=aT(n/b)+f(n)$.",
        "warning.master.invalid_parameters": "Parámetros inválidos para Teorema Maestro: se requiere $a\\ge 1$ y $b>1$.",
        "warning.master.intermediate_gap": "Se detectó forma intermedia (por ejemplo factores logarítmicos sobre $n^p$) fuera del Teorema Maestro clásico implementado.",
        "warning.master.regularity_failed": "La condición de regularidad del Caso 3 no se satisface.",
        "warning.master.regularity_unproven": "No se pudo demostrar regularidad con la cobertura simbólica actual.",
        "warning.master.comparison_partial": "La comparación de crecimiento no quedó completamente demostrada.",
    },
    "en": {
        "master.recurrence_detected.standard": "A Divide y Vencerás recurrence was detected, which is the natural candidate for Master Theorem.",
        "master.master_form_validated.supported": "The form $T(n)=aT(n/b)+f(n)$ is valid with $a\\ge 1$ and $b>1$.",
        "master.master_form_validated.unsupported": "The recurrence does not match the standard form required by Master Theorem under current coverage.",
        "master.master_parameters_extracted.standard": "Structural parameters $(a,b,f(n))$ were extracted to build growth comparison.",
        "master.critical_exponent_computed.standard": "The critical exponent $p=\\log_b(a)$ was computed as the recursive-growth boundary.",
        "master.reference_growth_built.standard": "Reference growth $n^p$ was built to compare $f(n)$ against recursive-tree contribution.",
        "master.growth_comparison_performed.less": "$f(n)$ grows polynomially slower than $n^p$, pointing to Case 1.",
        "master.growth_comparison_performed.equal": "$f(n)$ and $n^p$ have the same asymptotic order, pointing to Case 2.",
        "master.growth_comparison_performed.greater": "$f(n)$ grows polynomially faster than $n^p$, pointing to Case 3.",
        "master.growth_comparison_performed.partial": "Comparison between $f(n)$ and $n^p$ is partial under current symbolic coverage.",
        "master.growth_comparison_performed.intermediate": "An intermediate zone between standard cases was detected; classic Master Theorem does not apply directly.",
        "master.master_case_evaluated.case1": "The recurrence is classified as Case 1.",
        "master.master_case_evaluated.case2": "The recurrence is classified as Case 2.",
        "master.master_case_evaluated.case3": "The recurrence is classified as Case 3 (subject to regularity).",
        "master.master_case_evaluated.unsupported": "No valid Master Theorem case could be assigned with current evidence.",
        "master.regularity_checked.holds": "Case-3 regularity condition was verified and allows the case conclusion.",
        "master.regularity_checked.fails": "Case-3 regularity condition fails; theorem cannot be applied at this point.",
        "master.regularity_checked.not_required": "Regularity is not required because the candidate is not Case 3.",
        "master.regularity_checked.partial": "Regularity could not be fully certified with current symbolic rules.",
        "master.master_applicability_decided.applicable": "Master Theorem applicability is confirmed for this recurrence.",
        "master.master_applicability_decided.unsupported": "Master Theorem is not applicable for this recurrence under current coverage.",
        "master.master_applicability_decided.partial": "Applicability is partial due to incomplete mathematical evidence.",
        "master.asymptotic_conclusion.complete": "Final asymptotic conclusion was obtained completely using the validated case.",
        "master.asymptotic_conclusion.partial": "Asymptotic conclusion is reported as partial due to earlier limitations.",
        "master.asymptotic_conclusion.unsupported": "No closed asymptotic conclusion is available with Master Theorem for this case.",
        "concept.master.recurrence_detected": "We first confirm the recurrence family: this is Divide y Vencerás. The method applies when problem size shrinks by scale $n/b$ and additive work $f(n)$ is present.",
        "concept.master.master_form_validated": "This prevents family mismatch: Master Theorem is for Divide y Vencerás, not for Resta y Vencerás or Resta y Serás Vencido. If the shape does not match, we stop explicitly.",
        "concept.master.master_parameters_extracted": "Parameters $a$, $b$, and $f(n)$ capture recursive-tree dynamics: number of subproblems, shrink factor, and non-recursive work per level.",
        "concept.master.critical_exponent_computed": "The critical exponent $p=\\log_b(a)$ summarizes pure recursive accumulation. It is the key baseline for dominance decisions.",
        "concept.master.reference_growth_built": "Reference $n^p$ is the boundary function: comparing $f(n)$ to it tells whether recursion dominates, balances, or is dominated by external work.",
        "concept.master.growth_comparison_performed": "Classification relies on structured asymptotic relation between $f(n)$ and $n^p$: less, equal, or greater by a polynomial margin. Intermediate zones are not closed by the classic theorem.",
        "concept.master.master_case_evaluated": "This step maps growth comparison to a candidate case (1, 2, or 3). Case 3 still requires regularity verification.",
        "concept.master.regularity_checked": "In Case 3, external work must remain dominant under scaling: $a f(n/b) \\le c f(n)$ with $c<1$. Without this, standard conclusion is invalid.",
        "concept.master.master_applicability_decided": "This consolidates whether the method truly applies with enough mathematical support. If not, the system states it explicitly.",
        "concept.master.asymptotic_conclusion": "The final result summarizes asymptotic growth of $T(n)$ using only validated steps. Partial coverage remains visible in the final status.",
        "warning.master.unsupported_form": "Current coverage supports only standard recurrences of the form $T(n)=aT(n/b)+f(n)$.",
        "warning.master.invalid_parameters": "Invalid Master Theorem parameters: required $a\\ge 1$ and $b>1$.",
        "warning.master.intermediate_gap": "Intermediate form detected (for example logarithmic factors on top of $n^p$) outside current classic-theorem implementation.",
        "warning.master.regularity_failed": "Case-3 regularity condition is not satisfied.",
        "warning.master.regularity_unproven": "Regularity could not be proven with current symbolic coverage.",
        "warning.master.comparison_partial": "Growth comparison is not fully proven.",
    },
}


@dataclass
class MasterStepContext:
    locale: str
    recurrence_form: str
    a: int
    b: float | int
    f_n: str
    p_latex: str
    reference_growth_latex: str
    relation_type: str  # less/equal/greater/undetermined/intermediate
    case_candidate: Optional[int]
    regularity_holds: Optional[bool]
    regularity_note: str
    theta: Optional[str]
    support_code: Optional[str] = None
    comparison_partial: bool = False


def _title(locale: str, es: str, en: str) -> str:
    return es if locale_key(locale) == "es" else en


def _blocked_step(
    *,
    ctx: MasterStepContext,
    index: int,
    step_id: str,
    kind: str,
    title_es: str,
    title_en: str,
    support_code: str,
) -> Dict[str, Any]:
    warning_key = (
        "warning.master.invalid_parameters"
        if support_code == "MASTER_INVALID_PARAMETERS"
        else "warning.master.unsupported_form"
    )
    return make_recursive_step(
        template_strings=_TEMPLATE_STRINGS,
        locale=ctx.locale,
        index=index,
        step_id=step_id,
        kind=kind,
        title=_title(ctx.locale, title_es, title_en),
        status="unsupported",
        confidence="low",
        summary_key="master.master_form_validated.unsupported",
        concept_key=f"concept.master.{kind}",
        warning_key=warning_key,
        payload={"supportReason": support_code},
        codes=[support_code],
        blocked_by=["master_s2"],
    )


def build_master_step_bundle(ctx: MasterStepContext) -> Dict[str, Any]:
    steps: List[Dict[str, Any]] = []
    is_form_supported = ctx.support_code is None

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=1,
            step_id="master_s1",
            kind="recurrence_detected",
            title=_title(ctx.locale, "Recurrencia detectada", "Detected recurrence"),
            status="complete",
            confidence="high",
            summary_key="master.recurrence_detected.standard",
            concept_key="concept.master.recurrence_detected",
            primary_latex=ctx.recurrence_form,
            payload={"sourceExpression": ctx.recurrence_form},
        )
    )

    step2_status = "complete" if is_form_supported else "unsupported"
    step2_warning_key: Optional[str] = None
    step2_codes: List[str] = []
    if ctx.support_code == "MASTER_INVALID_PARAMETERS":
        step2_warning_key = "warning.master.invalid_parameters"
        step2_codes = ["MASTER_INVALID_PARAMETERS"]
    elif ctx.support_code == "MASTER_UNSUPPORTED_FORM":
        step2_warning_key = "warning.master.unsupported_form"
        step2_codes = ["MASTER_UNSUPPORTED_FORM"]

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=2,
            step_id="master_s2",
            kind="master_form_validated",
            title=_title(ctx.locale, "Validación de forma maestra", "Master-form validation"),
            status=step2_status,
            confidence="high" if is_form_supported else "low",
            summary_key=(
                "master.master_form_validated.supported"
                if is_form_supported
                else "master.master_form_validated.unsupported"
            ),
            concept_key="concept.master.master_form_validated",
            warning_key=step2_warning_key,
            primary_latex=ctx.recurrence_form,
            payload={"a": ctx.a, "b": ctx.b, "f_n": ctx.f_n},
            codes=step2_codes,
        )
    )

    if not is_form_supported:
        steps.extend(
            [
                _blocked_step(
                    ctx=ctx,
                    index=3,
                    step_id="master_s3",
                    kind="master_parameters_extracted",
                    title_es="Parámetros extraídos",
                    title_en="Extracted parameters",
                    support_code=ctx.support_code or "MASTER_UNSUPPORTED_FORM",
                ),
                _blocked_step(
                    ctx=ctx,
                    index=4,
                    step_id="master_s4",
                    kind="critical_exponent_computed",
                    title_es="Exponente crítico",
                    title_en="Critical exponent",
                    support_code=ctx.support_code or "MASTER_UNSUPPORTED_FORM",
                ),
                _blocked_step(
                    ctx=ctx,
                    index=5,
                    step_id="master_s5",
                    kind="reference_growth_built",
                    title_es="Crecimiento de referencia",
                    title_en="Reference growth",
                    support_code=ctx.support_code or "MASTER_UNSUPPORTED_FORM",
                ),
                _blocked_step(
                    ctx=ctx,
                    index=6,
                    step_id="master_s6",
                    kind="growth_comparison_performed",
                    title_es="Comparación de crecimiento",
                    title_en="Growth comparison",
                    support_code=ctx.support_code or "MASTER_UNSUPPORTED_FORM",
                ),
                _blocked_step(
                    ctx=ctx,
                    index=7,
                    step_id="master_s7",
                    kind="master_case_evaluated",
                    title_es="Evaluación de caso",
                    title_en="Case evaluation",
                    support_code=ctx.support_code or "MASTER_UNSUPPORTED_FORM",
                ),
                _blocked_step(
                    ctx=ctx,
                    index=8,
                    step_id="master_s8",
                    kind="regularity_checked",
                    title_es="Chequeo de regularidad",
                    title_en="Regularity check",
                    support_code=ctx.support_code or "MASTER_UNSUPPORTED_FORM",
                ),
                _blocked_step(
                    ctx=ctx,
                    index=9,
                    step_id="master_s9",
                    kind="master_applicability_decided",
                    title_es="Decisión de aplicabilidad",
                    title_en="Applicability decision",
                    support_code=ctx.support_code or "MASTER_UNSUPPORTED_FORM",
                ),
                _blocked_step(
                    ctx=ctx,
                    index=10,
                    step_id="master_s10",
                    kind="asymptotic_conclusion",
                    title_es="Conclusión asintótica",
                    title_en="Asymptotic conclusion",
                    support_code=ctx.support_code or "MASTER_UNSUPPORTED_FORM",
                ),
            ]
        )
        return {
            "method": "master",
            "version": "master_steps_v1",
            "overallStatus": compute_overall_status(steps),
            "steps": steps,
        }

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=3,
            step_id="master_s3",
            kind="master_parameters_extracted",
            title=_title(ctx.locale, "Parámetros extraídos", "Extracted parameters"),
            status="complete",
            confidence="high",
            summary_key="master.master_parameters_extracted.standard",
            concept_key="concept.master.master_parameters_extracted",
            primary_latex=f"a={ctx.a},\\;b={ctx.b},\\;f(n)={ctx.f_n}",
            payload={"a": ctx.a, "b": ctx.b, "f_n": ctx.f_n},
        )
    )

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=4,
            step_id="master_s4",
            kind="critical_exponent_computed",
            title=_title(ctx.locale, "Exponente crítico", "Critical exponent"),
            status="complete",
            confidence="high",
            summary_key="master.critical_exponent_computed.standard",
            concept_key="concept.master.critical_exponent_computed",
            primary_latex=f"p=\\log_{{{ctx.b}}}({ctx.a})={ctx.p_latex}",
            payload={"a": ctx.a, "b": ctx.b, "p": ctx.p_latex},
            derivation={
                "sourceExpression": f"p=\\log_{{{ctx.b}}}({ctx.a})",
                "symbolicResult": ctx.p_latex,
            },
        )
    )

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=5,
            step_id="master_s5",
            kind="reference_growth_built",
            title=_title(ctx.locale, "Crecimiento de referencia", "Reference growth"),
            status="complete",
            confidence="high",
            summary_key="master.reference_growth_built.standard",
            concept_key="concept.master.reference_growth_built",
            primary_latex=f"n^p={ctx.reference_growth_latex}",
            payload={"referenceGrowth": ctx.reference_growth_latex},
        )
    )

    step6_status = "partial" if ctx.comparison_partial else "complete"
    step6_warning_key: Optional[str] = None
    step6_codes: List[str] = []

    if ctx.relation_type == "less":
        step6_summary = "master.growth_comparison_performed.less"
    elif ctx.relation_type == "equal":
        step6_summary = "master.growth_comparison_performed.equal"
    elif ctx.relation_type == "greater":
        step6_summary = "master.growth_comparison_performed.greater"
    elif ctx.relation_type == "intermediate":
        step6_summary = "master.growth_comparison_performed.intermediate"
        step6_status = "unsupported"
        step6_warning_key = "warning.master.intermediate_gap"
        step6_codes = ["MASTER_INTERMEDIATE_GAP"]
    else:
        step6_summary = "master.growth_comparison_performed.partial"
        step6_status = "partial"
        step6_warning_key = "warning.master.comparison_partial"
        step6_codes = ["MASTER_COMPARISON_PARTIAL"]

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=6,
            step_id="master_s6",
            kind="growth_comparison_performed",
            title=_title(ctx.locale, "Comparación de crecimiento", "Growth comparison"),
            status=step6_status,
            confidence="medium" if step6_status != "complete" else "high",
            summary_key=step6_summary,
            concept_key="concept.master.growth_comparison_performed",
            warning_key=step6_warning_key,
            primary_latex=f"f(n)={ctx.f_n},\\;n^p={ctx.reference_growth_latex}",
            payload={
                "f_n": ctx.f_n,
                "referenceGrowth": ctx.reference_growth_latex,
                "relationType": ctx.relation_type,
            },
            codes=step6_codes,
        )
    )

    if ctx.case_candidate == 1:
        step7_summary = "master.master_case_evaluated.case1"
        step7_status = "complete"
    elif ctx.case_candidate == 2:
        step7_summary = "master.master_case_evaluated.case2"
        step7_status = "complete"
    elif ctx.case_candidate == 3:
        step7_summary = "master.master_case_evaluated.case3"
        step7_status = "complete"
    else:
        step7_summary = "master.master_case_evaluated.unsupported"
        step7_status = "unsupported" if step6_status == "unsupported" else "partial"

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=7,
            step_id="master_s7",
            kind="master_case_evaluated",
            title=_title(ctx.locale, "Evaluación de caso", "Case evaluation"),
            status=step7_status,
            confidence="high" if step7_status == "complete" else "medium",
            summary_key=step7_summary,
            concept_key="concept.master.master_case_evaluated",
            primary_latex=(f"\\text{{Caso {ctx.case_candidate}}}" if ctx.case_candidate else None),
            payload={"caseCandidate": ctx.case_candidate},
            blocked_by=["master_s6"] if step7_status != "complete" else [],
        )
    )

    step8_warning: Optional[str] = None
    step8_codes: List[str] = []
    if ctx.case_candidate != 3:
        step8_status = "complete"
        step8_summary = "master.regularity_checked.not_required"
    else:
        if ctx.regularity_holds is True:
            step8_status = "complete"
            step8_summary = "master.regularity_checked.holds"
        elif ctx.regularity_holds is False:
            step8_status = "unsupported"
            step8_summary = "master.regularity_checked.fails"
            step8_warning = "warning.master.regularity_failed"
            step8_codes = ["MASTER_REGULARITY_FAILED"]
        else:
            step8_status = "partial"
            step8_summary = "master.regularity_checked.partial"
            step8_warning = "warning.master.regularity_unproven"
            step8_codes = ["MASTER_REGULARITY_UNPROVEN"]

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=8,
            step_id="master_s8",
            kind="regularity_checked",
            title=_title(ctx.locale, "Chequeo de regularidad", "Regularity check"),
            status=step8_status,
            confidence="high" if step8_status == "complete" else "medium",
            summary_key=step8_summary,
            concept_key="concept.master.regularity_checked",
            warning_key=step8_warning,
            primary_latex=ctx.regularity_note or None,
            payload={"regularityHolds": ctx.regularity_holds},
            codes=step8_codes,
            blocked_by=["master_s7"] if step7_status != "complete" else [],
        )
    )

    if step7_status == "complete" and step8_status in {"complete"}:
        step9_status = "complete"
        step9_summary = "master.master_applicability_decided.applicable"
    elif step8_status == "unsupported" or step7_status == "unsupported":
        step9_status = "unsupported"
        step9_summary = "master.master_applicability_decided.unsupported"
    else:
        step9_status = "partial"
        step9_summary = "master.master_applicability_decided.partial"

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=9,
            step_id="master_s9",
            kind="master_applicability_decided",
            title=_title(ctx.locale, "Decisión de aplicabilidad", "Applicability decision"),
            status=step9_status,
            confidence="high" if step9_status == "complete" else "medium",
            summary_key=step9_summary,
            concept_key="concept.master.master_applicability_decided",
            payload={"applicabilityReason": step9_status},
            blocked_by=["master_s7", "master_s8"] if step9_status != "complete" else [],
        )
    )

    if step9_status == "complete" and ctx.theta:
        step10_status = "complete"
        step10_summary = "master.asymptotic_conclusion.complete"
    elif step9_status == "partial" and ctx.theta:
        step10_status = "partial"
        step10_summary = "master.asymptotic_conclusion.partial"
    else:
        step10_status = "unsupported"
        step10_summary = "master.asymptotic_conclusion.unsupported"

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=ctx.locale,
            index=10,
            step_id="master_s10",
            kind="asymptotic_conclusion",
            title=_title(ctx.locale, "Conclusión asintótica", "Asymptotic conclusion"),
            status=step10_status,
            confidence="high" if step10_status == "complete" else "medium",
            summary_key=step10_summary,
            concept_key="concept.master.asymptotic_conclusion",
            primary_latex=(f"T(n) = {ctx.theta}" if ctx.theta else None),
            payload={"asymptoticResult": ctx.theta},
            derivation={"asymptoticResult": ctx.theta} if ctx.theta else None,
            blocked_by=["master_s9"] if step10_status != "complete" else [],
        )
    )

    return {
        "method": "master",
        "version": "master_steps_v1",
        "overallStatus": compute_overall_status(steps),
        "steps": steps,
    }
