import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


def test_llm_status_endpoint_returns_contract(monkeypatch):
    monkeypatch.delenv("API_KEY", raising=False)

    res = client.get("/llm/status")

    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    assert "status" in payload
    assert "jobs" in payload["status"]
    assert payload["status"]["apiKey"]["serverAvailable"] is False


def test_llm_status_detects_server_api_key(monkeypatch):
    monkeypatch.setenv("API_KEY", "AIzaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")

    res = client.get("/llm/status")

    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    assert payload["status"]["apiKey"]["serverAvailable"] is True
