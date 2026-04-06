"""Deterministic local-pattern classifier for selected loops."""

from __future__ import annotations

from typing import List, Set

from .schemas import ClassificationResult, LoopFacts


def _clamp_confidence(value: float) -> float:
    return max(0.05, min(0.99, round(value, 3)))


def _var_name_hints(variables: List[str], *tokens: str) -> bool:
    lowered = [v.lower() for v in variables]
    return any(any(token in var for token in tokens) for var in lowered)


def classify_loop_pattern(facts: LoopFacts) -> ClassificationResult:
    """Classify loop intent using only local evidence from the selected loop."""

    features: Set[str] = set(facts.detected_features)
    reasons: List[str] = []

    has_collection = bool(facts.collection_variables)
    effective_accumulators = [
        variable for variable in facts.accumulators if variable not in facts.control_variables
    ]
    has_accumulator = bool(effective_accumulators)
    has_conditional = facts.conditional_count > 0 or "has_conditional_comparison" in features
    has_early_exit = facts.has_early_exit or "has_early_exit" in features
    has_monotonic = "has_monotonic_control_update" in features
    effective_targets = [
        variable
        for variable in facts.target_variables
        if variable not in facts.body_writes and variable not in facts.accumulators
    ]
    has_target = bool(effective_targets)
    has_prefix = (
        "has_prefix_write" in features
        or "has_copy_like_update" in features
        or "has_prefix_recurrence" in features
        or "has_filter_like_compaction" in features
    )
    has_binary_search_interval = "has_binary_search_interval" in features
    has_unit_counter_update = "has_unit_counter_update" in features

    control_directions = {
        var: direction
        for var, direction in facts.direction_by_control.items()
        if direction in ("increasing", "decreasing", "mixed", "refine")
    }

    # 1) euclidean_gcd
    if "has_euclid_mod_step" in features:
        reasons.extend(
            [
                "mod-based Euclidean reduction detected",
                "state rotation preserves gcd equivalence",
            ]
        )
        return ClassificationResult(
            pattern="euclidean_gcd",
            confidence=_clamp_confidence(0.95),
            reasons=reasons,
        )

    # 2) partition_by_pivot
    if "has_partition_pivot_step" in features:
        reasons.extend(
            [
                "pivot comparison with conditional frontier growth",
                "in-place partition writes over shared collection",
            ]
        )
        return ClassificationResult(
            pattern="partition_by_pivot",
            confidence=_clamp_confidence(0.92),
            reasons=reasons,
        )

    # 3) merge_progress
    if "has_merge_progress_step" in features:
        reasons.extend(
            [
                "two ordered frontiers advance monotonically",
                "destination buffer receives sequential merged output",
            ]
        )
        return ClassificationResult(
            pattern="merge_progress",
            confidence=_clamp_confidence(0.9),
            reasons=reasons,
        )

    # 4) insertion_prefix_sorted
    if "has_insertion_shift_step" in features:
        reasons.extend(
            [
                "right-shift of larger elements detected",
                "key insertion semantics over sorted prefix",
            ]
        )
        return ClassificationResult(
            pattern="insertion_prefix_sorted",
            confidence=_clamp_confidence(0.9),
            reasons=reasons,
        )

    # 5) selection_prefix_sorted
    if "has_selection_scan_step" in features:
        reasons.extend(
            [
                "nested extrema-index scan over unsorted suffix",
                "selection swap closes each outer iteration",
            ]
        )
        return ClassificationResult(
            pattern="selection_prefix_sorted",
            confidence=_clamp_confidence(0.89),
            reasons=reasons,
        )

    # 6) binary_search_interval
    if has_binary_search_interval:
        reasons.extend(
            [
                "candidate interval updated from midpoint comparisons",
                "interval narrowing preserves target containment semantics",
            ]
        )
        return ClassificationResult(
            pattern="binary_search_interval",
            confidence=_clamp_confidence(0.91),
            reasons=reasons,
        )

    # 7) sorting_pass
    sorting_condition = "has_swap_like_update" in features or (
        "has_adjacent_collection_comparison" in features and facts.collection_write_count > 0
    )
    if sorting_condition and has_collection:
        reasons.extend(
            [
                "adjacent comparison/write pattern",
                "collection swap-like updates",
            ]
        )
        return ClassificationResult(
            pattern="sorting_pass",
            confidence=_clamp_confidence(0.9 + (0.03 if has_conditional else 0.0)),
            reasons=reasons,
        )

    # 8) two_pointer_like
    has_two_pointer = "has_two_pointer_control" in features
    if not has_two_pointer and len(control_directions) >= 2:
        trend_values = set(control_directions.values())
        has_two_pointer = "increasing" in trend_values and "decreasing" in trend_values

    if has_two_pointer and not has_binary_search_interval:
        reasons.extend(
            [
                "two control variables with opposite progress",
                "loop guard couples moving boundaries",
            ]
        )
        return ClassificationResult(
            pattern="two_pointer_like",
            confidence=_clamp_confidence(0.82 + (0.05 if has_collection else 0.0)),
            reasons=reasons,
        )

    # 9) search
    search_flag = "has_search_flag_update" in features
    search_condition = (
        has_collection
        and has_target
        and (
            has_early_exit
            or has_conditional
            or has_monotonic
            or has_binary_search_interval
            or search_flag
        )
    )
    if search_condition:
        reasons.extend(
            [
                "collection element compared with external target",
                "progressive scan or interval narrowing with stopping evidence",
            ]
        )
        confidence = 0.78
        if has_early_exit:
            confidence += 0.1
        if has_monotonic:
            confidence += 0.04
        if has_binary_search_interval:
            confidence += 0.06
        if search_flag:
            confidence += 0.03
        return ClassificationResult(
            pattern="search",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # 9.5) filter_progress
    filter_progress_condition = (
        "has_filter_like_compaction" in features
        and has_collection
        and has_conditional
        and facts.collection_write_count > 0
    )
    if filter_progress_condition:
        reasons.extend(
            [
                "conditional append/skip semantics over scanned prefix",
                "output frontier evolves with filtered elements",
            ]
        )
        confidence = 0.8 + (0.05 if has_monotonic else 0.0)
        return ClassificationResult(
            pattern="filter_progress",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # 10) field_assignment_progress
    field_assignment_condition = (
        "has_object_field_write" in features
        and "has_collection_object_field_write" in features
        and facts.collection_write_count == 0
        and not has_accumulator
        and not has_target
    )
    if field_assignment_condition and has_conditional:
        reasons.extend(
            [
                "conditional predicate controls object-field writes",
                "uniform per-index field assignment over scanned elements",
            ]
        )
        return ClassificationResult(
            pattern="field_assignment_progress",
            confidence=_clamp_confidence(0.84),
            reasons=reasons,
        )

    if field_assignment_condition and not has_conditional:
        reasons.extend(
            [
                "uniform object-field writes over indexed collection elements",
                "assignment policy is consistent across scanned prefix",
            ]
        )
        confidence = 0.74 + (0.04 if has_monotonic else 0.0)
        return ClassificationResult(
            pattern="field_assignment_progress",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # 11) extrema
    extrema_by_name = _var_name_hints(
        facts.body_writes, "min", "max", "small", "large", "menor", "mayor"
    )
    extrema_by_structure = (
        "has_extrema_max_signal" in features or "has_extrema_min_signal" in features
    )
    extrema_condition = (
        has_conditional
        and facts.assignment_count >= 1
        and (
            extrema_by_structure
            or extrema_by_name
            or "has_extrema_index_update" in features
            or (has_collection and not has_accumulator and facts.collection_write_count == 0)
        )
    )
    if extrema_condition:
        reasons.extend(
            [
                "conditional refinement of candidate value",
                "order comparisons steer assignments",
            ]
        )
        confidence = 0.72 + (0.08 if extrema_by_name else 0.0)
        if extrema_by_structure:
            confidence += 0.1
        if "has_extrema_index_update" in features:
            confidence += 0.06
        return ClassificationResult(
            pattern="extrema",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # 12) binary_exponentiation_state
    if "has_binary_exponentiation_state" in features:
        reasons.extend(
            [
                "halving exponent update detected",
                "base self-squaring with conditional multiplicative accumulation",
            ]
        )
        return ClassificationResult(
            pattern="binary_exponentiation_state",
            confidence=_clamp_confidence(0.9),
            reasons=reasons,
        )

    # 12.5) incomplete binary-exponentiation-like loop
    # Strong signal for a near pattern, but not enough for a formal specialization.
    if "has_binary_exponentiation_shape" in features:
        reasons.extend(
            [
                "halving + squaring structure detected without a valid multiplicative state invariant",
                "insufficient evidence to classify as binary_exponentiation_state",
            ]
        )
        return ClassificationResult(
            pattern="unknown",
            confidence=_clamp_confidence(0.45),
            reasons=reasons,
        )

    # 13) counting
    counting_name_hint = _var_name_hints(effective_accumulators, "count", "cnt", "num", "total")
    counting_condition = (
        has_accumulator
        and has_conditional
        and not has_target
        and "has_multiplicative_accumulator" not in features
        and facts.collection_write_count == 0
        and (counting_name_hint or has_unit_counter_update)
    )
    if counting_condition:
        reasons.extend(
            [
                "accumulator updated under condition",
                "counter-like state variable",
            ]
        )
        confidence = (
            0.74
            + (0.08 if counting_name_hint else 0.0)
            + (0.06 if has_unit_counter_update else 0.0)
        )
        return ClassificationResult(
            pattern="counting",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # 14) accumulation
    if has_accumulator and not has_target:
        accumulator_hint = _var_name_hints(
            effective_accumulators, "sum", "total", "acc", "prod", "result"
        )
        reasons.extend(
            [
                "self-referential accumulator update",
                "partial aggregate maintained each iteration",
            ]
        )
        confidence = 0.72 + (0.05 if has_collection else 0.0)
        if "has_multiplicative_accumulator" in features:
            confidence += 0.04
        if accumulator_hint:
            confidence += 0.08
        return ClassificationResult(
            pattern="accumulation",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # 15) prefix_progress
    if has_prefix and has_collection:
        reasons.extend(
            [
                "indexed write tied to loop progression",
                "partial prefix/suffix structure updated",
            ]
        )
        confidence = 0.73 + (0.05 if has_monotonic else 0.0)
        if "has_filter_like_compaction" in features:
            confidence += 0.05
        return ClassificationResult(
            pattern="prefix_progress",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # 16) conservative object-array field writes (no predicate/aggregate signal)
    if (
        "has_collection_object_field_write" in features
        and "has_object_field_write" in features
        and not has_conditional
        and not has_accumulator
        and not has_target
    ):
        reasons.extend(
            [
                "indexed object-field writes detected without predicate/aggregate anchor",
                "keeping conservative unknown classification to avoid over-interpretation",
            ]
        )
        return ClassificationResult(
            pattern="unknown",
            confidence=0.3,
            reasons=reasons,
        )

    # 17) traversal
    traversal_condition = (
        has_collection
        and (bool(facts.control_variables) or facts.node_type == "FOR")
        and not has_accumulator
    )
    if traversal_condition:
        reasons.extend(
            [
                "collection accessed along loop progression",
                "no stronger task-specific signal detected",
            ]
        )
        confidence = 0.66 + (0.05 if has_monotonic else 0.0)
        if "has_order_check_no_swap" in features:
            confidence += 0.03
        return ClassificationResult(
            pattern="traversal",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # 18) loop_progress_only
    if "has_progress_only_loop" in features:
        reasons.extend(
            [
                "monotonic control update drives termination",
                "no robust aggregate semantics detected for emitted result variables",
            ]
        )
        return ClassificationResult(
            pattern="loop_progress_only",
            confidence=_clamp_confidence(0.87),
            reasons=reasons,
        )

    # 19) state_refinement
    overlap = set(facts.body_writes).intersection(set(facts.condition_reads))
    object_field_refinement = (
        "has_object_field_write" in features and "has_collection_object_field_write" not in features
    )
    if (
        overlap
        or has_monotonic
        or "has_interval_boundary_update" in features
        or object_field_refinement
    ):
        reasons.extend(
            [
                "loop rewrites state used by its own guard",
                "progressive refinement until condition changes",
            ]
        )
        confidence = 0.61 + (0.07 if overlap else 0.0)
        if "has_interval_boundary_update" in features:
            confidence += 0.04
        if object_field_refinement:
            confidence += 0.05
        return ClassificationResult(
            pattern="state_refinement",
            confidence=_clamp_confidence(confidence),
            reasons=reasons,
        )

    # 20) unknown
    reasons.append("insufficient local pattern evidence")
    return ClassificationResult(
        pattern="unknown",
        confidence=0.3,
        reasons=reasons,
    )
