from fastapi.testclient import TestClient
from apps.api.app.main import app

client = TestClient(app)

def _post(source: str):
    return client.post("/parse", json={"source": source})

def test_parse_ok_assign_and_for():
    src = "{ a <- 1; for i <- 1 to 3 do { A[i] <- i } }"
    r = _post(src)
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is True
    assert isinstance(data["ast"], dict)
    assert data["errors"] == []

def test_parse_error_unclosed_block():
    r = _post("{ a <- 1 ")
    assert r.status_code == 200
    data = r.json()
    assert data["ok"] is False
    assert len(data["errors"]) >= 1

def test_parse_if_else():
    r = _post("{ a <- 1; if (a>0) then { a <- a+1; } else { a <- 0; } }")
    assert r.status_code == 200
    assert r.json()["ok"] is True
