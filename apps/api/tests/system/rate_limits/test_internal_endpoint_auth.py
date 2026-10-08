from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.core.database import get_db
from app.main import app
from app.modules.rate_limits import router as rate_limit_router
from app.modules.rate_limits.service import RateLimitDecision

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


def _payload() -> dict[str, object]:
    return {
        "scope": "llm_ucaldas",
        "subjectHash": "a" * 64,
        "authenticated": True,
    }


def test_internal_rate_limit_endpoint_requires_service_authentication(monkeypatch):
    monkeypatch.setenv("AALIE_RATE_LIMIT_SERVICE_TOKEN", "service-token")
    monkeypatch.delenv("RATE_LIMIT_HMAC_SECRET", raising=False)

    response = client.post("/internal/rate-limits/check", json=_payload())

    assert response.status_code == 401

    response = client.post(
        "/internal/rate-limits/check",
        json=_payload(),
        headers={"x-aalie-rate-limit-service": "wrong-token"},
    )

    assert response.status_code == 401


def test_internal_rate_limit_endpoint_accepts_trusted_bff(monkeypatch):
    monkeypatch.setenv("AALIE_RATE_LIMIT_SERVICE_TOKEN", "service-token")
    monkeypatch.delenv("RATE_LIMIT_HMAC_SECRET", raising=False)
    calls: list[dict[str, object]] = []

    class FakeSession:
        pass

    def override_db():
        yield FakeSession()

    def fake_consume_rate_limit(db, **kwargs):
        assert isinstance(db, FakeSession)
        calls.append(kwargs)
        return RateLimitDecision(
            allowed=True,
            limit=5,
            remaining=4,
            retry_after_seconds=0,
            reset_at=datetime.now(timezone.utc),
        )

    app.dependency_overrides[get_db] = override_db
    monkeypatch.setattr(rate_limit_router, "consume_rate_limit", fake_consume_rate_limit)
    try:
        response = client.post(
            "/internal/rate-limits/check",
            json=_payload(),
            headers={"x-aalie-rate-limit-service": "service-token"},
        )
    finally:
        app.dependency_overrides.pop(get_db, None)

    assert response.status_code == 200
    assert response.json()["allowed"] is True
    assert calls == [
        {
            "scope": "llm_ucaldas",
            "subject_hash": "a" * 64,
            "authenticated": True,
        }
    ]
