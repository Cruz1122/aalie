from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import case
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from ...db.models.mf3 import RateLimitBucket
from .schemas import RateLimitScope

DEFAULT_LIMITS: dict[RateLimitScope, tuple[int, int]] = {
    "parse": (120, 300),
    "analysis": (30, 120),
    "trace": (10, 40),
    "quiz": (20, 60),
    "export_text": (10, 30),
    "export_pdf": (2, 8),
    "llm": (5, 20),
}
WINDOW_SECONDS = 60


@dataclass(frozen=True)
class RateLimitDecision:
    allowed: bool
    limit: int
    remaining: int
    retry_after_seconds: int
    reset_at: datetime


def _configured_limit(scope: RateLimitScope, authenticated: bool) -> int:
    anon_default, auth_default = DEFAULT_LIMITS[scope]
    suffix = "AUTH" if authenticated else "ANON"
    default = auth_default if authenticated else anon_default
    raw = os.getenv(f"AALIE_RATE_LIMIT_{scope.upper()}_{suffix}", str(default)).strip()
    try:
        value = int(raw)
    except ValueError as exc:
        raise RuntimeError(f"Invalid rate limit for {scope}/{suffix}") from exc
    if value < 1 or value > 100_000:
        raise RuntimeError(f"Out-of-range rate limit for {scope}/{suffix}")
    return value


def consume_rate_limit(
    db: Session,
    *,
    scope: RateLimitScope,
    subject_hash: str,
    authenticated: bool,
    now: datetime | None = None,
) -> RateLimitDecision:
    current = now or datetime.now(timezone.utc)
    reset = current + timedelta(seconds=WINDOW_SECONDS)
    limit = _configured_limit(scope, authenticated)

    statement = insert(RateLimitBucket).values(
        scope=scope,
        subject_hash=subject_hash,
        window_started_at=current,
        reset_at=reset,
        request_count=1,
        updated_at=current,
    )
    expired = RateLimitBucket.reset_at <= current
    statement = statement.on_conflict_do_update(
        index_elements=[RateLimitBucket.scope, RateLimitBucket.subject_hash],
        set_={
            "window_started_at": case((expired, current), else_=RateLimitBucket.window_started_at),
            "reset_at": case((expired, reset), else_=RateLimitBucket.reset_at),
            "request_count": case((expired, 1), else_=RateLimitBucket.request_count + 1),
            "updated_at": current,
        },
    ).returning(RateLimitBucket.request_count, RateLimitBucket.reset_at)

    row = db.execute(statement).one()
    db.commit()
    count = int(row.request_count)
    reset_at = row.reset_at
    remaining = max(0, limit - count)
    retry = max(0, int((reset_at - current).total_seconds()))
    return RateLimitDecision(
        allowed=count <= limit,
        limit=limit,
        remaining=remaining,
        retry_after_seconds=retry if count > limit else 0,
        reset_at=reset_at,
    )


def prune_expired_buckets(db: Session, *, before: datetime | None = None) -> int:
    cutoff = before or datetime.now(timezone.utc) - timedelta(days=1)
    deleted = db.query(RateLimitBucket).filter(RateLimitBucket.reset_at < cutoff).delete()
    db.commit()
    return int(deleted)
