from __future__ import annotations

from fastapi import HTTPException, Request, status

from ...core.auth import IdentityClaims, _verify_token


def optional_identity_from_request(request: Request) -> IdentityClaims | None:
    raw = request.headers.get("authorization", "").strip()
    if not raw:
        return None
    if not raw.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization")
    token = raw[7:].strip()
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authorization")
    return _verify_token(token)
