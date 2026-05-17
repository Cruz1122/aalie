from __future__ import annotations

import json
import os
import re
import statistics
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import platform
import shutil
import subprocess
import sys

ROOT = Path(__file__).parent
PIPELINE_CASES_FILE = ROOT / "benchmark_cases.json"
TRACE_CASES_FILE = ROOT / "trace_benchmark_cases.json"

WARMUP_RUNS = int(os.getenv("AALIE_BENCH_WARMUP", "5"))
MEASURED_RUNS = int(os.getenv("AALIE_BENCH_RUNS", "30"))


def now_ms() -> float:
    return time.perf_counter_ns() / 1_000_000


def median(values: list[float]) -> float:
    return round(statistics.median(values), 3)


def p95(values: list[float]) -> float:
    ordered = sorted(values)
    index = int(round(0.95 * (len(ordered) - 1)))
    return round(ordered[index], 3)


def load_cases(path: Path) -> list[dict[str, Any]]:
    return json.loads(path.read_text(encoding="utf-8"))


def generated_at() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _normalize_theta(value: str) -> str:
    lowered = (value or "").lower().replace("\\", "")
    lowered = re.sub(r"^(theta|omega|bigomega|bigtheta|bigo)", "", lowered)
    replacements = {
        "{": "",
        "}": "",
        "(": "",
        ")": "",
        " ": "",
        "\\frac": "frac",
        "left": "",
        "right": "",
    }
    for old, new in replacements.items():
        lowered = lowered.replace(old, new)
    return lowered


def canonicalize_theta(value: str) -> str:
    if value == "No concluyente":
        return value
    normalized = _normalize_theta(value)
    if not normalized:
        return "No concluyente"
    if "mina,b" in normalized or "logmina,b" in normalized:
        return "\\Theta(\\log(\\min(a,b)))"
    if "sqrt5" in normalized or "varphi^n" in normalized or "phi^n" in normalized:
        return "\\Theta(\\varphi^n)"
    if "log" in normalized:
        if "nlog" in normalized:
            return "\\Theta(n \\log n)"
        return "\\Theta(\\log n)"
    if "n^3" in normalized or "n3" in normalized:
        return "\\Theta(n^3)"
    if "n^2" in normalized or "n2" in normalized:
        return "\\Theta(n^2)"
    if normalized == "n" or ("n" in normalized and "log" not in normalized and "^" not in normalized):
        return "\\Theta(n)"
    if normalized == "1":
        return "\\Theta(1)"
    return value.replace("\\\\log", "\\log")


def theta_matches(expected: str, obtained: str) -> bool:
    if expected == "No concluyente":
        return not obtained
    expected = canonicalize_theta(expected)
    obtained = canonicalize_theta(obtained)
    expected_norm = _normalize_theta(expected)
    obtained_norm = _normalize_theta(obtained)
    if not obtained_norm:
        return False
    if "phi^n" in expected_norm:
        return "phi^n" in obtained_norm or "varphi^n" in obtained_norm or "sqrt5" in obtained_norm
    if "nlogn" in expected_norm or "nlog" in expected_norm:
        return "nlog" in obtained_norm or ("n" in obtained_norm and "log" in obtained_norm)
    if "logn" in expected_norm or ("log" in expected_norm and "aprox" in expected_norm):
        return "log" in obtained_norm
    if "n^2" in expected_norm:
        variants = {obtained_norm, obtained_norm.replace("^{", "^").replace("}", ""), obtained_norm.replace("n2", "n^2")}
        return any("n^2" in variant for variant in variants)
    if expected_norm == "n":
        return "n" in obtained_norm and "log" not in obtained_norm and "^2" not in obtained_norm
    if expected_norm == "n^3":
        return "n^3" in obtained_norm or "n3" in obtained_norm
    return expected_norm in obtained_norm


def latex_cell(value: str) -> str:
    if value == "No concluyente":
        return value
    return f"${value}$"


def _run_cmd(cmd: str, cwd: str | None = None, fallback: Any = None) -> str | None:
    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=10, shell=True, cwd=cwd
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass
    return fallback


def _get_cpu_info() -> str | None:
    cpu = platform.processor()
    if cpu:
        return cpu
    try:
        if sys.platform == "win32":
            result = subprocess.run(
                "wmic cpu get name", capture_output=True, text=True, timeout=10, shell=True
            )
            if result.returncode == 0:
                lines = [l.strip() for l in result.stdout.strip().splitlines() if l.strip()]
                if len(lines) > 1:
                    return lines[1]
        else:
            result = subprocess.run(
                "lscpu", capture_output=True, text=True, timeout=10, shell=True
            )
            if result.returncode == 0:
                for line in result.stdout.splitlines():
                    if "Model name" in line:
                        return line.split(":", 1)[1].strip()
    except Exception:
        pass
    return None


def _get_memory_info() -> str | None:
    try:
        if sys.platform == "win32":
            result = subprocess.run(
                ["powershell", "-Command",
                 "(Get-CimInstance Win32_OperatingSystem).TotalVisibleMemorySize / 1MB"],
                capture_output=True, text=True, timeout=15,
            )
            if result.returncode == 0:
                gb = result.stdout.strip().replace(",", ".")
                return f"{float(gb):.0f} GB"
        else:
            result = subprocess.run(
                "free -h", capture_output=True, text=True, timeout=10, shell=True
            )
            if result.returncode == 0:
                for line in result.stdout.splitlines():
                    if line.startswith("Mem:"):
                        parts = line.split()
                        if len(parts) >= 2:
                            return parts[1]
    except Exception:
        pass
    return None


def gather_environment_metadata() -> dict[str, Any]:
    git_cwd = str(ROOT.parent)
    return {
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "git_commit": _run_cmd("git rev-parse HEAD", cwd=git_cwd),
        "git_status_short": _run_cmd("git status --short", cwd=git_cwd),
        "python_version": sys.version,
        "node_version": _run_cmd("node --version"),
        "pnpm_version": _run_cmd("pnpm --version"),
        "platform": sys.platform,
        "uname": str(platform.uname()),
        "cpu": _get_cpu_info(),
        "memory": _get_memory_info(),
        "pdflatex_version": _run_cmd("pdflatex --version"),
        "warmup_runs": int(os.getenv("AALIE_BENCH_WARMUP", "5")),
        "measured_runs": int(os.getenv("AALIE_BENCH_RUNS", "30")),
        "benchmark_script": "apps/api/benchmarks/run_pipeline_benchmark.py",
        "backend_mode": "http_in_process",
        "timer": "time.perf_counter_ns",
    }
