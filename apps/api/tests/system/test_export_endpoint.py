import os
import shutil
import zipfile
from io import BytesIO
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.modules.analysis.trace_service import build_default_trace_inputs


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


def _build_export_payload(client: TestClient, formats: list[str] | None = None) -> dict:
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

    trace_input = build_default_trace_inputs(source, "worst")

    trace_res = client.post(
        "/analyze/trace",
        json={
            "source": source,
            "case": "worst",
            "input_size": trace_input["input_size"],
            "initial_variables": trace_input["initial_variables"],
            "locale": "en",
        },
    ).json()
    assert trace_res["ok"] is True

    return {
        "source": source,
        "formats": formats or ["pdf"],
        "includeZipBundle": bool(formats and len(formats) > 1),
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
    if not _has_pdflatex():
        pytest.skip("pdflatex no está disponible en el entorno de tests")

    client = _create_client()
    export_payload = _build_export_payload(client)

    resp = client.post("/export/report", json=export_payload)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/pdf")
    assert resp.content and len(resp.content) > 1000

    assert "content-disposition" in resp.headers


def test_export_report_returns_markdown_and_is_deterministic():
    client = _create_client()
    export_payload = _build_export_payload(client, formats=["markdown"])

    resp_a = client.post("/export/report", json=export_payload)
    resp_b = client.post("/export/report", json=export_payload)

    assert resp_a.status_code == 200
    assert resp_b.status_code == 200
    assert resp_a.headers["content-type"].startswith("text/markdown")
    assert resp_a.content == resp_b.content
    assert resp_a.headers["x-snapshot-id"] == resp_b.headers["x-snapshot-id"]
    assert resp_a.headers["x-content-hash"] == resp_b.headers["x-content-hash"]


def test_export_report_markdown_is_stable_with_or_without_caches():
    client = _create_client()
    cached_payload = _build_export_payload(client, formats=["markdown"])
    raw_payload = {
        "source": cached_payload["source"],
        "formats": ["markdown"],
        "includeZipBundle": False,
        "locale": "en",
        "includeTraceCases": ["worst"],
    }

    cached_resp = client.post("/export/report", json=cached_payload)
    raw_resp = client.post("/export/report", json=raw_payload)

    assert cached_resp.status_code == 200
    assert raw_resp.status_code == 200
    assert cached_resp.content == raw_resp.content
    assert cached_resp.headers["x-snapshot-id"] == raw_resp.headers["x-snapshot-id"]
    assert cached_resp.headers["x-content-hash"] == raw_resp.headers["x-content-hash"]


def test_export_report_returns_zip_bundle_contract():
    if not _has_pdflatex():
        pytest.skip("pdflatex no está disponible en el entorno de tests")

    client = _create_client()
    export_payload = _build_export_payload(client, formats=["markdown", "pdf"])

    resp = client.post("/export/report", json=export_payload)

    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/zip")

    with zipfile.ZipFile(BytesIO(resp.content)) as bundle:
        names = bundle.namelist()
        assert names[0] == "report.md"
        assert names[1] == "report.pdf"
        assert "snapshot.json" in names
        assert names[-1] == "manifest.json"

        manifest = bundle.read("manifest.json").decode("utf-8")
        snapshot = bundle.read("snapshot.json").decode("utf-8")
        assert '"formats": [' in manifest
        assert '"snapshotId"' in manifest
        assert '"schemaVersion": "1.0.0"' in snapshot


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
