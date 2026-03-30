"""
Contract tests para algoritmos de estrés (Prueba1–Prueba7).
Suelen exponer fallos como "cannot find subproblems" o análisis incorrecto.
Objetivo: que el analizador no falle y, cuando exista spec, validar todos los casos (worst, best, avg).
"""

from pathlib import Path

import pytest

from app.modules.analysis.service import analyze_algorithm
from tests._support.assertions import assert_all_cases_complexity
from tests._support.loaders import load_algorithm, load_spec

STRESS_ALGORITHMS = [
    ("stress", "prueba1"),
    ("stress", "prueba2"),
    ("stress", "prueba3"),
    ("stress", "prueba4"),
    ("stress", "prueba5"),
    ("stress", "prueba6"),
    ("stress", "prueba7"),
]

_SUPPORT = Path(__file__).resolve().parent.parent / "_support"


@pytest.mark.contract
@pytest.mark.slow
@pytest.mark.stress
@pytest.mark.parametrize(
    "family,name", STRESS_ALGORITHMS, ids=[f"{f}/{n}" for f, n in STRESS_ALGORITHMS]
)
def test_stress_algorithm_parses_and_analyzes(family, name):
    """Cada algoritmo de estrés carga, parsea y el analizador se ejecuta; si hay spec, se validan todos los casos."""
    source = load_algorithm(family, name)
    result = analyze_algorithm(source, mode="all")
    assert "ok" in result, "El servicio debe devolver clave 'ok'"
    if not result.get("ok"):
        pytest.fail(f"{family}/{name}: analizador falló: {result.get('errors', [])}")

    spec_path = _SUPPORT / "expectations" / family / f"{name}.json"
    if spec_path.exists():
        spec = load_spec(family, name)
        assert_all_cases_complexity(
            result,
            spec.get("worst", "linear"),
            expected_best=spec.get("best"),
            expected_avg=spec.get("avg"),
            name=f"{family}/{name}",
        )
