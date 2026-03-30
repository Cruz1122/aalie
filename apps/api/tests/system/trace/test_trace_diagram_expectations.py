import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests._support.loaders import load_algorithm, load_trace_expectation

pytestmark = [pytest.mark.system, pytest.mark.trace]

client = TestClient(app)

TRACE_EXPECTATION_ALGORITHMS = [
    ("math", "linear_search"),
    ("math", "while_linear"),
    ("math", "while_log"),
    ("math", "euclides"),
    ("sorting", "insertion_sort"),
    ("sorting", "bubble_sort"),
]


def _assert_trace_matches_expectation(st: dict, expected: dict, name: str) -> None:
    pattern = expected.get("patternKind")
    alternatives = expected.get("patternKindAlternatives")
    actual_pattern = st.get("patternKind", "")

    if pattern is not None:
        assert (
            actual_pattern == pattern
        ), f"[{name}] Esperado patternKind {pattern!r}, obtenido {actual_pattern!r}"
    elif alternatives:
        assert (
            actual_pattern in alternatives
        ), f"[{name}] Esperado patternKind en {alternatives!r}, obtenido {actual_pattern!r}"
    else:
        raise AssertionError(
            f"[{name}] Expectativa debe definir patternKind o patternKindAlternatives"
        )

    nodes = st.get("graph", {}).get("nodes", [])
    assert len(nodes) >= expected.get("minNodes", 1)
    max_nodes = expected.get("maxNodes")
    if max_nodes is not None:
        assert len(nodes) <= max_nodes

    edges = st.get("graph", {}).get("edges", [])
    assert len(edges) >= expected.get("minEdges", 0)

    labels = [node.get("data", {}).get("label", "") for node in nodes]
    all_labels = " ".join(labels)
    for substring in expected.get("nodeLabelsContain", []):
        assert substring in all_labels


@pytest.mark.parametrize(
    "family,name",
    TRACE_EXPECTATION_ALGORITHMS,
    ids=[f"{family}/{name}" for family, name in TRACE_EXPECTATION_ALGORITHMS],
)
def test_trace_diagram_matches_expectation(family: str, name: str):
    source = load_algorithm(family, name)
    expected = load_trace_expectation(family, name)
    response = client.post(
        "/analyze/trace",
        json={
            "source": source,
            "case": expected.get("case", "worst"),
            "input_size": expected.get("input_size"),
            "initial_variables": expected.get("initial_variables"),
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload.get("ok") is True
    structured_trace = (payload.get("derived") or {}).get("structuredTrace")
    assert structured_trace is not None
    _assert_trace_matches_expectation(structured_trace, expected, f"{family}/{name}")


def test_trace_factorial_matches_expectation():
    expected = load_trace_expectation("recursive", "factorial")
    response = client.post(
        "/analyze/trace",
        json={
            "source": expected["source"],
            "case": expected.get("case", "worst"),
            "input_size": expected.get("input_size"),
            "initial_variables": expected.get("initial_variables"),
        },
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload.get("ok") is True
    structured_trace = (payload.get("derived") or {}).get("structuredTrace")
    assert structured_trace is not None
    _assert_trace_matches_expectation(structured_trace, expected, "recursive/factorial")
