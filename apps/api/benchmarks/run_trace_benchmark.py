from __future__ import annotations

import json
from typing import Any

from fastapi.testclient import TestClient

from app.main import create_app
from app.modules.analysis.trace_service import build_default_trace_inputs

from .common import MEASURED_RUNS, ROOT, TRACE_CASES_FILE, WARMUP_RUNS, generated_at, load_cases, median, now_ms, p95

OUTPUT_JSON = ROOT / "trace-benchmark-results.json"
OUTPUT_MD = ROOT / "trace-benchmark-results.md"


def _build_balanced_tree(values: list[int]) -> dict[str, Any] | None:
    if not values:
        return None
    middle = len(values) // 2
    return {
        "valor": values[middle],
        "izquierda": _build_balanced_tree(values[:middle]),
        "derecha": _build_balanced_tree(values[middle + 1 :]),
    }


def _generated_initial_variables(case: dict[str, Any]) -> dict[str, Any] | None:
    generator = case.get("generator")
    input_size = int(case.get("inputSize") or 0)
    if generator == "euclid_pair":
        return {"a": input_size * 2 + 1, "b": input_size}
    if generator == "sorted_array_miss":
        return {"A": list(range(1, input_size + 1)), "x": input_size + 1}
    if generator == "balanced_tree":
        return {"raiz": _build_balanced_tree(list(range(1, input_size + 1)))}
    return case.get("initialVariables")


def _timed_post(client: TestClient, path: str, payload: dict[str, Any]) -> tuple[float, dict[str, Any]]:
    start = now_ms()
    response = client.post(path, json=payload)
    elapsed = now_ms() - start
    response.raise_for_status()
    return elapsed, response.json()


def _trace_payload(case: dict[str, Any], source: str) -> dict[str, Any]:
    defaults = build_default_trace_inputs(source, case=case.get("traceCase", "worst"))
    payload = {
        "source": source,
        "case": case.get("traceCase", "worst"),
        "input_size": case.get("inputSize", defaults.get("input_size")),
        "initial_variables": _generated_initial_variables(case) or defaults.get("initial_variables"),
        "locale": "es",
    }
    return payload


def run_case(client: TestClient, case: dict[str, Any], measured: bool) -> dict[str, Any] | None:
    source = (ROOT / case["sourceFile"]).read_text(encoding="utf-8")
    trace_ms, trace_response = _timed_post(client, "/analyze/trace", _trace_payload(case, source))
    if not trace_response.get("ok"):
        raise RuntimeError(f"Trace failed for {case['id']}: {trace_response.get('errors', [])}")
    if not measured:
        return None
    steps = len((trace_response.get("trace") or {}).get("steps") or [])
    return {"traceMs": trace_ms, "stepCount": steps, "algorithmKind": trace_response.get("algorithmKind", "unknown")}


def summarize_case(case: dict[str, Any], runs: list[dict[str, Any]]) -> dict[str, Any]:
    trace_values = [r["traceMs"] for r in runs]
    step_values = [r["stepCount"] for r in runs]
    return {
        "caseId": case["id"],
        "caseName": case["name"],
        "family": case["family"],
        "inputSize": case.get("inputSize"),
        "traceCase": case.get("traceCase", "worst"),
        "traceMsMedian": median(trace_values),
        "traceMsP95": p95(trace_values),
        "stepCountMedian": median(step_values),
        "algorithmKind": runs[-1].get("algorithmKind", "unknown"),
        "status": "OK",
    }


def render_markdown(results: list[dict[str, Any]]) -> str:
    lines = [
        "El benchmark de trace mide ejecucion concreta via `/analyze/trace`, donde `inputSize` si afecta el recorrido operativo del algoritmo y la cantidad de pasos.",
        "",
        "| Caso | Familia | inputSize | Case | Trace mediana | P95 trace | Pasos medianos | Kind | Estado |",
        "|---|---|---:|---|---:|---:|---:|---|---|",
    ]
    for result in results:
        lines.append(
            "| {caseName} | {family} | {inputSize} | {traceCase} | {traceMsMedian} ms | {traceMsP95} ms | {stepCountMedian} | {algorithmKind} | {status} |".format(**result)
        )
    return "\n".join(lines) + "\n"


def generate_outputs() -> dict[str, Any]:
    cases = load_cases(TRACE_CASES_FILE)
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
