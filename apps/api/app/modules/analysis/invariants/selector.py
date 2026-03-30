"""Deterministic loop candidate collection and significant-loop selection."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple

from .extractor import extract_loop_facts
from .schemas import LoopFacts


@dataclass(slots=True)
class SelectionResult:
    selected: Optional[LoopFacts]
    ranked: List[LoopFacts]


def _node_type(node: Any) -> str:
    if not isinstance(node, dict):
        return ""
    return str(node.get("type", "")).strip().lower()


def _as_list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _children_in_source_order(node: Dict[str, Any]) -> Iterable[Any]:
    t = _node_type(node)

    if t == "program":
        yield from _as_list(node.get("body"))
        return

    if t == "procdef":
        yield node.get("body")
        return

    if t == "block":
        body = node.get("body")
        if isinstance(body, list):
            yield from body
            return
        statements = node.get("statements")
        if isinstance(statements, list):
            yield from statements
        return

    if t == "if":
        yield node.get("test")
        yield node.get("consequent")
        yield node.get("alternate")
        return

    if t == "for":
        yield node.get("start")
        yield node.get("end")
        yield node.get("body")
        return

    if t == "while":
        yield node.get("test")
        yield node.get("body")
        return

    if t == "repeat":
        yield node.get("body")
        yield node.get("test")
        return

    # Deterministic generic fallback: keep insertion order from parser dict.
    for value in node.values():
        if isinstance(value, (dict, list)):
            yield value


def _is_loop(node: Any) -> bool:
    t = _node_type(node)
    return t in ("for", "while", "repeat")


def _collect_loop_nodes(ast: Dict[str, Any]) -> List[Tuple[Dict[str, Any], int, int]]:
    candidates: List[Tuple[Dict[str, Any], int, int]] = []
    order = 0

    def _walk(node: Any, loop_depth: int) -> None:
        nonlocal order
        if isinstance(node, list):
            for item in node:
                _walk(item, loop_depth)
            return

        if not isinstance(node, dict):
            return

        is_loop_node = _is_loop(node)
        if is_loop_node:
            order += 1
            candidates.append((node, loop_depth, order))

        child_depth = loop_depth + 1 if is_loop_node else loop_depth
        for child in _children_in_source_order(node):
            _walk(child, child_depth)

    _walk(ast, 0)
    return candidates


def _contains_feature(facts: LoopFacts, feature: str) -> bool:
    return feature in set(facts.detected_features)


def _is_single_iteration_nested_wrapper(facts: LoopFacts) -> bool:
    if facts.node_type != "FOR":
        return False
    if facts.nested_loop_count <= 0:
        return False
    conditions = " ".join(facts.key_conditions).replace(" ", "").lower()
    return "<=1" in conditions


def _is_guarded_selector_wrapper(facts: LoopFacts) -> bool:
    """Detect wrappers that only gate a nested loop behind control==target."""

    if facts.node_type != "FOR":
        return False
    if facts.nested_loop_count <= 0:
        return False
    if not facts.control_variables:
        return False
    if facts.body_writes:
        return False
    if facts.return_count <= 0:
        return False

    control = facts.control_variables[0].lower()
    conditions = " ".join(facts.key_conditions).replace(" ", "").lower()
    eq_patterns = (
        f"({control})==(",
        f"{control}==",
    )
    return any(pattern in conditions for pattern in eq_patterns)


def _score_loop(facts: LoopFacts) -> Dict[str, float]:
    base_type = {
        "FOR": 3.0,
        "WHILE": 4.0,
        "REPEAT": 4.0,
    }.get(facts.node_type, 1.0)

    structural_weight = (
        min(facts.non_trivial_statement_count, 8) * 0.8
        + min(facts.assignment_count, 8) * 0.45
        + min(facts.conditional_count, 4) * 1.2
        + min(facts.nested_loop_count, 3) * 1.4
        + (1.2 if facts.return_count > 0 else 0.0)
    )

    data_weight = (
        (2.0 if facts.collection_variables else 0.0)
        + min(facts.collection_read_count, 5) * 0.5
        + min(facts.collection_write_count, 5) * 0.8
        + min(len(facts.body_writes), 8) * 0.35
        + (1.7 if facts.accumulators else 0.0)
    )

    purpose_weight = (
        (2.8 if _contains_feature(facts, "has_swap_like_update") else 0.0)
        + (1.8 if _contains_feature(facts, "has_adjacent_collection_comparison") else 0.0)
        + (2.4 if _contains_feature(facts, "has_collection_target_comparison") else 0.0)
        + (2.1 if _contains_feature(facts, "has_two_pointer_control") else 0.0)
        + (1.6 if _contains_feature(facts, "has_prefix_write") else 0.0)
        + (1.1 if _contains_feature(facts, "has_monotonic_control_update") else 0.0)
        + (0.9 if _contains_feature(facts, "has_conditional_comparison") else 0.0)
        + (0.8 if _contains_feature(facts, "has_early_exit") else 0.0)
    )

    trivial_penalty = 0.0
    if facts.body_statement_count == 0:
        trivial_penalty += 4.0
    if facts.non_trivial_statement_count <= 1:
        trivial_penalty += 2.8
    if facts.assignment_count <= 1 and facts.conditional_count == 0 and facts.return_count == 0:
        trivial_penalty += 1.8
    if not facts.body_writes:
        trivial_penalty += 1.5

    depth_penalty = facts.depth * 0.65
    wrapper_penalty = 4.0 if _is_single_iteration_nested_wrapper(facts) else 0.0
    guarded_selector_penalty = 5.5 if _is_guarded_selector_wrapper(facts) else 0.0

    score = (
        base_type
        + structural_weight
        + data_weight
        + purpose_weight
        - trivial_penalty
        - depth_penalty
        - wrapper_penalty
        - guarded_selector_penalty
    )

    return {
        "base_type": base_type,
        "structural_weight": structural_weight,
        "data_weight": data_weight,
        "purpose_weight": purpose_weight,
        "trivial_penalty": trivial_penalty,
        "depth_penalty": depth_penalty,
        "wrapper_penalty": wrapper_penalty,
        "guarded_selector_penalty": guarded_selector_penalty,
        "score": round(score, 6),
    }


def select_significant_loop(ast: Dict[str, Any]) -> SelectionResult:
    """Select the most significant FOR/WHILE/REPEAT loop with deterministic tie-breaks.

    Tie-break order:
    1) Higher score
    2) Lower semantic depth
    3) Earlier appearance in source traversal
    """

    loop_nodes = _collect_loop_nodes(ast)
    extracted: List[LoopFacts] = []

    for node, depth, order in loop_nodes:
        facts = extract_loop_facts(node, depth=depth, order=order)
        if facts is None:
            continue

        components = _score_loop(facts)
        facts.score_components = {k: v for k, v in components.items() if k != "score"}
        facts.score = components["score"]
        extracted.append(facts)

    if not extracted:
        return SelectionResult(selected=None, ranked=[])

    ranked = sorted(
        extracted,
        key=lambda item: (-item.score, item.depth, item.order),
    )
    return SelectionResult(selected=ranked[0], ranked=ranked)
