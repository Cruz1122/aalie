import urllib.request

import pytest

from app.core.auth import IdentityClaims
from app.modules.llm.config import get_job_config
from app.modules.llm.providers import (
    AnthropicProvider,
    GeminiProvider,
    OpenAICompatibleProvider,
    ProviderRequest,
)
from app.modules.llm.service import (
    UCALDAS_OPENAI_MODEL,
    detect_api_key_provider,
    is_ucaldas_identity,
)

pytestmark = [pytest.mark.unit, pytest.mark.fast]


def test_detects_gemini_and_openai_key_formats_without_confusing_them():
    assert detect_api_key_provider("AIzaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA") == "gemini"
    assert (
        detect_api_key_provider("sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA") == "openai_compatible"
    )
    assert detect_api_key_provider("sk-ant-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA") == "anthropic"
    assert detect_api_key_provider("sk-or-v1-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA") == "openrouter"
    assert detect_api_key_provider("xai-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA") == "xai"
    assert detect_api_key_provider("gsk_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA") == "groq"
    assert detect_api_key_provider("not-a-provider-key") is None


def test_ucaldas_authorization_requires_exact_email_suffix():
    assert is_ucaldas_identity(
        IdentityClaims(user_id="u1", role="USER", email="student@ucaldas.edu.co")
    )
    assert not is_ucaldas_identity(
        IdentityClaims(user_id="u2", role="USER", email="student@ucaldas.edu.co.example")
    )


def test_openai_provider_defaults_to_latest_model(monkeypatch):
    monkeypatch.delenv("LLM_MODEL_GENERAL", raising=False)
    assert get_job_config("general", "es", "openai_compatible").model == "gpt-6-luna"


@pytest.mark.parametrize(
    ("provider", "expected_model"),
    [
        ("anthropic", "claude-haiku-5-5"),
        ("openrouter", "openai/gpt-6-luna"),
        ("xai", "grok-4.7"),
        ("groq", "openai/gpt-oss-120b"),
    ],
)
def test_provider_default_does_not_inherit_a_gemini_job_model(
    monkeypatch, provider, expected_model
):
    monkeypatch.setenv("LLM_MODEL_GENERAL", "gemini-3.8-flash")

    assert get_job_config("general", "es", provider).model == expected_model


def test_openai_compatible_custom_job_model_is_preserved(monkeypatch):
    monkeypatch.setenv("LLM_MODEL_GENERAL", "custom-local-model")

    assert get_job_config("general", "es", "openai_compatible").model == ("custom-local-model")

    monkeypatch.setenv("LLM_MODEL_GENERAL", "gemini-explicit-custom")
    assert get_job_config("general", "es", "openai_compatible").model == "gemini-explicit-custom"


def test_openai_gpt5_request_uses_completion_token_parameter(monkeypatch):
    captured: dict[str, object] = {}

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self, _limit=None):
            return b'{"choices":[{"message":{"content":"ok"}}]}'

    def fake_urlopen(request, timeout):
        captured["body"] = request.data
        captured["timeout"] = timeout
        return FakeResponse()

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)
    OpenAICompatibleProvider("https://api.openai.com/v1/chat/completions").generate_content(
        ProviderRequest(
            model=UCALDAS_OPENAI_MODEL,
            system_prompt="system",
            messages=[{"role": "user", "content": "hello"}],
            api_key="sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            temperature=0.2,
            max_tokens=128,
            schema=None,
            timeout_seconds=3,
        )
    )

    body = captured["body"]
    assert isinstance(body, bytes)
    decoded = body.decode("utf-8")
    assert '"max_completion_tokens": 128' in decoded
    assert '"max_tokens"' not in decoded
    assert '"temperature"' not in decoded


def test_openai_gpt6_request_uses_supported_reasoning_parameters(monkeypatch):
    captured: dict[str, object] = {}

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self, _limit=None):
            return b'{"choices":[{"message":{"content":"ok"}}]}'

    def fake_urlopen(request, timeout):
        captured["body"] = request.data
        return FakeResponse()

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)
    OpenAICompatibleProvider("https://api.openai.com/v1/chat/completions").generate_content(
        ProviderRequest(
            model="gpt-6.1-sol",
            system_prompt="system",
            messages=[{"role": "user", "content": "hello"}],
            api_key="sk-proj-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            temperature=0.2,
            max_tokens=128,
            schema=None,
            timeout_seconds=3,
            disable_thinking=True,
        )
    )

    body = captured["body"]
    assert isinstance(body, bytes)
    decoded = body.decode("utf-8")
    assert '"max_completion_tokens": 128' in decoded
    assert '"reasoning_effort": "low"' in decoded
    assert '"temperature"' not in decoded


def test_gemini_3_request_uses_thinking_level_without_legacy_sampling_fields(monkeypatch):
    captured: dict[str, object] = {}

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self, _limit=None):
            return b'{"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}'

    def fake_urlopen(request, timeout):
        captured["body"] = request.data
        return FakeResponse()

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)
    GeminiProvider("https://generativelanguage.googleapis.com/v1beta/models").generate_content(
        ProviderRequest(
            model="gemini-3.8-flash",
            system_prompt="system",
            messages=[{"role": "user", "content": "hello"}],
            api_key="AIzaAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            temperature=0.2,
            max_tokens=128,
            schema=None,
            timeout_seconds=3,
            disable_thinking=True,
        )
    )

    body = captured["body"]
    assert isinstance(body, bytes)
    decoded = body.decode("utf-8")
    assert '"thinkingLevel": "low"' in decoded
    assert '"thinkingBudget"' not in decoded
    assert '"temperature"' not in decoded


def test_namespaced_gpt5_request_uses_completion_token_parameter(monkeypatch):
    captured: dict[str, object] = {}

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self, _limit=None):
            return b'{"choices":[{"message":{"content":"ok"}}]}'

    def fake_urlopen(request, timeout):
        captured["body"] = request.data
        return FakeResponse()

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)
    OpenAICompatibleProvider("https://openrouter.ai/api/v1/chat/completions").generate_content(
        ProviderRequest(
            model="openai/gpt-5.4-mini",
            system_prompt="system",
            messages=[{"role": "user", "content": "hello"}],
            api_key="sk-or-v1-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            temperature=0.2,
            max_tokens=128,
            schema=None,
            timeout_seconds=3,
        )
    )

    body = captured["body"]
    assert isinstance(body, bytes)
    decoded = body.decode("utf-8")
    assert '"model": "openai/gpt-5.4-mini"' in decoded
    assert '"max_completion_tokens": 128' in decoded
    assert '"max_tokens"' not in decoded


def test_anthropic_provider_uses_messages_contract(monkeypatch):
    captured: dict[str, object] = {}

    class FakeResponse:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def read(self, _limit=None):
            return b'{"id":"msg_1","content":[{"type":"text","text":"ok"}]}'

    def fake_urlopen(request, timeout):
        captured["body"] = request.data
        captured["headers"] = dict(request.headers)
        captured["timeout"] = timeout
        return FakeResponse()

    monkeypatch.setattr(urllib.request, "urlopen", fake_urlopen)
    response = AnthropicProvider("https://api.anthropic.com/v1/messages").generate_content(
        ProviderRequest(
            model="claude-opus-5-5",
            system_prompt="system",
            messages=[{"role": "user", "content": "hello"}],
            api_key="sk-ant-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
            temperature=0.2,
            max_tokens=128,
            schema=None,
            timeout_seconds=3,
        )
    )

    assert response["content"][0]["text"] == "ok"
    assert captured["timeout"] == 3
    headers = captured["headers"]
    assert isinstance(headers, dict)
    normalized_headers = {str(key).lower(): value for key, value in headers.items()}
    assert normalized_headers["x-api-key"] == "sk-ant-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    assert normalized_headers["anthropic-version"] == "2023-06-01"
    body = captured["body"]
    assert isinstance(body, bytes)
    assert '"model": "claude-opus-5-5"' in body.decode("utf-8")
    assert '"temperature"' not in body.decode("utf-8")
