"""Run PDF export profiling inside the API production image.

Usage: python apps/api/scripts/benchmark_pdf.py --warm 25 --concurrency 1,2,5
"""

from __future__ import annotations

import argparse
import json
import resource
import statistics
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.modules.export.engine import render_report_result  # noqa: E402
from app.modules.export.snapshot_builder import build_export_state  # noqa: E402

SMALL_SOURCE = """linear(n) BEGIN
  x <- n;
END
"""

SOURCE = """triangular(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    FOR j <- i TO n DO BEGIN
      x <- i + j;
    END
  END
END
"""


def payload(source: str = SOURCE, passes: int = 2) -> dict[str, object]:
    return {
        "source": source,
        "formats": ["pdf"],
        "locale": "en",
        "includeZipBundle": False,
        "pdfPasses": passes,
    }


def export_once(source: str = SOURCE, passes: int = 2) -> dict[str, object]:
    started = time.perf_counter()
    result = render_report_result(build_export_state(payload(source, passes)))
    result["wall_total_ms"] = (time.perf_counter() - started) * 1000
    if not result.get("ok"):
        raise RuntimeError(str(result))
    return result


def percentile(values: list[float], percentile_value: float) -> float:
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, round((len(ordered) - 1) * percentile_value)))
    return ordered[index]


def summarize(samples: list[dict[str, object]]) -> dict[str, object]:
    totals = [float(sample["wall_total_ms"]) for sample in samples]
    profile_keys = sorted({key for sample in samples for key in (sample.get("profile") or {})})
    stages = {}
    for key in profile_keys:
        values = [float((sample.get("profile") or {}).get(key, 0)) for sample in samples]
        stages[key] = {"min": min(values), "median": statistics.median(values), "max": max(values)}
    return {
        "count": len(samples),
        "total_ms": {
            "min": min(totals),
            "p50": statistics.median(totals),
            "p95": percentile(totals, 0.95),
            "max": max(totals),
        },
        "stages_ms": stages,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--warm", type=int, default=25)
    parser.add_argument("--concurrency", default="1,2,5")
    args = parser.parse_args()

    cold = [export_once()]
    warm = [export_once() for _ in range(args.warm)]
    size_comparison = {
        "small": summarize([export_once(SMALL_SOURCE) for _ in range(5)]),
        "representative": summarize([export_once() for _ in range(5)]),
    }
    pass_comparison = {
        "one_pass": summarize([export_once(passes=1) for _ in range(5)]),
        "two_pass": summarize([export_once(passes=2) for _ in range(5)]),
    }
    concurrent = {}
    for level in [int(item) for item in args.concurrency.split(",")]:
        cpu_before = resource.getrusage(resource.RUSAGE_SELF)
        started = time.perf_counter()
        with ThreadPoolExecutor(max_workers=level) as pool:
            samples = list(pool.map(lambda _: export_once(), range(level)))
        cpu_after = resource.getrusage(resource.RUSAGE_SELF)
        concurrent[str(level)] = {
            "wall_total_ms": (time.perf_counter() - started) * 1000,
            "cpu_user_ms": (cpu_after.ru_utime - cpu_before.ru_utime) * 1000,
            "cpu_system_ms": (cpu_after.ru_stime - cpu_before.ru_stime) * 1000,
            "max_rss_delta_kb": max(0, cpu_after.ru_maxrss - cpu_before.ru_maxrss),
            **summarize(samples),
        }

    print(
        json.dumps(
            {
                "case": "triangular",
                "cold": summarize(cold),
                "warm": summarize(warm),
                "size_comparison": size_comparison,
                "pass_comparison": pass_comparison,
                "concurrent": concurrent,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
