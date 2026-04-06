from __future__ import annotations

import importlib.util
from pathlib import Path

# Fixtures compartidas a nivel tests/.
# Author: AALIE reform
# Version: 0.1.0


def pytest_configure(config):
    """Registra markers para evitar PytestUnknownMarkWarning cuando pyproject no se carga."""
    config.addinivalue_line("markers", "fast: fast lane tests for PR feedback")
    config.addinivalue_line(
        "markers", "oracle: semantic oracle tests (real expected output)"
    )
    config.addinivalue_line("markers", "unit: unit tests (fast, isolated)")
    config.addinivalue_line(
        "markers", "component: component/integration tests (few canonical algorithms)"
    )
    config.addinivalue_line(
        "markers", "contract: contract/regression tests (many parametrized cases)"
    )
    config.addinivalue_line("markers", "system: system/HTTP endpoint tests")
    config.addinivalue_line("markers", "slow: slow tests (e.g. heavy SymPy)")
    config.addinivalue_line("markers", "stress: stress/integration heavy tests")
    config.addinivalue_line("markers", "export: export contract/integration tests")
    config.addinivalue_line("markers", "trace: trace/structured-trace tests")
    config.addinivalue_line("markers", "iterative: tests involving iterative analysis")
    config.addinivalue_line(
        "markers", "while_loop: tests involving while-loop analysis"
    )
    config.addinivalue_line("markers", "while: tests involving WHILE loops")
    config.addinivalue_line(
        "markers",
        "while_domain: tests del dominio WHILE (engine, patrones, metamórficos)",
    )
    config.addinivalue_line("markers", "recursive: tests involving recursive analysis")
    config.addinivalue_line("markers", "dp: tests involving DP algorithms")
    config.addinivalue_line(
        "markers", "benchmark: performance/regression benchmark tests"
    )
    config.addinivalue_line(
        "markers",
        "regression: síntomas explícitos de informes / catálogo (no duplicar oráculos)",
    )


def pytest_ignore_collect(collection_path: Path, config) -> bool:  # type: ignore[override]
    """
    Permite correr lanes no-export en entornos sin reportlab.
    Sin esto, importar app.main rompe la recolección completa.
    """
    has_reportlab = importlib.util.find_spec("reportlab") is not None
    if has_reportlab:
        return False

    path_str = str(collection_path)
    reportlab_bound_paths = (
        "/tests/system/",
        "/tests/unit/export/",
        "/tests/slow/export/",
        "/tests/benchmark/test_export_benchmark.py",
        "/tests/contract/trace_contracts/",
    )
    return any(fragment in path_str for fragment in reportlab_bound_paths)
