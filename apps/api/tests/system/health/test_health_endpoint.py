import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


def test_health_endpoint_returns_ok_contract():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}


def test_health_endpoint_rejects_post():
    res = client.post("/health")
    assert res.status_code == 405


def test_live_endpoint_does_not_require_database():
    res = client.get("/health/live")
    assert res.status_code == 200
    assert res.json() == {"ok": True, "status": "live"}


def test_ready_endpoint_reports_postgresql_check():
    res = client.get("/health/ready")
    assert res.status_code in {200, 503}
    assert "postgresql" in res.json()["checks"]


def test_ready_endpoint_fails_when_postgresql_is_unavailable(monkeypatch):
    from app.core import database

    monkeypatch.setattr(database, "check_database_connection", lambda: False)
    res = client.get("/health/ready")

    assert res.status_code == 503
    assert res.json()["checks"]["postgresql"] is False
