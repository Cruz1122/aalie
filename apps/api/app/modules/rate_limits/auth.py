"""Authentication for the private BFF-to-API rate-limit check."""

from __future__ import annotations

import hmac
import os

from fastapi import Header, HTTPException, status


def _service_token() -> str:
    """Resolve the internal token, keeping the existing HMAC as a migration fallback."""

    return (
        os.getenv("AALIE_RATE_LIMIT_SERVICE_TOKEN", "").strip()
        or os.getenv("RATE_LIMIT_HMAC_SECRET", "").strip()
    )


def require_rate_limit_service(
    service_token: str | None = Header(
        default=None,
        alias="x-aalie-rate-limit-service",
    ),
) -> None:
    """Reject callers that cannot prove they are the trusted BFF service."""

    expected = _service_token()
    if not expected or not service_token or not hmac.compare_digest(service_token, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Internal rate-limit service authentication required",
        )
