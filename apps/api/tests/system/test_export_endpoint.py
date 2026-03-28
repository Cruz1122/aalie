import os
import shutil
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


def _has_pdflatex() -> bool:
    return shutil.which("pdflatex") is not None


def _create_client(extra_env: dict[str, str] | None = None) -> TestClient:
    env = {
        "CORS_ENABLED": "1",
        "CORS_ALLOWED_ORIGINS": "",
        "DEV_ALLOWED_ORIGINS": "http://localhost:3000,http://127.0.0.1:3000",
    }
    if extra_env:
        env.update(extra_env)

    with patch.dict(os.environ, env, clear=False):
        return TestClient(create_app())


def _build_export_payload(client: TestClient) -> dict:
    if not _has_pdflatex():
        pytest.skip("pdflatex no está disponible en el entorno de tests")

    source = """triangular(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    FOR j <- i TO n DO BEGIN
      x <- i + j;
    END
  END
END
"""

    parse_res = client.post("/grammar/parse", json={"source": source}).json()
    assert parse_res["ok"] is True

    classify_res = client.post("/classify", json={"source": source}).json()
    assert classify_res["ok"] is True

    analyze_res = client.post(
        "/analyze/open",
        json={
            "source": source,
            "mode": "all",
            "algorithm_kind": classify_res["kind"],
            "preferred_method": None,
            "avgModel": {"mode": "uniform", "predicates": {}},
            "locale": "en",
        },
    ).json()
    assert analyze_res["ok"] is True

    trace_res = client.post(
        "/analyze/trace",
        json={
            "source": source,
            "case": "worst",
            "input_size": 5,
            "initial_variables": None,
            "locale": "en",
        },
    ).json()
    assert trace_res["ok"] is True

    return {
        "source": source,
        "formats": ["pdf"],
        "includeZipBundle": False,
        "locale": "en",
        "includeTraceCases": ["worst"],
        "cachedParse": parse_res,
        "cachedClassify": {
            "kind": classify_res["kind"],
            "method": classify_res.get("method"),
        },
        "cachedAnalyze": analyze_res,
        "cachedTraceByCase": {"worst": trace_res},
    }


def test_export_report_returns_pdf_when_pdflatex_is_available():
    client = _create_client()
    export_payload = _build_export_payload(client)

    resp = client.post("/export/report", json=export_payload)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/pdf")
    assert resp.content and len(resp.content) > 1000

    assert "content-disposition" in resp.headers


def test_export_report_preflight_allows_configured_origin():
    allowed_origin = "https://frontend.example"
    client = _create_client({"CORS_ALLOWED_ORIGINS": allowed_origin})

    resp = client.options(
        "/export/report",
        headers={
            "Origin": allowed_origin,
            "Access-Control-Request-Method": "POST",
        },
    )

    assert resp.status_code == 200
    assert resp.headers["access-control-allow-origin"] == allowed_origin
    assert "POST" in resp.headers["access-control-allow-methods"]
    assert resp.headers["access-control-max-age"] == "600"


def test_export_report_preflight_rejects_disallowed_origin():
    client = _create_client({"CORS_ALLOWED_ORIGINS": "https://frontend.example"})

    resp = client.options(
        "/export/report",
        headers={
            "Origin": "https://malicious.example",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert resp.status_code == 400
    assert "access-control-allow-origin" not in resp.headers


def test_export_report_returns_cors_headers_for_allowed_origin():
    allowed_origin = "https://frontend.example"
    client = _create_client({"CORS_ALLOWED_ORIGINS": allowed_origin})
    export_payload = _build_export_payload(client)

    resp = client.post(
        "/export/report",
        json=export_payload,
        headers={"Origin": allowed_origin},
    )

    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/pdf")
    assert resp.headers["access-control-allow-origin"] == allowed_origin
    assert resp.headers["content-disposition"].startswith("attachment; filename=")

    exposed_headers = resp.headers["access-control-expose-headers"]
    assert "Content-Disposition" in exposed_headers
    assert "X-Snapshot-Id" in exposed_headers
    assert "X-Content-Hash" in exposed_headers

    assert "x-snapshot-id" in resp.headers
    assert "x-content-hash" in resp.headers
