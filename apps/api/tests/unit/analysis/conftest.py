import pytest


def pytest_collection_modifyitems(items):
    for item in items:
        item.add_marker(pytest.mark.fast)
        item.add_marker(pytest.mark.unit)
