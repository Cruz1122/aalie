"""Schemas API para endpoints LLM de backend."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Literal, Optional, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

MAX_LLM_REQUEST_BYTES = 256 * 1024
# The compare flow intentionally embeds the source, formal analysis, and
# walkthrough evidence in one prompt. Keep this below the hard request cap
# while allowing realistic recursive analyses to reach the provider.
MAX_LLM_PROMPT_CHARS = 128 * 1024
MAX_LLM_CONTEXT_CHARS = 32 * 1024
MAX_LLM_MESSAGE_CHARS = 16 * 1024
MAX_LLM_CHAT_MESSAGES = 10


class ChatMessage(BaseModel):
    role: str = Field(max_length=16)
    content: str = Field(max_length=MAX_LLM_MESSAGE_CHARS)


class LLMRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    job: Literal["parser_assist", "general", "repair", "compare", "explain"] = "general"
    model: Optional[str] = Field(default=None, max_length=128)
    prompt: str = Field(max_length=MAX_LLM_PROMPT_CHARS)
    response_schema: Optional[Dict[str, Any]] = Field(default=None, alias="schema")
    context: Optional[str] = Field(default=None, max_length=MAX_LLM_CONTEXT_CHARS)
    assistant_context: Optional[Dict[str, Any]] = Field(default=None, alias="assistantContext")
    chat_history: Optional[List[ChatMessage]] = Field(
        default=None,
        alias="chatHistory",
        max_length=MAX_LLM_CHAT_MESSAGES,
    )
    api_key: Optional[str] = Field(default=None, alias="apiKey", max_length=512)
    locale: Optional[str] = Field(default=None, max_length=16)

    @model_validator(mode="after")
    def validate_serialized_size(self) -> Self:
        serialized = json.dumps(
            self.model_dump(mode="json", by_alias=True),
            ensure_ascii=False,
            separators=(",", ":"),
        )
        if len(serialized.encode("utf-8")) > MAX_LLM_REQUEST_BYTES:
            raise ValueError("LLM request payload is too large")
        return self


class LLMResponse(BaseModel):
    ok: bool
    data: Optional[Dict[str, Any]] = None
    model: Optional[str] = None
    request_id: Optional[str] = Field(default=None, alias="requestId")
    error: Optional[str] = None
    error_code: Optional[str] = Field(default=None, alias="errorCode")


class LLMStatusResponse(BaseModel):
    ok: bool
    status: Dict[str, Any]
