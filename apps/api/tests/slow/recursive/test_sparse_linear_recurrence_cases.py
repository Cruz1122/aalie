import pytest

from app.modules.analysis.service import analyze_algorithm

pytestmark = [pytest.mark.slow, pytest.mark.recursive]

SOURCE = """sparseRec(n) BEGIN
    IF (n <= 3) THEN BEGIN
        RETURN 1;
    END
    RETURN sparseRec(n - 1) + sparseRec(n - 4);
END
"""


def test_sparse_linear_recurrence_heavy_case_still_supported():
    result = analyze_algorithm(
        SOURCE, mode="worst", preferred_method="characteristic_equation"
    )
    assert result.get("ok"), result.get("errors", [])
