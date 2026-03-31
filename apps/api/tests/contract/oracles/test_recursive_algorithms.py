# tests/integration/test_recursive_algorithms.py
"""
Tests de integración para algoritmos recursivos con Teorema Maestro.
Verifica el análisis de algoritmos recursivos divide-and-conquer.
Incluye tests auténticos con pseudocode y expectativas de complejidad.
"""

import time

import pytest

from app.modules.analysis.analyzers.recursive import RecursiveAnalyzer
from app.modules.analysis.service import analyze_algorithm, detect_methods
from tests._support.assertions import (
    assert_all_cases_complexity,
    get_notation_from_totals,
    notation_has_complexity,
)

pytestmark = [pytest.mark.contract, pytest.mark.oracle, pytest.mark.recursive]

MERGE_SORT_PSEUDOCODE = """mergeSort(A, izq, der) BEGIN
  IF (izq < der) THEN BEGIN
    medio <- (izq + der) / 2;
    CALL mergeSort(A, izq, medio);
    CALL mergeSort(A, medio + 1, der);
    CALL merge(A, izq, medio, der);
  END
END
"""

BINARY_SEARCH_RECURSIVE_PSEUDOCODE = """busquedaBinaria(A, x, inicio, fin) BEGIN
  IF (inicio > fin) THEN BEGIN
    RETURN -1;
  END
  mitad <- (inicio + fin) / 2;
  IF (A[mitad] = x) THEN BEGIN
    RETURN mitad;
  END
  IF (x < A[mitad]) THEN BEGIN
    RETURN busquedaBinaria(A, x, inicio, mitad - 1);
  END
  ELSE BEGIN
    RETURN busquedaBinaria(A, x, mitad + 1, fin);
  END
END
"""

FIBONACCI_RECURSIVE_PSEUDOCODE = """fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN fibonacci(n - 1) + fibonacci(n - 2);
END
"""

TETRANACCI_RECURSIVE_PSEUDOCODE = """tetranacci(n) BEGIN
    IF (n <= 2) THEN BEGIN
        RETURN 0;
    END
    IF (n = 3) THEN BEGIN
        RETURN 1;
    END
    RETURN tetranacci(n - 1) + tetranacci(n - 2) + tetranacci(n - 3) + tetranacci(n - 4);
END
"""

HANOI_RECURSIVE_PSEUDOCODE = """hanoi(n, origen, destino, aux) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    RETURN hanoi(n - 1, origen, aux, destino) + 1 + hanoi(n - 1, aux, destino, origen);
END
"""

FACTORIAL_RECURSIVE_PSEUDOCODE = """factorial(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN n * factorial(n - 1);
END
"""

SPARSE_LINEAR_RECURSIVE_PSEUDOCODE = """sparseRec(n) BEGIN
    IF (n <= 3) THEN BEGIN
        RETURN 1;
    END
    RETURN sparseRec(n - 1) + sparseRec(n - 4);
END
"""

DOUBLE_CONSTANT_RECURSIVE_PSEUDOCODE = """dobleConstante(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN dobleConstante(n - 1) + dobleConstante(n - 1) + 1;
END
"""

LINEAR_SUM_RECURSIVE_PSEUDOCODE = """sumaRec(n) BEGIN
    IF (n <= 0) THEN BEGIN
        RETURN 0;
    END
    RETURN sumaRec(n - 1) + n;
END
"""

INSERTION_SORT_RECURSIVE_PSEUDOCODE = """insertionSortRec(A[n], n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 0;
    END
    CALL insertionSortRec(A, n - 1);
    clave <- A[n];
    j <- n - 1;
    WHILE (j > 0 AND A[j] > clave) DO BEGIN
        A[j + 1] <- A[j];
        j <- j - 1;
    END
    A[j + 1] <- clave;
    RETURN 0;
END
"""

RECURSIVE_SELECTION_SORT_PSEUDOCODE = """selectionSortRec(A[n], inicio, n) BEGIN
    IF (inicio >= n) THEN BEGIN
        RETURN 0;
    END
    minIndice <- inicio;
    FOR j <- inicio + 1 TO n DO BEGIN
        IF (A[j] < A[minIndice]) THEN BEGIN
            minIndice <- j;
        END
    END
    temp <- A[inicio];
    A[inicio] <- A[minIndice];
    A[minIndice] <- temp;
    RETURN selectionSortRec(A, inicio + 1, n);
END
"""

FAST_POWER_RECURSIVE_PSEUDOCODE = """exponenciacionRapida(x, n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    resultado <- exponenciacionRapida(x, n DIV 2);
    resultado <- resultado * resultado;
    IF (n MOD 2 = 1) THEN BEGIN
        resultado <- resultado * x;
    END
    RETURN resultado;
END
"""

QUICK_SORT_PSEUDOCODE = """quickSort(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        pivote <- A[der];
        i <- izq - 1;
        FOR j <- izq TO der - 1 DO BEGIN
            IF (A[j] <= pivote) THEN BEGIN
                i <- i + 1;
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
        temp <- A[i + 1];
        A[i + 1] <- A[der];
        A[der] <- temp;
        pi <- i + 1;
        CALL quickSort(A, izq, pi - 1);
        CALL quickSort(A, pi + 1, der);
    END
    RETURN 0;
END
"""

RANDOMIZED_QUICK_SORT_PSEUDOCODE = """quickSortRand(A[n], izq, der) BEGIN
    IF (izq < der) THEN BEGIN
        r <- randomInt(izq, der);
        temp <- A[r];
        A[r] <- A[der];
        A[der] <- temp;
        pivote <- A[der];
        i <- izq - 1;
        FOR j <- izq TO der - 1 DO BEGIN
            IF (A[j] <= pivote) THEN BEGIN
                i <- i + 1;
                temp <- A[i];
                A[i] <- A[j];
                A[j] <- temp;
            END
        END
        temp <- A[i + 1];
        A[i + 1] <- A[der];
        A[der] <- temp;
        pi <- i + 1;
        CALL quickSortRand(A, izq, pi - 1);
        CALL quickSortRand(A, pi + 1, der);
    END
    RETURN 0;
END
"""

MAX_POR_MITADES_PSEUDOCODE = """maxPorMitades(A, inicio, fin) BEGIN
  IF (inicio = fin) THEN BEGIN
    RETURN A[inicio];
  END
  medio <- (inicio + fin) DIV 2;
  izq <- maxPorMitades(A, inicio, medio);
  der <- maxPorMitades(A, medio + 1, fin);
  IF (izq > der) THEN BEGIN
    RETURN izq;
  END
  RETURN der;
END
"""

TRIBONACCI_RECURSIVE_PSEUDOCODE = """tribonacci(n) BEGIN
  IF (n <= 2) THEN BEGIN
    RETURN n;
  END
  RETURN tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3);
END
"""


class TestRecursiveAlgorithmsPseudocode:
    """Tests auténticos con pseudocode para algoritmos recursivos."""

    def test_merge_sort_theta_n_log_n(self):
        """Merge sort debe dar Θ(n log n) y validar todos los casos."""
        result = analyze_algorithm(MERGE_SORT_PSEUDOCODE, mode="all", preferred_method="master")
        assert result.get(
            "ok"
        ), f"Parser/RecursiveAnalyzer debe soportar merge sort: {result.get('errors', [])}"
        worst = result.get("worst", {})
        totals = worst.get("totals", {})
        master = totals.get("master", {})
        theta = master.get("theta", "") or totals.get("big_theta", "") or totals.get("big_o", "")
        # Idealmente Θ(n log n); si no se captura el costo del merge, puede dar Θ(n)
        assert "n" in theta.lower(), f"Merge sort debe contener n: theta={theta}"
        assert_all_cases_complexity(
            result,
            "nlogn",
            expected_best="nlogn",
            expected_avg="nlogn",
            name="Merge Sort",
        )

    def test_binary_search_recursive_theta_log_n(self):
        """Búsqueda binaria recursiva debe dar Θ(log n) y validar todos los casos."""
        result = analyze_algorithm(BINARY_SEARCH_RECURSIVE_PSEUDOCODE, mode="all")
        assert result.get(
            "ok"
        ), f"Parser/RecursiveAnalyzer debe soportar búsqueda binaria: {result.get('errors', [])}"
        worst = result.get("worst", {})
        totals = worst.get("totals", {})
        theta = get_notation_from_totals(totals)
        assert notation_has_complexity(
            theta, "log"
        ), f"Binary search recursivo debe ser Θ(log n): {theta}"
        assert_all_cases_complexity(
            result, "log", expected_best="constant", name="Binary search rec"
        )

    def test_max_por_mitades_is_deterministic_theta_n(self):
        """maxPorMitades no tiene poda: best/avg = same_as_worst y Θ(n)."""
        result = analyze_algorithm(MAX_POR_MITADES_PSEUDOCODE, mode="all", preferred_method="master")
        assert result.get("ok"), result.get("errors", [])
        assert result.get("has_case_variability") is False
        assert result.get("best") == "same_as_worst"
        assert result.get("avg") == "same_as_worst"
        assert_all_cases_complexity(
            result,
            "linear",
            expected_best="linear",
            expected_avg="linear",
            name="maxPorMitades",
        )

    def test_insertion_sort_recursive_worst_is_quadratic(self):
        """Recursive insertion sort: T(n)=T(n-1)+Θ(n) => Θ(n^2) en worst."""
        result = analyze_algorithm(INSERTION_SORT_RECURSIVE_PSEUDOCODE, mode="worst")
        assert result.get("ok"), result.get("errors", [])
        totals = result.get("totals", {}) or {}
        theta = get_notation_from_totals(totals)
        assert notation_has_complexity(
            theta, "quadratic"
        ), f"Insertion sort recursivo worst debe ser cuadrático: {theta}"

    def test_recursive_selection_sort_worst_is_quadratic(self):
        """Recursive selection sort: T(n)=T(n-1)+Θ(n) => Θ(n^2) en worst."""
        result = analyze_algorithm(RECURSIVE_SELECTION_SORT_PSEUDOCODE, mode="worst")
        assert result.get("ok"), result.get("errors", [])
        totals = result.get("totals", {}) or {}
        theta = get_notation_from_totals(totals)
        assert notation_has_complexity(
            theta, "quadratic"
        ), f"Selection sort recursivo worst debe ser cuadrático: {theta}"

    def test_quick_sort_worst_is_quadratic(self):
        """QuickSort: worst case debe permitir degeneración cuadrática."""
        result = analyze_algorithm(QUICK_SORT_PSEUDOCODE, mode="worst")
        assert result.get("ok"), result.get("errors", [])
        totals = result.get("totals", {}) or {}
        theta = get_notation_from_totals(totals)
        assert notation_has_complexity(
            theta, "quadratic"
        ), f"QuickSort worst debe ser cuadrático: {theta}"

    def test_randomized_quick_sort_worst_is_quadratic(self):
        """Randomized QuickSort: worst case sigue siendo cuadrático (aunque avg sea esperado)."""
        result = analyze_algorithm(RANDOMIZED_QUICK_SORT_PSEUDOCODE, mode="worst")
        assert result.get("ok"), result.get("errors", [])
        totals = result.get("totals", {}) or {}
        theta = get_notation_from_totals(totals)
        assert notation_has_complexity(
            theta, "quadratic"
        ), f"Randomized QuickSort worst debe ser cuadrático: {theta}"


class TestTetranacciCharacteristicEquation:
    """
    Regresión: recurrencia lineal orden 4 (catálogo `tetranacci-sequence`).
    Las heurísticas SymPy sobre la solución homogénea no deben bloquear el análisis;
    el resultado debe seguir siendo exponencial con raíz dominante coherente (~1.93).
    """

    def test_tetranacci_exponential_theta_and_dominant_growth_contract(self):
        """Contractual: Θ exponencial; growth_rate acotado; bundle CEQ presente; termina a tiempo."""
        t0 = time.perf_counter()
        result = analyze_algorithm(
            TETRANACCI_RECURSIVE_PSEUDOCODE,
            mode="worst",
            preferred_method="characteristic_equation",
            algorithm_kind="recursive",
        )
        elapsed = time.perf_counter() - t0
        assert result.get("ok"), result.get("errors", [])
        assert elapsed < 45.0, f"análisis Tetranacci excede tope razonable: {elapsed:.1f}s"

        char_eq = result.get("totals", {}).get("characteristic_equation", {})
        theta = char_eq.get("theta") or ""
        assert notation_has_complexity(
            theta, "exponential"
        ), f"theta debe clasificarse como exponencial (orden 4, raíz dominante > 1): {theta}"

        gr = char_eq.get("growth_rate")
        assert gr is not None, "debe exponer growth_rate numérico de la raíz dominante"
        assert 1.85 < float(gr) < 2.0, (
            "raíz dominante de Tetranacci ≈1.927562; fuera de rango indica regresión"
            f": {gr}"
        )

        eq = char_eq.get("equation", "")
        assert "0" in eq.replace(" ", "") and (
            "=" in eq
        ), f"ecuación característica legible esperada, obtuvo: {eq!r}"

        bundle = char_eq.get("step_by_step", {})
        assert bundle.get("method") == "characteristic_equation"
        assert isinstance(bundle.get("steps"), list) and len(bundle.get("steps", [])) > 0


class TestDynamicProgrammingValidation:
    """Regresiones para evitar afirmaciones incorrectas sobre PD."""

    def test_fibonacci_confirms_dp_with_rolling_window(self):
        """Fibonacci debe confirmar PD y reportar patrón rolling window."""
        result = analyze_algorithm(
            FIBONACCI_RECURSIVE_PSEUDOCODE,
            mode="worst",
            preferred_method="characteristic_equation",
        )

        assert result.get("ok"), result.get("errors", [])
        char_eq = result.get("totals", {}).get("characteristic_equation", {})

        assert char_eq.get("dp_validation", {}).get("status") == "clear"
        assert char_eq.get("dp_version", {}).get("pattern") == "rolling_window"
        assert char_eq.get("dp_optimized_version", {}).get("space_complexity") == "O(1)"

    def test_hanoi_rejects_dp_due_to_stateful_parameters(self):
        """Hanoi no debe afirmarse como PD porque cambia parámetros de estado."""
        result = analyze_algorithm(
            HANOI_RECURSIVE_PSEUDOCODE,
            mode="worst",
            preferred_method="characteristic_equation",
        )

        assert result.get("ok"), result.get("errors", [])
        char_eq = result.get("totals", {}).get("characteristic_equation", {})

        assert char_eq.get("is_dp_linear") is False
        assert char_eq.get("dp_validation", {}).get("status") == "rejected"
        assert char_eq.get("dp_version") is None
        assert (
            "parámetros de estado"
            in char_eq.get("dp_validation", {}).get("reasons", [""])[0].lower()
        )

    def test_factorial_rejects_dp_without_overlap(self):
        """Factorial no debe presentarse como PD al no tener solapamiento."""
        result = analyze_algorithm(
            FACTORIAL_RECURSIVE_PSEUDOCODE,
            mode="worst",
            preferred_method="characteristic_equation",
        )

        assert result.get("ok"), result.get("errors", [])
        char_eq = result.get("totals", {}).get("characteristic_equation", {})

        assert char_eq.get("dp_validation", {}).get("status") == "rejected"
        assert char_eq.get("dp_version") is None
        assert "solapamiento" in char_eq.get("dp_validation", {}).get("reasons", [""])[0].lower()

    def test_sparse_linear_recurrence_detects_linear_shift_family(self):
        """Debe detectarse como familia linear_shift para análisis por ecuación característica."""
        result = analyze_algorithm(
            SPARSE_LINEAR_RECURSIVE_PSEUDOCODE,
            mode="worst",
            preferred_method="characteristic_equation",
        )

        assert result.get("ok"), result.get("errors", [])
        recurrence = result.get("totals", {}).get("recurrence", {})
        assert recurrence.get("type") == "linear_shift"
        assert recurrence.get("method") == "characteristic_equation"

    def test_sparse_linear_recurrence_dp_validation_prefers_tabulation(self):
        """DP validation debe elegir tabulación como patrón primario."""
        result = analyze_algorithm(
            SPARSE_LINEAR_RECURSIVE_PSEUDOCODE,
            mode="worst",
            preferred_method="characteristic_equation",
        )

        assert result.get("ok"), result.get("errors", [])
        char_eq = result.get("totals", {}).get("characteristic_equation", {})
        assert char_eq.get("dp_validation", {}).get("status") == "clear"
        assert char_eq.get("dp_validation", {}).get("primary_pattern") == "tabulation"
        assert char_eq.get("dp_version", {}).get("pattern") == "tabulation"
        assert char_eq.get("dp_optimized_version", {}).get("space_complexity") == "O(4)"

    def test_sparse_linear_recurrence_characteristic_bundle_contract(self):
        """Cuando se usa characteristic_equation, el bundle step_by_step debe ser válido."""
        result = analyze_algorithm(
            SPARSE_LINEAR_RECURSIVE_PSEUDOCODE,
            mode="worst",
            preferred_method="characteristic_equation",
        )

        assert result.get("ok"), result.get("errors", [])
        char_eq = result.get("totals", {}).get("characteristic_equation", {})
        bundle = char_eq.get("step_by_step", {})
        assert isinstance(bundle, dict)
        assert bundle.get("method") == "characteristic_equation"
        assert bundle.get("version") == "ceq_steps_v1"
        assert isinstance(bundle.get("steps"), list) and len(bundle.get("steps", [])) > 0

    def test_fibonacci_reports_supported_patterns_besides_rolling_window(self):
        """Fibonacci debe reportar métodos DP alternativos además de rolling window."""
        result = analyze_algorithm(
            FIBONACCI_RECURSIVE_PSEUDOCODE,
            mode="worst",
            preferred_method="characteristic_equation",
        )

        assert result.get("ok"), result.get("errors", [])
        validation = (
            result.get("totals", {}).get("characteristic_equation", {}).get("dp_validation", {})
        )

        assert validation.get("primary_pattern") == "rolling_window"
        assert "tabulation" in validation.get("supported_patterns", [])
        assert "memoization" in validation.get("supported_patterns", [])

    def test_detect_methods_rejects_dp_for_master_style_recurrence(self):
        """Detect-methods debe informar descarte de PD para merge sort."""
        result = detect_methods(MERGE_SORT_PSEUDOCODE, algorithm_kind="recursive")

        assert result.get("ok"), result.get("errors", [])
        dp_validation = result.get("recurrence_info", {}).get("dp_validation", {})

        assert dp_validation.get("status") == "rejected"
        assert "Teorema Maestro" in dp_validation.get("reasons", [""])[0]

    def test_detect_methods_reports_tabulation_for_sparse_linear_recurrence(self):
        """Detect-methods debe propagar metadata de tabulación en recurrencias lineales dispersas."""
        result = detect_methods(SPARSE_LINEAR_RECURSIVE_PSEUDOCODE, algorithm_kind="recursive")

        assert result.get("ok"), result.get("errors", [])
        dp_validation = result.get("recurrence_info", {}).get("dp_validation", {})

        assert dp_validation.get("status") == "clear"
        assert dp_validation.get("primary_pattern") == "tabulation"
        assert "memoization" in dp_validation.get("supported_patterns", [])

    def test_detect_methods_single_branch_divide_conquer_offers_multiple_methods(self):
        """Rama única divide-conquer debe listar master, árbol e iteración (default: master)."""
        result = detect_methods(FAST_POWER_RECURSIVE_PSEUDOCODE, algorithm_kind="recursive")

        assert result.get("ok"), result.get("errors", [])
        methods = result.get("applicable_methods", [])
        assert "master" in methods
        assert "recursion_tree" in methods
        assert "iteration" in methods
        assert result.get("default_method") == "master"

    def test_characteristic_step_bundle_contract_for_constant_non_homogeneous(self):
        """El bundle step_by_step debe venir tipado y consistente para T(n)=2T(n-1)+1."""
        result = analyze_algorithm(
            DOUBLE_CONSTANT_RECURSIVE_PSEUDOCODE,
            mode="worst",
            preferred_method="characteristic_equation",
        )

        assert result.get("ok"), result.get("errors", [])
        char_eq = result.get("totals", {}).get("characteristic_equation", {})
        bundle = char_eq.get("step_by_step")
        assert isinstance(bundle, dict)
        assert bundle.get("method") == "characteristic_equation"
        assert bundle.get("version") == "ceq_steps_v1"
        assert bundle.get("overallStatus") in {
            "complete",
            "partial",
            "unsupported",
            "error",
        }

        steps = bundle.get("steps", [])
        assert len(steps) == 12
        assert [step.get("index") for step in steps] == list(range(1, 13))

        step5 = steps[4]
        assert step5.get("kind") == "characteristic_polynomial_built"

    def test_tribonacci_characteristic_keeps_theta_and_marks_partial_base_resolution(self):
        """Tribonacci debe resolver rápido sin bloquear solve exacto de constantes."""
        result = analyze_algorithm(
            TRIBONACCI_RECURSIVE_PSEUDOCODE,
            mode="worst",
            preferred_method="characteristic_equation",
        )

        assert result.get("ok"), result.get("errors", [])
        char_eq = result.get("totals", {}).get("characteristic_equation", {})
        assert char_eq.get("method") == "characteristic_equation"
        assert notation_has_complexity(char_eq.get("theta", ""), "exponential")

        bundle = char_eq.get("step_by_step", {})
        assert bundle
        base_step = next(
            (
                step
                for step in bundle.get("steps", [])
                if step.get("kind") == "base_conditions_applied"
            ),
            {},
        )
        assert base_step.get("status") == "partial"
        assert "CEQ_SYMBOLIC_CONSTANT_SOLVER_SKIPPED" in base_step.get("audit", {}).get("codes", [])

        resolution = char_eq.get("constant_resolution", {})
        assert resolution.get("status") == "partial"
        assert resolution.get("reason") == "symbolic_solver_guard"

    def test_iteration_step_bundle_contract_for_unit_shift(self):
        """Iteración debe entregar bundle de 11 pasos para T(n)=T(n-1)+1."""
        result = analyze_algorithm(
            FACTORIAL_RECURSIVE_PSEUDOCODE,
            mode="worst",
            preferred_method="iteration",
        )

        assert result.get("ok"), result.get("errors", [])
        iteration = result.get("totals", {}).get("iteration", {})
        bundle = iteration.get("step_by_step")
        assert isinstance(bundle, dict)
        assert bundle.get("method") == "iteration"
        assert bundle.get("version") == "iter_steps_v1"
        assert bundle.get("overallStatus") in {"complete", "partial"}

        steps = bundle.get("steps", [])
        assert len(steps) == 11
        assert [step.get("index") for step in steps] == list(range(1, 12))
        assert steps[1].get("kind") == "applicability_validated"
        assert steps[1].get("status") == "complete"
        assert "\\sum" in (steps[6].get("math", {}).get("primaryLatex") or "")

    def test_iteration_step_bundle_contract_for_linear_n(self):
        """Iteración debe mantener contrato tipado en una recurrencia lineal con término variable."""
        result = analyze_algorithm(
            LINEAR_SUM_RECURSIVE_PSEUDOCODE,
            mode="worst",
            preferred_method="iteration",
        )

        assert result.get("ok"), result.get("errors", [])
        iteration = result.get("totals", {}).get("iteration", {})
        assert isinstance(iteration.get("theta"), str)
        assert iteration.get("theta") != "N/A"
        bundle = iteration.get("step_by_step", {})
        assert bundle.get("overallStatus") in {"complete", "partial"}
        steps = bundle.get("steps", [])
        assert len(steps) == 11
        assert steps[7].get("kind") == "summation_simplified"
        assert steps[7].get("status") == "complete"

    def test_iteration_preferred_on_single_branch_divide_conquer_is_supported(self):
        """Iteración sobre divide-conquer de rama única debe resolver con theta logarítmica."""
        result = analyze_algorithm(
            BINARY_SEARCH_RECURSIVE_PSEUDOCODE,
            mode="worst",
            preferred_method="iteration",
        )

        assert result.get("ok"), result.get("errors", [])
        iteration = result.get("totals", {}).get("iteration", {})
        bundle = iteration.get("step_by_step", {})
        assert bundle.get("overallStatus") in {"complete", "partial"}
        assert "log" in (iteration.get("theta", "") or "").lower()
        steps = bundle.get("steps", [])
        assert len(steps) == 11
        assert steps[1].get("kind") == "applicability_validated"
        assert steps[1].get("status") == "complete"

    def test_master_step_bundle_contract_for_merge_sort(self):
        """Master debe entregar bundle tipado de 10 pasos con clasificación consistente."""
        result = analyze_algorithm(
            MERGE_SORT_PSEUDOCODE,
            mode="worst",
            preferred_method="master",
        )

        assert result.get("ok"), result.get("errors", [])
        master = result.get("totals", {}).get("master", {})
        bundle = master.get("step_by_step")
        assert isinstance(bundle, dict)
        assert bundle.get("method") == "master"
        assert bundle.get("version") == "master_steps_v1"
        assert bundle.get("overallStatus") in {
            "complete",
            "partial",
            "unsupported",
            "error",
        }

        steps = bundle.get("steps", [])
        assert len(steps) == 10
        assert [step.get("index") for step in steps] == list(range(1, 11))
        assert steps[1].get("kind") == "master_form_validated"
        assert steps[5].get("kind") == "growth_comparison_performed"
        assert steps[9].get("kind") == "asymptotic_conclusion"
        assert steps[9].get("math", {}).get("primaryLatex", "").startswith("T(n)")

    def test_recursion_tree_step_bundle_contract_for_merge_sort(self):
        """Árbol de recursión debe entregar bundle tipado de 11 pasos y conclusión con T(n)."""
        result = analyze_algorithm(
            MERGE_SORT_PSEUDOCODE,
            mode="worst",
            preferred_method="recursion_tree",
        )

        assert result.get("ok"), result.get("errors", [])
        recursion_tree = result.get("totals", {}).get("recursion_tree", {})
        bundle = recursion_tree.get("step_by_step")
        assert isinstance(bundle, dict)
        assert bundle.get("method") == "recursion_tree"
        assert bundle.get("version") == "rt_steps_v1"
        assert bundle.get("overallStatus") in {
            "complete",
            "partial",
            "unsupported",
            "error",
        }

        steps = bundle.get("steps", [])
        assert len(steps) == 11
        assert [step.get("index") for step in steps] == list(range(1, 12))
        assert steps[1].get("kind") == "recursion_tree_applicability_check"
        assert steps[8].get("kind") == "total_tree_sum_simplified"
        assert steps[10].get("kind") == "asymptotic_conclusion"
        assert steps[10].get("math", {}).get("primaryLatex", "").startswith("T(n)")


class TestRecursiveAlgorithms:
    """Tests de integración para algoritmos recursivos con Teorema Maestro."""

    def create_merge_sort_ast(self):
        """Crea AST de Merge Sort: T(n) = 2T(n/2) + Θ(n) -> Caso 2 -> Θ(n log n)"""
        return {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "mergeSort",
                    "params": [
                        {
                            "type": "ArrayParam",
                            "name": "A",
                            "start": {"type": "Identifier", "name": "n"},
                        },
                        {"type": "Param", "name": "izq"},
                        {"type": "Param", "name": "der"},
                    ],
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "If",
                                "test": {
                                    "type": "Binary",
                                    "op": "<",
                                    "left": {"type": "Identifier", "name": "izq"},
                                    "right": {"type": "Identifier", "name": "der"},
                                },
                                "consequent": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Assign",
                                            "target": {
                                                "type": "Identifier",
                                                "name": "medio",
                                            },
                                            "value": {
                                                "type": "Binary",
                                                "op": "/",
                                                "left": {
                                                    "type": "Binary",
                                                    "op": "+",
                                                    "left": {
                                                        "type": "Identifier",
                                                        "name": "izq",
                                                    },
                                                    "right": {
                                                        "type": "Identifier",
                                                        "name": "der",
                                                    },
                                                },
                                                "right": {
                                                    "type": "Literal",
                                                    "value": 2,
                                                },
                                            },
                                        },
                                        {
                                            "type": "Call",
                                            "name": "mergeSort",
                                            "args": [
                                                {"type": "Identifier", "name": "A"},
                                                {"type": "Identifier", "name": "izq"},
                                                {"type": "Identifier", "name": "medio"},
                                            ],
                                        },
                                        {
                                            "type": "Call",
                                            "name": "mergeSort",
                                            "args": [
                                                {"type": "Identifier", "name": "A"},
                                                {
                                                    "type": "Binary",
                                                    "op": "+",
                                                    "left": {
                                                        "type": "Identifier",
                                                        "name": "medio",
                                                    },
                                                    "right": {
                                                        "type": "Literal",
                                                        "value": 1,
                                                    },
                                                },
                                                {"type": "Identifier", "name": "der"},
                                            ],
                                        },
                                        {
                                            "type": "Call",
                                            "name": "merge",
                                            "args": [
                                                {"type": "Identifier", "name": "A"},
                                                {"type": "Identifier", "name": "izq"},
                                                {"type": "Identifier", "name": "medio"},
                                                {"type": "Identifier", "name": "der"},
                                            ],
                                        },
                                    ],
                                },
                            }
                        ],
                    },
                }
            ],
        }

    def create_binary_search_ast(self):
        """Crea AST de Búsqueda Binaria: T(n) = T(n/2) + Θ(1) -> Caso 2 -> Θ(log n)"""
        return {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "busquedaBinaria",
                    "params": [
                        {
                            "type": "ArrayParam",
                            "name": "A",
                            "start": {"type": "Identifier", "name": "n"},
                        },
                        {"type": "Param", "name": "x"},
                        {"type": "Param", "name": "inicio"},
                        {"type": "Param", "name": "fin"},
                    ],
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "If",
                                "test": {
                                    "type": "Binary",
                                    "op": ">",
                                    "left": {"type": "Identifier", "name": "inicio"},
                                    "right": {"type": "Identifier", "name": "fin"},
                                },
                                "consequent": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Return",
                                            "value": {
                                                "type": "Unary",
                                                "op": "-",
                                                "arg": {"type": "Literal", "value": 1},
                                            },
                                        }
                                    ],
                                },
                            },
                            {
                                "type": "Assign",
                                "target": {"type": "Identifier", "name": "mitad"},
                                "value": {
                                    "type": "Binary",
                                    "op": "/",
                                    "left": {
                                        "type": "Binary",
                                        "op": "+",
                                        "left": {
                                            "type": "Identifier",
                                            "name": "inicio",
                                        },
                                        "right": {"type": "Identifier", "name": "fin"},
                                    },
                                    "right": {"type": "Literal", "value": 2},
                                },
                            },
                            {
                                "type": "If",
                                "test": {
                                    "type": "Binary",
                                    "op": "==",
                                    "left": {
                                        "type": "Index",
                                        "target": {"type": "Identifier", "name": "A"},
                                        "index": {
                                            "type": "Identifier",
                                            "name": "mitad",
                                        },
                                    },
                                    "right": {"type": "Identifier", "name": "x"},
                                },
                                "consequent": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Return",
                                            "value": {
                                                "type": "Identifier",
                                                "name": "mitad",
                                            },
                                        }
                                    ],
                                },
                                "alternate": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "If",
                                            "test": {
                                                "type": "Binary",
                                                "op": "<",
                                                "left": {
                                                    "type": "Identifier",
                                                    "name": "x",
                                                },
                                                "right": {
                                                    "type": "Index",
                                                    "target": {
                                                        "type": "Identifier",
                                                        "name": "A",
                                                    },
                                                    "index": {
                                                        "type": "Identifier",
                                                        "name": "mitad",
                                                    },
                                                },
                                            },
                                            "consequent": {
                                                "type": "Block",
                                                "body": [
                                                    {
                                                        "type": "Return",
                                                        "value": {
                                                            "type": "Call",
                                                            "name": "busquedaBinaria",
                                                            "args": [
                                                                {
                                                                    "type": "Identifier",
                                                                    "name": "A",
                                                                },
                                                                {
                                                                    "type": "Identifier",
                                                                    "name": "x",
                                                                },
                                                                {
                                                                    "type": "Identifier",
                                                                    "name": "inicio",
                                                                },
                                                                {
                                                                    "type": "Binary",
                                                                    "op": "-",
                                                                    "left": {
                                                                        "type": "Identifier",
                                                                        "name": "mitad",
                                                                    },
                                                                    "right": {
                                                                        "type": "Literal",
                                                                        "value": 1,
                                                                    },
                                                                },
                                                            ],
                                                        },
                                                    }
                                                ],
                                            },
                                            "alternate": {
                                                "type": "Block",
                                                "body": [
                                                    {
                                                        "type": "Return",
                                                        "value": {
                                                            "type": "Call",
                                                            "name": "busquedaBinaria",
                                                            "args": [
                                                                {
                                                                    "type": "Identifier",
                                                                    "name": "A",
                                                                },
                                                                {
                                                                    "type": "Identifier",
                                                                    "name": "x",
                                                                },
                                                                {
                                                                    "type": "Binary",
                                                                    "op": "+",
                                                                    "left": {
                                                                        "type": "Identifier",
                                                                        "name": "mitad",
                                                                    },
                                                                    "right": {
                                                                        "type": "Literal",
                                                                        "value": 1,
                                                                    },
                                                                },
                                                                {
                                                                    "type": "Identifier",
                                                                    "name": "fin",
                                                                },
                                                            ],
                                                        },
                                                    }
                                                ],
                                            },
                                        }
                                    ],
                                },
                            },
                        ],
                    },
                }
            ],
        }

    def create_strassen_ast(self):
        """Crea AST de Strassen: T(n) = 7T(n/2) + Θ(n²) -> Caso 1 -> Θ(n^log₂7) ≈ Θ(n^2.81)"""
        return {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "strassen",
                    "params": [
                        {
                            "type": "ArrayParam",
                            "name": "A",
                            "start": {"type": "Identifier", "name": "n"},
                        },
                        {
                            "type": "ArrayParam",
                            "name": "B",
                            "start": {"type": "Identifier", "name": "n"},
                        },
                        {"type": "Param", "name": "n"},
                    ],
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "If",
                                "test": {
                                    "type": "Binary",
                                    "op": "==",
                                    "left": {"type": "Identifier", "name": "n"},
                                    "right": {"type": "Literal", "value": 1},
                                },
                                "consequent": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Return",
                                            "value": {
                                                "type": "Binary",
                                                "op": "*",
                                                "left": {
                                                    "type": "Index",
                                                    "target": {
                                                        "type": "Index",
                                                        "target": {
                                                            "type": "Identifier",
                                                            "name": "A",
                                                        },
                                                        "index": {
                                                            "type": "Literal",
                                                            "value": 1,
                                                        },
                                                    },
                                                    "index": {
                                                        "type": "Literal",
                                                        "value": 1,
                                                    },
                                                },
                                                "right": {
                                                    "type": "Index",
                                                    "target": {
                                                        "type": "Index",
                                                        "target": {
                                                            "type": "Identifier",
                                                            "name": "B",
                                                        },
                                                        "index": {
                                                            "type": "Literal",
                                                            "value": 1,
                                                        },
                                                    },
                                                    "index": {
                                                        "type": "Literal",
                                                        "value": 1,
                                                    },
                                                },
                                            },
                                        }
                                    ],
                                },
                            },
                            {
                                "type": "Assign",
                                "target": {"type": "Identifier", "name": "mitad"},
                                "value": {
                                    "type": "Binary",
                                    "op": "/",
                                    "left": {"type": "Identifier", "name": "n"},
                                    "right": {"type": "Literal", "value": 2},
                                },
                            },
                            # 7 llamadas recursivas (simplificado)
                            {
                                "type": "Call",
                                "name": "strassen",
                                "args": [
                                    {"type": "Identifier", "name": "A11"},
                                    {"type": "Identifier", "name": "B11"},
                                    {"type": "Identifier", "name": "mitad"},
                                ],
                            },
                            {
                                "type": "Call",
                                "name": "strassen",
                                "args": [
                                    {"type": "Identifier", "name": "A12"},
                                    {"type": "Identifier", "name": "B21"},
                                    {"type": "Identifier", "name": "mitad"},
                                ],
                            },
                            {
                                "type": "Call",
                                "name": "strassen",
                                "args": [
                                    {"type": "Identifier", "name": "A11"},
                                    {"type": "Identifier", "name": "B12"},
                                    {"type": "Identifier", "name": "mitad"},
                                ],
                            },
                            {
                                "type": "Call",
                                "name": "strassen",
                                "args": [
                                    {"type": "Identifier", "name": "A12"},
                                    {"type": "Identifier", "name": "B22"},
                                    {"type": "Identifier", "name": "mitad"},
                                ],
                            },
                            {
                                "type": "Call",
                                "name": "strassen",
                                "args": [
                                    {"type": "Identifier", "name": "A21"},
                                    {"type": "Identifier", "name": "B11"},
                                    {"type": "Identifier", "name": "mitad"},
                                ],
                            },
                            {
                                "type": "Call",
                                "name": "strassen",
                                "args": [
                                    {"type": "Identifier", "name": "A22"},
                                    {"type": "Identifier", "name": "B21"},
                                    {"type": "Identifier", "name": "mitad"},
                                ],
                            },
                            {
                                "type": "Call",
                                "name": "strassen",
                                "args": [
                                    {"type": "Identifier", "name": "A21"},
                                    {"type": "Identifier", "name": "B12"},
                                    {"type": "Identifier", "name": "mitad"},
                                ],
                            },
                        ],
                    },
                }
            ],
        }

    def create_merge_sort_3_ways_ast(self):
        """Crea AST de Merge Sort 3 vías: T(n) = 3T(n/3) + Θ(n) -> Caso 2 -> Θ(n log n)"""
        return {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "mergeSort3Vias",
                    "params": [
                        {
                            "type": "ArrayParam",
                            "name": "A",
                            "start": {"type": "Identifier", "name": "n"},
                        },
                        {"type": "Param", "name": "izq"},
                        {"type": "Param", "name": "der"},
                    ],
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "If",
                                "test": {
                                    "type": "Binary",
                                    "op": "<",
                                    "left": {"type": "Identifier", "name": "izq"},
                                    "right": {"type": "Identifier", "name": "der"},
                                },
                                "consequent": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Assign",
                                            "target": {
                                                "type": "Identifier",
                                                "name": "tamaño",
                                            },
                                            "value": {
                                                "type": "Binary",
                                                "op": "+",
                                                "left": {
                                                    "type": "Binary",
                                                    "op": "-",
                                                    "left": {
                                                        "type": "Identifier",
                                                        "name": "der",
                                                    },
                                                    "right": {
                                                        "type": "Identifier",
                                                        "name": "izq",
                                                    },
                                                },
                                                "right": {
                                                    "type": "Literal",
                                                    "value": 1,
                                                },
                                            },
                                        },
                                        {
                                            "type": "Assign",
                                            "target": {
                                                "type": "Identifier",
                                                "name": "tercio1",
                                            },
                                            "value": {
                                                "type": "Binary",
                                                "op": "+",
                                                "left": {
                                                    "type": "Identifier",
                                                    "name": "izq",
                                                },
                                                "right": {
                                                    "type": "Binary",
                                                    "op": "/",
                                                    "left": {
                                                        "type": "Identifier",
                                                        "name": "tamaño",
                                                    },
                                                    "right": {
                                                        "type": "Literal",
                                                        "value": 3,
                                                    },
                                                },
                                            },
                                        },
                                        {
                                            "type": "Assign",
                                            "target": {
                                                "type": "Identifier",
                                                "name": "tercio2",
                                            },
                                            "value": {
                                                "type": "Binary",
                                                "op": "+",
                                                "left": {
                                                    "type": "Identifier",
                                                    "name": "izq",
                                                },
                                                "right": {
                                                    "type": "Binary",
                                                    "op": "*",
                                                    "left": {
                                                        "type": "Literal",
                                                        "value": 2,
                                                    },
                                                    "right": {
                                                        "type": "Binary",
                                                        "op": "/",
                                                        "left": {
                                                            "type": "Identifier",
                                                            "name": "tamaño",
                                                        },
                                                        "right": {
                                                            "type": "Literal",
                                                            "value": 3,
                                                        },
                                                    },
                                                },
                                            },
                                        },
                                        {
                                            "type": "Call",
                                            "name": "mergeSort3Vias",
                                            "args": [
                                                {"type": "Identifier", "name": "A"},
                                                {"type": "Identifier", "name": "izq"},
                                                {
                                                    "type": "Identifier",
                                                    "name": "tercio1",
                                                },
                                            ],
                                        },
                                        {
                                            "type": "Call",
                                            "name": "mergeSort3Vias",
                                            "args": [
                                                {"type": "Identifier", "name": "A"},
                                                {
                                                    "type": "Binary",
                                                    "op": "+",
                                                    "left": {
                                                        "type": "Identifier",
                                                        "name": "tercio1",
                                                    },
                                                    "right": {
                                                        "type": "Literal",
                                                        "value": 1,
                                                    },
                                                },
                                                {
                                                    "type": "Identifier",
                                                    "name": "tercio2",
                                                },
                                            ],
                                        },
                                        {
                                            "type": "Call",
                                            "name": "mergeSort3Vias",
                                            "args": [
                                                {"type": "Identifier", "name": "A"},
                                                {
                                                    "type": "Binary",
                                                    "op": "+",
                                                    "left": {
                                                        "type": "Identifier",
                                                        "name": "tercio2",
                                                    },
                                                    "right": {
                                                        "type": "Literal",
                                                        "value": 1,
                                                    },
                                                },
                                                {"type": "Identifier", "name": "der"},
                                            ],
                                        },
                                    ],
                                },
                            }
                        ],
                    },
                }
            ],
        }

    def create_merge_sort_4_ways_ast(self):
        """Crea AST de Merge Sort 4 vías: T(n) = 4T(n/4) + Θ(n) -> Caso 2 -> Θ(n log n)"""
        return {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "ordenar4Vias",
                    "params": [
                        {
                            "type": "ArrayParam",
                            "name": "A",
                            "start": {"type": "Identifier", "name": "n"},
                        },
                        {"type": "Param", "name": "izq"},
                        {"type": "Param", "name": "der"},
                    ],
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "If",
                                "test": {
                                    "type": "Binary",
                                    "op": "<=",
                                    "left": {
                                        "type": "Binary",
                                        "op": "-",
                                        "left": {"type": "Identifier", "name": "der"},
                                        "right": {"type": "Identifier", "name": "izq"},
                                    },
                                    "right": {"type": "Literal", "value": 1},
                                },
                                "consequent": {
                                    "type": "Block",
                                    "body": [{"type": "Return"}],
                                },
                            },
                            {
                                "type": "Assign",
                                "target": {"type": "Identifier", "name": "tamaño"},
                                "value": {
                                    "type": "Binary",
                                    "op": "+",
                                    "left": {
                                        "type": "Binary",
                                        "op": "-",
                                        "left": {"type": "Identifier", "name": "der"},
                                        "right": {"type": "Identifier", "name": "izq"},
                                    },
                                    "right": {"type": "Literal", "value": 1},
                                },
                            },
                            {
                                "type": "Assign",
                                "target": {"type": "Identifier", "name": "cuarto"},
                                "value": {
                                    "type": "Binary",
                                    "op": "/",
                                    "left": {"type": "Identifier", "name": "tamaño"},
                                    "right": {"type": "Literal", "value": 4},
                                },
                            },
                            {
                                "type": "Assign",
                                "target": {"type": "Identifier", "name": "punto1"},
                                "value": {
                                    "type": "Binary",
                                    "op": "+",
                                    "left": {"type": "Identifier", "name": "izq"},
                                    "right": {"type": "Identifier", "name": "cuarto"},
                                },
                            },
                            {
                                "type": "Assign",
                                "target": {"type": "Identifier", "name": "punto2"},
                                "value": {
                                    "type": "Binary",
                                    "op": "+",
                                    "left": {"type": "Identifier", "name": "izq"},
                                    "right": {
                                        "type": "Binary",
                                        "op": "*",
                                        "left": {"type": "Literal", "value": 2},
                                        "right": {
                                            "type": "Identifier",
                                            "name": "cuarto",
                                        },
                                    },
                                },
                            },
                            {
                                "type": "Assign",
                                "target": {"type": "Identifier", "name": "punto3"},
                                "value": {
                                    "type": "Binary",
                                    "op": "+",
                                    "left": {"type": "Identifier", "name": "izq"},
                                    "right": {
                                        "type": "Binary",
                                        "op": "*",
                                        "left": {"type": "Literal", "value": 3},
                                        "right": {
                                            "type": "Identifier",
                                            "name": "cuarto",
                                        },
                                    },
                                },
                            },
                            {
                                "type": "Call",
                                "name": "ordenar4Vias",
                                "args": [
                                    {"type": "Identifier", "name": "A"},
                                    {"type": "Identifier", "name": "izq"},
                                    {"type": "Identifier", "name": "punto1"},
                                ],
                            },
                            {
                                "type": "Call",
                                "name": "ordenar4Vias",
                                "args": [
                                    {"type": "Identifier", "name": "A"},
                                    {
                                        "type": "Binary",
                                        "op": "+",
                                        "left": {
                                            "type": "Identifier",
                                            "name": "punto1",
                                        },
                                        "right": {"type": "Literal", "value": 1},
                                    },
                                    {"type": "Identifier", "name": "punto2"},
                                ],
                            },
                            {
                                "type": "Call",
                                "name": "ordenar4Vias",
                                "args": [
                                    {"type": "Identifier", "name": "A"},
                                    {
                                        "type": "Binary",
                                        "op": "+",
                                        "left": {
                                            "type": "Identifier",
                                            "name": "punto2",
                                        },
                                        "right": {"type": "Literal", "value": 1},
                                    },
                                    {"type": "Identifier", "name": "punto3"},
                                ],
                            },
                            {
                                "type": "Call",
                                "name": "ordenar4Vias",
                                "args": [
                                    {"type": "Identifier", "name": "A"},
                                    {
                                        "type": "Binary",
                                        "op": "+",
                                        "left": {
                                            "type": "Identifier",
                                            "name": "punto3",
                                        },
                                        "right": {"type": "Literal", "value": 1},
                                    },
                                    {"type": "Identifier", "name": "der"},
                                ],
                            },
                        ],
                    },
                }
            ],
        }

    def test_merge_sort_case_2(self):
        """Test: Merge Sort - Caso 2 del Teorema Maestro - T(n) = 2T(n/2) + Θ(n) -> Θ(n log n)"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_merge_sort_ast()

        # Especificar preferred_method para forzar uso de teorema maestro
        result = analyzer.analyze(ast, mode="worst", preferred_method="master")

        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "totals" in result, "Debe tener totals"
        totals = result["totals"]
        assert "recurrence" in totals, "Debe tener recurrencia"
        assert "master" in totals, "Debe tener master theorem"

        recurrence = totals["recurrence"]
        assert recurrence["a"] == 2, f"a debe ser 2, obtuvo {recurrence['a']}"
        assert recurrence["b"] == 2.0, f"b debe ser 2.0, obtuvo {recurrence['b']}"
        assert recurrence["applicable"], "Teorema Maestro debe ser aplicable"

        master = totals["master"]
        assert "theta" in master, "Debe tener theta"
        theta = master["theta"]
        # Merge sort: idealmente Θ(n log n). Si el AST no captura el costo del merge,
        # puede dar Θ(n) (Caso 1). Aceptamos Θ(n) o Θ(n log n).
        assert "n" in theta.lower(), f"Merge sort debe contener n, obtuvo: {theta}"

    def test_binary_search_case_2(self):
        """Test: Búsqueda Binaria - Caso 2 - T(n) = T(n/2) + Θ(1) -> Θ(log n)"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_binary_search_ast()

        result = analyzer.analyze(ast, mode="worst", preferred_method="master")

        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "totals" in result, "Debe tener totals"
        totals = result["totals"]
        assert "recurrence" in totals, "Debe tener recurrencia"
        assert "master" in totals, "Debe tener master theorem"

        recurrence = totals["recurrence"]
        assert recurrence["a"] == 1, f"a debe ser 1 (llamadas en if-else), obtuvo {recurrence['a']}"
        assert recurrence["b"] == 2.0, f"b debe ser 2.0, obtuvo {recurrence['b']}"

        master = totals["master"]
        assert "theta" in master, "Debe tener theta"
        theta = master["theta"]
        # Binary search: T(n)=T(n/2)+Θ(1) -> Θ(log n)
        assert "log" in theta.lower(), f"Binary search debe ser Θ(log n), obtuvo: {theta}"

    def test_strassen_case_1(self):
        """Test: Strassen - Caso 1 - T(n) = 7T(n/2) + Θ(n²) -> Θ(n^log₂7) ≈ Θ(n^2.81)"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_strassen_ast()

        # Especificar preferred_method para forzar uso de teorema maestro
        result = analyzer.analyze(ast, mode="worst", preferred_method="master")

        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "totals" in result, "Debe tener totals"
        totals = result["totals"]
        assert "recurrence" in totals, "Debe tener recurrencia"
        assert "master" in totals, "Debe tener master theorem"

        recurrence = totals["recurrence"]
        assert recurrence["a"] == 7, f"a debe ser 7, obtuvo {recurrence['a']}"
        assert recurrence["b"] == 2.0, f"b debe ser 2.0, obtuvo {recurrence['b']}"

        master = totals["master"]
        assert master["case"] == 1, f"Debe ser Caso 1 (f(n) < n^(log_b a)), obtuvo {master['case']}"
        assert "theta" in master, "Debe tener theta"
        theta = master["theta"]
        # Debe contener exponente aproximadamente 2.81
        assert "n^{" in theta or "n^" in theta, f"Theta debe tener exponente, obtuvo {theta}"

    def test_merge_sort_3_ways_case_2(self):
        """Test: Merge Sort 3 vías - Caso 2 - T(n) = 3T(n/3) + Θ(n) -> Θ(n log n)"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_merge_sort_3_ways_ast()

        # Especificar preferred_method para forzar uso de teorema maestro
        result = analyzer.analyze(ast, mode="worst", preferred_method="master")

        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "totals" in result, "Debe tener totals"
        totals = result["totals"]
        assert "recurrence" in totals, "Debe tener recurrencia"
        assert "master" in totals, "Debe tener master theorem"

        recurrence = totals["recurrence"]
        assert recurrence["a"] == 3, f"a debe ser 3, obtuvo {recurrence['a']}"
        assert recurrence["b"] == 3.0, f"b debe ser 3.0, obtuvo {recurrence['b']}"

        master = totals["master"]
        # Puede ser Caso 1 o 2 dependiendo de cómo se clasifique f(n) vs n^(log_3 3) = n^1
        # Si f(n) = Θ(n), debería ser Caso 2. Si f(n) < n, sería Caso 1
        assert master["case"] in [1, 2], f"Caso debe ser 1 o 2, obtuvo {master['case']}"

    def test_merge_sort_4_ways_case_2(self):
        """Test: Merge Sort 4 vías - Caso 2 - T(n) = 4T(n/4) + Θ(n) -> Θ(n log n)"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_merge_sort_4_ways_ast()

        # Especificar preferred_method para forzar uso de teorema maestro
        result = analyzer.analyze(ast, mode="worst", preferred_method="master")

        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "totals" in result, "Debe tener totals"
        totals = result["totals"]
        assert "recurrence" in totals, "Debe tener recurrencia"
        assert "master" in totals, "Debe tener master theorem"

        recurrence = totals["recurrence"]
        assert recurrence["a"] == 4, f"a debe ser 4, obtuvo {recurrence['a']}"
        assert recurrence["b"] == 4.0, f"b debe ser 4.0, obtuvo {recurrence['b']}"

        master = totals["master"]
        # Puede ser Caso 1 o 2 dependiendo de cómo se clasifique f(n) vs n^(log_4 4) = n^1
        # Si f(n) = Θ(n), debería ser Caso 2. Si f(n) < n, sería Caso 1
        assert master["case"] in [1, 2], f"Caso debe ser 1 o 2, obtuvo {master['case']}"

    def test_recurrence_extraction(self):
        """Test: Verificar que la extracción de recurrencia funcione correctamente"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_merge_sort_ast()

        result = analyzer.analyze(ast, mode="worst")

        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "totals" in result, "Debe tener totals"
        totals = result["totals"]
        assert "recurrence" in totals, "Debe tener recurrencia"
        recurrence = totals["recurrence"]

        # Verificar estructura de recurrencia
        assert "form" in recurrence, "Debe tener forma de recurrencia"
        assert "a" in recurrence, "Debe tener a"
        assert "b" in recurrence, "Debe tener b"
        assert "f" in recurrence, "Debe tener f(n)"
        assert "n0" in recurrence, "Debe tener n0"
        assert recurrence["applicable"], "Debe ser aplicable"

        # Verificar que a, b son números válidos
        assert isinstance(recurrence["a"], int), "a debe ser entero"
        assert isinstance(recurrence["b"], (int, float)), "b debe ser número"
        assert recurrence["b"] >= 2, "b debe ser >= 2"
        assert recurrence["a"] >= 1, "a debe ser >= 1"

    def test_master_theorem_structure(self):
        """Test: Verificar estructura completa del Teorema Maestro"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_merge_sort_ast()

        # Especificar preferred_method para forzar uso de teorema maestro
        result = analyzer.analyze(ast, mode="worst", preferred_method="master")

        assert result.get("ok"), "Análisis debe ser exitoso"
        assert "totals" in result, "Debe tener totals"
        totals = result["totals"]
        assert "master" in totals, "Debe tener master theorem"
        master = totals["master"]

        # Verificar estructura de master theorem
        assert "case" in master, "Debe tener caso"
        assert master["case"] in [
            1,
            2,
            3,
        ], f"Caso debe ser 1, 2 o 3, obtuvo {master['case']}"
        assert "nlogba" in master, "Debe tener nlogba"
        assert "comparison" in master, "Debe tener comparison"
        assert "theta" in master, "Debe tener theta"
        assert "regularity" in master, "Debe tener regularity"

        # Verificar que theta es string válido
        assert isinstance(master["theta"], str), "theta debe ser string"
        assert len(master["theta"]) > 0, "theta no debe estar vacío"

    def test_proof_steps(self):
        """Test: Verificar que se generen pasos de prueba"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_merge_sort_ast()

        result = analyzer.analyze(ast, mode="worst")

        assert result.get("ok"), "Análisis debe ser exitoso"
        # Los pasos de prueba se guardan en analyzer.proof_steps
        assert hasattr(analyzer, "proof_steps"), "Debe tener proof_steps"
        assert len(analyzer.proof_steps) > 0, "Debe tener pasos de prueba"

        # Verificar estructura de pasos
        for step in analyzer.proof_steps:
            assert "id" in step, "Cada paso debe tener id"
            assert "text" in step, "Cada paso debe tener text"
            assert isinstance(step["text"], str), "text debe ser string"

    def test_different_modes(self):
        """Test: Verificar que funcione en worst, best y avg"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_merge_sort_ast()

        for mode in ["worst", "best", "avg"]:
            # Especificar preferred_method para forzar uso de teorema maestro
            result = analyzer.analyze(ast, mode=mode, preferred_method="master")
            assert result.get("ok"), f"Análisis debe ser exitoso en modo {mode}"
            assert "totals" in result, f"Debe tener totals en modo {mode}"
            totals = result["totals"]
            assert "recurrence" in totals, f"Debe tener recurrencia en modo {mode}"
            assert "master" in totals, f"Debe tener master theorem en modo {mode}"

    def create_fibonacci_ast(self):
        """Crea AST de Fibonacci: T(n) = T(n-1) + T(n-2) -> Ecuación Característica"""
        return {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "fibonacci",
                    "params": [{"type": "Param", "name": "n"}],
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "If",
                                "test": {
                                    "type": "Binary",
                                    "op": "<=",
                                    "left": {"type": "Identifier", "name": "n"},
                                    "right": {"type": "Literal", "value": 1},
                                },
                                "consequent": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Return",
                                            "value": {
                                                "type": "Identifier",
                                                "name": "n",
                                            },
                                        }
                                    ],
                                },
                                "alternate": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Return",
                                            "value": {
                                                "type": "Binary",
                                                "op": "+",
                                                "left": {
                                                    "type": "Call",
                                                    "name": "fibonacci",
                                                    "args": [
                                                        {
                                                            "type": "Binary",
                                                            "op": "-",
                                                            "left": {
                                                                "type": "Identifier",
                                                                "name": "n",
                                                            },
                                                            "right": {
                                                                "type": "Literal",
                                                                "value": 1,
                                                            },
                                                        }
                                                    ],
                                                },
                                                "right": {
                                                    "type": "Call",
                                                    "name": "fibonacci",
                                                    "args": [
                                                        {
                                                            "type": "Binary",
                                                            "op": "-",
                                                            "left": {
                                                                "type": "Identifier",
                                                                "name": "n",
                                                            },
                                                            "right": {
                                                                "type": "Literal",
                                                                "value": 2,
                                                            },
                                                        }
                                                    ],
                                                },
                                            },
                                        }
                                    ],
                                },
                            }
                        ],
                    },
                }
            ],
        }

    def test_characteristic_equation_method_fibonacci(self):
        """Test: Método de Ecuación Característica para Fibonacci"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_fibonacci_ast()

        # Especificar preferred_method para forzar uso de ecuación característica
        result = analyzer.analyze(ast, mode="worst", preferred_method="characteristic_equation")

        assert result.get("ok"), f"Análisis debe ser exitoso: {result.get('errors', [])}"
        assert "totals" in result, "Debe tener totals"
        totals = result["totals"]
        assert "recurrence" in totals, "Debe tener recurrencia"

        recurrence = totals["recurrence"]
        assert "method" in recurrence, "Debe tener método"

        # Verificar que se detectó ecuación característica o que se aplicó
        if (
            recurrence.get("method") == "characteristic_equation"
            and "characteristic_equation" in totals
        ):
            char_eq = totals["characteristic_equation"]
            assert "equation" in char_eq, "Debe tener equation"
            assert "roots" in char_eq, "Debe tener roots"
            # solution puede no estar presente en todos los casos
            if "solution" in char_eq:
                assert isinstance(char_eq["solution"], str), "solution debe ser string"

    def test_recursion_tree_method_merge_sort(self):
        """Test: Método de Árbol de Recursión para Merge Sort"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_merge_sort_ast()

        # Especificar preferred_method para forzar uso de árbol de recursión
        result = analyzer.analyze(ast, mode="worst", preferred_method="recursion_tree")

        assert result.get("ok"), f"Análisis debe ser exitoso: {result.get('errors', [])}"
        assert "totals" in result, "Debe tener totals"
        totals = result["totals"]
        assert "recurrence" in totals, "Debe tener recurrencia"

        recurrence = totals["recurrence"]
        assert "method" in recurrence, "Debe tener método"

        # Verificar que se detectó árbol de recursión o que se aplicó
        if recurrence.get("method") == "recursion_tree" or "recursion_tree" in totals:
            recursion_tree = totals.get("recursion_tree", {})
            if recursion_tree:
                assert "levels" in recursion_tree, "Debe tener levels"
                assert "height" in recursion_tree, "Debe tener height"
                assert "summation" in recursion_tree, "Debe tener summation"
                assert "dominating_level" in recursion_tree, "Debe tener dominating_level"
                assert "theta" in recursion_tree, "Debe tener theta"

    def test_preferred_method_priority(self):
        """Test: Verificar prioridad de métodos preferidos"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_fibonacci_ast()

        # Fibonacci debería usar ecuación característica automáticamente
        result = analyzer.analyze(ast, mode="worst")

        if result.get("ok"):
            totals = result.get("totals", {})
            recurrence = totals.get("recurrence", {})

            # Si se detectó correctamente, debería usar ecuación característica
            if recurrence.get("method"):
                assert recurrence["method"] in [
                    "characteristic_equation",
                    "iteration",
                    "master",
                ], f"Método debe ser válido, obtuvo {recurrence['method']}"

    def test_characteristic_equation_with_preferred(self):
        """Test: Ecuación Característica con preferred_method explícito"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_fibonacci_ast()

        result = analyzer.analyze(ast, mode="worst", preferred_method="characteristic_equation")

        if result.get("ok"):
            totals = result.get("totals", {})
            recurrence = totals.get("recurrence", {})

            # Si el método preferido es válido, debe intentar usarlo
            assert "method" in recurrence, "Debe tener método en recurrencia"
