"""
Export router.

Provides an endpoint for generating report artifacts (Markdown/PDF/ZIP) on the backend.
"""

from __future__ import annotations

import base64
import json
import logging
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Request
from fastapi.responses import Response

from .pdf_concurrency import PdfCompilerBusy, pdf_compiler_gate
from .service import ExportService

router = APIRouter(prefix="/export", tags=["export"])
export_service = ExportService()
logger = logging.getLogger(__name__)


def _needs_pdf(payload: Dict[str, Any]) -> bool:
    render = payload.get("render")
    if not isinstance(render, dict):
        return False
    formats = render.get("formats")
    return isinstance(formats, list) and "pdf" in formats


def _render(payload: Dict[str, Any]) -> Dict[str, Any]:
    if not _needs_pdf(payload):
        return export_service.render_report(payload)
    with pdf_compiler_gate.slot():
        return export_service.render_report(payload)


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
        origin = request.headers.get("origin") or request.headers.get("referer")
        if origin and not payload.get("requestOrigin"):
            payload["requestOrigin"] = origin

        result = _render(payload)
    except PdfCompilerBusy:
        return Response(
            content=json.dumps(
                {
                    "ok": False,
                    "code": "PDF_COMPILER_BUSY",
                    "error": "PDF compiler is busy",
                }
            ),
            status_code=503,
            media_type="application/json",
            headers={"Retry-After": "5"},
        )
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
        error_message = str(result.get("error") or "Export failed")
        kind = result.get("kind")
        logs = result.get("logs")
        compiler_logs = result.get("compilerLogs")
        asset_manifest = result.get("assetManifest")
        logger.error(
            "Export failed (%s): %s",
            kind or "unknown",
            logs or compiler_logs or error_message,
        )
        body: Dict[str, Any] = {"ok": False, "error": error_message}
        if kind:
            body["kind"] = kind
        if isinstance(logs, str):
            body["logs"] = logs[-4000:]
        elif isinstance(logs, list):
            body["logs"] = logs[-4000:]
        if isinstance(compiler_logs, str) and compiler_logs:
            body["compilerLogs"] = compiler_logs[-4000:]
        if isinstance(asset_manifest, list):
            body["assetManifest"] = asset_manifest
        return Response(
            content=json.dumps(body),
            status_code=int(result.get("status") or 500),
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
