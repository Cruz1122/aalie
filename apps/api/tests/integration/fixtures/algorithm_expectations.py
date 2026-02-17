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
    level: "constant" | "log" | "linear" | "quadratic" | "cubic"
    """
    if not notation:
        return False
    s = notation.lower().replace("\\", "")
    if level == "constant":
        return is_o1_notation(notation)
    if level == "log":
        return "log" in s
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


def assert_worst_complexity(
    result: Dict[str, Any],
    expected_level: str,
    name: str = "",
) -> None:
    """
    Verifica que el worst case tenga la complejidad esperada.
    expected_level: "constant" | "log" | "linear" | "quadratic" | "cubic"
    """
    totals = get_totals(result, "worst")
    big_theta = totals.get("big_theta", "") or ""
    big_o = totals.get("big_o", "") or ""
    notation = big_theta or big_o
    assert notation_has_complexity(notation, expected_level), (
        f"[{name}] Esperado {expected_level}, obtenido: big_theta={big_theta!r}, big_o={big_o!r}"
    )
