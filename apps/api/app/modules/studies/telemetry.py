from __future__ import annotations

import os

from fastapi import Request

from ...core.auth import _verify_token
from ...core.database import get_session_factory
from ...db.models.mf3 import StudyEvent
from .service import require_recording_participant

_PATH_EVENTS = {
    "/analyze/open": "analysis_run",
    "/analyze/trace": "trace_run",
    "/export/report": "export_run",
    "/llm": "llm_run",
}


def _bearer_token(request: Request) -> str | None:
    raw = request.headers.get("authorization", "")
    if not raw.lower().startswith("bearer "):
        return None
    return raw[7:].strip() or None


def event_for_path(path: str) -> str | None:
    if path in _PATH_EVENTS:
        return _PATH_EVENTS[path]
    if path.startswith("/llm/"):
        return "llm_run"
    return None


def record_request_event(
    request: Request,
    *,
    event_name: str,
    success: bool,
    duration_ms: int,
    error_code: str | None,
) -> None:
    if os.getenv("AALIE_STUDY_TELEMETRY_ENABLED", "false").strip().lower() not in {
        "1",
        "true",
        "yes",
        "on",
    }:
        return
    slug = request.headers.get("x-aalie-study-slug", "").strip()
    token = _bearer_token(request)
    if not slug or not token:
        return

    try:
        identity = _verify_token(token)
        factory = get_session_factory()
        with factory() as db:
            study, participant = require_recording_participant(
                db,
                study_slug=slug,
                user_id=identity.user_id,
            )
            if not study.telemetry_enabled:
                return
            db.add(
                StudyEvent(
                    participant_id=participant.id,
                    event_name=event_name,
                    event_version="1",
                    source="SERVER",
                    request_id=request.headers.get("x-request-id"),
                    success=success,
                    duration_ms=max(0, duration_ms),
                    error_code=error_code,
                    algorithm_kind=request.headers.get("x-aalie-algorithm-kind") or None,
                    analysis_method=request.headers.get("x-aalie-analysis-method") or None,
                    export_format=request.headers.get("x-aalie-export-format") or None,
                    llm_job=request.headers.get("x-aalie-llm-job") or None,
                    llm_provider=request.headers.get("x-aalie-llm-provider") or None,
                    llm_model=request.headers.get("x-aalie-llm-model") or None,
                    app_build_sha=os.getenv("AALIE_BUILD_SHA", "")[:40] or None,
                )
            )
            db.commit()
    except Exception:
        # Telemetry must never alter a successful pedagogical response.
        return
