#!/usr/bin/env python3
"""
Script local (temporal) para registrar tiempos y errores en:
/docs/development/basic-monitoring-log.md

Uso rápido:
  python scripts/local/monitoring_probe.py --base-url http://localhost:3000 --iterations 2

Notas:
- Diseñado para uso local y temporal (no subir a GitHub).
- Usa solo librería estándar de Python.
"""

from __future__ import annotations

import argparse
import json
import math
import statistics
import sys
from collections import Counter
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from time import perf_counter
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


@dataclass
class ProbeCase:
    method: str
    endpoint: str
    operation: str
    payload: dict[str, Any] | None = None
    job: str = "-"
    timeout_s: float | None = None


@dataclass
class ProbeResult:
    timestamp: datetime
    endpoint: str
    operation: str
    job: str
    model: str
    duration_ms: int
    status: str  # OK | ERROR
    error_code: str
    message: str
    env: str


def detect_error_code(raw_message: str, status_code: int, payload: Any) -> str:
    message = (raw_message or "").upper()
    if "LLM_QUOTA_EXCEEDED" in message or "RESOURCE_EXHAUSTED" in message or "QUOTA" in message:
        return "LLM_QUOTA_EXCEEDED"
    if "LLM_RATE_LIMIT" in message or "RATE_LIMIT" in message or status_code == 429:
        return "LLM_RATE_LIMIT"
    if "LLM_TIMEOUT" in message or "TIMEOUT" in message or "TIMED OUT" in message or status_code in (408, 504):
        return "LLM_TIMEOUT"
    if "JSON" in message and ("PARSE" in message or "INVALID" in message):
        return "JSON_PARSE"
    if "API_KEY" in message or status_code == 401:
        return "API_KEY"
    if status_code >= 500:
        return "SERVER_ERROR"

    if isinstance(payload, dict):
        direct = str(payload.get("code") or payload.get("error_code") or "").strip()
        if direct:
            return direct

    return "UNKNOWN_ERROR"


def short_message(raw: str, limit: int = 90) -> str:
    txt = " ".join((raw or "-").split())
    return txt if len(txt) <= limit else txt[: limit - 1] + "…"


def safe_json_loads(raw: str) -> Any:
    try:
        return json.loads(raw)
    except Exception:
        return None


def make_default_cases(base_url: str, api_key: str | None) -> list[ProbeCase]:
    cases: list[ProbeCase] = [
        ProbeCase(
            method="POST",
            endpoint="/api/analyze/open",
            operation="analyze_open",
            payload={
                "source": "suma(n) BEGIN\n  acc <- 0;\n  FOR i <- 1 TO n DO BEGIN\n    acc <- acc + i;\n  END\n  RETURN acc;\nEND",
                "mode": "all",
                "locale": "es",
            },
        ),
        ProbeCase(
            method="POST",
            endpoint="/api/analyze/trace",
            operation="trace",
            payload={
                "source": "suma(n) BEGIN\n  acc <- 0;\n  FOR i <- 1 TO n DO BEGIN\n    acc <- acc + i;\n  END\n  RETURN acc;\nEND",
                "case": "worst",
                "input_size": 8,
                "locale": "es",
            },
        ),
    ]

    if api_key:
        cases.extend(
            [
                ProbeCase(
                    method="POST",
                    endpoint="/api/llm",
                    operation="llm_general",
                    payload={
                        "job": "general",
                        "prompt": "Responde solo con: ok",
                        "locale": "es",
                        "apiKey": api_key,
                    },
                    job="general",
                ),
                ProbeCase(
                    method="POST",
                    endpoint="/api/llm",
                    operation="llm_parser_assist",
                    payload={
                        "job": "parser_assist",
                        "prompt": "Tengo un error de sintaxis en pseudocódigo, dame 2 recomendaciones breves.",
                        "locale": "es",
                        "apiKey": api_key,
                    },
                    job="parser_assist",
                ),
                ProbeCase(
                    method="POST",
                    endpoint="/api/llm",
                    operation="llm_repair",
                    payload={
                        "job": "repair",
                        "prompt": "Corrige este pseudocódigo y responde solo JSON: suma(n) BEGIN acc <- 0 FOR i <- 1 TO n acc <- acc + i END RETURN acc END",
                        "locale": "es",
                        "apiKey": api_key,
                    },
                    job="repair",
                    timeout_s=65.0,
                ),
                ProbeCase(
                    method="POST",
                    endpoint="/api/llm",
                    operation="llm_compare",
                    payload={
                        "job": "compare",
                        "prompt": "Compara la complejidad entre O(n) y O(n log n) en una frase breve.",
                        "locale": "es",
                        "apiKey": api_key,
                    },
                    job="compare",
                ),
                ProbeCase(
                    method="POST",
                    endpoint="/api/llm/generate-diagram",
                    operation="llm_generate_diagram",
                    payload={
                        "source": "suma(n) BEGIN acc <- 0; FOR i <- 1 TO n DO BEGIN acc <- acc + i; END RETURN acc; END",
                        "case": "worst",
                        "locale": "es",
                        "apiKey": api_key,
                        "trace": {
                            "steps": [
                                {"step_number": 1, "line": 1, "operation": "init"},
                                {"step_number": 2, "line": 2, "operation": "loop"},
                                {"step_number": 3, "line": 3, "operation": "return"}
                            ]
                        },
                    },
                    job="generate_diagram",
                ),
                ProbeCase(
                    method="POST",
                    endpoint="/api/llm/recursion-diagram",
                    operation="recursion_diagram",
                    payload={
                        "pseudocode": "factorial(n) BEGIN\n IF (n <= 1) THEN BEGIN RETURN 1; END\n RETURN n * factorial(n - 1);\nEND",
                        "kind": "recursive",
                        "depth_limit": 6,
                        "input_size": 5,
                        "locale": "es",
                        "apiKey": api_key,
                    },
                    job="recursion_diagram",
                ),
                ProbeCase(
                    method="GET",
                    endpoint="/api/llm/status",
                    operation="llm_status",
                    payload=None,
                ),
            ]
        )

    return cases


def fetch_model_by_job(base_url: str, timeout_s: float) -> dict[str, str]:
    status_case = ProbeCase(method="GET", endpoint="/api/llm/status", operation="llm_status")
    status_code, _raw, parsed, _duration = send_request(base_url, status_case, timeout_s)
    if not (200 <= status_code < 300) or not isinstance(parsed, dict):
        return {}

    status_obj = parsed.get("status")
    if not isinstance(status_obj, dict):
        return {}

    config = status_obj.get("config")
    if not isinstance(config, dict):
        return {}

    model_by_job: dict[str, str] = {}
    jobs = config.get("jobs")
    if isinstance(jobs, dict):
        for job, model in jobs.items():
            if isinstance(job, str) and isinstance(model, str) and model.strip():
                model_by_job[job] = model.strip()

    diagram_jobs = config.get("diagramJobs")
    if isinstance(diagram_jobs, dict):
        for job, model in diagram_jobs.items():
            if isinstance(job, str) and isinstance(model, str) and model.strip():
                model_by_job[job] = model.strip()

    return model_by_job


def send_request(base_url: str, case: ProbeCase, timeout_s: float) -> tuple[int, str, Any, int]:
    url = base_url.rstrip("/") + case.endpoint
    method = (case.method or "POST").upper()
    body = None
    headers = {}
    if method in {"POST", "PUT", "PATCH"}:
        payload = case.payload or {}
        body = json.dumps(payload).encode("utf-8")
        headers = {"Content-Type": "application/json"}

    req = Request(url=url, method=method, data=body, headers=headers)

    start = perf_counter()
    try:
        with urlopen(req, timeout=timeout_s) as response:
            raw = response.read().decode("utf-8", errors="replace")
            duration_ms = int((perf_counter() - start) * 1000)
            parsed = safe_json_loads(raw)
            return response.getcode(), raw, parsed, duration_ms
    except HTTPError as e:
        raw = e.read().decode("utf-8", errors="replace") if e.fp else str(e)
        duration_ms = int((perf_counter() - start) * 1000)
        parsed = safe_json_loads(raw)
        return int(e.code), raw, parsed, duration_ms
    except URLError as e:
        duration_ms = int((perf_counter() - start) * 1000)
        msg = f"Connection error: {e.reason}"
        return 0, msg, None, duration_ms
    except Exception as e:
        duration_ms = int((perf_counter() - start) * 1000)
        return 0, f"Unexpected error: {e}", None, duration_ms


def run_probes(base_url: str, env_name: str, timeout_s: float, iterations: int, api_key: str | None) -> list[ProbeResult]:
    results: list[ProbeResult] = []
    cases = make_default_cases(base_url, api_key)
    model_by_job = fetch_model_by_job(base_url, timeout_s)

    for _ in range(iterations):
        for case in cases:
            effective_timeout_s = case.timeout_s if case.timeout_s is not None else timeout_s
            status_code, raw, parsed, duration_ms = send_request(base_url, case, effective_timeout_s)
            ok = False
            if 200 <= status_code < 300:
                if isinstance(parsed, dict) and "ok" in parsed:
                    ok = bool(parsed.get("ok"))
                else:
                    ok = True

            status = "OK" if ok else "ERROR"

            error_code = "-"
            message = "respuesta correcta"
            if status == "ERROR":
                payload_message = ""
                if isinstance(parsed, dict):
                    payload_message = str(
                        parsed.get("error")
                        or (parsed.get("errors") or [{}])[0].get("message") if isinstance(parsed.get("errors"), list) and parsed.get("errors") else ""
                    )
                raw_message = payload_message or raw or f"HTTP {status_code}"
                error_code = detect_error_code(raw_message, status_code, parsed)
                message = short_message(raw_message)

            results.append(
                ProbeResult(
                    timestamp=datetime.now(),
                    endpoint=case.endpoint,
                    operation=case.operation,
                    job=case.job,
                    model=model_by_job.get(case.job, "-") if case.job != "-" else "-",
                    duration_ms=duration_ms,
                    status=status,
                    error_code=error_code,
                    message=message,
                    env=env_name,
                )
            )

    return results


def parse_markdown_table_rows(lines: list[str], start_idx: int) -> tuple[int, int]:
    i = start_idx
    while i < len(lines) and not lines[i].startswith("|"):
        i += 1
    if i >= len(lines):
        return -1, -1

    header_idx = i
    if header_idx + 1 >= len(lines):
        return -1, -1

    j = header_idx + 2
    while j < len(lines) and lines[j].startswith("|"):
        j += 1

    return header_idx, j


def append_daily_rows(md_text: str, results: list[ProbeResult]) -> str:
    lines = md_text.splitlines()
    section_title = "## Plantilla de registro diario"

    try:
        section_idx = next(i for i, line in enumerate(lines) if line.strip() == section_title)
    except StopIteration:
        raise RuntimeError("No se encontró la sección '## Plantilla de registro diario' en el .md")

    header_idx, table_end = parse_markdown_table_rows(lines, section_idx)
    if header_idx < 0:
        raise RuntimeError("No se encontró la tabla de registro diario en el .md")

    new_rows = []
    for r in results:
        dt = r.timestamp.strftime("%Y-%m-%d %H:%M")
        new_rows.append(
            f"| {dt} | {r.endpoint} | {r.operation} | {r.job} | {r.model} | {r.duration_ms} | {r.status} | {r.error_code} | {r.message} | {r.env} |"
        )

    updated = lines[:table_end] + new_rows + lines[table_end:]
    return "\n".join(updated) + "\n"


def read_daily_rows(md_text: str) -> list[dict[str, str]]:
    lines = md_text.splitlines()
    section_title = "## Plantilla de registro diario"
    section_idx = next((i for i, line in enumerate(lines) if line.strip() == section_title), -1)
    if section_idx < 0:
        return []

    header_idx, table_end = parse_markdown_table_rows(lines, section_idx)
    if header_idx < 0:
        return []

    data_rows = lines[header_idx + 2 : table_end]
    parsed: list[dict[str, str]] = []
    for row in data_rows:
        parts = [c.strip() for c in row.strip().strip("|").split("|")]
        if len(parts) == 10:
            parsed.append(
                {
                    "datetime": parts[0],
                    "endpoint": parts[1],
                    "operation": parts[2],
                    "job": parts[3],
                    "model": parts[4],
                    "duration": parts[5],
                    "status": parts[6],
                    "error_code": parts[7],
                    "message": parts[8],
                    "env": parts[9],
                }
            )
            continue

        if len(parts) == 8:
            parsed.append(
                {
                    "datetime": parts[0],
                    "endpoint": parts[1],
                    "operation": parts[2],
                    "job": "-",
                    "model": "-",
                    "duration": parts[3],
                    "status": parts[4],
                    "error_code": parts[5],
                    "message": parts[6],
                    "env": parts[7],
                }
            )
    return parsed


def percentile(values: list[int], p: float) -> int:
    if not values:
        return 0
    s = sorted(values)
    idx = max(0, min(len(s) - 1, math.ceil((p / 100.0) * len(s)) - 1))
    return s[idx]


def update_weekly_summary(md_text: str) -> str:
    rows = read_daily_rows(md_text)
    durations: list[int] = []
    total = 0
    errors = 0
    error_codes: list[str] = []

    for r in rows:
        total += 1
        try:
            durations.append(int(float(r["duration"])))
        except Exception:
            pass
        if r["status"].upper() == "ERROR":
            errors += 1
            code = r["error_code"].strip()
            if code and code != "-":
                error_codes.append(code)

    p50 = int(statistics.median(durations)) if durations else 0
    p95 = percentile(durations, 95)
    error_rate = (errors / total * 100.0) if total else 0.0

    counter = Counter(error_codes)
    top3 = ", ".join(f"{code} ({count})" for code, count in counter.most_common(3)) or "-"

    today = datetime.now()
    iso_year, iso_week, _ = today.isocalendar()
    week_label = f"{iso_year}-W{iso_week:02d}"

    lines = md_text.splitlines()
    section_title = "## Resumen semanal (KPI básicos)"
    section_idx = next((i for i, line in enumerate(lines) if line.strip() == section_title), -1)
    if section_idx < 0:
        return md_text

    header_idx, table_end = parse_markdown_table_rows(lines, section_idx)
    if header_idx < 0:
        return md_text

    summary_row = (
        f"| {week_label} | {total} | {p50} | {p95} | {error_rate:.1f} | {top3} |"
    )

    updated_lines = lines[: header_idx + 2] + [summary_row] + lines[table_end:]
    return "\n".join(updated_lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description="Monitoreo básico: tiempos y errores hacia .md")
    parser.add_argument("--base-url", default="http://localhost:3000", help="Base URL del frontend/backend proxied")
    parser.add_argument(
        "--doc",
        default="docs/development/basic-monitoring-log.md",
        help="Ruta al archivo markdown de monitoreo",
    )
    parser.add_argument("--iterations", type=int, default=1, help="Cantidad de rondas por endpoint")
    parser.add_argument("--timeout", type=float, default=30.0, help="Timeout por request (segundos)")
    parser.add_argument("--env", default="local", help="Entorno a registrar (local/staging/prod)")
    parser.add_argument(
        "--api-key",
        default="",
        help="API key opcional para endpoints LLM (si no se envía, esos casos se omiten)",
    )
    parser.add_argument("--dry-run", action="store_true", help="No escribe el .md, solo imprime resultados")

    args = parser.parse_args()

    doc_path = Path(args.doc)
    if not doc_path.exists():
        print(f"[ERROR] No existe el archivo: {doc_path}", file=sys.stderr)
        return 1

    api_key = args.api_key.strip() or None
    results = run_probes(
        base_url=args.base_url,
        env_name=args.env,
        timeout_s=args.timeout,
        iterations=max(1, args.iterations),
        api_key=api_key,
    )

    print(f"[INFO] Eventos recolectados: {len(results)}")
    for r in results:
        print(
            f"- {r.timestamp:%Y-%m-%d %H:%M:%S} | {r.endpoint} | {r.operation} | {r.job} | {r.model} | {r.duration_ms}ms | {r.status} | {r.error_code}"
        )

    if args.dry_run:
        print("[INFO] Dry-run activado: no se modificó el .md")
        return 0

    current_md = doc_path.read_text(encoding="utf-8")
    updated_md = append_daily_rows(current_md, results)
    updated_md = update_weekly_summary(updated_md)
    doc_path.write_text(updated_md, encoding="utf-8")

    print(f"[OK] Monitoreo actualizado en: {doc_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
