"""Unit tests for deterministic loop pattern classifier."""

import pytest

from app.modules.analysis.invariants.classifier import classify_loop_pattern
from app.modules.analysis.invariants.schemas import LoopFacts

pytestmark = [pytest.mark.unit, pytest.mark.fast]


def make_facts(**overrides) -> LoopFacts:
    base = LoopFacts(
        node={"type": "For"},
        node_type="FOR",
        depth=0,
        order=1,
        line_start=2,
        line_end=6,
        control_variables=["i"],
        condition_reads=["i", "n"],
        body_reads=["A", "i"],
        body_writes=["x"],
        accumulators=[],
        bound_variables=["n"],
        collection_variables=["A"],
        target_variables=[],
        key_updates=["x <- A[i]"],
        key_conditions=["i <= n"],
        comparisons=["A[i] == x"],
        detected_features=["has_collection_access", "has_monotonic_control_update"],
        direction_by_control={"i": "increasing"},
        assignment_count=1,
        conditional_count=0,
        nested_loop_count=0,
        body_statement_count=1,
        non_trivial_statement_count=1,
        return_count=0,
        collection_read_count=1,
        collection_write_count=0,
        condition_comparison_count=1,
        swap_like_count=0,
        has_early_exit=False,
    )
    for key, value in overrides.items():
        setattr(base, key, value)
    return base


def test_classifier_detects_search_pattern():
    facts = make_facts(
        body_writes=["idx"],
        target_variables=["x"],
        conditional_count=1,
        has_early_exit=True,
        detected_features=[
            "has_collection_access",
            "has_monotonic_control_update",
            "has_collection_target_comparison",
            "has_early_exit",
            "has_conditional_comparison",
        ],
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "search"
    assert result.confidence >= 0.8


def test_classifier_detects_binary_search_interval_pattern():
    facts = make_facts(
        node_type="WHILE",
        control_variables=["low", "high"],
        condition_reads=["low", "high", "x", "A"],
        body_writes=["mid", "low", "high"],
        target_variables=["x"],
        detected_features=[
            "has_collection_access",
            "has_collection_target_comparison",
            "has_conditional_comparison",
            "has_midpoint_update",
            "has_interval_boundary_update",
            "has_binary_search_interval",
            "has_two_pointer_control",
        ],
        direction_by_control={"low": "increasing", "high": "decreasing"},
        conditional_count=1,
        assignment_count=3,
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "binary_search_interval"


def test_classifier_detects_euclidean_gcd_pattern():
    facts = make_facts(
        node_type="WHILE",
        control_variables=["b"],
        condition_reads=["b"],
        body_writes=["a", "b", "temp"],
        accumulators=[],
        collection_variables=[],
        detected_features=["has_euclid_mod_step"],
        direction_by_control={"b": "refine"},
        assignment_count=3,
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "euclidean_gcd"
    assert result.confidence >= 0.9


def test_classifier_detects_partition_by_pivot_pattern():
    facts = make_facts(
        body_writes=["A", "i", "temp"],
        collection_variables=["A"],
        target_variables=["pivot"],
        conditional_count=1,
        collection_write_count=2,
        detected_features=[
            "has_collection_access",
            "has_collection_target_comparison",
            "has_collection_write",
            "has_conditional_comparison",
            "has_partition_pivot_step",
        ],
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "partition_by_pivot"


def test_classifier_detects_merge_progress_pattern():
    facts = make_facts(
        node_type="WHILE",
        control_variables=["i", "j"],
        collection_variables=["A", "temp"],
        body_writes=["i", "j", "k", "temp"],
        accumulators=[],
        detected_features=[
            "has_collection_access",
            "has_collection_comparison",
            "has_collection_write",
            "has_merge_progress_step",
        ],
        direction_by_control={"i": "increasing", "j": "increasing", "k": "increasing"},
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "merge_progress"


def test_classifier_detects_counting_pattern():
    facts = make_facts(
        accumulators=["count"],
        conditional_count=1,
        target_variables=[],
        detected_features=[
            "has_collection_access",
            "has_accumulator_update",
            "has_conditional_comparison",
            "has_monotonic_control_update",
        ],
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "counting"


def test_classifier_does_not_force_counting_for_non_unit_accumulator():
    facts = make_facts(
        accumulators=["s"],
        conditional_count=1,
        target_variables=[],
        detected_features=[
            "has_collection_access",
            "has_accumulator_update",
            "has_conditional_comparison",
        ],
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "accumulation"


def test_classifier_detects_field_assignment_progress_pattern():
    facts = make_facts(
        accumulators=[],
        body_writes=["A.aprobado"],
        collection_variables=["A"],
        conditional_count=1,
        target_variables=[],
        collection_write_count=0,
        detected_features=[
            "has_collection_access",
            "has_object_field_write",
            "has_collection_object_field_write",
            "has_conditional_comparison",
            "has_if",
        ],
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "field_assignment_progress"
    assert result.confidence >= 0.8


def test_classifier_detects_uniform_object_array_field_assignment():
    facts = make_facts(
        accumulators=[],
        body_writes=["A.visitado"],
        collection_variables=["A"],
        conditional_count=0,
        target_variables=[],
        collection_write_count=0,
        detected_features=[
            "has_collection_access",
            "has_object_field_write",
            "has_collection_object_field_write",
            "has_monotonic_control_update",
        ],
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "field_assignment_progress"
    assert result.confidence >= 0.74


def test_classifier_promotes_object_field_alias_loop_to_state_refinement():
    facts = make_facts(
        accumulators=[],
        body_writes=["y.valor"],
        collection_variables=[],
        conditional_count=0,
        target_variables=[],
        detected_features=[
            "has_object_field_write",
        ],
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "state_refinement"


def test_classifier_detects_binary_exponentiation_state_pattern():
    facts = make_facts(
        node_type="WHILE",
        control_variables=["e"],
        condition_reads=["e"],
        body_writes=["resultado", "b", "e"],
        accumulators=["resultado", "b"],
        collection_variables=[],
        target_variables=[],
        detected_features=[
            "has_accumulator_update",
            "has_halving_update",
            "has_square_self_update",
            "has_conditional_multiplicative_accumulator",
            "has_binary_exponentiation_state",
        ],
        direction_by_control={"e": "decreasing"},
        conditional_count=1,
        assignment_count=4,
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "binary_exponentiation_state"
    assert result.confidence >= 0.85


def test_classifier_detects_extrema_pattern():
    facts = make_facts(
        body_writes=["minVal"],
        conditional_count=1,
        assignment_count=2,
        accumulators=[],
        detected_features=[
            "has_collection_access",
            "has_conditional_comparison",
            "has_monotonic_control_update",
        ],
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "extrema"


def test_classifier_detects_extrema_from_structure_without_name_hints():
    facts = make_facts(
        body_writes=["z_88"],
        conditional_count=1,
        assignment_count=2,
        accumulators=[],
        detected_features=[
            "has_collection_access",
            "has_conditional_comparison",
            "has_extrema_max_signal",
            "extrema_candidate:z_88",
        ],
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "extrema"
    assert result.confidence >= 0.8


def test_classifier_detects_sorting_pass_pattern():
    facts = make_facts(
        body_writes=["A", "temp"],
        collection_write_count=2,
        swap_like_count=1,
        detected_features=[
            "has_collection_access",
            "has_adjacent_collection_comparison",
            "has_swap_like_update",
            "has_conditional_comparison",
        ],
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "sorting_pass"
    assert result.confidence >= 0.85


def test_classifier_detects_prefix_progress_with_copy_feature():
    facts = make_facts(
        body_writes=["B", "i"],
        collection_variables=["A", "B"],
        detected_features=[
            "has_collection_access",
            "has_prefix_write",
            "has_copy_like_update",
            "has_monotonic_control_update",
        ],
        conditional_count=0,
        assignment_count=1,
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "prefix_progress"


def test_classifier_detects_filter_progress_before_generic_accumulation():
    facts = make_facts(
        body_writes=["B", "k"],
        accumulators=["k"],
        collection_variables=["A", "B"],
        conditional_count=1,
        collection_write_count=1,
        collection_read_count=1,
        detected_features=[
            "has_collection_access",
            "has_collection_write",
            "has_filter_like_compaction",
            "has_conditional_comparison",
            "has_monotonic_control_update",
        ],
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "filter_progress"
    assert result.confidence >= 0.8


def test_classifier_marks_incomplete_binary_exponentiation_shape_as_unknown():
    facts = make_facts(
        node_type="WHILE",
        control_variables=["e"],
        condition_reads=["e"],
        body_writes=["resultado", "b", "e"],
        accumulators=["resultado"],
        collection_variables=[],
        target_variables=[],
        detected_features=[
            "has_halving_update",
            "has_square_self_update",
            "has_binary_exponentiation_shape",
            "has_accumulator_update",
        ],
        direction_by_control={"e": "decreasing"},
        conditional_count=1,
        assignment_count=4,
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "unknown"
    assert result.confidence < 0.6


def test_classifier_detects_insertion_prefix_sorted_pattern():
    facts = make_facts(
        body_writes=["arr", "j", "key"],
        collection_variables=["arr"],
        detected_features=[
            "has_collection_access",
            "has_collection_write",
            "has_nested_loop",
            "has_shift_like_update",
            "has_insertion_shift_step",
        ],
        conditional_count=1,
        assignment_count=4,
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "insertion_prefix_sorted"


def test_classifier_detects_selection_prefix_sorted_pattern():
    facts = make_facts(
        body_writes=["A", "min_idx", "temp"],
        collection_variables=["A"],
        detected_features=[
            "has_collection_access",
            "has_collection_write",
            "has_nested_loop",
            "has_extrema_index_update",
            "has_selection_scan_step",
        ],
        conditional_count=1,
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "selection_prefix_sorted"


def test_classifier_detects_loop_progress_only_pattern():
    facts = make_facts(
        node_type="WHILE",
        control_variables=["i"],
        condition_reads=["i", "n"],
        body_reads=["i"],
        body_writes=["i", "x"],
        accumulators=[],
        collection_variables=[],
        target_variables=[],
        detected_features=[
            "has_monotonic_control_update",
            "has_interval_boundary_update",
            "has_progress_only_loop",
        ],
        direction_by_control={"i": "increasing"},
        conditional_count=0,
        assignment_count=2,
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "loop_progress_only"


def test_classifier_returns_unknown_when_evidence_is_insufficient():
    facts = make_facts(
        node_type="WHILE",
        control_variables=["n"],
        condition_reads=["n"],
        body_reads=["n"],
        body_writes=["x"],
        collection_variables=[],
        detected_features=[],
        conditional_count=0,
        assignment_count=1,
        has_early_exit=False,
        direction_by_control={},
    )

    result = classify_loop_pattern(facts)

    assert result.pattern == "unknown"
    assert result.confidence < 0.5
import pytest
