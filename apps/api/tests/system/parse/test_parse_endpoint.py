import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


def test_parse_endpoint_fast():
    source = """sum(n) BEGIN
  x <- 0;
  FOR i <- 1 TO n DO BEGIN
    x <- x + i;
  END
  RETURN x;
END
"""
    res = client.post("/grammar/parse", json={"source": source})
    assert res.status_code == 200
    payload = res.json()
    assert payload.get("ok") is True
