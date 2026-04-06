import pytest

from app.modules.analysis.service import analyze_algorithm
from tests._shared.helpers.analysis_oracle import assert_analysis_oracle

pytestmark = [pytest.mark.contract, pytest.mark.oracle, pytest.mark.recursive]

FACTORIAL = """factorial(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN 1;
  END
  RETURN n * factorial(n - 1);
END
"""

MERGE_SORT = """mergeSort(A, izq, der) BEGIN
  IF (izq < der) THEN BEGIN
    medio <- (izq + der) / 2;
    CALL mergeSort(A, izq, medio);
    CALL mergeSort(A, medio + 1, der);
    CALL merge(A, izq, medio, der);
  END
END
"""


def test_recursive_oracle_factorial():
    result = analyze_algorithm(FACTORIAL, mode="all", preferred_method="iteration")
    assert_analysis_oracle(
        result,
        expected_worst="linear",
        expected_best="linear",
        expected_avg="linear",
        name="factorial",
    )


def test_recursive_oracle_merge_sort():
    result = analyze_algorithm(MERGE_SORT, mode="all", preferred_method="master")
    assert_analysis_oracle(
        result,
        expected_worst="nlogn",
        expected_best="nlogn",
        expected_avg="nlogn",
        name="merge_sort",
    )
