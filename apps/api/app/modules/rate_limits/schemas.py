from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

RateLimitScope = Literal[
    "parse",
    "analysis",
    "trace",
    "quiz",
    "export_text",
    "export_pdf",
    "llm",
]


class RateLimitCheckRequest(BaseModel):
    scope: RateLimitScope
    subjectHash: str = Field(pattern=r"^[0-9a-f]{64}$")
    authenticated: bool


class RateLimitCheckResponse(BaseModel):
    allowed: bool
    limit: int
    remaining: int
    retryAfterSeconds: int
    resetAt: str
