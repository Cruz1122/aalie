import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.modules.llm import service

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


class FakeProvider:
    def generate_content(self, payload):
        return {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": "respuesta de prueba",
                            }
                        ]
                    }
                }
            ]
        }


class TimeoutProvider:
    def generate_content(self, payload):
        raise TimeoutError("The read operation timed out")


class RepairAliasProvider:
    def generate_content(self, payload):
        return {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": '{"codigo_corregido":"f(n) BEGIN\\n RETURN 1;\\nEND"}',
                            }
                        ]
                    }
                }
            ]
        }


class CaptureKeyProvider:
    def __init__(self):
        self.last_api_key = None

    def generate_content(self, payload):
        self.last_api_key = payload.api_key
        return {
            "candidates": [
                {
                    "content": {
                        "parts": [
                            {
                                "text": "respuesta con key capturada",
                            }
                        ]
                    }
                }
            ]
        }


def test_llm_endpoint_requires_key(monkeypatch):
    monkeypatch.delenv("API_KEY", raising=False)

    res = client.post(
        "/llm",
        json={
            "job": "general",
            "prompt": "hola",
        },
    )

    assert res.status_code == 400
    payload = res.json()
    assert payload["ok"] is False
    assert payload["errorCode"] == "LLM_API_KEY_REQUIRED"


def test_llm_endpoint_accepts_request_api_key(monkeypatch):
    monkeypatch.delenv("API_KEY", raising=False)
    monkeypatch.setattr(service, "create_provider", lambda: FakeProvider())

    res = client.post(
        "/llm",
        json={
            "job": "general",
            "prompt": "hola",
            "apiKey": "AIzaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        },
    )

    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    assert payload["data"]["text"] == "respuesta de prueba"
    assert payload["data"]["structured"] is None
    assert isinstance(payload.get("requestId"), str)


def test_llm_endpoint_maps_timeout_to_llm_timeout(monkeypatch):
    monkeypatch.delenv("API_KEY", raising=False)
    monkeypatch.setattr(service, "create_provider", lambda: TimeoutProvider())

    res = client.post(
        "/llm",
        json={
            "job": "general",
            "prompt": "hola",
            "apiKey": "AIzaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        },
    )

    assert res.status_code == 504
    payload = res.json()
    assert payload["ok"] is False
    assert payload["errorCode"] == "LLM_TIMEOUT"


def test_llm_repair_normalizes_codigo_corregido_alias(monkeypatch):
    monkeypatch.delenv("API_KEY", raising=False)
    monkeypatch.setattr(service, "create_provider", lambda: RepairAliasProvider())

    res = client.post(
        "/llm",
        json={
            "job": "repair",
            "prompt": "repara esto",
            "apiKey": "AIzaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        },
    )

    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    assert payload["data"]["text"] == "f(n) BEGIN\n RETURN 1;\nEND"
    assert payload["data"]["structured"]["code"].startswith("f(n) BEGIN")
    assert payload["data"]["structured"]["removedLines"] == []
    assert payload["data"]["structured"]["addedLines"] == []


def test_llm_endpoint_prefers_request_api_key_over_server_key(monkeypatch):
    provider = CaptureKeyProvider()
    monkeypatch.setenv("API_KEY", "AIzaBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB")
    monkeypatch.setattr(service, "create_provider", lambda: provider)

    res = client.post(
        "/llm",
        json={
            "job": "general",
            "prompt": "hola",
            "apiKey": "AIzaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        },
    )

    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    assert provider.last_api_key == "AIzaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
