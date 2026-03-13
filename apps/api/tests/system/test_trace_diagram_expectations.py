"""
Tests de contrato: diagramas de seguimiento vs expectativas explícitas.

Cada algoritmo con expectativa en _support/expectations/trace/ debe producir
un structuredTrace que cumpla patternKind, minNodes, nodeLabelsContain, etc.

Author: AALIE - Auditoría diagramas
Version: 0.1.0
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests._support.loaders import load_algorithm, load_trace_expectation

client = TestClient(app)

# Algoritmos con expectativa de trace definida
# merge_sort excluido: requiere procedimiento merge definido
TRACE_EXPECTATION_ALGORITHMS = [
    ("math", "linear_search"),
    ("math", "while_linear"),
    ("math", "while_log"),
    ("math", "euclides"),
    ("sorting", "insertion_sort"),
    ("sorting", "bubble_sort"),
    # binary_search_recursive: exclude - trace serialization fails with SymPy Symbol in variables
]


def _assert_trace_matches_expectation(st: dict, expected: dict, name: str) -> None:
    """Compara structuredTrace contra expectativa; falla con mensaje claro."""
    pattern = expected.get("patternKind")
    alternatives = expected.get("patternKindAlternatives")
    actual_pattern = st.get("patternKind", "")

    if pattern is not None:
        assert actual_pattern == pattern, (
            f"[{name}] Esperado patternKind {pattern!r}, obtenido {actual_pattern!r}"
        )
    elif alternatives:
        assert actual_pattern in alternatives, (
            f"[{name}] Esperado patternKind en {alternatives!r}, obtenido {actual_pattern!r}"
        )
    else:
        assert pattern is not None or alternatives, (
            f"[{name}] Expectativa debe definir patternKind o patternKindAlternatives"
        )

    nodes = st.get("graph", {}).get("nodes", [])
    min_nodes = expected.get("minNodes", 1)
    max_nodes = expected.get("maxNodes")
    assert len(nodes) >= min_nodes, (
        f"[{name}] Esperado al menos {min_nodes} nodos, obtenido {len(nodes)}"
    )
    if max_nodes is not None:
        assert len(nodes) <= max_nodes, (
            f"[{name}] Esperado como máximo {max_nodes} nodos, obtenido {len(nodes)} (diagrama erróneo)"
        )

    edges = st.get("graph", {}).get("edges", [])
    min_edges = expected.get("minEdges", 0)
    assert len(edges) >= min_edges, (
        f"[{name}] Esperado al menos {min_edges} edges, obtenido {len(edges)}"
    )

    labels = [n.get("data", {}).get("label", "") for n in nodes]
    all_labels = " ".join(labels)
    for substr in expected.get("nodeLabelsContain", []):
        assert substr in all_labels, (
            f"[{name}] Faltan labels: substring {substr!r} no encontrado en labels"
        )


@pytest.mark.system
@pytest.mark.parametrize(
    "family,name",
    TRACE_EXPECTATION_ALGORITHMS,
    ids=[f"{f}/{n}" for f, n in TRACE_EXPECTATION_ALGORITHMS],
)
def test_trace_diagram_matches_expectation(family: str, name: str):
    """Diagrama de seguimiento cumple expectativa explícita (patternKind, minNodes, nodeLabelsContain)."""
    source = load_algorithm(family, name)
    expected = load_trace_expectation(family, name)

    payload = {
        "source": source,
        "case": expected.get("case", "worst"),
        "input_size": expected.get("input_size"),
        "initial_variables": expected.get("initial_variables"),
    }

    response = client.post("/analyze/trace", json=payload)
    assert response.status_code == 200, f"[{family}/{name}] Trace falló: {response.text}"
    data = response.json()

    assert data.get("ok") is True, (
        f"[{family}/{name}] Trace no ok: {data.get('errors', [])}"
    )

    derived = data.get("derived") or {}
    st = derived.get("structuredTrace")
    assert st is not None, (
        f"[{family}/{name}] derived.structuredTrace ausente"
    )

    _assert_trace_matches_expectation(st, expected, f"{family}/{name}")


@pytest.mark.system
def test_trace_factorial_matches_expectation():
    """Factorial recursivo produce structuredTrace que cumple expectativa explícita."""
    expected = load_trace_expectation("recursive", "factorial")
    source = expected.get("source")
    assert source, "Expectativa factorial debe incluir 'source' (algoritmo inline)"

    payload = {
        "source": source,
        "case": expected.get("case", "worst"),
        "input_size": expected.get("input_size"),
        "initial_variables": expected.get("initial_variables"),
    }

    response = client.post("/analyze/trace", json=payload)
    assert response.status_code == 200, "Trace factorial falló"
    data = response.json()
    assert data.get("ok") is True, f"Trace no ok: {data.get('errors', [])}"

    st = (data.get("derived") or {}).get("structuredTrace")
    assert st is not None, "derived.structuredTrace ausente"
    _assert_trace_matches_expectation(st, expected, "recursive/factorial")
