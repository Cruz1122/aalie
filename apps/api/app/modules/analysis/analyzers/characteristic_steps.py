from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Optional

from .recursive_steps_core import (
    StepConfidence,
    StepStatus,
    compute_overall_status,
    locale_key,
    make_recursive_step,
)


_TEMPLATE_STRINGS: Dict[str, Dict[str, str]] = {
    "es": {
        # Summary keys
        "recurrence_detected.linear_shift": "Se identificó una recurrencia lineal por desplazamientos de orden {order}: eso significa que $T(n)$ depende de hasta $T(n-{order})$.",
        "applicability_validated.supported": "La forma detectada sí entra en el dominio del método: lineal, con coeficientes constantes y desplazamientos constantes ($n-1$, $n-2$, ...).",
        "applicability_validated.unsupported": "La forma detectada queda fuera del dominio del método de ecuación característica con la cobertura actual.",
        "homogeneity_classification.homogeneous": "La recurrencia es homogénea porque $g(n)=0$; no hay término externo adicional.",
        "homogeneity_classification.non_homogeneous": "La recurrencia es no homogénea porque $g(n)={g_n}$; aquí $g(n)$ es el costo no recursivo que no multiplica ninguna llamada $T(n-k)$.",
        "homogeneous_part_extracted.standard": "Se aisló la parte homogénea $T_h$ separando $g(n)$ para construir la ecuación característica sin mezclar aportes externos.",
        "characteristic_polynomial_built.standard": "Se construyó la ecuación característica y se igualó a cero tras llevar todos los términos al lado izquierdo; así buscamos valores de $x$ que anulan la dinámica homogénea.",
        "roots_computed.real_distinct": "Se calcularon raíces reales distintas; para cada raíz se reporta $m=1$, porque aparece una sola vez en el polinomio característico.",
        "roots_computed.repeated_root": "Se detectaron raíces repetidas; $m$ indica la multiplicidad, es decir, cuántas veces se repite una raíz como factor del polinomio característico.",
        "roots_computed.partial": "Las raíces se calcularon de forma parcial; la representación exacta no está completamente soportada en este caso.",
        "homogeneous_solution_built.standard": "Se construyó la solución homogénea general a partir de raíces y multiplicidades usando la regla estándar del método.",
        "particular_solution_built.not_applicable": "No se construye solución particular porque $g(n)=0$; toda la dinámica queda cubierta por la parte homogénea.",
        "particular_solution_built.constant_supported": "Se obtuvo una solución particular para $g(n)$ constante; esta parte modela solo el efecto acumulado del término no recursivo.",
        "particular_solution_built.unsupported_gn": "La familia actual de $g(n)$ no está soportada para construir una solución particular cerrada.",
        "general_solution_built.homogeneous_only": "La solución general coincide con la homogénea porque no existe componente particular en este caso.",
        "general_solution_built.with_particular": "La solución general se construyó como $T(n)=T_h(n)+T_p(n)$, combinando contribución recursiva y no recursiva.",
        "general_solution_built.partial": "La solución general quedó parcial porque la parte particular no se pudo construir con la cobertura actual.",
        "base_conditions_applied.solved": "Se aplicaron condiciones iniciales para fijar las constantes libres y obtener una forma cerrada concreta.",
        "base_conditions_applied.partial": "Las condiciones iniciales detectadas no alcanzan para fijar todas las constantes de la solución general.",
        "closed_form_simplified.complete": "Se eligió la forma cerrada algebraicamente más simple entre expresiones equivalentes.",
        "closed_form_simplified.partial": "La simplificación final fue parcial; se conserva la forma más simple disponible sin ocultar limitaciones.",
        "dominant_term_concluded.exponential": "Se identificó el término dominante y se concluyó el crecimiento de $T(n)$ a partir de la raíz de mayor magnitud.",
        "dominant_term_concluded.partial": "La conclusión asintótica se reporta con cobertura parcial por limitaciones acumuladas en pasos anteriores.",

        # Concept keys
        "concept.recurrence_detected": "Primero fijamos la forma exacta de la ecuación que vamos a resolver. El orden $k$ indica cuántos estados previos aparecen ($T(n-1),\\dots,T(n-k)$), y los desplazamientos muestran cómo se reduce el tamaño del subproblema. También se separa $g(n)$, que representa trabajo no recursivo, para no mezclarlo con la dinámica de las llamadas.",
        "concept.applicability_validated": "Este método no sirve para cualquier recurrencia. Requiere linealidad, coeficientes constantes y desplazamientos constantes en $n$ (por ejemplo $n-1$, $n-2$). Si la forma no cumple esas condiciones, continuar como si aplicara produciría resultados matemáticamente inválidos, por eso se marca como no soportado.",
        "concept.homogeneity_classified": "Clasificar en homogénea/no homogénea determina qué piezas de solución necesitamos. Si $g(n)=0$, basta con $T_h(n)$. Si $g(n)\\neq 0$, debemos construir además $T_p(n)$ para capturar el aporte externo. Esta separación evita atribuir al sistema recursivo un crecimiento que en realidad viene de $g(n)$.",
        "concept.homogeneous_part_extracted": "La ecuación característica se construye solo con la parte homogénea porque describe la dinámica interna de la recurrencia. En otras palabras, aquí modelamos cómo evoluciona $T(n)$ por dependencia entre estados, dejando $g(n)$ para un paso separado mediante solución particular.",
        "concept.characteristic_polynomial_built": "Partimos de la parte homogénea y probamos una forma $T(n)=x^n$. Al sustituirla, todos los términos quedan como combinaciones de potencias de $x$. Luego se pasa todo al lado izquierdo y se iguala a cero porque buscamos exactamente los valores de $x$ que hacen nulo ese operador lineal homogéneo. Esos valores son las raíces que estructuran la solución.",
        "concept.roots_computed": "En este paso se resuelve el polinomio característico y se obtiene, para cada raíz, su multiplicidad $m$. Ese $m$ no es arbitrario: es el número de veces que la raíz aparece como factor del polinomio (por ejemplo $(x-1)^2$ implica $m=2$). Cuando $m>1$, la base de solución incorpora factores en $n$ para mantener independencia lineal.",
        "concept.homogeneous_solution_built": "Con las raíces y sus multiplicidades se arma una base linealmente independiente para $T_h(n)$. Raíz simple: un término exponencial. Raíz repetida: términos exponenciales multiplicados por potencias de $n$. Esta regla garantiza que la forma propuesta puede satisfacer toda la parte homogénea.",
        "concept.particular_solution_built": "La solución particular $T_p(n)$ representa únicamente el efecto de $g(n)$. No sustituye a la homogénea: se suma a ella. La forma tentativa de $T_p(n)$ depende de la familia de $g(n)$; por eso hay casos que aún se marcan como no soportados en lugar de inventar una forma opaca.",
        "concept.general_solution_built": "La solución completa de la recurrencia no homogénea es $T(n)=T_h(n)+T_p(n)$. Si la recurrencia es homogénea, entonces $T_p(n)=0$ y la solución general coincide con $T_h(n)$. Esta etapa consolida una expresión que ya satisface la ecuación completa, antes de aplicar casos base.",
        "concept.base_conditions_applied": "Las constantes libres ($C_1, C_2, ...$) se determinan imponiendo condiciones iniciales como $T(0)$, $T(1)$, etc. Matemáticamente, esto convierte una familia de soluciones en una solución concreta. Si faltan condiciones, la estructura puede ser correcta, pero queda subdeterminada.",
        "concept.closed_form_simplified": "La simplificación no debe hacer la expresión más difícil de leer. Aquí se comparan formas equivalentes y se conserva la más simple de manera determinista para UI, tests y exportes. Si no es posible simplificar más, se mantiene explícitamente la mejor forma alcanzable.",
        "concept.dominant_term_concluded": "La cota asintótica se obtiene del término que domina cuando $n$ crece. En ecuación característica esto depende de la magnitud de la raíz dominante y, si hay multiplicidad, del factor polinómico asociado. El resultado resume el comportamiento de largo plazo de $T(n)$.",

        # Warning keys
        "warning.unsupported_non_linear_shift": "Cobertura actual: solo recurrencias lineales con desplazamientos constantes de la forma $T(n-k)$.",
        "warning.unsupported_gn_family": "Cobertura parcial: la solución particular solo está soportada para $g(n)=0$ o $g(n)=c$ constante.",
        "warning.insufficient_base_conditions": "No se detectaron suficientes condiciones iniciales para fijar todas las constantes.",
        "warning.complex_root_form_partial": "La forma exacta de algunas raíces no se representó completamente; se usó una forma parcial segura.",
        "warning.simplification_partial": "La simplificación simbólica completa no fue posible con las reglas actuales.",
    },
    "en": {
        "recurrence_detected.linear_shift": "A linear shift-recurrence of order {order} was identified, meaning $T(n)$ depends on prior states up to $T(n-{order})$.",
        "applicability_validated.supported": "The detected shape is within the method domain: linear, constant coefficients, and constant shifts ($n-1$, $n-2$, ...).",
        "applicability_validated.unsupported": "The detected shape falls outside the current characteristic-equation coverage.",
        "homogeneity_classification.homogeneous": "The recurrence is homogeneous because $g(n)=0$; there is no extra non-recursive forcing term.",
        "homogeneity_classification.non_homogeneous": "The recurrence is non-homogeneous because $g(n)={g_n}$; here $g(n)$ is the non-recursive work that does not multiply any $T(n-k)$ term.",
        "homogeneous_part_extracted.standard": "The homogeneous component $T_h$ was isolated by separating $g(n)$ so the characteristic equation is built from recurrence dynamics only.",
        "characteristic_polynomial_built.standard": "The characteristic equation was built and set equal to zero after moving all terms to the left-hand side; this lets us find $x$ values that annihilate the homogeneous dynamics.",
        "roots_computed.real_distinct": "Distinct real roots were computed; each root is reported with $m=1$ because it appears once in the characteristic polynomial.",
        "roots_computed.repeated_root": "Repeated roots were detected; $m$ denotes multiplicity, i.e., how many times a root repeats as a polynomial factor.",
        "roots_computed.partial": "Roots were computed partially; exact representation is not fully supported in this case.",
        "homogeneous_solution_built.standard": "The general homogeneous solution was assembled from roots and multiplicities using the standard rule.",
        "particular_solution_built.not_applicable": "No particular solution is needed because $g(n)=0$; the homogeneous component captures the full behavior.",
        "particular_solution_built.constant_supported": "A particular solution was obtained for constant $g(n)$; this term models only the accumulated non-recursive effect.",
        "particular_solution_built.unsupported_gn": "This $g(n)$ family is not currently supported for closed-form particular-solution construction.",
        "general_solution_built.homogeneous_only": "The general solution equals the homogeneous solution because no particular component is required.",
        "general_solution_built.with_particular": "The full solution was built as $T(n)=T_h(n)+T_p(n)$, combining recursive and non-recursive contributions.",
        "general_solution_built.partial": "The full solution is partial because the particular component is unsupported with current coverage.",
        "base_conditions_applied.solved": "Initial conditions were applied to solve free constants and obtain a concrete closed form.",
        "base_conditions_applied.partial": "Detected initial conditions are insufficient to solve all free constants.",
        "closed_form_simplified.complete": "The algebraically simplest equivalent closed form was selected.",
        "closed_form_simplified.partial": "Final simplification is partial; the simplest available valid form is kept.",
        "dominant_term_concluded.exponential": "The dominant term was identified and $T(n)$ growth was concluded from the largest-magnitude root.",
        "dominant_term_concluded.partial": "Asymptotic conclusion is reported with partial coverage due to earlier limitations.",

        "concept.recurrence_detected": "We first pin down the exact equation we are solving. The order $k$ tells us how many previous states appear ($T(n-1),\\dots,T(n-k)$), and shifts tell us how problem size decreases. We also isolate $g(n)$ as non-recursive work so it is not confused with recurrence dynamics.",
        "concept.applicability_validated": "The characteristic-equation method is not universal. It requires linearity, constant coefficients, and constant shifts in $n$. If those assumptions fail, continuing would be mathematically unsound, so the step is marked unsupported instead of hiding the limitation.",
        "concept.homogeneity_classified": "This classification decides the solution structure. If $g(n)=0$, we only need $T_h(n)$. If $g(n)\\neq 0$, we must add $T_p(n)$ to capture external forcing. Keeping these contributions separate avoids attributing $g(n)$ growth to the recursive part.",
        "concept.homogeneous_part_extracted": "The characteristic equation is built from the homogeneous recurrence only, because it models internal state-to-state dynamics. The forcing term $g(n)$ is intentionally deferred and handled through the particular solution step.",
        "concept.characteristic_polynomial_built": "We start from the homogeneous recurrence and test a trial form $T(n)=x^n$. After substitution, all terms become powers of $x$. We then move everything to the left and set the expression to zero because we are solving for $x$ values that make the homogeneous linear operator vanish. Those roots define the structure of the solution.",
        "concept.roots_computed": "Here we solve the characteristic polynomial and compute multiplicity $m$ for each root. This $m$ is not a tuning parameter: it is the number of times the root appears as a polynomial factor (e.g., $(x-1)^2$ gives $m=2$). When $m>1$, polynomial factors in $n$ are required to keep linearly independent solution terms.",
        "concept.homogeneous_solution_built": "Using roots and multiplicities, we build a linearly independent basis for $T_h(n)$. Simple root: one exponential term. Repeated root: exponential term multiplied by polynomial powers of $n$. This guarantees the form can satisfy the full homogeneous recurrence.",
        "concept.particular_solution_built": "The particular solution $T_p(n)$ models only the effect of $g(n)$. It complements the homogeneous part; it does not replace it. The trial form for $T_p(n)$ depends on the family of $g(n)$, which is why unsupported families are reported explicitly.",
        "concept.general_solution_built": "For non-homogeneous recurrences, the complete solution is $T(n)=T_h(n)+T_p(n)$. For homogeneous recurrences, $T_p(n)=0$, so the full solution equals $T_h(n)$. This step consolidates a formula that already satisfies the full recurrence before base-case fitting.",
        "concept.base_conditions_applied": "Free constants ($C_1, C_2, ...$) are solved by enforcing base conditions such as $T(0)$ and $T(1)$. This turns a solution family into a concrete function. If base data is insufficient, the structure may be right but still underdetermined.",
        "concept.closed_form_simplified": "Simplification should never make the expression harder to read. We compare equivalent forms deterministically and keep the simplest one for UI, tests, and exports. If full simplification is not possible, we keep the best valid form explicitly.",
        "concept.dominant_term_concluded": "Asymptotic growth comes from the term that dominates as $n\\to\\infty$. In this method, that depends on dominant root magnitude and multiplicity-driven polynomial factors. The final bound summarizes long-run behavior of $T(n)$.",

        "warning.unsupported_non_linear_shift": "Current coverage: only linear recurrences with constant shifts of the form $T(n-k)$.",
        "warning.unsupported_gn_family": "Partial coverage: particular solution is currently supported only for $g(n)=0$ or constant $g(n)=c$.",
        "warning.insufficient_base_conditions": "Not enough initial conditions were detected to solve all constants.",
        "warning.complex_root_form_partial": "Some roots could not be represented exactly; a safe partial form was used.",
        "warning.simplification_partial": "Full symbolic simplification was not possible with current rules.",
    },
}

@dataclass
class StepContext:
    locale: str
    recurrence_form: str
    order: int
    is_linear: bool
    g_n: str
    is_homogeneous: bool
    homogeneous_form: str
    equation: str
    roots: List[Dict[str, Any]]
    homogeneous_solution: str
    particular_solution: Optional[str]
    particular_supported: bool
    general_solution: str
    base_cases: Dict[str, Any]
    closed_form: str
    theta: str
    has_complex_root_representation: bool = False
    simplification_partial: bool = False
    solved_constants: Dict[str, Any] | None = None
    required_constants: int = 0


def _make_step(
    *,
    ctx: StepContext,
    index: int,
    step_id: str,
    kind: str,
    title: str,
    status: StepStatus,
    confidence: StepConfidence,
    summary_key: str,
    concept_key: str,
    warning_key: Optional[str] = None,
    params: Optional[Dict[str, Any]] = None,
    primary_latex: Optional[str] = None,
    items: Optional[List[Dict[str, str]]] = None,
    payload: Optional[Dict[str, Any]] = None,
    codes: Optional[List[str]] = None,
    assumptions: Optional[List[str]] = None,
    blocked_by: Optional[List[str]] = None,
) -> Dict[str, Any]:
    return make_recursive_step(
        template_strings=_TEMPLATE_STRINGS,
        locale=ctx.locale,
        index=index,
        step_id=step_id,
        kind=kind,
        title=title,
        status=status,
        confidence=confidence,
        summary_key=summary_key,
        concept_key=concept_key,
        warning_key=warning_key,
        params=params,
        primary_latex=primary_latex,
        items=items,
        payload=payload,
        codes=codes,
        assumptions=assumptions,
        blocked_by=blocked_by,
    )


def build_characteristic_step_bundle(ctx: StepContext) -> Dict[str, Any]:
    steps: List[Dict[str, Any]] = []

    steps.append(
        _make_step(
            ctx=ctx,
            index=1,
            step_id="ceq_s1",
            kind="recurrence_detected",
            title="Recurrencia detectada" if locale_key(ctx.locale) == "es" else "Detected recurrence",
            status="complete",
            confidence="high",
            summary_key="recurrence_detected.linear_shift",
            concept_key="concept.recurrence_detected",
            params={"order": ctx.order},
            primary_latex=ctx.recurrence_form,
            payload={"order": ctx.order, "g_n": ctx.g_n},
        )
    )

    step2_status: StepStatus = "complete" if ctx.is_linear else "unsupported"
    step2_warning = None if ctx.is_linear else "warning.unsupported_non_linear_shift"
    step2_codes = [] if ctx.is_linear else ["CEQ_UNSUPPORTED_NON_LINEAR_SHIFT"]
    steps.append(
        _make_step(
            ctx=ctx,
            index=2,
            step_id="ceq_s2",
            kind="applicability_validated",
            title="Validación de aplicabilidad" if locale_key(ctx.locale) == "es" else "Applicability validation",
            status=step2_status,
            confidence="high" if ctx.is_linear else "low",
            summary_key="applicability_validated.supported" if ctx.is_linear else "applicability_validated.unsupported",
            concept_key="concept.applicability_validated",
            warning_key=step2_warning,
            primary_latex=ctx.recurrence_form,
            payload={"is_linear_shift": ctx.is_linear},
            codes=step2_codes,
        )
    )

    steps.append(
        _make_step(
            ctx=ctx,
            index=3,
            step_id="ceq_s3",
            kind="homogeneity_classified",
            title="Clasificación homogénea" if locale_key(ctx.locale) == "es" else "Homogeneity classification",
            status="complete",
            confidence="high",
            summary_key=(
                "homogeneity_classification.homogeneous"
                if ctx.is_homogeneous
                else "homogeneity_classification.non_homogeneous"
            ),
            concept_key="concept.homogeneity_classified",
            params={"g_n": ctx.g_n},
            primary_latex=f"g(n)={ctx.g_n}",
            payload={"is_homogeneous": ctx.is_homogeneous, "g_n": ctx.g_n},
        )
    )

    steps.append(
        _make_step(
            ctx=ctx,
            index=4,
            step_id="ceq_s4",
            kind="homogeneous_part_extracted",
            title="Extracción de parte homogénea" if locale_key(ctx.locale) == "es" else "Homogeneous part extraction",
            status="complete",
            confidence="high",
            summary_key="homogeneous_part_extracted.standard",
            concept_key="concept.homogeneous_part_extracted",
            primary_latex=ctx.homogeneous_form,
            payload={"homogeneous_form": ctx.homogeneous_form},
        )
    )

    steps.append(
        _make_step(
            ctx=ctx,
            index=5,
            step_id="ceq_s5",
            kind="characteristic_polynomial_built",
            title="Ecuación característica" if locale_key(ctx.locale) == "es" else "Characteristic equation",
            status="complete",
            confidence="high",
            summary_key="characteristic_polynomial_built.standard",
            concept_key="concept.characteristic_polynomial_built",
            primary_latex=ctx.equation,
            payload={"equation": ctx.equation},
        )
    )

    roots_have_repetition = any(int(r.get("multiplicity", 1)) > 1 for r in ctx.roots)
    step6_status: StepStatus = "partial" if ctx.has_complex_root_representation else "complete"
    step6_key = (
        "roots_computed.partial"
        if step6_status == "partial"
        else "roots_computed.repeated_root"
        if roots_have_repetition
        else "roots_computed.real_distinct"
    )
    steps.append(
        _make_step(
            ctx=ctx,
            index=6,
            step_id="ceq_s6",
            kind="roots_computed",
            title="Raíces y multiplicidades" if locale_key(ctx.locale) == "es" else "Roots and multiplicities",
            status=step6_status,
            confidence="medium" if step6_status == "partial" else "high",
            summary_key=step6_key,
            concept_key="concept.roots_computed",
            warning_key="warning.complex_root_form_partial" if step6_status == "partial" else None,
            primary_latex=",\\;".join([
                f"x_{{{idx + 1}}}={root_info.get('root')}\\;(m={root_info.get('multiplicity', 1)})"
                for idx, root_info in enumerate(ctx.roots)
            ]) if ctx.roots else None,
            payload={"roots": ctx.roots},
            codes=["CEQ_COMPLEX_ROOT_FORM_PARTIAL"] if step6_status == "partial" else [],
        )
    )

    steps.append(
        _make_step(
            ctx=ctx,
            index=7,
            step_id="ceq_s7",
            kind="homogeneous_solution_built",
            title="Solución homogénea" if locale_key(ctx.locale) == "es" else "Homogeneous solution",
            status="complete",
            confidence="high",
            summary_key="homogeneous_solution_built.standard",
            concept_key="concept.homogeneous_solution_built",
            primary_latex=ctx.homogeneous_solution,
            payload={"homogeneous_solution": ctx.homogeneous_solution},
        )
    )

    if ctx.is_homogeneous:
        step8_status: StepStatus = "complete"
        step8_key = "particular_solution_built.not_applicable"
        step8_warning = None
        step8_codes: List[str] = []
    elif ctx.particular_supported and ctx.particular_solution:
        step8_status = "complete"
        step8_key = "particular_solution_built.constant_supported"
        step8_warning = None
        step8_codes = []
    else:
        step8_status = "unsupported"
        step8_key = "particular_solution_built.unsupported_gn"
        step8_warning = "warning.unsupported_gn_family"
        step8_codes = ["CEQ_UNSUPPORTED_GN_FAMILY"]

    steps.append(
        _make_step(
            ctx=ctx,
            index=8,
            step_id="ceq_s8",
            kind="particular_solution_built",
            title="Solución particular" if locale_key(ctx.locale) == "es" else "Particular solution",
            status=step8_status,
            confidence="high" if step8_status == "complete" else "low",
            summary_key=step8_key,
            concept_key="concept.particular_solution_built",
            warning_key=step8_warning,
            primary_latex=ctx.particular_solution if ctx.particular_solution else r"T_p(n)\;\text{N/A}",
            payload={"g_n": ctx.g_n, "particular_solution": ctx.particular_solution},
            codes=step8_codes,
            assumptions=["g(n) treated as constant family"] if (ctx.particular_supported and not ctx.is_homogeneous) else [],
        )
    )

    step9_status: StepStatus = "complete"
    step9_key = "general_solution_built.homogeneous_only" if ctx.is_homogeneous else "general_solution_built.with_particular"
    step9_warning = None
    step9_codes: List[str] = []
    step9_blocked: List[str] = []
    if not ctx.is_homogeneous and step8_status != "complete":
        step9_status = "partial"
        step9_key = "general_solution_built.partial"
        step9_warning = "warning.unsupported_gn_family"
        step9_codes = ["CEQ_UNSUPPORTED_GN_FAMILY"]
        step9_blocked = ["ceq_s8"]

    steps.append(
        _make_step(
            ctx=ctx,
            index=9,
            step_id="ceq_s9",
            kind="general_solution_built",
            title="Solución general" if locale_key(ctx.locale) == "es" else "General solution",
            status=step9_status,
            confidence="medium" if step9_status == "partial" else "high",
            summary_key=step9_key,
            concept_key="concept.general_solution_built",
            warning_key=step9_warning,
            primary_latex=ctx.general_solution,
            payload={"general_solution": ctx.general_solution},
            codes=step9_codes,
            blocked_by=step9_blocked,
        )
    )

    has_base_cases = bool(ctx.base_cases)
    solved_constants = ctx.solved_constants or {}
    required_constants = max(int(ctx.required_constants), 0)
    has_required_constants = (required_constants == 0) or (len(solved_constants) >= required_constants)
    step10_status: StepStatus = "complete" if has_required_constants else "partial"
    step10_summary_key = "base_conditions_applied.solved" if has_required_constants else "base_conditions_applied.partial"
    step10_warning = None if has_required_constants else "warning.insufficient_base_conditions"
    step10_codes: List[str] = [] if has_required_constants else ["CEQ_INSUFFICIENT_BASE_CONDITIONS"]
    if has_required_constants and solved_constants:
        step10_primary = ",\\;".join([f"{k}={v}" for k, v in solved_constants.items()])
    elif has_base_cases:
        step10_primary = ",\\;".join([f"{k}={v}" for k, v in ctx.base_cases.items()])
    else:
        step10_primary = None

    steps.append(
        _make_step(
            ctx=ctx,
            index=10,
            step_id="ceq_s10",
            kind="base_conditions_applied",
            title="Aplicación de condiciones iniciales" if locale_key(ctx.locale) == "es" else "Initial conditions application",
            status=step10_status,
            confidence="high" if step10_status == "complete" else "medium",
            summary_key=step10_summary_key,
            concept_key="concept.base_conditions_applied",
            warning_key=step10_warning,
            primary_latex=step10_primary,
            payload={
                "base_cases": ctx.base_cases,
                "solved_constants": solved_constants,
                "required_constants": required_constants,
            },
            codes=step10_codes,
        )
    )

    step11_status: StepStatus = "partial" if ctx.simplification_partial else "complete"
    steps.append(
        _make_step(
            ctx=ctx,
            index=11,
            step_id="ceq_s11",
            kind="closed_form_simplified",
            title="Simplificación final" if locale_key(ctx.locale) == "es" else "Final simplification",
            status=step11_status,
            confidence="medium" if step11_status == "partial" else "high",
            summary_key="closed_form_simplified.partial" if step11_status == "partial" else "closed_form_simplified.complete",
            concept_key="concept.closed_form_simplified",
            warning_key="warning.simplification_partial" if step11_status == "partial" else None,
            primary_latex=ctx.closed_form,
            payload={"closed_form": ctx.closed_form},
            codes=["CEQ_SIMPLIFICATION_PARTIAL"] if step11_status == "partial" else [],
        )
    )

    prior_partial = any(s.get("status") in ("partial", "unsupported", "error") for s in steps)
    step12_status: StepStatus = "partial" if prior_partial else "complete"
    steps.append(
        _make_step(
            ctx=ctx,
            index=12,
            step_id="ceq_s12",
            kind="dominant_term_concluded",
            title="Conclusión asintótica" if locale_key(ctx.locale) == "es" else "Asymptotic conclusion",
            status=step12_status,
            confidence="medium" if step12_status == "partial" else "high",
            summary_key="dominant_term_concluded.partial" if step12_status == "partial" else "dominant_term_concluded.exponential",
            concept_key="concept.dominant_term_concluded",
            primary_latex=f"T(n) = {ctx.theta}",
            payload={"theta": ctx.theta, "dominant_root": ctx.roots[0].get("root") if ctx.roots else None},
        )
    )

    return {
        "method": "characteristic_equation",
        "version": "ceq_steps_v1",
        "overallStatus": compute_overall_status(steps),
        "steps": steps,
    }
