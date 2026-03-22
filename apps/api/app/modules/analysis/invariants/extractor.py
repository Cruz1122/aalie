"""Deterministic extraction of local loop evidence from AST nodes."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

from ..ir.expr_utils import expr_to_str, expr_vars
from .schemas import LoopFacts, LoopNodeType

COMPARISON_OPS = {"<", "<=", ">", ">=", "==", "!=", "=", "<>"}


def _has_name_hint(name: str, hints: tuple[str, ...]) -> bool:
    lowered = name.lower()
    return any(token in lowered for token in hints)


@dataclass(slots=True)
class _LoopScanState:
    condition_reads: Set[str] = field(default_factory=set)
    body_reads: Set[str] = field(default_factory=set)
    body_writes: Set[str] = field(default_factory=set)
    accumulators: Set[str] = field(default_factory=set)
    bound_variables: Set[str] = field(default_factory=set)
    collection_variables: Set[str] = field(default_factory=set)
    target_variables: Set[str] = field(default_factory=set)

    key_updates: List[str] = field(default_factory=list)
    key_conditions: List[str] = field(default_factory=list)
    comparisons: List[str] = field(default_factory=list)
    detected_features: Set[str] = field(default_factory=set)

    direction_by_control: Dict[str, Set[str]] = field(default_factory=dict)

    assignment_count: int = 0
    conditional_count: int = 0
    nested_loop_count: int = 0
    body_statement_count: int = 0
    non_trivial_statement_count: int = 0
    return_count: int = 0
    collection_read_count: int = 0
    collection_write_count: int = 0
    condition_comparison_count: int = 0
    swap_like_count: int = 0
    has_early_exit: bool = False
    shift_like_count: int = 0

    index_write_patterns: List[Tuple[Tuple[Optional[str], Optional[str], Optional[int]], List[Tuple[Optional[str], Optional[str], Optional[int]]]]] = field(
        default_factory=list
    )
    identifier_copies: List[Tuple[str, str]] = field(default_factory=list)
    mod_updates: List[Tuple[str, str, str]] = field(default_factory=list)
    halving_updates: List[str] = field(default_factory=list)
    square_updates: List[Tuple[str, str]] = field(default_factory=list)
    conditional_mul_accumulators: List[Tuple[str, Optional[str]]] = field(default_factory=list)
    modulus_candidates: Set[str] = field(default_factory=set)


def _node_type(node: Any) -> str:
    if not isinstance(node, dict):
        return ""
    return str(node.get("type", "")).strip().lower()


def _sorted(values: Iterable[str]) -> List[str]:
    return sorted({v for v in values if isinstance(v, str) and v.strip()})


def _line_of(node: Dict[str, Any]) -> Optional[int]:
    pos = node.get("pos") if isinstance(node, dict) else None
    if not isinstance(pos, dict):
        return None
    line = pos.get("line")
    if isinstance(line, int) and line > 0:
        return line
    return None


def _subtree_lines(node: Any) -> List[int]:
    lines: List[int] = []

    def _walk(value: Any) -> None:
        if isinstance(value, dict):
            line = _line_of(value)
            if line is not None:
                lines.append(line)
            for child in value.values():
                if isinstance(child, (dict, list)):
                    _walk(child)
        elif isinstance(value, list):
            for child in value:
                if isinstance(child, (dict, list)):
                    _walk(child)

    _walk(node)
    return lines


def _max_line(node: Dict[str, Any]) -> Optional[int]:
    lines = _subtree_lines(node)
    if not lines:
        return None
    return max(lines)


def _base_identifier(expr: Any) -> Optional[str]:
    t = _node_type(expr)
    if t == "identifier":
        name = expr.get("name")
        return name if isinstance(name, str) and name else None
    if t == "index":
        return _base_identifier(expr.get("target"))
    if t == "field":
        target_name = _base_identifier(expr.get("target"))
        field_name = expr.get("name")
        if target_name and isinstance(field_name, str) and field_name:
            return f"{target_name}.{field_name}"
    return None


def _literal_number(expr: Any) -> Optional[float]:
    t = _node_type(expr)
    if t in ("literal", "number"):
        value = expr.get("value")
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            text = value.strip()
            try:
                return float(text)
            except ValueError:
                return None
    if t == "unary" and (expr.get("op") == "-" or expr.get("operator") == "-"):
        arg_number = _literal_number(expr.get("arg"))
        if arg_number is not None:
            return -arg_number
    return None


def _index_signature(index_expr: Any) -> Tuple[Optional[str], Optional[str], Optional[int]]:
    if _node_type(index_expr) != "index":
        return (None, None, None)

    base = _base_identifier(index_expr)
    idx_expr = index_expr.get("index")
    idx_type = _node_type(idx_expr)

    if idx_type == "identifier":
        return (base, idx_expr.get("name"), 0)

    if idx_type == "binary":
        op = str(idx_expr.get("op") or idx_expr.get("operator") or "")
        left = idx_expr.get("left")
        right = idx_expr.get("right")

        if _node_type(left) == "identifier" and _literal_number(right) is not None and op in ("+", "-"):
            value = int(_literal_number(right) or 0)
            offset = value if op == "+" else -value
            return (base, left.get("name"), offset)

        if _node_type(right) == "identifier" and _literal_number(left) is not None and op == "+":
            return (base, right.get("name"), int(_literal_number(left) or 0))

    return (base, None, None)


def _collect_index_signatures(expr: Any, out: List[Tuple[Optional[str], Optional[str], Optional[int]]]) -> None:
    if isinstance(expr, list):
        for item in expr:
            _collect_index_signatures(item, out)
        return

    if not isinstance(expr, dict):
        return

    t = _node_type(expr)
    if t == "index":
        out.append(_index_signature(expr))

    for child in expr.values():
        if isinstance(child, (dict, list)):
            _collect_index_signatures(child, out)


def _looks_adjacent(a: Tuple[Optional[str], Optional[str], Optional[int]], b: Tuple[Optional[str], Optional[str], Optional[int]]) -> bool:
    base_a, var_a, offset_a = a
    base_b, var_b, offset_b = b
    if not base_a or not base_b:
        return False
    if base_a != base_b:
        return False
    if not var_a or not var_b:
        return False
    if var_a != var_b:
        return False
    if offset_a is None or offset_b is None:
        return False
    return abs(offset_a - offset_b) == 1


def _read_vars_from_lvalue(target: Any) -> Set[str]:
    t = _node_type(target)
    if t == "identifier":
        return set()
    if t == "index":
        out = set(expr_vars(target.get("index")))
        target_name = _base_identifier(target)
        if target_name:
            out.add(target_name)
        nested = target.get("target")
        out.update(_read_vars_from_lvalue(nested))
        return out
    if t == "field":
        return set(expr_vars(target.get("target")))
    return set()


def _write_vars_from_lvalue(target: Any) -> Set[str]:
    name = _base_identifier(target)
    if not name:
        return set()
    return {name}


def _append_unique(items: List[str], value: str, limit: int) -> None:
    if not value or value in items:
        return
    if len(items) >= limit:
        return
    items.append(value)


def _collect_expr_evidence(
    expr: Any,
    *,
    sink_reads: Set[str],
    sink_collections: Set[str],
    sink_comparisons: List[str],
    sink_targets: Set[str],
    sink_features: Set[str],
) -> int:
    """Collect read variables and related markers from an expression.

    Returns:
        Number of comparison nodes found in this expression.
    """

    comparisons_found = 0

    def _walk(node: Any) -> None:
        nonlocal comparisons_found
        if isinstance(node, list):
            for item in node:
                _walk(item)
            return
        if not isinstance(node, dict):
            return

        t = _node_type(node)
        if t == "identifier":
            name = node.get("name")
            if isinstance(name, str) and name:
                sink_reads.add(name)
            return

        if t == "index":
            base = _base_identifier(node)
            if base:
                sink_collections.add(base)
                sink_reads.add(base)
                sink_features.add("has_collection_access")
            if _node_type(node.get("target")) == "index":
                sink_features.add("has_multidimensional_collection_access")
            _walk(node.get("target"))
            _walk(node.get("index"))
            return

        if t == "field":
            field_base = _base_identifier(node)
            if field_base:
                sink_reads.add(field_base)
            _walk(node.get("target"))
            return

        if t == "call":
            callee = str(node.get("callee", "")).strip().lower()
            if callee == "length" and isinstance(node.get("args"), list) and node["args"]:
                base = _base_identifier(node["args"][0])
                if base:
                    sink_collections.add(base)
                    sink_features.add("has_length_bound")
            for arg in node.get("args") or []:
                _walk(arg)
            return

        if t == "binary":
            op = str(node.get("op") or node.get("operator") or "").strip()
            left = node.get("left")
            right = node.get("right")

            if op in COMPARISON_OPS:
                comparisons_found += 1
                comparison_text = expr_to_str(node)
                if comparison_text:
                    sink_comparisons.append(comparison_text)

                left_sig = _index_signature(left)
                right_sig = _index_signature(right)
                left_base = left_sig[0]
                right_base = right_sig[0]
                left_vars = set(expr_vars(left))
                right_vars = set(expr_vars(right))

                if left_base or right_base:
                    sink_features.add("has_collection_comparison")
                if op in ("=", "==") and left_base and right_base:
                    sink_features.add("has_collection_equality_comparison")

                if _looks_adjacent(left_sig, right_sig):
                    sink_features.add("has_adjacent_collection_comparison")

                # Search target: compare collection cell with external identifier/literal.
                if left_base and not right_base:
                    for variable in sorted(right_vars):
                        sink_targets.add(variable)
                    if right_vars:
                        sink_features.add("has_collection_target_comparison")
                    if op in (">", "<", ">=", "<="):
                        sink_features.add("has_collection_target_order_predicate")
                elif right_base and not left_base:
                    for variable in sorted(left_vars):
                        sink_targets.add(variable)
                    if left_vars:
                        sink_features.add("has_collection_target_comparison")
                    if op in (">", "<", ">=", "<="):
                        sink_features.add("has_collection_target_order_predicate")

            _walk(left)
            _walk(right)
            return

        if t == "unary":
            _walk(node.get("arg"))
            return

        for child in node.values():
            if isinstance(child, (dict, list)):
                _walk(child)

    _walk(expr)
    return comparisons_found


def _detect_update_direction(var_name: str, value_expr: Any) -> Optional[str]:
    t = _node_type(value_expr)
    if t == "identifier" and value_expr.get("name") == var_name:
        return "stable"

    if t != "binary":
        return None

    op = str(value_expr.get("op") or value_expr.get("operator") or "")
    left = value_expr.get("left")
    right = value_expr.get("right")

    left_is_var = _node_type(left) == "identifier" and left.get("name") == var_name
    right_is_var = _node_type(right) == "identifier" and right.get("name") == var_name

    if op == "+":
        if left_is_var or right_is_var:
            return "increasing"
    elif op == "-":
        if left_is_var and not right_is_var:
            return "decreasing"
        if right_is_var and not left_is_var:
            return "increasing"
    elif op == "*":
        if left_is_var or right_is_var:
            other = right if left_is_var else left
            other_num = _literal_number(other)
            if other_num is not None:
                if other_num > 1:
                    return "increasing"
                if 0 < other_num < 1:
                    return "decreasing"
                if other_num == 1:
                    return "stable"
            return "refine"
    elif op == "/":
        if left_is_var and not right_is_var:
            divisor = _literal_number(right)
            if divisor is not None and divisor > 1:
                return "decreasing"
            return "refine"

    return None


def _binary_op(expr: Any) -> str:
    if _node_type(expr) != "binary":
        return ""
    return str(expr.get("op") or expr.get("operator") or "").strip()


def _is_true_like_literal(expr: Any) -> bool:
    t = _node_type(expr)
    if t in ("literal", "number"):
        value = expr.get("value")
        if value is True:
            return True
        if isinstance(value, (int, float)) and value == 1:
            return True
        if isinstance(value, str) and value.strip().lower() in ("true", "verdadero", "1"):
            return True
    return False


def _is_false_like_literal(expr: Any) -> bool:
    t = _node_type(expr)
    if t in ("literal", "number"):
        value = expr.get("value")
        if value is False:
            return True
        if isinstance(value, (int, float)) and value == 0:
            return True
        if isinstance(value, str) and value.strip().lower() in ("false", "falso", "0"):
            return True
    return False


def _is_midpoint_expression(value_expr: Any) -> bool:
    if _node_type(value_expr) != "binary":
        return False

    op = _binary_op(value_expr)
    if op != "/":
        return False

    denominator = _literal_number(value_expr.get("right"))
    if denominator is None or int(denominator) != 2:
        return False

    left = value_expr.get("left")
    if _node_type(left) != "binary" or _binary_op(left) != "+":
        return False

    left_vars = set(expr_vars(left.get("left")))
    right_vars = set(expr_vars(left.get("right")))
    return bool(left_vars and right_vars)


def _is_plus_minus_one_update(expr: Any) -> bool:
    if _node_type(expr) != "binary":
        return False
    op = _binary_op(expr)
    if op not in ("+", "-"):
        return False
    left = expr.get("left")
    right = expr.get("right")
    left_one = _literal_number(left)
    right_one = _literal_number(right)
    return (left_one is not None and int(left_one) == 1) or (
        right_one is not None and int(right_one) == 1
    )


def _is_multiplicative_accumulator(var_name: str, value_expr: Any) -> bool:
    if _node_type(value_expr) != "binary":
        return False
    op = _binary_op(value_expr)
    if op not in ("*", "/"):
        return False
    value_vars = set(expr_vars(value_expr))
    return var_name in value_vars


def _is_halving_update(var_name: str, value_expr: Any) -> bool:
    if _node_type(value_expr) != "binary":
        return False
    op = _binary_op(value_expr)
    if op != "/":
        return False
    left = value_expr.get("left")
    right = value_expr.get("right")
    left_is_var = _node_type(left) == "identifier" and left.get("name") == var_name
    divisor = _literal_number(right)
    return bool(left_is_var and divisor is not None and float(divisor) == 2.0)


def _mod_expression_parts(expr: Any) -> Tuple[Any, Optional[str]]:
    if _node_type(expr) != "binary":
        return expr, None
    op = _binary_op(expr).lower()
    if op not in ("mod", "%"):
        return expr, None
    right = expr.get("right")
    mod_var = right.get("name") if _node_type(right) == "identifier" else None
    return expr.get("left"), mod_var


def _square_self_var(value_expr: Any) -> Optional[str]:
    core, _ = _mod_expression_parts(value_expr)
    if _node_type(core) != "binary":
        return None
    op = _binary_op(core)
    if op != "*":
        return None
    left = core.get("left")
    right = core.get("right")
    if _node_type(left) != "identifier" or _node_type(right) != "identifier":
        return None
    left_name = left.get("name")
    right_name = right.get("name")
    if isinstance(left_name, str) and left_name == right_name:
        return left_name
    return None


def _conditional_multiplication_partner(var_name: str, value_expr: Any) -> Optional[str]:
    core, _ = _mod_expression_parts(value_expr)
    if _node_type(core) != "binary" or _binary_op(core) != "*":
        return None
    left = core.get("left")
    right = core.get("right")
    left_name = left.get("name") if _node_type(left) == "identifier" else None
    right_name = right.get("name") if _node_type(right) == "identifier" else None
    if left_name == var_name and isinstance(right_name, str):
        return right_name
    if right_name == var_name and isinstance(left_name, str):
        return left_name
    return None


def _is_progress_update_for_control(var_name: str, value_expr: Any) -> bool:
    """Return True when update looks like loop-progress bookkeeping for a control variable."""

    if _node_type(value_expr) != "binary":
        return False

    op = _binary_op(value_expr)
    if op not in ("+", "-", "*", "/"):
        return False

    left = value_expr.get("left")
    right = value_expr.get("right")
    left_is_var = _node_type(left) == "identifier" and left.get("name") == var_name
    right_is_var = _node_type(right) == "identifier" and right.get("name") == var_name
    if not (left_is_var or right_is_var):
        return False

    # i <- i +/- c ; i <- i * c ; i <- i / c ; c + i style.
    other = right if left_is_var else left
    if _literal_number(other) is not None:
        return True
    if _node_type(other) == "identifier":
        return True
    return False


def _merge_direction(direction_sets: Dict[str, Set[str]]) -> Dict[str, str]:
    merged: Dict[str, str] = {}
    for variable, directions in sorted(direction_sets.items()):
        cleaned = {d for d in directions if d and d != "stable"}
        if not cleaned:
            merged[variable] = "stable"
        elif len(cleaned) == 1:
            merged[variable] = next(iter(cleaned))
        else:
            merged[variable] = "mixed"
    return merged


def _body_statements(loop_node: Dict[str, Any]) -> List[Any]:
    body = loop_node.get("body")
    if isinstance(body, list):
        return body
    if isinstance(body, dict):
        body_list = body.get("body")
        if isinstance(body_list, list):
            return body_list
        statements = body.get("statements")
        if isinstance(statements, list):
            return statements
        return [body]
    return []


def _analyze_assignment(
    stmt: Dict[str, Any],
    state: _LoopScanState,
    control_candidates: Set[str],
    *,
    in_conditional: bool,
) -> None:
    target = stmt.get("target")
    value = stmt.get("value")
    target_node_type = _node_type(target)
    target_identifier = target.get("name") if target_node_type == "identifier" else None

    state.assignment_count += 1
    state.non_trivial_statement_count += 1

    target_str = expr_to_str(target)
    value_str = expr_to_str(value)
    update_text = f"{target_str} <- {value_str}" if target_str else value_str
    _append_unique(state.key_updates, update_text, limit=8)

    value_reads = set(expr_vars(value))
    value_collections: Set[str] = set()
    comparison_strings: List[str] = []
    target_candidates: Set[str] = set()
    comparisons_in_value = _collect_expr_evidence(
        value,
        sink_reads=value_reads,
        sink_collections=value_collections,
        sink_comparisons=comparison_strings,
        sink_targets=target_candidates,
        sink_features=state.detected_features,
    )

    state.body_reads.update(value_reads)
    state.collection_variables.update(value_collections)
    state.target_variables.update(target_candidates)
    state.condition_comparison_count += comparisons_in_value
    for comparison in comparison_strings:
        _append_unique(state.comparisons, comparison, limit=14)

    lvalue_reads = _read_vars_from_lvalue(target)
    state.body_reads.update(lvalue_reads)

    writes = _write_vars_from_lvalue(target)
    state.body_writes.update(writes)

    if target_node_type == "index":
        state.collection_write_count += 1
        state.detected_features.add("has_collection_write")
        target_signature = _index_signature(target)
        target_base, target_idx_var, target_offset = target_signature
        if target_base:
            state.collection_variables.add(target_base)
        rhs_signatures: List[Tuple[Optional[str], Optional[str], Optional[int]]] = []
        _collect_index_signatures(value, rhs_signatures)
        state.index_write_patterns.append((target_signature, rhs_signatures))

        # Swap-like update should be a direct move between adjacent cells.
        # Distinguish shift updates (e.g., A[j+1] <- A[j]) from swap-like moves.
        if _node_type(value) in ("index", "identifier"):
            for rhs_signature in rhs_signatures:
                if not _looks_adjacent(target_signature, rhs_signature):
                    continue
                _, target_var, target_offset = target_signature
                _, rhs_var, rhs_offset = rhs_signature
                if (
                    target_var
                    and rhs_var
                    and target_var == rhs_var
                    and target_offset is not None
                    and rhs_offset is not None
                    and target_offset == rhs_offset + 1
                ):
                    state.shift_like_count += 1
                    state.detected_features.add("has_shift_like_update")
                else:
                    state.swap_like_count += 1
                    state.detected_features.add("has_swap_like_update")

        # Copy-like update: B[i] <- A[i]
        if target_base and target_idx_var:
            for rhs_base, rhs_idx_var, rhs_offset in rhs_signatures:
                if not rhs_base or rhs_base == target_base:
                    continue
                if rhs_idx_var == target_idx_var and rhs_offset == target_offset:
                    state.detected_features.add("has_copy_like_update")

        # Prefix-like recurrence: P[i] <- P[i-1] + ...
        if target_base and target_idx_var:
            for rhs_base, rhs_idx_var, rhs_offset in rhs_signatures:
                if rhs_base == target_base and rhs_idx_var == target_idx_var:
                    if rhs_offset in (-1, 1):
                        state.detected_features.add("has_prefix_recurrence")

    if target_node_type == "field":
        owner_expr = target.get("target")
        if _node_type(owner_expr) == "index":
            state.detected_features.add("has_collection_object_field_write")
            owner_base = _base_identifier(owner_expr)
            if owner_base:
                state.collection_variables.add(owner_base)
                state.body_reads.add(owner_base)

    if value_collections:
        state.collection_read_count += 1

    # Track identifier copies and MOD-updates for Euclidean-pattern detection.
    if (
        isinstance(target_identifier, str)
        and target_identifier
        and _node_type(value) == "identifier"
        and isinstance(value.get("name"), str)
    ):
        state.identifier_copies.append((target_identifier, value.get("name")))

    if isinstance(target_identifier, str) and target_identifier and _node_type(value) == "binary":
        op = _binary_op(value).lower()
        left = value.get("left")
        right = value.get("right")
        if op in ("mod", "%") and _node_type(left) == "identifier" and _node_type(right) == "identifier":
            left_name = left.get("name")
            right_name = right.get("name")
            if isinstance(left_name, str) and isinstance(right_name, str):
                state.mod_updates.append((target_identifier, left_name, right_name))
                state.modulus_candidates.add(right_name)

    # Binary-exponentiation local anchors:
    # - exponent halving (e <- e / 2)
    # - base squaring (b <- b * b, optionally mod n)
    # - conditional multiplicative accumulator (resultado <- resultado * b, optionally mod n)
    if isinstance(target_identifier, str) and target_identifier:
        if _is_halving_update(target_identifier, value):
            state.halving_updates.append(target_identifier)
            state.detected_features.add("has_halving_update")

        square_var = _square_self_var(value)
        if square_var and square_var == target_identifier:
            state.square_updates.append((target_identifier, square_var))
            state.detected_features.add("has_square_self_update")

        _, mod_var = _mod_expression_parts(value)
        if mod_var:
            state.modulus_candidates.add(mod_var)

        if in_conditional and target_identifier in value_reads:
            partner = _conditional_multiplication_partner(target_identifier, value)
            if partner:
                state.conditional_mul_accumulators.append((target_identifier, partner))
                state.detected_features.add("has_conditional_multiplicative_accumulator")

    # Accumulator pattern: x <- x + expr, x <- x - expr, x <- x * expr, x <- x / expr
    # Conservative rule: only scalar identifier assignments can become accumulators.
    for variable in sorted(writes):
        if variable in value_reads and target_node_type == "identifier":
            if variable in control_candidates and _is_progress_update_for_control(variable, value):
                continue
            state.accumulators.add(variable)
            state.detected_features.add("has_accumulator_update")
            if _is_multiplicative_accumulator(variable, value):
                state.detected_features.add("has_multiplicative_accumulator")
            if _is_plus_minus_one_update(value):
                state.detected_features.add("has_unit_counter_update")
            if variable not in control_candidates and _is_plus_minus_one_update(value):
                state.detected_features.add("has_secondary_frontier_update")

    # Search flag update (found/exist/flag style variable)
    for variable in sorted(writes):
        if _has_name_hint(variable, ("found", "exist", "flag", "encontr", "hall", "seen")):
            if _is_true_like_literal(value) or _is_false_like_literal(value):
                state.detected_features.add("has_search_flag_update")

    # Midpoint + interval refinement hints (e.g., binary-search-like loops)
    if _is_midpoint_expression(value):
        state.detected_features.add("has_midpoint_update")

    if _is_plus_minus_one_update(value):
        if any(variable in control_candidates for variable in writes):
            state.detected_features.add("has_interval_boundary_update")

    if _node_type(value) == "identifier":
        value_name = value.get("name")
        if isinstance(value_name, str) and value_name in control_candidates:
            if any(variable in control_candidates for variable in writes):
                state.detected_features.add("has_interval_boundary_update")

    # Extrema with index tracking (max/min plus position)
    if in_conditional and "conditional_collection_compare" in state.detected_features:
        if any(_has_name_hint(variable, ("idx", "index", "pos", "position")) for variable in writes):
            state.detected_features.add("has_extrema_index_update")

    # Monotonic control updates for candidate control variables.
    for variable in sorted(writes):
        if variable in control_candidates:
            direction = _detect_update_direction(variable, value)
            if direction:
                state.direction_by_control.setdefault(variable, set()).add(direction)
                if direction in ("increasing", "decreasing"):
                    state.detected_features.add("has_monotonic_control_update")


def _expr_has_collection_access(expr: Any) -> bool:
    if isinstance(expr, list):
        return any(_expr_has_collection_access(item) for item in expr)

    if not isinstance(expr, dict):
        return False

    if _node_type(expr) == "index":
        return True

    for child in expr.values():
        if isinstance(child, (dict, list)) and _expr_has_collection_access(child):
            return True
    return False


def _iter_assignments(stmt: Any):
    if stmt is None:
        return
    if isinstance(stmt, list):
        for item in stmt:
            yield from _iter_assignments(item)
        return
    if not isinstance(stmt, dict):
        return

    t = _node_type(stmt)
    if t == "assign":
        yield stmt
        return
    if t == "block":
        body = stmt.get("body")
        if not isinstance(body, list):
            body = stmt.get("statements") if isinstance(stmt.get("statements"), list) else []
        for item in body:
            yield from _iter_assignments(item)
        return
    if t == "if":
        yield from _iter_assignments(stmt.get("consequent"))
        yield from _iter_assignments(stmt.get("alternate"))
        return

    # Keep extraction local: nested loops are handled as separate loop facts.
    if t in ("for", "while", "repeat"):
        return


def _detect_extrema_signal(test: Any, consequent: Any, state: _LoopScanState) -> None:
    comparisons: List[Dict[str, Any]] = []

    def _collect(node: Any) -> None:
        if isinstance(node, list):
            for item in node:
                _collect(item)
            return
        if not isinstance(node, dict):
            return
        if _node_type(node) == "binary":
            op = _binary_op(node)
            if op in COMPARISON_OPS:
                comparisons.append(node)
            _collect(node.get("left"))
            _collect(node.get("right"))
            return
        for child in node.values():
            if isinstance(child, (dict, list)):
                _collect(child)

    _collect(test)

    for comparison in comparisons:
        op = _binary_op(comparison)
        if op not in (">", ">=", "<", "<="):
            continue

        left = comparison.get("left")
        right = comparison.get("right")
        left_has_collection = _expr_has_collection_access(left)
        right_has_collection = _expr_has_collection_access(right)

        # We only trust a clear asymmetric comparison: collection-like side vs candidate side.
        if left_has_collection == right_has_collection:
            continue

        candidate_expr = right if left_has_collection else left
        source_expr = left if left_has_collection else right
        candidate_var = _base_identifier(candidate_expr)
        if not candidate_var:
            continue

        source_vars = set(expr_vars(source_expr))
        updates_candidate_from_source = False
        for assign in _iter_assignments(consequent):
            target_name = _base_identifier(assign.get("target"))
            if target_name != candidate_var:
                continue
            value_expr = assign.get("value")
            value_vars = set(expr_vars(value_expr))
            if _expr_has_collection_access(value_expr) or (source_vars and source_vars.intersection(value_vars)):
                updates_candidate_from_source = True
                break

        if not updates_candidate_from_source:
            continue

        state.detected_features.add(f"extrema_candidate:{candidate_var}")
        if left_has_collection:
            if op in (">", ">="):
                state.detected_features.add("has_extrema_max_signal")
            else:
                state.detected_features.add("has_extrema_min_signal")
        else:
            if op in ("<", "<="):
                state.detected_features.add("has_extrema_max_signal")
            else:
                state.detected_features.add("has_extrema_min_signal")


def _analyze_if(
    stmt: Dict[str, Any],
    state: _LoopScanState,
    control_candidates: Set[str],
) -> None:
    state.conditional_count += 1
    state.non_trivial_statement_count += 1
    state.detected_features.add("has_if")

    test = stmt.get("test")
    if test is not None:
        condition_text = expr_to_str(test)
        _append_unique(state.key_conditions, condition_text, limit=8)
        condition_reads = set(expr_vars(test))
        condition_collections: Set[str] = set()
        condition_comparisons: List[str] = []
        condition_targets: Set[str] = set()
        comparisons = _collect_expr_evidence(
            test,
            sink_reads=condition_reads,
            sink_collections=condition_collections,
            sink_comparisons=condition_comparisons,
            sink_targets=condition_targets,
            sink_features=state.detected_features,
        )
        state.body_reads.update(condition_reads)
        state.collection_variables.update(condition_collections)
        state.target_variables.update(condition_targets)
        state.condition_comparison_count += comparisons

        if comparisons > 0:
            state.detected_features.add("has_conditional_comparison")
        if comparisons > 0 and condition_collections:
            state.detected_features.add("conditional_collection_compare")
        for comparison in condition_comparisons:
            _append_unique(state.comparisons, comparison, limit=14)
        _detect_extrema_signal(test, stmt.get("consequent"), state)

    _walk_statement(stmt.get("consequent"), state, control_candidates, in_conditional=True)
    _walk_statement(stmt.get("alternate"), state, control_candidates, in_conditional=True)


def _walk_statement(
    stmt: Any,
    state: _LoopScanState,
    control_candidates: Set[str],
    *,
    in_conditional: bool = False,
) -> None:
    if stmt is None:
        return

    if isinstance(stmt, list):
        for item in stmt:
            _walk_statement(item, state, control_candidates, in_conditional=in_conditional)
        return

    if not isinstance(stmt, dict):
        return

    t = _node_type(stmt)

    if t == "block":
        body = stmt.get("body")
        if not isinstance(body, list):
            body = stmt.get("statements") if isinstance(stmt.get("statements"), list) else []
        for item in body:
            _walk_statement(item, state, control_candidates, in_conditional=in_conditional)
        return

    if t == "assign":
        _analyze_assignment(
            stmt,
            state,
            control_candidates,
            in_conditional=in_conditional,
        )
        return

    if t == "if":
        _analyze_if(stmt, state, control_candidates)
        return

    if t in ("for", "while", "repeat"):
        state.nested_loop_count += 1
        state.non_trivial_statement_count += 1
        state.detected_features.add("has_nested_loop")
        nested_control_candidates = set(control_candidates)

        if t == "for":
            nested_var = stmt.get("var")
            if isinstance(nested_var, str) and nested_var:
                nested_control_candidates.add(nested_var)

        nested_test = stmt.get("test")
        if nested_test is not None:
            nested_reads = set(expr_vars(nested_test))
            nested_control_candidates.update(nested_reads)
            nested_collections: Set[str] = set()
            nested_comparisons: List[str] = []
            nested_targets: Set[str] = set()
            comparisons = _collect_expr_evidence(
                nested_test,
                sink_reads=nested_reads,
                sink_collections=nested_collections,
                sink_comparisons=nested_comparisons,
                sink_targets=nested_targets,
                sink_features=state.detected_features,
            )
            state.body_reads.update(nested_reads)
            state.collection_variables.update(nested_collections)
            state.target_variables.update(nested_targets)
            state.condition_comparison_count += comparisons
            for comparison in nested_comparisons:
                _append_unique(state.comparisons, comparison, limit=14)

        for child_stmt in _body_statements(stmt):
            _walk_statement(child_stmt, state, nested_control_candidates, in_conditional=in_conditional)
        return

    if t == "return":
        state.return_count += 1
        state.non_trivial_statement_count += 1
        state.has_early_exit = True
        state.detected_features.add("has_early_exit")
        value = stmt.get("value")
        if value is not None:
            reads = set(expr_vars(value))
            cols: Set[str] = set()
            comps: List[str] = []
            targets: Set[str] = set()
            comparisons = _collect_expr_evidence(
                value,
                sink_reads=reads,
                sink_collections=cols,
                sink_comparisons=comps,
                sink_targets=targets,
                sink_features=state.detected_features,
            )
            state.body_reads.update(reads)
            state.collection_variables.update(cols)
            state.target_variables.update(targets)
            state.condition_comparison_count += comparisons
            for comparison in comps:
                _append_unique(state.comparisons, comparison, limit=14)
        return

    if t in ("call", "print"):
        state.non_trivial_statement_count += 1
        args = stmt.get("args") or []
        reads: Set[str] = set()
        cols: Set[str] = set()
        comps: List[str] = []
        targets: Set[str] = set()
        comparisons = _collect_expr_evidence(
            args,
            sink_reads=reads,
            sink_collections=cols,
            sink_comparisons=comps,
            sink_targets=targets,
            sink_features=state.detected_features,
        )
        state.body_reads.update(reads)
        state.collection_variables.update(cols)
        state.target_variables.update(targets)
        state.condition_comparison_count += comparisons
        for comparison in comps:
            _append_unique(state.comparisons, comparison, limit=14)
        return

    # Generic fallback: gather expression evidence from nested fields.
    for child in stmt.values():
        if isinstance(child, (dict, list)):
            _walk_statement(child, state, control_candidates, in_conditional=in_conditional)


def _resolve_loop_node_type(loop_node: Dict[str, Any]) -> Optional[LoopNodeType]:
    t = _node_type(loop_node)
    if t == "for":
        return "FOR"
    if t == "while":
        return "WHILE"
    if t == "repeat":
        return "REPEAT"
    return None


def extract_loop_facts(loop_node: Dict[str, Any], depth: int, order: int) -> Optional[LoopFacts]:
    """Extract deterministic local evidence from one loop node."""

    node_type = _resolve_loop_node_type(loop_node)
    if node_type is None:
        return None

    line_start = _line_of(loop_node)
    line_end = _max_line(loop_node)

    control_candidates: Set[str] = set()
    control_variables: Set[str] = set()
    bound_variables: Set[str] = set()

    state = _LoopScanState()

    test_expr = loop_node.get("test")

    if node_type == "FOR":
        control_var = loop_node.get("var")
        if isinstance(control_var, str) and control_var:
            control_candidates.add(control_var)
            control_variables.add(control_var)
            state.direction_by_control.setdefault(control_var, set()).add("increasing")
            _append_unique(
                state.key_updates,
                f"{control_var} <- {control_var} + 1 (implicit FOR update)",
                limit=8,
            )

        start_expr = loop_node.get("start")
        end_expr = loop_node.get("end")

        if start_expr is not None:
            bound_variables.update(expr_vars(start_expr))
        if end_expr is not None:
            end_vars = set(expr_vars(end_expr))
            bound_variables.update(end_vars)
            if control_variables:
                cond = f"{next(iter(sorted(control_variables)))} <= {expr_to_str(end_expr)}"
                _append_unique(state.key_conditions, cond, limit=8)
                state.condition_reads.update(end_vars)
                state.condition_reads.update(control_variables)
            else:
                state.condition_reads.update(end_vars)

        # FOR bounds may include length(collection)
        for expr in (start_expr, end_expr):
            if expr is not None:
                reads = set(expr_vars(expr))
                cols: Set[str] = set()
                comps: List[str] = []
                targets: Set[str] = set()
                _collect_expr_evidence(
                    expr,
                    sink_reads=reads,
                    sink_collections=cols,
                    sink_comparisons=comps,
                    sink_targets=targets,
                    sink_features=state.detected_features,
                )
                state.condition_reads.update(reads)
                state.collection_variables.update(cols)
                state.target_variables.update(targets)
                for comparison in comps:
                    _append_unique(state.comparisons, comparison, limit=14)

    else:
        if test_expr is not None:
            condition_text = expr_to_str(test_expr)
            _append_unique(state.key_conditions, condition_text, limit=8)

            state.condition_reads.update(expr_vars(test_expr))
            condition_collections: Set[str] = set()
            condition_comparisons: List[str] = []
            condition_targets: Set[str] = set()
            comparisons = _collect_expr_evidence(
                test_expr,
                sink_reads=state.condition_reads,
                sink_collections=condition_collections,
                sink_comparisons=condition_comparisons,
                sink_targets=condition_targets,
                sink_features=state.detected_features,
            )
            state.collection_variables.update(condition_collections)
            state.target_variables.update(condition_targets)
            state.condition_comparison_count += comparisons
            for comparison in condition_comparisons:
                _append_unique(state.comparisons, comparison, limit=14)

            control_candidates.update(state.condition_reads)

    body_statements = _body_statements(loop_node)
    state.body_statement_count = len(body_statements)

    for stmt in body_statements:
        _walk_statement(stmt, state, control_candidates)

    direction_map = _merge_direction(state.direction_by_control)

    if node_type in ("WHILE", "REPEAT"):
        # Control variables are condition vars that either have explicit trend,
        # or are clearly rewritten by the loop body (interval/boundary style).
        for variable in sorted(state.condition_reads):
            direction = direction_map.get(variable)
            if direction in ("increasing", "decreasing", "refine", "mixed"):
                control_variables.add(variable)
                continue
            if variable in state.body_writes:
                control_variables.add(variable)
                state.direction_by_control.setdefault(variable, set()).add("refine")

        if not control_variables and state.condition_reads:
            control_variables.add(sorted(state.condition_reads)[0])

    direction_map = _merge_direction(state.direction_by_control)

    bound_variables.update(v for v in state.condition_reads if v not in control_variables)

    # Target variables exclude control and collection names.
    filtered_targets = {
        v
        for v in state.target_variables
        if v not in control_variables and v not in state.collection_variables
    }

    # Prefix-progress marker from indexed writes tied to control variable.
    control_sorted = sorted(control_variables)
    for target_sig, rhs_sigs in state.index_write_patterns:
        _, target_var, _ = target_sig
        if target_var and target_var in control_sorted:
            if rhs_sigs:
                state.detected_features.add("has_prefix_write")

    has_compaction_write_index = any(
        target_var and target_var in state.accumulators
        for (_, target_var, _), _rhs in state.index_write_patterns
    )

    if (
        ("has_prefix_write" in state.detected_features or has_compaction_write_index)
        and state.conditional_count > 0
        and state.collection_write_count > 0
        and state.collection_read_count > 0
    ):
        state.detected_features.add("has_filter_like_compaction")

    if state.swap_like_count > 0:
        state.detected_features.add("has_swap_like_update")
    if state.shift_like_count > 0:
        state.detected_features.add("has_shift_like_update")

    # Two-pointer marker: at least two control variables with opposite monotonic trend.
    if len(control_variables) >= 2:
        trends = {direction_map.get(v) for v in control_variables}
        if "increasing" in trends and "decreasing" in trends:
            state.detected_features.add("has_two_pointer_control")

    if (
        "has_collection_target_comparison" in state.detected_features
        and "has_interval_boundary_update" in state.detected_features
        and (
            "has_midpoint_update" in state.detected_features
            or len(control_variables) >= 2
        )
    ):
        state.detected_features.add("has_binary_search_interval")

    if (
        state.nested_loop_count > 0
        and "has_collection_target_comparison" in state.detected_features
        and "has_collection_access" in state.detected_features
    ):
        state.detected_features.add("has_nested_search_scan")

    if (
        "has_adjacent_collection_comparison" in state.detected_features
        and state.collection_write_count == 0
    ):
        state.detected_features.add("has_order_check_no_swap")

    if node_type == "REPEAT":
        state.detected_features.add("is_repeat_until")

    # Object/field update hints.
    object_field_writes = [name for name in state.body_writes if "." in name]
    if object_field_writes:
        state.detected_features.add("has_object_field_write")
    if any(
        name.split(".", 1)[0] in state.collection_variables
        for name in object_field_writes
    ):
        state.detected_features.add("has_collection_object_field_write")

    # Euclidean step detector: b <- a MOD b and rotation a <- temp (with temp <- b).
    if state.mod_updates and state.identifier_copies:
        copy_pairs = {(target, source) for target, source in state.identifier_copies}
        aliases_by_source: Dict[str, Set[str]] = {}
        for target, source in state.identifier_copies:
            aliases_by_source.setdefault(source, set()).add(target)

        for target, left_name, right_name in state.mod_updates:
            if target != right_name:
                continue
            aliases = aliases_by_source.get(right_name, set())
            has_rotation = (left_name, right_name) in copy_pairs or any(
                (left_name, alias) in copy_pairs for alias in aliases
            )
            if has_rotation:
                state.detected_features.add("has_euclid_mod_step")
                break

    # Partition-by-pivot detector (quicksort partition loop).
    if (
        "has_collection_target_comparison" in state.detected_features
        and state.collection_write_count >= 2
        and state.conditional_count > 0
        and "has_secondary_frontier_update" in state.detected_features
    ):
        state.detected_features.add("has_partition_pivot_step")

    increasing_controls = [v for v in control_variables if direction_map.get(v) == "increasing"]

    # Merge progress detector (two ordered runs merged into destination buffer).
    if (
        node_type == "WHILE"
        and "has_collection_comparison" in state.detected_features
        and "has_collection_write" in state.detected_features
        and "has_collection_target_comparison" not in state.detected_features
        and len(increasing_controls) >= 2
        and state.swap_like_count == 0
    ):
        state.detected_features.add("has_merge_progress_step")

    # Insertion-sort inner/outer behavior detector.
    if (
        "has_shift_like_update" in state.detected_features
        and state.collection_write_count > 0
        and state.nested_loop_count > 0
        and (
            any(_has_name_hint(v, ("key", "clave")) for v in state.body_writes)
            or any(_has_name_hint(v, ("key", "clave")) for v in state.target_variables)
        )
    ):
        state.detected_features.add("has_insertion_shift_step")

    # Selection-sort detector: nested scan picks extrema index then swaps.
    if (
        node_type == "FOR"
        and state.nested_loop_count > 0
        and "has_extrema_index_update" in state.detected_features
        and state.collection_write_count > 0
    ):
        state.detected_features.add("has_selection_scan_step")

    # Progress-only loop: updates control/boundary state without direct semantic aggregate.
    if (
        node_type in ("WHILE", "REPEAT")
        and
        any(direction_map.get(v) in ("increasing", "decreasing", "refine") for v in control_variables)
        and not state.collection_variables
        and not state.accumulators
        and state.collection_write_count == 0
        and state.return_count == 0
    ):
        state.detected_features.add("has_progress_only_loop")

    # Binary exponentiation detector:
    # requires all three local ingredients in the same loop:
    # 1) exponent halving update
    # 2) base self-squaring update
    # 3) conditional multiplicative accumulation in result
    exp_candidates = _sorted(state.halving_updates)
    exp_control_candidates = _sorted([v for v in exp_candidates if v in control_variables])
    exp_var = exp_control_candidates[0] if exp_control_candidates else (exp_candidates[0] if exp_candidates else None)

    square_targets = _sorted([target for target, _ in state.square_updates])
    base_var = square_targets[0] if square_targets else None

    conditional_targets = _sorted([target for target, _partner in state.conditional_mul_accumulators])
    preferred_results = _sorted(
        [
            target
            for target, _partner in state.conditional_mul_accumulators
            if _has_name_hint(target, ("res", "result", "ans", "pow", "potencia"))
        ]
    )
    result_var = preferred_results[0] if preferred_results else (conditional_targets[0] if conditional_targets else None)

    if base_var and result_var:
        partners_for_result = _sorted(
            [partner for target, partner in state.conditional_mul_accumulators if target == result_var and partner]
        )
        if partners_for_result and base_var not in partners_for_result:
            base_var = partners_for_result[0]

    modulus_var = _sorted(state.modulus_candidates)[0] if state.modulus_candidates else None

    if exp_var and base_var and node_type in ("WHILE", "REPEAT"):
        state.detected_features.add("has_binary_exponentiation_shape")

    if exp_var and base_var and result_var and node_type in ("WHILE", "REPEAT"):
        state.detected_features.add("has_binary_exponentiation_state")
        state.detected_features.add(f"exp_var:{exp_var}")
        state.detected_features.add(f"base_var:{base_var}")
        state.detected_features.add(f"result_var:{result_var}")
        if modulus_var:
            state.detected_features.add(f"mod_var:{modulus_var}")

    facts = LoopFacts(
        node=loop_node,
        node_type=node_type,
        depth=depth,
        order=order,
        line_start=line_start,
        line_end=line_end,
        control_variables=sorted(control_variables),
        condition_reads=_sorted(state.condition_reads),
        body_reads=_sorted(state.body_reads),
        body_writes=_sorted(state.body_writes),
        accumulators=_sorted(state.accumulators),
        bound_variables=_sorted(bound_variables),
        collection_variables=_sorted(state.collection_variables),
        target_variables=_sorted(filtered_targets),
        key_updates=state.key_updates[:8],
        key_conditions=state.key_conditions[:8],
        comparisons=state.comparisons[:14],
        detected_features=sorted(state.detected_features),
        direction_by_control=direction_map,
        assignment_count=state.assignment_count,
        conditional_count=state.conditional_count,
        nested_loop_count=state.nested_loop_count,
        body_statement_count=state.body_statement_count,
        non_trivial_statement_count=state.non_trivial_statement_count,
        return_count=state.return_count,
        collection_read_count=state.collection_read_count,
        collection_write_count=state.collection_write_count,
        condition_comparison_count=state.condition_comparison_count,
        swap_like_count=state.swap_like_count,
        has_early_exit=state.has_early_exit,
        exponent_var=exp_var,
        base_var=base_var,
        result_var=result_var,
        modulus_var=modulus_var,
    )
    return facts
