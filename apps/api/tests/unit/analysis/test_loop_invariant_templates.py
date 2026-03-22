"""Unit tests for deterministic loop invariant templates."""

from app.modules.analysis.invariants.schemas import LoopFacts
from app.modules.analysis.invariants.templates import build_invariant_text, resolve_template_variant


def make_facts(**overrides) -> LoopFacts:
    base = LoopFacts(
        node={"type": "For"},
        node_type="FOR",
        depth=0,
        order=1,
        line_start=2,
        line_end=8,
        control_variables=["i"],
        condition_reads=["i", "n"],
        body_reads=["A", "i", "sum"],
        body_writes=["sum"],
        accumulators=["sum"],
        bound_variables=["n"],
        collection_variables=["A"],
        target_variables=["x"],
        key_updates=["sum <- sum + A[i]"],
        key_conditions=["i <= n"],
        comparisons=["A[i] == x"],
        detected_features=["has_collection_access"],
        direction_by_control={"i": "increasing"},
        assignment_count=2,
        conditional_count=1,
        nested_loop_count=0,
        body_statement_count=2,
        non_trivial_statement_count=2,
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


def test_templates_always_return_formal_sections_and_summary():
    facts = make_facts()

    for pattern in [
        "binary_exponentiation_state",
        "binary_search_interval",
        "euclidean_gcd",
        "partition_by_pivot",
        "merge_progress",
        "filter_progress",
        "insertion_prefix_sorted",
        "selection_prefix_sorted",
        "loop_progress_only",
        "traversal",
        "search",
        "accumulation",
        "field_assignment_progress",
        "counting",
        "extrema",
        "prefix_progress",
        "two_pointer_like",
        "sorting_pass",
        "state_refinement",
        "unknown",
    ]:
        text = build_invariant_text(pattern, facts, "es")
        assert text.property_statement.strip()
        assert text.initialization.strip()
        assert text.maintenance.strip()
        assert text.finalization.strip()
        assert text.didactic_summary.strip()


def test_templates_are_stable_for_same_input():
    facts = make_facts()

    first = build_invariant_text("accumulation", facts, "en")
    second = build_invariant_text("accumulation", facts, "en")

    assert first.property_statement == second.property_statement
    assert first.initialization == second.initialization
    assert first.maintenance == second.maintenance
    assert first.finalization == second.finalization
    assert first.didactic_summary == second.didactic_summary


def test_templates_use_natural_opening_phrase():
    facts = make_facts()

    es_text = build_invariant_text("search", facts, "es")
    en_text = build_invariant_text("search", facts, "en")

    assert es_text.property_statement.startswith("Al inicio de cada iteración")
    assert en_text.property_statement.startswith("At the start of each iteration")


def test_variant_resolution_detects_product_accumulation():
    facts = make_facts(
        accumulators=["prod"],
        body_writes=["prod"],
        detected_features=["has_accumulator_update", "has_multiplicative_accumulator"],
    )

    variant = resolve_template_variant("accumulation", facts)
    text = build_invariant_text("accumulation", facts, "es", template_variant=variant)

    assert variant == "product_array"
    assert "producto" in text.property_statement.lower()
    assert "prod" in text.property_statement
    assert "A[1..i-1]" in text.property_statement


def test_variant_resolution_uses_scalar_product_without_collection():
    facts = make_facts(
        accumulators=["result"],
        body_writes=["result"],
        body_reads=["result", "k"],
        collection_variables=[],
        detected_features=["has_accumulator_update", "has_multiplicative_accumulator"],
    )

    variant = resolve_template_variant("accumulation", facts)
    text = build_invariant_text("accumulation", facts, "es", template_variant=variant)

    assert variant == "product_scalar"
    assert "result" in text.property_statement
    assert "producto" in text.property_statement.lower()
    assert "A[" not in text.property_statement
    assert "A[" not in text.maintenance


def test_variant_resolution_detects_binary_search_template():
    facts = make_facts(
        node_type="WHILE",
        control_variables=["low", "high"],
        target_variables=["x"],
        detected_features=["has_binary_search_interval", "has_collection_target_comparison"],
    )

    variant = resolve_template_variant("search", facts)
    text = build_invariant_text("search", facts, "en", template_variant=variant)

    assert variant == "binary_search_interval"
    assert "interval" in text.property_statement.lower()
    assert "x" in text.property_statement
    assert "A" in text.property_statement


def test_variant_resolution_detects_euclid_template():
    facts = make_facts(
        node_type="WHILE",
        control_variables=["b"],
        body_writes=["a", "b", "temp"],
        accumulators=[],
        collection_variables=[],
        detected_features=["has_euclid_mod_step"],
    )

    variant = resolve_template_variant("euclidean_gcd", facts)
    text = build_invariant_text("euclidean_gcd", facts, "es", template_variant=variant)

    assert variant == "euclid_mod"
    assert "mcd" in text.property_statement.lower()
    assert "mod" in text.maintenance.lower()


def test_variant_resolution_detects_binary_exponentiation_template():
    facts = make_facts(
        node_type="WHILE",
        control_variables=["e"],
        body_writes=["resultado", "b", "e"],
        accumulators=["resultado", "b"],
        collection_variables=[],
        detected_features=[
            "has_binary_exponentiation_state",
            "exp_var:e",
            "base_var:b",
            "result_var:resultado",
            "mod_var:n",
        ],
        exponent_var="e",
        base_var="b",
        result_var="resultado",
        modulus_var="n",
    )

    variant = resolve_template_variant("binary_exponentiation_state", facts)
    text = build_invariant_text("binary_exponentiation_state", facts, "es", template_variant=variant)

    assert variant == "binary_exp_modular"
    assert "exponenciación binaria" in text.property_statement.lower()
    assert "resultado" in text.property_statement.lower()
    assert "suma" not in text.property_statement.lower()
    assert "neutro aditivo" not in text.initialization.lower()


def test_variant_resolution_detects_partition_template():
    facts = make_facts(
        control_variables=["j"],
        body_writes=["A", "i", "temp"],
        collection_variables=["A"],
        target_variables=["pivot"],
        detected_features=["has_partition_pivot_step"],
    )

    variant = resolve_template_variant("partition_by_pivot", facts)
    text = build_invariant_text("partition_by_pivot", facts, "en", template_variant=variant)

    assert variant == "quicksort_partition"
    assert "pivot" in text.property_statement.lower()
    assert "<=" in text.property_statement


def test_variant_resolution_uses_scalar_sum_without_collection():
    facts = make_facts(
        accumulators=["sum"],
        body_writes=["sum"],
        body_reads=["sum", "k"],
        collection_variables=[],
        detected_features=["has_accumulator_update"],
    )

    variant = resolve_template_variant("accumulation", facts)
    text = build_invariant_text("accumulation", facts, "en", template_variant=variant)

    assert variant == "sum_scalar"
    assert "sum" in text.property_statement
    assert "A[" not in text.property_statement


def test_variant_resolution_detects_copy_prefix_template():
    facts = make_facts(
        body_writes=["B"],
        collection_variables=["A", "B"],
        detected_features=["has_prefix_write", "has_copy_like_update"],
    )

    variant = resolve_template_variant("prefix_progress", facts)
    text = build_invariant_text("prefix_progress", facts, "es", template_variant=variant)

    assert variant == "array_copy"
    assert "copia" in text.didactic_summary.lower()
    assert "B[1..i-1]" in text.property_statement
    assert "A[1..i-1]" in text.property_statement


def test_variant_resolution_detects_filter_progress_template():
    facts = make_facts(
        control_variables=["i"],
        body_writes=["B", "k"],
        accumulators=["k"],
        collection_variables=["A", "B"],
        detected_features=[
            "has_collection_access",
            "has_collection_write",
            "has_filter_like_compaction",
            "has_monotonic_control_update",
        ],
        key_updates=["B[i] <- A[i]", "k <- k + 1"],
    )

    variant = resolve_template_variant("filter_progress", facts)
    text = build_invariant_text("filter_progress", facts, "es", template_variant=variant)

    assert variant == "filter_compaction"
    assert "B[1..k-1]" in text.property_statement
    assert "A[1..i-1]" in text.property_statement


def test_variant_resolution_detects_intersection_merge_template():
    facts = make_facts(
        node_type="WHILE",
        control_variables=["i", "j"],
        collection_variables=["A", "B", "C"],
        body_writes=["C", "i", "j", "k"],
        accumulators=["k"],
        detected_features=[
            "has_merge_progress_step",
            "has_collection_access",
            "has_collection_write",
            "has_collection_equality_comparison",
        ],
    )

    variant = resolve_template_variant("merge_progress", facts)
    text = build_invariant_text("merge_progress", facts, "es", template_variant=variant)

    assert variant == "intersection_two_way"
    assert "elementos comunes" in text.property_statement.lower()
    assert "subarreglos iniciales" in text.property_statement.lower()


def test_intersection_template_uses_detected_output_cursor_not_generic_k():
    facts = make_facts(
        node_type="WHILE",
        control_variables=["p_7", "q_8"],
        collection_variables=["ax_1", "bx_2", "cx_3"],
        body_writes=["cx_3", "p_7", "q_8", "w_9"],
        accumulators=["w_9"],
        detected_features=[
            "has_merge_progress_step",
            "has_collection_access",
            "has_collection_write",
            "has_collection_equality_comparison",
        ],
    )

    text = build_invariant_text("merge_progress", facts, "es", template_variant="intersection_two_way")

    assert "cx_3[1..w_9-1]" in text.property_statement
    assert "cx_3[w_9]" in text.maintenance
    assert "cx_3[1..k-1]" not in text.property_statement
    assert "cx_3[k]" not in text.maintenance


def test_filter_progress_maintenance_uses_source_collection_cell():
    facts = make_facts(
        node_type="FOR",
        control_variables=["p_1"],
        collection_variables=["src_5", "dst_6"],
        body_writes=["dst_6", "out_3"],
        accumulators=["out_3"],
        detected_features=[
            "has_collection_access",
            "has_collection_write",
            "has_filter_like_compaction",
            "has_monotonic_control_update",
        ],
    )

    text = build_invariant_text("filter_progress", facts, "es", template_variant="filter_compaction")

    assert "se evalúa src_5[p_1]" in text.maintenance
    assert "se evalúa dst_6[p_1]" not in text.maintenance


def test_variant_resolution_detects_uniform_object_array_field_assignment():
    facts = make_facts(
        node_type="FOR",
        control_variables=["i"],
        collection_variables=["A"],
        body_writes=["A.visitado"],
        accumulators=[],
        conditional_count=0,
        detected_features=[
            "has_collection_access",
            "has_object_field_write",
            "has_collection_object_field_write",
            "has_monotonic_control_update",
        ],
    )

    variant = resolve_template_variant("field_assignment_progress", facts)
    text = build_invariant_text("field_assignment_progress", facts, "es", template_variant=variant)

    assert variant == "object_array_field_uniform_assignment"
    assert "arreglo de objetos" in text.property_statement.lower()
    assert "uniforme" in text.property_statement.lower()


def test_variant_resolution_detects_maximum_from_structural_extrema_signal():
    facts = make_facts(
        node_type="FOR",
        control_variables=["ix_4"],
        collection_variables=["_rack_77"],
        body_writes=["z_88"],
        accumulators=[],
        detected_features=[
            "has_collection_access",
            "has_conditional_comparison",
            "has_extrema_max_signal",
            "extrema_candidate:z_88",
        ],
    )

    variant = resolve_template_variant("extrema", facts)
    text = build_invariant_text("extrema", facts, "es", template_variant=variant)

    assert variant == "maximum"
    assert "z_88" in text.property_statement
    assert "_rack_77[1..ix_4-1]" in text.property_statement
    assert "máximo" in text.property_statement.lower()


def test_sum_template_uses_explicit_variables_and_indexed_segment():
    facts = make_facts(
        control_variables=["i"],
        collection_variables=["A"],
        accumulators=["sum"],
        body_writes=["sum"],
        detected_features=["has_accumulator_update"],
    )

    variant = resolve_template_variant("accumulation", facts)
    text = build_invariant_text("accumulation", facts, "es", template_variant=variant)

    assert variant == "sum_array"
    assert "sum" in text.property_statement
    assert "A[1..i-1]" in text.property_statement
    assert "A[i]" in text.maintenance


def test_search_flag_template_mentions_flag_target_and_current_cell():
    facts = make_facts(
        control_variables=["i"],
        collection_variables=["A"],
        target_variables=["x"],
        body_writes=["found"],
        detected_features=[
            "has_collection_access",
            "has_search_flag_update",
            "has_collection_target_comparison",
        ],
    )

    variant = resolve_template_variant("search", facts)
    text = build_invariant_text("search", facts, "es", template_variant=variant)

    assert variant == "linear_search_flag"
    assert "found" in text.property_statement
    assert "x" in text.property_statement
    assert "A[i]" in text.maintenance


def test_sorting_template_mentions_indices_and_segment():
    facts = make_facts(
        control_variables=["j"],
        collection_variables=["A"],
        body_writes=["A", "temp"],
        detected_features=[
            "has_adjacent_collection_comparison",
            "has_swap_like_update",
            "has_collection_write",
        ],
    )

    text = build_invariant_text("sorting_pass", facts, "es")

    assert "subarreglo" in text.property_statement.lower()
    assert "A[1..j]" in text.property_statement
    assert "A[j]" in text.maintenance
    assert "A[j + 1]" in text.maintenance


def test_sorting_outer_variant_mentions_sorted_suffix():
    facts = make_facts(
        control_variables=["i"],
        collection_variables=["A"],
        body_writes=["A", "temp"],
        nested_loop_count=1,
        detected_features=[
            "has_adjacent_collection_comparison",
            "has_swap_like_update",
            "has_collection_write",
            "has_nested_loop",
        ],
    )

    variant = resolve_template_variant("sorting_pass", facts)
    text = build_invariant_text("sorting_pass", facts, "es", template_variant=variant)

    assert variant == "bubble_outer_pass"
    assert "iteración externa" in text.property_statement.lower()
    assert "subarreglo final ya ordenado" in text.property_statement.lower()


def test_accumulation_multi_accumulator_variant_is_conservative():
    facts = make_facts(
        control_variables=["i"],
        collection_variables=["A"],
        body_writes=["suma", "producto"],
        accumulators=["suma", "producto"],
        detected_features=["has_accumulator_update", "has_collection_access"],
    )

    variant = resolve_template_variant("accumulation", facts)
    text = build_invariant_text("accumulation", facts, "es", template_variant=variant)

    assert variant == "multi_accumulator_ambiguous"
    assert "multiples acumuladores" in text.property_statement.lower()
    assert "suma" in text.property_statement
    assert "producto" in text.property_statement


def test_multi_accumulator_without_collection_does_not_use_default_array_placeholder():
    facts = make_facts(
        node_type="FOR",
        control_variables=["j"],
        bound_variables=["m"],
        collection_variables=[],
        body_reads=["j", "sum", "product"],
        body_writes=["sum", "product"],
        accumulators=["sum", "product"],
        detected_features=["has_accumulator_update", "has_multiplicative_accumulator"],
    )

    variant = resolve_template_variant("accumulation", facts)
    text = build_invariant_text("accumulation", facts, "es", template_variant=variant)

    assert variant == "multi_accumulator_ambiguous"
    assert "A[" not in text.property_statement
    assert "A[" not in text.maintenance
    assert "A[" not in text.finalization
    assert "1..m" in text.finalization


def test_state_refinement_object_field_variant_mentions_object_fields():
    facts = make_facts(
        node_type="WHILE",
        control_variables=["i"],
        body_writes=["obj.total", "i"],
        accumulators=[],
        collection_variables=[],
        detected_features=["has_monotonic_control_update"],
    )

    variant = resolve_template_variant("state_refinement", facts)
    text = build_invariant_text("state_refinement", facts, "es", template_variant=variant)

    assert variant == "object_field_refinement"
    assert "campo" in text.maintenance.lower()
    assert "obj.total" in text.property_statement.lower()


def test_repeat_sum_uses_repeat_specific_template():
    facts = make_facts(
        node_type="REPEAT",
        control_variables=["i"],
        collection_variables=["A"],
        accumulators=["suma"],
        body_writes=["suma", "i"],
        detected_features=["is_repeat_until", "has_accumulator_update", "has_collection_access"],
    )

    variant = resolve_template_variant("accumulation", facts)
    text = build_invariant_text("accumulation", facts, "es", template_variant=variant)

    assert variant == "sum_array_repeat"
    assert "repeat" in text.property_statement.lower()
    assert "antes de evaluar until" in text.property_statement.lower()


def test_repeat_search_uses_repeat_specific_template():
    facts = make_facts(
        node_type="REPEAT",
        control_variables=["i"],
        collection_variables=["A"],
        target_variables=["x"],
        body_writes=["i"],
        detected_features=[
            "is_repeat_until",
            "has_collection_access",
            "has_collection_target_comparison",
            "has_early_exit",
            "has_conditional_comparison",
        ],
        conditional_count=1,
        has_early_exit=True,
    )

    variant = resolve_template_variant("search", facts)
    text = build_invariant_text("search", facts, "es", template_variant=variant)

    assert variant == "linear_search_repeat"
    assert "repeat" in text.property_statement.lower()
    assert "until" in text.property_statement.lower()


def test_unknown_object_array_field_variant_is_more_informative():
    facts = make_facts(
        node_type="FOR",
        control_variables=["i"],
        collection_variables=["A"],
        body_writes=["A.visitado"],
        accumulators=[],
        detected_features=["has_collection_object_field_write", "has_object_field_write"],
    )

    variant = resolve_template_variant("unknown", facts)
    text = build_invariant_text("unknown", facts, "es", template_variant=variant)

    assert variant == "unknown_object_array_field"
    assert "arreglo de objetos" in text.didactic_summary.lower()
    assert "A.visitado" in text.property_statement


def test_matrix_row_search_variant_uses_fixed_row_column_progress_wording():
    facts = make_facts(
        node_type="WHILE",
        depth=1,
        control_variables=["col"],
        condition_reads=["col", "m"],
        body_reads=["Matriz", "fila", "col", "objetivo"],
        body_writes=["col"],
        accumulators=[],
        bound_variables=["m"],
        collection_variables=["Matriz"],
        target_variables=["objetivo"],
        detected_features=[
            "has_collection_access",
            "has_multidimensional_collection_access",
            "has_collection_target_comparison",
            "has_conditional_comparison",
            "has_early_exit",
        ],
        conditional_count=1,
        has_early_exit=True,
    )

    variant = resolve_template_variant("search", facts)
    text = build_invariant_text("search", facts, "es", template_variant=variant)

    assert variant == "matrix_row_search"
    assert "fila fija" in text.property_statement.lower()
    assert "columnas previas" in text.property_statement.lower()
    assert "barrido interno" in text.finalization.lower()


def test_row_accumulation_variant_uses_target_row_wording():
    facts = make_facts(
        control_variables=["i"],
        condition_reads=["i", "n", "filaObjetivo"],
        body_reads=["M", "i", "j", "filaObjetivo"],
        body_writes=["s"],
        accumulators=["s"],
        collection_variables=["M"],
        detected_features=[
            "has_collection_access",
            "has_multidimensional_collection_access",
            "has_nested_loop",
            "has_accumulator_update",
            "has_conditional_comparison",
        ],
    )

    variant = resolve_template_variant("accumulation", facts)
    text = build_invariant_text("accumulation", facts, "es", template_variant=variant)

    assert variant == "row_accumulation"
    assert "fila objetivo" in text.property_statement.lower()
    assert "columnas ya procesadas" in text.property_statement.lower()


def test_field_assignment_progress_template_mentions_predicate_controlled_write():
    facts = make_facts(
        control_variables=["i"],
        body_reads=["A.nota", "i"],
        body_writes=["A.aprobado"],
        accumulators=[],
        collection_variables=["A"],
        detected_features=[
            "has_collection_access",
            "has_object_field_write",
            "has_collection_object_field_write",
            "has_conditional_comparison",
            "has_if",
        ],
    )

    variant = resolve_template_variant("field_assignment_progress", facts)
    text = build_invariant_text("field_assignment_progress", facts, "es", template_variant=variant)

    assert variant == "object_field_predicate_assignment"
    assert "asignación por predicado" in text.property_statement.lower()
    assert "A[i].aprobado" in text.property_statement
