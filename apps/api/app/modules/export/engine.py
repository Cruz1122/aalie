"""
Pure-Python export pipeline.
"""

from __future__ import annotations

import base64
import json
import time
from typing import Any, Dict, List

from .asset_builder import build_asset_manifest
from .constants import LATEX_FILENAME, MARKDOWN_FILENAME, PDF_FILENAME
from .document_model import build_document_model
from .latex_compiler import LatexCompilationError, compile_latex_to_pdf
from .latex_renderer import render_latex_report
from .markdown_renderer import render_markdown_report
from .models import ExportArtifact
from .snapshot_builder import build_snapshot
from .trace_diagram_assets import build_trace_diagram_assets
from .zip_bundle import create_zip_bundle


def _to_bytes(content: bytes | str) -> bytes:
    return content if isinstance(content, bytes) else content.encode("utf-8")


def _artifact_mime_type(format_name: str) -> str:
    if format_name == "markdown":
        return "text/markdown; charset=utf-8"
    if format_name == "latex":
        return "application/x-tex; charset=utf-8"
    if format_name == "pdf":
        return "application/pdf"
    return "application/json; charset=utf-8"


def _normalize_formats(formats: Any) -> List[str]:
    if not isinstance(formats, list) or not formats:
        return ["markdown", "latex"]
    normalized = [item for item in formats if item in {"markdown", "latex", "pdf"}]
    unique: List[str] = []
    for item in normalized:
        if item not in unique:
            unique.append(item)
    return unique or ["markdown", "latex"]


def _safe_json_parse(value: str) -> Any:
    try:
        return json.loads(value)
    except Exception:
        match = __import__("re").search(
            r"```(?:json)?\s*(\{[\s\S]*\})\s*```", value, __import__("re").I
        )
        if not match:
            return None
        try:
            return json.loads(match.group(1))
        except Exception:
            return None


def _to_string_array(value: Any) -> List[str] | None:
    if not isinstance(value, list):
        return None
    normalized = [str(item or "").strip() for item in value if str(item or "").strip()]
    return normalized or None


def _normalize_confidence(value: Any) -> float | None:
    if isinstance(value, (int, float)):
        return float(value)
    if isinstance(value, str) and value.strip():
        try:
            return float(value)
        except ValueError:
            return None
    return None


def _extract_candidate_text(payload: Dict[str, Any]) -> str | None:
    data = payload.get("data") if isinstance(payload.get("data"), dict) else {}
    candidates = data.get("candidates") if isinstance(data.get("candidates"), list) else []
    candidate = candidates[0] if candidates and isinstance(candidates[0], dict) else {}
    content = candidate.get("content") if isinstance(candidate.get("content"), dict) else {}
    parts = content.get("parts") if isinstance(content.get("parts"), list) else []
    text = (parts[0] or {}).get("text") if parts and isinstance(parts[0], dict) else None
    return text if isinstance(text, str) else None


def normalize_llm_comparative_payload(payload: Any) -> Dict[str, Any]:
    raw = payload
    if not isinstance(payload, dict):
        return {"raw": raw}
    parsed = payload
    candidate_text = _extract_candidate_text(payload)
    if candidate_text:
        parsed_candidate = _safe_json_parse(candidate_text)
        if isinstance(parsed_candidate, dict):
            parsed = parsed_candidate
    normalized = {
        "verdict": (
            parsed.get("verdict")
            if isinstance(parsed.get("verdict"), str)
            else parsed.get("note")
            if isinstance(parsed.get("note"), str)
            else None
        ),
        "confidence": _normalize_confidence(parsed.get("confidence")),
        "matches": _to_string_array(parsed.get("matches"))
        or _to_string_array(parsed.get("coincidencias")),
        "differences": _to_string_array(parsed.get("differences"))
        or _to_string_array(parsed.get("diferencias")),
        "note": parsed.get("note") if isinstance(parsed.get("note"), str) else None,
    }
    return {"raw": raw, "normalized": normalized}


def build_snapshot_result(export_state: Dict[str, Any]) -> Dict[str, Any]:
    options = export_state.get("options") or {}
    snapshot = build_snapshot(
        export_state["snapshotInput"],
        options={
            "llm": (
                normalize_llm_comparative_payload(options.get("llmPayload"))
                if options.get("llmPayload") is not None
                else None
            ),
            "gpuCpu": None,
        },
    )
    return {"ok": True, "snapshot": snapshot}


def render_report_result(export_state: Dict[str, Any]) -> Dict[str, Any]:
    total_started = time.perf_counter()
    timings: Dict[str, float] = {}
    started = time.perf_counter()
    snapshot_payload = build_snapshot_result(export_state)
    timings["snapshot_ms"] = (time.perf_counter() - started) * 1000
    snapshot = snapshot_payload["snapshot"]
    render = export_state.get("render") or {}
    formats = _normalize_formats(render.get("formats"))
    include_snapshot_json = render.get("includeSnapshotJson", True)
    include_zip_bundle = render.get("includeZipBundle", True)
    started = time.perf_counter()
    document_model = build_document_model(snapshot)
    timings["document_model_ms"] = (time.perf_counter() - started) * 1000
    started = time.perf_counter()
    trace_diagram_assets = build_trace_diagram_assets(document_model)
    timings["trace_assets_ms"] = (time.perf_counter() - started) * 1000
    asset_manifest = build_asset_manifest(
        {
            "filename": asset.filename,
            "mimeType": asset.mimeType,
            "size": len(_to_bytes(asset.content)),
        }
        for asset in trace_diagram_assets
    )
    artifacts: List[ExportArtifact] = []
    latex_content: str | None = None
    if "markdown" in formats:
        markdown = render_markdown_report(snapshot, document_model)
        artifacts.append(
            ExportArtifact(
                format="markdown",
                filename=MARKDOWN_FILENAME,
                mimeType=_artifact_mime_type("markdown"),
                content=markdown,
            )
        )
    if "latex" in formats or "pdf" in formats:
        started = time.perf_counter()
        latex_content = render_latex_report(snapshot, document_model)
        timings["latex_renderer_ms"] = (time.perf_counter() - started) * 1000
        if "latex" in formats:
            artifacts.append(
                ExportArtifact(
                    format="latex",
                    filename=LATEX_FILENAME,
                    mimeType=_artifact_mime_type("latex"),
                    content=latex_content,
                )
            )
    if "pdf" in formats:
        if not latex_content:
            raise RuntimeError("LaTeX content was not generated before PDF compilation.")
        try:
            compiled = compile_latex_to_pdf(
                latex_content,
                timeout_ms=render.get("pdfTimeoutMs"),
                extra_files=[
                    {"relativePath": asset.filename, "content": asset.content}
                    for asset in trace_diagram_assets
                ],
                preserve_workdir_on_error=bool(render.get("debug")),
                cleanup=not bool(render.get("debug")),
                passes=int(render.get("pdfPasses") or 2),
            )
        except LatexCompilationError as error:
            return {
                "ok": False,
                "error": str(error),
                "kind": error.kind,
                "compilerLogs": error.logs,
                "assetManifest": error.asset_manifest or asset_manifest,
                "workDir": error.work_dir,
                "status": 500,
            }
        compiled_profile = compiled.get("profile")
        if isinstance(compiled_profile, dict):
            timings.update(
                {
                    str(key): float(value)
                    for key, value in compiled_profile.items()
                    if isinstance(value, (int, float))
                }
            )
        pdf_buffer = compiled.get("pdfBuffer")
        if not isinstance(pdf_buffer, (bytes, str)):
            raise RuntimeError("PDF compiler returned an invalid buffer.")
        artifacts.append(
            ExportArtifact(
                format="pdf",
                filename=PDF_FILENAME,
                mimeType=_artifact_mime_type("pdf"),
                content=pdf_buffer,
            )
        )
    if include_snapshot_json:
        artifacts.append(
            ExportArtifact(
                format="snapshot",
                filename="snapshot.json",
                mimeType=_artifact_mime_type("snapshot"),
                content=json.dumps(snapshot, ensure_ascii=False, indent=2),
            )
        )
    artifacts.extend(trace_diagram_assets)
    filename = artifacts[0].filename if artifacts else None
    mime_type = artifacts[0].mimeType if artifacts else None
    content: bytes | str | None = artifacts[0].content if artifacts else None
    if include_zip_bundle:
        bundle = create_zip_bundle(
            artifacts,
            {
                "snapshotId": snapshot["snapshotId"],
                "contentHash": snapshot["contentHash"],
                "createdAt": snapshot["createdAt"],
                "formats": formats,
            },
        )
        filename = bundle.filename
        mime_type = "application/zip"
        content = bundle.content
    if not filename or not mime_type or content is None:
        raise RuntimeError("No artifacts were generated.")
    timings["total_ms"] = (time.perf_counter() - total_started) * 1000
    return {
        "ok": True,
        "profile": timings,
        "mimeType": mime_type,
        "filename": filename,
        "contentBase64": base64.b64encode(_to_bytes(content)).decode("ascii"),
        "snapshotId": snapshot["snapshotId"],
        "contentHash": snapshot["contentHash"],
        "assetManifest": asset_manifest,
    }
