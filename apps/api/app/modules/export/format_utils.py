"""
Shared text and math formatting helpers.
"""

from __future__ import annotations

import re
from typing import Any, Dict, Iterable, List, Optional

from .constants import SNAPSHOT_NOT_IMPLEMENTED_TODOS

MATH_COMMAND_PATTERN = re.compile(r"\\[A-Za-z]+")
BASIC_MATH_OPERATOR_PATTERN = re.compile(r"[=+*^]")
FRACTION_PATTERN = re.compile(r"\b[A-Za-z]\b\s*/\s*\d")
SUBTRACTION_PATTERN = re.compile(r"\b[A-Za-z]\b\s*-\s*\d")
SPECIAL_TEXT_PATTERN = re.compile(r"[&%$#{}~]")

LATEX_TEXT_ESCAPE_MAP = {
    "\\": r"\textbackslash{}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}

STATUS_LABEL_MAP = {
    "input.normalizedPseudocode": "normalizedPseudocode",
    "input.traceSummary": "traceSummary",
    "iterative.trace": "iterativeTrace",
    "iterative.loopInvariant": "loopInvariant",
    "recursive.recurrence": "recurrence",
    "recursive.selectedMethod": "selectedMethod",
    "recursive.methodsAvailable": "methodsAvailable",
    "recursive.methodDetails": "methodDetails",
    "recursive.rootsAndMultiplicities": "roots",
    "recursive.stepByStep": "methodDetails",
    "recursive.closedForm": "closedForm",
    "recursive.recursionTreeSerializable": "recursionTreeSerializable",
    "recursive.callTrace": "callTrace",
    "comparative.llm": "llm",
    "comparative.gpuCpu": "gpuCpu",
}


def localize(i18n: Dict[str, Any], es_text: str, en_text: str) -> str:
    return es_text if i18n["locale"] == "es" else en_text


def safe(value: Any, fallback: str) -> str:
    if isinstance(value, str):
        stripped = value.strip()
        return stripped or fallback
    if isinstance(value, (int, float, bool)):
        return str(value)
    if value is None:
        return fallback
    try:
        return str(value)
    except Exception:
        return fallback


def maybe_list(items: Iterable[Any]) -> List[str]:
    values: List[str] = []
    for item in items:
        normalized = str(item or "").strip()
        if normalized:
            values.append(normalized)
    return values


def normalize_recursive_formula(formula: Optional[str]) -> Optional[str]:
    if not formula:
        return formula
    dominant_work_pattern = re.compile(
        r"\\text\{Trabajo en ra[ií]z ?\}\s*([^\\]+?)\s*\\\\\s*\\text\{Trabajo en hojas ?\(\}\s*([^\\]+?)\s*\\text\{\)\}",
        re.I,
    )
    match = dominant_work_pattern.search(formula)
    if match:
        root_work = (match.group(1) or "").strip() or "N/A"
        leaf_work = (match.group(2) or "").strip() or "N/A"
        return rf"\text{{Trabajo en raíz: }} {root_work} \quad \text{{Trabajo en hojas: }} {leaf_work}"

    for pattern, replacement in (
        (
            re.compile(r"\\text\{Cada nivel tiene costo ?\}\s*n\s*(?:\\\\\s*)?\\text\{Total ?\}\s*=\s*(.+)$", re.I),
            r"\text{Cada nivel tiene costo: } n \quad \text{Total: } \1",
        ),
        (
            re.compile(r"\\text\{Each level has cost ?\}\s*n\s*(?:\\\\\s*)?\\text\{Total ?\}\s*=\s*(.+)$", re.I),
            r"\text{Each level has cost: } n \quad \text{Total: } \1",
        ),
    ):
        match = pattern.search(formula)
        if match:
            return re.sub(pattern, replacement, formula)
    return formula


def ensure_sentence(text: str) -> str:
    stripped = text.strip()
    if not stripped:
        return ""
    return stripped if re.search(r"[.!?]$", stripped) else f"{stripped}."


def pick_case_complexity(snapshot: Dict[str, Any], case_name: str) -> str:
    result = (((snapshot.get("globalResult") or {}).get("cases") or {}).get(case_name)) or {}
    return (
        result.get("big_theta")
        or result.get("big_o")
        or result.get("big_omega")
        or result.get("T_polynomial")
        or result.get("T_open")
        or ""
    )


def localize_status_label(label: str, i18n: Dict[str, Any]) -> str:
    mapped = STATUS_LABEL_MAP.get(label)
    if not mapped:
        return label
    return i18n["statusLabels"].get(mapped, label)


def localize_todos(todos: Optional[List[str]], i18n: Dict[str, Any]) -> List[str]:
    values = todos or []
    localized: List[str] = []
    for todo in values:
        if todo == SNAPSHOT_NOT_IMPLEMENTED_TODOS["normalizedPseudocode"]:
            localized.append(i18n["todos"]["normalizedPseudocode"])
        elif todo == SNAPSHOT_NOT_IMPLEMENTED_TODOS["loopInvariant"]:
            localized.append(i18n["todos"]["loopInvariant"])
        elif todo == SNAPSHOT_NOT_IMPLEMENTED_TODOS["symbolicRecurrenceTree"]:
            localized.append(i18n["todos"]["symbolicRecurrenceTree"])
        else:
            localized.append(todo)
    return localized


def build_status_block(label: str, section: Dict[str, Any], i18n: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    status = (section or {}).get("status")
    if status in {"not_requested", "available"}:
        return None
    return {
        "kind": "status",
        "status": {
            "label": localize_status_label(label, i18n),
            "status": status,
            "message": i18n["sectionStatusLabels"].get(status, status),
            "todos": localize_todos((section or {}).get("todos"), i18n),
        },
    }


def is_narrative_sentence(value: str) -> bool:
    normalized = value.strip()
    if not normalized or " " not in normalized or "\\" in normalized or "=" in normalized:
        return False
    if re.match(r"^(O|Omega|Theta)\s*\(", normalized):
        return False
    if re.search(r"[A-Za-z]_\{[^}]+\}", normalized):
        return False
    if re.search(r"C_\d+", normalized):
        return False
    narrative_words = re.findall(r"[A-Za-zÀ-ÿ]{3,}", normalized)
    return len(narrative_words) >= 3


def is_narrative_equation(value: str) -> bool:
    normalized = value.strip()
    if "=" not in normalized:
        return False
    if "\\" in normalized or re.search(r"[{}_^]", normalized):
        return False
    if re.match(r"^T\(n\)\s*=", normalized):
        return False
    if re.match(r"^[A-Za-z](?:_[0-9{}]+)?\s*=", normalized):
        return False
    return bool(re.search(r"[A-Za-zÀ-ÿ]{3,}", normalized))


def is_likely_math_expression(value: str) -> bool:
    if not value:
        return False
    if is_narrative_sentence(value) or is_narrative_equation(value):
        return False
    if MATH_COMMAND_PATTERN.search(value) or re.match(r"^(O|Omega|Theta)\s*\(", value):
        return True
    if re.search(r"[A-Za-z]_\{[^}]+\}", value) or re.search(r"C_\d+", value):
        return True
    if BASIC_MATH_OPERATOR_PATTERN.search(value):
        return True
    if FRACTION_PATTERN.search(value) or SUBTRACTION_PATTERN.search(value):
        return True
    return False


def is_technical_token(value: str) -> bool:
    if not value or " " in value or "_" not in value:
        return False
    if SPECIAL_TEXT_PATTERN.search(value):
        return False
    if MATH_COMMAND_PATTERN.search(value) or BASIC_MATH_OPERATOR_PATTERN.search(value):
        return False
    if FRACTION_PATTERN.search(value) or SUBTRACTION_PATTERN.search(value):
        return False
    return True


def to_markdown_inline_math(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        return normalized
    if not is_likely_math_expression(normalized):
        return normalized
    if re.match(r"^\$.*\$$", normalized):
        return normalized
    return f"${normalized}$"


def to_markdown_text_with_inline_math(text: str) -> str:
    normalized = text.strip()
    if not normalized or "$" in normalized or "\n" in normalized or ";" in normalized:
        return text
    separator_index = normalized.find(":")
    if separator_index > -1:
        left = normalized[: separator_index + 1]
        right = normalized[separator_index + 1 :].strip()
        if not re.search(r"[;,]", right) and is_likely_math_expression(right):
            return f"{left} {to_markdown_inline_math(right)}"
    if is_likely_math_expression(normalized):
        return to_markdown_inline_math(normalized)
    return text


def escape_latex_text(text: str) -> str:
    return "".join(LATEX_TEXT_ESCAPE_MAP.get(char, char) for char in text)


def normalize_latex_math_expression(value: str) -> str:
    return re.sub(r"([A-Za-z])_([0-9]+)\b", r"\1_{\2}", value)


def render_latex_text_with_inline_math(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        return ""
    if is_narrative_equation(normalized) or ";" in normalized:
        return escape_latex_text(normalized)
    separator_index = normalized.find(":")
    if separator_index > -1:
        left = normalized[: separator_index + 1]
        right = normalized[separator_index + 1 :].strip()
        if not re.search(r"[;,]", right) and is_likely_math_expression(right):
            return f"{escape_latex_text(left)} ${normalize_latex_math_expression(right)}$"
    if is_likely_math_expression(normalized):
        return f"${normalize_latex_math_expression(normalized)}$"
    return escape_latex_text(normalized)


def render_latex_text_with_embedded_math(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        return ""
    if "$" not in normalized:
        return escape_latex_text(normalized)
    parts = [part for part in re.split(r"(\$[^$]+\$)", normalized) if part]
    rendered: List[str] = []
    for part in parts:
        if part.startswith("$") and part.endswith("$"):
            rendered.append(part)
        else:
            rendered.append(escape_latex_text(part))
    return "".join(rendered)


def render_latex_cell_value(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        return ""
    if is_narrative_equation(normalized):
        return escape_latex_text(normalized)
    if is_likely_math_expression(normalized):
        return f"${normalize_latex_math_expression(normalized)}$"
    if is_technical_token(normalized):
        return rf"\texttt{{\detokenize{{{normalized}}}}}"
    return escape_latex_text(normalized)

