"""Closed email allowlist used while AALIE is in evaluation."""

from __future__ import annotations

import os
from threading import RLock
from time import monotonic

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from .database import get_engine

ALLOWLIST_TTL_SECONDS = 30.0
_TRUTHY = {"1", "true", "yes", "on"}

_lock = RLock()
_cached_emails: frozenset[str] | None = None
_cached_at = 0.0


def restricted_access_enabled() -> bool:
    """True only when the evaluation gate is explicitly turned on."""

    return os.getenv("AALIE_RESTRICTED_ACCESS", "").strip().lower() in _TRUTHY


def clear_allowlist_cache() -> None:
    """Drop the in-process allowlist snapshot. Used by tests."""

    global _cached_emails, _cached_at
    with _lock:
        _cached_emails = None
        _cached_at = 0.0


def _load_allowlist() -> frozenset[str] | None:
    """Return the cached allowlist, or None when the database cannot be read."""

    global _cached_emails, _cached_at
    now = monotonic()
    with _lock:
        if _cached_emails is not None and now - _cached_at < ALLOWLIST_TTL_SECONDS:
            return _cached_emails

    try:
        with get_engine().connect() as connection:
            rows = connection.execute(text("SELECT email FROM auth.access_allowlist")).scalars()
            emails = frozenset(
                email.strip().casefold()
                for email in rows
                if isinstance(email, str) and email.strip()
            )
    except (SQLAlchemyError, RuntimeError, OSError):
        return None

    with _lock:
        _cached_emails = emails
        _cached_at = monotonic()
    return emails


def is_email_allowlisted(email: str | None) -> bool:
    """Fail closed: a missing email or a database error is not authorized."""

    if email is None:
        return False
    normalized = email.strip().casefold()
    if not normalized:
        return False
    allowlist = _load_allowlist()
    if allowlist is None:
        return False
    return normalized in allowlist
