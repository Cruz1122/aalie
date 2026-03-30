from __future__ import annotations

import importlib.util
from pathlib import Path

# Fixtures compartidas a nivel tests/.
# Author: AALIE reform
# Version: 0.1.0


def pytest_configure(config):
    """Registra markers para evitar PytestUnknownMarkWarning cuando pyproject no se carga."""
    config.addinivalue_line("markers", "fast: fast lane tests for PR feedback")
    config.addinivalue_line("markers", "oracle: semantic oracle tests (real expected output)")
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
    config.addinivalue_line("markers", "while_loop: tests involving while-loop analysis")
    config.addinivalue_line("markers", "while: tests involving WHILE loops")
    config.addinivalue_line("markers", "recursive: tests involving recursive analysis")
    config.addinivalue_line("markers", "dp: tests involving DP algorithms")
    config.addinivalue_line("markers", "benchmark: performance/regression benchmark tests")


def pytest_collection_modifyitems(items):
    """
    Lane mapping with immediate cut-over:
    - fast: unit/component/system except explicit slow/benchmark.
    - oracle: component + selected contract oracle modules.
    """
    oracle_contract_files = {
        "test_algorithms_contract.py",
        "test_recursive_algorithms.py",
        "test_while_algorithms.py",
    }

    for item in items:
        marker_names = {m.name for m in item.iter_markers()}

        if "while" in marker_names:
            item.add_marker("while_loop")
        if "trace" in str(item.fspath):
            item.add_marker("trace")
        if "export" in str(item.fspath):
            item.add_marker("export")

        if (
            {"unit", "component", "system"} & marker_names
            and "slow" not in marker_names
            and "benchmark" not in marker_names
        ):
            item.add_marker("fast")

        if "component" in marker_names:
            item.add_marker("oracle")
            item.add_marker("iterative")

        if item.fspath.basename in oracle_contract_files and "slow" not in marker_names:
            item.add_marker("oracle")


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
