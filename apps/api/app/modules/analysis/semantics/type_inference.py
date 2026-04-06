"""
Inferencia de tipos para símbolos.

Infiere numeric, boolean, array, unknown a partir del uso en el AST,
sin mirar nombres de variables.

Author: @Cruz1122
Version: 0.1.0
"""

from typing import TYPE_CHECKING, Any, Dict

from ..ir.expr_utils import expr_kind, expr_vars, is_literal_false, is_literal_true

if TYPE_CHECKING:
    from .symbol_table import SymbolTable


def infer_type_from_expr(expr: Any) -> str:
    """
    Infiere el tipo de una expresión a partir de su estructura.

    Returns:
        numeric | boolean | array | unknown
    """
    if expr is None:
        return "unknown"
    if isinstance(expr, dict):
        t = expr_kind(expr)
        if t in ("number", "literal"):
            v = expr.get("value")
            if isinstance(v, bool):
                return "boolean"
            if isinstance(v, (int, float)):
                return "numeric"
            if isinstance(v, str) and v.lower() in (
                "true",
                "false",
                "verdadero",
                "falso",
            ):
                return "boolean"
            return "numeric"
        if t == "identifier":
            return "unknown"  # Se refina en contexto
        if t == "binary":
            op = (expr.get("op") or expr.get("operator") or "").lower()
            if op in ("and", "or"):
                return "boolean"
            if op in ("==", "!=", "=", "<", "<=", ">", ">="):
                return "boolean"
            if op in ("+", "-", "*", "/", "//", "mod", "div"):
                return "numeric"
        if t == "unary":
            op = (expr.get("operator") or expr.get("op") or "").lower()
            if op == "not":
                return "boolean"
            if op in ("-", "+"):
                return "numeric"
        if t == "index":
            return "unknown"  # El target es array, el index es numeric
    return "unknown"


def infer_type_from_usage(
    node: Any,
    symbol: str,
    in_guard: bool = False,
    in_assign_target: bool = False,
    in_index: bool = False,
) -> str:
    """
    Refina el tipo de un símbolo según su uso en un nodo.

    Args:
        node: Nodo del AST donde aparece el símbolo
        symbol: Nombre del símbolo
        in_guard: True si está en condición de guard
        in_assign_target: True si es target de asignación
        in_index: True si se usa como índice A[symbol]
    """
    if not isinstance(node, dict):
        return "unknown"
    t = expr_kind(node)
    if t == "binary":
        op = (node.get("op") or node.get("operator") or "").lower()
        if op in ("and", "or"):
            return "boolean"
        if op in ("==", "!=", "="):
            left = node.get("left")
            right = node.get("right")
            if (
                is_literal_true(right)
                or is_literal_false(right)
                or is_literal_true(left)
                or is_literal_false(left)
            ):
                return "boolean"
        if op in ("<", "<=", ">", ">=", "+", "-", "*", "/", "//", "mod", "div"):
            return "numeric"
    if t == "unary":
        op = (node.get("operator") or node.get("op") or "").lower()
        if op == "not":
            return "boolean"
    if in_index:
        return "numeric"
    return "unknown"


def infer_type(proc_ast: Dict[str, Any], symbol_table: "SymbolTable") -> None:
    """
    Refina los tipos de todos los símbolos en la tabla
    recorriendo el AST del procedimiento.

    Modifica symbol_table in-place.
    """
    body = proc_ast.get("body")
    if not body:
        return
    _infer_types_rec(body, symbol_table, in_guard=False)


def _infer_types_rec(node: Any, table: "SymbolTable", in_guard: bool) -> None:
    """Recorre el AST y refina tipos."""
    if not isinstance(node, dict):
        return
    t = (node.get("type") or "").lower()
    if t == "assign":
        target = node.get("target")
        value = node.get("value")
        if isinstance(target, dict) and target.get("type", "").lower() == "identifier":
            name = target.get("name", "")
            if name:
                info = table.get_or_create(name)
                kind = infer_type_from_expr(value)
                if kind != "unknown":
                    info.kind = kind
        _infer_types_rec(value, table, False)
        return
    if t == "binary":
        left = node.get("left")
        right = node.get("right")
        op = (node.get("op") or node.get("operator") or "").lower()
        for var in expr_vars(node):
            if var:
                info = table.get_or_create(var)
                if in_guard or op in ("and", "or", "==", "!=", "="):
                    if (
                        is_literal_true(right)
                        or is_literal_false(right)
                        or is_literal_true(left)
                        or is_literal_false(left)
                    ):
                        info.kind = "boolean"
                    elif op in ("and", "or"):
                        info.kind = "boolean"
                if op in ("<", "<=", ">", ">=", "+", "-", "*", "/", "//", "mod", "div"):
                    info.kind = "numeric"
        _infer_types_rec(left, table, in_guard)
        _infer_types_rec(right, table, in_guard)
        return
    if t == "index":
        target = node.get("target")
        index = node.get("index")
        for var in expr_vars(index):
            if var:
                info = table.get_or_create(var)
                info.kind = "numeric"
                info.participates_in_index = True
        for var in expr_vars(target):
            if var:
                info = table.get_or_create(var)
                info.kind = "array"
        return
    if t == "block":
        for stmt in node.get("body") or []:
            _infer_types_rec(stmt, table, in_guard)
        return
    if t == "if":
        _infer_types_rec(node.get("test"), table, True)
        _infer_types_rec(node.get("consequent"), table, False)
        _infer_types_rec(node.get("alternate"), table, False)
        return
    if t in ("while", "repeat"):
        test = node.get("test")
        for var in expr_vars(test):
            if var:
                info = table.get_or_create(var)
                info.participates_in_guard = True
        _infer_types_rec(test, table, True)
        _infer_types_rec(node.get("body"), table, False)
        return
    if t == "for":
        _infer_types_rec(node.get("body"), table, False)
        return
