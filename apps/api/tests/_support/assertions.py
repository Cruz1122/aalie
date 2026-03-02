"""
Oráculo único de aserciones semánticas para resultados de análisis de complejidad.
Toda verificación de complejidad en tests debe usar este módulo.

Author: Camilo Cruz (@Cruz1122)
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


def infer_complexity_class(notation: str) -> str:
    """
    Infere una clase de complejidad única a partir de la notación asintótica.
    
    Devuelve exactamente una de:
    constant | log | linear | nlogn | quadratic | cubic | exponential | unknown
    """
    if not notation:
        return "unknown"

    s = notation.strip()
    # Normalizar: minúsculas, sin backslashes ni espacios
    s_norm = s.lower().replace("\\", "").replace(" ", "")

    # Extraer expresión interna si viene como O(...), theta(...), omega(...)
    inner = s_norm
    for marker in ("o(", "theta(", "ω(", "omega("):
        idx = inner.find(marker)
        if idx != -1:
            start = idx + len(marker)
            end = inner.rfind(")")
            if end > start:
                inner = inner[start:end]
            else:
                inner = inner[start:]
            break

    expr = inner
    if not expr:
        return "unknown"

    # Símbolos que consideramos variables de tamaño (no constantes C_k)
    size_symbols = ["n", "m", "size", "length", "exp", "min"]

    def has_size_var() -> bool:
        return any(sym in expr for sym in size_symbols)

    # Número total (aprox.) de apariciones de variables de tamaño
    size_var_count = 0
    for sym in size_symbols:
        size_var_count += expr.count(sym)

    has_log = "log" in expr

    # --- Exponential ---
    # Patrones típicos: 2^n, a^n, exp(n), (c)^n, n^k con k>=4
    # Cualquier cosa elevada a n se considera exponencial
    if "exp(" in expr or re.search(r"\^\{?n\}?", expr):
        return "exponential"
    # n^k con k >= 4
    exp_match = re.search(r"\^\{?(\d+)\}?", expr)
    if exp_match:
        try:
            k = int(exp_match.group(1))
            if k >= 4:
                return "exponential"
        except ValueError:
            pass

    # --- Cubic ---
    if re.search(r"[a-z]\^\{?3\}?", expr):
        return "cubic"

    # --- Quadratic ---
    # Exponente 2 en alguna variable de tamaño
    if re.search(r"[a-z]\^\{?2\}?", expr):
        return "quadratic"
    # Producto (explícito o implícito) de dos o más variables de tamaño
    # Ej: mn, nm, 5mn, 3nm, n*m, m*n → al menos cuadrático
    if not has_log and size_var_count >= 2:
        return "quadratic"

    # --- n log n ---
    # Distinguir entre log puro (log n, log(min(a,b)), log(exp)) y n log n
    if has_log:
        # Patrones típicos para n log n (con o sin paréntesis / espacios)
        if re.search(r"nlogn", expr) or re.search(r"nlog\(n\)", expr):
            return "nlogn"
        if re.search(r"n\*logn", expr) or re.search(r"n\*log\(n\)", expr):
            return "nlogn"
        # Todo lo demás con log se considera logarítmico puro
        return "log"

    # --- Lineal ---
    if has_size_var():
        return "linear"

    # --- Constante ---
    if is_o1_notation(notation):
        return "constant"

    return "unknown"


def _notation_has_complexity(notation: str, level: str) -> bool:
    """
    True si la notación tiene exactamente la complejidad esperada.
    level: constant | log | linear | nlogn | quadratic | cubic | exponential
    """
    if not notation:
        return False
    inferred = infer_complexity_class(notation)
    return inferred == level


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
