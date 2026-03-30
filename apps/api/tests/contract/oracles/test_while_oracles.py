import pytest

from app.modules.analysis.service import analyze_algorithm
from tests._shared.fixtures.algorithm_loader import load_algorithm
from tests._shared.helpers.analysis_oracle import assert_analysis_oracle

pytestmark = [pytest.mark.contract, pytest.mark.oracle, pytest.mark.while_loop]


@pytest.mark.parametrize(
    "name,worst",
    [
        ("while_linear", "linear"),
        ("while_log", "log"),
        ("euclides", "log"),
    ],
)
def test_while_oracle_algorithms(name, worst):
    source = load_algorithm("math", name)
    result = analyze_algorithm(source, mode="all")
    assert_analysis_oracle(
        result, expected_worst=worst, expected_best=worst, expected_avg=worst, name=name
    )
