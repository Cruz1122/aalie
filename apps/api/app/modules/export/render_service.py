"""
Internal render worker bridge for export.
"""

from __future__ import annotations

import json
import os
import subprocess
from typing import Any, Dict


def _repo_root() -> str:
    return os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../"))


def _worker_path() -> str:
    return os.path.abspath(
        os.path.join(
            _repo_root(),
            "packages",
            "report-export-orchestrator",
            "src",
            "render-worker.ts",
        )
    )


def _run_render_worker(payload: Dict[str, Any]) -> Dict[str, Any]:
    repo_root = _repo_root()
    cwd = os.path.join(repo_root, "packages", "report-export-orchestrator")
    tsx_bin = os.path.join(cwd, "node_modules", ".bin", "tsx")
    worker_path = _worker_path()

    cmd = [tsx_bin, worker_path] if os.path.exists(tsx_bin) else [
        "node",
        "--import",
        "tsx",
        worker_path,
    ]

    proc = subprocess.run(
        cmd,
        input=json.dumps(payload),
        capture_output=True,
        check=False,
        text=True,
        cwd=cwd,
    )

    if proc.returncode != 0:
        return {
            "ok": False,
            "error": "Export render worker failed",
            "kind": "worker_failed",
            "logs": (proc.stderr or "").splitlines(),
            "status": 500,
        }

    try:
        parsed = json.loads(proc.stdout)
        if not parsed or not isinstance(parsed, dict):
            raise ValueError("Empty worker response")
        return parsed
    except Exception:
        return {
            "ok": False,
            "error": "Export render worker returned invalid JSON",
            "kind": "worker_invalid_response",
            "logs": [(proc.stdout or "")[-4000:], (proc.stderr or "")[-4000:]],
            "status": 500,
        }


def build_snapshot_with_renderer(export_state: Dict[str, Any]) -> Dict[str, Any]:
    return _run_render_worker({"mode": "snapshot", **export_state})


def render_report_with_renderer(export_state: Dict[str, Any]) -> Dict[str, Any]:
    return _run_render_worker({"mode": "report", **export_state})
