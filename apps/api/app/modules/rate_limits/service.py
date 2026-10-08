from __future__ import annotations

import hashlib
import hmac
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from threading import Lock
from time import monotonic

from sqlalchemy import case, or_, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from ...db.models.mf3 import AbuseBan, RateLimitBucket
from .schemas import RateLimitScope

DEFAULT_LIMITS: dict[RateLimitScope, tuple[int, int]] = {
    "parse": (120, 300),
    "analysis": (30, 120),
    "trace": (10, 40),
    "quiz": (20, 60),
    "export_text": (10, 30),
    "export_pdf": (2, 8),
    "llm": (5, 20),
    "llm_ucaldas": (5, 5),
    "llm_backend": (5, 5),
}
WINDOW_SECONDS = 60
ABUSE_SCOPES = {"llm", "llm_ucaldas", "llm_backend"}
ABUSE_REASON_CODE = "LLM_RATE_SPAM"
PRUNE_INTERVAL_SECONDS = 3600.0

_prune_lock = Lock()
_last_prune_at = 0.0


@dataclass(frozen=True)
class RateLimitDecision:
    allowed: bool
    limit: int
    remaining: int
    retry_after_seconds: int
    reset_at: datetime
    blocked: bool = False
    reason_code: str | None = None


def hash_rate_limit_subject(subject: str) -> str:
    secret = os.getenv("RATE_LIMIT_HMAC_SECRET", "").strip()
    if not secret:
        raise RuntimeError("RATE_LIMIT_HMAC_SECRET is required for server quotas")
    return hmac.new(secret.encode("utf-8"), subject.encode("utf-8"), hashlib.sha256).hexdigest()


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


def _configured_positive_int(name: str, default: int, maximum: int) -> int:
    raw = os.getenv(name, str(default)).strip()
    try:
        value = int(raw)
    except ValueError as exc:
        raise RuntimeError(f"Invalid integer for {name}") from exc
    if value < 1 or value > maximum:
        raise RuntimeError(f"Out-of-range integer for {name}")
    return value


def _active_abuse_ban(db: Session, *, subject_hash: str, now: datetime) -> AbuseBan | None:
    ban = db.get(AbuseBan, subject_hash)
    if ban is not None and ban.banned_until is not None and ban.banned_until > now:
        return ban
    return None


def _record_abuse_violation(db: Session, *, subject_hash: str, now: datetime) -> datetime | None:
    strike_threshold = _configured_positive_int("AALIE_ABUSE_STRIKES_TO_BAN", 3, 1000)
    strike_window_seconds = _configured_positive_int(
        "AALIE_ABUSE_STRIKE_WINDOW_SECONDS", 300, 86_400
    )
    ban_seconds = _configured_positive_int("AALIE_ABUSE_BAN_SECONDS", 3600, 2_592_000)
    window_cutoff = now - timedelta(seconds=strike_window_seconds)

    statement = insert(AbuseBan).values(
        subject_hash=subject_hash,
        strike_count=1,
        strike_window_started_at=now,
        last_violation_at=now,
        banned_until=None,
        reason_code=ABUSE_REASON_CODE,
        updated_at=now,
    )
    strike_window_expired = AbuseBan.strike_window_started_at <= window_cutoff
    statement = statement.on_conflict_do_update(
        index_elements=[AbuseBan.subject_hash],
        set_={
            "strike_count": case((strike_window_expired, 1), else_=AbuseBan.strike_count + 1),
            "strike_window_started_at": case(
                (strike_window_expired, now), else_=AbuseBan.strike_window_started_at
            ),
            "last_violation_at": now,
            "updated_at": now,
            "reason_code": ABUSE_REASON_CODE,
        },
    ).returning(AbuseBan.strike_count)

    row = db.execute(statement).one()
    strike_count = int(row.strike_count)
    banned_until: datetime | None = None
    if strike_count >= strike_threshold:
        banned_until = now + timedelta(seconds=ban_seconds)
        db.execute(
            update(AbuseBan)
            .where(AbuseBan.subject_hash == subject_hash)
            .values(
                strike_count=0,
                banned_until=banned_until,
                reason_code=ABUSE_REASON_CODE,
                updated_at=now,
            )
        )
    db.commit()
    return banned_until


def _maybe_prune_expired_buckets(db: Session, *, now: datetime) -> None:
    """Bound persistent quota state without making cleanup a request-level dependency."""

    global _last_prune_at

    current = monotonic()
    if current - _last_prune_at < PRUNE_INTERVAL_SECONDS:
        return
    if not _prune_lock.acquire(blocking=False):
        return
    try:
        current = monotonic()
        if current - _last_prune_at < PRUNE_INTERVAL_SECONDS:
            return
        prune_expired_buckets(db, before=now - timedelta(days=1))
        _last_prune_at = current
    except Exception:
        db.rollback()
    finally:
        _prune_lock.release()


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
    _maybe_prune_expired_buckets(db, now=current)

    active_ban = _active_abuse_ban(db, subject_hash=subject_hash, now=current)
    if active_ban is not None and active_ban.banned_until is not None:
        retry = max(1, int((active_ban.banned_until - current).total_seconds()))
        return RateLimitDecision(
            allowed=False,
            limit=limit,
            remaining=0,
            retry_after_seconds=retry,
            reset_at=active_ban.banned_until,
            blocked=True,
            reason_code=active_ban.reason_code,
        )

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
    allowed = count <= limit
    if not allowed and scope in ABUSE_SCOPES:
        banned_until = _record_abuse_violation(
            db,
            subject_hash=subject_hash,
            now=current,
        )
        if banned_until is not None:
            return RateLimitDecision(
                allowed=False,
                limit=limit,
                remaining=0,
                retry_after_seconds=max(1, int((banned_until - current).total_seconds())),
                reset_at=banned_until,
                blocked=True,
                reason_code=ABUSE_REASON_CODE,
            )
    return RateLimitDecision(
        allowed=allowed,
        limit=limit,
        remaining=remaining,
        retry_after_seconds=retry if not allowed else 0,
        reset_at=reset_at,
    )


def prune_expired_buckets(db: Session, *, before: datetime | None = None) -> int:
    cutoff = before or datetime.now(timezone.utc) - timedelta(days=1)
    deleted = db.query(RateLimitBucket).filter(RateLimitBucket.reset_at < cutoff).delete()
    deleted += (
        db.query(AbuseBan)
        .filter(
            AbuseBan.updated_at < cutoff,
            or_(AbuseBan.banned_until.is_(None), AbuseBan.banned_until < cutoff),
        )
        .delete()
    )
    db.commit()
    return int(deleted)
