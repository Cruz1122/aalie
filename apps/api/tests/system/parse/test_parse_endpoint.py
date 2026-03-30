import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


def test_parse_endpoint_accepts_block_with_for_loop():
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


def test_parse_endpoint_reports_unclosed_block_error():
    res = client.post("/grammar/parse", json={"source": "{ a <- 1 "})
    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is False
    assert payload["ast"] is None
    assert payload["errors"]


def test_parse_endpoint_accepts_function_definition():
    source = """test(n) BEGIN
    x <- 1;
END
"""
    res = client.post("/grammar/parse", json={"source": source})
    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    assert payload["ast"]["body"][0]["type"] == "ProcDef"
