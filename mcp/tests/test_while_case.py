from __future__ import annotations

from pathlib import Path

from tools.evaluate_while_case import evaluate_while_case

ROOT = Path(__file__).resolve().parents[2]
ALGOS = ROOT / "apps" / "api" / "tests" / "_support" / "algorithms" / "math"


def _read(name: str) -> str:
    return (ALGOS / name).read_text(encoding="utf-8")


def test_evaluate_while_case_recognizes_linear_counter_with_strong_evidence():
    result = evaluate_while_case(_read("while_linear.txt"))

    assert result["ok"] is True
    assert result["pattern_detected"] == "linear_counter"
    assert result["status"] == "bounded"
    assert result["evidence_level"] == "strong"
    assert result["ambiguity"] is False


def test_evaluate_while_case_recognizes_logarithmic_pattern_with_strong_evidence():
    result = evaluate_while_case(_read("while_log.txt"))

    assert result["ok"] is True
    assert result["pattern_detected"] == "geometric_growth"
    assert result["status"] == "bounded"
    assert result["evidence_level"] == "strong"
    assert result["asymptotic_class"] == "O(log n)"


def test_evaluate_while_case_recognizes_euclid_mod_with_controller():
    result = evaluate_while_case(_read("euclides.txt"))

    assert result["ok"] is True
    assert result["pattern_detected"] == "euclid_mod"
    assert result["dominant_controller"] == "b"
    assert result["evidence_level"] == "strong"


def test_evaluate_while_case_flags_ambiguous_two_variable_case_without_guessing():
    source = """weird(n, m) BEGIN
  i <- 0;
  j <- m;
  WHILE (i < n OR j > 0) DO BEGIN
    i <- i + j;
    j <- j - i;
  END
END"""

    result = evaluate_while_case(source)

    assert result["ok"] is True
    assert result["status"] == "unknown"
    assert result["ambiguity"] is True
    assert result["evidence_level"] == "weak"


def test_evaluate_while_case_treats_out_of_coverage_loop_as_non_conclusive():
    source = """stuck(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    x <- x + 1;
  END
END"""

    result = evaluate_while_case(source)

    assert result["ok"] is True
    assert result["status"] in {"unknown", "unbounded"}
    assert result["evidence_level"] in {"weak", "contradictory"}
    assert result["pattern_detected"] is None
