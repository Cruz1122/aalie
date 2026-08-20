"""JWT verification for the Better Auth to FastAPI service boundary."""

from __future__ import annotations

import os
from dataclasses import dataclass
from threading import Condition, RLock
from time import monotonic
from typing import Any

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

MAX_BEARER_TOKEN_BYTES = 8_192
MAX_JWKS_BYTES = 64 * 1_024
MAX_JWKS_KEYS = 16
JWKS_TTL_SECONDS = 300.0
JWKS_STALE_SECONDS = 300.0
UNKNOWN_KID_REFRESH_SECONDS = 30.0

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class IdentityClaims:
    user_id: str
    role: str


def _required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


class JwksCache:
    """Bounded JWKS cache with TTL, stale fallback and single-flight refresh."""

    def __init__(self) -> None:
        self._keys: dict[str, Any] = {}
        self._lock = RLock()
        self._condition = Condition(self._lock)
        self._refreshing = False
        self._last_refresh = 0.0
        self._expires_at = 0.0
        self._client = httpx.Client(
            timeout=httpx.Timeout(2.0, connect=0.75),
            limits=httpx.Limits(max_connections=4, max_keepalive_connections=2),
        )

    def clear(self) -> None:
        with self._condition:
            self._keys = {}
            self._last_refresh = 0.0
            self._expires_at = 0.0
            self._refreshing = False
            self._condition.notify_all()

    def _fetch(self) -> dict[str, Any]:
        response = self._client.get(_required_env("AUTH_JWKS_URL"))
        response.raise_for_status()
        if len(response.content) > MAX_JWKS_BYTES:
            raise ValueError("JWKS response is too large")

        body = response.json()
        keys = body.get("keys") if isinstance(body, dict) else None
        if not isinstance(keys, list) or not keys or len(keys) > MAX_JWKS_KEYS:
            raise ValueError("JWKS response has an invalid number of keys")

        parsed: dict[str, Any] = {}
        for item in keys:
            if not isinstance(item, dict):
                raise ValueError("JWKS response contains an invalid key")
            kid = item.get("kid")
            if (
                not isinstance(kid, str)
                or not kid
                or item.get("kty") != "OKP"
                or item.get("crv") != "Ed25519"
                or item.get("alg") != "EdDSA"
                or item.get("use", "sig") != "sig"
            ):
                raise ValueError("JWKS response contains a non-Ed25519 signing key")
            parsed[kid] = jwt.PyJWK(item, algorithm="EdDSA").key

        if len(parsed) != len(keys):
            raise ValueError("JWKS response contains duplicate key identifiers")
        return parsed

    def resolve(self, kid: str) -> Any | None:
        now = monotonic()
        with self._condition:
            cached = self._keys.get(kid)
            if cached is not None and now < self._expires_at:
                return cached
            if cached is None and now - self._last_refresh < UNKNOWN_KID_REFRESH_SECONDS:
                return None

            if self._refreshing:
                self._condition.wait_for(lambda: not self._refreshing, timeout=2.5)
                return self._keys.get(kid)
            self._refreshing = True

        try:
            refreshed = self._fetch()
        except Exception:
            with self._condition:
                self._refreshing = False
                self._condition.notify_all()
                stale = self._keys.get(kid)
                if stale is not None and now < self._expires_at + JWKS_STALE_SECONDS:
                    return stale
            raise

        refreshed_at = monotonic()
        with self._condition:
            self._keys = refreshed
            self._last_refresh = refreshed_at
            self._expires_at = refreshed_at + JWKS_TTL_SECONDS
            self._refreshing = False
            self._condition.notify_all()
            return self._keys.get(kid)


_jwks_cache = JwksCache()


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing bearer token",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _verify_token(token: str) -> IdentityClaims:
    try:
        if len(token.encode("utf-8")) > MAX_BEARER_TOKEN_BYTES or token.count(".") != 2:
            raise jwt.InvalidTokenError("invalid token size or shape")

        header = jwt.get_unverified_header(token)
        if header.get("alg") != "EdDSA":
            raise jwt.InvalidTokenError("invalid algorithm")
        kid = header.get("kid")
        if not isinstance(kid, str) or not kid or len(kid) > 128:
            raise jwt.InvalidTokenError("missing or invalid kid")

        key = _jwks_cache.resolve(kid)
        if key is None:
            raise jwt.InvalidTokenError("unknown kid")

        payload = jwt.decode(
            token,
            key,
            algorithms=["EdDSA"],
            issuer=_required_env("AUTH_JWT_ISSUER"),
            audience=_required_env("AUTH_JWT_AUDIENCE"),
            options={"require": ["exp", "iss", "aud", "sub"]},
        )
        user_id = payload.get("sub")
        role = payload.get("role")
        if not isinstance(user_id, str) or not user_id:
            raise jwt.InvalidTokenError("missing sub")
        if role not in {"USER", "ADMIN"}:
            raise jwt.InvalidTokenError("invalid role")
        return IdentityClaims(user_id=user_id, role=role)
    except (jwt.InvalidTokenError, httpx.HTTPError, ValueError, KeyError, TypeError) as exc:
        raise _unauthorized() from exc


def get_identity(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> IdentityClaims:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized()
    return _verify_token(credentials.credentials)


def require_admin(identity: IdentityClaims = Depends(get_identity)) -> IdentityClaims:
    if identity.role != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return identity


def clear_jwks_cache() -> None:
    """Clear the process cache for tests and operational key rotation."""

    _jwks_cache.clear()
