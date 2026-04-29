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
from app.modules.execution.derivations.structured_trace_models import (
    StructuredTraceRenderConfig,
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
                    {
                        "id": "c3",
                        "children": [],
                        "params": {"n": 1},
                        "is_base_case": True,
                    },
                ],
                "root_calls": ["c1"],
            },
        }
        result = build_structured_trace_result(trace)
        assert result["graph"]["nodes"]
        assert all(node.get("type") != "output" for node in result["graph"]["nodes"])
        depths = [node.get("data", {}).get("depth") for node in result["graph"]["nodes"]]
        assert any(depth == 0 for depth in depths)
        node_types = {node.get("data", {}).get("nodeType") for node in result["graph"]["nodes"]}
        assert "call" in node_types or "base_return" in node_types
        assert any(node.get("data", {}).get("phase") for node in result["graph"]["nodes"])
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

    def test_recursive_locale_es_localizes_final_label(self):
        """Locale es debe reflejar etiquetas localizadas en el nodo de llamada."""
        trace = {
            "kind": "recursive",
            "steps": [],
            "recursionTree": {
                "calls": [
                    {
                        "id": "c1",
                        "children": [],
                        "function_name": "mergeSort",
                        "params": {"A": [3, 2, 1]},
                        "final_params": {"A": [1, 2, 3]},
                    }
                ],
                "root_calls": ["c1"],
            },
        }
        result = build_structured_trace_result(
            trace, StructuredTraceRenderConfig(locale="es")
        )
        labels = [n.get("data", {}).get("label", "") for n in result["graph"]["nodes"]]
        joined = "\n".join(labels)
        assert "estado final" in joined
