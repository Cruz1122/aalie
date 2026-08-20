"""JWT verification for the Better Auth to FastAPI service boundary."""

from __future__ import annotations

import os
from dataclasses import dataclass
from threading import RLock
from typing import Any

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class IdentityClaims:
    user_id: str
    role: str


class JwksCache:
    def __init__(self) -> None:
        self._keys: dict[str, Any] = {}
        self._lock = RLock()

    def clear(self) -> None:
        with self._lock:
            self._keys = {}

    def get(self, kid: str) -> Any | None:
        with self._lock:
            return self._keys.get(kid)

    def refresh(self) -> None:
        url = os.getenv("AUTH_JWKS_URL", "http://localhost:3000/api/auth/jwks").strip()
        if not url:
            raise RuntimeError("AUTH_JWKS_URL is required")
        response = httpx.get(url, timeout=5.0)
        response.raise_for_status()
        body = response.json()
        keys = body.get("keys") if isinstance(body, dict) else None
        if not isinstance(keys, list):
            raise ValueError("JWKS response does not contain keys")
        parsed = {
            item["kid"]: jwt.PyJWK(item).key
            for item in keys
            if isinstance(item, dict) and isinstance(item.get("kid"), str)
        }
        if not parsed:
            raise ValueError("JWKS response contains no usable keys")
        with self._lock:
            self._keys = parsed


_jwks_cache = JwksCache()


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing bearer token",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _verify_token(token: str) -> IdentityClaims:
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        if not isinstance(kid, str) or not kid:
            raise jwt.InvalidTokenError("missing kid")

        key = _jwks_cache.get(kid)
        if key is None:
            _jwks_cache.refresh()
            key = _jwks_cache.get(kid)
        if key is None:
            raise jwt.InvalidTokenError("unknown kid")

        payload = jwt.decode(
            token,
            key,
            algorithms=["EdDSA"],
            issuer=os.getenv("AUTH_JWT_ISSUER", "http://localhost:3000"),
            audience=os.getenv("AUTH_JWT_AUDIENCE", "urn:aalie:api"),
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
