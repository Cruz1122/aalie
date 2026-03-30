import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


def test_classify_endpoint_accepts_iterative_source():
    source = """test(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    x <- 1;
  END
END
"""
    res = client.post("/classify", json={"source": source})
    assert res.status_code == 200
    assert res.json() == {"ok": True, "kind": "iterative", "method": "ast"}


def test_classify_endpoint_accepts_recursive_source():
    source = """factorial(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN 1;
  END
  RETURN n * factorial(n - 1);
END
"""
    res = client.post("/classify", json={"source": source})
    assert res.status_code == 200
    assert res.json() == {"ok": True, "kind": "recursive", "method": "ast"}


def test_classify_endpoint_rejects_invalid_source():
    res = client.post("/classify", json={"source": "invalid syntax {["})
    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is False
    assert payload["errors"]


def test_classify_endpoint_requires_source_or_ast():
    res = client.post("/classify", json={})
    assert res.status_code == 200
    assert res.json() == {
        "ok": False,
        "errors": [{"message": "Se requiere 'source' o 'ast' en el payload"}],
    }
