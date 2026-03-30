import pytest

from app.modules.analysis.service import detect_methods

pytestmark = [pytest.mark.contract, pytest.mark.recursive]

SOURCE = """factorial(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN 1;
  END
  RETURN n * factorial(n - 1);
END
"""


def test_detect_methods_contract():
    result = detect_methods(SOURCE, algorithm_kind="recursive")
    assert result.get("ok"), result.get("errors", [])
    assert isinstance(result.get("applicable_methods", []), list)
    assert "default_method" in result
