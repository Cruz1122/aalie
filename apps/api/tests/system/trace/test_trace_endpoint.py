import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = [pytest.mark.system, pytest.mark.trace]

client = TestClient(app)


def test_trace_endpoint_contract():
    source = """linear(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    i <- i + 1;
  END
END
"""
    res = client.post(
        "/analyze/trace",
        json={
            "source": source,
            "case": "worst",
            "input_size": 3,
            "initial_variables": {},
            "locale": "en",
        },
    )
    assert res.status_code == 200
    payload = res.json()
    assert payload.get("ok") is True
    assert "trace" in payload


def test_trace_factorial_recursive_contract():
    source = """fact(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END;
    RETURN n * fact(n - 1);
END
"""
    res = client.post(
        "/analyze/trace",
        json={"source": source, "case": "worst", "input_size": 3},
    )
    assert res.status_code == 200
    payload = res.json()
    assert payload.get("ok") is True
    assert payload["algorithmKind"] == "recursive"
    assert payload["trace"]["kind"] == "recursive"
    assert payload["trace"]["summary"]["algorithmKind"] == "recursive"
    assert "recursionTree" in payload["trace"]


def test_trace_euclides_does_not_mark_iterations_as_truncated():
    source = """mcd(a, b) BEGIN
    WHILE (b != 0) DO BEGIN
        temp <- b;
        b <- a MOD b;
        a <- temp;
    END
    RETURN a;
END
"""
    res = client.post(
        "/analyze/trace",
        json={"source": source, "case": "worst", "input_size": 24},
    )
    assert res.status_code == 200
    payload = res.json()
    assert payload.get("ok") is True
    assert payload["algorithmKind"] == "iterative"
    steps = payload.get("trace", {}).get("steps", [])
    assert steps
    assert not any((step.get("iteration") or {}).get("truncated") for step in steps)


def test_trace_invalid_source_returns_error_payload():
    res = client.post(
        "/analyze/trace",
        json={"source": "invalid {[", "case": "worst"},
    )
    assert res.status_code == 200
    payload = res.json()
    assert payload.get("ok") is False
    assert payload["errors"]


def test_trace_missing_source_returns_422():
    res = client.post("/analyze/trace", json={"case": "worst"})
    assert res.status_code == 422
