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

        disable_thinking = payload.disable_thinking
        max_attempts = 3
        for attempt in range(max_attempts):
            generation_config: Dict[str, Any] = {
                "temperature": payload.temperature,
                "maxOutputTokens": payload.max_tokens,
            }
            if payload.schema:
                generation_config["responseMimeType"] = "application/json"
            if disable_thinking:
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
                    raw = response.read().decode("utf-8")
                    return json.loads(raw) if raw else {}
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
                    provider_body = exc.read().decode("utf-8")
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

        body: Dict[str, Any] = {
            "model": payload.model,
            "messages": messages,
            "temperature": payload.temperature,
        }
        if payload.max_tokens:
            body["max_tokens"] = payload.max_tokens
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
                    raw = response.read().decode("utf-8")
                    return json.loads(raw) if raw else {}
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
                    provider_body = exc.read().decode("utf-8")
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
