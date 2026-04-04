"""
Patrón: recorrido tipo Gnome Sort con comparación adyacente y swap local.

Detecta la forma estructural clásica:
- WHILE (i <= n)
- IF (i == 1) THEN i <- i + 1
- ELSE IF (A[i] >= A[i - 1]) THEN i <- i + 1
- ELSE swap(A[i], A[i - 1]); i <- i - 1
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from .base import IterationBoundResult, TerminationResult, WhilePattern


def _node_type(node: Any) -> str:
    if not isinstance(node, dict):
        return ""
    return str(node.get("type", "")).lower()


def _node_op(node: Any) -> str:
    if not isinstance(node, dict):
        return ""
    return str(node.get("op", "") or node.get("operator", "")).lower()


def _identifier_name(node: Any) -> Optional[str]:
    if _node_type(node) != "identifier":
        return None
    name = node.get("name")
    return str(name) if isinstance(name, str) and name else None


def _literal_int(node: Any) -> Optional[int]:
    if _node_type(node) not in {"literal", "number"}:
        return None
    value = node.get("value")
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _normalize_statements(node: Any) -> List[Dict[str, Any]]:
    if isinstance(node, list):
        return [item for item in node if isinstance(item, dict)]
    if not isinstance(node, dict):
        return []
    if _node_type(node) == "block":
        return [item for item in (node.get("body") or []) if isinstance(item, dict)]
    return [node]


def _is_var_plus_minus_const(node: Any, var_name: str, op: str, const: int) -> bool:
    if _node_type(node) != "binary" or _node_op(node) != op:
        return False
    left = _identifier_name(node.get("left"))
    right = _literal_int(node.get("right"))
    return left == var_name and right == const


def _assigns_var_step(stmt: Any, var_name: str, op: str) -> bool:
    if _node_type(stmt) != "assign":
        return False
    target = _identifier_name(stmt.get("target"))
    if target != var_name:
        return False
    return _is_var_plus_minus_const(stmt.get("value"), var_name, op, 1)


def _is_index_of_array(node: Any, array_name: str, index_name: str) -> bool:
    if _node_type(node) != "index":
        return False
    return (
        _identifier_name(node.get("target")) == array_name
        and _identifier_name(node.get("index")) == index_name
    )


def _is_index_of_array_minus_one(node: Any, array_name: str, index_name: str) -> bool:
    if _node_type(node) != "index":
        return False
    if _identifier_name(node.get("target")) != array_name:
        return False
    index = node.get("index")
    return _is_var_plus_minus_const(index, index_name, "-", 1)


def _is_adjacent_compare(test: Any, index_name: str) -> Optional[str]:
    if _node_type(test) != "binary" or _node_op(test) not in {">=", "<="}:
        return None
    left = test.get("left")
    right = test.get("right")
    if _node_type(left) != "index" or _node_type(right) != "index":
        return None
    array_name = _identifier_name(left.get("target"))
    if not array_name or _identifier_name(right.get("target")) != array_name:
        return None
    if _is_index_of_array(
        left, array_name, index_name
    ) and _is_index_of_array_minus_one(right, array_name, index_name):
        return array_name
    if _is_index_of_array_minus_one(
        left, array_name, index_name
    ) and _is_index_of_array(right, array_name, index_name):
        return array_name
    return None


def _has_adjacent_swap(
    statements: List[Dict[str, Any]], array_name: str, index_name: str
) -> bool:
    saw_down_step = False
    saw_forward_value = False
    saw_backward_value = False
    saw_write_current = False
    saw_write_prev = False

    for stmt in statements:
        if _assigns_var_step(stmt, index_name, "-"):
            saw_down_step = True
            continue
        if _node_type(stmt) != "assign":
            continue
        target = stmt.get("target")
        value = stmt.get("value")
        if _is_index_of_array(value, array_name, index_name):
            saw_forward_value = True
        if _is_index_of_array_minus_one(value, array_name, index_name):
            saw_backward_value = True
        if _is_index_of_array(target, array_name, index_name):
            saw_write_current = True
        if _is_index_of_array_minus_one(target, array_name, index_name):
            saw_write_prev = True

    return all(
        [
            saw_down_step,
            saw_forward_value,
            saw_backward_value,
            saw_write_current,
            saw_write_prev,
        ]
    )


class GnomeSortCursorPattern(WhilePattern):
    """Detecta el cursor bidireccional acotado de Gnome Sort."""

    def matches(self, while_ctx: Dict[str, Any]) -> bool:
        guard = while_ctx.get("guard_info")
        while_node = while_ctx.get("while_node") or {}
        if not guard:
            return False

        atoms = getattr(guard, "atoms", []) or []
        if len(atoms) != 1:
            return False
        atom = atoms[0]
        if not isinstance(atom, dict) or atom.get("op") not in {"<", "<="}:
            return False

        index_name = str(atom.get("var") or "")
        limit_name = str(atom.get("limit") or "")
        if not index_name or not limit_name:
            return False

        body_statements = _normalize_statements(while_node.get("body"))
        if len(body_statements) != 1 or _node_type(body_statements[0]) != "if":
            return False

        outer_if = body_statements[0]
        outer_test = outer_if.get("test") or {}
        if _node_type(outer_test) != "binary" or _node_op(outer_test) not in {
            "=",
            "==",
        }:
            return False
        if _identifier_name(outer_test.get("left")) != index_name:
            return False
        if _literal_int(outer_test.get("right")) != 1:
            return False

        outer_then = _normalize_statements(outer_if.get("consequent"))
        if not any(_assigns_var_step(stmt, index_name, "+") for stmt in outer_then):
            return False

        outer_else = _normalize_statements(outer_if.get("alternate"))
        if len(outer_else) != 1 or _node_type(outer_else[0]) != "if":
            return False

        inner_if = outer_else[0]
        array_name = _is_adjacent_compare(inner_if.get("test"), index_name)
        if not array_name:
            return False

        inner_then = _normalize_statements(inner_if.get("consequent"))
        if not any(_assigns_var_step(stmt, index_name, "+") for stmt in inner_then):
            return False

        inner_else = _normalize_statements(inner_if.get("alternate"))
        if not inner_else or not _has_adjacent_swap(inner_else, array_name, index_name):
            return False

        return True

    def derive_termination(self, while_ctx: Dict[str, Any]) -> TerminationResult:
        return TerminationResult(
            proven_terminating=True,
            proven_non_terminating=False,
            not_proven=False,
        )

    def derive_iterations(self, while_ctx: Dict[str, Any]) -> IterationBoundResult:
        guard = while_ctx.get("guard_info")
        atoms = getattr(guard, "atoms", []) or []
        atom = atoms[0] if atoms else {}
        limit_name = str(atom.get("limit") or "n")
        mode = str(while_ctx.get("mode") or "worst")

        if mode == "best":
            return IterationBoundResult(
                exact_symbolic_bound=limit_name,
                asymptotic_bound="O(n)",
                not_proven=False,
                iterations_class="linear",
                evidence_level="strong",
                reason_code="while_gnome_sort_cursor",
            )

        return IterationBoundResult(
            exact_symbolic_bound=f"{limit_name}^2",
            asymptotic_bound="O(n^2)",
            not_proven=False,
            iterations_class="quadratic",
            evidence_level="strong",
            reason_code="while_gnome_sort_cursor",
        )

    def explain(self, while_ctx: Dict[str, Any]) -> list:
        return [
            "Gnome sort cursor: adjacent comparison, local swap, cursor steps back after inversion"
        ]
