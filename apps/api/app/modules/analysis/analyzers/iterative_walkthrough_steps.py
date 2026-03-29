from __future__ import annotations

import re
from typing import Any, Dict, List, Optional

from .recursive_steps_core import compute_overall_status, locale_key, make_recursive_step

_TEMPLATE_STRINGS: Dict[str, Dict[str, str]] = {
    "es": {
        "iter_line.scope": "Se toma la línea {line} ({kind_label}) como unidad contable dentro del {case_label}.",
        "concept.iter_line.scope": "Antes de calcular fórmulas globales conviene fijar qué instrucción se está midiendo y por qué esa línea aporta costo al caso seleccionado.",
        "iter_line.count.standard": "Se determina cuántas veces se ejecuta la línea {line} en el {case_label}.",
        "iter_line.count.average": "Se determina la esperanza de ejecuciones de la línea {line} en el caso promedio.",
        "concept.iter_line.count": "El conteo por línea captura la frecuencia con que aparece la instrucción y luego se combina con su costo elemental.",
        "iter_line.summation_closed.standard": "La sumatoria que define el conteo de la línea {line} se cierra en una forma más manejable.",
        "iter_line.summation_closed.average": "La sumatoria que define la esperanza de ejecuciones de la línea {line} se cierra en una forma más manejable.",
        "concept.iter_line.summation_closed": "Cerrar la sumatoria deja visible la forma útil del conteo sin repetir toda la derivación algebraica dentro del modal.",
        "iter_line.cost.standard": "Con el costo elemental y el conteo cerrado se obtiene el aporte total de la línea {line}.",
        "iter_line.cost.average": "Con el costo elemental y la esperanza cerrada se obtiene el aporte esperado de la línea {line}.",
        "concept.iter_line.cost": "Este término es el bloque que luego entra a la suma global del caso analizado.",
        "iter_case.lines.standard": "El {case_label} se construye con las líneas contables {line_refs}.",
        "iter_case.lines.average": "El caso promedio se organiza a partir de las líneas contables {line_refs}.",
        "concept.iter_case.lines": "Primero se fijan las líneas o grupos relevantes para que la suma global no aparezca desconectada de la tabla por línea.",
        "iter_case.counts.standard": "Se resume cuántas veces se ejecuta cada una de esas líneas antes de mezclar los costos elementales.",
        "iter_case.counts.average": "Se resume la esperanza de ejecuciones de cada línea bajo el modelo {model_note}.",
        "concept.iter_case.counts.standard": "Separar los conteos por línea reduce ruido y hace explícito de dónde sale la suma global.",
        "concept.iter_case.counts.average": "El caso promedio usa esperanzas por línea; los supuestos del modelo se aplican antes de construir la suma global.{hypotheses_suffix}",
        "iter_case.sum.standard": "Se suman los aportes de cada línea para construir {symbol_name}.",
        "iter_case.sum.average": "Se suman los aportes esperados de cada línea para construir {symbol_name}.",
        "concept.iter_case.sum": "Cada término de la expresión global combina costo elemental y frecuencia de ejecución de la línea correspondiente.",
        "iter_case.sum_closed": "Las sumatorias por línea ya cerradas se sustituyen dentro de la suma global.",
        "concept.iter_case.sum_closed": "Este paso reemplaza conteos con forma sigma por expresiones cerradas para continuar la simplificación sin perder trazabilidad.",
        "iter_case.constants": "Las constantes ocultas se sustituyen para observar solo el crecimiento relevante.",
        "concept.iter_case.constants": "Las constantes multiplicativas no cambian la clase asintótica; por eso se aíslan antes de identificar el término dominante.",
        "iter_case.simplified": "La expresión global se simplifica hasta una forma más compacta de {symbol_name}.",
        "concept.iter_case.simplified": "La simplificación reúne términos equivalentes y deja una forma lista para razonar crecimiento.",
        "iter_case.dominant": "Se identifica el término que domina el crecimiento de la expresión simplificada.",
        "concept.iter_case.dominant": "El término dominante es el que crece más rápido cuando el tamaño de entrada aumenta y gobierna la complejidad.",
        "iter_case.asymptotic": "La clase asintótica final se concluye a partir de la expresión simplificada.",
        "concept.iter_case.asymptotic": "La notación asintótica resume el crecimiento de largo plazo después de cerrar la suma y descartar constantes irrelevantes.",
    },
    "en": {
        "iter_line.scope": "Line {line} ({kind_label}) is taken as the accounting unit inside the {case_label}.",
        "concept.iter_line.scope": "Before building global formulas, it helps to fix which instruction is being measured and why that line contributes cost in the selected case.",
        "iter_line.count.standard": "The execution count for line {line} is established for the {case_label}.",
        "iter_line.count.average": "The expected execution count for line {line} is established for the average case.",
        "concept.iter_line.count": "The per-line count captures how often the instruction appears and is then combined with its elemental cost.",
        "iter_line.summation_closed.standard": "The summation that defines the count for line {line} is closed into a more manageable form.",
        "iter_line.summation_closed.average": "The summation that defines the expected count for line {line} is closed into a more manageable form.",
        "concept.iter_line.summation_closed": "Closing the summation exposes the useful count form without repeating the whole algebraic derivation inside the modal.",
        "iter_line.cost.standard": "The final contribution of line {line} is obtained by combining elemental cost and closed count.",
        "iter_line.cost.average": "The expected contribution of line {line} is obtained by combining elemental cost and closed expectation.",
        "concept.iter_line.cost": "This term is the block that later enters the global sum for the analyzed case.",
        "iter_case.lines.standard": "The {case_label} is built from accountable lines {line_refs}.",
        "iter_case.lines.average": "The average case is organized around accountable lines {line_refs}.",
        "concept.iter_case.lines": "Relevant lines or groups are fixed first so the global sum does not appear disconnected from the per-line table.",
        "iter_case.counts.standard": "The execution count of each of those lines is summarized before mixing in elemental costs.",
        "iter_case.counts.average": "The expected execution count of each line is summarized under the {model_note} model.",
        "concept.iter_case.counts.standard": "Keeping counts separate from costs reduces noise and makes the origin of the global sum explicit.",
        "concept.iter_case.counts.average": "The average case uses per-line expectations; model assumptions are applied before building the global sum.{hypotheses_suffix}",
        "iter_case.sum.standard": "Per-line contributions are added to build {symbol_name}.",
        "iter_case.sum.average": "Expected per-line contributions are added to build {symbol_name}.",
        "concept.iter_case.sum": "Each term in the global expression combines elemental cost with the execution frequency of its line.",
        "iter_case.sum_closed": "Closed per-line summations are substituted into the global sum.",
        "concept.iter_case.sum_closed": "This step replaces sigma-style counts with closed expressions so simplification can continue without losing traceability.",
        "iter_case.constants": "Hidden constants are substituted away to expose only the relevant growth.",
        "concept.iter_case.constants": "Multiplicative constants do not change the asymptotic class, so they are isolated before identifying the dominant term.",
        "iter_case.simplified": "The global expression is simplified into a more compact form of {symbol_name}.",
        "concept.iter_case.simplified": "Simplification groups equivalent terms and leaves the expression ready for growth reasoning.",
        "iter_case.dominant": "The term that dominates the growth of the simplified expression is identified.",
        "concept.iter_case.dominant": "The dominant term is the one that grows fastest as the input size increases and therefore governs complexity.",
        "iter_case.asymptotic": "The final asymptotic class is concluded from the simplified expression.",
        "concept.iter_case.asymptotic": "Asymptotic notation summarizes long-run growth after the sum is closed and irrelevant constants are discarded.",
    },
}

_LINE_KIND_LABELS = {
    "es": {
        "assign": "asignación",
        "if": "condicional",
        "for": "for",
        "while": "while",
        "repeat": "repeat",
        "call": "llamada",
        "print": "impresión",
        "return": "retorno",
        "decl": "declaración",
        "other": "otra instrucción",
    },
    "en": {
        "assign": "assignment",
        "if": "conditional",
        "for": "for",
        "while": "while",
        "repeat": "repeat",
        "call": "call",
        "print": "print",
        "return": "return",
        "decl": "declaration",
        "other": "other statement",
    },
}


def _title(locale: str, es: str, en: str) -> str:
    return es if locale_key(locale) == "es" else en


def _case_label(mode: str, locale: str) -> str:
    if locale_key(locale) == "es":
        if mode == "best":
            return "mejor caso"
        if mode == "avg":
            return "caso promedio"
        return "peor caso"
    if mode == "best":
        return "best case"
    if mode == "avg":
        return "average case"
    return "worst case"


def _symbol_name(mode: str) -> str:
    return "A(n)" if mode == "avg" else "T(n)"


def _line_refs(rows: List[Dict[str, Any]], locale: str) -> str:
    numbers = sorted(
        {
            int(row.get("line"))
            for row in rows
            if isinstance(row.get("line"), int)
        }
    )
    if not numbers:
        return _title(locale, "sin líneas numeradas", "no numbered lines")
    ranges: List[str] = []
    start = numbers[0]
    prev = numbers[0]
    for number in numbers[1:]:
        if number == prev + 1:
            prev = number
            continue
        ranges.append(f"{start}-{prev}" if start != prev else str(start))
        start = prev = number
    ranges.append(f"{start}-{prev}" if start != prev else str(start))
    prefix = "líneas" if locale_key(locale) == "es" else "lines"
    if len(ranges) == 1 and "-" not in ranges[0]:
        prefix = "línea" if locale_key(locale) == "es" else "line"
    return f"{prefix} {', '.join(ranges)}"


def _line_kind_label(kind: Any, locale: str) -> str:
    table = _LINE_KIND_LABELS[locale_key(locale)]
    normalized = str(kind or "other")
    return table.get(normalized, table["other"])


def _count_symbol(line: Any, mode: str) -> str:
    return f"E[N_{{{line}}}]" if mode == "avg" else f"N_{{{line}}}"


def _line_count_value(row: Dict[str, Any], mode: str) -> str:
    if mode == "avg":
        return str(row.get("expectedRuns") or row.get("count") or "0")
    return str(row.get("count") or "0")


def _line_closed_count_value(row: Dict[str, Any], mode: str) -> str:
    if mode == "avg":
        return str(
            row.get("expectedRuns_closed")
            or row.get("count_closed")
            or row.get("expectedRuns")
            or row.get("count")
            or "0"
        )
    return str(row.get("count_closed") or row.get("count") or "0")


def _line_raw_count_value(row: Dict[str, Any], mode: str) -> str:
    if mode == "avg":
        return str(
            row.get("count_raw")
            or row.get("expectedRuns")
            or row.get("count")
            or "0"
        )
    return str(row.get("count_raw") or row.get("count") or "0")


def _needs_closure(raw_count: str, closed_count: str) -> bool:
    normalized_raw = str(raw_count or "").replace(" ", "")
    normalized_closed = str(closed_count or "").replace(" ", "")
    return "\\sum" in normalized_raw and normalized_raw != normalized_closed


def _build_line_cost_formula(row: Dict[str, Any], mode: str) -> str:
    if row.get("unbounded"):
        return "\\infty"
    if row.get("line_cost_final"):
        return str(row.get("line_cost_final"))
    count = _line_count_value(row, mode)
    ck = str(row.get("ck") or "C")
    ops = row.get("ops", 1)
    if ops not in (None, 1):
        return f"{ck} \\cdot {ops} \\cdot ({count})"
    return f"{ck} \\cdot ({count})"


def _substitute_symbolic_constants(expression: Optional[str]) -> Optional[str]:
    if not expression:
        return None
    substituted = re.sub(r"C_\{\d+\}", "1", expression)
    substituted = re.sub(r"C_(\d+)", "1", substituted)
    return substituted


def _dominant_term(big_theta: Optional[str], simplified_expression: Optional[str]) -> str:
    theta = str(big_theta or "").strip()
    if theta:
        normalized = theta.replace("\\Theta", "").strip()
        normalized = re.sub(r"^\\left\(", "(", normalized)
        normalized = re.sub(r"\\right\)$", ")", normalized)
        if normalized.startswith("(") and normalized.endswith(")"):
            inner = normalized[1:-1].strip()
            if inner:
                return inner
        return normalized or theta
    simplified = str(simplified_expression or "").strip()
    return simplified or "1"


def _append_step_notes(
    step: Dict[str, Any],
    *,
    summary_suffix: Optional[str] = None,
    concept_suffix: Optional[str] = None,
) -> Dict[str, Any]:
    if summary_suffix:
        step["summary"] = f"{step.get('summary', '').strip()} {summary_suffix}".strip()
    if concept_suffix:
        concept = f"{step.get('conceptNote', '').strip()} {concept_suffix}".strip()
        step["conceptNote"] = concept
        step["teachingNote"] = concept
    return step


def _line_count_notation_notes(line: Any, mode: str, locale: str) -> tuple[str, str]:
    if locale_key(locale) == "es":
        if mode == "avg":
            return (
                f"Aquí \\(E[N_{{{line}}}]\\) nombra esa esperanza.",
                f"Aquí \\(E[N_{{{line}}}]\\) representa la esperanza del número de ejecuciones de la línea {line}; \\(N_{{{line}}}\\) cuenta las visitas a esa línea y el subíndice {line} solo la identifica dentro de la tabla.",
            )
        return (
            f"Aquí \\(N_{{{line}}}\\) nombra ese conteo.",
            f"Aquí \\(N_{{{line}}}\\) representa cuántas veces se ejecuta la línea {line}; el subíndice {line} indica exactamente qué línea de la tabla se está contando antes de multiplicar por su costo elemental.",
        )
    if mode == "avg":
        return (
            f"Here \\(E[N_{{{line}}}]\\) names that expectation.",
            f"Here \\(E[N_{{{line}}}]\\) denotes the expected number of executions of line {line}; \\(N_{{{line}}}\\) counts visits to that line and subscript {line} identifies which table row is being measured.",
        )
    return (
        f"Here \\(N_{{{line}}}\\) names that count.",
        f"Here \\(N_{{{line}}}\\) denotes how many times line {line} executes; subscript {line} identifies exactly which line in the table is being counted before multiplying by its elemental cost.",
    )


def _case_count_notation_notes(mode: str, locale: str) -> tuple[str, str]:
    if locale_key(locale) == "es":
        if mode == "avg":
            return (
                "Cada símbolo \\(E[N_{\\ell}]\\) usa el subíndice para señalar la línea correspondiente.",
                "Cada símbolo \\(E[N_{\\ell}]\\) resume la esperanza del número de ejecuciones de la línea \\(\\ell\\); el subíndice \\(\\ell\\) indica qué fila de la tabla aporta ese conteo esperado a la suma global.",
            )
        return (
            "Cada símbolo \\(N_{\\ell}\\) usa el subíndice para señalar la línea correspondiente.",
            "Cada símbolo \\(N_{\\ell}\\) resume cuántas veces se ejecuta la línea \\(\\ell\\); el subíndice \\(\\ell\\) indica qué fila de la tabla aporta ese conteo a la suma global.",
        )
    if mode == "avg":
        return (
            "Each symbol \\(E[N_{\\ell}]\\) uses its subscript to point to the corresponding line.",
            "Each symbol \\(E[N_{\\ell}]\\) summarizes the expected number of executions of line \\(\\ell\\); subscript \\(\\ell\\) tells which table row contributes that expected count to the global sum.",
        )
    return (
        "Each symbol \\(N_{\\ell}\\) uses its subscript to point to the corresponding line.",
        "Each symbol \\(N_{\\ell}\\) summarizes how many times line \\(\\ell\\) executes; subscript \\(\\ell\\) tells which table row contributes that count to the global sum.",
    )


def _bound_growth(bound: Optional[str]) -> Optional[str]:
    text = str(bound or "").strip()
    if not text:
        return None
    start = text.find("(")
    end = text.rfind(")")
    if start >= 0 and end > start:
        inner = text[start + 1 : end].strip()
        if inner:
            return inner
    return text


def _asymptotic_membership_items(
    symbol_name: str,
    *,
    big_o: Optional[str],
    big_omega: Optional[str],
    big_theta: Optional[str],
) -> List[Dict[str, str]]:
    items: List[Dict[str, str]] = []
    for suffix, bound in (
        ("big_o", big_o),
        ("big_omega", big_omega),
        ("big_theta", big_theta),
    ):
        if bound:
            items.append(
                {
                    "id": f"iter_case_s8_{suffix}",
                    "kind": "equation",
                    "latex": f"{symbol_name} \\in {bound}",
                }
            )
    return items


def _asymptotic_primary_result(
    symbol_name: str,
    *,
    big_o: Optional[str],
    big_omega: Optional[str],
    big_theta: Optional[str],
    has_unbounded: bool,
) -> str:
    if has_unbounded:
        return f"{symbol_name} = \\infty"
    final_class = big_theta or big_o or big_omega or "\\Theta(1)"
    return f"{symbol_name} = {final_class}"


def _asymptotic_explanations(
    *,
    locale: str,
    symbol_name: str,
    simplified_formula: str,
    dominant: str,
    big_o: Optional[str],
    big_omega: Optional[str],
    big_theta: Optional[str],
    has_unbounded: bool,
) -> tuple[str, str]:
    if locale_key(locale) == "es":
        if has_unbounded:
            return (
                f"El proceso no queda acotado y por eso se reporta \\({symbol_name} = \\infty\\).",
                f"La ejecución puede prolongarse sin límite, así que no hay una cota asintótica finita que cierre el análisis; por eso la conclusión se reporta como \\({symbol_name} = \\infty\\).",
            )
        summary = (
            f"A partir de \\({symbol_name} = {simplified_formula}\\), el crecimiento queda gobernado por "
            f"\\({dominant}\\) y con eso se justifican las cotas finales."
        )
        concept_parts = [
            f"La expresión \\({symbol_name} = {simplified_formula}\\) queda gobernada por \\({dominant}\\)."
        ]
        o_growth = _bound_growth(big_o)
        omega_growth = _bound_growth(big_omega)
        theta_growth = _bound_growth(big_theta)
        if big_o and o_growth:
            concept_parts.append(
                f"Eso implica que \\({symbol_name}\\) no crece más rápido que \\({o_growth}\\), así que \\({symbol_name} \\in {big_o}\\)."
            )
        if big_omega and omega_growth:
            concept_parts.append(
                f"También crece al menos como \\({omega_growth}\\), así que \\({symbol_name} \\in {big_omega}\\)."
            )
        if big_theta and theta_growth:
            concept_parts.append(
                f"Como la cota superior y la inferior coinciden en el mismo orden de crecimiento \\({theta_growth}\\), se concluye \\({symbol_name} \\in {big_theta}\\)."
            )
        return summary, " ".join(concept_parts)

    if has_unbounded:
        return (
            f"The process is unbounded, so the conclusion is reported as \\({symbol_name} = \\infty\\).",
            f"Execution can continue without a finite bound, so there is no finite asymptotic class to close the analysis; the conclusion is therefore reported as \\({symbol_name} = \\infty\\).",
        )
    summary = (
        f"Starting from \\({symbol_name} = {simplified_formula}\\), growth is governed by "
        f"\\({dominant}\\), which justifies the final bounds."
    )
    concept_parts = [
        f"The expression \\({symbol_name} = {simplified_formula}\\) is governed by \\({dominant}\\)."
    ]
    o_growth = _bound_growth(big_o)
    omega_growth = _bound_growth(big_omega)
    theta_growth = _bound_growth(big_theta)
    if big_o and o_growth:
        concept_parts.append(
            f"That means \\({symbol_name}\\) does not grow faster than \\({o_growth}\\), so \\({symbol_name} \\in {big_o}\\)."
        )
    if big_omega and omega_growth:
        concept_parts.append(
            f"It also grows at least as fast as \\({omega_growth}\\), so \\({symbol_name} \\in {big_omega}\\)."
        )
    if big_theta and theta_growth:
        concept_parts.append(
            f"Because the upper and lower bounds match at the same growth order \\({theta_growth}\\), we conclude \\({symbol_name} \\in {big_theta}\\)."
        )
    return summary, " ".join(concept_parts)


def build_iterative_line_step_bundle(
    *,
    row: Dict[str, Any],
    locale: str,
    mode: str,
) -> Dict[str, Any]:
    line = row.get("line", "?")
    case_label = _case_label(mode, locale)
    count_symbol = _count_symbol(line, mode)
    raw_count = _line_raw_count_value(row, mode)
    closed_count = _line_closed_count_value(row, mode)
    cost_formula = _build_line_cost_formula(row, mode)
    kind_label = _line_kind_label(row.get("kind"), locale)
    count_summary_key = (
        "iter_line.count.average" if mode == "avg" else "iter_line.count.standard"
    )
    closure_summary_key = (
        "iter_line.summation_closed.average"
        if mode == "avg"
        else "iter_line.summation_closed.standard"
    )
    cost_summary_key = (
        "iter_line.cost.average" if mode == "avg" else "iter_line.cost.standard"
    )
    steps: List[Dict[str, Any]] = [
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=locale,
            index=1,
            step_id=f"iter_line_{line}_s1",
            kind="line_scope_identified",
            title=_title(locale, "Línea analizada", "Analyzed line"),
            status="complete",
            confidence="high",
            summary_key="iter_line.scope",
            concept_key="concept.iter_line.scope",
            params={
                "line": line,
                "kind_label": kind_label,
                "case_label": case_label,
            },
            payload={"line": line, "kind": row.get("kind"), "mode": mode},
        ),
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=locale,
            index=2,
            step_id=f"iter_line_{line}_s2",
            kind="line_execution_count_resolved",
            title=_title(
                locale,
                "Conteo de ejecuciones" if mode != "avg" else "Esperanza de ejecuciones",
                "Execution count" if mode != "avg" else "Expected executions",
            ),
            status="complete",
            confidence="high",
            summary_key=count_summary_key,
            concept_key="concept.iter_line.count",
            params={"line": line, "case_label": case_label},
            primary_latex=f"{count_symbol} = {raw_count}",
            payload={"line": line, "countSymbol": count_symbol, "mode": mode},
        ),
    ]
    line_count_summary_note, line_count_concept_note = _line_count_notation_notes(
        line, mode, locale
    )
    steps[1] = _append_step_notes(
        steps[1],
        summary_suffix=line_count_summary_note,
        concept_suffix=line_count_concept_note,
    )

    if _needs_closure(raw_count, closed_count):
        steps.append(
            make_recursive_step(
                template_strings=_TEMPLATE_STRINGS,
                locale=locale,
                index=len(steps) + 1,
                step_id=f"iter_line_{line}_s3",
                kind="line_count_summation_closed",
                title=_title(locale, "Cierre del conteo", "Count closure"),
                status="complete",
                confidence="high",
                summary_key=closure_summary_key,
                concept_key="concept.iter_line.summation_closed",
                params={"line": line},
                primary_latex=f"{count_symbol} = {raw_count}",
                items=[
                    {
                        "id": f"iter_line_{line}_closed",
                        "kind": "equation",
                        "latex": f"{count_symbol} = {closed_count}",
                    }
                ],
                payload={"line": line, "countSymbol": count_symbol, "mode": mode},
            )
        )

    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=locale,
            index=len(steps) + 1,
            step_id=f"iter_line_{line}_s4",
            kind="line_cost_built",
            title=_title(locale, "Costo final de la línea", "Final line cost"),
            status="complete",
            confidence="high",
            summary_key=cost_summary_key,
            concept_key="concept.iter_line.cost",
            params={"line": line},
            primary_latex=cost_formula,
            payload={
                "line": line,
                "mode": mode,
                "costFormula": cost_formula,
                "ck": row.get("ck"),
            },
        )
    )

    return {
        "method": "iterative_line",
        "version": "iter_line_steps_v1",
        "overallStatus": compute_overall_status(steps),
        "steps": steps,
    }


def build_iterative_case_step_bundle(
    *,
    rows: List[Dict[str, Any]],
    locale: str,
    mode: str,
    raw_sum_expression: str,
    closed_sum_expression: str,
    simplified_expression: str,
    big_o: Optional[str],
    big_omega: Optional[str],
    big_theta: Optional[str],
    avg_model_note: Optional[str] = None,
    hypotheses: Optional[List[str]] = None,
    has_unbounded: bool = False,
) -> Dict[str, Any]:
    case_label = _case_label(mode, locale)
    symbol_name = _symbol_name(mode)
    line_refs = _line_refs(rows, locale)
    model_note = avg_model_note or _title(locale, "modelo disponible", "available model")
    hypotheses = [str(item).strip() for item in (hypotheses or []) if str(item).strip()]
    hypotheses_suffix = (
        (" " + _title(locale, f"Supuestos: {'; '.join(hypotheses)}.", f"Assumptions: {'; '.join(hypotheses)}."))
        if hypotheses
        else ""
    )
    summary_key_prefix = "iter_case.lines.average" if mode == "avg" else "iter_case.lines.standard"
    counts_key = "iter_case.counts.average" if mode == "avg" else "iter_case.counts.standard"
    counts_concept_key = (
        "concept.iter_case.counts.average"
        if mode == "avg"
        else "concept.iter_case.counts.standard"
    )
    sum_key = "iter_case.sum.average" if mode == "avg" else "iter_case.sum.standard"
    steps: List[Dict[str, Any]] = [
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=locale,
            index=1,
            step_id="iter_case_s1",
            kind="line_groups_identified",
            title=_title(locale, "Líneas consideradas", "Relevant lines"),
            status="complete",
            confidence="high",
            summary_key=summary_key_prefix,
            concept_key="concept.iter_case.lines",
            params={"case_label": case_label, "line_refs": line_refs},
            payload={
                "reportable": False,
                "lineRefs": line_refs,
                "mode": mode,
            },
        ),
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=locale,
            index=2,
            step_id="iter_case_s2",
            kind="line_counts_summarized",
            title=_title(
                locale,
                "Conteos por línea" if mode != "avg" else "Esperanzas por línea",
                "Per-line counts" if mode != "avg" else "Per-line expectations",
            ),
            status="complete",
            confidence="high",
            summary_key=counts_key,
            concept_key=counts_concept_key,
            params={
                "model_note": model_note,
                "hypotheses_suffix": hypotheses_suffix,
            },
            payload={
                "reportable": False,
                "lineRefs": line_refs,
                "mode": mode,
                "modelNote": model_note,
            },
        ),
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=locale,
            index=3,
            step_id="iter_case_s3",
            kind="line_cost_sum_built",
            title=_title(locale, "Suma global", "Global sum"),
            status="complete",
            confidence="high",
            summary_key=sum_key,
            concept_key="concept.iter_case.sum",
            params={"symbol_name": symbol_name},
            primary_latex=f"{symbol_name} = {raw_sum_expression}",
            payload={"reportable": True, "mode": mode, "stage": "sum"},
        ),
    ]
    case_count_summary_note, case_count_concept_note = _case_count_notation_notes(
        mode, locale
    )
    steps[1] = _append_step_notes(
        steps[1],
        summary_suffix=case_count_summary_note,
        concept_suffix=case_count_concept_note,
    )

    if closed_sum_expression and closed_sum_expression != raw_sum_expression:
        steps.append(
            make_recursive_step(
                template_strings=_TEMPLATE_STRINGS,
                locale=locale,
                index=len(steps) + 1,
                step_id="iter_case_s4",
                kind="line_cost_sum_closed",
                title=_title(locale, "Cierre de sumatorias", "Summation closure"),
                status="complete",
                confidence="high",
                summary_key="iter_case.sum_closed",
                concept_key="concept.iter_case.sum_closed",
                params={},
                primary_latex=f"{symbol_name} = {closed_sum_expression}",
                payload={"reportable": True, "mode": mode, "stage": "closed_sum"},
            )
        )

    substituted_constants = _substitute_symbolic_constants(closed_sum_expression)
    if (
        substituted_constants
        and not has_unbounded
        and substituted_constants != closed_sum_expression
    ):
        steps.append(
            make_recursive_step(
                template_strings=_TEMPLATE_STRINGS,
                locale=locale,
                index=len(steps) + 1,
                step_id="iter_case_s5",
                kind="constant_substitution_applied",
                title=_title(
                    locale,
                    "Sustitución de constantes",
                    "Constant substitution",
                ),
                status="complete",
                confidence="high",
                summary_key="iter_case.constants",
                concept_key="concept.iter_case.constants",
                params={},
                primary_latex=f"{symbol_name} = {substituted_constants}",
                payload={"reportable": True, "mode": mode, "stage": "constants"},
            )
        )

    simplified_formula = simplified_expression or closed_sum_expression or raw_sum_expression
    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=locale,
            index=len(steps) + 1,
            step_id="iter_case_s6",
            kind="cost_expression_simplified",
            title=_title(locale, "Simplificación", "Simplification"),
            status="complete",
            confidence="high",
            summary_key="iter_case.simplified",
            concept_key="concept.iter_case.simplified",
            params={"symbol_name": symbol_name},
            primary_latex=f"{symbol_name} = {simplified_formula}",
            payload={"reportable": True, "mode": mode, "stage": "simplified"},
        )
    )

    dominant = "\\infty" if has_unbounded else _dominant_term(big_theta, simplified_formula)
    steps.append(
        make_recursive_step(
            template_strings=_TEMPLATE_STRINGS,
            locale=locale,
            index=len(steps) + 1,
            step_id="iter_case_s7",
            kind="dominant_term_identified",
            title=_title(locale, "Término dominante", "Dominant term"),
            status="complete",
            confidence="high",
            summary_key="iter_case.dominant",
            concept_key="concept.iter_case.dominant",
            params={},
            primary_latex=dominant,
            payload={
                "reportable": True,
                "mode": mode,
                "stage": "dominant_term",
                "dominantTerm": dominant,
            },
        )
    )

    asymptotic_formula = _asymptotic_primary_result(
        symbol_name,
        big_o=big_o,
        big_omega=big_omega,
        big_theta=big_theta,
        has_unbounded=has_unbounded,
    )
    asymptotic_summary, asymptotic_concept = _asymptotic_explanations(
        locale=locale,
        symbol_name=symbol_name,
        simplified_formula=simplified_formula,
        dominant=dominant,
        big_o=big_o,
        big_omega=big_omega,
        big_theta=big_theta,
        has_unbounded=has_unbounded,
    )
    asymptotic_step = make_recursive_step(
        template_strings=_TEMPLATE_STRINGS,
        locale=locale,
        index=len(steps) + 1,
        step_id="iter_case_s8",
        kind="asymptotic_concluded",
        title=_title(
            locale,
            "Conclusión asintótica",
            "Asymptotic conclusion",
        ),
        status="complete",
        confidence="high",
        summary_key="iter_case.asymptotic",
        concept_key="concept.iter_case.asymptotic",
        params={},
        primary_latex=asymptotic_formula,
        items=(
            []
            if has_unbounded
            else _asymptotic_membership_items(
                symbol_name,
                big_o=big_o,
                big_omega=big_omega,
                big_theta=big_theta,
            )
        ),
        payload={"reportable": True, "mode": mode, "stage": "asymptotic"},
        derivation={"asymptoticResult": big_theta or big_o or asymptotic_formula},
    )
    asymptotic_step["summary"] = asymptotic_summary
    asymptotic_step["conceptNote"] = asymptotic_concept
    asymptotic_step["teachingNote"] = asymptotic_concept
    steps.append(asymptotic_step)

    return {
        "method": "iterative_case",
        "version": "iter_case_steps_v1",
        "overallStatus": compute_overall_status(steps),
        "steps": steps,
    }
