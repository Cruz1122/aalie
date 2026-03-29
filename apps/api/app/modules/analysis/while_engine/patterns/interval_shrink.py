"""
Patrón general: reducción geométrica de intervalo por dos bordes.

Detecta guards del tipo left <= right y actualizaciones del intervalo
basadas en puntos internos (midpoint / terciles) que reducen el tamaño
del rango por un factor constante.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Tuple

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


def _literal_number(node: Any) -> Optional[int]:
    if _node_type(node) not in {"number", "literal"}:
        return None
    raw = node.get("value")
    try:
        return int(raw)
    except (TypeError, ValueError):
        try:
            return int(float(str(raw)))
        except (TypeError, ValueError):
            return None


def _normalize_statements(node: Any) -> List[Dict[str, Any]]:
    if isinstance(node, list):
        return [stmt for stmt in node if isinstance(stmt, dict)]
    if not isinstance(node, dict):
        return []
    if _node_type(node) == "block":
        return [stmt for stmt in (node.get("body") or []) if isinstance(stmt, dict)]
    return [node]


def _collect_assignments(node: Any) -> List[Tuple[str, Dict[str, Any]]]:
    collected: List[Tuple[str, Dict[str, Any]]] = []

    def _walk(current: Any) -> None:
        if isinstance(current, list):
            for item in current:
                _walk(item)
            return
        if not isinstance(current, dict):
            return
        current_type = _node_type(current)
        if current_type == "assign":
            target = _identifier_name(current.get("target"))
            value = current.get("value")
            if target and isinstance(value, dict):
                collected.append((target, value))
            return
        if current_type in {"while", "repeat", "for"}:
            return
        for value in current.values():
            if isinstance(value, (dict, list)):
                _walk(value)

    _walk(node)
    return collected


def _contains_return(node: Any) -> bool:
    if isinstance(node, list):
        return any(_contains_return(item) for item in node)
    if not isinstance(node, dict):
        return False
    if _node_type(node) == "return":
        return True
    for value in node.values():
        if isinstance(value, (dict, list)) and _contains_return(value):
            return True
    return False


def _if_branches(node: Dict[str, Any]) -> Tuple[Any, Any]:
    return node.get("consequent") or node.get("then"), node.get("alternate")


def _index_uses_helper(node: Any, helper_names: set[str]) -> bool:
    if _node_type(node) != "index":
        return False
    index = node.get("index")
    return (_identifier_name(index) or "") in helper_names


def _has_returning_equality(node: Any, helper_names: set[str]) -> bool:
    if isinstance(node, list):
        return any(_has_returning_equality(item, helper_names) for item in node)
    if not isinstance(node, dict):
        return False
    if _node_type(node) == "if":
        test = node.get("test") or {}
        op = _node_op(test)
        left = test.get("left") if isinstance(test, dict) else None
        right = test.get("right") if isinstance(test, dict) else None
        if op in {"=", "=="} and (
            _index_uses_helper(left, helper_names) or _index_uses_helper(right, helper_names)
        ):
            consequent, alternate = _if_branches(node)
            if _contains_return(consequent) or _contains_return(alternate):
                return True
    for value in node.values():
        if isinstance(value, (dict, list)) and _has_returning_equality(value, helper_names):
            return True
    return False


def _find_assignment(assignments: List[Tuple[str, Dict[str, Any]]], name: str) -> Optional[Dict[str, Any]]:
    for target, value in assignments:
        if target == name:
            return value
    return None


def _is_sum_of_vars(node: Any, left_name: str, right_name: str) -> bool:
    if _node_type(node) != "binary" or _node_op(node) != "+":
        return False
    left = _identifier_name(node.get("left"))
    right = _identifier_name(node.get("right"))
    return {left, right} == {left_name, right_name}


def _is_diff_of_vars(node: Any, left_name: str, right_name: str) -> bool:
    if _node_type(node) != "binary" or _node_op(node) != "-":
        return False
    left = _identifier_name(node.get("left"))
    right = _identifier_name(node.get("right"))
    return left == right_name and right == left_name


def _extract_midpoint_helper(
    assignments: List[Tuple[str, Dict[str, Any]]], left_name: str, right_name: str
) -> Optional[Tuple[str, int]]:
    for target, value in assignments:
        if _node_type(value) != "binary" or _node_op(value) not in {"/", "//", "div"}:
            continue
        divisor = _literal_number(value.get("right"))
        if divisor is None or divisor <= 1:
            continue
        if _is_sum_of_vars(value.get("left"), left_name, right_name):
            return target, divisor
    return None


def _extract_width_helper(
    assignments: List[Tuple[str, Dict[str, Any]]], left_name: str, right_name: str
) -> Optional[Tuple[str, int]]:
    for target, value in assignments:
        if _node_type(value) != "binary" or _node_op(value) not in {"/", "//", "div"}:
            continue
        divisor = _literal_number(value.get("right"))
        if divisor is None or divisor <= 1:
            continue
        if _is_diff_of_vars(value.get("left"), left_name, right_name):
            return target, divisor
    return None


def _extract_generic_interval_helper(
    assignments: List[Tuple[str, Dict[str, Any]]], left_name: str, right_name: str
) -> Optional[Dict[str, Any]]:
    for target, value in assignments:
        if _node_type(value) != "binary" or _node_op(value) not in {"/", "//", "div"}:
            continue
        left_expr = value.get("left")
        if _is_sum_of_vars(left_expr, left_name, right_name) or _is_diff_of_vars(
            left_expr, left_name, right_name
        ):
            return {
                "helper": target,
                "kind": "midpoint" if _is_sum_of_vars(left_expr, left_name, right_name) else "width",
            }
    return None


def _extract_offset_helpers(
    assignments: List[Tuple[str, Dict[str, Any]]],
    left_name: str,
    right_name: str,
    width_helper: str,
) -> Dict[str, str]:
    helpers: Dict[str, str] = {}
    for target, value in assignments:
        if _node_type(value) != "binary":
            continue
        op = _node_op(value)
        left = _identifier_name(value.get("left"))
        right = _identifier_name(value.get("right"))
        if op == "+" and left == left_name and right == width_helper:
            helpers["left_offset"] = target
        if op == "-" and left == right_name and right == width_helper:
            helpers["right_offset"] = target
    return helpers


def _is_boundary_update(value: Any, helper_name: str, operator: str) -> bool:
    if _node_type(value) != "binary":
        return False
    op = _node_op(value)
    if op != operator:
        return False
    helper_side = _identifier_name(value.get("left")) or _identifier_name(value.get("right"))
    const_side = value.get("right") if _identifier_name(value.get("left")) == helper_name else value.get("left")
    if helper_side != helper_name:
        return False
    return _literal_number(const_side) is not None


def _is_relative_interval_update(
    value: Any, target_name: str, helper_name: str, operator: str
) -> bool:
    if _node_type(value) != "binary" or _node_op(value) != operator:
        return False
    left_name = _identifier_name(value.get("left"))
    right_name = _identifier_name(value.get("right"))
    return {left_name, right_name} == {target_name, helper_name}


def _boundary_updates_from_helpers(
    assignments: List[Tuple[str, Dict[str, Any]]],
    left_name: str,
    right_name: str,
    helper_names: set[str],
) -> bool:
    left_updated = False
    right_updated = False
    for target, value in assignments:
        if target == left_name:
            if any(
                _identifier_name(value) == helper
                or _is_boundary_update(value, helper, "+")
                or _is_relative_interval_update(value, left_name, helper, "+")
                for helper in helper_names
            ):
                left_updated = True
        if target == right_name:
            if any(
                _identifier_name(value) == helper
                or _is_boundary_update(value, helper, "-")
                or _is_relative_interval_update(value, right_name, helper, "-")
                for helper in helper_names
            ):
                right_updated = True
    return left_updated or right_updated


def _infer_interval_size_symbol(while_ctx: Dict[str, Any], left_name: str, right_name: str) -> str:
    parent = while_ctx.get("parent_context")
    while_node = while_ctx.get("while_node") or {}
    while_line = (
        while_node.get("pos", {}).get("line", 0)
        if isinstance(while_node.get("pos"), dict)
        else 0
    )
    if not isinstance(parent, dict):
        return "n"
    body = parent.get("body", [])
    if not isinstance(body, list):
        return "n"

    init_values: Dict[str, str] = {}
    for stmt in body:
        if not isinstance(stmt, dict):
            continue
        stmt_line = stmt.get("pos", {}).get("line", 0)
        if stmt_line and while_line and stmt_line >= while_line:
            break
        if _node_type(stmt) != "assign":
            continue
        target = _identifier_name(stmt.get("target"))
        value = stmt.get("value")
        if target in {left_name, right_name} and isinstance(value, dict):
            literal = _literal_number(value)
            if literal is not None:
                init_values[target] = str(literal)
                continue
            identifier = _identifier_name(value)
            if identifier:
                init_values[target] = identifier

    right_init = init_values.get(right_name)
    left_init = init_values.get(left_name)
    if right_init and left_init in {"0", "1"}:
        return right_init
    if right_init:
        return right_init
    return "n"


def interval_shrink_signature(while_ctx: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    guard = while_ctx.get("guard_info")
    control = while_ctx.get("control_variables")
    while_node = while_ctx.get("while_node") or {}
    if not guard or not control:
        return None
    coupled = list(getattr(control, "coupled_controllers", []) or [])
    if len(coupled) < 2:
        return None

    atoms = getattr(guard, "atoms", []) or []
    interval_atom = None
    for atom in atoms:
        if isinstance(atom, dict) and atom.get("two_vars") and atom.get("op") in {"<=", "<"}:
            interval_atom = atom
            break
    if not interval_atom:
        return None

    left_name = str(interval_atom.get("var") or "")
    right_name = str(interval_atom.get("limit") or "")
    if not left_name or not right_name:
        return None

    assignments = _collect_assignments(while_node.get("body"))
    assigned_targets = {target for target, _ in assignments}
    if left_name not in assigned_targets and right_name not in assigned_targets:
        return None

    midpoint = _extract_midpoint_helper(assignments, left_name, right_name)
    if midpoint:
        helper_name, divisor = midpoint
        if _boundary_updates_from_helpers(assignments, left_name, right_name, {helper_name}):
            return {
                "kind": "midpoint",
                "left": left_name,
                "right": right_name,
                "divisor": divisor,
                "helper_names": {helper_name},
                "size_symbol": _infer_interval_size_symbol(while_ctx, left_name, right_name),
            }

    width = _extract_width_helper(assignments, left_name, right_name)
    if width:
        helper_name, divisor = width
        helper_names = {helper_name}
        helper_names.update(_extract_offset_helpers(assignments, left_name, right_name, helper_name).values())
        if _boundary_updates_from_helpers(assignments, left_name, right_name, helper_names):
            return {
                "kind": "width",
                "left": left_name,
                "right": right_name,
                "divisor": divisor,
                "helper_names": helper_names,
                "size_symbol": _infer_interval_size_symbol(while_ctx, left_name, right_name),
            }

    generic = _extract_generic_interval_helper(assignments, left_name, right_name)
    if generic:
        helper_names = {str(generic.get("helper") or "")}
        if _boundary_updates_from_helpers(assignments, left_name, right_name, helper_names):
            return {
                "kind": "generic",
                "left": left_name,
                "right": right_name,
                "divisor": None,
                "helper_names": helper_names,
                "size_symbol": _infer_interval_size_symbol(while_ctx, left_name, right_name),
            }

    return None


class IntervalShrinkPattern(WhilePattern):
    """Detecta reducción geométrica de intervalo controlado por dos bordes."""

    def matches(self, while_ctx: Dict[str, Any]) -> bool:
        return interval_shrink_signature(while_ctx) is not None

    def derive_termination(self, while_ctx: Dict[str, Any]) -> TerminationResult:
        return TerminationResult(
            proven_terminating=True,
            proven_non_terminating=False,
            not_proven=False,
        )

    def derive_iterations(self, while_ctx: Dict[str, Any]) -> IterationBoundResult:
        signature = interval_shrink_signature(while_ctx)
        if not signature:
            return IterationBoundResult(
                exact_symbolic_bound=None,
                asymptotic_bound=None,
                not_proven=True,
                iterations_class=None,
                evidence_level="weak",
            )

        mode = str(while_ctx.get("mode") or "worst")
        helper_names = set(signature.get("helper_names") or set())
        while_node = while_ctx.get("while_node") or {}
        if mode == "best" and helper_names and _has_returning_equality(while_node.get("body"), helper_names):
            return IterationBoundResult(
                exact_symbolic_bound="1",
                asymptotic_bound="O(1)",
                not_proven=False,
                iterations_class="constant",
                evidence_level="strong",
            )

        divisor = signature.get("divisor")
        size_symbol = str(signature.get("size_symbol") or "n")
        if isinstance(divisor, int) and divisor > 1:
            return IterationBoundResult(
                exact_symbolic_bound=f"\\log_{{{divisor}}}({size_symbol})",
                asymptotic_bound="O(log n)",
                not_proven=False,
                iterations_class="logarithmic",
                evidence_level="strong",
            )

        return IterationBoundResult(
            exact_symbolic_bound=None,
            asymptotic_bound=None,
            not_proven=False,
            iterations_class=None,
            evidence_level="medium",
        )

    def explain(self, while_ctx: Dict[str, Any]) -> list:
        signature = interval_shrink_signature(while_ctx)
        if not signature:
            return ["Interval shrink not proven"]
        divisor = signature.get("divisor")
        left_name = signature.get("left", "left")
        right_name = signature.get("right", "right")
        if isinstance(divisor, int) and divisor > 1:
            return [
                f"Interval shrink: {left_name}..{right_name} reduces by factor {divisor}"
            ]
        return [
            f"Interval shrink: {left_name}..{right_name} decreases monotonically but the shrink factor is not fully proven"
        ]
