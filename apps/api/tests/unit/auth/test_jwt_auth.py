from __future__ import annotations

import base64
from datetime import datetime, timedelta, timezone

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from fastapi import HTTPException

from app.core import auth


def _b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


class FakeResponse:
    def __init__(self, body: dict[str, object]) -> None:
        self.body = body

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, object]:
        return self.body


@pytest.fixture
def signing_material(monkeypatch: pytest.MonkeyPatch):
    private = Ed25519PrivateKey.generate()
    public = private.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    jwks = {"keys": [{"kty": "OKP", "crv": "Ed25519", "x": _b64(public), "kid": "key-1"}]}
    monkeypatch.setenv("AUTH_JWT_ISSUER", "http://localhost:3000")
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", "urn:aalie:api")
    monkeypatch.setenv("AUTH_JWKS_URL", "http://web:3000/api/auth/jwks")
    monkeypatch.setattr(httpx, "get", lambda *_args, **_kwargs: FakeResponse(jwks))
    auth.clear_jwks_cache()
    return private


def _token(private: Ed25519PrivateKey, **overrides: object) -> str:
    now = datetime.now(timezone.utc)
    payload: dict[str, object] = {
        "sub": "user-123",
        "role": "USER",
        "iss": "http://localhost:3000",
        "aud": "urn:aalie:api",
        "iat": now,
        "exp": now + timedelta(minutes=5),
    }
    payload.update(overrides)
    return jwt.encode(payload, private, algorithm="EdDSA", headers={"kid": "key-1"})


def test_valid_jwt_is_verified(signing_material: Ed25519PrivateKey) -> None:
    identity = auth._verify_token(_token(signing_material))
    assert identity.user_id == "user-123"
    assert identity.role == "USER"


@pytest.mark.parametrize(
    "overrides",
    [
        {"exp": datetime.now(timezone.utc) - timedelta(minutes=1)},
        {"iss": "https://wrong.example"},
        {"aud": "wrong-audience"},
        {"role": "SUPERUSER"},
        {"sub": ""},
    ],
)
def test_invalid_claims_are_rejected(
    signing_material: Ed25519PrivateKey, overrides: dict[str, object]
) -> None:
    with pytest.raises(HTTPException) as error:
        auth._verify_token(_token(signing_material, **overrides))
    assert error.value.status_code == 401


def test_unknown_kid_refreshes_jwks(
    signing_material: Ed25519PrivateKey, monkeypatch: pytest.MonkeyPatch
) -> None:
    token = _token(signing_material)
    calls = 0

    original_get = httpx.get

    def counted_get(*args: object, **kwargs: object):
        nonlocal calls
        calls += 1
        return original_get(*args, **kwargs)

    monkeypatch.setattr(httpx, "get", counted_get)
    auth.clear_jwks_cache()
    assert auth._verify_token(token).user_id == "user-123"
    assert calls == 1


def test_admin_guard_rejects_user_and_accepts_admin() -> None:
    with pytest.raises(HTTPException) as error:
        auth.require_admin(auth.IdentityClaims(user_id="user-123", role="USER"))
    assert error.value.status_code == 403
    assert auth.require_admin(auth.IdentityClaims(user_id="admin-1", role="ADMIN")).role == "ADMIN"
