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

MULTI_BRANCH = """tribonacci(n) BEGIN
  IF (n <= 2) THEN BEGIN
    RETURN n;
  END
  RETURN tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3);
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
    result = analyze_algorithm(
        SPARSE_LINEAR_SHIFT,
        mode="worst",
        preferred_method="characteristic_equation",
    )
    assert result.get("ok"), result.get("errors", [])
    totals = result.get("totals", {})
    recurrence = totals.get("recurrence", {})
    char_eq = totals.get("characteristic_equation", {})
    assert recurrence.get("type") == "linear_shift"
    assert recurrence.get("method") == "characteristic_equation"
    assert char_eq.get("status") in {"available", "partial", "unsupported", None}


def test_recursive_matrix_detect_methods_contract_fields():
    result = detect_methods(SPARSE_LINEAR_SHIFT, algorithm_kind="recursive")
    assert result.get("ok"), result.get("errors", [])
    assert isinstance(result.get("applicable_methods"), list)
    assert result.get("default_method") is not None
    assert isinstance(result.get("recurrence_info"), dict)


def test_recursive_matrix_multi_branch_step_bundle_shape():
    result = analyze_algorithm(
        MULTI_BRANCH,
        mode="worst",
        preferred_method="characteristic_equation",
    )
    assert result.get("ok"), result.get("errors", [])
    bundle = result.get("totals", {}).get("characteristic_equation", {}).get("step_by_step", {})
    assert isinstance(bundle, dict)
    if bundle:
        assert isinstance(bundle.get("steps"), list)
        assert bundle.get("method") is not None


def test_recursive_matrix_divide_conquer_method_metadata():
    result = detect_methods(DIVIDE_AND_CONQUER, algorithm_kind="recursive")
    assert result.get("ok"), result.get("errors", [])
    methods = result.get("applicable_methods", [])
    assert any(m in methods for m in ("master", "recursion_tree", "iteration"))
