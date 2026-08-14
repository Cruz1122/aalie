#!/usr/bin/env python3
"""Critical smoke test against the running production Compose stack."""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.request
import zipfile
from io import BytesIO

BASE = os.environ.get("AALIE_BASE_URL", "http://127.0.0.1:3000").rstrip("/")
API_BASE = os.environ.get("AALIE_API_URL", "http://127.0.0.1:8000").rstrip("/")
SOURCE = """linear(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    x <- i;
  END
END
"""
WHILE_SOURCE = """linear(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    x <- 1;
    i <- i + 1;
  END
END
"""
RECURSIVE_SOURCE = """busquedaBinaria(A, x, inicio, fin) BEGIN
  IF (inicio > fin) THEN BEGIN
    RETURN -1;
  END
  mitad <- (inicio + fin) / 2;
  IF (A[mitad] = x) THEN BEGIN
    RETURN mitad;
  END
  IF (x < A[mitad]) THEN BEGIN
    RETURN busquedaBinaria(A, x, inicio, mitad - 1);
  END
  ELSE BEGIN
    RETURN busquedaBinaria(A, x, mitad + 1, fin);
  END
END
"""


def request(path: str, payload: object | None = None, base: str = BASE) -> tuple[int, dict[str, str], bytes]:
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{base}{path}",
        data=data,
        headers={"content-type": "application/json"} if data else {},
        method="POST" if data else "GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as response:
            return response.status, dict(response.headers), response.read()
    except urllib.error.HTTPError as error:
        return error.code, dict(error.headers), error.read()


def expect_json(path: str, payload: object | None = None, base: str = BASE) -> dict:
    status, _, body = request(path, payload, base)
    assert 200 <= status < 300, f"{path}: HTTP {status}: {body[:500]!r}"
    value = json.loads(body)
    assert value.get("ok", True) is not False, f"{path}: {value}"
    return value


def main() -> int:
    api_live = expect_json("/health/live", base=API_BASE)
    assert api_live.get("status") == "live"
    api_ready = expect_json("/health/ready", base=API_BASE)
    assert all(api_ready.get("checks", {}).values())
    expect_json("/api/health/live")
    health = expect_json("/api/health")
    assert health.get("service") == "api"

    parsed = expect_json("/api/grammar/parse", {"source": SOURCE})
    analysis = expect_json("/api/analyze/open", {"source": SOURCE, "mode": "all"})
    assert analysis.get("worst", {}).get("ok") is True
    while_analysis = expect_json("/api/analyze/open", {"source": WHILE_SOURCE, "mode": "all"})
    assert while_analysis.get("worst", {}).get("ok") is True
    recursive_analysis = expect_json("/api/analyze/open", {"source": RECURSIVE_SOURCE, "mode": "all"})
    assert recursive_analysis.get("worst", {}).get("ok") is True

    trace = expect_json(
        "/api/analyze/trace",
        {
            "source": SOURCE,
            "case": "worst",
            "input_size": 4,
            "initial_variables": {"n": 4},
            "locale": "en",
        },
    )
    assert trace.get("ok") is True

    session = expect_json(
        "/api/quizzes/session",
        {"locale": "en", "sessionPreferences": {"questionCount": 1}},
    )
    assert session.get("sessionId") and session.get("questions")
    question = session["questions"][0]
    evaluated = expect_json(
        "/api/quizzes/evaluate",
        {
            "sessionId": session["sessionId"],
            "questionIds": [question["questionId"]],
            "answers": [{"questionId": question["questionId"], "selectedOptionIds": []}],
            "locale": "en",
        },
    )
    assert evaluated.get("sessionId") == session["sessionId"]

    for formats, expected_type in [(["markdown"], "text/markdown"), (["latex"], "application/x-tex"), (["pdf"], "application/pdf")]:
        status, headers, body = request(
            "/api/export/report",
            {"source": SOURCE, "formats": formats, "locale": "en", "includeZipBundle": False},
        )
        assert status == 200 and len(body) > 0
        assert headers.get("content-type", "").startswith(expected_type)
        if formats == ["pdf"]:
            assert body.startswith(b"%PDF")

    status, headers, body = request(
        "/api/export/report",
        {"source": SOURCE, "formats": ["markdown", "pdf"], "locale": "en", "includeZipBundle": True},
    )
    assert status == 200 and headers.get("content-type", "").startswith("application/zip")
    with zipfile.ZipFile(BytesIO(body)) as bundle:
        names = set(bundle.namelist())
        assert {"manifest.json", "snapshot.json"}.issubset(names)
        snapshot = json.loads(bundle.read("snapshot.json"))
        assert snapshot.get("contentHash") and snapshot.get("globalResult")

    with urllib.request.urlopen(f"{BASE}/es/analyzer", timeout=30) as response:
        html = response.read()
        assert response.status == 200
    assert re.search(rb"/_next/static/[^\"']+\.css", html)
    assert re.search(rb"/_next/static/[^\"']+\.js", html)
    with urllib.request.urlopen(f"{BASE}/images/user-guide/es/01-about-page.webp", timeout=30) as response:
        assert response.status == 200 and response.read(16)
    print("production smoke: PASS")
    return 0


if __name__ == "__main__":
    sys.exit(main())
