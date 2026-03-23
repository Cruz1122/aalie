import shutil

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _has_pdflatex() -> bool:
    return shutil.which("pdflatex") is not None


def test_export_report_returns_pdf_when_pdflatex_is_available():
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

    export_payload = {
        "source": source,
        "formats": ["pdf"],
        "includeZipBundle": False,
        "locale": "en",
        "includeTraceCases": ["worst"],
        "cachedParse": parse_res,
        "cachedClassify": {"kind": classify_res["kind"], "method": classify_res.get("method")},
        "cachedAnalyze": analyze_res,
        "cachedTraceByCase": {"worst": trace_res},
    }

    resp = client.post("/export/report", json=export_payload)
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/pdf")
    assert resp.content and len(resp.content) > 1000

    assert "content-disposition" in resp.headers

