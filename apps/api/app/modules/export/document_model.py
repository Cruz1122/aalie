"""
Document model builder for the pure-Python export pipeline.
"""

from __future__ import annotations

import json
import re
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional

from .format_utils import (
    build_status_block,
    ensure_sentence,
    localize,
    maybe_list,
    normalize_recursive_formula,
    pick_case_complexity,
    safe,
)
from .i18n import get_export_i18n
from .models import (
    DocumentInstitutionInfo,
    DocumentModel,
    DocumentSection,
    DocumentTable,
)
from .section_status import is_section_available

CASE_ORDER = ["worst", "best", "avg"]
ALL_RECURSIVE_METHODS = [
    "characteristic_equation",
    "iteration",
    "recursion_tree",
    "master",
]


def _case_label(case_name: str, i18n: Dict[str, Any]) -> str:
    return i18n["caseLabels"][case_name]


def _method_label(method: str, i18n: Dict[str, Any]) -> str:
    return i18n["methodLabels"].get(method, method)


def _parse_date_for_report(locale: str, created_at: str) -> str:
    try:
        parsed = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    except ValueError:
        return created_at
    months_es = [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
    ]
    months_en = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ]
    if locale == "es":
        return f"{parsed.day} de {months_es[parsed.month - 1]} de {parsed.year}"
    return f"{months_en[parsed.month - 1]} {parsed.day}, {parsed.year}"


def _as_record(value: Any) -> Optional[Dict[str, Any]]:
    return value if isinstance(value, dict) else None


def _as_number(value: Any) -> Optional[int]:
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, (int, float)):
        return int(value)
    if isinstance(value, str) and value.strip():
        try:
            return int(float(value))
        except ValueError:
            return None
    return None


def _normalize_didactic_summary_text(text: str) -> str:
    return (
        str(text)
        .replace("una frontera de revisión", "un límite de elementos revisados")
        .replace("frontera de revisión", "un límite de elementos revisados")
        .replace("review boundary", "reviewed-items boundary")
    )


def _normalize_dominant_reason_text(value: str) -> str:
    return (
        str(value)
        .replace("\\text{", " ")
        .replace("}", " ")
        .replace("\\cdot", " · ")
        .replace("\\times", " × ")
        .replace("\\log", "log")
        .replace("\\Theta", "Theta")
        .replace("\\Omega", "Omega")
        .replace("\\mathcal{O}", "O")
        .replace("\\left", " ")
        .replace("\\right", " ")
        .replace("\\\\", ". ")
        .replace("\\", " ")
        .replace("{", "")
        .replace("}", "")
    )


_MASTER_TITLE_TRANSLATIONS_ES = {
    "Detected recurrence": "Recurrencia detectada",
    "Master-form validation": "Validación de forma maestra",
    "Extracted parameters": "Parámetros extraídos",
    "Critical exponent": "Exponente crítico",
    "Reference growth": "Crecimiento de referencia",
    "Growth comparison": "Comparación de crecimiento",
    "Case evaluation": "Evaluación de caso",
    "Regularity check": "Chequeo de regularidad",
    "Applicability decision": "Decisión de aplicabilidad",
    "Asymptotic conclusion": "Conclusión asintótica",
}

_MASTER_TITLE_TRANSLATIONS_EN = {
    value: key for key, value in _MASTER_TITLE_TRANSLATIONS_ES.items()
}

_MASTER_TEXT_TRANSLATIONS_ES = {
    "The recurrence is classified as Case 1.": "La recurrencia se clasifica como Caso 1.",
    "The recurrence is classified as Case 2.": "La recurrencia se clasifica como Caso 2.",
    "The recurrence is classified as Case 3 (subject to regularity).": "La recurrencia se clasifica como Caso 3 (sujeto a regularidad).",
    "No valid Master Theorem case could be assigned with current evidence.": "No se pudo asignar un caso válido del Teorema Maestro con la evidencia disponible.",
    "Case-3 regularity condition was verified and allows the case conclusion.": "La condición de regularidad del Caso 3 se verificó y permite concluir el caso.",
    "Case-3 regularity condition fails; theorem cannot be applied at this point.": "La condición de regularidad del Caso 3 no se cumple; no se puede aplicar el teorema en este punto.",
    "Regularity is not required because the candidate is not Case 3.": "La regularidad no aplica porque el caso candidato no es el Caso 3.",
    "Master Theorem applicability is confirmed for this recurrence.": "Se confirma aplicabilidad del Teorema Maestro para esta recurrencia.",
    "Master Theorem is not applicable for this recurrence under current coverage.": "Se concluye que el Teorema Maestro no aplica en esta recurrencia bajo cobertura actual.",
}

_MASTER_TEXT_TRANSLATIONS_EN = {
    value: key for key, value in _MASTER_TEXT_TRANSLATIONS_ES.items()
}


def _localize_analysis_text(value: Any, i18n: Dict[str, Any]) -> str:
    text = str(value or "").strip()
    if not text:
        return text
    if i18n["locale"] == "es":
        for source, target in _MASTER_TEXT_TRANSLATIONS_ES.items():
            text = text.replace(source, target)
        for source, target in _MASTER_TITLE_TRANSLATIONS_ES.items():
            text = text.replace(source, target)
        text = re.sub(r"\bMaster Theorem\b", "Teorema Maestro", text)
        text = re.sub(r"\bCase\s*-\s*([123])\b", r"Caso \1", text)
        text = re.sub(r"\bCase\s+([123])\b", r"Caso \1", text)
        text = re.sub(
            r"\bsubject to regularity\b",
            "sujeto a regularidad",
            text,
            flags=re.I,
        )
        text = re.sub(
            r"\bcase conclusion\b",
            "conclusión del caso",
            text,
            flags=re.I,
        )
        text = re.sub(r"\bRegularity\b", "Regularidad", text)
        text = re.sub(r"\bregularity\b", "regularidad", text)
        return text
    for source, target in _MASTER_TEXT_TRANSLATIONS_EN.items():
        text = text.replace(source, target)
    for source, target in _MASTER_TITLE_TRANSLATIONS_EN.items():
        text = text.replace(source, target)
    text = re.sub(r"\bTeorema Maestro\b", "Master Theorem", text)
    text = re.sub(r"\bCaso\s*([123])\b", r"Case \1", text)
    text = re.sub(
        r"\bsujeto a regularidad\b",
        "subject to regularity",
        text,
        flags=re.I,
    )
    text = re.sub(
        r"\bconclusión del caso\b",
        "case conclusion",
        text,
        flags=re.I,
    )
    text = re.sub(r"\bRegularidad\b", "Regularity", text)
    text = re.sub(r"\bregularidad\b", "regularity", text)
    return text


def _build_line_cost_table(
    line_costs: List[Dict[str, Any]], i18n: Dict[str, Any]
) -> DocumentTable:
    headers = (
        ["Línea", "Tipo", "Costo base", "Conteo (sumatoria)", "Conteo simplificado"]
        if i18n["locale"] == "es"
        else ["Line", "Kind", "Base cost", "Count (summation)", "Simplified count"]
    )
    rows = [
        [
            str(line.get("line")),
            str(line.get("kind") or ""),
            str(line.get("ck") or ""),
            str(line.get("count_raw") or "-"),
            str(line.get("count") or "-"),
        ]
        for line in line_costs
        if isinstance(line, dict)
    ]
    return DocumentTable(headers=headers, rows=rows)


def _normalize_math_expression(expression: str) -> str:
    return re.sub(r"\s+", " ", str(expression)).strip()


def _wrap_summation_term(expression: str) -> str:
    normalized = _normalize_math_expression(expression)
    if not normalized:
        return "0"
    if re.match(r"^[A-Za-z0-9_{}\\]+$", normalized):
        return normalized
    return f"({normalized})"


def _parse_linear_count_expression(raw_expression: str) -> Optional[Dict[str, int]]:
    expression = str(raw_expression).strip()
    if not expression:
        return None
    while expression.startswith("(") and expression.endswith(")"):
        inner = expression[1:-1].strip()
        if not inner or inner == expression:
            break
        expression = inner
    compact = re.sub(r"\s+", "", expression)
    if re.match(r"^[-+]?\d+$", compact):
        return {"nCoeff": 0, "constant": int(compact)}
    if compact in {"n", "+n"}:
        return {"nCoeff": 1, "constant": 0}
    if compact == "-n":
        return {"nCoeff": -1, "constant": 0}
    coeff_only = re.match(r"^([-+]?\d*)\*?n$", compact)
    if coeff_only:
        token = coeff_only.group(1)
        coeff = 1 if token in {"", "+"} else -1 if token == "-" else int(token)
        return {"nCoeff": coeff, "constant": 0}
    coeff_and_constant = re.match(r"^([-+]?\d*)\*?n([+-]\d+)$", compact)
    if coeff_and_constant:
        token = coeff_and_constant.group(1)
        coeff = 1 if token in {"", "+"} else -1 if token == "-" else int(token)
        return {"nCoeff": coeff, "constant": int(coeff_and_constant.group(2))}
    n_leading = re.match(r"^n([+-]\d+)$", compact)
    if n_leading:
        return {"nCoeff": 1, "constant": int(n_leading.group(1))}
    return None


def _format_linear_expression(value: Dict[str, int]) -> str:
    pieces: List[str] = []
    n_coeff = value["nCoeff"]
    constant = value["constant"]
    if n_coeff != 0:
        if n_coeff == 1:
            pieces.append("n")
        elif n_coeff == -1:
            pieces.append("-n")
        else:
            pieces.append(f"{n_coeff}n")
    if constant != 0 or not pieces:
        absolute = str(abs(constant))
        if not pieces:
            pieces.append(f"-{absolute}" if constant < 0 else absolute)
        else:
            pieces.append(f"- {absolute}" if constant < 0 else f"+ {absolute}")
    return " ".join(pieces)


def _build_count_summation_expression(
    line_costs: List[Dict[str, Any]]
) -> Dict[str, Optional[str]]:
    terms = [
        _normalize_math_expression(
            str(line.get("count") or line.get("count_raw") or "0")
        )
        for line in line_costs
    ]
    structural = (
        " + ".join(_wrap_summation_term(term) for term in terms) if terms else "0"
    )
    parsed = [_parse_linear_count_expression(term) for term in terms]
    if any(item is None for item in parsed):
        return {"structural": structural, "simplified": None}
    linear = {"nCoeff": 0, "constant": 0}
    for item in parsed:
        linear["nCoeff"] += item["nCoeff"]  # type: ignore[index]
        linear["constant"] += item["constant"]  # type: ignore[index]
    simplified = _format_linear_expression(linear)
    return {
        "structural": structural,
        "simplified": None if simplified == structural else simplified,
    }


def _build_total_cost_expression(line_costs: List[Dict[str, Any]]) -> str:
    if not line_costs:
        return "T(n) = 0"
    terms = [
        f"{_normalize_math_expression(str(line.get('ck') or 'C'))}\\left({_normalize_math_expression(str(line.get('count') or line.get('count_raw') or '0'))}\\right)"
        for line in line_costs
    ]
    return "T(n) = " + " + ".join(terms)


def _ensure_tn_prefix(expression: str) -> str:
    normalized = str(expression).strip()
    if not normalized:
        return normalized
    return (
        normalized
        if re.match(r"^T\s*\(\s*n\s*\)\s*=", normalized)
        else f"T(n) = {normalized}"
    )


def _extract_selected_loop_lines(
    pseudocode: str, selected_loop: Optional[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    line_start = _as_number((selected_loop or {}).get("lineStart"))
    line_end = _as_number((selected_loop or {}).get("lineEnd"))
    if line_start is None or line_end is None or line_end < line_start:
        return []
    source_lines = pseudocode.splitlines()
    picked: List[Dict[str, Any]] = []
    for line_number in range(line_start, line_end + 1):
        if line_number - 1 >= len(source_lines):
            continue
        picked.append(
            {"lineNumber": line_number, "text": source_lines[line_number - 1].rstrip()}
        )
    return picked


def _strip_leading_label(value: str, labels: List[str]) -> str:
    normalized = value.strip()
    for label in labels:
        normalized = re.sub(rf"^{re.escape(label)}\s*:\s*", "", normalized, flags=re.I)
    return normalized.strip()


def _build_executive_summary_section(
    snapshot: Dict[str, Any], i18n: Dict[str, Any]
) -> DocumentSection:
    blocks: List[Dict[str, Any]] = []
    iterative = snapshot.get("iterative") or {}
    loop_invariant = (
        ((iterative.get("data") or {}).get("loopInvariant") or {}).get("data")
        if snapshot.get("algorithmType") == "iterative"
        and is_section_available(iterative)
        and is_section_available(
            ((iterative.get("data") or {}).get("loopInvariant") or {})
        )
        else None
    )
    if snapshot.get("algorithmType") == "iterative":
        behaviour = ""
        if isinstance(loop_invariant, dict) and isinstance(
            loop_invariant.get("behaviour"), str
        ):
            behaviour = (
                loop_invariant["behaviour"]
                .strip()
                .replace(
                    "{}",
                    ((snapshot.get("meta") or {}).get("algorithm") or {}).get("name")
                    or "iterativo",
                )
            )
        blocks.append(
            {
                "kind": "paragraph",
                "text": behaviour
                or localize(
                    i18n,
                    "La evidencia disponible describe un comportamiento lineal estable por caso.",
                    "Available evidence describes stable linear behavior across cases.",
                ),
            }
        )
    else:
        blocks.append(
            {
                "kind": "paragraph",
                "text": (
                    f"Este reporte describe de forma pedagógica el análisis de {((snapshot.get('meta') or {}).get('algorithm') or {}).get('name')}."
                    if i18n["locale"] == "es"
                    else f"This report presents a pedagogical walkthrough of the analysis for {((snapshot.get('meta') or {}).get('algorithm') or {}).get('name')}."
                ),
            }
        )
    blocks.append({"kind": "paragraph", "text": i18n["parseSummaryOk"]})
    global_cases = (snapshot.get("globalResult") or {}).get("cases") or {}
    available_cases = [
        case_name for case_name in CASE_ORDER if global_cases.get(case_name)
    ]
    if available_cases:
        complexity_by_case = [
            {
                "caseName": case_name,
                "complexity": pick_case_complexity(snapshot, case_name)
                or i18n["notAvailable"],
            }
            for case_name in available_cases
        ]
        complexity_set = {entry["complexity"] for entry in complexity_by_case}
        blocks.append(
            {
                "kind": "table",
                "table": DocumentTable(
                    title=localize(
                        i18n,
                        "Resumen comparativo por caso",
                        "Comparative summary by case",
                    ),
                    headers=[
                        localize(i18n, "Caso", "Case"),
                        localize(i18n, "Complejidad final", "Final complexity"),
                    ],
                    rows=[
                        [_case_label(entry["caseName"], i18n), entry["complexity"]]
                        for entry in complexity_by_case
                    ],
                    align=["center", "center"],
                ),
            }
        )
        if len(complexity_set) == 1 and len(available_cases) == 3:
            only_value = next(iter(complexity_set))
            blocks.append(
                {
                    "kind": "paragraph",
                    "text": localize(
                        i18n,
                        f"La complejidad final es la misma para peor, mejor y promedio: {only_value}.",
                        f"Final complexity is the same for worst, best, and average cases: {only_value}.",
                    ),
                }
            )
    warning_items = maybe_list(
        warning.get("message")
        for warning in (((snapshot.get("meta") or {}).get("warnings")) or [])
        if isinstance(warning, dict)
    )
    if warning_items:
        blocks.append(
            {
                "kind": "paragraph",
                "text": localize(
                    i18n, "Advertencias detectadas:", "Detected warnings:"
                ),
            }
        )
        blocks.append({"kind": "list", "items": warning_items})
    return DocumentSection(
        id="executive-summary", title=i18n["executiveSummaryTitle"], blocks=blocks
    )


def _build_pseudocode_section(snapshot: Dict[str, Any]) -> DocumentSection:
    return DocumentSection(
        id="pseudocode",
        title=((snapshot.get("meta") or {}).get("algorithm") or {}).get("name")
        or "algorithm",
        blocks=[
            {
                "kind": "code",
                "language": "text",
                "code": ((snapshot.get("input") or {}).get("originalPseudocode")) or "",
            }
        ],
    )


def _build_global_result_section(
    snapshot: Dict[str, Any], i18n: Dict[str, Any]
) -> DocumentSection:
    blocks: List[Dict[str, Any]] = []
    global_cases = (snapshot.get("globalResult") or {}).get("cases") or {}
    available_cases = [
        case_name for case_name in CASE_ORDER if global_cases.get(case_name)
    ]
    complexity_by_case = [
        {
            "caseName": case_name,
            "complexity": pick_case_complexity(snapshot, case_name)
            or i18n["notAvailable"],
        }
        for case_name in available_cases
    ]
    same_complexity = (
        len(available_cases) == 3
        and len({entry["complexity"] for entry in complexity_by_case}) == 1
    )
    if same_complexity:
        value = complexity_by_case[0]["complexity"]
        blocks.extend(
            [
                {
                    "kind": "subsection",
                    "title": localize(
                        i18n,
                        "Complejidad final (peor/mejor/promedio)",
                        "Final complexity (worst/best/average)",
                    ),
                },
                {
                    "kind": "formula",
                    "label": i18n["pedagogicalFinalComplexityLabel"],
                    "formula": value,
                },
                {
                    "kind": "paragraph",
                    "text": localize(
                        i18n,
                        "Esta complejidad aplica por igual a los tres casos.",
                        "This complexity applies equally to all three cases.",
                    ),
                },
            ]
        )
    else:
        for case_name in CASE_ORDER:
            result = global_cases.get(case_name)
            if not result:
                continue
            asymptotic = (
                result.get("big_theta")
                or result.get("big_o")
                or result.get("big_omega")
                or result.get("T_polynomial")
            )
            blocks.append(
                {
                    "kind": "subsection",
                    "title": f"{i18n['pedagogicalCaseTitle']}: {_case_label(case_name, i18n)}",
                }
            )
            if asymptotic:
                blocks.append(
                    {
                        "kind": "formula",
                        "label": i18n["pedagogicalFinalComplexityLabel"],
                        "formula": asymptotic,
                    }
                )
            steps = maybe_list(result.get("explanationSteps") or [])
            if steps:
                blocks.append(
                    {
                        "kind": "paragraph",
                        "text": localize(
                            i18n, "Desarrollo paso a paso:", "Step-by-step development:"
                        ),
                    }
                )
                blocks.append(
                    {
                        "kind": "list",
                        "items": [
                            _localize_analysis_text(item, i18n) for item in steps
                        ],
                    }
                )
    if not blocks:
        blocks.append({"kind": "paragraph", "text": i18n["pedagogicalNoData"]})
    return DocumentSection(
        id="global-result", title=i18n["globalResultTitle"], blocks=blocks
    )


def _build_hybrid_process_section(
    snapshot: Dict[str, Any], i18n: Dict[str, Any]
) -> DocumentSection:
    blocks: List[Dict[str, Any]] = [
        {
            "kind": "paragraph",
            "text": localize(
                i18n,
                "El algoritmo híbrido combina una estructura de control iterativa con decisiones/llamadas recursivas. Para evitar duplicidad, este reporte prioriza el desarrollo recursivo completo y resume la interacción híbrida en una sola capa de proceso.",
                "This hybrid algorithm combines iterative control flow with recursive calls/decisions. To avoid duplication, this report prioritizes the full recursive walkthrough and summarizes hybrid interaction in a single process layer.",
            ),
        },
        {
            "kind": "subsection",
            "title": localize(
                i18n, "Proceso de análisis híbrido", "Hybrid analysis process"
            ),
        },
        {
            "kind": "list",
            "items": [
                localize(
                    i18n,
                    "Se identifica la parte iterativa como mecanismo de recorrido/control.",
                    "The iterative part is identified as the traversal/control mechanism.",
                ),
                localize(
                    i18n,
                    "Se identifica la parte recursiva como el núcleo de complejidad y derivación formal.",
                    "The recursive part is identified as the core of complexity and formal derivation.",
                ),
                localize(
                    i18n,
                    "Se valida el método recursivo seleccionado y su trazabilidad paso a paso.",
                    "The selected recursive method and its step-by-step traceability are validated.",
                ),
                localize(
                    i18n,
                    "Se reporta la complejidad final por caso y advertencias de cobertura.",
                    "Final complexity is reported by case along with coverage warnings.",
                ),
            ],
        },
    ]
    global_cases = (snapshot.get("globalResult") or {}).get("cases") or {}
    available_cases = [
        case_name for case_name in CASE_ORDER if global_cases.get(case_name)
    ]
    if available_cases:
        blocks.extend(
            [
                {
                    "kind": "subsection",
                    "title": localize(i18n, "Complejidad por caso", "Case complexity"),
                },
                {
                    "kind": "table",
                    "table": DocumentTable(
                        headers=[
                            i18n["caseHeaderLabel"],
                            i18n["pedagogicalFinalComplexityLabel"],
                        ],
                        rows=[
                            [
                                _case_label(case_name, i18n),
                                pick_case_complexity(snapshot, case_name)
                                or i18n["notAvailable"],
                            ]
                            for case_name in available_cases
                        ],
                        align=["left", "left"],
                    ),
                },
            ]
        )
    recursive = snapshot.get("recursive") or {}
    selected_method_section = (
        (recursive.get("data") or {}).get("selectedMethod")
    ) or {}
    if is_section_available(selected_method_section):
        method = selected_method_section.get("data")
        blocks.append(
            {
                "kind": "paragraph",
                "text": localize(
                    i18n,
                    f"Método recursivo priorizado: {_method_label(method, i18n)}.",
                    f"Prioritized recursive method: {_method_label(method, i18n)}.",
                ),
            }
        )
    return DocumentSection(
        id="hybrid-process",
        title=localize(i18n, "Proceso Híbrido", "Hybrid Process"),
        blocks=blocks,
    )


class _IterativeTraceStep(Dict[str, Any]):
    pass


def _normalize_iterative_trace_steps(steps: Iterable[Any]) -> List[_IterativeTraceStep]:
    normalized: List[_IterativeTraceStep] = []
    for index, raw_item in enumerate(steps):
        raw = _as_record(raw_item)
        if not raw:
            continue
        iteration_raw = _as_record(raw.get("iteration"))
        iteration = None
        if iteration_raw:
            iteration = {}
            if (
                isinstance(iteration_raw.get("loopVar"), str)
                and iteration_raw["loopVar"].strip()
            ):
                iteration["loopVar"] = iteration_raw["loopVar"]
            current_value = _as_number(iteration_raw.get("currentValue"))
            max_value = _as_number(iteration_raw.get("maxValue"))
            iteration_index = _as_number(
                iteration_raw.get("iteration", iteration_raw.get("index"))
            )
            if current_value is not None:
                iteration["currentValue"] = current_value
            if max_value is not None:
                iteration["maxValue"] = max_value
            if iteration_index is not None:
                iteration["iteration"] = iteration_index
        normalized.append(
            _IterativeTraceStep(
                stepNumber=_as_number(raw.get("step_number", raw.get("stepNumber")))
                or (index + 1),
                line=_as_number(raw.get("line")),
                eventKind=str(raw.get("eventKind") or raw.get("kind") or "other"),
                description=str(raw.get("description") or "").strip(),
                variables=_as_record(
                    raw.get("variablesSnapshot") or raw.get("variables")
                )
                or {},
                variablesChanged=_as_record(
                    raw.get("variables_changed") or raw.get("variablesChanged")
                )
                or None,
                iteration=iteration,
                cost=raw.get("cost") if isinstance(raw.get("cost"), str) else None,
            )
        )
    return sorted(normalized, key=lambda step: step["stepNumber"])


def _format_state_value(value: Any) -> str:
    if value is None:
        return "null"
    if value == "__undefined__":
        return "-"
    if isinstance(value, str):
        return value
    if isinstance(value, (int, float, bool)):
        return str(value)
    if isinstance(value, list):
        preview = ", ".join(_format_state_value(item) for item in value[:5])
        return f"[{preview}{', ...' if len(value) > 5 else ''}]"
    if isinstance(value, dict):
        items = list(value.items())[:3]
        preview = ", ".join(
            f"{key}:{_format_state_value(nested)}" for key, nested in items
        )
        return f"{{{preview}{', ...' if len(value) > 3 else ''}}}"
    return str(value)


def _event_label(event_kind: str, i18n: Dict[str, Any]) -> str:
    labels = {
        "assign": ("Actualización", "Assignment"),
        "condition_eval": ("Evaluación de condición", "Condition evaluation"),
        "loop_enter": ("Entrada al ciclo", "Loop entry"),
        "loop_iter_enter": ("Inicio de iteración", "Iteration start"),
        "loop_iter_exit": ("Fin de iteración", "Iteration end"),
        "loop_exit": ("Salida del ciclo", "Loop exit"),
        "return_emit": ("Return", "Return"),
        "call_enter": ("Entrada a llamada", "Call enter"),
        "call_exit": ("Salida de llamada", "Call exit"),
        "print": ("Impresión", "Print"),
        "enter_block": ("Entrada a bloque", "Block entry"),
        "end": ("Fin", "End"),
    }
    es_text, en_text = labels.get(event_kind, (event_kind, event_kind))
    return localize(i18n, es_text, en_text)


def _build_changes(
    step: _IterativeTraceStep, previous: Optional[_IterativeTraceStep]
) -> List[Dict[str, Any]]:
    changes_raw = step.get("variablesChanged") or {}
    if changes_raw:
        return [
            {
                "name": name,
                "before": (
                    (previous or {}).get("variables", {}).get(name)
                    if previous
                    else None
                ),
                "after": after,
            }
            for name, after in changes_raw.items()
        ]
    return []


def _pick_relevant_state_variable_names(
    selected_loop: Optional[Dict[str, Any]], steps: List[_IterativeTraceStep]
) -> List[str]:
    preferred: List[str] = []
    seen: set[str] = set()
    for group in (
        (selected_loop or {}).get("controlVariables") or [],
        (selected_loop or {}).get("stateVariables") or [],
    ):
        for name in group:
            normalized = str(name or "").strip()
            if normalized and normalized not in seen:
                seen.add(normalized)
                preferred.append(normalized)
    change_frequency: Dict[str, int] = {}
    for index, step in enumerate(steps):
        previous = steps[index - 1] if index > 0 else None
        for change in _build_changes(step, previous):
            change_frequency[change["name"]] = (
                change_frequency.get(change["name"], 0) + 1
            )
    for name, _ in sorted(
        change_frequency.items(), key=lambda item: (-item[1], item[0])
    ):
        if name not in seen:
            seen.add(name)
            preferred.append(name)
        if len(preferred) >= 3:
            break
    if not preferred and steps:
        for name in list((steps[0].get("variables") or {}).keys())[:2]:
            if name not in seen:
                preferred.append(name)
    return preferred[:3]


def _build_relevant_state_snapshot(
    step: _IterativeTraceStep,
    relevant_names: List[str],
    previous: Optional[_IterativeTraceStep],
) -> str:
    values = [
        f"{name}={_format_state_value((step.get('variables') or {}).get(name))}"
        for name in relevant_names
        if name in (step.get("variables") or {})
    ]
    if not values:
        return "-"
    current = ", ".join(values)
    if not previous:
        return current
    previous_values = [
        f"{name}={_format_state_value((previous.get('variables') or {}).get(name))}"
        for name in relevant_names
        if name in (previous.get("variables") or {})
    ]
    return "-" if current == ", ".join(previous_values) else current


def _stable_value_fingerprint(value: Any) -> str:
    try:
        return json.dumps(value, ensure_ascii=False, sort_keys=True)
    except TypeError:
        return str(value)


def _pick_stable_trace_inputs(
    steps: List[_IterativeTraceStep], excluded_names: set[str]
) -> List[Dict[str, Any]]:
    if not steps:
        return []
    first_variables = steps[0].get("variables") or {}
    stable: List[Dict[str, Any]] = []
    for name, initial_value in first_variables.items():
        if name in excluded_names:
            continue
        fingerprint = _stable_value_fingerprint(initial_value)
        is_stable = True
        for step in steps:
            variables = step.get("variables") or {}
            if (
                name not in variables
                or _stable_value_fingerprint(variables[name]) != fingerprint
            ):
                is_stable = False
                break
        if is_stable:
            stable.append({"name": name, "value": initial_value})
    return stable


def _build_step_context(step: _IterativeTraceStep, i18n: Dict[str, Any]) -> str:
    iteration = step.get("iteration") or {}
    if step["eventKind"] == "loop_enter" and iteration.get("loopVar"):
        return f"{iteration['loopVar']}={iteration.get('currentValue', '?')}..{iteration.get('maxValue', '?')}"
    if step["eventKind"] in {"loop_iter_enter", "loop_iter_exit"} and iteration.get(
        "loopVar"
    ):
        return localize(
            i18n,
            f"iteración {iteration.get('iteration', '?')} ({iteration['loopVar']}={iteration.get('currentValue', '?')})",
            f"iteration {iteration.get('iteration', '?')} ({iteration['loopVar']}={iteration.get('currentValue', '?')})",
        )
    return step.get("description") or "-"


def _build_state_change_text(
    step: _IterativeTraceStep, previous: Optional[_IterativeTraceStep]
) -> str:
    changes = _build_changes(step, previous)[:3]
    return (
        ", ".join(
            f"{change['name']}: {_format_state_value(change['before'])} -> {_format_state_value(change['after'])}"
            for change in changes
        )
        or "-"
    )


def _build_case_trace_executive_items(
    snapshot: Dict[str, Any],
    steps: List[_IterativeTraceStep],
    selected_loop: Optional[Dict[str, Any]],
    case_name: str,
    i18n: Dict[str, Any],
) -> Dict[str, Any]:
    loop_enter_step = next(
        (step for step in steps if step["eventKind"] == "loop_enter"), None
    )
    iteration_steps = [step for step in steps if step["eventKind"] == "loop_iter_enter"]
    first_iteration = iteration_steps[0] if iteration_steps else None
    last_iteration = iteration_steps[-1] if iteration_steps else None
    control_variable = (
        ((loop_enter_step or {}).get("iteration") or {}).get("loopVar")
        or ((first_iteration or {}).get("iteration") or {}).get("loopVar")
        or (
            ((selected_loop or {}).get("controlVariables") or [i18n["notAvailable"]])[0]
        )
    )
    min_control = (
        ((loop_enter_step or {}).get("iteration") or {}).get("currentValue")
    ) or (((first_iteration or {}).get("iteration") or {}).get("currentValue"))
    max_control = (
        (((loop_enter_step or {}).get("iteration") or {}).get("maxValue"))
        or (((last_iteration or {}).get("iteration") or {}).get("currentValue"))
        or (((first_iteration or {}).get("iteration") or {}).get("maxValue"))
    )
    control_range = (
        localize(
            i18n,
            f"{control_variable} de {min_control} a {max_control}",
            f"{control_variable} from {min_control} to {max_control}",
        )
        if isinstance(min_control, int) and isinstance(max_control, int)
        else i18n["notAvailable"]
    )
    return_step = next(
        (step for step in reversed(steps) if step["eventKind"] == "return_emit"), None
    )
    return_value = re.sub(
        r"^RETURN\s*", "", (return_step or {}).get("description") or "", flags=re.I
    ).strip() or ((return_step or {}).get("description") or i18n["notAvailable"])
    excluded_names = (
        {control_variable}
        if control_variable and control_variable != i18n["notAvailable"]
        else set()
    )
    stable_inputs = _pick_stable_trace_inputs(steps, excluded_names)
    scalar_inputs = [
        entry for entry in stable_inputs if not isinstance(entry["value"], (list, dict))
    ]
    tabulated_inputs = [
        entry for entry in stable_inputs if isinstance(entry["value"], list)
    ]
    scalar_summary = (
        ", ".join(
            f"{entry['name']}={_format_state_value(entry['value'])}"
            for entry in scalar_inputs
        )
        or i18n["notAvailable"]
    )
    tabulated_summary = ", ".join(
        f"{entry['name']}={_format_state_value(entry['value'])}"
        for entry in tabulated_inputs
    ) or localize(i18n, "no reportados en el trace", "not reported in trace")
    return {
        "header": localize(
            i18n,
            f"Seguimiento de ejecución (caso {_case_label(case_name, i18n)})",
            f"Execution trace ({_case_label(case_name, i18n)} case)",
        ),
        "items": [
            ((snapshot.get("meta") or {}).get("algorithm") or {}).get("name")
            or "algorithm",
            f"{localize(i18n, 'Total de pasos observados', 'Total observed steps')}: {len(steps)}",
            f"{localize(i18n, 'Total de iteraciones observadas del FOR', 'Observed FOR iterations')}: {len(iteration_steps)}",
            f"{localize(i18n, 'Variable de control', 'Control variable')}: {control_range}",
            f"{localize(i18n, 'Valores de entrada detectados', 'Detected input values')}: {scalar_summary}",
            f"{localize(i18n, 'Valores tabulados detectados', 'Detected tabulated values')}: {tabulated_summary}",
            f"{localize(i18n, 'Valor retornado', 'Returned value')}: {return_value}",
        ],
    }


def _build_iterative_trace_table(
    steps: List[_IterativeTraceStep],
    relevant_state_variables: List[str],
    line_cost_by_line: Dict[int, str],
    i18n: Dict[str, Any],
) -> DocumentTable:
    headers = (
        [
            "Paso",
            "Línea",
            "Evento",
            "Contexto",
            "Cambio de estado",
            "Estado relevante",
            "Costo",
        ]
        if i18n["locale"] == "es"
        else [
            "Step",
            "Line",
            "Event",
            "Context",
            "State change",
            "Relevant state",
            "Cost",
        ]
    )
    rows = []
    for index, step in enumerate(steps):
        previous = steps[index - 1] if index > 0 else None
        line = step.get("line")
        rows.append(
            [
                str(step["stepNumber"]),
                "-" if line is None else str(line),
                _event_label(step["eventKind"], i18n),
                _build_step_context(step, i18n),
                _build_state_change_text(step, previous),
                _build_relevant_state_snapshot(
                    step, relevant_state_variables, previous
                ),
                (
                    line_cost_by_line.get(line, step.get("cost") or "-")
                    if isinstance(line, int)
                    else (step.get("cost") or "-")
                ),
            ]
        )
    return DocumentTable(headers=headers, rows=rows)


def _build_line_cost_map(line_costs: List[Dict[str, Any]]) -> Dict[int, str]:
    mapping: Dict[int, str] = {}
    for row in line_costs:
        if not isinstance(row, dict):
            continue
        line = row.get("line")
        ck = str(row.get("ck") or "").strip()
        if isinstance(line, int) and ck and line not in mapping:
            mapping[line] = ck
    return mapping


def _summarize_step_for_timeline(
    step: _IterativeTraceStep, previous: Optional[_IterativeTraceStep]
) -> Optional[str]:
    if step["eventKind"] == "assign":
        changes = _build_changes(step, previous)
        if changes:
            return f"{changes[0]['name']} <- {_format_state_value(changes[0]['after'])}"
    if step["eventKind"] == "return_emit":
        return step.get("description") or "RETURN"
    if step["eventKind"] == "condition_eval":
        return step.get("description") or None
    return None


def _build_iterative_grouped_timeline_blocks(
    steps: List[_IterativeTraceStep], i18n: Dict[str, Any]
) -> List[Dict[str, Any]]:
    if not steps:
        return []
    blocks: List[Dict[str, Any]] = []
    first_loop_enter_index = next(
        (
            index
            for index, step in enumerate(steps)
            if step["eventKind"] == "loop_enter"
        ),
        -1,
    )
    initialization_slice = (
        steps[:first_loop_enter_index] if first_loop_enter_index > 0 else []
    )
    initialization_items = []
    for index, step in enumerate(initialization_slice):
        summary = _summarize_step_for_timeline(
            step, initialization_slice[index - 1] if index > 0 else None
        )
        if summary:
            initialization_items.append(summary)
    if initialization_items:
        blocks.extend(
            [
                {
                    "kind": "heading",
                    "text": localize(
                        i18n, "Nivel 1: Inicialización", "Level 1: Initialization"
                    ),
                },
                {"kind": "list", "items": initialization_items},
            ]
        )
    loop_enter_step = (
        steps[first_loop_enter_index] if first_loop_enter_index >= 0 else None
    )
    if loop_enter_step:
        iteration_data = loop_enter_step.get("iteration") or {}
        loop_var = iteration_data.get("loopVar") or "i"
        min_value = iteration_data.get("currentValue", "?")
        max_value = iteration_data.get("maxValue", "?")
        blocks.append(
            {
                "kind": "heading",
                "text": localize(
                    i18n,
                    f"Nivel 1: Bucle FOR {loop_var} <- {min_value} TO {max_value}",
                    f"Level 1: FOR loop {loop_var} <- {min_value} TO {max_value}",
                ),
            }
        )
        outer_loop_body_items: List[str] = []
        iteration_groups: List[Dict[str, Any]] = []
        current_iteration: Optional[Dict[str, Any]] = None
        for index in range(first_loop_enter_index + 1, len(steps)):
            step = steps[index]
            if step["eventKind"] == "loop_iter_enter":
                if current_iteration:
                    iteration_groups.append(current_iteration)
                current_iteration = {
                    "title": localize(
                        i18n,
                        f"Nivel 2: Iteración {(step.get('iteration') or {}).get('iteration', '?')} ({(step.get('iteration') or {}).get('loopVar', 'i')} = {(step.get('iteration') or {}).get('currentValue', '?')})",
                        f"Level 2: Iteration {(step.get('iteration') or {}).get('iteration', '?')} ({(step.get('iteration') or {}).get('loopVar', 'i')} = {(step.get('iteration') or {}).get('currentValue', '?')})",
                    ),
                    "items": [],
                }
                continue
            if step["eventKind"] in {"loop_iter_exit", "loop_exit"}:
                continue
            if step["eventKind"] == "return_emit":
                break
            summary = _summarize_step_for_timeline(
                step, steps[index - 1] if index > 0 else None
            )
            if not summary:
                continue
            if current_iteration:
                current_iteration["items"].append(summary)
            else:
                outer_loop_body_items.append(summary)
        if current_iteration:
            iteration_groups.append(current_iteration)
        if outer_loop_body_items:
            blocks.extend(
                [
                    {
                        "kind": "heading",
                        "text": localize(
                            i18n,
                            "Nivel 2: Cuerpo general del ciclo",
                            "Level 2: General loop body",
                        ),
                    },
                    {"kind": "list", "items": outer_loop_body_items},
                ]
            )
        for group in iteration_groups:
            blocks.extend(
                [
                    {"kind": "heading", "text": group["title"]},
                    {
                        "kind": "list",
                        "items": group["items"]
                        or [
                            localize(
                                i18n, "Sin cambios relevantes", "No relevant changes"
                            )
                        ],
                    },
                ]
            )
    return_step = next(
        (step for step in reversed(steps) if step["eventKind"] == "return_emit"), None
    )
    if return_step:
        blocks.extend(
            [
                {
                    "kind": "heading",
                    "text": localize(i18n, "Nivel 1: Retorno", "Level 1: Return"),
                },
                {"kind": "list", "items": [return_step.get("description") or "RETURN"]},
            ]
        )
    return blocks


def _build_iterative_invariant_section(
    snapshot: Dict[str, Any], i18n: Dict[str, Any]
) -> Optional[DocumentSection]:
    iterative = snapshot.get("iterative") or {}
    if not is_section_available(iterative):
        status_block = build_status_block("iterative", iterative, i18n)
        if not status_block:
            return None
        return DocumentSection(
            id="iterative-invariant",
            title=localize(i18n, "Invariante del Ciclo", "Loop Invariant"),
            blocks=[status_block],
        )
    loop_invariant_section = ((iterative.get("data") or {}).get("loopInvariant")) or {}
    blocks: List[Dict[str, Any]] = []
    if not is_section_available(loop_invariant_section):
        status_block = build_status_block(
            "iterative.loopInvariant", loop_invariant_section, i18n
        )
        if status_block:
            blocks.append(status_block)
        return DocumentSection(
            id="iterative-invariant",
            title=localize(i18n, "Invariante del Ciclo", "Loop Invariant"),
            blocks=blocks or [{"kind": "paragraph", "text": i18n["pedagogicalNoData"]}],
        )
    payload = loop_invariant_section.get("data") or {}
    selected_loop = _as_record(payload.get("selectedLoop"))
    selected_loop_lines = _extract_selected_loop_lines(
        ((snapshot.get("input") or {}).get("originalPseudocode")) or "", selected_loop
    )
    blocks.extend(
        [
            {
                "kind": "subsection",
                "title": localize(i18n, "Ciclo seleccionado", "Selected loop"),
            },
            (
                {
                    "kind": "institutionalCode",
                    "lines": selected_loop_lines,
                }
                if selected_loop_lines
                else {
                    "kind": "paragraph",
                    "text": localize(
                        i18n,
                        "No fue posible serializar el ciclo seleccionado con las líneas esperadas.",
                        "The selected loop could not be serialized with the expected line range.",
                    ),
                }
            ),
            {
                "kind": "subsection",
                "title": localize(
                    i18n, "Propiedad del invariante", "Invariant property"
                ),
            },
            {
                "kind": "paragraph",
                "text": safe(
                    ((payload.get("invariant") or {}).get("propertyStatement")),
                    i18n["notAvailable"],
                ),
            },
            {
                "kind": "subsection",
                "title": localize(i18n, "Demostración pedagógica", "Pedagogical proof"),
            },
            {
                "kind": "list",
                "items": [
                    f"{localize(i18n, 'Inicialización', 'Initialization')}: {_strip_leading_label(safe(((payload.get('invariant') or {}).get('initialization')), i18n['notAvailable']), ['Inicialización', 'Initialization'])}",
                    f"{localize(i18n, 'Mantenimiento', 'Maintenance')}: {_strip_leading_label(safe(((payload.get('invariant') or {}).get('maintenance')), i18n['notAvailable']), ['Mantenimiento', 'Maintenance'])}",
                    f"{localize(i18n, 'Finalización', 'Finalization')}: {_strip_leading_label(safe(((payload.get('invariant') or {}).get('finalization')), i18n['notAvailable']), ['Finalización', 'Finalization'])}",
                ],
            },
            {
                "kind": "emphasis",
                "text": _normalize_didactic_summary_text(
                    safe(payload.get("didacticSummary"), i18n["notAvailable"])
                ),
            },
            {
                "kind": "subsection",
                "title": localize(i18n, "Resumen técnico", "Technical summary"),
            },
            {
                "kind": "list",
                "items": [
                    f"{localize(i18n, 'Patrón detectado', 'Detected pattern')}: {safe((selected_loop or {}).get('patternType'), i18n['notAvailable'])}",
                    f"{localize(i18n, 'Tipo de ciclo', 'Loop type')}: {safe((selected_loop or {}).get('nodeType'), i18n['notAvailable'])}",
                    f"{localize(i18n, 'Líneas seleccionadas', 'Selected lines')}: {safe((selected_loop or {}).get('lineStart'), '?')} - {safe((selected_loop or {}).get('lineEnd'), '?')}",
                    f"{localize(i18n, 'Variante', 'Variant')}: {safe(((payload.get('evidence') or {}).get('templateVariant')), i18n['notAvailable'])}",
                    f"{localize(i18n, 'Confianza', 'Confidence')}: {safe(((payload.get('evidence') or {}).get('classificationConfidence')), i18n['notAvailable'])}",
                ],
            },
        ]
    )
    return DocumentSection(
        id="iterative-invariant",
        title=localize(i18n, "Invariante del Ciclo", "Loop Invariant"),
        blocks=blocks,
    )


def _build_iterative_case_analysis_section(
    snapshot: Dict[str, Any], i18n: Dict[str, Any]
) -> Optional[DocumentSection]:
    iterative = snapshot.get("iterative") or {}
    if not is_section_available(iterative):
        status_block = build_status_block("iterative", iterative, i18n)
        if not status_block:
            return None
        return DocumentSection(
            id="iterative-cases",
            title=localize(i18n, "Análisis por Casos", "Case Analysis"),
            blocks=[status_block],
        )
    data = iterative.get("data") or {}
    blocks: List[Dict[str, Any]] = []
    global_cases = (snapshot.get("globalResult") or {}).get("cases") or {}
    for case_name in CASE_ORDER:
        line_costs = list((data.get("lineCostTable") or {}).get(case_name) or [])
        case_step_bundle = (data.get("caseStepByStep") or {}).get(case_name) or {}
        case_walkthrough = [
            step
            for step in ((case_step_bundle or {}).get("steps") or [])
            if isinstance(step, dict)
            and (
                not isinstance(step.get("payload"), dict)
                or (step.get("payload") or {}).get("reportable") is not False
            )
        ]
        asymptotic_procedure = maybe_list(
            (data.get("asymptoticProcedure") or {}).get(case_name) or []
        )
        global_case = global_cases.get(case_name) or {}
        if (
            not global_case
            and not line_costs
            and not asymptotic_procedure
            and not case_walkthrough
        ):
            continue
        blocks.extend(
            [
                {"kind": "subsection", "title": _case_label(case_name, i18n)},
                {
                    "kind": "heading",
                    "text": localize(
                        i18n,
                        "Conteo por línea y procedimiento",
                        "Per-line count and procedure",
                    ),
                },
                (
                    {"kind": "table", "table": _build_line_cost_table(line_costs, i18n)}
                    if line_costs
                    else {"kind": "paragraph", "text": i18n["pedagogicalNoData"]}
                ),
            ]
        )
        if case_walkthrough:
            blocks.append(
                {
                    "kind": "subsection",
                    "title": localize(
                        i18n, "Desarrollo paso a paso", "Step-by-step walkthrough"
                    ),
                }
            )
            for step in case_walkthrough:
                blocks.append(
                    {
                        "kind": "pedagogicalStep",
                        "step": {
                            "index": step.get("index"),
                            "title": _localize_analysis_text(step.get("title"), i18n),
                            "status": step.get("status"),
                            "formula": normalize_recursive_formula(
                                ((step.get("math") or {}).get("primaryLatex"))
                            ),
                            "explanation": _build_recursive_step_explanation(
                                step.get("summary"), step.get("conceptNote"), i18n
                            ),
                            "warning": _localize_analysis_text(
                                step.get("warning"), i18n
                            )
                            or None,
                            "supportReason": _localize_analysis_text(
                                (
                                    ((step.get("derivation") or {}).get("supportReason"))
                                    if isinstance(step.get("derivation"), dict)
                                    else None
                                ),
                                i18n,
                            )
                            or None,
                        },
                    }
                )
            continue

        count_sum = _build_count_summation_expression(line_costs)
        count_formula = (
            f"{count_sum['structural']} = {count_sum['simplified']}"
            if count_sum["simplified"]
            else count_sum["structural"]
        )
        final_complexity = (
            global_case.get("big_theta")
            or global_case.get("big_o")
            or global_case.get("big_omega")
        )
        simplified_cost = global_case.get("T_polynomial") or global_case.get("T_open")
        blocks.extend(
            [
                {
                    "kind": "heading",
                    "text": localize(
                        i18n, "Suma de conteos por línea", "Sum of per-line counts"
                    ),
                },
                {"kind": "formula", "formula": count_formula},
                {
                    "kind": "heading",
                    "text": localize(i18n, "Costo total T(n)", "Total cost T(n)"),
                },
                {
                    "kind": "formula",
                    "formula": _build_total_cost_expression(line_costs),
                },
                {
                    "kind": "heading",
                    "text": localize(
                        i18n, "Forma simplificada del costo", "Simplified cost form"
                    ),
                },
                {
                    "kind": "formula",
                    "formula": (
                        _ensure_tn_prefix(simplified_cost)
                        if simplified_cost
                        else i18n["notAvailable"]
                    ),
                },
                {
                    "kind": "heading",
                    "text": localize(
                        i18n, "Paso a complejidad asintótica", "Asymptotic transition"
                    ),
                },
                {
                    "kind": "list",
                    "items": asymptotic_procedure
                    or [
                        localize(
                            i18n,
                            "Se identifica el término dominante del costo simplificado para obtener la clase asintótica.",
                            "The dominant term from the simplified cost determines the asymptotic class.",
                        )
                    ],
                },
                {
                    "kind": "heading",
                    "text": localize(i18n, "Complejidad final", "Final complexity"),
                },
                {
                    "kind": "formula",
                    "formula": (
                        _ensure_tn_prefix(final_complexity)
                        if final_complexity
                        else i18n["notAvailable"]
                    ),
                },
            ]
        )
    if not blocks:
        blocks.append({"kind": "paragraph", "text": i18n["pedagogicalNoData"]})
    return DocumentSection(
        id="iterative-cases",
        title=localize(i18n, "Análisis por Casos", "Case Analysis"),
        blocks=blocks,
    )


def _build_iterative_trace_section(
    snapshot: Dict[str, Any], i18n: Dict[str, Any]
) -> Optional[DocumentSection]:
    iterative = snapshot.get("iterative") or {}
    if not is_section_available(iterative):
        status_block = build_status_block("iterative", iterative, i18n)
        if not status_block:
            return None
        return DocumentSection(
            id="iterative-trace", title=i18n["traceTitle"], blocks=[status_block]
        )
    data = iterative.get("data") or {}
    trace_section = data.get("trace") or {}
    blocks: List[Dict[str, Any]] = []
    if not is_section_available(trace_section):
        status_block = build_status_block("iterative.trace", trace_section, i18n)
        if status_block:
            blocks.append(status_block)
        return DocumentSection(
            id="iterative-trace",
            title=i18n["traceTitle"],
            blocks=blocks or [{"kind": "paragraph", "text": i18n["pedagogicalNoData"]}],
        )
    trace_cases = [
        {
            "caseName": case_name,
            "steps": _normalize_iterative_trace_steps(
                (((trace_section.get("data") or {}).get(case_name)) or {}).get("steps")
                or []
            ),
        }
        for case_name in CASE_ORDER
        if (((trace_section.get("data") or {}).get(case_name)) or {}).get("steps")
    ]
    representative = next(
        (entry for entry in trace_cases if entry["caseName"] == "worst"), None
    )
    if not representative:
        return DocumentSection(
            id="iterative-trace",
            title=i18n["traceTitle"],
            blocks=[
                {
                    "kind": "paragraph",
                    "text": localize(
                        i18n,
                        "Seguimiento del peor caso no disponible.",
                        "Worst-case trace is not available.",
                    ),
                }
            ],
        )
    loop_invariant_payload = (
        ((data.get("loopInvariant") or {}).get("data"))
        if is_section_available(data.get("loopInvariant") or {})
        else None
    )
    selected_loop = _as_record((loop_invariant_payload or {}).get("selectedLoop"))
    relevant_state_variables = _pick_relevant_state_variable_names(
        selected_loop, representative["steps"]
    )
    worst_line_costs = list((data.get("lineCostTable") or {}).get("worst") or [])
    line_cost_by_line = _build_line_cost_map(worst_line_costs)
    executive = _build_case_trace_executive_items(
        snapshot,
        representative["steps"],
        selected_loop,
        representative["caseName"],
        i18n,
    )
    blocks.extend(
        [
            {
                "kind": "subsection",
                "title": localize(
                    i18n, "Capa 1: Resumen ejecutivo", "Layer 1: Executive summary"
                ),
            },
            {
                "kind": "paragraph",
                "text": localize(
                    i18n,
                    f"Caso analizado en detalle: {_case_label('worst', i18n)}.",
                    f"Case analyzed in detail: {_case_label('worst', i18n)}.",
                ),
            },
            {"kind": "list", "items": executive["items"]},
            {
                "kind": "subsection",
                "title": localize(
                    i18n,
                    "Capa 2: Tabla cronológica pedagógica",
                    "Layer 2: Pedagogical chronological table",
                ),
            },
            {
                "kind": "table",
                "table": _build_iterative_trace_table(
                    representative["steps"],
                    relevant_state_variables,
                    line_cost_by_line,
                    i18n,
                ),
            },
            {
                "kind": "subsection",
                "title": localize(
                    i18n,
                    "Capa 3: Vista agrupada por estructura de control",
                    "Layer 3: Control-structure grouped view",
                ),
            },
            {
                "kind": "paragraph",
                "text": localize(
                    i18n,
                    "La vista agrupada organiza la ejecución por inicialización, iteraciones y retorno para facilitar la trazabilidad.",
                    "The grouped view organizes execution by initialization, iterations, and return for traceability.",
                ),
            },
            *_build_iterative_grouped_timeline_blocks(representative["steps"], i18n),
        ]
    )
    return DocumentSection(
        id="iterative-trace", title=i18n["traceTitle"], blocks=blocks
    )


def _method_precision_label(precision: str, i18n: Dict[str, Any]) -> str:
    return {
        "high": localize(i18n, "alta", "high"),
        "medium": localize(i18n, "media", "medium"),
        "low": localize(i18n, "baja", "low"),
    }.get(precision, precision)


def _get_method_precision(
    method: str, recurrence_type: Optional[str], recommended: bool
) -> str:
    if recommended:
        return "high"
    if recurrence_type in {"divide_conquer", "divide_conquer_multi"}:
        if method in {"master", "recursion_tree"}:
            return "high"
        return "low"
    if recurrence_type == "linear_shift":
        if method == "characteristic_equation":
            return "high"
        if method == "iteration":
            return "medium"
        return "low"
    if method in {"master", "characteristic_equation"}:
        return "medium"
    return "low"


def _get_applicable_method_reason(
    method: str,
    recurrence_type: Optional[str],
    recommended: bool,
    recurrence_a: Optional[int],
    i18n: Dict[str, Any],
) -> str:
    divide_conquer = recurrence_type in {"divide_conquer", "divide_conquer_multi"}
    linear_shift = recurrence_type == "linear_shift"
    is_single_branch_divide_conquer = divide_conquer and recurrence_a == 1
    if recommended:
        return localize(
            i18n,
            (
                "Dentro de Divide y Vencerás, este método encaja de forma directa con la reducción por escala y permite justificar la cota con menos fricción algebraica."
                if divide_conquer
                else "Dentro de Resta y Vencerás, este método modela directamente la dependencia por desplazamientos y suele dar una derivación más estable."
            ),
            (
                "Within Divide y Vencerás, this method matches scale-based reduction directly and justifies the bound with less algebraic friction."
                if divide_conquer
                else "Within Resta y Vencerás, this method directly models shift-based dependence and usually yields a more stable derivation."
            ),
        )
    if divide_conquer and method == "recursion_tree":
        return localize(
            i18n,
            "En Divide y Vencerás sí aporta muchísimo: muestra costo por nivel y deja claro si domina la raíz, los niveles intermedios o las hojas.",
            "In Divide y Vencerás it is highly informative: it shows per-level cost and whether the root, middle levels, or leaves dominate.",
        )
    if divide_conquer and method == "iteration":
        return localize(
            i18n,
            (
                "Aplica por despliegue de términos y progresión geométrica en rama única. Aun así, puede hacerse largo si la recurrencia tiene muchos términos auxiliares."
                if is_single_branch_divide_conquer
                else "Puede aplicarse, pero requiere más manipulación simbólica para llegar a una cota limpia. Es útil para aprender la dinámica, no tanto para la vía más corta de resolución."
            ),
            (
                "It applies via term unrolling and geometric progression in a single branch. Still, it may become lengthy when the recurrence includes many auxiliary terms."
                if is_single_branch_divide_conquer
                else "It can be applied, but it requires heavier symbolic manipulation to reach a clean bound. Useful for understanding dynamics, not usually the shortest solving path."
            ),
        )
    if linear_shift and method == "iteration":
        return localize(
            i18n,
            "Aplica como alternativa al desplegar la recurrencia paso a paso. Es pedagógico para ver cómo se acumula el costo, aunque la ecuación característica suele cerrar más rápido.",
            "It applies as an alternative by unrolling the recurrence step by step. It is pedagogical to see cost accumulation, though characteristic equation usually closes faster.",
        )
    return localize(
        i18n,
        "Es compatible con la estructura detectada y produce resultados válidos, aunque existe otro método más directo para este caso.",
        "It is compatible with the detected structure and yields valid results, although another method is more direct for this case.",
    )


def _get_not_applicable_method_reason(
    method: str, recurrence_type: Optional[str], i18n: Dict[str, Any]
) -> str:
    divide_conquer = recurrence_type in {"divide_conquer", "divide_conquer_multi"}
    linear_shift = recurrence_type == "linear_shift"
    if method == "master" and linear_shift:
        return localize(
            i18n,
            "No aplica: Teorema Maestro es para Divide y Vencerás (subproblemas n/b). Aquí la familia es Resta y Vencerás / Resta y Serás Vencido, con decrementos n-1 o n-k.",
            "It does not apply: Master Theorem is for Divide y Vencerás (n/b subproblems). This case belongs to Resta y Vencerás / Resta y Get Defeated, with decrements n-1 or n-k.",
        )
    if method == "characteristic_equation" and divide_conquer:
        return localize(
            i18n,
            "No es la vía natural: ecuación característica describe mejor Resta y Vencerás (desplazamientos constantes). Este caso es Divide y Vencerás, donde Master o árbol explican mejor el crecimiento.",
            "Not the natural route: characteristic equation better describes Resta y Vencerás (constant shifts). This case is Divide y Vencerás, where Master or recursion tree explain growth better.",
        )
    if method == "recursion_tree" and linear_shift:
        return localize(
            i18n,
            "Aporta poca información adicional en este caso porque casi no hay ramificación: el árbol se vuelve una cadena. Métodos de recurrencia lineal (como ecuación característica) explican el mismo resultado con menos pasos.",
            "It adds little extra information here because there is almost no branching: the tree becomes a chain. Linear-recurrence methods (such as characteristic equation) explain the same result with fewer steps.",
        )
    if method == "iteration" and divide_conquer:
        return localize(
            i18n,
            "No se prioriza porque el despliegue iterativo crece rápido en complejidad algebraica cuando hay varias ramas recursivas. Master/árbol permiten razonar por niveles o por casos de forma más clara y verificable.",
            "It is not prioritized because iterative unrolling grows algebraically complex when multiple recursive branches exist. Master/tree allow clearer and more verifiable reasoning by levels or theorem cases.",
        )
    return localize(
        i18n,
        "No aplica de forma sólida para la estructura detectada: sus supuestos matemáticos no coinciden con cómo evoluciona el tamaño del subproblema.",
        "It does not apply robustly to the detected structure: its mathematical assumptions do not match how subproblem size evolves.",
    )


def _build_recursive_call_trace_summary(
    trace: Dict[str, Any], i18n: Dict[str, Any]
) -> List[str]:
    items: List[str] = []
    for case_name in CASE_ORDER:
        data = (trace or {}).get(case_name)
        if not isinstance(data, dict):
            continue
        summary = data.get("summary") if isinstance(data.get("summary"), dict) else {}
        diagnostics = (
            data.get("diagnostics") if isinstance(data.get("diagnostics"), dict) else {}
        )
        truncated = (
            localize(i18n, "trazado truncado", "trace truncated")
            if diagnostics.get("truncated")
            else localize(i18n, "trazado completo", "trace complete")
        )
        items.append(
            localize(
                i18n,
                f"{_case_label(case_name, i18n)}: {safe(summary.get('totalSteps'), '0')} pasos, {safe(summary.get('totalCalls'), '0')} llamadas, profundidad máxima {safe(summary.get('maxRecursionDepth'), '0')} ({truncated}).",
                f"{_case_label(case_name, i18n)}: {safe(summary.get('totalSteps'), '0')} steps, {safe(summary.get('totalCalls'), '0')} calls, max depth {safe(summary.get('maxRecursionDepth'), '0')} ({truncated}).",
            )
        )
    return items


def _build_recursive_step_explanation(
    summary: Optional[str], concept_note: Optional[str], i18n: Dict[str, Any]
) -> str:
    def unwrap(value: str) -> str:
        trimmed = value.strip()
        if trimmed.startswith("$$") and trimmed.endswith("$$") and len(trimmed) > 4:
            inner = trimmed[2:-2].strip()
            return (
                inner if re.search(r"[A-Za-zÀ-ÿ]", inner) and " " in inner else trimmed
            )
        if trimmed.startswith("$") and trimmed.endswith("$") and len(trimmed) > 2:
            inner = trimmed[1:-1].strip()
            return (
                inner if re.search(r"[A-Za-zÀ-ÿ]", inner) and " " in inner else trimmed
            )
        return trimmed

    summary_text = _localize_analysis_text(unwrap(str(summary or "")), i18n)
    concept_text = _localize_analysis_text(unwrap(str(concept_note or "")), i18n)
    if summary_text and concept_text:
        return f"{summary_text} {concept_text}"
    if summary_text:
        return summary_text
    if concept_text:
        return concept_text
    return i18n["pedagogicalNoData"]


def _normalize_execution_trace_graph_payload(
    trace_case: Optional[Dict[str, Any]]
) -> Optional[Dict[str, Any]]:
    report_trace = (
        (trace_case or {}).get("reportTraceGraph")
        if isinstance((trace_case or {}).get("reportTraceGraph"), dict)
        else {}
    )
    graph = (
        report_trace.get("graph") if isinstance(report_trace.get("graph"), dict) else {}
    )
    nodes = [
        {
            "id": str(node.get("id") or "").strip(),
            "type": str(node.get("type") or "default"),
            "position": {
                "x": float(((node.get("position") or {}).get("x")) or 0),
                "y": float(((node.get("position") or {}).get("y")) or 0),
            },
            "data": {
                "label": str(((node.get("data") or {}).get("label")) or "").strip(),
                "microseconds": ((node.get("data") or {}).get("microseconds")),
                "tokens": ((node.get("data") or {}).get("tokens")),
            },
            "parentId": (
                node.get("parentId") if isinstance(node.get("parentId"), str) else None
            ),
        }
        for node in graph.get("nodes") or []
        if isinstance(node, dict) and str(node.get("id") or "").strip()
    ]
    if not nodes:
        return None
    node_ids = {node["id"] for node in nodes}
    edges = [
        {
            "id": str(edge.get("id") or f"edge_{index}"),
            "source": str(edge.get("source") or "").strip(),
            "target": str(edge.get("target") or "").strip(),
            "label": str(edge.get("label") or ""),
            "type": str(edge.get("type") or "smoothstep"),
        }
        for index, edge in enumerate(graph.get("edges") or [])
        if isinstance(edge, dict)
        and str(edge.get("source") or "").strip() in node_ids
        and str(edge.get("target") or "").strip() in node_ids
    ]
    summary = report_trace.get("summary") or ((trace_case or {}).get("summary")) or {}
    diagnostics = (
        report_trace.get("diagnostics") or ((trace_case or {}).get("diagnostics")) or {}
    )
    return {
        "title": "Seguimiento de ejecución recursiva",
        "caseName": "worst",
        "graph": {"nodes": nodes, "edges": edges},
        "patternKind": report_trace.get("patternKind"),
        "classification": report_trace.get("classification"),
        "summary": summary,
        "diagnostics": diagnostics,
        "stats": {
            "totalCalls": summary.get("totalCalls", len(nodes)),
            "maxDepth": summary.get("maxRecursionDepth", 0),
            "truncated": bool(diagnostics.get("truncated")),
        },
        "renderMode": "mermaid_and_vector_assets",
        "assetBasename": "trace-diagram-worst",
        "assetSvgPath": "assets/trace-diagram-worst.svg",
        "assetPdfPath": "assets/trace-diagram-worst.pdf",
    }


def _clean_sentence(value: str) -> str:
    return re.sub(
        r"\s+\.", ".", re.sub(r"\.\.+", ".", re.sub(r"\s{2,}", " ", str(value).strip()))
    ).strip()


def _confidence_descriptor(confidence: str, i18n: Dict[str, Any]) -> str:
    return {
        "high": localize(i18n, "señal fuerte", "strong signal"),
        "medium": localize(i18n, "señal moderada", "moderate signal"),
        "low": localize(i18n, "señal inicial", "early signal"),
    }.get(confidence, confidence)


def _explain_pattern_name(
    pattern_name: str, confidence: float, i18n: Dict[str, Any]
) -> str:
    pct = f"{confidence * 100:.0f}%"
    key = str(pattern_name or "").lower()
    if key == "reduction":
        return localize(
            i18n,
            f"Se detectó un patrón de reducción/acumulación ({pct}): parte del trabajo puede reagruparse para ejecutar combinaciones en paralelo por bloques.",
            f"A reduction/accumulation pattern was detected ({pct}): part of the work can be regrouped to combine results in parallel blocks.",
        )
    if key == "divide_conquer":
        return localize(
            i18n,
            f"Se detectó estructura divide y vencerás ({pct}): puede abrir oportunidades de paralelismo por subproblemas independientes.",
            f"A divide-and-conquer structure was detected ({pct}): it can open parallelism opportunities across independent subproblems.",
        )
    return localize(
        i18n,
        f'Se detectó el patrón "{pattern_name}" ({pct}), útil como señal estructural para orientar la decisión hardware.',
        f'Pattern "{pattern_name}" was detected ({pct}), providing structural evidence to guide hardware decisions.',
    )


def _pedagogical_hardware_reason(raw: str, i18n: Dict[str, Any]) -> str:
    cleaned = _clean_sentence(raw)
    lowered = cleaned.lower()
    if "loop-carried dependency" in lowered:
        return localize(
            i18n,
            "Cada iteración depende del resultado de la iteración anterior. Esa dependencia secuencial reduce el beneficio de paralelizar en GPU.",
            "Each iteration depends on the previous iteration result. This sequential dependency reduces the benefit of GPU parallelization.",
        )
    if "scalar reduction" in lowered:
        return localize(
            i18n,
            "Se detecta una acumulación/reducción escalar: puede optimizarse con una reducción paralela en árbol por bloques.",
            "A scalar accumulation/reduction pattern is present: it can be optimized with a tree-style parallel reduction in blocks.",
        )
    return cleaned


def _build_gpu_cpu_blocks(
    gpu_cpu: Dict[str, Any], i18n: Dict[str, Any]
) -> List[Dict[str, Any]]:
    confidence_label = {
        "high": localize(i18n, "Alta", "High"),
        "medium": localize(i18n, "Media", "Medium"),
        "low": localize(i18n, "Baja", "Low"),
    }.get(gpu_cpu.get("confidence"), gpu_cpu.get("confidence"))
    recommendation_label = {
        "cpu": "CPU",
        "gpu": "GPU",
        "hybrid": localize(i18n, "Híbrido", "Hybrid"),
    }.get(gpu_cpu.get("primaryRecommendation"), gpu_cpu.get("primaryRecommendation"))
    reasons = gpu_cpu.get("reasons") if isinstance(gpu_cpu.get("reasons"), dict) else {}
    primary_negative = (reasons.get("blockers") or [None])[0] or (
        reasons.get("negative") or [None]
    )[0]
    primary_positive = (reasons.get("positive") or [None])[0]
    primary_opportunity = (reasons.get("opportunities") or [None])[0]
    top_pattern = (gpu_cpu.get("detectedPatterns") or [None])[0]
    narrative_parts = [
        ensure_sentence(_clean_sentence(str(gpu_cpu.get("summary") or ""))),
        (
            ensure_sentence(
                localize(
                    i18n,
                    f"La principal limitación observada fue: {_pedagogical_hardware_reason(primary_negative, i18n)}",
                    f"The main limitation observed was: {_pedagogical_hardware_reason(primary_negative, i18n)}",
                )
            )
            if primary_negative
            else ""
        ),
        localize(
            i18n,
            f"Con este patrón de ejecución, se recomienda priorizar {recommendation_label} para este algoritmo.",
            f"Given this execution pattern, {recommendation_label} is the recommended target for this algorithm.",
        ),
        localize(
            i18n,
            (
                "Aun así, la evidencia disponible es limitada y la recomendación debe tomarse con cautela."
                if gpu_cpu.get("confidence") == "low"
                else (
                    "La recomendación tiene señales consistentes, aunque todavía hay espacio para validación empírica."
                    if gpu_cpu.get("confidence") == "medium"
                    else "La recomendación está respaldada por señales fuertes y consistentes en la estructura del algoritmo."
                )
            ),
            (
                "Still, available evidence is limited, so this recommendation should be treated with caution."
                if gpu_cpu.get("confidence") == "low"
                else (
                    "The recommendation is supported by consistent signals, though empirical validation is still advised."
                    if gpu_cpu.get("confidence") == "medium"
                    else "The recommendation is backed by strong, consistent structural signals."
                )
            ),
        ),
    ]
    interpretation_items: List[str] = []
    if primary_positive:
        interpretation_items.append(
            localize(
                i18n,
                f"Qué favorece esta recomendación: {_pedagogical_hardware_reason(primary_positive, i18n)}",
                f"What supports this recommendation: {_pedagogical_hardware_reason(primary_positive, i18n)}",
            )
        )
    if primary_negative:
        interpretation_items.append(
            localize(
                i18n,
                f"Qué limita la alternativa opuesta: {_pedagogical_hardware_reason(primary_negative, i18n)}",
                f"What limits the opposite alternative: {_pedagogical_hardware_reason(primary_negative, i18n)}",
            )
        )
    if primary_opportunity:
        interpretation_items.append(
            localize(
                i18n,
                f"Cómo mejorar: {_pedagogical_hardware_reason(primary_opportunity, i18n)}",
                f"How to improve: {_pedagogical_hardware_reason(primary_opportunity, i18n)}",
            )
        )
    if isinstance(top_pattern, dict):
        interpretation_items.append(
            f"{_explain_pattern_name(str(top_pattern.get('name') or ''), float(top_pattern.get('confidence') or 0.0), i18n)} ({_confidence_descriptor(str(gpu_cpu.get('confidence') or ''), i18n)})."
        )
    blocks = [
        {
            "kind": "subsection",
            "title": localize(
                i18n,
                "Análisis de Idoneidad Hardware (GPU vs CPU)",
                "Hardware Suitability Analysis (GPU vs CPU)",
            ),
        },
        {
            "kind": "emphasis",
            "text": localize(
                i18n,
                f"Recomendación principal: {recommendation_label} (confianza {str(confidence_label).lower()}).",
                f"Primary recommendation: {recommendation_label} (confidence: {str(confidence_label).lower()}).",
            ),
        },
        {
            "kind": "paragraph",
            "text": " ".join(part.strip() for part in narrative_parts if part.strip()),
        },
        {
            "kind": "subsection",
            "title": localize(i18n, "Lectura pedagógica", "Pedagogical interpretation"),
        },
    ]
    if interpretation_items:
        blocks.append({"kind": "list", "items": interpretation_items})
    return blocks


def _build_recursive_section(
    snapshot: Dict[str, Any], i18n: Dict[str, Any]
) -> Optional[DocumentSection]:
    recursive = snapshot.get("recursive") or {}
    if not is_section_available(recursive):
        return None
    data = recursive.get("data") or {}
    blocks: List[Dict[str, Any]] = []
    recurrence_section = data.get("recurrence") or {}
    if is_section_available(recurrence_section):
        blocks.extend(
            [
                {"kind": "subsection", "title": i18n["recurrenceLabel"]},
                {"kind": "formula", "formula": recurrence_section["data"]["form"]},
            ]
        )
    selected_method_section = data.get("selectedMethod") or {}
    if is_section_available(selected_method_section):
        blocks.extend(
            [
                {
                    "kind": "subsection",
                    "title": localize(i18n, "Método seleccionado", "Selected method"),
                },
                {
                    "kind": "centeredParagraph",
                    "text": _method_label(selected_method_section["data"], i18n),
                },
            ]
        )
    methods_available_section = data.get("methodsAvailable") or {}
    if (
        is_section_available(methods_available_section)
        and methods_available_section["data"]
    ):
        recurrence_type = (
            recurrence_section.get("data", {}).get("type")
            if is_section_available(recurrence_section)
            else None
        )
        strategy_family = (
            localize(i18n, "Divide y Vencerás", "Divide y Conquer")
            if recurrence_type in {"divide_conquer", "divide_conquer_multi"}
            else (
                localize(
                    i18n,
                    "Resta y Vencerás / Resta y Serás Vencido",
                    "Decrease and Conquer / Decrease and Get Defeated",
                )
                if recurrence_type == "linear_shift"
                else localize(i18n, "Familia no determinada", "Undetermined family")
            )
        )
        selected = (
            selected_method_section.get("data")
            if is_section_available(selected_method_section)
            else methods_available_section["data"][0]
        )
        available_set = set(methods_available_section["data"])
        available_methods = [
            method for method in ALL_RECURSIVE_METHODS if method in available_set
        ]
        unavailable_methods = [
            method for method in ALL_RECURSIVE_METHODS if method not in available_set
        ]
        recurrence_a = (
            _as_number((recurrence_section.get("data") or {}).get("a"))
            if is_section_available(recurrence_section)
            else None
        )
        blocks.extend(
            [
                {
                    "kind": "subsection",
                    "title": localize(i18n, "Métodos disponibles", "Available methods"),
                },
                {
                    "kind": "emphasis",
                    "text": localize(
                        i18n,
                        f"Método recomendado: {_method_label(selected, i18n)}.",
                        f"Recommended method: {_method_label(selected, i18n)}.",
                    ),
                },
                {
                    "kind": "paragraph",
                    "text": localize(
                        i18n,
                        f"Familia de recurrencia detectada: {strategy_family}.",
                        f"Detected recurrence family: {strategy_family}.",
                    ),
                },
                {
                    "kind": "paragraph",
                    "text": localize(
                        i18n,
                        "Por qué sí aplican en este problema:",
                        "Why they do apply to this problem:",
                    ),
                },
                {
                    "kind": "list",
                    "items": [
                        f"{_method_label(method, i18n)} ({localize(i18n, 'precisión', 'precision')} {_method_precision_label(_get_method_precision(method, recurrence_type, method == selected), i18n)}): {_get_applicable_method_reason(method, recurrence_type, method == selected, recurrence_a, i18n)}"
                        for method in available_methods
                    ],
                },
                {
                    "kind": "subsection",
                    "title": localize(
                        i18n, "Métodos no disponibles", "Unavailable methods"
                    ),
                },
                {
                    "kind": "paragraph",
                    "text": localize(
                        i18n,
                        "Por qué no convienen (o no aplican formalmente) en este caso:",
                        "Why they are not advisable (or formally applicable) in this case:",
                    ),
                },
                {
                    "kind": "list",
                    "items": [
                        f"{_method_label(method, i18n)}: {_get_not_applicable_method_reason(method, recurrence_type, i18n)}"
                        for method in unavailable_methods
                    ]
                    or [
                        localize(
                            i18n,
                            "No hay métodos descartados para este patrón.",
                            "No methods were ruled out for this pattern.",
                        )
                    ],
                },
            ]
        )
    step_by_step_section = data.get("stepByStep") or {}
    if is_section_available(step_by_step_section):
        walkthrough = step_by_step_section.get("data") or {}
        steps = walkthrough.get("steps") or []
        if steps:
            blocks.append(
                {
                    "kind": "subsection",
                    "title": localize(
                        i18n, "Desarrollo paso a paso", "Step-by-step walkthrough"
                    ),
                }
            )
            for step in steps:
                if not isinstance(step, dict):
                    continue
                blocks.append(
                    {
                        "kind": "pedagogicalStep",
                        "step": {
                            "index": step.get("index"),
                            "title": _localize_analysis_text(step.get("title"), i18n),
                            "status": step.get("status"),
                            "formula": normalize_recursive_formula(
                                ((step.get("math") or {}).get("primaryLatex"))
                            ),
                            "explanation": _build_recursive_step_explanation(
                                step.get("summary"), step.get("conceptNote"), i18n
                            ),
                            "warning": _localize_analysis_text(
                                step.get("warning"), i18n
                            )
                            or None,
                            "supportReason": _localize_analysis_text(
                                (
                                    (
                                        (step.get("derivation") or {}).get(
                                            "supportReason"
                                        )
                                    )
                                    if isinstance(step.get("derivation"), dict)
                                    else None
                                ),
                                i18n,
                            )
                            or None,
                        },
                    }
                )
    roots_section = data.get("rootsAndMultiplicities") or {}
    if is_section_available(roots_section) and roots_section.get("data"):
        blocks.extend(
            [
                {
                    "kind": "paragraph",
                    "text": localize(
                        i18n, "Raíces y multiplicidades:", "Roots and multiplicities:"
                    ),
                },
                {
                    "kind": "table",
                    "table": DocumentTable(
                        headers=i18n["headers"]["roots"],
                        rows=[
                            [
                                safe(item.get("root"), "N/A"),
                                str(item.get("multiplicity", "N/A")),
                            ]
                            for item in roots_section["data"]
                        ],
                        align=["left", "center"],
                    ),
                },
            ]
        )
    closed_form_section = data.get("closedForm") or {}
    has_step_walkthrough = is_section_available(step_by_step_section) and bool(
        ((step_by_step_section.get("data") or {}).get("steps")) or []
    )
    if is_section_available(closed_form_section):
        closed_form = closed_form_section.get("data") or {}
        if not has_step_walkthrough:
            for label, key in (
                (i18n["formulas"]["homogeneousSolution"], "homogeneousSolution"),
                (i18n["formulas"]["particularSolution"], "particularSolution"),
                (i18n["formulas"]["generalSolution"], "generalSolution"),
                (i18n["formulas"]["closedForm"], "closedForm"),
                (i18n["pedagogicalFinalComplexityLabel"], "theta"),
            ):
                if closed_form.get(key):
                    blocks.append(
                        {"kind": "formula", "label": label, "formula": closed_form[key]}
                    )
    call_trace_section = data.get("callTrace") or {}
    if is_section_available(call_trace_section):
        trace_items = _build_recursive_call_trace_summary(
            call_trace_section.get("data") or {}, i18n
        )
        if trace_items:
            blocks.extend(
                [
                    {"kind": "subsection", "title": i18n["pedagogicalTraceTitle"]},
                    {"kind": "list", "items": trace_items},
                ]
            )
        diagram_payload = _normalize_execution_trace_graph_payload(
            ((call_trace_section.get("data") or {}).get("worst")) or None
        )
        if diagram_payload:
            blocks.extend(
                [
                    {
                        "kind": "subsection",
                        "title": localize(
                            i18n,
                            "Seguimiento de ejecución recursiva",
                            "Recursive execution trace tracking",
                        ),
                    },
                    {
                        "kind": "executionTraceDiagram",
                        "diagram": {
                            **diagram_payload,
                            "title": localize(
                                i18n,
                                "Seguimiento de ejecución recursiva",
                                "Recursive execution trace tracking",
                            ),
                        },
                    },
                ]
            )
    warnings = list(
        dict.fromkeys(
            str(warning.get("message") or "")
            for warning in (((snapshot.get("meta") or {}).get("warnings")) or [])
            if isinstance(warning, dict) and str(warning.get("message") or "").strip()
        )
    )
    if warnings:
        blocks.extend(
            [
                {
                    "kind": "subsection",
                    "title": localize(i18n, "Advertencias", "Warnings"),
                },
                {"kind": "list", "items": warnings},
            ]
        )
    final_theta = (
        ((closed_form_section.get("data") or {}).get("theta"))
        if is_section_available(closed_form_section)
        else None
    )
    final_theta = final_theta or pick_case_complexity(snapshot, "worst")
    if final_theta:
        blocks.extend(
            [
                {
                    "kind": "subsection",
                    "title": localize(
                        i18n, "Conclusión asintótica", "Asymptotic conclusion"
                    ),
                },
                {
                    "kind": "formula",
                    "label": i18n["pedagogicalFinalComplexityLabel"],
                    "formula": final_theta,
                },
            ]
        )
    return (
        DocumentSection(id="recursive", title=i18n["recursiveTitle"], blocks=blocks)
        if blocks
        else None
    )


def _build_comparative_section(
    snapshot: Dict[str, Any], i18n: Dict[str, Any], *, include_gpu_cpu: bool = True
) -> Optional[DocumentSection]:
    blocks: List[Dict[str, Any]] = []
    comparative = snapshot.get("comparative") or {}
    gpu_cpu_section = comparative.get("gpuCpu") or {}
    llm_section = comparative.get("llm") or {}
    if include_gpu_cpu and is_section_available(gpu_cpu_section):
        blocks.extend(_build_gpu_cpu_blocks(gpu_cpu_section.get("data") or {}, i18n))
    elif include_gpu_cpu:
        status_block = build_status_block("comparative.gpuCpu", gpu_cpu_section, i18n)
        if status_block:
            blocks.append(status_block)
    if is_section_available(llm_section):
        normalized = ((llm_section.get("data") or {}).get("normalized")) or {}
        blocks.append(
            {
                "kind": "subsection",
                "title": localize(i18n, "Comparación con LLM", "LLM comparison"),
            }
        )
        llm_items = maybe_list(
            [
                (
                    f"{localize(i18n, 'Veredicto', 'Verdict')}: {normalized.get('verdict')}"
                    if normalized.get("verdict")
                    else None
                ),
                (
                    f"{localize(i18n, 'Confianza', 'Confidence')}: {normalized.get('confidence')}"
                    if isinstance(normalized.get("confidence"), (int, float))
                    else None
                ),
                (
                    f"{localize(i18n, 'Nota', 'Note')}: {normalized.get('note')}"
                    if normalized.get("note")
                    else None
                ),
            ]
        )
        if llm_items:
            blocks.append({"kind": "list", "items": llm_items})
        if normalized.get("matches"):
            blocks.extend(
                [
                    {
                        "kind": "paragraph",
                        "text": localize(
                            i18n, "Coincidencias principales:", "Main matches:"
                        ),
                    },
                    {"kind": "list", "items": list(normalized.get("matches") or [])},
                ]
            )
        if normalized.get("differences"):
            blocks.extend(
                [
                    {
                        "kind": "paragraph",
                        "text": localize(
                            i18n, "Diferencias principales:", "Main differences:"
                        ),
                    },
                    {
                        "kind": "list",
                        "items": list(normalized.get("differences") or []),
                    },
                ]
            )
    else:
        status_block = build_status_block("comparative.llm", llm_section, i18n)
        if status_block:
            blocks.append(status_block)
    return (
        DocumentSection(id="comparative", title=i18n["comparativeTitle"], blocks=blocks)
        if blocks
        else None
    )


def _build_conclusions_section(
    snapshot: Dict[str, Any], i18n: Dict[str, Any]
) -> DocumentSection:
    items: List[str] = []
    if snapshot.get("algorithmType") == "iterative":
        items.extend(
            item
            for item in (
                (
                    f"{_case_label(case_name, i18n)}: {pick_case_complexity(snapshot, case_name)}"
                    if pick_case_complexity(snapshot, case_name)
                    else None
                )
                for case_name in CASE_ORDER
            )
            if item
        )
        iterative = snapshot.get("iterative") or {}
        items.append(
            localize(
                i18n,
                "El invariante del ciclo es consistente con la evolución del estado y respalda la corrección del recorrido.",
                "The loop invariant is consistent with state evolution and supports traversal correctness.",
            )
            if is_section_available(iterative)
            and is_section_available(
                ((iterative.get("data") or {}).get("loopInvariant") or {})
            )
            else localize(
                i18n,
                "La validación del invariante quedó limitada por disponibilidad de datos.",
                "Invariant validation remained limited due to data availability.",
            )
        )
        items.append(
            localize(
                i18n,
                "El seguimiento de ejecución mantiene trazabilidad completa mediante resumen, cronología y vista agrupada.",
                "Execution tracing preserves full traceability through summary, chronology, and grouped view.",
            )
            if is_section_available(iterative)
            and is_section_available(((iterative.get("data") or {}).get("trace") or {}))
            else localize(
                i18n,
                "No fue posible construir un seguimiento completo de ejecución para todos los casos.",
                "A full execution trace could not be built for all cases.",
            )
        )
        gpu_cpu_section = ((snapshot.get("comparative") or {}).get("gpuCpu")) or {}
        if is_section_available(gpu_cpu_section):
            hw = gpu_cpu_section.get("data") or {}
            rec_label = {
                "cpu": "CPU",
                "gpu": "GPU",
                "hybrid": localize(i18n, "Híbrido", "Hybrid"),
            }.get(hw.get("primaryRecommendation"), hw.get("primaryRecommendation"))
            conf_label = {
                "high": localize(i18n, "alta", "high"),
                "medium": localize(i18n, "media", "medium"),
                "low": localize(i18n, "baja", "low"),
            }.get(hw.get("confidence"), hw.get("confidence"))
            items.append(
                localize(
                    i18n,
                    f"Recomendación de hardware: {rec_label} (confianza {conf_label})",
                    f"Hardware recommendation: {rec_label} (confidence: {conf_label})",
                )
            )
    else:
        items.extend(
            item
            for item in (
                (
                    f"{_case_label(case_name, i18n)}: {pick_case_complexity(snapshot, case_name)}"
                    if pick_case_complexity(snapshot, case_name)
                    else None
                )
                for case_name in CASE_ORDER
            )
            if item
        )
        if snapshot.get("algorithmType") == "hybrid":
            items.append(
                localize(
                    i18n,
                    "El comportamiento híbrido se reporta sin duplicar narrativas: control iterativo + derivación recursiva formal.",
                    "Hybrid behavior is reported without duplicated narratives: iterative control + formal recursive derivation.",
                )
            )
            recursive = snapshot.get("recursive") or {}
            selected_method = (
                (((recursive.get("data") or {}).get("selectedMethod")) or {}).get(
                    "data"
                )
                if is_section_available(recursive)
                else None
            )
            if selected_method:
                items.append(
                    localize(
                        i18n,
                        f"La conclusión principal se fundamenta en {_method_label(selected_method, i18n)} como método recursivo de referencia.",
                        f"The main conclusion is grounded on {_method_label(selected_method, i18n)} as the reference recursive method.",
                    )
                )
        warning_count = len(((snapshot.get("meta") or {}).get("warnings")) or [])
        if warning_count > 0:
            items.append(
                localize(
                    i18n,
                    f"Advertencias detectadas: {warning_count}.",
                    f"Detected warnings: {warning_count}.",
                )
            )
    blocks = (
        [{"kind": "list", "items": items}]
        if items
        else [{"kind": "paragraph", "text": i18n["pedagogicalNoData"]}]
    )
    return DocumentSection(
        id="conclusions", title=i18n["conclusionsTitle"], blocks=blocks
    )


def build_document_model(snapshot: Dict[str, Any]) -> DocumentModel:
    i18n = get_export_i18n(snapshot.get("locale") or "en")
    institution = DocumentInstitutionInfo(
        institutionLineA=i18n["institutionLineA"],
        institutionLineB=i18n["institutionLineB"],
        institutionLineC=i18n["institutionLineC"],
        reportCode=f"AALIE-EXP-{str(snapshot.get('snapshotId') or '')[:8].upper()}",
        reportVersion=f"snapshot-{snapshot.get('schemaVersion')}",
        reportDate=_parse_date_for_report(
            i18n["locale"], str(snapshot.get("createdAt") or "")
        ),
    )
    algorithm_type = snapshot.get("algorithmType")
    if algorithm_type == "iterative":
        sections = [
            _build_executive_summary_section(snapshot, i18n),
            _build_pseudocode_section(snapshot),
            _build_iterative_invariant_section(snapshot, i18n),
            _build_iterative_case_analysis_section(snapshot, i18n),
            _build_iterative_trace_section(snapshot, i18n),
            _build_comparative_section(snapshot, i18n, include_gpu_cpu=True),
            _build_conclusions_section(snapshot, i18n),
        ]
    elif algorithm_type == "hybrid":
        iterative = snapshot.get("iterative") or {}
        sections = [
            _build_executive_summary_section(snapshot, i18n),
            _build_pseudocode_section(snapshot),
            _build_hybrid_process_section(snapshot, i18n),
            (
                _build_iterative_invariant_section(snapshot, i18n)
                if is_section_available(iterative)
                and is_section_available(
                    ((iterative.get("data") or {}).get("loopInvariant") or {})
                )
                else None
            ),
            _build_recursive_section(snapshot, i18n),
            _build_comparative_section(snapshot, i18n, include_gpu_cpu=False),
            _build_conclusions_section(snapshot, i18n),
        ]
    else:
        sections = [
            _build_executive_summary_section(snapshot, i18n),
            _build_pseudocode_section(snapshot),
            _build_global_result_section(snapshot, i18n),
            _build_recursive_section(snapshot, i18n),
            _build_comparative_section(snapshot, i18n, include_gpu_cpu=False),
            _build_conclusions_section(snapshot, i18n),
        ]
    return DocumentModel(
        title=((snapshot.get("meta") or {}).get("algorithm") or {}).get("name")
        or i18n["documentTitle"],
        locale=i18n["locale"],
        snapshotId=str(snapshot.get("snapshotId") or ""),
        contentHash=str(snapshot.get("contentHash") or ""),
        analysisId=str(((snapshot.get("meta") or {}).get("analysisId")) or ""),
        createdAt=str(snapshot.get("createdAt") or ""),
        disclaimer=str(((snapshot.get("institutional") or {}).get("disclaimer")) or ""),
        institution=institution,
        sections=[section for section in sections if section],
    )
