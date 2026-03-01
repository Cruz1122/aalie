"""
Contract tests para algoritmos de estrés (Prueba1–Prueba7).
Suelen exponer fallos como "cannot find subproblems" o análisis incorrecto.
Objetivo: que el analizador no falle y, cuando sea posible, devuelva complejidad coherente.
"""
import pytest
from app.modules.analysis.service import analyze_algorithm
from tests._support.loaders import load_algorithm

STRESS_ALGORITHMS = [
    ("stress", "prueba1"),
    ("stress", "prueba2"),
    ("stress", "prueba3"),
    ("stress", "prueba4"),
    ("stress", "prueba5"),
    ("stress", "prueba6"),
    ("stress", "prueba7"),
]


@pytest.mark.contract
@pytest.mark.parametrize("family,name", STRESS_ALGORITHMS, ids=[f"{f}/{n}" for f, n in STRESS_ALGORITHMS])
def test_stress_algorithm_parses_and_analyzes(family, name):
    """Cada algoritmo de estrés carga, parsea y el analizador se ejecuta sin excepción."""
    source = load_algorithm(family, name)
    result = analyze_algorithm(source, mode="all")
    assert "ok" in result, "El servicio debe devolver clave 'ok'"
    if not result.get("ok"):
        pytest.fail(f"{family}/{name}: analizador falló: {result.get('errors', [])}")
