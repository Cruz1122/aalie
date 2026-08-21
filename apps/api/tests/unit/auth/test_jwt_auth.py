from __future__ import annotations

import base64
import json
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone

import httpx
import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from fastapi import HTTPException

from app.core import auth

pytestmark = [pytest.mark.fast, pytest.mark.unit]


def _b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


class FakeResponse:
    def __init__(self, body: dict[str, object]) -> None:
        self.body = body
        self.content = json.dumps(body).encode()

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict[str, object]:
        return self.body


@pytest.fixture
def signing_material(monkeypatch: pytest.MonkeyPatch):
    private = Ed25519PrivateKey.generate()
    public = private.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    jwks = {
        "keys": [
            {
                "kty": "OKP",
                "crv": "Ed25519",
                "alg": "EdDSA",
                "use": "sig",
                "x": _b64(public),
                "kid": "key-1",
            }
        ]
    }
    monkeypatch.setenv("AUTH_JWT_ISSUER", "http://localhost:3000")
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", "urn:aalie:api")
    monkeypatch.setenv("AUTH_JWKS_URL", "http://web:3000/api/auth/jwks")
    monkeypatch.setattr(httpx.Client, "get", lambda *_args, **_kwargs: FakeResponse(jwks))
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


def test_missing_required_exp_claim_is_rejected(signing_material: Ed25519PrivateKey) -> None:
    now = datetime.now(timezone.utc)
    token = jwt.encode(
        {
            "sub": "user-123",
            "role": "USER",
            "iss": "http://localhost:3000",
            "aud": "urn:aalie:api",
            "iat": now,
        },
        signing_material,
        algorithm="EdDSA",
        headers={"kid": "key-1"},
    )

    with pytest.raises(HTTPException) as error:
        auth._verify_token(token)
    assert error.value.status_code == 401


def test_unknown_kid_refreshes_jwks(
    signing_material: Ed25519PrivateKey, monkeypatch: pytest.MonkeyPatch
) -> None:
    token = _token(signing_material)
    calls = 0

    original_get = httpx.Client.get

    def counted_get(*args: object, **kwargs: object):
        nonlocal calls
        calls += 1
        return original_get(*args, **kwargs)

    monkeypatch.setattr(httpx.Client, "get", counted_get)
    auth.clear_jwks_cache()
    assert auth._verify_token(token).user_id == "user-123"
    assert calls == 1


def test_unknown_kid_is_rate_limited(
    signing_material: Ed25519PrivateKey, monkeypatch: pytest.MonkeyPatch
) -> None:
    valid_token = _token(signing_material)
    calls = 0
    original_get = httpx.Client.get

    def counted_get(*args: object, **kwargs: object):
        nonlocal calls
        calls += 1
        return original_get(*args, **kwargs)

    monkeypatch.setattr(httpx.Client, "get", counted_get)
    auth.clear_jwks_cache()
    assert auth._verify_token(valid_token).user_id == "user-123"

    unknown_token = jwt.encode(
        {"sub": "user-123"},
        signing_material,
        algorithm="EdDSA",
        headers={"kid": "unknown-key"},
    )
    for _ in range(5):
        with pytest.raises(HTTPException):
            auth._verify_token(unknown_token)
    assert calls == 1


def test_initial_jwks_refresh_is_single_flight(
    signing_material: Ed25519PrivateKey, monkeypatch: pytest.MonkeyPatch
) -> None:
    token = _token(signing_material)
    calls = 0
    original_get = httpx.Client.get

    def slow_get(*args: object, **kwargs: object):
        nonlocal calls
        calls += 1
        time.sleep(0.05)
        return original_get(*args, **kwargs)

    monkeypatch.setattr(httpx.Client, "get", slow_get)
    auth.clear_jwks_cache()
    with ThreadPoolExecutor(max_workers=8) as executor:
        identities = list(executor.map(auth._verify_token, [token] * 8))

    assert {identity.user_id for identity in identities} == {"user-123"}
    assert calls == 1


def test_oversized_and_wrong_algorithm_tokens_do_not_fetch_jwks(
    signing_material: Ed25519PrivateKey, monkeypatch: pytest.MonkeyPatch
) -> None:
    calls = 0

    def counted_get(*_args: object, **_kwargs: object):
        nonlocal calls
        calls += 1
        raise AssertionError("JWKS must not be fetched")

    monkeypatch.setattr(httpx.Client, "get", counted_get)
    auth.clear_jwks_cache()
    wrong_algorithm = jwt.encode(
        {"sub": "user-123"}, "a" * 32, algorithm="HS256", headers={"kid": "key-1"}
    )

    for token in ("a" * (auth.MAX_BEARER_TOKEN_BYTES + 1), wrong_algorithm):
        with pytest.raises(HTTPException) as error:
            auth._verify_token(token)
        assert error.value.status_code == 401
    assert calls == 0


def test_admin_guard_rejects_user_and_accepts_admin() -> None:
    with pytest.raises(HTTPException) as error:
        auth.require_admin(auth.IdentityClaims(user_id="user-123", role="USER"))
    assert error.value.status_code == 403
    assert auth.require_admin(auth.IdentityClaims(user_id="admin-1", role="ADMIN")).role == "ADMIN"
