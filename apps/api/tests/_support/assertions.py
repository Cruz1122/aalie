"""
Oráculo único de aserciones semánticas para resultados de análisis de complejidad.
Toda verificación de complejidad en tests debe usar este módulo.

Author: AALIE reform (migrado desde integration/fixtures/algorithm_expectations)
Version: 0.1.0
"""
import re
from typing import Any, Dict, Optional, Set


def get_totals(result: Dict[str, Any], case: str) -> dict:
    """Obtiene totals del caso indicado (worst, best, avg)."""
    if case == "worst":
        data = result.get("worst")
    elif case == "best":
        data = result.get("best")
        if data == "same_as_worst":
            data = result.get("worst")
    else:
        data = result.get("avg")
        if data == "same_as_worst" or data is None:
            data = result.get("worst")
    return (data or {}).get("totals", {})


def get_by_line(result: Dict[str, Any], case: str) -> list:
    """Obtiene byLine del caso indicado."""
    if case == "worst":
        data = result.get("worst")
    elif case == "best":
        data = result.get("best")
        if data == "same_as_worst":
            data = result.get("worst")
    else:
        data = result.get("avg")
        if data == "same_as_worst" or data is None:
            data = result.get("worst")
    return (data or {}).get("byLine", [])


def has_asymptotic_notation(totals: dict) -> bool:
    """Verifica que exista al menos una notación asintótica."""
    return bool(
        totals.get("big_theta") or totals.get("big_o") or totals.get("big_omega")
    )


def is_o1_notation(notation: str) -> bool:
    """True si la notación es O(1), Θ(1) o Ω(1)."""
    if not notation:
        return False
    s = notation.lower().replace("\\", "").replace(" ", "")
    return "o(1)" in s or "θ(1)" in s or "theta(1)" in s or "ω(1)" in s or "omega(1)" in s


def _notation_has_complexity(notation: str, level: str) -> bool:
    """
    True si la notación contiene la complejidad esperada (o mayor).
    level: constant | log | linear | nlogn | quadratic | cubic | exponential
    """
    if not notation:
        return False
    s = notation.lower().replace("\\", "")
    if level == "constant":
        return is_o1_notation(notation)
    if level == "log":
        return "log" in s
    if level == "nlogn":
        return "log" in s and "n" in s
    if level == "exponential":
        return "^n" in s or "**n" in s or "exp(" in s or "2^n" in s or "phi" in s
    if level == "linear":
        return any(x in s for x in ["n", "exp", "m", "min"])
    if level == "quadratic":
        # Una variable al cuadrado: cualquier letra con exponente >= 2 (genérico)
        match = re.search(r"[a-z]\^?\{?(\d+)\}?", s)
        if match:
            return int(match.group(1)) >= 2
        if "²" in s or "2" in s:
            return True
        # Producto de 2 o más variables (genérico: Θ(a·b), Θ(n*m*k), Θ(n m), etc.)
        # Variables = letras sueltas entre espacios/parens/*, excluyendo i,j,k
        single_letter_vars = set(
            re.findall(r"(?<=[\s\(*])([a-z])(?=[\s\)*])", s)
        ) - set("ijk")
        has_mult = "*" in s or "cdot" in s or " " in s
        if len(single_letter_vars) >= 2 and has_mult:
            return True
        return False
    if level == "cubic":
        if "n" not in s:
            return False
        match = re.search(r"n\^?\{?(\d+)\}?", s)
        if match:
            return int(match.group(1)) >= 3
        return "³" in s or "3" in s
    return False


# Alias para compatibilidad con código que usaba notation_has_complexity
def notation_has_complexity(notation: str, level: str) -> bool:
    return _notation_has_complexity(notation, level)


def t_open_has_variable(t_open: str) -> bool:
    """True si T_open contiene variable de tamaño (n, m, etc.), no solo constantes."""
    if not t_open:
        return False
    s = t_open.lower()
    vars_ok = ("n", "m", "min", "log", "sum", "\\sum", "i", "j", "k", "while", "exp_")
    return any(v in s for v in vars_ok)


def get_notation_from_totals(totals: dict) -> str:
    """
    Obtiene la notación asintótica de totals.
    Para recursivos, la theta puede estar en master, iteration, etc.
    """
    notation = totals.get("big_theta", "") or totals.get("big_o", "") or ""
    if notation:
        return notation
    master = totals.get("master", {})
    if master:
        notation = master.get("theta", "") or notation
    iteration = totals.get("iteration", {})
    if iteration:
        notation = iteration.get("theta", "") or notation
    char_eq = totals.get("characteristic_equation", {})
    if char_eq:
        notation = char_eq.get("solution", "") or char_eq.get("theta", "") or notation
    rec_tree = totals.get("recursion_tree", {})
    if rec_tree:
        notation = rec_tree.get("theta", "") or notation
    recurrence = totals.get("recurrence", {})
    if recurrence and not notation:
        notation = recurrence.get("theta", "") or ""
    return notation or ""


# --- API oficial (plan reforma) ---


def assert_has_asymptotic_notation(result: Dict[str, Any], case: str) -> None:
    """Verifica que el caso tenga al menos una notación (big_theta/big_o/big_omega)."""
    totals = get_totals(result, case)
    assert has_asymptotic_notation(totals), (
        f"Caso {case}: se esperaba notación asintótica en totals, obtenido: {totals}"
    )


def assert_complexity_class(
    result: Dict[str, Any], case: str, expected: str, name: str = ""
) -> None:
    """
    expected ∈ constant, log, linear, nlogn, quadratic, cubic, exponential.
    """
    totals = get_totals(result, case)
    notation = get_notation_from_totals(totals)
    assert _notation_has_complexity(notation, expected), (
        f"[{name}] {case}: esperado {expected}, obtenido: {notation!r}"
    )


def assert_no_unknown_counts(result: Dict[str, Any], case: str) -> None:
    """byLine no debe contener 'unknown' en count."""
    by_line = get_by_line(result, case)
    for i, row in enumerate(by_line):
        count = row.get("count")
        if count is not None and isinstance(count, str):
            assert "unknown" not in count.lower(), (
                f"Caso {case}, línea {i}: count contiene 'unknown': {count!r}"
            )


def assert_byline_schema(result: Dict[str, Any], case: str) -> None:
    """Campos mínimos en byLine: count_raw, count (y opcionalmente procedure_step, etc.)."""
    by_line = get_by_line(result, case)
    required = {"count_raw", "count"}
    for i, row in enumerate(by_line):
        for field in required:
            assert field in row, f"Caso {case}, línea {i}: falta campo {field!r}"


def assert_totals_schema(result: Dict[str, Any], case: str) -> None:
    """Totals debe tener T_open o t_polynomial y notación."""
    totals = get_totals(result, case)
    has_t = "T_open" in totals or "t_polynomial" in totals
    assert has_t or has_asymptotic_notation(totals), (
        f"Caso {case}: totals sin T_open/t_polynomial ni notación: {totals}"
    )


def assert_expected_symbols(
    result: Dict[str, Any], symbols: Set[str], case: str = "worst"
) -> None:
    """Verifica que la expresión de totals contenga las variables esperadas (n, m, etc.)."""
    totals = get_totals(result, case)
    t_open = totals.get("T_open", "") or totals.get("t_polynomial", "") or ""
    t_lower = t_open.lower()
    for sym in symbols:
        assert sym.lower() in t_lower or f"{{{sym}}}" in t_open, (
            f"Caso {case}: se esperaba símbolo {sym!r} en totals, obtenido: {t_open!r}"
        )


# --- Aserciones legacy (compatibilidad) ---


def assert_case_complexity(
    result: Dict[str, Any],
    case: str,
    expected_level: str,
    name: str = "",
) -> None:
    """Verifica que el caso tenga la complejidad esperada."""
    totals = get_totals(result, case)
    notation = get_notation_from_totals(totals)
    assert _notation_has_complexity(notation, expected_level), (
        f"[{name}] {case.upper()}: esperado {expected_level}, obtenido: {notation!r}"
    )


def assert_worst_complexity(
    result: Dict[str, Any], expected_level: str, name: str = ""
) -> None:
    """Verifica que el worst case tenga la complejidad esperada."""
    assert_case_complexity(result, "worst", expected_level, name)


def assert_all_cases_complexity(
    result: Dict[str, Any],
    expected_worst: str,
    expected_best: Optional[str] = None,
    expected_avg: Optional[str] = None,
    name: str = "",
) -> None:
    """Valida worst, best y avg según corresponda."""
    assert_case_complexity(result, "worst", expected_worst, name)
    best = result.get("best")
    avg = result.get("avg")
    best_level = expected_best if expected_best is not None else expected_worst
    avg_level = expected_avg if expected_avg is not None else expected_worst
    if best != "same_as_worst" and isinstance(best, dict):
        assert_case_complexity(result, "best", best_level, name)
    if avg != "same_as_worst" and avg is not None and isinstance(avg, dict):
        assert_case_complexity(result, "avg", avg_level, name)
