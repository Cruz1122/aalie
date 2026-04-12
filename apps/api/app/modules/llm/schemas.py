"""Schemas API para endpoints LLM de backend."""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class ChatMessage(BaseModel):
    role: str
    content: str


class LLMRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    job: Literal["parser_assist", "general", "repair", "compare", "explain"] = "general"
    prompt: str
    response_schema: Optional[Dict[str, Any]] = Field(default=None, alias="schema")
    context: Optional[str] = None
    assistant_context: Optional[Dict[str, Any]] = Field(default=None, alias="assistantContext")
    chat_history: Optional[List[ChatMessage]] = Field(default=None, alias="chatHistory")
    api_key: Optional[str] = Field(default=None, alias="apiKey")
    locale: Optional[str] = None


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
