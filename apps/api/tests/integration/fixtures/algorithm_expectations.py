"""
Helpers compartidos para tests auténticos de algoritmos.
Input: pseudocode → Output: verificación de expectativas de complejidad.

Author: @Cruz1122
Version: 0.1.0
"""
import re
from typing import Any, Dict, Optional


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


def notation_has_complexity(notation: str, level: str) -> bool:
    """
    True si la notación contiene la complejidad esperada (o mayor).
    level: "constant" | "log" | "linear" | "quadratic" | "cubic" | "exponential"
    """
    if not notation:
        return False
    s = notation.lower().replace("\\", "")
    if level == "constant":
        return is_o1_notation(notation)
    if level == "log":
        return "log" in s
    if level == "exponential":
        return "^n" in s or "**n" in s or "exp(" in s or "2^n" in s or "phi" in s
    if level == "linear":
        return any(x in s for x in ["n", "exp", "m", "min"])
    if level == "quadratic":
        if "n" not in s:
            return False
        match = re.search(r"n\^?\{?(\d+)\}?", s)
        if match:
            return int(match.group(1)) >= 2
        return "²" in s or "2" in s
    if level == "cubic":
        if "n" not in s:
            return False
        match = re.search(r"n\^?\{?(\d+)\}?", s)
        if match:
            return int(match.group(1)) >= 3
        return "³" in s or "3" in s
    return False


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
    Para recursivos, la theta puede estar en master, iteration, characteristic_equation, recursion_tree.
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


def assert_case_complexity(
    result: Dict[str, Any],
    case: str,
    expected_level: str,
    name: str = "",
) -> None:
    """
    Verifica que el caso indicado (worst, best, avg) tenga la complejidad esperada.
    case: "worst" | "best" | "avg"
    expected_level: "constant" | "log" | "linear" | "quadratic" | "cubic" | "exponential"
    """
    totals = get_totals(result, case)
    notation = get_notation_from_totals(totals)
    assert notation_has_complexity(notation, expected_level), (
        f"[{name}] {case.upper()}: esperado {expected_level}, obtenido: {notation!r}"
    )


def assert_worst_complexity(
    result: Dict[str, Any],
    expected_level: str,
    name: str = "",
) -> None:
    """
    Verifica que el worst case tenga la complejidad esperada.
    expected_level: "constant" | "log" | "linear" | "quadratic" | "cubic" | "exponential"
    """
    assert_case_complexity(result, "worst", expected_level, name)


def assert_all_cases_complexity(
    result: Dict[str, Any],
    expected_worst: str,
    expected_best: Optional[str] = None,
    expected_avg: Optional[str] = None,
    name: str = "",
) -> None:
    """
    Valida worst, best y avg según corresponda.
    Si expected_best/expected_avg es None, se usa expected_worst (determinístico).
    Si best/avg es "same_as_worst", no se valida por separado (ya cubierto por worst).
    """
    assert_case_complexity(result, "worst", expected_worst, name)
    best = result.get("best")
    avg = result.get("avg")
    best_level = expected_best if expected_best is not None else expected_worst
    avg_level = expected_avg if expected_avg is not None else expected_worst
    if best != "same_as_worst" and isinstance(best, dict):
        assert_case_complexity(result, "best", best_level, name)
    if avg != "same_as_worst" and avg is not None and isinstance(avg, dict):
        assert_case_complexity(result, "avg", avg_level, name)
