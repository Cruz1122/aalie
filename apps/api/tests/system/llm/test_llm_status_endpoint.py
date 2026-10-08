import pytest
from fastapi.testclient import TestClient

from app.core.auth import IdentityClaims
from app.main import app
from app.modules.llm import service

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


def test_llm_status_endpoint_returns_contract(monkeypatch):
    monkeypatch.delenv("API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    res = client.get("/llm/status")

    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    assert "status" in payload
    assert "jobs" in payload["status"]
    assert payload["status"]["apiKey"]["serverAvailable"] is False


def test_llm_status_detects_server_api_key(monkeypatch):
    monkeypatch.setenv("API_KEY", "sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    res = client.get("/llm/status")

    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    assert payload["status"]["apiKey"]["serverAvailable"] is False
    assert payload["status"]["apiKey"]["configured"] is True
    assert payload["status"]["apiKey"]["provider"] == "openai_compatible"


def test_llm_status_exposes_server_key_to_ucaldas_identity(monkeypatch):
    monkeypatch.setenv("API_KEY", "sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    status = service.get_status_payload(
        IdentityClaims(user_id="user-1", role="USER", email="student@ucaldas.edu.co")
    )

    assert status["apiKey"]["serverAvailable"] is True
    assert status["apiKey"]["serverModel"] == "gpt-5.4-mini"
    assert set(status["jobs"].values()) == {"gpt-5.4-mini"}
