from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

from app.main import create_app

from .common import (
    MEASURED_RUNS,
    PIPELINE_CASES_FILE,
    ROOT,
    WARMUP_RUNS,
    canonicalize_theta,
    generated_at,
    latex_cell,
    load_cases,
    median,
    now_ms,
    p95,
    theta_matches,
)

OUTPUT_JSON = ROOT / "benchmark-results.json"
OUTPUT_MD = ROOT / "benchmark-results.md"


def extract_theta(analyze_response: dict[str, Any]) -> str:
    totals = analyze_response.get("totals", {}) if isinstance(analyze_response, dict) else {}
    return totals.get("big_theta") or totals.get("theta") or totals.get("big_o") or ""


def extract_while_status(analyze_response: dict[str, Any]) -> str:
    totals = analyze_response.get("totals", {}) if isinstance(analyze_response, dict) else {}
    while_blocks = totals.get("whileBlocks") or []
    if isinstance(while_blocks, list) and while_blocks:
        return str((while_blocks[0] or {}).get("status") or "")
    return ""


def _timed_post(client: TestClient, path: str, payload: dict[str, Any]) -> tuple[float, dict[str, Any]]:
    start = now_ms()
    response = client.post(path, json=payload)
    elapsed = now_ms() - start
    response.raise_for_status()
    return elapsed, response.json()


def run_case(client: TestClient, case: dict[str, Any], measured: bool) -> dict[str, Any] | None:
    source_path = ROOT / case["sourceFile"]
    source = source_path.read_text(encoding="utf-8")

    parse_ms, parse_response = _timed_post(client, "/grammar/parse", {"source": source})
    if not parse_response.get("ok"):
        raise RuntimeError(f"Parse failed for {case['id']}: {parse_response.get('errors', [])}")

    classify_ms, classify_response = _timed_post(client, "/classify", {"source": source})
    if not classify_response.get("ok"):
        raise RuntimeError(f"Classify failed for {case['id']}: {classify_response.get('errors', [])}")

    analyze_payload: dict[str, Any] = {
        "source": source,
        "mode": "worst",
        "algorithm_kind": case.get("algorithm_kind") or classify_response.get("kind"),
        "locale": "es",
    }
    if case.get("preferred_method"):
        analyze_payload["preferred_method"] = case["preferred_method"]

    analyze_ms, analyze_response = _timed_post(client, "/analyze/open", analyze_payload)
    if not analyze_response.get("ok"):
        raise RuntimeError(f"Analyze failed for {case['id']}: {analyze_response.get('errors', [])}")

    if not measured:
        return None

    total_ms = parse_ms + classify_ms + analyze_ms
    return {
        "parseMs": parse_ms,
        "classifyMs": classify_ms,
        "analyzeMs": analyze_ms,
        "totalMs": total_ms,
        "obtainedTheta": extract_theta(analyze_response),
        "whileStatus": extract_while_status(analyze_response),
    }


def summarize_case(case: dict[str, Any], runs: list[dict[str, Any]]) -> dict[str, Any]:
    parse_values = [r["parseMs"] for r in runs]
    classify_values = [r["classifyMs"] for r in runs]
    analyze_values = [r["analyzeMs"] for r in runs]
    total_values = [r["totalMs"] for r in runs]
    obtained_theta = runs[-1].get("obtainedTheta", "")
    while_status = runs[-1].get("whileStatus", "")
    expected_theta = case.get("expectedTheta", "")
    expected_while_status = case.get("expectedWhileStatus")
    status = "OK"
    if expected_theta == "No concluyente":
        if obtained_theta or (expected_while_status and while_status != expected_while_status):
            status = "CHECK"
    elif not theta_matches(expected_theta, obtained_theta):
        status = "CHECK"

    return {
        "caseId": case["id"],
        "caseName": case["name"],
        "family": case["family"],
        "symbolicSize": case["symbolicSize"],
        "parseMsMedian": median(parse_values),
        "classifyMsMedian": median(classify_values),
        "analyzeMsMedian": median(analyze_values),
        "totalMsMedian": median(total_values),
        "parseMsP95": p95(parse_values),
        "classifyMsP95": p95(classify_values),
        "analyzeMsP95": p95(analyze_values),
        "totalMsP95": p95(total_values),
        "analyzeSharePctMedian": round((median(analyze_values) / median(total_values)) * 100, 1),
        "expectedTheta": canonicalize_theta(expected_theta),
        "obtainedTheta": canonicalize_theta(obtained_theta),
        "status": status,
    }


def render_markdown(results: list[dict[str, Any]]) -> str:
    lines = [
        "El benchmark de pipeline mide las tres etapas por la misma via: llamadas HTTP in-process sobre FastAPI (`/grammar/parse`, `/classify`, `/analyze/open`). No incluye export institucional.",
        "",
        "La columna Tamaño simbolico es referencial para el caso pedagogico. El motor analiza estructura simbolica y no ejecuta el algoritmo sobre una entrada material de ese tamano.",
        "",
        "| Caso | Familia | Tamaño simbolico | Parse mediana | Classify mediana | Analyze mediana | Analyze / Total | Total mediana | P95 total | Θ esperada | Θ obtenida | Estado |",
        "|---|---|---:|---:|---:|---:|---:|---:|---:|---|---|---|",
    ]
    for result in results:
        lines.append(
            "| {caseName} | {family} | {symbolicSize} | {parseMsMedian} ms | {classifyMsMedian} ms | {analyzeMsMedian} ms | {analyzeSharePctMedian}% | {totalMsMedian} ms | {totalMsP95} ms | {expectedTheta} | {obtainedTheta} | {status} |".format(**{
                **result,
                "expectedTheta": latex_cell(result["expectedTheta"]),
                "obtainedTheta": latex_cell(result["obtainedTheta"]),
            })
        )
    return "\n".join(lines) + "\n"


def generate_outputs() -> dict[str, Any]:
    cases = load_cases(PIPELINE_CASES_FILE)
    results = []
    client = TestClient(create_app())
    try:
        for case in cases:
            for _ in range(WARMUP_RUNS):
                run_case(client, case, measured=False)
            measured_runs = []
            for _ in range(MEASURED_RUNS):
                result = run_case(client, case, measured=True)
                if result is not None:
                    measured_runs.append(result)
            results.append(summarize_case(case, measured_runs))
    finally:
        client.close()

    output = {"generatedAt": generated_at(), "runs": MEASURED_RUNS, "warmupRuns": WARMUP_RUNS, "results": results}
    OUTPUT_JSON.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    OUTPUT_MD.write_text(render_markdown(results), encoding="utf-8")
    return output


def main() -> None:
    print(json.dumps(generate_outputs(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
