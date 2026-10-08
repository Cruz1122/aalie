from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ...core.database import get_db
from .auth import require_rate_limit_service
from .schemas import RateLimitCheckRequest, RateLimitCheckResponse
from .service import consume_rate_limit

router = APIRouter(prefix="/internal/rate-limits", tags=["internal-rate-limits"])


@router.post("/check", response_model=RateLimitCheckResponse)
def check_rate_limit(
    payload: RateLimitCheckRequest,
    _service: None = Depends(require_rate_limit_service),
    db: Session = Depends(get_db),
) -> RateLimitCheckResponse:
    decision = consume_rate_limit(
        db,
        scope=payload.scope,
        subject_hash=payload.subjectHash,
        authenticated=payload.authenticated,
    )
    return RateLimitCheckResponse(
        allowed=decision.allowed,
        limit=decision.limit,
        remaining=decision.remaining,
        retryAfterSeconds=decision.retry_after_seconds,
        resetAt=decision.reset_at.isoformat(),
        blocked=decision.blocked,
        reasonCode=decision.reason_code,
    )
