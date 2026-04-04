import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


def test_analyze_open_fast_endpoint():
    source = """linear(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    x <- i;
  END
END
"""
    res = client.post(
        "/analyze/open", json={"source": source, "mode": "worst", "locale": "en"}
    )
    assert res.status_code == 200
    payload = res.json()
    assert payload.get("ok") is True
    assert "totals" in payload
