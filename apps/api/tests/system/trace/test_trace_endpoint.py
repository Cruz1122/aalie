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
