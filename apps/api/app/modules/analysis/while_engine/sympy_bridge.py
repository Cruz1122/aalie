"""
Bridge formal con SymPy para el motor WHILE.

Traduce IR a SymPy de forma segura.
Crea símbolos dinámicamente desde la tabla semántica (sin hardcodear i, j, k, n).
Memoización y límites para evitar explosión simbólica.

Author: @Cruz1122
Version: 0.1.0
"""
from functools import lru_cache
from typing import Any, Dict, Optional, Set
from sympy import Symbol, Integer, sympify, Expr, log as sympy_log, Min, Max

# Límite de tamaño para simplificación
_MAX_TREE_SIZE = 500


def _create_symbols_for_vars(var_names: Set[str], main_var: str = "n") -> Dict[str, Expr]:
    """Crea símbolos SymPy dinámicamente para las variables dadas."""
    syms: Dict[str, Expr] = {}
    for name in var_names:
        if not name:
            continue
        if name == main_var or name.lower() in ("n", "m", "size", "length"):
            syms[name] = Symbol(name, integer=True, positive=True)
        else:
            syms[name] = Symbol(name, integer=True)
    if main_var not in syms:
        syms[main_var] = Symbol(main_var, integer=True, positive=True)
    return syms


def to_sympy(
    expr_str: str,
    var_names: Optional[Set[str]] = None,
    main_var: str = "n",
) -> Expr:
    """
    Convierte string de expresión a SymPy.

    Usa símbolos dinámicos para las variables en var_names.
    """
    if not expr_str or not expr_str.strip():
        return Integer(1)
    var_names = var_names or set()
    syms = _create_symbols_for_vars(var_names, main_var)
    syms["log"] = sympy_log
    syms["Min"] = Min
    syms["Max"] = Max
    try:
        return sympify(expr_str.strip(), locals=syms)
    except Exception:
        return Integer(1)


def safe_simplify(expr: Expr, max_size: int = _MAX_TREE_SIZE) -> Expr:
    """Simplifica con límite de tamaño para evitar explosión."""
    try:
        if expr.count_ops() > max_size:
            return expr
        from sympy import simplify
        return simplify(expr)
    except Exception:
        return expr


# Memoización para expresiones frecuentes
@lru_cache(maxsize=128)
def _cached_sympify(expr_str: str, main_var: str = "n") -> Expr:
    """Versión cacheada para expresiones sin variables dinámicas."""
    return to_sympy(expr_str, set(), main_var)
