import pytest

from app.modules.analysis.service import analyze_algorithm
from tests._shared.fixtures.algorithm_loader import load_algorithm
from tests._shared.helpers.analysis_oracle import assert_analysis_oracle

pytestmark = [pytest.mark.contract, pytest.mark.oracle, pytest.mark.iterative]


@pytest.mark.parametrize(
    "family,name,worst,best",
    [
        ("math", "linear_search", "linear", "constant"),
        ("sorting", "insertion_sort", "quadratic", "linear"),
        ("sorting", "bubble_sort", "quadratic", "quadratic"),
    ],
)
def test_iterative_oracle_algorithms(family, name, worst, best):
    source = load_algorithm(family, name)
    result = analyze_algorithm(source, mode="all")
    assert_analysis_oracle(
        result, expected_worst=worst, expected_best=best, expected_avg=worst, name=name
    )
