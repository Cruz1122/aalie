"""
Tests para builders de StructuredTraceView.

Valida que cada builder produzca nodes y edges válidos.

Author: AALIE - Plan Sistema Traza Estructural
Version: 0.1.0
"""
import pytest

from app.modules.execution.derivations.structured_trace_builder import (
    build_structured_trace_result,
)


@pytest.mark.unit
class TestStructuredTraceBuilders:
    """Tests para build_structured_trace_result."""

    def test_iterative_trace_produces_graph(self):
        """Traza iterativa produce grafo con nodos."""
        trace = {
            "kind": "iterative",
            "steps": [
                {"id": "s1", "kind": "assign", "line": 1, "variables": {"i": 0}},
                {"id": "s2", "kind": "loop_enter", "line": 2, "variables": {"i": 0}},
            ],
            "recursionTree": None,
        }
        result = build_structured_trace_result(trace)
        assert "patternKind" in result
        assert "graph" in result
        assert "classification" in result
        assert "nodes" in result["graph"]
        assert "edges" in result["graph"]
        assert isinstance(result["graph"]["nodes"], list)
        assert isinstance(result["graph"]["edges"], list)

    def test_recursive_factorial_produces_graph(self):
        """Factorial recursivo produce grafo con nodos y edges."""
        trace = {
            "kind": "recursive",
            "steps": [],
            "recursionTree": {
                "calls": [
                    {"id": "c1", "children": ["c2"], "params": {"n": 3}},
                    {"id": "c2", "children": ["c3"], "params": {"n": 2}},
                    {"id": "c3", "children": [], "params": {"n": 1}, "is_base_case": True},
                ],
                "root_calls": ["c1"],
            },
        }
        result = build_structured_trace_result(trace)
        assert result["graph"]["nodes"]
        assert result["patternKind"] in (
            "tail_recursive_linear",
            "binary_branch_recursive",
            "generic_recursive",
        )

    def test_empty_trace_no_crash(self):
        """Traza mínima no causa crash."""
        trace = {"kind": "unknown", "steps": [], "recursionTree": None}
        result = build_structured_trace_result(trace)
        assert "graph" in result
        assert "patternKind" in result
