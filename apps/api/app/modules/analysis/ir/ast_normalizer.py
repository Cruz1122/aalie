"""
Normalizador de AST para representación estable y única.

Homogeneiza op/operator y produce nodos con campos consistentes
para que ningún módulo lea nodos crudos con diferencias de formato.

Author: @Cruz1122
Version: 0.1.0
"""

from typing import Any


def _normalize_op(node: dict) -> dict:
    """Asegura que op esté presente (desde op o operator)."""
    if "op" not in node or not node["op"]:
        node = dict(node)
        node["op"] = node.get("operator", "")
    if "operator" not in node or not node["operator"]:
        node = dict(node)
        node["operator"] = node.get("op", "")
    return node


def normalize_expr(expr: Any, _path: str = "") -> Any:
    """
    Normaliza una expresión del AST.

    - Homogeneiza op/operator en nodos Binary y Unary
    - Retorna copia shallow con campos normalizados

    Args:
        expr: Expresión del AST
        _path: Ruta interna para trazabilidad (opcional)

    Returns:
        Expresión normalizada (copia si es dict)
    """
    if expr is None or isinstance(expr, (str, int, float, bool)):
        return expr
    if isinstance(expr, dict):
        expr_type = (expr.get("type") or "").lower()
        out = dict(expr)
        if expr_type == "binary":
            out = _normalize_op(out)
            out["left"] = normalize_expr(out.get("left"), f"{_path}.left")
            out["right"] = normalize_expr(out.get("right"), f"{_path}.right")
        elif expr_type == "unary":
            if "operator" not in out or not out["operator"]:
                out["operator"] = out.get("op", "")
            if "op" not in out or not out["op"]:
                out["op"] = out.get("operator", "")
            out["arg"] = normalize_expr(out.get("arg"), f"{_path}.arg")
        elif expr_type == "index":
            out["target"] = normalize_expr(out.get("target"), f"{_path}.target")
            out["index"] = normalize_expr(out.get("index"), f"{_path}.index")
        return out
    return expr


def normalize_node(node: Any, parent_path: str = "") -> Any:
    """
    Normaliza un nodo completo del AST (Block, If, While, Assign, etc.).

    Aplica normalize_expr a expresiones anidadas.

    Args:
        node: Nodo del AST
        parent_path: Ruta del padre para IDs estables

    Returns:
        Nodo normalizado
    """
    if node is None or not isinstance(node, dict):
        return node
    out = dict(node)
    node_type = (out.get("type") or "").lower()
    if node_type == "while":
        out["test"] = normalize_expr(out.get("test"), "test")
        body = out.get("body")
        if body:
            out["body"] = normalize_node(body, f"{parent_path}.body")
    elif node_type == "repeat":
        out["test"] = normalize_expr(out.get("test"), "test")
        body = out.get("body")
        if body:
            out["body"] = normalize_node(body, f"{parent_path}.body")
    elif node_type == "if":
        out["test"] = normalize_expr(out.get("test"), "test")
        out["consequent"] = normalize_node(out.get("consequent"), f"{parent_path}.then")
        out["alternate"] = normalize_node(out.get("alternate"), f"{parent_path}.else")
    elif node_type == "assign":
        out["target"] = normalize_expr(out.get("target"), "target")
        out["value"] = normalize_expr(out.get("value"), "value")
    elif node_type == "block":
        out["body"] = [
            normalize_node(stmt, f"{parent_path}.body[{i}]")
            for i, stmt in enumerate(out.get("body") or [])
        ]
    elif node_type == "for":
        out["variable"] = normalize_expr(out.get("variable"), "variable")
        out["start"] = normalize_expr(out.get("start"), "start")
        out["end"] = normalize_expr(out.get("end"), "end")
        out["body"] = normalize_node(out.get("body"), f"{parent_path}.body")
    return out
