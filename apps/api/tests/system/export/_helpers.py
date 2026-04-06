import os
import shutil
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import create_app
from app.modules.analysis.trace_service import build_default_trace_inputs


def has_pdflatex() -> bool:
    return shutil.which("pdflatex") is not None


def create_client(extra_env: dict[str, str] | None = None) -> TestClient:
    env = {
        "CORS_ENABLED": "1",
        "CORS_ALLOWED_ORIGINS": "",
        "DEV_ALLOWED_ORIGINS": "http://localhost:3000,http://127.0.0.1:3000",
    }
    if extra_env:
        env.update(extra_env)

    with patch.dict(os.environ, env, clear=False):
        return TestClient(create_app())


def build_export_payload(client: TestClient, formats: list[str] | None = None) -> dict:
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
