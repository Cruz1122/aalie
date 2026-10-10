"""Block product API calls unless the caller is on the evaluation allowlist."""

from __future__ import annotations

import anyio
from fastapi import HTTPException
from fastapi.responses import JSONResponse

from . import access_allowlist
from .auth import verify_access_token

_EXEMPT_PREFIXES = ("/health", "/internal/rate-limits")


def _bearer_token(headers: list[tuple[bytes, bytes]]) -> str | None:
    for name, value in headers:
        if name.lower() != b"authorization":
            continue
        raw = value.decode("latin-1").strip()
        scheme, _, token = raw.partition(" ")
        if scheme.lower() != "bearer" or not token.strip():
            return None
        return token.strip()
    return None


class RestrictedAccessMiddleware:
    """Require a Better Auth JWT whose email is in auth.access_allowlist."""

    def __init__(self, app) -> None:
        self.app = app

    async def __call__(self, scope, receive, send) -> None:
        if scope.get("type") != "http" or not access_allowlist.restricted_access_enabled():
            await self.app(scope, receive, send)
            return

        path = scope.get("path") or ""
        method = scope.get("method") or ""
        if method == "OPTIONS" or path.startswith(_EXEMPT_PREFIXES):
            await self.app(scope, receive, send)
            return

        token = _bearer_token(scope.get("headers") or [])
        if token is None:
            await self._reject(scope, receive, send, 401, "Invalid or missing bearer token")
            return

        try:
            identity = verify_access_token(token)
        except HTTPException:
            await self._reject(scope, receive, send, 401, "Invalid or missing bearer token")
            return

        allowed = await anyio.to_thread.run_sync(
            access_allowlist.is_email_allowlisted,
            identity.email,
        )
        if not allowed:
            await self._reject(scope, receive, send, 403, "Access allowlist required")
            return

        await self.app(scope, receive, send)

    @staticmethod
    async def _reject(scope, receive, send, status_code: int, detail: str) -> None:
        headers = {"WWW-Authenticate": "Bearer"} if status_code == 401 else None
        response = JSONResponse(
            {"detail": detail},
            status_code=status_code,
            headers=headers,
        )
        await response(scope, receive, send)
