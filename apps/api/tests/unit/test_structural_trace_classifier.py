"""
Tests para StructuralTraceClassifier.

Valida clasificación por morfología: iterative, tail_recursive, binary_branch, etc.

Author: AALIE - Plan Sistema Traza Estructural
Version: 0.1.0
"""
import pytest

from app.modules.execution.derivations.structural_trace_classifier import (
    StructuralTraceClassification,
    classify_structural_trace,
)


@pytest.mark.unit
class TestStructuralTraceClassifier:
    """Tests para classify_structural_trace."""

    def test_iterative_trace_returns_generic_iterative(self):
        """Traza iterativa sin recursión -> generic_iterative."""
        trace = {
            "kind": "iterative",
            "steps": [
                {"kind": "assign", "line": 1},
                {"kind": "loop_enter", "line": 2},
                {"kind": "loop_iter_enter", "line": 2},
            ],
            "recursionTree": None,
            "callTreeSource": None,
        }
        result = classify_structural_trace(trace)
        assert isinstance(result, StructuralTraceClassification)
        assert result.patternKind == "generic_iterative"
        assert result.confidence in ("high", "medium", "low")
        assert isinstance(result.evidence, list)

    def test_factorial_recursive_returns_tail_or_binary(self):
        """Factorial recursivo: tail_recursive_linear o binary_branch según implementación."""
        trace = {
            "kind": "recursive",
            "steps": [],
            "recursionTree": {
                "calls": [
                    {"id": "c1", "children": ["c2"], "params": {"n": 4}},
                    {"id": "c2", "children": ["c3"], "params": {"n": 3}},
                    {"id": "c3", "children": [], "params": {"n": 1}, "is_base_case": True},
                ],
                "root_calls": ["c1"],
            },
        }
        result = classify_structural_trace(trace)
        assert isinstance(result, StructuralTraceClassification)
        assert result.patternKind in (
            "tail_recursive_linear",
            "binary_branch_recursive",
            "generic_recursive",
        )

    def test_fibonacci_recursive_returns_binary_branch(self):
        """Fibonacci con 2 subllamadas -> binary_branch_recursive."""
        trace = {
            "kind": "recursive",
            "steps": [],
            "recursionTree": {
                "calls": [
                    {"id": "c1", "children": ["c2", "c3"], "params": {"n": 4}},
                    {"id": "c2", "children": [], "params": {"n": 2}},
                    {"id": "c3", "children": [], "params": {"n": 1}},
                ],
                "root_calls": ["c1"],
            },
        }
        result = classify_structural_trace(trace)
        assert isinstance(result, StructuralTraceClassification)
        assert result.patternKind in ("binary_branch_recursive", "generic_recursive")

    def test_empty_trace_returns_unknown(self):
        """Traza vacía o sin información -> unknown o generic_iterative."""
        trace = {"kind": "unknown", "steps": [], "recursionTree": None}
        result = classify_structural_trace(trace)
        assert isinstance(result, StructuralTraceClassification)
        assert result.patternKind in ("generic_iterative", "unknown")
