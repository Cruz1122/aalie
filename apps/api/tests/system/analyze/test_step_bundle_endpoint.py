import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


def test_analyze_open_characteristic_bundle_contract():
    source = """dobleConstante(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN dobleConstante(n - 1) + dobleConstante(n - 1) + 1;
END
"""
    res = client.post(
        "/analyze/open",
        json={
            "source": source,
            "mode": "worst",
            "preferred_method": "characteristic_equation",
            "locale": "es",
        },
    )
    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    bundle = payload["totals"]["characteristic_equation"]["step_by_step"]
    assert bundle["method"] == "characteristic_equation"
    assert bundle["version"] == "ceq_steps_v1"
    assert bundle["overallStatus"] == "complete"
    assert len(bundle["steps"]) == 12


def test_analyze_open_iteration_bundle_contract():
    source = """factorial(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN n * factorial(n - 1);
END
"""
    res = client.post(
        "/analyze/open",
        json={
            "source": source,
            "mode": "worst",
            "preferred_method": "iteration",
            "locale": "es",
        },
    )
    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    bundle = payload["totals"]["iteration"]["step_by_step"]
    assert bundle["method"] == "iteration"
    assert bundle["version"] == "iter_steps_v1"
    assert bundle["overallStatus"] == "complete"
    assert len(bundle["steps"]) == 11
