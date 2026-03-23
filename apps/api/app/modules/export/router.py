"""
Export router.

Provides an endpoint for generating report artifacts (Markdown/PDF/ZIP) on the backend.
"""

from __future__ import annotations

import base64
import json
import os
import subprocess
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Request
from fastapi.responses import Response


router = APIRouter(prefix="/export", tags=["export"])


def _node_worker_path() -> str:
    """
    Returns the path to the Node worker script.

    Note: the worker is implemented in a later plan step.
    """

    # apps/api/app/modules/export/router.py -> apps/api/app/exporter/worker.ts
    return os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "exporter", "worker.ts")
    )


def _run_export_worker(payload: Dict[str, Any]) -> Dict[str, Any]:
    worker_path = _node_worker_path()
    # Node resuelve dependencias por `node_modules` en la carpeta actual y sus padres.
    # Como `apps/api` no es un paquete Node, le damos el `cwd` a `packages/report-export-orchestrator`
    # para que `tsx` (usado al ejecutar TS) sea encontrable.
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../"))
    cwd = os.path.join(repo_root, "packages", "report-export-orchestrator")
    tsx_bin = os.path.join(cwd, "node_modules", ".bin", "tsx")

    # Ejecutamos el worker con el CLI de `tsx` para respetar ESM y la resolución de `exports`.
    cmd = [tsx_bin, worker_path] if os.path.exists(tsx_bin) else ["node", "--import", "tsx", worker_path]

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
            "error": "Export worker failed",
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
            "error": "Export worker returned invalid JSON",
            "kind": "worker_invalid_response",
            "logs": [(proc.stdout or "")[-4000:], (proc.stderr or "")[-4000:]],
            "status": 500,
        }


@router.post("/report")
def export_report(request: Request, payload: Dict[str, Any] = Body(...)) -> Response:
    source = str(payload.get("source") or "")
    if not source.strip():
        return Response(
            content=json.dumps({"ok": False, "error": "Field 'source' is required."}),
            status_code=400,
            media_type="application/json",
        )

    try:
        # Ensure we pass an origin so llm/compare (if enabled later) can still reach Next proxies.
        origin = request.headers.get("origin") or request.headers.get("referer")
        if origin and not payload.get("requestOrigin"):
            payload["requestOrigin"] = origin

        result = _run_export_worker(payload)
    except Exception as e:
        return Response(
            content=json.dumps(
                {
                    "ok": False,
                    "error": str(e),
                }
            ),
            status_code=500,
            media_type="application/json",
        )

    if not result.get("ok"):
        # Expected structure:
        # { ok:false, error, kind?, logs?, status? }
        error_message = str(result.get("error") or "Export failed")
        kind = result.get("kind")
        logs = result.get("logs")
        body: Dict[str, Any] = {"ok": False, "error": error_message}
        if kind:
            body["kind"] = kind
        if isinstance(logs, str):
            body["logs"] = logs[-4000:]
        elif isinstance(logs, list):
            body["logs"] = logs[-4000:]
        return Response(
            content=json.dumps(body),
            status_code=500,
            media_type="application/json",
        )

    mime_type: str = str(result["mimeType"])
    filename: str = str(result["filename"])
    content_b64: str = str(result["contentBase64"])

    content_bytes = base64.b64decode(content_b64)

    headers: Dict[str, str] = {
        "Content-Type": mime_type,
        "Content-Disposition": f'attachment; filename="{filename}"',
    }

    snapshot_id: Optional[str] = result.get("snapshotId")
    content_hash: Optional[str] = result.get("contentHash")
    if snapshot_id:
        headers["X-Snapshot-Id"] = snapshot_id
    if content_hash:
        headers["X-Content-Hash"] = content_hash

    return Response(content=content_bytes, status_code=200, headers=headers)

