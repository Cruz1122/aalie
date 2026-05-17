from __future__ import annotations

import csv
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
    gather_environment_metadata,
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
OUT_DIR = ROOT / "out"


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
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    env_metadata = gather_environment_metadata()
    (OUT_DIR / "environment_metadata.json").write_text(
        json.dumps(env_metadata, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    cases = load_cases(PIPELINE_CASES_FILE)
    results = []
    raw_runs: list[dict[str, Any]] = []
    client = TestClient(create_app())
    try:
        for case in cases:
            warmup_idx = 0
            for _ in range(WARMUP_RUNS):
                warmup_idx += 1
                result = run_case(client, case, measured=False)
                if result is not None:
                    raw_runs.append({
                        "case_id": case["id"],
                        "label": case["name"],
                        "family": case["family"],
                        "size_label": case.get("symbolicSize", ""),
                        "run_index": warmup_idx,
                        "is_warmup": "true",
                        "parse_ms": round(result["parseMs"], 3),
                        "classify_ms": round(result["classifyMs"], 3),
                        "analyze_ms": round(result["analyzeMs"], 3),
                        "total_ms": round(result["totalMs"], 3),
                        "status": "OK",
                        "observed_theta": result.get("obtainedTheta", ""),
                        "expected_theta": case.get("expectedTheta", ""),
                        "error_message": "",
                    })
            measured_runs = []
            for run_idx in range(1, MEASURED_RUNS + 1):
                result = run_case(client, case, measured=True)
                if result is not None:
                    measured_runs.append(result)
                    raw_runs.append({
                        "case_id": case["id"],
                        "label": case["name"],
                        "family": case["family"],
                        "size_label": case.get("symbolicSize", ""),
                        "run_index": run_idx,
                        "is_warmup": "false",
                        "parse_ms": round(result["parseMs"], 3),
                        "classify_ms": round(result["classifyMs"], 3),
                        "analyze_ms": round(result["analyzeMs"], 3),
                        "total_ms": round(result["totalMs"], 3),
                        "status": "OK",
                        "observed_theta": result.get("obtainedTheta", ""),
                        "expected_theta": case.get("expectedTheta", ""),
                        "error_message": "",
                    })
            results.append(summarize_case(case, measured_runs))
    finally:
        client.close()

    RAW_CSV_FIELDS = [
        "case_id", "label", "family", "size_label", "run_index",
        "is_warmup", "parse_ms", "classify_ms", "analyze_ms", "total_ms",
        "status", "observed_theta", "expected_theta", "error_message",
    ]
    with open(OUT_DIR / "pipeline_benchmark_raw.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=RAW_CSV_FIELDS)
        writer.writeheader()
        writer.writerows(raw_runs)

    results_by_id = {r["caseId"]: r for r in results}

    summary_rows: list[dict[str, Any]] = []
    for case in cases:
        case_raw = [r for r in raw_runs if r["case_id"] == case["id"] and r["is_warmup"] == "false"]
        n_measured = len(case_raw)
        parse_values = [float(r["parse_ms"]) for r in case_raw]
        classify_values = [float(r["classify_ms"]) for r in case_raw]
        analyze_values = [float(r["analyze_ms"]) for r in case_raw]
        total_values = [float(r["total_ms"]) for r in case_raw]
        obs_theta = case_raw[-1]["observed_theta"] if case_raw else ""
        exp_theta = case.get("expectedTheta", "")
        match = theta_matches(exp_theta, obs_theta)
        status = results_by_id.get(case["id"], {}).get("status", "OK")

        total_mean = round(sum(total_values) / len(total_values), 3) if total_values else 0.0

        summary_rows.append({
            "case_id": case["id"],
            "label": case["name"],
            "family": case["family"],
            "size_label": case.get("symbolicSize", ""),
            "runs_measured": n_measured,
            "parse_median_ms": median(parse_values) if parse_values else 0.0,
            "classify_median_ms": median(classify_values) if classify_values else 0.0,
            "analyze_median_ms": median(analyze_values) if analyze_values else 0.0,
            "total_median_ms": median(total_values) if total_values else 0.0,
            "total_p95_ms": p95(total_values) if total_values else 0.0,
            "total_min_ms": round(min(total_values), 3) if total_values else 0.0,
            "total_max_ms": round(max(total_values), 3) if total_values else 0.0,
            "total_mean_ms": total_mean,
            "status": status,
            "observed_theta": obs_theta,
            "expected_theta": exp_theta,
            "theta_match": match,
            "error_count": 0,
        })

    SUMMARY_CSV_FIELDS = [
        "case_id", "label", "family", "size_label",
        "runs_measured", "parse_median_ms", "classify_median_ms",
        "analyze_median_ms", "total_median_ms", "total_p95_ms",
        "total_min_ms", "total_max_ms", "total_mean_ms",
        "status", "observed_theta", "expected_theta",
        "theta_match", "error_count",
    ]
    with open(OUT_DIR / "pipeline_benchmark_summary.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=SUMMARY_CSV_FIELDS)
        writer.writeheader()
        writer.writerows(summary_rows)

    print(f"\n{'Label':<30} {'Median(ms)':>12} {'P95(ms)':>10} {'Observed':>16} {'Expected':>16} {'Match':>6}")
    print("-" * 96)
    for s in summary_rows:
        match = theta_matches(s["expected_theta"], s["observed_theta"])
        print(f"{s['label']:<30} {s['total_median_ms']:>10.1f}  {s['total_p95_ms']:>10.1f}  {s['observed_theta']:>16} {s['expected_theta']:>16} {'OK' if match else 'MISMATCH':>6}")
    print("-" * 96)

    n_raw = len(raw_runs)
    n_summary = len(summary_rows)
    cases_with_errors = [s['case_id'] for s in summary_rows if s['error_count'] > 0]
    cases_with_less_than_30 = [s['case_id'] for s in summary_rows if s['runs_measured'] < 30]
    print(f"\n{n_raw} raw rows, {n_summary} summary rows")
    if cases_with_errors:
        print(f"Cases with errors: {cases_with_errors}")
    if cases_with_less_than_30:
        print(f"Cases with <30 measured runs: {cases_with_less_than_30}")
    if not cases_with_errors and not cases_with_less_than_30:
        print("All cases OK - 30/30 measured runs, no errors")

    output = {"generatedAt": generated_at(), "runs": MEASURED_RUNS, "warmupRuns": WARMUP_RUNS, "results": results}
    OUTPUT_JSON.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    OUTPUT_MD.write_text(render_markdown(results), encoding="utf-8")
    return output


def main() -> None:
    print(json.dumps(generate_outputs(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
