import pytest

from app.modules.analysis.service import analyze_algorithm, detect_methods
from tests._shared.helpers.analysis_oracle import assert_analysis_oracle

pytestmark = [pytest.mark.contract, pytest.mark.oracle, pytest.mark.recursive]

SINGLE_BRANCH = """sumToN(n) BEGIN
  IF (n <= 0) THEN BEGIN
    RETURN 0;
  END
  RETURN sumToN(n - 1) + n;
END
"""

SPARSE_LINEAR_SHIFT = """sparseRec(n) BEGIN
  IF (n <= 3) THEN BEGIN
    RETURN 1;
  END
  RETURN sparseRec(n - 1) + sparseRec(n - 4);
END
"""

DIVIDE_AND_CONQUER = """mergeSort(A, izq, der) BEGIN
  IF (izq < der) THEN BEGIN
    medio <- (izq + der) / 2;
    CALL mergeSort(A, izq, medio);
    CALL mergeSort(A, medio + 1, der);
    CALL merge(A, izq, medio, der);
  END
END
"""


def test_recursive_matrix_single_branch_oracle():
    result = analyze_algorithm(SINGLE_BRANCH, mode="all", preferred_method="iteration")
    assert_analysis_oracle(
        result,
        expected_worst="linear",
        expected_best="linear",
        expected_avg="linear",
        name="single_branch_sum_to_n",
    )


def test_recursive_matrix_sparse_shift_contract_statuses():
    result = detect_methods(SPARSE_LINEAR_SHIFT, algorithm_kind="recursive")
    assert result.get("ok"), result.get("errors", [])
    assert result.get("default_method") == "characteristic_equation"
    assert result.get("applicable_methods") == ["characteristic_equation"]
    recurrence = result.get("recurrence_info", {})
    assert recurrence.get("type") == "linear_shift"
    dp_validation = recurrence.get("dp_validation", {})
    assert dp_validation.get("status") == "clear"
    assert dp_validation.get("primary_pattern") == "tabulation"
    assert dp_validation.get("supported_patterns") == ["tabulation", "memoization"]


def test_recursive_matrix_detect_methods_contract_fields():
    result = analyze_algorithm(
        SPARSE_LINEAR_SHIFT,
        mode="worst",
        preferred_method="characteristic_equation",
    )
    assert result.get("ok"), result.get("errors", [])
    totals = result.get("totals", {})
    recurrence = totals.get("recurrence", {})
    characteristic = totals.get("characteristic_equation", {})
    assert recurrence.get("type") == "linear_shift"
    assert recurrence.get("method") == "characteristic_equation"
    assert characteristic.get("method") == "characteristic_equation"
    assert characteristic.get("theta") is not None
    bundle = characteristic.get("step_by_step", {})
    assert bundle.get("method") == "characteristic_equation"
    assert bundle.get("version") == "ceq_steps_v1"
    assert bundle.get("overallStatus") == "partial"
    assert len(bundle.get("steps", [])) == 12


def test_recursive_matrix_divide_conquer_method_metadata():
    result = detect_methods(DIVIDE_AND_CONQUER, algorithm_kind="recursive")
    assert result.get("ok"), result.get("errors", [])
    assert result.get("default_method") == "master"
    assert result.get("applicable_methods") == ["master", "recursion_tree", "iteration"]
    recurrence = result.get("recurrence_info", {})
    assert recurrence.get("type") == "divide_conquer"
    assert recurrence.get("dp_validation", {}).get("primary_pattern") == "divide_and_conquer"
