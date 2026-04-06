from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app
from app.modules.analysis.trace_service import build_default_trace_inputs


def build_minimal_snapshot_payload(source: str) -> dict:
    client = TestClient(create_app())
    parse_res = client.post("/grammar/parse", json={"source": source}).json()
    classify_res = client.post("/classify", json={"source": source}).json()
    analyze_res = client.post(
        "/analyze/open",
        json={
            "source": source,
            "mode": "all",
            "algorithm_kind": classify_res.get("kind"),
            "locale": "en",
        },
    ).json()
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
    return {
        "source": source,
        "formats": ["markdown"],
        "includeZipBundle": False,
        "locale": "en",
        "includeTraceCases": ["worst"],
        "cachedParse": parse_res,
        "cachedClassify": {
            "kind": classify_res.get("kind"),
            "method": classify_res.get("method"),
        },
        "cachedAnalyze": analyze_res,
        "cachedTraceByCase": {"worst": trace_res},
    }
