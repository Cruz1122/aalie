"""
Contract tests: parametrizados por algoritmo + spec desde _support/algorithms y _support/expectations.
Para nightly o ejecución completa; no obligatorio en daily gate.
"""
import pytest
from app.modules.analysis.service import analyze_algorithm
from tests._support.assertions import assert_complexity_class, assert_case_complexity
from tests._support.loaders import load_algorithm, load_spec

# Lista (familia, nombre) de algoritmos con spec en expectations/
CONTRACT_ALGORITHMS = [
    ("math", "fast_exponentiation"),
    # Añadir aquí los 21 algoritmos según se creen .txt y .json
]


@pytest.mark.contract
@pytest.mark.parametrize("family,name", CONTRACT_ALGORITHMS, ids=[f"{f}/{n}" for f, n in CONTRACT_ALGORITHMS])
def test_contract_algorithm_analyzes_and_matches_spec(family, name):
    # Arrange
    source = load_algorithm(family, name)
    spec = load_spec(family, name)
    # Act
    result = analyze_algorithm(source, mode="all")
    # Assert: validar worst; best/avg solo cuando la spec los define (el analizador puede no distinguirlos)
    assert result.get("ok"), result.get("errors", [])
    assert_complexity_class(result, "worst", spec.get("worst", "linear"), name=f"{family}/{name}")
    if "best" in spec:
        assert_case_complexity(result, "best", spec["best"], name=f"{family}/{name}")
    if "avg" in spec:
        assert_case_complexity(result, "avg", spec["avg"], name=f"{family}/{name}")
