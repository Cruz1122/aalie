from __future__ import annotations

import base64
from datetime import datetime, timedelta, timezone

import jwt
import pytest
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat
from fastapi.testclient import TestClient

from app.core import access_allowlist, auth
from app.main import app

pytestmark = [pytest.mark.fast, pytest.mark.unit]

client = TestClient(app)


def _b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


@pytest.fixture
def signing_material(monkeypatch: pytest.MonkeyPatch):
    private = Ed25519PrivateKey.generate()
    public = private.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
    key = jwt.PyJWK(
        {
            "kty": "OKP",
            "crv": "Ed25519",
            "alg": "EdDSA",
            "use": "sig",
            "x": _b64(public),
            "kid": "key-1",
        },
        algorithm="EdDSA",
    ).key
    monkeypatch.setenv("AUTH_JWT_ISSUER", "http://localhost:3000")
    monkeypatch.setenv("AUTH_JWT_AUDIENCE", "urn:aalie:api")
    monkeypatch.setattr(auth._jwks_cache, "resolve", lambda _kid: key)
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
        "email": "student@ucaldas.edu.co",
    }
    payload.update(overrides)
    return jwt.encode(payload, private, algorithm="EdDSA", headers={"kid": "key-1"})


def test_allowlist_lookup_fails_closed_when_the_database_is_unavailable(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    access_allowlist.clear_allowlist_cache()

    def explode():
        raise RuntimeError("database unavailable")

    monkeypatch.setattr(access_allowlist, "get_engine", explode)

    assert access_allowlist.is_email_allowlisted("student@ucaldas.edu.co") is False


def test_allowlist_lookup_matches_normalized_email(monkeypatch: pytest.MonkeyPatch) -> None:
    access_allowlist.clear_allowlist_cache()

    class Result:
        def scalars(self):
            return [" Student@UCALDAS.EDU.CO ", "other@ucaldas.edu.co"]

    class Connection:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return False

        def execute(self, _statement):
            return Result()

    class Engine:
        def connect(self):
            return Connection()

    monkeypatch.setattr(access_allowlist, "get_engine", lambda: Engine())

    assert access_allowlist.is_email_allowlisted("student@ucaldas.edu.co") is True
    assert access_allowlist.is_email_allowlisted("missing@ucaldas.edu.co") is False
    access_allowlist.clear_allowlist_cache()


def test_restricted_api_rejects_anonymous_and_unknown_emails(
    monkeypatch: pytest.MonkeyPatch,
    signing_material: Ed25519PrivateKey,
) -> None:
    monkeypatch.setenv("AALIE_RESTRICTED_ACCESS", "true")
    monkeypatch.setattr(access_allowlist, "is_email_allowlisted", lambda email: False)

    anonymous = client.post("/analyze/open", json={})
    assert anonymous.status_code == 401

    denied = client.post(
        "/analyze/open",
        json={},
        headers={"Authorization": f"Bearer {_token(signing_material)}"},
    )
    assert denied.status_code == 403
    assert denied.json()["detail"] == "Access allowlist required"


def test_restricted_api_allows_listed_emails_and_health(
    monkeypatch: pytest.MonkeyPatch,
    signing_material: Ed25519PrivateKey,
) -> None:
    monkeypatch.setenv("AALIE_RESTRICTED_ACCESS", "true")
    monkeypatch.setattr(
        access_allowlist,
        "is_email_allowlisted",
        lambda email: email == "student@ucaldas.edu.co",
    )

    health = client.get("/health/live")
    assert health.status_code == 200

    allowed = client.post(
        "/analyze/open",
        json={},
        headers={"Authorization": f"Bearer {_token(signing_material)}"},
    )
    assert allowed.status_code != 401
    assert allowed.status_code != 403


def test_restricted_access_stays_off_unless_enabled(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("AALIE_RESTRICTED_ACCESS", raising=False)
    response = client.post("/analyze/open", json={})
    assert response.status_code != 401
