"""Tests tipo oráculo para call_tree_builder."""
import pytest

from app.modules.execution.call_tree_builder import build_call_tree


def test_empty_recursion_tree_returns_empty_diagram():
    """recursionTree vacío produce diagrama vacío."""
    result = build_call_tree({"calls": [], "root_calls": []})
    assert result.diagramKind == "call_tree"
    assert len(result.graph.nodes) == 0
    assert len(result.graph.edges) == 0


def test_single_call_produces_one_node():
    """Una llamada produce un nodo."""
    rt = {
        "calls": [
            {
                "id": "call_1",
                "depth": 0,
                "params": {"n": 4},
                "children": [],
                "function_name": "factorial",
            }
        ],
        "root_calls": ["call_1"],
    }
    result = build_call_tree(rt)
    assert result.diagramKind == "call_tree"
    assert len(result.graph.nodes) == 1
    assert len(result.graph.edges) == 0
    assert "factorial" in result.graph.nodes[0].data.label
    assert "4" in result.graph.nodes[0].data.label  # formato funcion(a, b, c)


def test_parent_child_produces_two_nodes_one_edge():
    """Padre e hijo producen dos nodos y una arista."""
    rt = {
        "calls": [
            {
                "id": "call_1",
                "depth": 0,
                "params": {"n": 4},
                "children": ["call_2"],
                "function_name": "factorial",
            },
            {
                "id": "call_2",
                "depth": 1,
                "params": {"n": 3},
                "children": [],
                "function_name": "factorial",
            },
        ],
        "root_calls": ["call_1"],
    }
    result = build_call_tree(rt)
    assert len(result.graph.nodes) == 2
    assert len(result.graph.edges) == 1
    assert result.graph.edges[0].source == "call_call_1"
    assert result.graph.edges[0].target == "call_call_2"
