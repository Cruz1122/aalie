from __future__ import annotations

from pathlib import Path

from tools.detect_recursive_family import detect_recursive_family

ROOT = Path(__file__).resolve().parents[2]
ALGOS = ROOT / "apps" / "api" / "tests" / "_support" / "algorithms"


def _read(relative_path: str) -> str:
    return (ALGOS / relative_path).read_text(encoding="utf-8")


def test_detect_recursive_family_for_merge_sort_prefers_master():
    result = detect_recursive_family(_read("divide_conquer/merge_sort.txt"))

    assert result["ok"] is True
    assert result["family"] == "divide_conquer"
    assert result["default_method"] == "master"
    assert "master" in result["applicable_methods"]


def test_detect_recursive_family_for_binary_search_keeps_divide_and_conquer():
    result = detect_recursive_family(
        _read("divide_conquer/binary_search_recursive.txt")
    )

    assert result["ok"] is True
    assert result["family"] == "divide_conquer"
    assert "recursion_tree" in result["applicable_methods"]


def test_detect_recursive_family_for_factorial_prefers_characteristic_equation():
    source = """factorial(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN 1;
  END
  RETURN n * factorial(n - 1);
END"""

    result = detect_recursive_family(source)

    assert result["ok"] is True
    assert result["family"] == "linear_shift"
    assert result["default_method"] == "characteristic_equation"


def test_detect_recursive_family_for_fibonacci_returns_linear_shift():
    source = """fibonacci(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN n;
  END
  RETURN fibonacci(n - 1) + fibonacci(n - 2);
END"""

    result = detect_recursive_family(source)

    assert result["ok"] is True
    assert result["family"] == "linear_shift"
    assert result["status"] == "available"


def test_detect_recursive_family_reports_non_recursive_source_as_unsupported():
    source = """suma(n) BEGIN
  s <- 0;
  FOR i <- 1 TO n DO BEGIN
    s <- s + i;
  END
  RETURN s;
END"""

    result = detect_recursive_family(source)

    assert result["ok"] is True
    assert result["status"] == "unsupported"
    assert result["default_method"] is None
