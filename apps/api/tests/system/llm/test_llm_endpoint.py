from datetime import datetime, timezone

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.auth import IdentityClaims
from app.main import app
from app.modules.llm import router as llm_router
from app.modules.llm import service
from app.modules.llm.schemas import MAX_LLM_PROMPT_CHARS, MAX_LLM_REQUEST_BYTES
from app.modules.rate_limits.service import RateLimitDecision

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


class ChunkedBody(httpx.SyncByteStream):
    def __iter__(self):
        yield b"{" + b'"prompt":"' + b"x" * MAX_LLM_REQUEST_BYTES + b'"}'


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


class TruncatedCompareProvider:
    def generate_content(self, payload):
        return {
            "id": "chatcmpl-truncated",
            "model": "gpt-5.4-mini",
            "choices": [
                {
                    "message": {
                        "content": '{"analysis":{"worst":{',
                    },
                    "finish_reason": "length",
                }
            ],
        }


class CaptureKeyProvider:
    def __init__(self):
        self.last_api_key = None
        self.last_model = None

    def generate_content(self, payload):
        self.last_api_key = payload.api_key
        self.last_model = payload.model
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
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

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


def test_llm_endpoint_rejects_oversized_payload():
    res = client.post(
        "/llm",
        json={
            "job": "general",
            "prompt": "hola",
            "assistantContext": {"blob": "x" * MAX_LLM_REQUEST_BYTES},
        },
    )

    assert res.status_code == 413
    assert res.json()["errorCode"] == "LLM_PAYLOAD_TOO_LARGE"


def test_llm_endpoint_rejects_oversized_chunked_payload():
    res = client.post(
        "/llm",
        content=ChunkedBody(),
        headers={"content-type": "application/json"},
    )

    assert res.status_code == 413
    assert res.json()["errorCode"] == "LLM_PAYLOAD_TOO_LARGE"


def test_llm_endpoint_accepts_request_api_key(monkeypatch):
    monkeypatch.delenv("API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(service, "create_provider", lambda *_args: FakeProvider())

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


def test_llm_compare_accepts_large_comparison_prompt(monkeypatch):
    monkeypatch.delenv("API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(service, "create_provider", lambda *_args: FakeProvider())

    res = client.post(
        "/llm",
        json={
            "job": "compare",
            "prompt": "x" * (MAX_LLM_PROMPT_CHARS - 1),
            "apiKey": "AIzaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        },
    )

    assert res.status_code == 200
    assert res.json()["ok"] is True


def test_llm_compare_rejects_truncated_structured_output(monkeypatch):
    monkeypatch.delenv("API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(service, "create_provider", lambda *_args: TruncatedCompareProvider())

    res = client.post(
        "/llm",
        json={
            "job": "compare",
            "prompt": "compara este analisis",
            "apiKey": "sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        },
    )

    assert res.status_code == 502
    payload = res.json()
    assert payload["ok"] is False
    assert payload["errorCode"] == "LLM_OUTPUT_TRUNCATED"


def test_llm_endpoint_maps_timeout_to_llm_timeout(monkeypatch):
    monkeypatch.delenv("API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(service, "create_provider", lambda *_args: TimeoutProvider())

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
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(service, "create_provider", lambda *_args: RepairAliasProvider())

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
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(service, "create_provider", lambda *_args: provider)

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


def test_openai_key_is_detected_and_uses_latest_default_model(monkeypatch):
    provider = CaptureKeyProvider()
    monkeypatch.delenv("API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(service, "create_provider", lambda *_args: provider)

    res = client.post(
        "/llm",
        json={
            "job": "general",
            "prompt": "hola",
            "apiKey": "sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        },
    )

    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    assert payload["provider"] == "openai_compatible"
    assert payload["model"] == "gpt-6-luna"
    assert provider.last_model == "gpt-6-luna"


def test_request_model_is_forwarded_for_a_user_owned_key(monkeypatch):
    provider = CaptureKeyProvider()
    monkeypatch.delenv("API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(service, "create_provider", lambda *_args: provider)

    res = client.post(
        "/llm",
        json={
            "job": "general",
            "prompt": "hola",
            "apiKey": "sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            "model": "gpt-6.1-sol",
        },
    )

    assert res.status_code == 200
    assert res.json()["model"] == "gpt-6.1-sol"
    assert provider.last_model == "gpt-6.1-sol"


def test_request_model_rejects_invalid_model_id(monkeypatch):
    monkeypatch.delenv("API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    res = client.post(
        "/llm",
        json={
            "job": "general",
            "prompt": "hola",
            "apiKey": "sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            "model": "gpt 5; delete everything",
        },
    )

    assert res.status_code == 400
    assert res.json()["errorCode"] == "LLM_MODEL_INVALID"


@pytest.mark.parametrize(
    ("api_key", "expected_model"),
    [
        ("sk-ant-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "claude-haiku-5-5"),
        ("sk-or-v1-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "openai/gpt-6-luna"),
        ("xai-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "grok-4.7"),
        ("gsk_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", "openai/gpt-oss-120b"),
    ],
)
def test_detected_provider_does_not_use_a_gemini_job_model_without_request_model(
    monkeypatch, api_key, expected_model
):
    provider = CaptureKeyProvider()
    monkeypatch.delenv("API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setenv("LLM_MODEL_GENERAL", "gemini-3.8-flash")
    monkeypatch.setattr(service, "create_provider", lambda *_args: provider)

    res = client.post(
        "/llm",
        json={"job": "general", "prompt": "hola", "apiKey": api_key},
    )

    assert res.status_code == 200
    assert res.json()["model"] == expected_model
    assert provider.last_model == expected_model


def test_server_openai_key_is_reserved_for_ucaldas_identity(monkeypatch):
    provider = CaptureKeyProvider()
    monkeypatch.setenv("API_KEY", "sk-proj-BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB")
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(service, "create_provider", lambda *_args: provider)

    denied = service.execute_llm_request(
        {"job": "general", "prompt": "hola"},
        identity=IdentityClaims(user_id="user-1", role="USER", email="user@example.com"),
    )
    assert denied["status"] == 403
    assert denied["errorCode"] == "LLM_SERVER_KEY_RESTRICTED"

    allowed = service.execute_llm_request(
        {"job": "general", "prompt": "hola", "model": "gpt-6-astra"},
        identity=IdentityClaims(user_id="user-2", role="USER", email="student@ucaldas.edu.co"),
    )
    assert allowed["status"] == 200
    assert allowed["provider"] == "openai_compatible"
    assert allowed["model"] == "gpt-5.4-mini"
    assert provider.last_api_key.startswith("sk-")


def test_ucaldas_direct_endpoint_enforces_quota_before_provider(monkeypatch):
    provider = CaptureKeyProvider()
    monkeypatch.delenv("API_KEY", raising=False)
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    monkeypatch.setattr(service, "create_provider", lambda *_args: provider)
    monkeypatch.setattr(
        llm_router,
        "optional_identity_from_request",
        lambda _request: IdentityClaims(
            user_id="user-ucaldas", role="USER", email="student@ucaldas.edu.co"
        ),
    )

    class FakeSession:
        def close(self):
            pass

    decision = RateLimitDecision(
        allowed=False,
        limit=5,
        remaining=0,
        retry_after_seconds=19,
        reset_at=datetime.now(timezone.utc),
    )
    calls = []
    monkeypatch.setattr(llm_router, "get_session_factory", lambda: lambda: FakeSession())
    monkeypatch.setattr(
        llm_router,
        "consume_rate_limit",
        lambda _db, **kwargs: calls.append(kwargs) or decision,
    )

    res = client.post(
        "/llm",
        json={
            "job": "general",
            "prompt": "hola",
            "apiKey": "sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        },
    )

    assert res.status_code == 429
    assert res.json()["errorCode"] == "RATE_LIMITED"
    assert res.headers["Retry-After"] == "19"
    assert len(calls) == 1
    assert calls[0]["scope"] == "llm_backend"
    assert len(calls[0]["subject_hash"]) == 64
    assert calls[0]["authenticated"] is True
    assert provider.last_api_key is None
