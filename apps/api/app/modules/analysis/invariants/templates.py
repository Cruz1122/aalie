"""Deterministic invariant text templates per loop pattern."""

from __future__ import annotations

from typing import List, Optional, Set

from .schemas import InvariantText, LoopFacts, PatternType, normalize_locale


def generate_behaviour(pattern: str, locale: str) -> str:
    if locale == "es":
        if pattern == "binary_search_interval": return "El algoritmo {} busca un elemento en un arreglo de forma eficiente dividiendo el rango de búsqueda a la mitad en cada paso."
        if pattern == "euclidean_gcd": return "El algoritmo {} calcula el máximo común divisor de dos números reemplazando iterativamente el mayor por el residuo de la división."
        if pattern == "partition_by_pivot": return "El algoritmo {} reorganiza un arreglo alrededor de un pivote, agrupando los elementos menores a un lado y los mayores al otro."
        if pattern == "merge_progress": return "El algoritmo {} combina o compara elementos de múltiples arreglos avanzando de manera coordinada a través de ellos."
        if pattern == "insertion_prefix_sorted": return "El algoritmo {} ordena un arreglo insertando gradualmente cada elemento en su posición correcta respecto a los anteriores."
        if pattern == "selection_prefix_sorted": return "El algoritmo {} ordena un arreglo buscando repetidamente el elemento extremo en la parte no ordenada y colocándolo en su lugar."
        if pattern == "search": return "El algoritmo {} recorre un conjunto de datos linealmente hasta encontrar un elemento o condición particular."
        if pattern == "accumulation": return "El algoritmo {} procesa elementos secuencialmente para calcular un valor acumulado agregado (como una suma o producto total)."
        if pattern == "extrema": return "El algoritmo {} inspecciona un conjunto de valores para identificar el elemento más grande o más pequeño."
        if pattern == "two_pointer_like": return "El algoritmo {} utiliza dos posiciones de referencia simultáneas que se acercan o avanzan juntas para procesar elementos extremos o relacionados de la colección."
        if pattern == "sorting_pass": return "El algoritmo {} realiza un pase sobre el arreglo, intercambiando o reposicionando elementos para ordenarlo progresivamente."
        return "El algoritmo {} repite un procedimiento iterativo para procesar la entrada de forma progresiva."
    
    if pattern == "binary_search_interval": return "The algorithm {} efficiently searches for an element in an array by repeatedly halving the search range."
    if pattern == "euclidean_gcd": return "The algorithm {} computes the greatest common divisor of two numbers by iteratively replacing the larger with the division remainder."
    if pattern == "partition_by_pivot": return "The algorithm {} reorganizes an array around a pivot, gathering smaller elements on one side and larger ones on the other."
    if pattern == "merge_progress": return "The algorithm {} combines or compares elements from multiple arrays by progressing coordinately across them."
    if pattern == "insertion_prefix_sorted": return "The algorithm {} sorts an array by gradually inserting each element into its correct position relative to the preceding ones."
    if pattern == "selection_prefix_sorted": return "The algorithm {} sorts an array by repeatedly finding the extreme element in the unsorted portion and placing it in place."
    if pattern == "search": return "The algorithm {} traverses a dataset linearly until finding a particular element or condition."
    if pattern == "accumulation": return "The algorithm {} sequentially processes elements to compute an aggregate accumulated value (like a total sum)."
    if pattern == "extrema": return "The algorithm {} inspects a set of values to identify the largest or smallest element."
    if pattern == "two_pointer_like": return "The algorithm {} uses two simultaneous reference positions that approach each other or advance together to process elements."
    if pattern == "sorting_pass": return "The algorithm {} makes a pass over the array, swapping or repositioning elements to progressively sort it."
    return "The algorithm {} repeats an iterative procedure to progressively process the input."

def _first(values: List[str], default: str) -> str:
    return values[0] if values else default


def _join(values: List[str]) -> str:
    return ", ".join(values)


def _has_name_hint(name: str, hints: tuple[str, ...]) -> bool:
    lowered = name.lower()
    return any(token in lowered for token in hints)


def _features(facts: LoopFacts) -> Set[str]:
    return set(facts.detected_features)


def _feature_values(features: Set[str], prefix: str) -> List[str]:
    values = [
        feature[len(prefix):].strip()
        for feature in features
        if feature.startswith(prefix)
    ]
    return sorted({value for value in values if value})


def _choose_interval_bounds(control_variables: List[str], fallback_left: str, fallback_right: str) -> tuple[str, str]:
    if len(control_variables) < 2:
        return fallback_left, fallback_right

    names = list(control_variables)
    left = _first(
        [name for name in names if _has_name_hint(name, ("low", "left", "izq", "inicio", "start", "l"))],
        names[0],
    )
    right = _first(
        [
            name
            for name in names
            if name != left and _has_name_hint(name, ("high", "right", "der", "fin", "end", "r"))
        ],
        _first([name for name in names if name != left], names[0]),
    )
    return left, right


def _choose_bound_variable(
    bound_variables: List[str],
    *,
    control: str,
    collection: str,
    target: str,
    default: str,
) -> str:
    if not bound_variables:
        return default

    candidates = [
        name
        for name in bound_variables
        if name not in {control, collection, target}
    ]
    if not candidates:
        candidates = list(bound_variables)

    preferred = _first(
        [
            name
            for name in candidates
            if _has_name_hint(name, ("n", "len", "size", "tam", "bound", "fin", "end", "m"))
        ],
        candidates[0],
    )
    return preferred


def _infer_copy_collections_from_updates(key_updates: List[str]) -> tuple[Optional[str], Optional[str]]:
    for update in key_updates:
        text = update.strip()
        # Example: B[i] <- A[i]
        if "<-" not in text:
            continue
        lhs, rhs = [part.strip() for part in text.split("<-", 1)]
        if "[" not in lhs or "[" not in rhs:
            continue
        lhs_base = lhs.split("[", 1)[0].strip()
        rhs_base = rhs.split("[", 1)[0].strip()
        if lhs_base and rhs_base and lhs_base != rhs_base:
            return rhs_base, lhs_base
    return None, None


def _extrema_label_es(candidate: str) -> str:
    if _has_name_hint(candidate, ("min", "small", "least", "menor")):
        return "mínimo"
    if _has_name_hint(candidate, ("max", "large", "great", "mayor")):
        return "máximo"
    return "extremo"


def _extrema_label_en(candidate: str) -> str:
    if _has_name_hint(candidate, ("min", "small", "least", "lower", "menor")):
        return "minimum"
    if _has_name_hint(candidate, ("max", "large", "great", "upper", "mayor")):
        return "maximum"
    return "extreme"


def _extrema_name_es(variant: str, candidate: str) -> str:
    if variant == "maximum":
        return "máximo"
    if variant == "minimum":
        return "mínimo"
    return _extrema_label_es(candidate)


def _extrema_name_en(variant: str, candidate: str) -> str:
    if variant == "maximum":
        return "maximum"
    if variant == "minimum":
        return "minimum"
    return _extrema_label_en(candidate)


def resolve_template_variant(pattern: PatternType, facts: LoopFacts) -> str:
    """Return deterministic template variant for one pattern."""

    features = _features(facts)
    extrema_candidates = _feature_values(features, "extrema_candidate:")
    accumulator = _first(extrema_candidates, _first(facts.accumulators, _first(facts.body_writes, "state")))
    if pattern == "extrema":
        accumulator = _first(
            [
                name
                for name in facts.body_writes
                if _has_name_hint(name, ("max", "min", "mayor", "menor", "small", "large"))
            ],
            accumulator,
        )

    if pattern == "binary_exponentiation_state":
        if (
            "has_binary_exponentiation_state" in features
            and facts.exponent_var
            and facts.base_var
            and facts.result_var
        ):
            return "binary_exp_modular" if facts.modulus_var else "binary_exp_plain"
        return "unknown"

    if pattern == "binary_search_interval":
        if len(facts.control_variables) >= 2:
            return "binary_search_interval"
        return "unknown"

    if pattern == "euclidean_gcd":
        if "has_euclid_mod_step" in features:
            return "euclid_mod"
        return "unknown"

    if pattern == "partition_by_pivot":
        if "has_partition_pivot_step" in features:
            return "quicksort_partition"
        return "unknown"

    if pattern == "merge_progress":
        if "has_merge_progress_step" in features:
            if "has_collection_equality_comparison" in features:
                return "intersection_two_way"
            return "two_way_merge"
        return "unknown"

    if pattern == "insertion_prefix_sorted":
        if "has_insertion_shift_step" in features:
            return "insertion_outer"
        return "unknown"

    if pattern == "selection_prefix_sorted":
        if "has_selection_scan_step" in features:
            return "selection_outer"
        return "unknown"

    if pattern == "loop_progress_only":
        if "has_progress_only_loop" in features:
            return "monotonic_progress"
        return "unknown"

    if pattern == "traversal":
        if "has_order_check_no_swap" in features:
            return "sorted_verification"
        return "simple_traversal"

    if pattern == "search":
        if "has_binary_search_interval" in features:
            return "binary_search_interval"
        if "has_nested_search_scan" in features:
            return "matrix_search"
        if "has_multidimensional_collection_access" in features:
            return "matrix_row_search"
        if "has_search_flag_update" in features:
            if facts.node_type == "REPEAT":
                return "linear_search_flag_repeat"
            return "linear_search_flag"
        if "has_collection_target_order_predicate" in features:
            if facts.node_type == "REPEAT":
                return "linear_search_predicate_repeat"
            return "linear_search_predicate"
        if facts.node_type == "REPEAT":
            return "linear_search_repeat"
        return "linear_search"

    if pattern == "accumulation":
        has_collection = bool(facts.collection_variables)
        if len(facts.accumulators) > 1:
            return "multi_accumulator_ambiguous"
        if (
            "has_multidimensional_collection_access" in features
            and has_collection
        ):
            return "row_accumulation"
        if "has_multiplicative_accumulator" in features:
            if _has_name_hint(accumulator, ("fact", "factor")):
                return "factorial_product"
            if _has_name_hint(accumulator, ("pow", "power", "exp")):
                return "power_iterative"
            if has_collection:
                return "product_array"
            return "product_scalar"
        if "has_prefix_recurrence" in features and has_collection:
            return "prefix_sum"
        if facts.node_type == "REPEAT" and has_collection:
            return "sum_array_repeat"
        if has_collection:
            return "sum_array"
        return "sum_scalar"

    if pattern == "counting":
        return "conditional_count"

    if pattern == "field_assignment_progress":
        if "has_collection_object_field_write" in features:
            if "has_conditional_comparison" in features or facts.conditional_count > 0:
                return "object_field_predicate_assignment"
            return "object_array_field_uniform_assignment"
        return "object_field_uniform_assignment"

    if pattern == "extrema":
        if "has_extrema_index_update" in features:
            return "extrema_with_index"
        has_max_signal = "has_extrema_max_signal" in features
        has_min_signal = "has_extrema_min_signal" in features
        if has_max_signal and not has_min_signal:
            return "maximum"
        if has_min_signal and not has_max_signal:
            return "minimum"
        label = _extrema_label_en(accumulator)
        if label == "minimum":
            return "minimum"
        if label == "maximum":
            return "maximum"
        return "extrema_generic"

    if pattern == "prefix_progress":
        if "has_filter_like_compaction" in features:
            return "filter_compaction"
        if "has_copy_like_update" in features:
            return "array_copy"
        if "has_prefix_recurrence" in features:
            return "prefix_sum_build"
        return "incremental_build"

    if pattern == "filter_progress":
        if "has_filter_like_compaction" in features:
            return "filter_compaction"
        return "unknown"

    if pattern == "two_pointer_like":
        if "has_swap_like_update" in features:
            return "reverse_two_pointer"
        return "boundary_shrink"

    if pattern == "sorting_pass":
        if facts.nested_loop_count > 0 or "has_nested_loop" in features:
            return "bubble_outer_pass"
        return "bubble_inner_pass"

    if pattern == "state_refinement":
        if "is_repeat_until" in features:
            return "repeat_until_refinement"
        if "has_binary_search_interval" in features:
            return "interval_refinement"
        if any("." in name for name in facts.body_writes):
            return "object_field_refinement"
        return "state_refinement_generic"

    if pattern == "unknown":
        has_indexed_field_write = any(
            "type': 'Index'" in update or '"type": "Index"' in update
            for update in facts.key_updates
        )
        collection_field_write = any(
            "." in name and name.split(".", 1)[0] in set(facts.collection_variables)
            for name in facts.body_writes
        )
        if "has_collection_object_field_write" in features and (
            has_indexed_field_write or collection_field_write or not facts.key_updates
        ):
            return "unknown_object_array_field"
        if "has_object_field_write" in features:
            return "unknown_object_field"

    return "unknown"


def build_invariant_text(
    pattern: PatternType,
    facts: LoopFacts,
    locale: Optional[str],
    *,
    template_variant: Optional[str] = None,
) -> InvariantText:
    """Build deterministic didactic invariant text for one pattern."""

    lang = normalize_locale(locale)
    features = _features(facts)

    control = _first(facts.control_variables, "i")
    second_control = _first(
        [name for name in facts.control_variables if name != control],
        _first([name for name in facts.condition_reads if name != control], "j"),
    )
    collection = _first(facts.collection_variables, "A")
    extrema_candidates = _feature_values(features, "extrema_candidate:")
    accumulator = _first(extrema_candidates, _first(facts.accumulators, _first(facts.body_writes, "state")))
    if pattern == "extrema":
        accumulator = _first(
            [
                name
                for name in facts.body_writes
                if _has_name_hint(name, ("max", "min", "mayor", "menor", "small", "large"))
            ],
            accumulator,
        )
    target = _first(facts.target_variables, "x")
    bound = _choose_bound_variable(
        facts.bound_variables,
        control=control,
        collection=collection,
        target=target,
        default="n",
    )
    partner_var = _first(
        [
            name
            for name in facts.body_writes
            if name != control and not _has_name_hint(name, ("temp", "aux", "tmp"))
        ],
        "a",
    )
    key_var = _first(
        [
            name
            for name in facts.body_writes + facts.target_variables
            if _has_name_hint(name, ("key", "clave"))
        ],
        _first(
            [
                name
                for name in (facts.body_writes + facts.body_reads + facts.target_variables)
                if "." not in name
                and name not in {control, second_control, collection, bound, target}
            ],
            "key",
        ),
    )
    matrix_row = _first(
        [
            name
            for name in (facts.body_reads + facts.condition_reads)
            if name not in {control, second_control, bound, target, collection}
            and _has_name_hint(name, ("fila", "row", "linea"))
        ],
        _first(
            [
                name
                for name in (facts.body_reads + facts.condition_reads)
                if name not in {control, second_control, bound, target, collection}
            ],
            second_control,
        ),
    )
    collection_field = _first(
        [
            name.split(".", 1)[1]
            for name in (facts.body_writes + facts.body_reads + facts.condition_reads)
            if isinstance(name, str)
            and name.startswith(f"{collection}.")
            and "." in name
        ],
        "",
    )

    state_vars = _join(facts.body_writes[:4]) if facts.body_writes else _join(
        [name for name in [control, second_control, partner_var] if name]
    )
    exp_var = facts.exponent_var or control
    base_var = facts.base_var or partner_var
    result_var = facts.result_var or accumulator
    mod_var = facts.modulus_var

    flag_candidate = _first(
        [
            name
            for name in facts.body_writes
            if _has_name_hint(name, ("found", "exist", "flag", "encontr", "hall", "seen"))
        ],
        _first(
            [
                name
                for name in facts.body_writes
                if "." not in name and name not in {control, second_control, collection, bound}
            ],
            "found",
        ),
    )

    source_hint, destination_hint = _infer_copy_collections_from_updates(facts.key_updates)
    destination_collection = destination_hint or _first(
        [name for name in facts.body_writes if name in facts.collection_variables],
        facts.collection_variables[1] if len(facts.collection_variables) > 1 else collection,
    )
    source_collection = source_hint or _first(
        [name for name in facts.collection_variables if name != destination_collection],
        collection,
    )
    if pattern == "merge_progress":
        source_collection = _first(
            [
                name
                for name in facts.collection_variables
                if name not in {collection, destination_collection}
            ],
            source_collection,
        )

    variant = template_variant or resolve_template_variant(pattern, facts)
    if pattern == "binary_search_interval":
        control, second_control = _choose_interval_bounds(
            facts.control_variables,
            control,
            second_control,
        )

    if lang == "es":
        return _build_spanish(
            pattern=pattern,
            variant=variant,
            control=control,
            second_control=second_control,
            collection=collection,
            source_collection=source_collection,
            destination_collection=destination_collection,
            accumulator=accumulator,
            target=target,
            bound=bound,
            partner_var=partner_var,
            key_var=key_var,
            state_vars=state_vars,
            flag_var=flag_candidate,
            exp_var=exp_var,
            base_var=base_var,
            result_var=result_var,
            mod_var=mod_var,
            matrix_row=matrix_row,
            collection_field=collection_field,
        )

    return _build_english(
        pattern=pattern,
        variant=variant,
        control=control,
        second_control=second_control,
        collection=collection,
        source_collection=source_collection,
        destination_collection=destination_collection,
        accumulator=accumulator,
        target=target,
        bound=bound,
        partner_var=partner_var,
        key_var=key_var,
        state_vars=state_vars,
        flag_var=flag_candidate,
        exp_var=exp_var,
        base_var=base_var,
        result_var=result_var,
        mod_var=mod_var,
        matrix_row=matrix_row,
        collection_field=collection_field,
    )


def _build_spanish(
    *,
    pattern: PatternType,
    variant: str,
    control: str,
    second_control: str,
    collection: str,
    source_collection: str,
    destination_collection: str,
    accumulator: str,
    target: str,
    bound: str,
    partner_var: str,
    key_var: str,
    state_vars: str,
    flag_var: str,
    exp_var: str,
    base_var: str,
    result_var: str,
    mod_var: Optional[str],
    matrix_row: str = "fila_actual",
    collection_field: str = "",
) -> InvariantText:
    prev_segment = f"{collection}[1..{control}-1]"
    current_cell = f"{collection}[{control}]"
    source_cell = f"{source_collection}[{control}]"
    field_cell = f"{collection}[{control}].{collection_field}" if collection_field else current_cell
    full_segment = f"{collection}[1..{bound}]"
    extrema_prev_segment = f"{collection}[1..{control}-1].{collection_field}" if collection_field else prev_segment
    extrema_full_segment = f"{collection}[1..{bound}].{collection_field}" if collection_field else full_segment

    if pattern == "binary_search_interval":
        if variant != "binary_search_interval":
            return _build_spanish(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )
        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, si {target} existe en {collection}, entonces pertenece al intervalo candidato [{control}, {second_control}]."
            ),
            initialization=(
                f"Inicialización: el algoritmo arranca con [{control}, {second_control}] cubriendo todo el rango relevante de búsqueda hasta {bound}."
            ),
            maintenance=(
                f"Mantenimiento: tras comparar con el punto medio, solo se descarta la mitad que no puede contener a {target}; por eso el nuevo intervalo [{control}, {second_control}] conserva la propiedad."
            ),
            finalization=(
                f"Finalización: si [{control}, {second_control}] queda vacío, {target} no está en {collection}; si se detecta igualdad antes, la posición retornada es correcta."
            ),
            didactic_summary=(
                f"La búsqueda binaria es correcta porque reduce un intervalo candidato sin eliminar una posición válida de {target}."
            ),
        )

    if pattern == "euclidean_gcd":
        if variant != "euclid_mod":
            return _build_spanish(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )
        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, el valor mcd({partner_var}, {control}) es invariante y coincide con el mcd de los valores de entrada."
            ),
            initialization=(
                f"Inicialización: antes del primer paso, ({partner_var}, {control}) son los valores iniciales, por lo que el mcd invariante queda fijado."
            ),
            maintenance=(
                f"Mantenimiento: la transformación ({partner_var}, {control}) <- ({control}, {partner_var} mod {control}) preserva el mcd; por eso la propiedad sigue siendo verdadera en la siguiente iteración."
            ),
            finalization=(
                f"Finalización: cuando {control} = 0, el algoritmo retorna {partner_var}, y por el invariante ese valor es exactamente el MCD buscado."
            ),
            didactic_summary=(
                "El algoritmo de Euclides conserva el MCD en cada reemplazo modular del par de estado."
            ),
        )

    if pattern == "binary_exponentiation_state":
        if variant not in ("binary_exp_modular", "binary_exp_plain"):
            return _build_spanish(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )

        modulo_clause = f" modulo {mod_var}" if mod_var else ""
        target_expr = f"{result_var} * {base_var}^{exp_var}"
        conserved_expr = f"base^exp{modulo_clause}" if mod_var else "base^exp"

        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, el estado ({result_var}, {base_var}, {exp_var}) preserva la relación de exponenciación binaria: {target_expr} representa el objetivo {conserved_expr}."
            ),
            initialization=(
                f"Inicialización: {result_var} comienza en 1 (identidad multiplicativa), {base_var} en la base y {exp_var} en el exponente original, por lo que la relación se cumple."
            ),
            maintenance=(
                f"Mantenimiento: si {exp_var} es impar se actualiza {result_var} con un factor {base_var}; luego {exp_var} se reduce a la mitad y {base_var} se reemplaza por su cuadrado{modulo_clause}, conservando el valor objetivo."
            ),
            finalization=(
                f"Finalización: cuando {exp_var} = 0, ya no quedan factores pendientes y {result_var} coincide con la potencia buscada{modulo_clause}."
            ),
            didactic_summary=(
                f"La corrección se basa en conservar una igualdad de estado entre ({result_var}, {base_var}, {exp_var}) en cada paso de halving/squaring."
            ),
        )

    if pattern == "partition_by_pivot":
        if variant != "quicksort_partition":
            return _build_spanish(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )
        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, existe una frontera de partición tal que los elementos ya ubicados a la izquierda son <= {target} y los del tramo intermedio son > {target}."
            ),
            initialization=(
                "Inicialización: antes de procesar el primer elemento, el bloque <= pivote está vacío y la propiedad se cumple de forma trivial."
            ),
            maintenance=(
                f"Mantenimiento: se inspecciona {collection}[{control}]; si {collection}[{control}] <= {target}, se expande la frontera izquierda y se intercambia para preservar la partición."
            ),
            finalization=(
                f"Finalización: tras completar el barrido, colocar {target} en su posición final deja a la izquierda valores <= pivote y a la derecha valores > pivote."
            ),
            didactic_summary=(
                f"La partición de QuickSort mantiene una frontera que separa de forma estable los elementos <= {target} de los mayores."
            ),
        )

    if pattern == "merge_progress":
        if variant not in ("two_way_merge", "intersection_two_way"):
            return _build_spanish(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )
        if variant == "intersection_two_way":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, {destination_collection}[1..{accumulator}-1] contiene exactamente los elementos comunes ya confirmados entre los subarreglos iniciales {collection}[1..{control}-1] y {source_collection}[1..{second_control}-1]."
                ),
                initialization=(
                    f"Inicialización: antes del primer paso, {destination_collection}[1..{accumulator}-1] es vacío y coincide con que aún no hay coincidencias confirmadas entre subarreglos iniciales."
                ),
                maintenance=(
                    f"Mantenimiento: se comparan {collection}[{control}] y {source_collection}[{second_control}]; si son iguales se agrega una coincidencia a {destination_collection}[{accumulator}] y avanzan ambos punteros, en caso contrario avanza solo el puntero del menor, preservando exactitud de intersección."
                ),
                finalization=(
                    f"Finalización: cuando uno de los arreglos se agota, no pueden aparecer nuevas coincidencias; por tanto, {destination_collection}[1..{accumulator}-1] es la intersección correcta de lo ya recorrido."
                ),
                didactic_summary=(
                    "La intersección ordenada mantiene dos fronteras y construye salida solo con coincidencias confirmadas, no con una fusión completa."
                ),
            )
        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, {destination_collection}[1..{accumulator}-1] ya contiene en orden los menores elementos tomados de ambos subarreglos pendientes."
            ),
            initialization=(
                f"Inicialización: antes del primer paso, {destination_collection}[1..{accumulator}-1] es vacío y por tanto está ordenado y correctamente fusionado."
            ),
            maintenance=(
                f"Mantenimiento: se compara el frente de cada subarreglo; se copia el menor a {destination_collection}[{accumulator}] y se avanza solo el puntero correspondiente, preservando orden y cobertura."
            ),
            finalization=(
                f"Finalización: cuando uno de los subarreglos se agota, el subarreglo construido en {destination_collection} es la fusión ordenada correcta de lo ya consumido."
            ),
            didactic_summary=(
                f"El merge avanza dos fronteras ordenadas y construye un subarreglo de salida también ordenada."
            ),
        )

    if pattern == "insertion_prefix_sorted":
        if variant != "insertion_outer":
            return _build_spanish(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )
        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración externa, el subarreglo inicial {collection}[1..{control}-1] está ordenado."
            ),
            initialization=(
                f"Inicialización: para {control}=2, el subarreglo inicial {collection}[1..1] tiene un solo elemento y está ordenado."
            ),
            maintenance=(
                f"Mantenimiento: se toma {key_var}, se desplazan a la derecha los mayores y se inserta en su posición; así el subarreglo inicial {collection}[1..{control}] queda ordenado."
            ),
            finalization=(
                f"Finalización: al terminar la última iteración, todo {collection}[1..{bound}] queda ordenado."
            ),
            didactic_summary=(
                "Insertion Sort mantiene un subarreglo inicial ordenado y lo expande una posición por iteración."
            ),
        )

    if pattern == "selection_prefix_sorted":
        if variant != "selection_outer":
            return _build_spanish(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )
        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración externa, el subarreglo inicial {collection}[1..{control}-1] ya está ordenado y contiene los menores elementos globales."
            ),
            initialization=(
                f"Inicialización: con subarreglo inicial vacío antes de la primera iteración, la propiedad es verdadera."
            ),
            maintenance=(
                f"Mantenimiento: se busca el mínimo del subarreglo restante aún no ordenado y se intercambia con la posición {control}; eso extiende el subarreglo inicial ordenado en una posición."
            ),
            finalization=(
                f"Finalización: al completar las iteraciones, {collection}[1..{bound}] queda totalmente ordenado."
            ),
            didactic_summary=(
                "Selection Sort fija en cada paso el mínimo restante y consolida un subarreglo inicial ordenado creciente."
            ),
        )

    if pattern == "loop_progress_only":
        if variant != "monotonic_progress":
            return _build_spanish(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )
        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, {control} marca exactamente la frontera de progreso alcanzada por el ciclo."
            ),
            initialization=(
                f"Inicialización: {control} inicia en el primer estado válido y define correctamente la frontera inicial."
            ),
            maintenance=(
                f"Mantenimiento: cada iteración actualiza {control} de forma monotónica, por lo que la frontera avanza sin retroceder."
            ),
            finalization=(
                "Finalización: cuando la guarda deja de cumplirse, la frontera de progreso alcanzada por el control justifica la salida del ciclo."
            ),
            didactic_summary=(
                "El ciclo no agrega ni busca; su invariante central es el avance monótono de la variable de control."
            ),
        )

    if pattern == "traversal":
        if variant == "sorted_verification":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, las comparaciones hechas en {prev_segment} no han encontrado una violación de orden en {collection}."
                ),
                initialization=(
                    f"Inicialización: antes de la primera comparación, no hay pares revisados en {collection}, por eso la propiedad es verdadera de forma trivial."
                ),
                maintenance=(
                    f"Mantenimiento: en la iteración actual se compara un par que incluye {current_cell}; si no hay violación, la propiedad pasa de {prev_segment} a {collection}[1..{control}]."
                ),
                finalization=(
                    f"Finalización: al terminar el recorrido hasta {full_segment}, el resultado sobre orden es correcto para todo el subarreglo analizado."
                ),
                didactic_summary=(
                    f"El ciclo válida orden de manera incremental: primero {prev_segment}, luego extiende hasta cubrir {full_segment}."
                ),
            )

        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, los elementos de {prev_segment} ya fueron procesados correctamente."
            ),
            initialization=(
                f"Inicialización: antes de iterar, {prev_segment} es un subarreglo vacío, así que la propiedad se cumple."
            ),
            maintenance=(
                f"Mantenimiento: en cada paso se procesa {current_cell}; después del paso, el subarreglo correcto pasa a ser {collection}[1..{control}]."
            ),
            finalization=(
                f"Finalización: cuando el ciclo termina, el subarreglo procesado coincide con {full_segment}."
            ),
            didactic_summary=(
                f"La corrección se establece por expansión de subarreglo: de {prev_segment} hacia {full_segment}."
            ),
        )

    if pattern == "search":
        if variant == "binary_search_interval":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, si {target} aparece en {collection}, entonces está dentro del intervalo [{control}, {second_control}]."
                ),
                initialization=(
                    f"Inicialización: el intervalo inicial [{control}, {second_control}] cubre todo el rango de búsqueda hasta {bound}."
                ),
                maintenance=(
                    f"Mantenimiento: se calcula punto medio y, según la comparación con {target}, se actualiza {control} o {second_control}; el nuevo intervalo sigue conteniendo a {target} si existe."
                ),
                finalization=(
                    f"Finalización: si el intervalo se vacía, {target} no está en {collection}; si se encuentra una igualdad antes, la posición reportada es correcta."
                ),
                didactic_summary=(
                    f"La búsqueda binaria mantiene un intervalo candidato [{control}, {second_control}] y lo reduce sin perder soluciones válidas."
                ),
            )

        if variant == "matrix_search":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración externa, todas las celdas de {collection} en filas anteriores a {control} ya fueron revisadas, y cualquier búsqueda en la fila actual se hace columna por columna sin saltos."
                ),
                initialization=(
                    f"Inicialización: antes de iniciar en la primera fila, no hay filas previas revisadas y la propiedad es verdadera."
                ),
                maintenance=(
                    f"Mantenimiento: se completa el barrido de la fila {control} por columnas; al pasar a la siguiente fila, queda garantizado que todas las filas previas fueron revisadas correctamente."
                ),
                finalization=(
                    f"Finalización: al terminar el barrido de filas, se decide correctamente si {target} aparece en la matriz {collection}."
                ),
                didactic_summary=(
                    f"La búsqueda matricial progresa por filas completas y conserva qué región ya fue inspeccionada."
                ),
            )

        if variant == "matrix_row_search":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración del barrido interno, en la fila fija {matrix_row}, las columnas previas a {control} ya fueron revisadas y no contienen {target}."
                ),
                initialization=(
                    f"Inicialización: en la fila {matrix_row}, antes de revisar la primera columna, no hay columnas previas inspeccionadas y la propiedad es verdadera."
                ),
                maintenance=(
                    f"Mantenimiento: se inspecciona {collection}[{matrix_row}][{control}]; si no coincide con {target}, la ausencia se extiende a la siguiente columna, y si coincide se retorna una salida correcta."
                ),
                finalization=(
                    f"Finalización: cuando termina el barrido interno de la fila {matrix_row}, queda decidida correctamente la presencia de {target} en esa fila."
                ),
                didactic_summary=(
                    "La corrección del barrido interno en matriz se expresa por fila fija: las columnas previas quedan descartadas sin linealizar toda la estructura."
                ),
            )

        if variant == "linear_search_flag":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, {flag_var} indica correctamente si {target} apareció en {prev_segment}."
                ),
                initialization=(
                    f"Inicialización: {flag_var} inicia en falso y el subarreglo revisado {prev_segment} está vacío."
                ),
                maintenance=(
                    f"Mantenimiento: se inspecciona {current_cell}; si {current_cell} == {target}, entonces {flag_var} cambia a verdadero, en otro caso conserva su valor correcto."
                ),
                finalization=(
                    f"Finalización: al terminar, {flag_var} resume si {target} apareció en {full_segment}."
                ),
                didactic_summary=(
                    f"La variable {flag_var} codifica de forma exacta el resultado de búsqueda sobre el subarreglo ya recorrido."
                ),
            )

        if variant == "linear_search_flag_repeat":
            return InvariantText(
                property_statement=(
                    f"En REPEAT, al inicio de cada nueva iteración, {flag_var} indica correctamente si {target} apareció en {prev_segment}; la primera pasada se ejecuta antes del chequeo UNTIL."
                ),
                initialization=(
                    f"Inicialización: antes de arrancar REPEAT, {flag_var} inicia en falso y el subarreglo ya recorrido es vacío."
                ),
                maintenance=(
                    f"Mantenimiento: se inspecciona {current_cell}; si hay coincidencia con {target}, {flag_var} se actualiza, y en otro caso conserva coherencia para la siguiente reevaluación."
                ),
                finalization=(
                    f"Finalización: cuando UNTIL detiene el ciclo, {flag_var} resume correctamente si {target} apareció en {full_segment}."
                ),
                didactic_summary=(
                    "En REPEAT la primera iteración ocurre sin chequeo previo, pero la semántica del subarreglo ya recorrido sigue siendo consistente."
                ),
            )

        if variant == "linear_search_predicate":
            predicate_hint = f"{current_cell} satisface una condición de selección"
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, ningún elemento en {prev_segment} cumple el predicado de selección ({predicate_hint})."
                ),
                initialization=(
                    f"Inicialización: antes de la primera iteración, {prev_segment} es vacío y no hay elementos que cumplan el predicado."
                ),
                maintenance=(
                    f"Mantenimiento: se evalúa {current_cell}; si no cumple el predicado, la propiedad se extiende a {collection}[1..{control}], y si cumple, se fija una salida correcta."
                ),
                finalization=(
                    f"Finalización: cuando termina el recorrido, se concluye correctamente si existe una posición que cumple el predicado en {full_segment}."
                ),
                didactic_summary=(
                    "La búsqueda por predicado mantiene que el subarreglo ya recorrido no contiene candidatos válidos."
                ),
            )

        if variant == "linear_search_predicate_repeat":
            predicate_hint = f"{current_cell} satisface una condición de selección"
            return InvariantText(
                property_statement=(
                    f"En REPEAT, al inicio de cada nueva iteración, ningún elemento en {prev_segment} cumple el predicado ({predicate_hint}); la primera pasada se ejecuta antes de evaluar UNTIL."
                ),
                initialization=(
                    f"Inicialización: antes de iniciar REPEAT, {prev_segment} es vacío y no hay candidatos válidos."
                ),
                maintenance=(
                    f"Mantenimiento: se evalúa {current_cell}; si no cumple, la propiedad se extiende al nuevo subarreglo inicial, y si cumple se fija una salida correcta."
                ),
                finalization=(
                    f"Finalización: al terminar REPEAT, se concluye correctamente si existe posición válida en {full_segment}."
                ),
                didactic_summary=(
                    "La variante REPEAT explica que el cuerpo se ejecuta una vez antes del primer chequeo de salida."
                ),
            )

        if variant == "linear_search_repeat":
            return InvariantText(
                property_statement=(
                    f"En REPEAT, justo antes de evaluar UNTIL, tras ejecutar el cuerpo una vez, {target} no aparece en {prev_segment}, o su hallazgo ya fue registrado de forma consistente."
                ),
                initialization=(
                    f"Inicialización: antes de la primera pasada, {prev_segment} es vacío; después de esa pasada inicial, la propiedad queda definida para la primera evaluación de UNTIL."
                ),
                maintenance=(
                    f"Mantenimiento: cada pasada revisa {current_cell} y luego actualiza el control; al llegar al punto de reevaluar UNTIL, la descripción del subarreglo inicial vuelve a ser correcta."
                ),
                finalization=(
                    f"Finalización: cuando UNTIL detiene el ciclo, la decisión de pertenencia de {target} en {full_segment} coincide con todo lo efectivamente inspeccionado."
                ),
                didactic_summary=(
                    "En búsqueda REPEAT la invariante se interpreta en el punto post-cuerpo/pre-chequeo: primero se ejecuta, después se válida condición de salida."
                ),
            )

        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, {target} no aparece en {prev_segment}, o ya se registró su hallazgo de forma consistente."
            ),
            initialization=(
                f"Inicialización: antes de la primera iteración, {prev_segment} es vacío y la afirmación es verdadera."
            ),
            maintenance=(
                f"Mantenimiento: se revisa {current_cell}; si {current_cell} != {target}, la ausencia se extiende a {collection}[1..{control}], y si hay igualdad se actualiza el estado de salida."
            ),
            finalization=(
                f"Finalización: al terminar el recorrido, se concluye correctamente si {target} pertenece a {full_segment}."
            ),
            didactic_summary=(
                f"La búsqueda lineal mantiene una frontera de revisión y un estado consistente con lo observado hasta {control}-1."
            ),
        )

    if pattern == "filter_progress":
        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, {destination_collection}[1..{accumulator}-1] contiene exactamente los elementos válidos detectados en {source_collection}[1..{control}-1]."
            ),
            initialization=(
                f"Inicialización: antes de procesar elementos, el subarreglo de salida {destination_collection}[1..{accumulator}-1] es vacío y coincide con cero válidos detectados."
            ),
            maintenance=(
                f"Mantenimiento: se evalúa {source_cell}; si cumple la condición, se escribe en {destination_collection}[{accumulator}] y se avanza la frontera {accumulator}, conservando exactitud entre entrada revisada y salida parcial."
            ),
            finalization=(
                f"Finalización: al terminar, {destination_collection}[1..{accumulator}-1] contiene todos y solo los elementos de {source_collection}[1..{bound}] que cumplen la condición."
            ),
            didactic_summary=(
                "La compactación es correcta porque preserva una correspondencia exacta entre subarreglo ya leído y subarreglo construido."
            ),
        )

    if pattern == "accumulation":
        if variant == "multi_accumulator_ambiguous":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, existen multiples acumuladores activos ({state_vars}) y la evidencia local no permite fijar de forma única cual describe la postcondición principal."
                ),
                initialization=(
                    f"Inicialización: los acumuladores relevantes en ({state_vars}) parten de valores base consistentes para sus respectivas agregaciones."
                ),
                maintenance=(
                    f"Mantenimiento: en cada paso se actualizan de forma coherente los acumuladores relevantes usando el avance de {control}, pero el ciclo mantiene más de una semántica agregada válida."
                ),
                finalization=(
                    f"Finalización: al terminar, ambos acumuladores resumen información correcta sobre el rango iterado 1..{bound}, aunque la meta principal requiere contexto adicional."
                ),
                didactic_summary=(
                    "Cuando hay varios acumuladores competitivos, el motor conserva una descripción prudente en baja confianza en lugar de imponer una sola lectura."
                ),
            )

        if variant == "row_accumulation":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración externa, {accumulator} resume la contribución acumulada de la fila objetivo ({matrix_row}) sobre las columnas ya procesadas."
                ),
                initialization=(
                    f"Inicialización: {accumulator} comienza en el neutro aditivo y antes de alcanzar la fila objetivo no hay contribuciones acumuladas."
                ),
                maintenance=(
                    f"Mantenimiento: cuando la guarda seleccióna la fila objetivo, el barrido interno incorpora celdas {collection}[{matrix_row}][*] a {accumulator}; en filas no objetivo, el acumulado permanece coherente."
                ),
                finalization=(
                    f"Finalización: al terminar (o retornar), {accumulator} coincide con la suma de la fila objetivo en la porción efectivamente recorrida."
                ),
                didactic_summary=(
                    "La plantilla de acumulación por fila separa el control externo (selección de fila) del efecto semántico principal (suma interna por columnas)."
                ),
            )

        if variant == "sum_array_repeat":
            return InvariantText(
                property_statement=(
                    f"En REPEAT, justo antes de evaluar UNTIL, {accumulator} representa la suma correcta del subarreglo inicial {prev_segment}."
                ),
                initialization=(
                    f"Inicialización: antes de entrar a REPEAT, {accumulator} parte en neutro aditivo; tras la primera pasada, la propiedad queda establecida para la primera evaluación de UNTIL."
                ),
                maintenance=(
                    f"Mantenimiento: cada pasada incorpora {current_cell} y actualiza el control; al cerrar la pasada, la suma parcial vuelve a coincidir con el subarreglo inicial realmente cubierto antes de evaluar UNTIL."
                ),
                finalization=(
                    f"Finalización: cuando UNTIL se satisface, {accumulator} resume exactamente la acumulación sobre {full_segment}."
                ),
                didactic_summary=(
                    "La plantilla REPEAT explica el punto semántico correcto: estado parcial válido después del cuerpo y antes del chequeo de salida."
                ),
            )

        if variant == "factorial_product":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, {accumulator} contiene el factorial del último valor ya incorporado por el ciclo."
                ),
                initialization=(
                    f"Inicialización: {accumulator} = 1, que corresponde al factorial base (0! o 1!, según variante)."
                ),
                maintenance=(
                    f"Mantenimiento: en cada paso, {accumulator} se multiplica por el siguiente entero válido, preservando la definición de factorial parcial."
                ),
                finalization=(
                    f"Finalización: al completar el rango, {accumulator} coincide con el factorial objetivo."
                ),
                didactic_summary=(
                    f"La variable {accumulator} mantiene exactamente el producto factorial acumulado en cada frontera de iteración."
                ),
            )

        if variant == "power_iterative":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, {accumulator} representa la potencia acumulada de la base tras las multiplicaciones ya ejecutadas."
                ),
                initialization=(
                    f"Inicialización: {accumulator} = 1, equivalente a exponente 0."
                ),
                maintenance=(
                    f"Mantenimiento: cada iteración multiplica {accumulator} por la base, por lo que el exponente acumulado aumenta en uno."
                ),
                finalization=(
                    f"Finalización: tras completar las iteraciones requeridas, {accumulator} es la potencia final esperada."
                ),
                didactic_summary=(
                    f"La potencia se construye de forma iterativa manteniendo en {accumulator} el valor exacto del subarreglo inicial de multiplicaciones."
                ),
            )

        if variant == "product_array":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, {accumulator} contiene el producto de los elementos en {prev_segment}."
                ),
                initialization=(
                    f"Inicialización: {accumulator} = 1, que es el elemento neutro del producto sobre un subarreglo vacío."
                ),
                maintenance=(
                    f"Mantenimiento: se actualiza {accumulator} <- {accumulator} * {current_cell}; luego {accumulator} pasa a representar el producto en {collection}[1..{control}]."
                ),
                finalization=(
                    f"Finalización: cuando el ciclo termina, {accumulator} es el producto de {full_segment}."
                ),
                didactic_summary=(
                    f"La acumulación multiplicativa conserva una interpretación exacta de subarreglo inicial en la variable {accumulator}."
                ),
            )

        if variant == "product_scalar":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, {accumulator} contiene el producto correcto de los valores ya incorporados por el ciclo."
                ),
                initialization=(
                    f"Inicialización: {accumulator} = 1, el neutro multiplicativo para comenzar sin contribuciones previas."
                ),
                maintenance=(
                    f"Mantenimiento: en cada paso, {accumulator} se multiplica por el siguiente valor del rango, y así preserva el producto parcial correcto."
                ),
                finalization=(
                    f"Finalización: al terminar el ciclo, {accumulator} coincide con el producto final de todos los valores procesados."
                ),
                didactic_summary=(
                    f"El ciclo mantiene en {accumulator} un producto parcial exacto, sin depender de acceso a arreglos."
                ),
            )

        if variant == "prefix_sum":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, {accumulator} mantiene la suma parcial correcta usada para construir el siguiente subarreglo inicial indexado por {control}."
                ),
                initialization=(
                    f"Inicialización: {accumulator} arranca con el valor base del subarreglo inicial inicial."
                ),
                maintenance=(
                    f"Mantenimiento: cada paso usa el valor previo de {accumulator} y agrega {current_cell}, extendiendo la corrección un índice más."
                ),
                finalization=(
                    f"Finalización: al terminar, los subarreglos iniciales calculados cubren todo {full_segment}."
                ),
                didactic_summary=(
                    f"El ciclo mantiene una recurrencia de subarreglos iniciales donde {accumulator} resume la información necesaria del paso anterior."
                ),
            )

        if variant == "sum_scalar":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, {accumulator} contiene la suma correcta de los valores ya incorporados por el ciclo."
                ),
                initialization=(
                    f"Inicialización: {accumulator} se establece con el neutro aditivo para representar suma de cero contribuciones."
                ),
                maintenance=(
                    f"Mantenimiento: en cada iteración se agrega la contribución del paso actual a {accumulator}, y así la suma parcial sigue siendo correcta."
                ),
                finalization=(
                    f"Finalización: cuando termina el ciclo, {accumulator} representa la suma total del rango procesado."
                ),
                didactic_summary=(
                    f"La variable {accumulator} acumula de forma incremental una suma parcial consistente en cada frontera de iteración."
                ),
            )

        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, {accumulator} contiene la acumulación correcta sobre {prev_segment}."
            ),
            initialization=(
                f"Inicialización: {accumulator} toma un valor neutro válido para acumulación sobre subarreglo vacío."
            ),
            maintenance=(
                f"Mantenimiento: en el paso actual se incorpora {current_cell} a {accumulator}, por lo que la propiedad se extiende a {collection}[1..{control}]."
            ),
            finalization=(
                f"Finalización: al finalizar el ciclo, {accumulator} resume la acumulación sobre {full_segment}."
            ),
            didactic_summary=(
                f"La variable {accumulator} preserva una semántica de acumulación de subarreglo inicial durante todo el ciclo."
            ),
        )

    if pattern == "counting":
        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, {accumulator} cuenta cuántos elementos de {prev_segment} cumplen la condición."
            ),
            initialization=(
                f"Inicialización: {accumulator} = 0 y no hay elementos revisados en {prev_segment}."
            ),
            maintenance=(
                f"Mantenimiento: se evalúa {current_cell}; si cumple la condición, {accumulator} aumenta en 1, y si no, permanece igual."
            ),
            finalization=(
                f"Finalización: al terminar, {accumulator} es el conteo total de elementos válidos en {full_segment}."
            ),
            didactic_summary=(
                f"El contador {accumulator} coincide en todo momento con la cardinalidad de elementos válidos del subarreglo inicial."
            ),
        )

    if pattern == "field_assignment_progress":
        if variant == "object_array_field_uniform_assignment":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, en el arreglo de objetos, los campos ya escritos del subarreglo inicial recorrido siguen una actualización uniforme (por ejemplo {field_cell})."
                ),
                initialization=(
                    "Inicialización: antes del primer elemento, no hay campos escritos en el subarreglo inicial y la regla uniforme es vacuamente cierta."
                ),
                maintenance=(
                    f"Mantenimiento: cada iteración asigna el campo del elemento indexado ({field_cell}) con una política estable, preservando coherencia uniforme sobre lo ya recorrido."
                ),
                finalization=(
                    "Finalización: al terminar el recorrido, la actualización uniforme de campo queda garantizada en todo el subarreglo procesado."
                ),
                didactic_summary=(
                    "Esta variante modela escrituras uniformes sobre campos en arreglos de objetos sin exigir una condición de filtro."
                ),
            )
        if variant == "object_field_uniform_assignment":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, el campo de objeto relevante ({field_cell}) mantiene una política uniforme de actualización coherente con el progreso del ciclo."
                ),
                initialization=(
                    "Inicialización: el campo parte de un estado válido y consistente con la política de actualización."
                ),
                maintenance=(
                    "Mantenimiento: cada paso reescribe el campo de forma consistente, preservando la misma regla de actualización sobre el estado parcial."
                ),
                finalization=(
                    "Finalización: al salir del ciclo, el campo queda en un estado consistente con la política uniforme aplicada iterativamente."
                ),
                didactic_summary=(
                    "Esta variante describe progreso por escrituras uniformes de campo cuando no hay señal suficiente para una subfamilia más específica."
                ),
            )
        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, los campos de salida sobre el subarreglo inicial ya recorrido siguen la regla de asignación por predicado (por ejemplo {field_cell} en función de la condición local)."
            ),
            initialization=(
                "Inicialización: antes del primer elemento, no hay campos del subarreglo inicial actualizados y la regla es vacuamente cierta."
            ),
            maintenance=(
                f"Mantenimiento: en cada paso se evalúa el predicado y se asigna el campo correspondiente del elemento actual ({field_cell}), preservando uniformidad sobre lo ya procesado."
            ),
            finalization=(
                f"Finalización: al cerrar el recorrido, todos los elementos del subarreglo relevante cumplen la política de asignación de campo definida por el predicado."
            ),
            didactic_summary=(
                "Esta familia captura escrituras uniformes de campos de objeto controladas por condición booleana, sin forzar una lectura de extremos o conteo."
            ),
        )

    if pattern == "extrema":
        extrema_name = _extrema_name_es(variant, accumulator)

        if variant == "extrema_with_index":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, {accumulator} y su índice asociado describen el {extrema_name} correcto dentro de {extrema_prev_segment}."
                ),
                initialization=(
                    f"Inicialización: se toma un valor inicial de {collection} y su posición correspondiente como referencia válida del {extrema_name}."
                ),
                maintenance=(
                    f"Mantenimiento: se compara {field_cell} con {accumulator}; si mejora el {extrema_name}, se actualizan valor e índice, si no, ambos se conservan."
                ),
                finalization=(
                    f"Finalización: al cerrar el ciclo, {accumulator} y su posición representan el {extrema_name} de {extrema_full_segment}."
                ),
                didactic_summary=(
                    f"El ciclo mantiene simultáneamente el mejor valor ({accumulator}) y su localización en la parte revisada."
                ),
            )

        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, {accumulator} contiene el {extrema_name} de {extrema_prev_segment}."
            ),
            initialization=(
                f"Inicialización: {accumulator} se inicializa con un elemento base de {collection}, válido para el primer subarreglo revisado."
            ),
            maintenance=(
                f"Mantenimiento: se compara {field_cell} contra {accumulator}; si mejora el {extrema_name}, {accumulator} se actualiza, en caso contrario permanece correcto."
            ),
            finalization=(
                f"Finalización: al terminar, {accumulator} es el {extrema_name} global de {extrema_full_segment}."
            ),
            didactic_summary=(
                f"La corrección proviene de conservar en {accumulator} el mejor candidato del subarreglo inspeccionado."
            ),
        )

    if pattern == "prefix_progress":
        if variant == "array_copy":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, las posiciones de {destination_collection}[1..{control}-1] son iguales a {source_collection}[1..{control}-1]."
                ),
                initialization=(
                    f"Inicialización: antes de empezar, el tramo {destination_collection}[1..{control}-1] es vacío, así que la igualdad se cumple."
                ),
                maintenance=(
                    f"Mantenimiento: se ejecuta la copia en índice {control} (por ejemplo, {destination_collection}[{control}] <- {source_collection}[{control}]); luego la igualdad se extiende una posición."
                ),
                finalization=(
                    f"Finalización: al terminar el recorrido, {destination_collection}[1..{bound}] es copia correcta de {source_collection}[1..{bound}]."
                ),
                didactic_summary=(
                    f"La copia es correcta porque la igualdad origen-destino se mantiene por subarreglos iniciales crecientes de índice {control}."
                ),
            )

        if variant == "filter_compaction":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, {destination_collection}[1..{accumulator}-1] contiene exactamente los elementos válidos ya detectados en {source_collection}[1..{control}-1]."
                ),
                initialization=(
                    f"Inicialización: la salida {destination_collection}[1..{accumulator}-1] comienza vacía y no hay elementos revisados en {source_collection}[1..{control}-1], por lo que la correspondencia es exacta."
                ),
                maintenance=(
                    f"Mantenimiento: se evalúa {source_cell}; si cumple la condición se agrega en {destination_collection}[{accumulator}] y se avanza la frontera {accumulator}; si no, se omite sin romper la correspondencia."
                ),
                finalization=(
                    f"Finalización: al terminar, {destination_collection}[1..{accumulator}-1] contiene todos y solo los elementos de {source_collection}[1..{bound}] que cumplen la condición."
                ),
                didactic_summary=(
                    f"La compactación mantiene una relación exacta entre el subarreglo ya leído de {source_collection} y la salida construida en {destination_collection}."
                ),
            )

        if variant == "prefix_sum_build":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, los subarreglos iniciales en {destination_collection}[1..{control}-1] ya son correctos."
                ),
                initialization=(
                    f"Inicialización: se fija el caso base del primer subarreglo inicial en {destination_collection}."
                ),
                maintenance=(
                    f"Mantenimiento: se calcula {destination_collection}[{control}] usando el subarreglo inicial anterior y {source_collection}[{control}], extendiendo la corrección a un índice más."
                ),
                finalization=(
                    f"Finalización: al terminar, todos los subarreglos iniciales en {destination_collection}[1..{bound}] están correctamente construidos."
                ),
                didactic_summary=(
                    f"El ciclo aplica una recurrencia de subarreglos iniciales donde cada posición depende de la anterior ya válidada."
                ),
            )

        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, la salida construida hasta el índice {control}-1 es correcta."
            ),
            initialization=(
                "Inicialización: la estructura parcial comienza vacía o en estado base válido."
            ),
            maintenance=(
                f"Mantenimiento: la iteración actual calcula la contribución del índice {control} y mantiene correcta la parte ya construida."
            ),
            finalization=(
                "Finalización: al completar el ciclo, la estructura de salida queda construida para todo el rango requerido."
            ),
            didactic_summary=(
                "La construcción progresiva preserva corrección por extensión de un subarreglo inicial ya válido."
            ),
        )

    if pattern == "two_pointer_like":
        if variant == "reverse_two_pointer":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, los elementos fuera del subarreglo [{control}, {second_control}] ya están en su posición final respecto a la inversión."
                ),
                initialization=(
                    f"Inicialización: antes del primer intercambio, no hay posiciones fuera de [{control}, {second_control}] que contradigan la propiedad."
                ),
                maintenance=(
                    f"Mantenimiento: se intercambian extremos ({collection}[{control}] y {collection}[{second_control}]) y luego {control} avanza, {second_control} retrocede; así crece la zona ya invertida."
                ),
                finalization=(
                    f"Finalización: cuando {control} >= {second_control}, todo el arreglo quedó invertido correctamente."
                ),
                didactic_summary=(
                    f"Dos fronteras móviles ({control}, {second_control}) delimitan una región pendiente cada vez más pequeña."
                ),
            )

        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, el subarreglo [{control}, {second_control}] es la única región pendiente; fuera de él, la condición objetivo ya es válida."
            ),
            initialization=(
                f"Inicialización: las fronteras {control} y {second_control} se ubican sobre el intervalo completo pendiente."
            ),
            maintenance=(
                f"Mantenimiento: cada iteración actualiza {control} y/o {second_control} de forma monotónica, reduciendo la región pendiente sin inválidar lo ya resuelto."
            ),
            finalization=(
                f"Finalización: cuando las fronteras se cruzan, no queda región pendiente y la condición global queda satisfecha."
            ),
            didactic_summary=(
                "El método de dos punteros conserva una frontera de trabajo explícita y decreciente."
            ),
        )

    if pattern == "sorting_pass":
        if variant == "bubble_outer_pass":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración externa, los últimos {control}-1 elementos de {collection} ya están en su posición final y forman un subarreglo final ya ordenado."
                ),
                initialization=(
                    f"Inicialización: antes de la primera iteración externa, no hay elementos fijados al final, por lo que el subarreglo final ya ordenado es vacío."
                ),
                maintenance=(
                    f"Mantenimiento: la pasada interna compara adyacentes y empuja el mayor del subarreglo aún no ordenado hasta su posición final al final de la zona pendiente."
                ),
                finalization=(
                    f"Finalización: al completar las iteraciones externas, todo {collection}[1..{bound}] queda ordenado."
                ),
                didactic_summary=(
                    "La invariante externa de burbuja fija un subarreglo final ya ordenado creciente en cada pasada completa."
                ),
            )

        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración interna, en el subarreglo {collection}[1..{control}], el mayor de los elementos ya comparados quedó ubicado al final de ese subarreglo."
            ),
            initialization=(
                f"Inicialización: antes de la primera comparación, el subarreglo visitado es mínimo y la propiedad se cumple de forma directa."
            ),
            maintenance=(
                f"Mantenimiento: en cada paso se comparan {collection}[{control}] y {collection}[{control} + 1]; si están en orden incorrecto, se intercambian, y así el mayor avanza una posición hacia la derecha."
            ),
            finalization=(
                f"Finalización: al terminar la iteración interna de ordenamiento, el mayor del subarreglo no ordenado queda en su posición final."
            ),
            didactic_summary=(
                "La invariante interna de burbuja garantiza que el máximo del subarreglo inicial recorrido migra al extremo derecho de la pasada."
            ),
        )

    if pattern == "state_refinement":
        if variant == "repeat_until_refinement":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, el estado ({state_vars}) es coherente con todas las actualizaciónes realizadas antes de volver a evaluar la condición de parada."
                ),
                initialization=(
                    "Inicialización: el estado inicial satisface las precondiciónes del primer ciclo REPEAT."
                ),
                maintenance=(
                    "Mantenimiento: cada paso transforma el estado de forma consistente y deja las variables listas para una nueva evaluación de la condición UNTIL."
                ),
                finalization=(
                    "Finalización: cuando UNTIL se cumple, el estado final respeta exactamente la condición de salida del algoritmo."
                ),
                didactic_summary=(
                    "En REPEAT-UNTIL la corrección se mantiene por refinamiento del estado antes de cada reevaluación de salida."
                ),
            )

        if variant == "interval_refinement":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, el estado de frontera [{control}, {second_control}] delimita un intervalo válido de trabajo."
                ),
                initialization=(
                    f"Inicialización: las fronteras se inician sobre el intervalo completo del problema."
                ),
                maintenance=(
                    f"Mantenimiento: cada actualización de {control} o {second_control} reduce el intervalo descartando solo regiones inválidas."
                ),
                finalization=(
                    "Finalización: cuando el intervalo ya no es válido, el algoritmo concluye con una decisión correcta según su criterio de parada."
                ),
                didactic_summary=(
                    "El ciclo refina un intervalo candidato hasta alcanzar una condición terminal verificable."
                ),
            )

        if variant == "object_field_refinement":
            return InvariantText(
                property_statement=(
                    f"Al inicio de cada iteración, el campo de objeto en ({state_vars}) mantiene coherencia con el avance del control y refleja una refinación monótona del estado."
                ),
                initialization=(
                    "Inicialización: el campo del objeto y la variable de control parten de una configuración consistente con la precondición."
                ),
                maintenance=(
                    "Mantenimiento: en cada iteración se actualiza el campo del objeto en sincronía con el control del ciclo, preservando coherencia entre estado interno, guardia y progreso."
                ),
                finalization=(
                    "Finalización: al cumplirse la condición de salida, el campo del objeto queda en un estado válido y alineado con el avance total del ciclo."
                ),
                didactic_summary=(
                    "La subplantilla de objeto/campo enfatiza progreso de control + mutacion de campo como eje de correccion local."
                ),
            )

        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, las variables de estado ({state_vars}) describen un estado intermedio válido para el objetivo del ciclo."
            ),
            initialization=(
                "Inicialización: las variables comienzan en un estado que satisface las hipótesis del proceso iterativo."
            ),
            maintenance=(
                "Mantenimiento: cada iteración aplica una transformación que conserva validez del estado para la siguiente evaluación."
            ),
            finalization=(
                "Finalización: cuando se cumple la condición de salida, el estado acumulado cumple la postcondición esperada."
            ),
            didactic_summary=(
                "La corrección depende de mantener un estado interno coherente mientras la condición de parada aún no se cumple."
            ),
        )

    if variant == "unknown_object_array_field":
        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, las escrituras de campo sobre arreglo de objetos (por ejemplo {state_vars}) siguen una actualización uniforme por índice en el subarreglo inicial ya recorrido."
            ),
            initialization=(
                "Inicialización: antes del primer paso, no hay elementos actualizados en el subarreglo inicial y la formulación uniforme es válida."
            ),
            maintenance=(
                f"Mantenimiento: cada iteración actualiza el campo del elemento indexado por el control, conservando consistencia local del subarreglo procesado."
            ),
            finalization=(
                "Finalización: al terminar, la escritura uniforme de campos queda garantizada sobre todo el subarreglo recorrido, aunque el objetivo global siga siendo ambiguo."
            ),
            didactic_summary=(
                "Se reconoce una subfamilia informativa de actualización uniforme en arreglo de objetos, manteniendo clasificación conservadora por falta de contexto global."
            ),
        )

    if variant == "unknown_object_field":
        return InvariantText(
            property_statement=(
                f"Al inicio de cada iteración, el campo de objeto involucrado en ({state_vars}) evoluciona de forma coherente con el control, pero la evidencia local es insuficiente para especializar una familia formal."
            ),
            initialization=(
                "Inicialización: el campo parte de un estado válido para el proceso iterativo."
            ),
            maintenance=(
                "Mantenimiento: el campo se reescribe de forma consistente en cada paso, manteniendo validez local del estado."
            ),
            finalization=(
                "Finalización: al salir del ciclo, el campo queda en un estado consistente con las actualizaciónes aplicadas."
            ),
            didactic_summary=(
                "Se detecta refinamiento de estado sobre campo de objeto, pero se conserva clasificación prudente por falta de evidencia adicional."
            ),
        )

    return InvariantText(
        property_statement=(
            "Al inicio de cada iteración no hay evidencia local suficiente para fijar una propiedad formal específica sin arriesgar una interpretación incorrecta."
        ),
        initialization=(
            "Inicialización: se conserva una formulación prudente porque el AST no aporta estructura suficiente para una propiedad más específica."
        ),
        maintenance=(
            "Mantenimiento: el análisis evita inferencias no sustentadas y mantiene una descripción conservadora durante todo el ciclo."
        ),
        finalization=(
            "Finalización: el resultado se mantiene en baja confianza para no afirmar una invariancia que no esté respaldada por evidencia local."
        ),
        didactic_summary=(
            "Se detectó un ciclo, pero no hay señal local robusta para especializar una plantilla sin riesgo de sobreinterpretación."
        ),
    )


def _build_english(
    *,
    pattern: PatternType,
    variant: str,
    control: str,
    second_control: str,
    collection: str,
    source_collection: str,
    destination_collection: str,
    accumulator: str,
    target: str,
    bound: str,
    partner_var: str,
    key_var: str,
    state_vars: str,
    flag_var: str,
    exp_var: str,
    base_var: str,
    result_var: str,
    mod_var: Optional[str],
    matrix_row: str = "row_current",
    collection_field: str = "",
) -> InvariantText:
    prev_segment = f"{collection}[1..{control}-1]"
    current_cell = f"{collection}[{control}]"
    source_cell = f"{source_collection}[{control}]"
    field_cell = f"{collection}[{control}].{collection_field}" if collection_field else current_cell
    full_segment = f"{collection}[1..{bound}]"
    extrema_prev_segment = f"{collection}[1..{control}-1].{collection_field}" if collection_field else prev_segment
    extrema_full_segment = f"{collection}[1..{bound}].{collection_field}" if collection_field else full_segment

    if pattern == "binary_search_interval":
        if variant != "binary_search_interval":
            return _build_english(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )
        return InvariantText(
            property_statement=(
                f"At the start of each iteration, if {target} exists in {collection}, then it remains inside candidate interval [{control}, {second_control}]."
            ),
            initialization=(
                f"Initialization: the algorithm starts with [{control}, {second_control}] covering the whole relevant search range up to {bound}."
            ),
            maintenance=(
                f"Maintenance: after midpoint comparison, only the half that cannot contain {target} is discarded; therefore the updated interval [{control}, {second_control}] preserves the property."
            ),
            finalization=(
                f"Finalization: if [{control}, {second_control}] becomes empty, {target} is absent from {collection}; if equality is found earlier, the returned index is correct."
            ),
            didactic_summary=(
                "Binary search is correct because interval narrowing never removes a valid target position."
            ),
        )

    if pattern == "euclidean_gcd":
        if variant != "euclid_mod":
            return _build_english(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )
        return InvariantText(
            property_statement=(
                f"At the start of each iteration, gcd({partner_var}, {control}) is invariant and equals the gcd of the original inputs."
            ),
            initialization=(
                f"Initialization: before the first step, ({partner_var}, {control}) matches the input pair, fixing the gcd invariant."
            ),
            maintenance=(
                f"Maintenance: the transformation ({partner_var}, {control}) <- ({control}, {partner_var} mod {control}) preserves gcd, so the invariant remains true for the next iteration."
            ),
            finalization=(
                f"Finalization: when {control} = 0, the algorithm returns {partner_var}, and by the invariant that value is exactly the desired gcd."
            ),
            didactic_summary=(
                "Euclid's algorithm preserves gcd through each modular state rotation."
            ),
        )

    if pattern == "binary_exponentiation_state":
        if variant not in ("binary_exp_modular", "binary_exp_plain"):
            return _build_english(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )

        modulo_clause = f" modulo {mod_var}" if mod_var else ""
        target_expr = f"{result_var} * {base_var}^{exp_var}"
        conserved_expr = f"base^exp{modulo_clause}" if mod_var else "base^exp"

        return InvariantText(
            property_statement=(
                f"At the start of each iteration, state ({result_var}, {base_var}, {exp_var}) preserves the binary-exponentiation relation: {target_expr} represents target value {conserved_expr}."
            ),
            initialization=(
                f"Initialization: {result_var} starts at 1 (multiplicative identity), {base_var} starts at the base, and {exp_var} starts at the original exponent, so the relation holds."
            ),
            maintenance=(
                f"Maintenance: when {exp_var} is odd, {result_var} is multiplied by {base_var}; then {exp_var} is halved and {base_var} is squared{modulo_clause}, preserving the target quantity."
            ),
            finalization=(
                f"Finalization: once {exp_var} = 0, no pending factors remain and {result_var} equals the requested power{modulo_clause}."
            ),
            didactic_summary=(
                f"Correctness comes from preserving a state equation over ({result_var}, {base_var}, {exp_var}) across each halving/squaring step."
            ),
        )

    if pattern == "partition_by_pivot":
        if variant != "quicksort_partition":
            return _build_english(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )
        return InvariantText(
            property_statement=(
                f"At the start of each iteration, there is a partition frontier such that already-placed left elements are <= {target}, while the intermediate region stores values > {target}."
            ),
            initialization=(
                "Initialization: before scanning starts, the <= pivot region is empty, so the property holds trivially."
            ),
            maintenance=(
                f"Maintenance: {collection}[{control}] is inspected; when {collection}[{control}] <= {target}, the left frontier expands and a swap preserves the partition property."
            ),
            finalization=(
                f"Finalization: after the scan, placing {target} at its final index leaves <= pivot values to the left and > pivot values to the right."
            ),
            didactic_summary=(
                f"Quicksort partition is correct because a moving frontier consistently separates <= {target} from larger elements."
            ),
        )

    if pattern == "merge_progress":
        if variant not in ("two_way_merge", "intersection_two_way"):
            return _build_english(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )
        if variant == "intersection_two_way":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, {destination_collection}[1..{accumulator}-1] contains exactly the already confirmed common elements between consumed prefixes {collection}[1..{control}-1] and {source_collection}[1..{second_control}-1]."
                ),
                initialization=(
                    f"Initialization: before the first step, {destination_collection}[1..{accumulator}-1] is empty, matching the fact that no confirmed common element exists yet."
                ),
                maintenance=(
                    f"Maintenance: {collection}[{control}] and {source_collection}[{second_control}] are compared; when equal, one confirmed common element is appended to {destination_collection}[{accumulator}] and both frontiers advance, otherwise only the frontier of the smaller value advances, preserving intersection exactness."
                ),
                finalization=(
                    f"Finalization: once one input is exhausted, no new common element can appear; therefore {destination_collection}[1..{accumulator}-1] is the correct intersection over the consumed ranges."
                ),
                didactic_summary=(
                    "Ordered intersection advances two frontiers but writes output only for confirmed matches, unlike full merge output."
                ),
            )
        return InvariantText(
            property_statement=(
                f"At the start of each iteration, {destination_collection}[1..{accumulator}-1] already stores, in sorted order, the smallest consumed elements from both pending runs."
            ),
            initialization=(
                f"Initialization: before the first step, {destination_collection}[1..{accumulator}-1] is empty, therefore sorted and correctly merged."
            ),
            maintenance=(
                f"Maintenance: the two run-front elements are compared; the smaller one is copied into {destination_collection}[{accumulator}], and only its corresponding frontier advances, preserving order and coverage."
            ),
            finalization=(
                f"Finalization: when one run is exhausted, the built prefix in {destination_collection} is the correct sorted merge of all consumed elements."
            ),
            didactic_summary=(
                "Merge correctness comes from advancing two ordered frontiers while constructing an ordered output prefix."
            ),
        )

    if pattern == "insertion_prefix_sorted":
        if variant != "insertion_outer":
            return _build_english(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )
        return InvariantText(
            property_statement=(
                f"At the start of each outer iteration, prefix {collection}[1..{control}-1] is sorted."
            ),
            initialization=(
                f"Initialization: for {control}=2, prefix {collection}[1..1] has one element and is sorted."
            ),
            maintenance=(
                f"Maintenance: {key_var} is extracted, larger elements are shifted right, and {key_var} is inserted at its position; this keeps {collection}[1..{control}] sorted."
            ),
            finalization=(
                f"Finalization: after the last iteration, the whole segment {collection}[1..{bound}] is sorted."
            ),
            didactic_summary=(
                "Insertion sort maintains a sorted prefix and extends it by one position per iteration."
            ),
        )

    if pattern == "selection_prefix_sorted":
        if variant != "selection_outer":
            return _build_english(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )
        return InvariantText(
            property_statement=(
                f"At the start of each outer iteration, prefix {collection}[1..{control}-1] is sorted and contains the globally smallest elements."
            ),
            initialization=(
                "Initialization: before the first iteration, the sorted prefix is empty, so the property holds."
            ),
            maintenance=(
                f"Maintenance: the minimum of the unsorted suffix is located and swapped into position {control}, extending the sorted prefix by one."
            ),
            finalization=(
                f"Finalization: after all iterations, {collection}[1..{bound}] is fully sorted."
            ),
            didactic_summary=(
                "Selection sort fixes one minimum per iteration, building a growing sorted prefix."
            ),
        )

    if pattern == "loop_progress_only":
        if variant != "monotonic_progress":
            return _build_english(
                pattern="unknown",
                variant="unknown",
                control=control,
                second_control=second_control,
                collection=collection,
                source_collection=source_collection,
                destination_collection=destination_collection,
                accumulator=accumulator,
                target=target,
                bound=bound,
                partner_var=partner_var,
                key_var=key_var,
                state_vars=state_vars,
                flag_var=flag_var,
                exp_var=exp_var,
                base_var=base_var,
                result_var=result_var,
                mod_var=mod_var,
            )
        return InvariantText(
            property_statement=(
                f"At the start of each iteration, {control} exactly marks the progress frontier reached by the loop."
            ),
            initialization=(
                f"Initialization: {control} starts at the first valid state and therefore defines the initial frontier correctly."
            ),
            maintenance=(
                f"Maintenance: each step updates {control} monotonically, so the frontier advances without rollback."
            ),
            finalization=(
                "Finalization: once the guard becomes false, the reached progress frontier justifies loop termination."
            ),
            didactic_summary=(
                "This loop's core invariant is monotonic control progress rather than aggregation or search state."
            ),
        )

    if pattern == "traversal":
        if variant == "sorted_verification":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, comparisons already executed on {prev_segment} have not found an ordering violation in {collection}."
                ),
                initialization=(
                    f"Initialization: before the first comparison, no pair has been checked in {collection}, so the property holds trivially."
                ),
                maintenance=(
                    f"Maintenance: the current step compares a new pair that includes {current_cell}; if no violation appears, the property extends to {collection}[1..{control}]."
                ),
                finalization=(
                    f"Finalization: after scanning up to {full_segment}, the order verdict is correct for the whole analyzed range."
                ),
                didactic_summary=(
                    f"Order válidation is maintained incrementally: first {prev_segment}, then extended to {full_segment}."
                ),
            )

        return InvariantText(
            property_statement=(
                f"At the start of each iteration, all elements in {prev_segment} have already been processed correctly."
            ),
            initialization=(
                f"Initialization: before iterating, {prev_segment} is empty, so the property holds immediately."
            ),
            maintenance=(
                f"Maintenance: each step processes {current_cell}; afterwards, the válidated segment becomes {collection}[1..{control}]."
            ),
            finalization=(
                f"Finalization: when the loop ends, the processed segment matches {full_segment}."
            ),
            didactic_summary=(
                f"Correctness is established by segment expansion from {prev_segment} to {full_segment}."
            ),
        )

    if pattern == "search":
        if variant == "binary_search_interval":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, if {target} exists in {collection}, then it lies inside interval [{control}, {second_control}]."
                ),
                initialization=(
                    f"Initialization: the initial interval [{control}, {second_control}] covers the whole search range up to {bound}."
                ),
                maintenance=(
                    f"Maintenance: the midpoint is checked and either {control} or {second_control} is updated; the remaining interval still contains {target} whenever {target} exists."
                ),
                finalization=(
                    f"Finalization: if the interval becomes empty, {target} is absent; if equality is found earlier, the reported position is correct."
                ),
                didactic_summary=(
                    f"Binary search preserves a valid candidate interval [{control}, {second_control}] and shrinks it safely."
                ),
            )

        if variant == "matrix_search":
            return InvariantText(
                property_statement=(
                    f"At the start of each outer iteration, all cells in {collection} before row {control} have already been examined, and the current row is scanned column by column without skipping."
                ),
                initialization=(
                    "Initialization: before processing the first row, no previous row exists, so the property holds trivially."
                ),
                maintenance=(
                    f"Maintenance: row {control} is scanned across its columns; when the algorithm moves to the next row, all prior rows remain fully válidated."
                ),
                finalization=(
                    f"Finalization: after row-wise scanning completes, membership of {target} in matrix {collection} is decided correctly."
                ),
                didactic_summary=(
                    "Matrix search correctness follows from preserving which rows have been fully inspected."
                ),
            )

        if variant == "matrix_row_search":
            return InvariantText(
                property_statement=(
                    f"At the start of each inner-scan iteration, within fixed row {matrix_row}, all columns before {control} have already been checked and do not contain {target}."
                ),
                initialization=(
                    f"Initialization: in row {matrix_row}, before the first column is inspected, no prior column has been checked and the statement holds trivially."
                ),
                maintenance=(
                    f"Maintenance: cell {collection}[{matrix_row}][{control}] is inspected; if it differs from {target}, absence extends to the next column, and if it matches, a correct output is produced."
                ),
                finalization=(
                    f"Finalization: once the inner scan over row {matrix_row} ends, membership of {target} in that row is decided correctly."
                ),
                didactic_summary=(
                    "Inner matrix scanning is stated with fixed-row semantics, avoiding a flat-array linearization shortcut."
                ),
            )

        if variant == "linear_search_flag":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, {flag_var} correctly states whether {target} appears in {prev_segment}."
                ),
                initialization=(
                    f"Initialization: {flag_var} starts as false and the scanned segment {prev_segment} is empty."
                ),
                maintenance=(
                    f"Maintenance: {current_cell} is inspected; if {current_cell} == {target}, then {flag_var} becomes true, otherwise it keeps its correct value."
                ),
                finalization=(
                    f"Finalization: at termination, {flag_var} correctly summarizes whether {target} appears in {full_segment}."
                ),
                didactic_summary=(
                    f"Variable {flag_var} stores an exact search summary for the already scanned prefix."
                ),
            )

        if variant == "linear_search_flag_repeat":
            return InvariantText(
                property_statement=(
                    f"In REPEAT, at the start of each new iteration, {flag_var} correctly states whether {target} appears in {prev_segment}; the first pass executes before the first UNTIL check."
                ),
                initialization=(
                    f"Initialization: before entering REPEAT, {flag_var} is false and scanned prefix {prev_segment} is empty."
                ),
                maintenance=(
                    f"Maintenance: {current_cell} is inspected; if it matches {target}, {flag_var} is updated, otherwise it remains coherent for the next stop-condition evaluation."
                ),
                finalization=(
                    f"Finalization: when UNTIL stops the loop, {flag_var} correctly summarizes whether {target} appears in {full_segment}."
                ),
                didactic_summary=(
                    "REPEAT executes once before any stop-condition check, while preserving the same prefix-search semantics."
                ),
            )

        if variant == "linear_search_predicate":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, no element in {prev_segment} satisfies the selection predicate over {current_cell}."
                ),
                initialization=(
                    f"Initialization: before the first iteration, {prev_segment} is empty, so no element satisfies the predicate."
                ),
                maintenance=(
                    f"Maintenance: {current_cell} is tested; if it fails the predicate, the property extends to {collection}[1..{control}], and if it passes, a correct output state is established."
                ),
                finalization=(
                    f"Finalization: after the scan, it is correctly determined whether any position in {full_segment} satisfies the predicate."
                ),
                didactic_summary=(
                    "Predicate-based search preserves that the already scanned prefix contains no valid candidate."
                ),
            )

        if variant == "linear_search_predicate_repeat":
            return InvariantText(
                property_statement=(
                    f"In REPEAT, at the start of each new iteration, no element in {prev_segment} satisfies the selection predicate over {current_cell}; the first pass runs before UNTIL is evaluated."
                ),
                initialization=(
                    f"Initialization: before REPEAT starts, {prev_segment} is empty and no candidate satisfies the predicate."
                ),
                maintenance=(
                    f"Maintenance: {current_cell} is tested; if it fails, the property extends to the new prefix, and if it passes, a correct output state is established."
                ),
                finalization=(
                    f"Finalization: after REPEAT ends, it is correctly decided whether any position in {full_segment} satisfies the predicate."
                ),
                didactic_summary=(
                    "This REPEAT variant makes explicit that the body executes once before the first stop-condition check."
                ),
            )

        if variant == "linear_search_repeat":
            return InvariantText(
                property_statement=(
                    f"In REPEAT, right before each UNTIL evaluation (after one body execution), {target} is absent from {prev_segment}, or its discovery has already been recorded consistently."
                ),
                initialization=(
                    f"Initialization: before the first pass, {prev_segment} is empty; after that pass, the invariant is established for the first UNTIL evaluation."
                ),
                maintenance=(
                    f"Maintenance: each pass inspects {current_cell} and then updates control; by the time UNTIL is re-evaluated, the scanned-prefix statement is valid again."
                ),
                finalization=(
                    f"Finalization: when UNTIL stops the loop, the membership decisión for {target} over {full_segment} matches everything that was effectively inspected."
                ),
                didactic_summary=(
                    "For REPEAT, the invariant is interpreted at the post-body / pre-check point: execute first, then check stop condition."
                ),
            )

        return InvariantText(
            property_statement=(
                f"At the start of each iteration, {target} does not appear in {prev_segment}, or its discovery has already been recorded consistently."
            ),
            initialization=(
                f"Initialization: before the first step, {prev_segment} is empty and the statement is true."
            ),
            maintenance=(
                f"Maintenance: {current_cell} is checked; if {current_cell} != {target}, absence extends to {collection}[1..{control}], and if equality holds, the result state is updated."
            ),
            finalization=(
                f"Finalization: after the scan, membership of {target} in {full_segment} is decided correctly."
            ),
            didactic_summary=(
                f"Linear search keeps a precise frontier and a state consistent with everything seen up to {control}-1."
            ),
        )

    if pattern == "filter_progress":
        return InvariantText(
            property_statement=(
                f"At the start of each iteration, {destination_collection}[1..{accumulator}-1] contains exactly the valid elements detected in {source_collection}[1..{control}-1]."
            ),
            initialization=(
                f"Initialization: before processing any element, output prefix {destination_collection}[1..{accumulator}-1] is empty and matches zero valid detections."
            ),
            maintenance=(
                f"Maintenance: {source_cell} is tested; when valid, it is written to {destination_collection}[{accumulator}] and frontier {accumulator} advances, preserving exact input/output correspondence."
            ),
            finalization=(
                f"Finalization: at loop end, {destination_collection}[1..{accumulator}-1] contains all and only elements from {source_collection}[1..{bound}] that satisfy the predicate."
            ),
            didactic_summary=(
                "Compaction stays correct by preserving an exact mapping between scanned input prefix and built output prefix."
            ),
        )

    if pattern == "accumulation":
        if variant == "multi_accumulator_ambiguous":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, multiple active accumulators ({state_vars}) evolve consistently, and local evidence is insufficient to select a unique primary postcondition accumulator."
                ),
                initialization=(
                    "Initialization: accumulator variables start from valid neutral/base states for their respective aggregates."
                ),
                maintenance=(
                    f"Maintenance: each step updates more than one accumulator coherently as {control} advances, preserving multiple plausible aggregate interpretations."
                ),
                finalization=(
                    f"Finalization: when the loop ends, accumulators correctly summarize information over iterated range 1..{bound}, but selecting one primary semantic target requires extra context."
                ),
                didactic_summary=(
                    "With competing accumulators, the engine remains conservative instead of forcing a single semantic interpretation."
                ),
            )

        if variant == "sum_array_repeat":
            return InvariantText(
                property_statement=(
                    f"In REPEAT, right before UNTIL is evaluated, {accumulator} represents the correct sum of the already processed prefix {prev_segment}."
                ),
                initialization=(
                    f"Initialization: before entering REPEAT, {accumulator} starts at additive identity; after the first pass, the invariant is established for the first UNTIL evaluation."
                ),
                maintenance=(
                    f"Maintenance: each pass adds {current_cell} and updates control; at the end of the pass, partial sum and processed prefix are consistent again before UNTIL is checked."
                ),
                finalization=(
                    f"Finalization: when UNTIL becomes true, {accumulator} is exactly the accumulation over {full_segment}."
                ),
                didactic_summary=(
                    "This REPEAT template makes the semantic checkpoint explicit: valid partial state after body execution and before stop-condition evaluation."
                ),
            )

        if variant == "factorial_product":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, {accumulator} stores the factorial of the last value already incorporated by the loop."
                ),
                initialization=(
                    f"Initialization: {accumulator} = 1, the factorial base value (0! or 1!, depending on the variant)."
                ),
                maintenance=(
                    f"Maintenance: each step multiplies {accumulator} by the next valid integer, preserving the factorial-prefix meaning."
                ),
                finalization=(
                    f"Finalization: once the range is completed, {accumulator} equals the target factorial."
                ),
                didactic_summary=(
                    f"Variable {accumulator} keeps the exact factorial product at each iteration frontier."
                ),
            )

        if variant == "power_iterative":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, {accumulator} represents the accumulated power after the multiplications already performed."
                ),
                initialization=(
                    f"Initialization: {accumulator} = 1, corresponding to exponent 0."
                ),
                maintenance=(
                    f"Maintenance: each step multiplies {accumulator} by the base, so the represented exponent increases by one."
                ),
                finalization=(
                    f"Finalization: after the required number of iterations, {accumulator} is the expected final power."
                ),
                didactic_summary=(
                    f"Power is built iteratively while {accumulator} keeps an exact prefix interpretation."
                ),
            )

        if variant == "product_array":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, {accumulator} equals the product of elements in {prev_segment}."
                ),
                initialization=(
                    f"Initialization: {accumulator} = 1, the multiplicative identity for an empty segment."
                ),
                maintenance=(
                    f"Maintenance: {accumulator} <- {accumulator} * {current_cell}; after the step, {accumulator} represents the product on {collection}[1..{control}]."
                ),
                finalization=(
                    f"Finalization: when the loop ends, {accumulator} is the product of {full_segment}."
                ),
                didactic_summary=(
                    f"Multiplicative accumulation keeps an exact prefix interpretation in {accumulator}."
                ),
            )

        if variant == "product_scalar":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, {accumulator} stores the correct product of values already incorporated by the loop."
                ),
                initialization=(
                    f"Initialization: {accumulator} = 1, the multiplicative identity when no contribution has been processed yet."
                ),
                maintenance=(
                    f"Maintenance: each step multiplies {accumulator} by the next value in the range, preserving the correct partial product."
                ),
                finalization=(
                    f"Finalization: when the loop ends, {accumulator} matches the final product over all processed values."
                ),
                didactic_summary=(
                    f"Variable {accumulator} keeps an exact multiplicative prefix, without relying on array access."
                ),
            )

        if variant == "prefix_sum":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, {accumulator} stores the correct partial sum needed to build the next prefix indexed by {control}."
                ),
                initialization=(
                    f"Initialization: {accumulator} starts from the base prefix value."
                ),
                maintenance=(
                    f"Maintenance: each step uses the previous value of {accumulator} and adds {current_cell}, extending correctness by one index."
                ),
                finalization=(
                    f"Finalization: once the loop ends, computed prefixes cover all of {full_segment}."
                ),
                didactic_summary=(
                    f"The loop keeps a prefix recurrence where {accumulator} carries the exact value needed by the next index."
                ),
            )

        if variant == "sum_scalar":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, {accumulator} stores the correct sum of values already incorporated by the loop."
                ),
                initialization=(
                    f"Initialization: {accumulator} is set to the additive identity to represent zero processed contributions."
                ),
                maintenance=(
                    f"Maintenance: each iteration adds the current step contribution into {accumulator}, preserving a correct partial sum."
                ),
                finalization=(
                    f"Finalization: at loop termination, {accumulator} represents the total sum over the processed range."
                ),
                didactic_summary=(
                    f"Variable {accumulator} accumulates a stable additive prefix at every iteration boundary."
                ),
            )

        return InvariantText(
            property_statement=(
                f"At the start of each iteration, {accumulator} stores the correct accumulation over {prev_segment}."
            ),
            initialization=(
                f"Initialization: {accumulator} is set to a valid neutral value for accumulation on an empty segment."
            ),
            maintenance=(
                f"Maintenance: the current step incorporates {current_cell} into {accumulator}, extending the property to {collection}[1..{control}]."
            ),
            finalization=(
                f"Finalization: at loop termination, {accumulator} summarizes accumulation over {full_segment}."
            ),
            didactic_summary=(
                f"Variable {accumulator} preserves a prefix-accumulation semantics throughout the loop."
            ),
        )

    if pattern == "counting":
        return InvariantText(
            property_statement=(
                f"At the start of each iteration, {accumulator} counts how many elements in {prev_segment} satisfy the condition."
            ),
            initialization=(
                f"Initialization: {accumulator} = 0 and no element has been inspected in {prev_segment}."
            ),
            maintenance=(
                f"Maintenance: {current_cell} is tested; if it satisfies the condition, {accumulator} increases by 1, otherwise it remains unchanged."
            ),
            finalization=(
                f"Finalization: after termination, {accumulator} is the total number of valid elements in {full_segment}."
            ),
            didactic_summary=(
                f"Counter {accumulator} always matches the cardinality of valid elements in the inspected prefix."
            ),
        )

    if pattern == "field_assignment_progress":
        if variant == "object_array_field_uniform_assignment":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, in the object array, already-written fields on the scanned prefix follow a uniform update policy (for example {field_cell})."
                ),
                initialization=(
                    "Initialization: before the first element, no field has been written in the prefix, so the uniform policy holds vacuously."
                ),
                maintenance=(
                    f"Maintenance: each step assigns the indexed element field ({field_cell}) using a stable policy, preserving uniformity over processed elements."
                ),
                finalization=(
                    "Finalization: once traversal ends, uniform field updates are guaranteed across the processed segment."
                ),
                didactic_summary=(
                    "This variant captures uniform object-array field writes even when no predicate-filter signal is present."
                ),
            )
        if variant == "object_field_uniform_assignment":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, relevant object-field state ({field_cell}) follows a uniform assignment policy consistent with loop progress."
                ),
                initialization=(
                    "Initialization: field state starts from a valid base configuration aligned with the update policy."
                ),
                maintenance=(
                    "Maintenance: each step rewrites the field consistently, preserving the same uniform policy on partial state."
                ),
                finalization=(
                    "Finalization: at loop end, field state is consistent with the uniform policy applied across iterations."
                ),
                didactic_summary=(
                    "This variant captures object-field uniform progress when evidence is insufficient for a narrower semantic subfamily."
                ),
            )
        return InvariantText(
            property_statement=(
                f"At the start of each iteration, output object fields on the scanned prefix follow the predicate-driven assignment rule (for example {field_cell} under the local condition)."
            ),
            initialization=(
                "Initialization: before the first element, no field in the current prefix has been assigned, so the rule holds vacuously."
            ),
            maintenance=(
                f"Maintenance: each step evaluates the predicate and assigns the current element field ({field_cell}) accordingly, preserving uniformity over processed elements."
            ),
            finalization=(
                "Finalization: once traversal ends, every relevant element satisfies the field-assignment policy induced by the predicate."
            ),
            didactic_summary=(
                "This family captures uniform predicate-controlled object-field writes without forcing an extrema/counting interpretation."
            ),
        )

    if pattern == "extrema":
        extrema_name = _extrema_name_en(variant, accumulator)

        if variant == "extrema_with_index":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, {accumulator} and its tracked index describe the correct {extrema_name} inside {extrema_prev_segment}."
                ),
                initialization=(
                    f"Initialization: a base value from {collection} and its position are taken as a valid initial {extrema_name} candidate."
                ),
                maintenance=(
                    f"Maintenance: {field_cell} is compared with {accumulator}; if it improves the {extrema_name}, both value and index are updated, otherwise both stay valid."
                ),
                finalization=(
                    f"Finalization: at completion, {accumulator} and its position represent the {extrema_name} of {extrema_full_segment}."
                ),
                didactic_summary=(
                    f"The loop keeps both the best value ({accumulator}) and where it occurs in the inspected segment."
                ),
            )

        return InvariantText(
            property_statement=(
                f"At the start of each iteration, {accumulator} stores the {extrema_name} of {extrema_prev_segment}."
            ),
            initialization=(
                f"Initialization: {accumulator} is initialized with a base element of {collection}, valid for the first inspected segment."
            ),
            maintenance=(
                f"Maintenance: {field_cell} is compared with {accumulator}; if it improves the {extrema_name}, {accumulator} is updated, otherwise it stays correct."
            ),
            finalization=(
                f"Finalization: at loop end, {accumulator} is the global {extrema_name} on {extrema_full_segment}."
            ),
            didactic_summary=(
                f"Correctness follows from preserving in {accumulator} the best candidate over the inspected prefix."
            ),
        )

    if pattern == "prefix_progress":
        if variant == "array_copy":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, positions in {destination_collection}[1..{control}-1] are equal to the corresponding positions in {source_collection}[1..{control}-1]."
                ),
                initialization=(
                    f"Initialization: before the first step, segment {destination_collection}[1..{control}-1] is empty, so equality holds."
                ),
                maintenance=(
                    f"Maintenance: index {control} is copied (e.g., {destination_collection}[{control}] <- {source_collection}[{control}]); then equality extends by one position."
                ),
                finalization=(
                    f"Finalization: after the scan, {destination_collection}[1..{bound}] is a correct copy of {source_collection}[1..{bound}]."
                ),
                didactic_summary=(
                    f"Copy correctness is maintained by prefix equality under index {control}."
                ),
            )

        if variant == "filter_compaction":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, {destination_collection}[1..{accumulator}-1] contains exactly the valid elements already found in {source_collection}[1..{control}-1]."
                ),
                initialization=(
                    f"Initialization: output prefix {destination_collection}[1..{accumulator}-1] starts empty and no element has been inspected in {source_collection}[1..{control}-1], so correspondence is exact."
                ),
                maintenance=(
                    f"Maintenance: {source_cell} is tested; if valid it is appended into {destination_collection}[{accumulator}] and frontier {accumulator} advances, otherwise skipped, preserving exact correspondence."
                ),
                finalization=(
                    f"Finalization: at the end, {destination_collection}[1..{accumulator}-1] contains all and only elements of {source_collection}[1..{bound}] that satisfy the condition."
                ),
                didactic_summary=(
                    f"Compaction keeps an exact mapping between scanned prefix of {source_collection} and built output in {destination_collection}."
                ),
            )

        if variant == "prefix_sum_build":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, prefix entries in {destination_collection}[1..{control}-1] are already correct."
                ),
                initialization=(
                    f"Initialization: the base case for the first prefix entry in {destination_collection} is correctly set."
                ),
                maintenance=(
                    f"Maintenance: {destination_collection}[{control}] is computed from the previous prefix and {source_collection}[{control}], extending correctness by one index."
                ),
                finalization=(
                    f"Finalization: when the loop ends, every prefix in {destination_collection}[1..{bound}] is correct."
                ),
                didactic_summary=(
                    f"Each prefix value depends on the previous one, so correctness propagates index by index."
                ),
            )

        return InvariantText(
            property_statement=(
                f"At the start of each iteration, the output built up to index {control}-1 is correct."
            ),
            initialization=(
                "Initialization: partial structure starts empty or at a valid base state."
            ),
            maintenance=(
                f"Maintenance: current step computes contribution for index {control} and preserves correctness of the built prefix."
            ),
            finalization=(
                "Finalization: once the loop completes, output structure is built correctly for the full required range."
            ),
            didactic_summary=(
                "Progressive construction preserves correctness by extending an already valid prefix."
            ),
        )

    if pattern == "two_pointer_like":
        if variant == "reverse_two_pointer":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, elements outside segment [{control}, {second_control}] are already in their final position with respect to reversal."
                ),
                initialization=(
                    f"Initialization: before the first swap, no position outside [{control}, {second_control}] violates the property."
                ),
                maintenance=(
                    f"Maintenance: boundary elements are swapped ({collection}[{control}] and {collection}[{second_control}]), then {control} increases and {second_control} decreases, expanding the solved region."
                ),
                finalization=(
                    f"Finalization: when {control} >= {second_control}, the full array is reversed correctly."
                ),
                didactic_summary=(
                    f"Two moving boundaries ({control}, {second_control}) isolate a pending middle segment that shrinks each step."
                ),
            )

        return InvariantText(
            property_statement=(
                f"At the start of each iteration, segment [{control}, {second_control}] is the only pending region; outside it, the objective condition already holds."
            ),
            initialization=(
                f"Initialization: boundaries {control} and {second_control} start on the full pending interval."
            ),
            maintenance=(
                f"Maintenance: each step updates {control} and/or {second_control} monotonically, shrinking the pending region without breaking solved parts."
            ),
            finalization=(
                "Finalization: when boundaries cross, no pending region remains and the global condition is satisfied."
            ),
            didactic_summary=(
                "The two-pointer method keeps an explicit, shrinking work interval."
            ),
        )

    if pattern == "sorting_pass":
        if variant == "bubble_outer_pass":
            return InvariantText(
                property_statement=(
                    f"At the start of each outer iteration, the last {control}-1 elements of {collection} are already fixed in final position and form a sorted suffix."
                ),
                initialization=(
                    "Initialization: before the first outer pass, no tail element is fixed yet, so the sorted suffix is empty."
                ),
                maintenance=(
                    "Maintenance: the inner pass performs adjacent compare-and-swap steps, pushing the maximum of the pending prefix to its final boundary position."
                ),
                finalization=(
                    f"Finalization: after outer iterations complete, the full segment {collection}[1..{bound}] is sorted."
                ),
                didactic_summary=(
                    "The outer Bubble Sort invariant grows a sorted suffix after each complete pass."
                ),
            )

        return InvariantText(
            property_statement=(
                f"At the start of each inner iteration, inside subarray {collection}[1..{control}], the largest element among compared items is already at the end of that subarray."
            ),
            initialization=(
                "Initialization: before the first comparison, the visited subarray is minimal and the property holds directly."
            ),
            maintenance=(
                f"Maintenance: each step compares {collection}[{control}] with {collection}[{control} + 1]; if they are out of order, they are swapped, so the larger value moves one position to the right."
            ),
            finalization=(
                "Finalization: when this sorting iteration ends, the largest element of the unsorted subarray is placed in its final position."
            ),
            didactic_summary=(
                "The inner Bubble Sort pass preserves that the local maximum drifts to the right boundary of the current scanned prefix."
            ),
        )

    if pattern == "state_refinement":
        if variant == "repeat_until_refinement":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, state variables ({state_vars}) are consistent with all updates performed before rechecking the stop condition."
                ),
                initialization=(
                    "Initialization: initial state satisfies the preconditions of the first REPEAT cycle."
                ),
                maintenance=(
                    "Maintenance: each step updates state consistently and leaves variables ready for a new UNTIL evaluation."
                ),
                finalization=(
                    "Finalization: once UNTIL holds, final state matches the algorithm's exit condition."
                ),
                didactic_summary=(
                    "In REPEAT-UNTIL loops, correctness is preserved by state refinement before each stop-condition check."
                ),
            )

        if variant == "interval_refinement":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, boundary state [{control}, {second_control}] defines a valid working interval."
                ),
                initialization=(
                    "Initialization: boundaries start on the full problem interval."
                ),
                maintenance=(
                    f"Maintenance: each update of {control} or {second_control} removes only invalid regions, preserving interval validity."
                ),
                finalization=(
                    "Finalization: when interval validity is lost, the algorithm terminates with a decisión consistent with its stop criterion."
                ),
                didactic_summary=(
                    "The loop refines a candidate interval until a verifiable terminal condition is reached."
                ),
            )

        if variant == "object_field_refinement":
            return InvariantText(
                property_statement=(
                    f"At the start of each iteration, object-field state (for example {state_vars}) stays coherent with control progress and encodes a monotonic refinement step."
                ),
                initialization=(
                    "Initialization: object field and control variable start in a configuration consistent with the loop precondition."
                ),
                maintenance=(
                    "Maintenance: each iteration updates the object field in sync with loop control, preserving coherence between internal state, guard, and progress."
                ),
                finalization=(
                    "Finalization: once stop condition holds, the object field is left in a valid state aligned with total loop progress."
                ),
                didactic_summary=(
                    "This object/field subtemplate emphasizes control progress + field mutation as the local correctness axis."
                ),
            )

        return InvariantText(
            property_statement=(
                f"At the start of each iteration, state variables ({state_vars}) describe a valid intermediate state for the loop objective."
            ),
            initialization=(
                "Initialization: variables begin in a state that satisfies iterative-process assumptions."
            ),
            maintenance=(
                "Maintenance: each iteration applies a transformation that preserves state validity for the next check."
            ),
            finalization=(
                "Finalization: once stop condition holds, accumulated state satisfies the expected postcondition."
            ),
            didactic_summary=(
                "Correctness depends on preserving coherent internal state while stop condition remains false."
            ),
        )

    if variant == "unknown_object_array_field":
        return InvariantText(
            property_statement=(
                f"At the start of each iteration, object-array field writes (for example {state_vars}) follow a uniform per-index update over the scanned prefix."
            ),
            initialization=(
                "Initialization: before the first step, no indexed field update has been applied, so the uniform-update statement holds."
            ),
            maintenance=(
                "Maintenance: each iteration updates the field of the element selected by control, preserving local consistency over the processed segment."
            ),
            finalization=(
                "Finalization: when traversal ends, uniform field writing is guaranteed over the processed segment, although high-level intent remains ambiguous."
            ),
            didactic_summary=(
                "The engine recognizes an informative object-array uniform-update subfamily while preserving conservative classification without extra context."
            ),
        )

    if variant == "unknown_object_field":
        return InvariantText(
            property_statement=(
                f"At the start of each iteration, object-field state in ({state_vars}) evolves coherently with control progress, but local evidence is insufficient to specialize a stricter semantic family."
            ),
            initialization=(
                "Initialization: object field state starts from a valid base configuration."
            ),
            maintenance=(
                "Maintenance: each iteration rewrites object-field state consistently, preserving local correctness."
            ),
            finalization=(
                "Finalization: on exit, object-field state is consistent with the sequence of applied updates."
            ),
            didactic_summary=(
                "Object-field evolution is detected, but conservative classification is preserved without stronger evidence."
            ),
        )

    return InvariantText(
        property_statement=(
            "At the start of each iteration, local evidence is not strong enough to assert a specific formal invariant without over-interpreting intent."
        ),
        initialization=(
            "Initialization: a conservative formulation is kept because the AST does not provide enough structure for a more specific property."
        ),
        maintenance=(
            "Maintenance: analysis avoids unsupported inferences and keeps a conservative statement through the loop."
        ),
        finalization=(
            "Finalization: output remains low confidence to avoid claiming an invariant that is not locally justified."
        ),
        didactic_summary=(
            "A loop exists, but local signals are not robust enough to specialize a safer template."
        ),
    )
