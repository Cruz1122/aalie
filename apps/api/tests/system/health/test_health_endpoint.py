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
