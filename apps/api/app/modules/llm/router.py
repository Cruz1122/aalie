"""Router de endpoints LLM backend."""

from __future__ import annotations

from fastapi import APIRouter, Body, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from ...core.database import get_session_factory
from ..rate_limits.service import consume_rate_limit, hash_rate_limit_subject
from ..studies.identity import optional_identity_from_request
from .schemas import LLMRequest
from .service import (
    detect_api_key_provider,
    execute_llm_request,
    get_server_api_key,
    get_status_payload,
    is_ucaldas_identity,
)

router = APIRouter(prefix="/llm", tags=["llm"])


def _ucaldas_quota_response(
    payload: LLMRequest,
    identity,
) -> JSONResponse | None:
    if not is_ucaldas_identity(identity):
        return None

    has_request_key = detect_api_key_provider(payload.api_key) is not None
    has_server_key = bool(get_server_api_key())
    if not has_request_key and not has_server_key:
        return None

    subject_hash = hash_rate_limit_subject(f"user:{identity.user_id}")
    session_factory = get_session_factory()
    db: Session = session_factory()
    try:
        decision = consume_rate_limit(
            db,
            scope="llm_backend",
            subject_hash=subject_hash,
            authenticated=True,
        )
    finally:
        db.close()

    if decision.allowed:
        return None

    blocked = decision.blocked
    return JSONResponse(
        content={
            "ok": False,
            "error": "Account temporarily blocked" if blocked else "Too many requests",
            "errorCode": "ACCOUNT_TEMPORARILY_BLOCKED" if blocked else "RATE_LIMITED",
        },
        status_code=403 if blocked else 429,
        headers={"Retry-After": str(max(1, decision.retry_after_seconds))},
    )


@router.post("")
def llm_execute(request: Request, payload: LLMRequest = Body(...)):
    identity = optional_identity_from_request(request)
    quota_response = _ucaldas_quota_response(payload, identity)
    if quota_response is not None:
        return quota_response
    result = execute_llm_request(
        payload.model_dump(by_alias=True, exclude_none=True),
        identity=identity,
    )
    status = int(result.pop("status", 200))
    return JSONResponse(content=result, status_code=status)


@router.get("/status")
def llm_status(request: Request):
    return {
        "ok": True,
        "status": get_status_payload(optional_identity_from_request(request)),
    }
