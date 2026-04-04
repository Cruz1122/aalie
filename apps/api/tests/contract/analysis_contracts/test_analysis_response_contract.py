import pytest

from app.modules.analysis.service import analyze_algorithm
from tests._shared.helpers.contract_asserts import (
    assert_case_shape,
    assert_contract_shape,
)

pytestmark = [pytest.mark.contract]

SOURCE = """linear(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    x <- i;
  END
END
"""


def test_analyze_open_response_contract_all_mode():
    result = analyze_algorithm(SOURCE, mode="all")
    assert result.get("ok"), result.get("errors", [])
    assert_contract_shape(result, {"ok", "worst", "best", "avg", "loopInvariant"})
    assert_case_shape(result["worst"])
