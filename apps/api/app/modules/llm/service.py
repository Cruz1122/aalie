"""Servicio backend para orquestacion de requests LLM."""

from __future__ import annotations

import copy
import json
import logging
import re
import socket
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
from uuid import uuid4

from .config import (
    get_backend_llm_status,
    get_gemini_endpoint_base,
    get_job_config,
    get_openai_compatible_endpoint_base,
    get_provider_name,
    get_timeout_seconds,
)
from .providers import (
    BaseLLMProvider,
    GeminiProvider,
    LLMProviderError,
    OpenAICompatibleProvider,
    ProviderRequest,
)

logger = logging.getLogger(__name__)

API_KEY_REGEX = re.compile(r"^AIza[0-9A-Za-z_-]{35,40}$")


def _redact_assistant_context_for_llm(data: Dict[str, Any]) -> Dict[str, Any]:
    """Quita identificadores internos del catálogo (p. ej. skill.*) de la copia enviada al LLM."""
    try:
        out = copy.deepcopy(data)
    except Exception:
        return data
    if not isinstance(out, dict):
        return data

    quiz_dashboard = out.get("quizDashboard")
    if isinstance(quiz_dashboard, dict):
        weak = quiz_dashboard.get("weakSkillIds")
        if isinstance(weak, list) and weak:
            quiz_dashboard["weakSkillIdCount"] = len(weak)
        quiz_dashboard.pop("weakSkillIds", None)

    quiz_review = out.get("quizSessionReview")
    if isinstance(quiz_review, dict):
        current = quiz_review.get("currentQuestion")
        if isinstance(current, dict):
            current.pop("skillIds", None)
        all_questions = quiz_review.get("allQuestions")
        if isinstance(all_questions, list):
            for item in all_questions:
                if isinstance(item, dict):
                    item.pop("skillIds", None)

    return out


def _validate_api_key(key: str | None) -> bool:
    if not key or not isinstance(key, str):
        return False
    return API_KEY_REGEX.match(key.strip()) is not None


def _append_context(prompt: str, context: str | None, assistant_context: Dict[str, Any] | None) -> str:
    blocks: List[str] = []
    if assistant_context:
        safe_ctx = _redact_assistant_context_for_llm(assistant_context)
        serialized = json.dumps(safe_ctx, ensure_ascii=True)
        blocks.append(f"Assistant context:\n{serialized}")
    if context:
        blocks.append(f"Additional context:\n{context}")
    blocks.append(prompt)
    return "\n\n".join(blocks)


def _build_messages(user_prompt: str, chat_history: List[Dict[str, str]] | None) -> List[Dict[str, str]]:
    messages: List[Dict[str, str]] = []
    if chat_history:
        messages.extend(chat_history[-10:])
    messages.append({"role": "user", "content": user_prompt})
    return messages


def _extract_gemini_text(provider_response: Dict[str, Any]) -> str:
    candidates = provider_response.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        return ""
    first_candidate = candidates[0] if isinstance(candidates[0], dict) else {}
    content = first_candidate.get("content") if isinstance(first_candidate, dict) else {}
    if not isinstance(content, dict):
        return ""
    parts = content.get("parts")
    if not isinstance(parts, list) or not parts:
        return ""
    first_part = parts[0] if isinstance(parts[0], dict) else {}
    if not isinstance(first_part, dict):
        return ""
    text = first_part.get("text")
    return text if isinstance(text, str) else ""


def _extract_openai_text(provider_response: Dict[str, Any]) -> str:
    choices = provider_response.get("choices")
    if not isinstance(choices, list) or not choices:
        return ""
    first_choice = choices[0] if isinstance(choices[0], dict) else {}
    message = first_choice.get("message") if isinstance(first_choice, dict) else {}
    if not isinstance(message, dict):
        return ""
    content = message.get("content")
    return content if isinstance(content, str) else ""


def _extract_provider_text(provider_name: str, provider_response: Dict[str, Any]) -> str:
    if provider_name == "openai_compatible":
        return _extract_openai_text(provider_response)
    return _extract_gemini_text(provider_response)


def _extract_json_object(raw_text: str) -> Dict[str, Any] | None:
    candidate = (raw_text or "").strip()
    if not candidate:
        return None

    try:
        parsed = json.loads(candidate)
        return parsed if isinstance(parsed, dict) else None
    except Exception:
        pass

    codeblock = re.search(r"```(?:json|pseudocode)?\s*(\{[\s\S]*\})\s*```", candidate)
    if codeblock:
        try:
            parsed = json.loads(codeblock.group(1).strip())
            return parsed if isinstance(parsed, dict) else None
        except Exception:
            return None

    return None


def _normalize_repair_payload(provider_response: Dict[str, Any]) -> Dict[str, Any]:
    candidates = provider_response.get("candidates")
    if not isinstance(candidates, list) or not candidates:
        return provider_response

    first = candidates[0] if isinstance(candidates[0], dict) else None
    if not isinstance(first, dict):
        return provider_response

    content = first.get("content")
    if not isinstance(content, dict):
        return provider_response

    parts = content.get("parts")
    if not isinstance(parts, list) or not parts:
        return provider_response

    part0 = parts[0] if isinstance(parts[0], dict) else None
    if not isinstance(part0, dict):
        return provider_response

    text = part0.get("text")
    if not isinstance(text, str) or not text.strip():
        return provider_response

    parsed = _extract_json_object(text)
    if parsed is None:
        return provider_response

    code_value = parsed.get("code")
    if not isinstance(code_value, str) or not code_value.strip():
        for alias in (
            "codigo_corregido",
            "codigoCorregido",
            "corrected_code",
            "correctedCode",
            "pseudocode",
            "codigo",
        ):
            alias_value = parsed.get(alias)
            if isinstance(alias_value, str) and alias_value.strip():
                code_value = alias_value
                break

    if not isinstance(code_value, str) or not code_value.strip():
        return provider_response

    normalized = {
        "code": code_value,
        "removedLines": parsed.get("removedLines")
        if isinstance(parsed.get("removedLines"), list)
        else [],
        "addedLines": parsed.get("addedLines")
        if isinstance(parsed.get("addedLines"), list)
        else [],
    }

    part0["text"] = json.dumps(normalized, ensure_ascii=True)
    return provider_response


def create_provider() -> BaseLLMProvider:
    provider = get_provider_name()
    if provider == "gemini":
        return GeminiProvider(get_gemini_endpoint_base())
    if provider == "openai_compatible":
        return OpenAICompatibleProvider(get_openai_compatible_endpoint_base())
    raise ValueError(f"Proveedor LLM no soportado: {provider}")


def resolve_api_key(request_api_key: str | None) -> Tuple[str | None, bool]:
    import os

    if _validate_api_key(request_api_key):
        return request_api_key.strip(), False

    server_key = os.getenv("API_KEY")
    if _validate_api_key(server_key):
        return server_key, True
    return None, False


def get_status_payload() -> Dict[str, Any]:
    _, has_server_key = resolve_api_key(None)
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "config": get_backend_llm_status(),
        "jobs": get_backend_llm_status().get("jobs", {}),
        "apiKey": {
            "serverAvailable": has_server_key,
        },
    }


def _normalize_response(job: str, provider_name: str, provider_response: Dict[str, Any]) -> Dict[str, Any]:
    text = _extract_provider_text(provider_name, provider_response)
    structured = _extract_json_object(text) if text else None

    if job == "repair":
        repair_payload = structured if isinstance(structured, dict) else None
        if repair_payload is not None:
            code_value = repair_payload.get("code")
            if not isinstance(code_value, str) or not code_value.strip():
                for alias in (
                    "codigo_corregido",
                    "codigoCorregido",
                    "corrected_code",
                    "correctedCode",
                    "pseudocode",
                    "codigo",
                ):
                    alias_value = repair_payload.get(alias)
                    if isinstance(alias_value, str) and alias_value.strip():
                        code_value = alias_value
                        break
            if isinstance(code_value, str) and code_value.strip():
                removed_lines = repair_payload.get("removedLines")
                if not isinstance(removed_lines, list):
                    for alias in ("removed_lines", "lineas_eliminadas"):
                        alias_value = repair_payload.get(alias)
                        if isinstance(alias_value, list):
                            removed_lines = alias_value
                            break

                added_lines = repair_payload.get("addedLines")
                if not isinstance(added_lines, list):
                    for alias in ("added_lines", "lineas_agregadas"):
                        alias_value = repair_payload.get(alias)
                        if isinstance(alias_value, list):
                            added_lines = alias_value
                            break

                structured = {
                    "code": code_value.strip(),
                    "removedLines": removed_lines if isinstance(removed_lines, list) else [],
                    "addedLines": added_lines if isinstance(added_lines, list) else [],
                }
                text = structured["code"]
            else:
                structured = None
        else:
            structured = None

    metadata = {
        "responseId": provider_response.get("responseId") or provider_response.get("id"),
        "modelVersion": provider_response.get("modelVersion") or provider_response.get("model"),
        "finishReason": None,
        "usage": provider_response.get("usageMetadata")
        or provider_response.get("usage")
        or provider_response.get("usage_metadata"),
    }

    if provider_name == "openai_compatible":
        choices = provider_response.get("choices")
        if isinstance(choices, list) and choices:
            first_choice = choices[0] if isinstance(choices[0], dict) else {}
            metadata["finishReason"] = first_choice.get("finish_reason")
    else:
        candidates = provider_response.get("candidates")
        if isinstance(candidates, list) and candidates:
            first_candidate = candidates[0] if isinstance(candidates[0], dict) else {}
            metadata["finishReason"] = first_candidate.get("finishReason")

    return {
        "text": text,
        "structured": structured,
        "metadata": metadata,
    }


def execute_llm_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    request_id = str(uuid4())
    start = time.perf_counter()

    job = payload.get("job", "general")
    locale = payload.get("locale")
    prompt = payload.get("prompt", "")
    chat_history = payload.get("chatHistory")
    context = payload.get("context")
    assistant_context = payload.get("assistantContext")

    api_key, used_server_key = resolve_api_key(payload.get("apiKey"))
    if not api_key:
        return {
            "ok": False,
            "error": "API key LLM no disponible",
            "errorCode": "LLM_API_KEY_REQUIRED",
            "requestId": request_id,
            "status": 400,
        }

    if not isinstance(prompt, str) or not prompt.strip():
        return {
            "ok": False,
            "error": "prompt es obligatorio",
            "errorCode": "LLM_BAD_REQUEST",
            "requestId": request_id,
            "status": 400,
        }

    job_config = get_job_config(job, locale)
    user_prompt = _append_context(prompt.strip(), context, assistant_context)
    messages = _build_messages(user_prompt, chat_history if isinstance(chat_history, list) else None)

    provider = create_provider()

    try:
        provider_name = get_provider_name()
        provider_response = provider.generate_content(
            ProviderRequest(
                model=job_config.model,
                system_prompt=job_config.system_prompt,
                messages=messages,
                api_key=api_key,
                temperature=job_config.temperature,
                max_tokens=job_config.max_tokens,
                schema=job_config.schema,
                timeout_seconds=get_timeout_seconds(),
                disable_thinking=job_config.disable_thinking,
            )
        )
        normalized_data = _normalize_response(job_config.job, provider_name, provider_response)
    except LLMProviderError as exc:
        elapsed = int((time.perf_counter() - start) * 1000)
        logger.warning(
            "llm_request_failed request_id=%s job=%s provider=%s status=%s code=%s latency_ms=%s used_server_key=%s",
            request_id,
            job_config.job,
            get_provider_name(),
            exc.status_code,
            exc.code,
            elapsed,
            used_server_key,
        )
        return {
            "ok": False,
            "error": str(exc),
            "errorCode": exc.code,
            "requestId": request_id,
            "status": exc.status_code,
        }
    except (TimeoutError, socket.timeout) as exc:
        elapsed = int((time.perf_counter() - start) * 1000)
        logger.warning(
            "llm_request_timeout request_id=%s job=%s latency_ms=%s used_server_key=%s",
            request_id,
            job_config.job,
            elapsed,
            used_server_key,
        )
        return {
            "ok": False,
            "error": f"Tiempo de espera agotado en proveedor LLM: {exc}",
            "errorCode": "LLM_TIMEOUT",
            "requestId": request_id,
            "status": 504,
        }
    except Exception as exc:
        elapsed = int((time.perf_counter() - start) * 1000)
        logger.exception(
            "llm_request_unhandled request_id=%s job=%s latency_ms=%s used_server_key=%s",
            request_id,
            job_config.job,
            elapsed,
            used_server_key,
        )
        return {
            "ok": False,
            "error": f"Fallo inesperado LLM: {exc}",
            "errorCode": "LLM_INTERNAL_ERROR",
            "requestId": request_id,
            "status": 500,
        }

    elapsed = int((time.perf_counter() - start) * 1000)
    logger.info(
        "llm_request_ok request_id=%s job=%s provider=%s model=%s latency_ms=%s used_server_key=%s",
        request_id,
        job_config.job,
        get_provider_name(),
        job_config.model,
        elapsed,
        used_server_key,
    )

    return {
        "ok": True,
        "job": job_config.job,
        "provider": get_provider_name(),
        "model": job_config.model,
        "requestId": request_id,
        "data": normalized_data,
        "status": 200,
    }
