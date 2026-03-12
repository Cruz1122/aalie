"""Tests tipo oráculo para execution_diagram_builder."""
import pytest

from app.modules.execution.execution_diagram_builder import build_execution_diagram


def test_empty_trace_returns_empty_diagram():
    """Traza vacía produce diagrama vacío."""
    result = build_execution_diagram({"steps": []})
    assert result.diagramKind == "execution_diagram"
    assert len(result.graph.nodes) == 0
    assert len(result.graph.edges) == 0


def test_single_step_produces_one_node():
    """Un paso produce un nodo sin aristas."""
    trace = {
        "steps": [
            {
                "step_number": 1,
                "kind": "assign",
                "description": "i = 0",
                "variables": {"i": 0},
            }
        ]
    }
    result = build_execution_diagram(trace)
    assert result.diagramKind == "execution_diagram"
    assert len(result.graph.nodes) == 1
    assert len(result.graph.edges) == 0
    assert result.graph.nodes[0].data.label


def test_three_steps_produce_three_nodes_two_edges():
    """Tres pasos producen tres nodos y dos aristas."""
    trace = {
        "steps": [
            {"step_number": 1, "kind": "assign", "description": "i = 0", "variables": {}},
            {
                "step_number": 2,
                "kind": "condition_eval",
                "description": "i < n",
                "variables": {},
                "decision": {"conditionText": "i < n", "result": True},
            },
            {"step_number": 3, "kind": "assign", "description": "i = i + 1", "variables": {}},
        ]
    }
    result = build_execution_diagram(trace)
    assert len(result.graph.nodes) == 3
    assert len(result.graph.edges) == 2


def test_condition_eval_label_includes_si_no():
    """condition_eval con decision produce label Sí/No."""
    trace = {
        "steps": [
            {
                "step_number": 1,
                "kind": "condition_eval",
                "description": "x",
                "variables": {},
                "decision": {"conditionText": "x > 0", "result": True},
            }
        ]
    }
    result = build_execution_diagram(trace)
    assert len(result.graph.nodes) == 1
    assert "Sí" in result.graph.nodes[0].data.label or "True" in result.graph.nodes[0].data.label
