"""Proveedores LLM desacoplados del contrato API."""

from __future__ import annotations

import json
import socket
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Dict, List

MAX_PROVIDER_RESPONSE_BYTES = 2 * 1024 * 1024
MAX_PROVIDER_ERROR_BYTES = 64 * 1024


class LLMProviderError(Exception):
    """Error controlado del proveedor LLM."""

    def __init__(self, message: str, code: str = "LLM_PROVIDER_ERROR", status_code: int = 502):
        super().__init__(message)
        self.code = code
        self.status_code = status_code


@dataclass
class ProviderRequest:
    model: str
    system_prompt: str
    messages: List[Dict[str, str]]
    api_key: str
    temperature: float
    max_tokens: int
    schema: Dict[str, Any] | None
    timeout_seconds: int
    disable_thinking: bool = False


class BaseLLMProvider:
    def generate_content(self, payload: ProviderRequest) -> Dict[str, Any]:
        raise NotImplementedError


def _read_json_response(response) -> Dict[str, Any]:
    raw = response.read(MAX_PROVIDER_RESPONSE_BYTES + 1)
    if len(raw) > MAX_PROVIDER_RESPONSE_BYTES:
        raise LLMProviderError(
            "La respuesta del proveedor LLM es demasiado grande",
            code="LLM_UPSTREAM_RESPONSE_TOO_LARGE",
            status_code=502,
        )
    return json.loads(raw.decode("utf-8")) if raw else {}


class GeminiProvider(BaseLLMProvider):
    def __init__(self, endpoint_base: str):
        self._endpoint_base = endpoint_base.rstrip("/")

    @staticmethod
    def _is_timeout_like_url_error(exc: urllib.error.URLError) -> bool:
        reason = getattr(exc, "reason", None)
        if isinstance(reason, (TimeoutError, socket.timeout)):
            return True
        return "timed out" in str(exc).lower()

    def generate_content(self, payload: ProviderRequest) -> Dict[str, Any]:
        system_instruction = {"parts": [{"text": payload.system_prompt}]}
        contents = [
            {
                "role": "user" if m.get("role") == "user" else "model",
                "parts": [{"text": m.get("content", "")}],
            }
            for m in payload.messages
            if m.get("role") != "system"
        ]

        url = (
            f"{self._endpoint_base}/{urllib.parse.quote(payload.model)}"
            f":generateContent?key={urllib.parse.quote(payload.api_key)}"
        )

        model_family = payload.model.rsplit("/", 1)[-1].lower()
        is_gemini_3_model = model_family.startswith("gemini-3")
        disable_thinking = payload.disable_thinking
        max_attempts = 3
        for attempt in range(max_attempts):
            generation_config: Dict[str, Any] = {"maxOutputTokens": payload.max_tokens}
            if not is_gemini_3_model:
                generation_config["temperature"] = payload.temperature
            if payload.schema:
                generation_config["responseMimeType"] = "application/json"
            if disable_thinking:
                if is_gemini_3_model:
                    # Gemini 3.x uses the string thinking level. "minimal"
                    # is not valid for Gemini 3.8 Flash or 3.1 Pro, so low
                    # is the least expensive supported setting.
                    generation_config["thinkingConfig"] = {"thinkingLevel": "low"}
                else:
                    generation_config["thinkingConfig"] = {"thinkingBudget": 0}

            body = {
                "system_instruction": system_instruction,
                "contents": contents,
                "generationConfig": generation_config,
            }

            req = urllib.request.Request(
                url=url,
                data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )

            try:
                with urllib.request.urlopen(req, timeout=payload.timeout_seconds) as response:
                    return _read_json_response(response)
            except (TimeoutError, socket.timeout):
                if attempt < max_attempts - 1:
                    time.sleep(0.5)
                    continue
                raise LLMProviderError(
                    "Tiempo de espera agotado al contactar el proveedor LLM",
                    code="LLM_TIMEOUT",
                    status_code=504,
                )
            except urllib.error.HTTPError as exc:
                provider_body = ""
                try:
                    provider_body = exc.read(MAX_PROVIDER_ERROR_BYTES).decode("utf-8")
                except Exception:
                    provider_body = ""

                parsed = {}
                if provider_body:
                    try:
                        parsed = json.loads(provider_body)
                    except Exception:
                        parsed = {}

                message = (
                    parsed.get("error", {}).get("message")
                    or parsed.get("message")
                    or f"HTTP {exc.code}"
                )

                if exc.code == 400 and disable_thinking:
                    disable_thinking = False
                    continue

                if exc.code == 429:
                    raise LLMProviderError(message, code="LLM_RATE_LIMIT", status_code=429)
                if exc.code in {408, 504}:
                    if attempt < max_attempts - 1:
                        time.sleep(0.5)
                        continue
                    raise LLMProviderError(message, code="LLM_TIMEOUT", status_code=504)
                if exc.code >= 500:
                    raise LLMProviderError(message, code="LLM_UPSTREAM", status_code=502)
                raise LLMProviderError(message, code="LLM_BAD_REQUEST", status_code=400)
            except urllib.error.URLError as exc:
                if self._is_timeout_like_url_error(exc):
                    if attempt < max_attempts - 1:
                        time.sleep(0.5)
                        continue
                    raise LLMProviderError(
                        f"Tiempo de espera agotado al contactar el proveedor LLM: {exc}",
                        code="LLM_TIMEOUT",
                        status_code=504,
                    )
                raise LLMProviderError(
                    f"No se pudo conectar con proveedor LLM: {exc}",
                    code="LLM_UNAVAILABLE",
                    status_code=503,
                )

        raise LLMProviderError(
            "Tiempo de espera agotado al contactar el proveedor LLM",
            code="LLM_TIMEOUT",
            status_code=504,
        )


class OpenAICompatibleProvider(BaseLLMProvider):
    def __init__(self, endpoint_base: str):
        self._endpoint_base = endpoint_base.rstrip("/")

    def generate_content(self, payload: ProviderRequest) -> Dict[str, Any]:
        messages = [
            {"role": "system", "content": payload.system_prompt},
            *[
                {
                    "role": "user" if m.get("role") == "user" else "assistant",
                    "content": m.get("content", ""),
                }
                for m in payload.messages
                if m.get("role") != "system"
            ],
        ]

        model_family = payload.model.rsplit("/", 1)[-1].lower()
        is_openai_reasoning_model = model_family.startswith(("gpt-5", "gpt-6", "o1", "o3", "o4"))
        body: Dict[str, Any] = {
            "model": payload.model,
            "messages": messages,
        }
        if not is_openai_reasoning_model:
            body["temperature"] = payload.temperature
        if payload.max_tokens:
            if is_openai_reasoning_model:
                body["max_completion_tokens"] = payload.max_tokens
            else:
                body["max_tokens"] = payload.max_tokens
        if payload.disable_thinking and model_family.startswith(("gpt-5", "gpt-6")):
            if model_family in {"gpt-6-luna", "gpt-6-sol"} or model_family.startswith("gpt-5"):
                body["reasoning_effort"] = "none"
            else:
                # GPT-6 Astra and GPT-6.1 Sol do not support ``none``.
                body["reasoning_effort"] = "low"
        if payload.schema:
            body["response_format"] = {"type": "json_object"}

        req = urllib.request.Request(
            url=self._endpoint_base,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {payload.api_key}",
            },
            method="POST",
        )

        max_attempts = 2
        for attempt in range(max_attempts):
            try:
                with urllib.request.urlopen(req, timeout=payload.timeout_seconds) as response:
                    return _read_json_response(response)
            except (TimeoutError, socket.timeout):
                if attempt < max_attempts - 1:
                    time.sleep(0.5)
                    continue
                raise LLMProviderError(
                    "Tiempo de espera agotado al contactar el proveedor LLM",
                    code="LLM_TIMEOUT",
                    status_code=504,
                )
            except urllib.error.HTTPError as exc:
                provider_body = ""
                try:
                    provider_body = exc.read(MAX_PROVIDER_ERROR_BYTES).decode("utf-8")
                except Exception:
                    provider_body = ""

                parsed = {}
                if provider_body:
                    try:
                        parsed = json.loads(provider_body)
                    except Exception:
                        parsed = {}

                message = (
                    parsed.get("error", {}).get("message")
                    or parsed.get("message")
                    or f"HTTP {exc.code}"
                )

                if exc.code == 429:
                    raise LLMProviderError(message, code="LLM_RATE_LIMIT", status_code=429)
                if exc.code in {408, 504}:
                    if attempt < max_attempts - 1:
                        time.sleep(0.5)
                        continue
                    raise LLMProviderError(message, code="LLM_TIMEOUT", status_code=504)
                if exc.code >= 500:
                    raise LLMProviderError(message, code="LLM_UPSTREAM", status_code=502)
                raise LLMProviderError(message, code="LLM_BAD_REQUEST", status_code=400)
            except urllib.error.URLError as exc:
                if "timed out" in str(exc).lower():
                    if attempt < max_attempts - 1:
                        time.sleep(0.5)
                        continue
                    raise LLMProviderError(
                        f"Tiempo de espera agotado al contactar el proveedor LLM: {exc}",
                        code="LLM_TIMEOUT",
                        status_code=504,
                    )
                raise LLMProviderError(
                    f"No se pudo conectar con proveedor LLM: {exc}",
                    code="LLM_UNAVAILABLE",
                    status_code=503,
                )

        raise LLMProviderError(
            "Tiempo de espera agotado al contactar el proveedor LLM",
            code="LLM_TIMEOUT",
            status_code=504,
        )


class AnthropicProvider(BaseLLMProvider):
    """Cliente minimo para la API nativa de mensajes de Anthropic."""

    def __init__(self, endpoint_base: str):
        self._endpoint_base = endpoint_base.rstrip("/")

    def generate_content(self, payload: ProviderRequest) -> Dict[str, Any]:
        messages = [
            {
                "role": "user" if message.get("role") == "user" else "assistant",
                "content": message.get("content", ""),
            }
            for message in payload.messages
            if message.get("role") != "system"
        ]
        body: Dict[str, Any] = {
            "model": payload.model,
            "max_tokens": payload.max_tokens,
            "system": payload.system_prompt,
            "messages": messages,
        }

        # Current Claude families (Haiku/Sonnet/Opus 5.5 and Fable 5.1)
        # reject non-default sampling parameters. Prompting and adaptive
        # thinking are the supported controls for these models.

        if payload.schema:
            body["system"] = (
                f"{payload.system_prompt}\n"
                "Return only a valid JSON object matching the requested response schema."
            )

        req = urllib.request.Request(
            url=self._endpoint_base,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-api-key": payload.api_key,
                "anthropic-version": "2023-06-01",
            },
            method="POST",
        )

        max_attempts = 2
        for attempt in range(max_attempts):
            try:
                with urllib.request.urlopen(req, timeout=payload.timeout_seconds) as response:
                    return _read_json_response(response)
            except (TimeoutError, socket.timeout):
                if attempt < max_attempts - 1:
                    time.sleep(0.5)
                    continue
                raise LLMProviderError(
                    "Tiempo de espera agotado al contactar el proveedor LLM",
                    code="LLM_TIMEOUT",
                    status_code=504,
                )
            except urllib.error.HTTPError as exc:
                provider_body = ""
                try:
                    provider_body = exc.read(MAX_PROVIDER_ERROR_BYTES).decode("utf-8")
                except Exception:
                    provider_body = ""

                parsed = {}
                if provider_body:
                    try:
                        parsed = json.loads(provider_body)
                    except Exception:
                        parsed = {}

                error = parsed.get("error") if isinstance(parsed, dict) else None
                message = (
                    (error.get("message") if isinstance(error, dict) else None)
                    or parsed.get("message")
                    or f"HTTP {exc.code}"
                )

                if exc.code == 429:
                    raise LLMProviderError(message, code="LLM_RATE_LIMIT", status_code=429)
                if exc.code in {408, 504}:
                    if attempt < max_attempts - 1:
                        time.sleep(0.5)
                        continue
                    raise LLMProviderError(message, code="LLM_TIMEOUT", status_code=504)
                if exc.code >= 500:
                    raise LLMProviderError(message, code="LLM_UPSTREAM", status_code=502)
                raise LLMProviderError(message, code="LLM_BAD_REQUEST", status_code=400)
            except urllib.error.URLError as exc:
                if "timed out" in str(exc).lower():
                    if attempt < max_attempts - 1:
                        time.sleep(0.5)
                        continue
                    raise LLMProviderError(
                        f"Tiempo de espera agotado al contactar el proveedor LLM: {exc}",
                        code="LLM_TIMEOUT",
                        status_code=504,
                    )
                raise LLMProviderError(
                    f"No se pudo conectar con proveedor LLM: {exc}",
                    code="LLM_UNAVAILABLE",
                    status_code=503,
                )

        raise LLMProviderError(
            "Tiempo de espera agotado al contactar el proveedor LLM",
            code="LLM_TIMEOUT",
            status_code=504,
        )
