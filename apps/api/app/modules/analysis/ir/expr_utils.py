"""
Utilidades unificadas para expresiones del AST.

Proporciona conversión a string, extracción de variables, clasificación de tipo
y comparación estructural. Homogeneiza op/operator del parser.

Author: @Cruz1122
Version: 0.1.0
"""

from typing import Any, Set


def _get_op(expr: dict) -> str:
    """Obtiene el operador normalizado (op o operator)."""
    return expr.get("op", "") or expr.get("operator", "")


def expr_to_str(expr: Any) -> str:
    """
    Convierte una expresión del AST a string.

    Soporta: Identifier, Number, Literal, Binary, Unary, Index.
    Homogeneiza op/operator del parser.

    Args:
        expr: Expresión del AST (dict, str, int, float, None)

    Returns:
        String representando la expresión
    """
    if expr is None:
        return ""
    if isinstance(expr, str):
        return expr
    if isinstance(expr, (int, float)):
        return str(expr)
    if isinstance(expr, dict):
        expr_type = (expr.get("type") or "").lower()
        if expr_type == "identifier":
            return expr.get("name", "unknown")
        if expr_type in ("number", "literal"):
            return str(expr.get("value", "0"))
        if expr_type == "binary":
            left = expr_to_str(expr.get("left", ""))
            right = expr_to_str(expr.get("right", ""))
            op = _get_op(expr) or "-"
            return f"({left}) {op} ({right})"
        if expr_type == "index":
            target = expr_to_str(expr.get("target", ""))
            index = expr_to_str(expr.get("index", ""))
            return f"{target}[{index}]"
        if expr_type == "unary":
            arg = expr_to_str(expr.get("arg", ""))
            op = expr.get("operator", "") or expr.get("op", "")
            return f"{op}({arg})"
        return str(expr.get("value", str(expr)))
    return str(expr)


def expr_vars(expr: Any) -> Set[str]:
    """
    Extrae los identificadores (variables) de una expresión.

    Args:
        expr: Expresión del AST

    Returns:
        Conjunto de nombres de variables
    """
    out: Set[str] = set()
    if expr is None:
        return out
    if isinstance(expr, dict):
        expr_type = (expr.get("type") or "").lower()
        if expr_type == "identifier":
            name = expr.get("name", "")
            if name:
                out.add(name)
            return out
        if expr_type in ("number", "literal"):
            return out
        if expr_type == "binary":
            out.update(expr_vars(expr.get("left")))
            out.update(expr_vars(expr.get("right")))
            return out
        if expr_type == "index":
            out.update(expr_vars(expr.get("target")))
            out.update(expr_vars(expr.get("index")))
            return out
        if expr_type == "unary":
            out.update(expr_vars(expr.get("arg")))
            return out
    return out


def expr_kind(expr: Any) -> str:
    """
    Retorna el tipo/kind de la expresión: identifier, number, literal,
    binary, unary, index, unknown.

    Args:
        expr: Expresión del AST

    Returns:
        Tipo de la expresión
    """
    if expr is None or not isinstance(expr, dict):
        return "unknown"
    return (expr.get("type") or "unknown").lower()


def is_numeric_expr(expr: Any) -> bool:
    """True si la expresión es numérica (number, literal numérico, binary aritmético)."""
    if expr is None:
        return False
    if isinstance(expr, (int, float)):
        return True
    if isinstance(expr, dict):
        t = expr_kind(expr)
        if t in ("number", "literal"):
            v = expr.get("value")
            return isinstance(v, (int, float)) or (
                isinstance(v, str) and v.lstrip("-").replace(".", "").isdigit()
            )
        if t == "binary":
            op = _get_op(expr).lower()
            return op in ("+", "-", "*", "/", "//", "mod", "div")
        if t == "unary":
            op = (expr.get("operator") or expr.get("op") or "").lower()
            return op in ("-", "+")
    return False


def is_boolean_expr(expr: Any) -> bool:
    """True si la expresión es booleana (literal true/false, identifier bool, and/or/not)."""
    if expr is None:
        return False
    if isinstance(expr, bool):
        return True
    if isinstance(expr, dict):
        t = expr_kind(expr)
        if t == "literal":
            v = expr.get("value")
            return isinstance(v, bool) or (
                isinstance(v, str)
                and v.lower() in ("true", "false", "verdadero", "falso")
            )
        if t == "identifier":
            n = (expr.get("name") or "").lower()
            return n in ("true", "false", "verdadero", "falso", "v", "f")
        if t == "binary":
            op = _get_op(expr).lower()
            return op in ("and", "or", "==", "!=", "=")
        if t == "unary":
            op = (expr.get("operator") or expr.get("op") or "").lower()
            return op == "not"
    return False


def is_literal_true(expr: Any) -> bool:
    """True si expr es literal True (Literal, Number o Identifier 'true'/'verdadero')."""
    if expr is None:
        return False
    if expr is True:
        return True
    if isinstance(expr, dict):
        t = (expr.get("type") or "").lower()
        if t == "literal":
            v = expr.get("value")
            if isinstance(v, bool):
                return v is True
            if isinstance(v, str):
                return v.lower().strip() in ("true", "verdadero", "verdad", "v")
        if t == "identifier":
            return (expr.get("name") or "").lower() in (
                "true",
                "verdadero",
                "verdad",
                "v",
            )
    return False


def is_literal_false(expr: Any) -> bool:
    """True si expr es literal False (Literal, Number o Identifier 'false'/'falso')."""
    if expr is None:
        return False
    if expr is False:
        return True
    if isinstance(expr, dict):
        t = (expr.get("type") or "").lower()
        if t == "literal":
            v = expr.get("value")
            if isinstance(v, bool):
                return v is False
            if isinstance(v, str):
                return v.lower().strip() in ("false", "falso", "f")
        if t == "identifier":
            return (expr.get("name") or "").lower() in ("false", "f", "falso")
    return False


def expr_equals(a: Any, b: Any) -> bool:
    """
    Compara dos expresiones por estructura (no por identidad).

    Args:
        a, b: Expresiones del AST

    Returns:
        True si son estructuralmente equivalentes
    """
    if a is b:
        return True
    if a is None or b is None:
        return a is b
    if a.__class__ is not b.__class__:
        return False
    if isinstance(a, (str, int, float)):
        return a == b
    if isinstance(a, dict) and isinstance(b, dict):
        if expr_kind(a) != expr_kind(b):
            return False
        if expr_kind(a) == "identifier":
            return (a.get("name") or "") == (b.get("name") or "")
        if expr_kind(a) in ("number", "literal"):
            return (a.get("value")) == (b.get("value"))
        if expr_kind(a) == "binary":
            return (
                _get_op(a) == _get_op(b)
                and expr_equals(a.get("left"), b.get("left"))
                and expr_equals(a.get("right"), b.get("right"))
            )
        if expr_kind(a) == "unary":
            return (a.get("operator") or a.get("op")) == (
                b.get("operator") or b.get("op")
            ) and expr_equals(a.get("arg"), b.get("arg"))
        if expr_kind(a) == "index":
            return expr_equals(a.get("target"), b.get("target")) and expr_equals(
                a.get("index"), b.get("index")
            )
    return False


def is_simple_constant(s: str) -> bool:
    """True si s es una constante numérica simple (parseable como float)."""
    if not s or not isinstance(s, str):
        return False
    try:
        float(s.strip())
        return True
    except (ValueError, TypeError):
        return False
