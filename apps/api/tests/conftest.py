# Fixtures compartidas a nivel tests/.
# Author: AALIE reform
# Version: 0.1.0


def pytest_configure(config):
    """Registra markers para evitar PytestUnknownMarkWarning cuando pyproject no se carga."""
    config.addinivalue_line(
        "markers", "unit: unit tests (fast, isolated)"
    )
    config.addinivalue_line(
        "markers", "component: component/integration tests (few canonical algorithms)"
    )
    config.addinivalue_line(
        "markers", "contract: contract/regression tests (many parametrized cases)"
    )
    config.addinivalue_line(
        "markers", "system: system/HTTP endpoint tests"
    )
    config.addinivalue_line(
        "markers", "slow: slow tests (e.g. heavy SymPy)"
    )
    config.addinivalue_line(
        "markers", "while: tests involving WHILE loops"
    )
    config.addinivalue_line(
        "markers", "recursive: tests involving recursive analysis"
    )
    config.addinivalue_line(
        "markers", "dp: tests involving DP algorithms"
    )
