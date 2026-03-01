"""
Contract tests: parametrizados por algoritmo + spec desde _support/algorithms y _support/expectations.
Para nightly o ejecución completa; no obligatorio en daily gate.
"""
import pytest
from app.modules.analysis.service import analyze_algorithm
from tests._support.assertions import assert_complexity_class
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
    expected_worst = spec.get("worst", "linear")
    # Act
    result = analyze_algorithm(source, mode="all")
    # Assert
    assert result.get("ok"), result.get("errors", [])
    assert_complexity_class(result, "worst", expected_worst, name=f"{family}/{name}")
