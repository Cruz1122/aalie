from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import zipfile
from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from ...core.database import get_engine
from ...db.models.mf3 import (
    Study,
    StudyConsent,
    StudyEvent,
    StudyExportAudit,
    StudyMeasurement,
    StudyParticipant,
    StudyQuizAttempt,
    StudyQuizAttemptItem,
)
from .constants import STUDY_EXPORT_SCHEMA_VERSION


@dataclass(frozen=True)
class StudyExport:
    archive: bytes
    sha256: str
    filename: str
    row_counts: dict[str, int]


def _iso(value: datetime | None) -> str:
    return value.astimezone(timezone.utc).isoformat() if value else ""


def _csv_bytes(headers: list[str], rows: list[list[object]]) -> bytes:
    text = io.StringIO(newline="")
    writer = csv.writer(text, lineterminator="\n")
    writer.writerow(headers)
    writer.writerows(rows)
    return text.getvalue().encode("utf-8")


def build_study_export(study_id: UUID) -> StudyExport:
    engine = get_engine()
    generated_at = datetime.now(timezone.utc)
    with engine.connect().execution_options(isolation_level="REPEATABLE READ") as connection:
        with Session(bind=connection) as db, db.begin():
            study = db.get(Study, study_id)
            if study is None:
                raise ValueError("Study not found")

            participants = list(
                db.scalars(
                    select(StudyParticipant)
                    .where(StudyParticipant.study_id == study.id)
                    .order_by(StudyParticipant.participant_code)
                )
            )
            participant_ids = [participant.id for participant in participants]

            consents = (
                list(
                    db.scalars(
                        select(StudyConsent)
                        .where(StudyConsent.participant_id.in_(participant_ids))
                        .order_by(StudyConsent.recorded_at)
                    )
                )
                if participant_ids
                else []
            )
            consent_by_participant: dict[UUID, StudyConsent] = {}
            for consent in consents:
                consent_by_participant[consent.participant_id] = consent

            attempts = (
                list(
                    db.scalars(
                        select(StudyQuizAttempt)
                        .where(StudyQuizAttempt.participant_id.in_(participant_ids))
                        .order_by(StudyQuizAttempt.started_at)
                    )
                )
                if participant_ids
                else []
            )
            attempt_ids = [attempt.id for attempt in attempts]
            items = (
                list(
                    db.scalars(
                        select(StudyQuizAttemptItem)
                        .where(StudyQuizAttemptItem.attempt_id.in_(attempt_ids))
                        .order_by(
                            StudyQuizAttemptItem.attempt_id,
                            StudyQuizAttemptItem.position,
                        )
                    )
                )
                if attempt_ids
                else []
            )
            events = (
                list(
                    db.scalars(
                        select(StudyEvent)
                        .where(StudyEvent.participant_id.in_(participant_ids))
                        .order_by(StudyEvent.occurred_at)
                    )
                )
                if participant_ids
                else []
            )
            measurements = (
                list(
                    db.scalars(
                        select(StudyMeasurement)
                        .where(StudyMeasurement.participant_id.in_(participant_ids))
                        .order_by(StudyMeasurement.measured_at)
                    )
                )
                if participant_ids
                else []
            )

            participant_rows = [
                [
                    p.id,
                    p.participant_code,
                    p.condition or "",
                    _iso(p.enrolled_at),
                    _iso(p.withdrawn_at),
                    _iso(p.excluded_at),
                    consent_by_participant[p.id].consent_version
                    if p.id in consent_by_participant
                    else "",
                ]
                for p in participants
            ]
            attempt_rows = [
                [
                    a.participant_id,
                    a.id,
                    a.session_id,
                    a.dataset_id,
                    a.dataset_schema_version,
                    a.taxonomy_version,
                    a.dataset_sha256,
                    a.app_build_sha or "",
                    a.selector_version,
                    a.grading_version,
                    a.progress_version,
                    a.progress_revision_before,
                    a.locale,
                    a.module_id or "",
                    a.status,
                    _iso(a.started_at),
                    _iso(a.submitted_at),
                    a.score if a.score is not None else "",
                    a.max_score if a.max_score is not None else "",
                    a.accuracy if a.accuracy is not None else "",
                    a.question_count,
                ]
                for a in attempts
            ]
            attempt_participant = {a.id: a.participant_id for a in attempts}
            item_rows = [
                [
                    attempt_participant[item.attempt_id],
                    item.attempt_id,
                    item.position,
                    item.question_id,
                    item.question_version,
                    item.question_fingerprint_sha256,
                    item.topic,
                    item.difficulty,
                    item.question_type,
                    item.cognitive_level,
                    "|".join(item.skill_ids or []),
                    item.selection_reason_code,
                    item.score if item.score is not None else "",
                    item.max_score,
                    item.is_correct if item.is_correct is not None else "",
                ]
                for item in items
            ]
            event_rows = [
                [
                    e.participant_id,
                    e.event_name,
                    e.event_version,
                    e.source,
                    e.request_id or "",
                    _iso(e.occurred_at),
                    e.success,
                    e.duration_ms if e.duration_ms is not None else "",
                    e.error_code or "",
                    e.algorithm_kind or "",
                    e.analysis_method or "",
                    e.export_format or "",
                    e.llm_job or "",
                    e.llm_provider or "",
                    e.llm_model or "",
                    e.app_build_sha or "",
                ]
                for e in events
            ]
            measurement_rows = [
                [
                    m.participant_id,
                    m.metric_key,
                    m.metric_version,
                    m.phase,
                    m.numeric_value,
                    m.unit or "",
                    _iso(m.measured_at),
                ]
                for m in measurements
            ]

            payloads: dict[str, bytes] = {
                "participants.csv": _csv_bytes(
                    [
                        "participant_id",
                        "participant_code",
                        "condition",
                        "enrolled_at",
                        "withdrawn_at",
                        "excluded_at",
                        "consent_version",
                    ],
                    participant_rows,
                ),
                "quiz_attempts.csv": _csv_bytes(
                    [
                        "participant_id",
                        "attempt_id",
                        "session_id",
                        "dataset_id",
                        "dataset_schema_version",
                        "taxonomy_version",
                        "dataset_sha256",
                        "app_build_sha",
                        "selector_version",
                        "grading_version",
                        "progress_version",
                        "progress_revision_before",
                        "locale",
                        "module_id",
                        "status",
                        "started_at",
                        "submitted_at",
                        "score",
                        "max_score",
                        "accuracy",
                        "question_count",
                    ],
                    attempt_rows,
                ),
                "quiz_items.csv": _csv_bytes(
                    [
                        "participant_id",
                        "attempt_id",
                        "position",
                        "question_id",
                        "question_version",
                        "question_fingerprint",
                        "topic",
                        "difficulty",
                        "question_type",
                        "cognitive_level",
                        "skill_ids",
                        "selection_reason_code",
                        "score",
                        "max_score",
                        "is_correct",
                    ],
                    item_rows,
                ),
                "events.csv": _csv_bytes(
                    [
                        "participant_id",
                        "event_name",
                        "event_version",
                        "source",
                        "request_id",
                        "occurred_at",
                        "success",
                        "duration_ms",
                        "error_code",
                        "algorithm_kind",
                        "analysis_method",
                        "export_format",
                        "llm_job",
                        "llm_provider",
                        "llm_model",
                        "app_build_sha",
                    ],
                    event_rows,
                ),
                "measurements.csv": _csv_bytes(
                    [
                        "participant_id",
                        "metric_key",
                        "metric_version",
                        "phase",
                        "numeric_value",
                        "unit",
                        "measured_at",
                    ],
                    measurement_rows,
                ),
            }

            row_counts = {
                "participants": len(participant_rows),
                "quizAttempts": len(attempt_rows),
                "quizItems": len(item_rows),
                "events": len(event_rows),
                "measurements": len(measurement_rows),
            }
            dictionary = {
                "privacy": (
                    "Pseudonymized research export. auth_user_id, email, name, IP, user-agent, "
                    "source code, prompts and complete LLM responses are intentionally excluded."
                ),
                "participant_id": "Stable pseudonymous participant UUID within AALIE.",
                "participant_code": "Human-readable pseudonymous code.",
                "question_fingerprint": "SHA-256 of canonical question content/version.",
                "selection_reason_code": "Deterministic selector reason recorded at session creation.",
            }
            payloads["data_dictionary.json"] = json.dumps(
                dictionary, ensure_ascii=False, indent=2, sort_keys=True
            ).encode("utf-8")
            manifest = {
                "exportSchemaVersion": STUDY_EXPORT_SCHEMA_VERSION,
                "study": study.slug,
                "protocolVersion": study.protocol_version,
                "consentVersion": study.consent_version,
                "generatedAt": generated_at.isoformat(),
                "cutoffAt": generated_at.isoformat(),
                "appBuildSha": os.getenv("AALIE_BUILD_SHA", ""),
                "datasetIds": sorted({attempt.dataset_id for attempt in attempts}),
                "datasetHashes": sorted({attempt.dataset_sha256 for attempt in attempts}),
                "selectorVersions": sorted({attempt.selector_version for attempt in attempts}),
                "gradingVersions": sorted({attempt.grading_version for attempt in attempts}),
                "progressVersions": sorted({attempt.progress_version for attempt in attempts}),
                "rowCounts": row_counts,
                "files": {
                    name: f"sha256:{hashlib.sha256(content).hexdigest()}"
                    for name, content in sorted(payloads.items())
                },
            }
            payloads["manifest.json"] = json.dumps(
                manifest, ensure_ascii=False, indent=2, sort_keys=True
            ).encode("utf-8")

    archive_io = io.BytesIO()
    with zipfile.ZipFile(archive_io, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for name in sorted(payloads):
            archive.writestr(name, payloads[name])
    archive_bytes = archive_io.getvalue()
    archive_sha = hashlib.sha256(archive_bytes).hexdigest()
    filename = f"aalie-study-{study.slug}-{generated_at.date().isoformat()}.zip"
    return StudyExport(
        archive=archive_bytes,
        sha256=archive_sha,
        filename=filename,
        row_counts=row_counts,
    )


def record_export_audit(
    db: Session,
    *,
    study_id: UUID,
    admin_user_id: str,
    export: StudyExport,
) -> StudyExportAudit:
    audit = StudyExportAudit(
        study_id=study_id,
        admin_user_id=admin_user_id,
        archive_sha256=export.sha256,
        participant_rows=export.row_counts["participants"],
        attempt_rows=export.row_counts["quizAttempts"],
        item_rows=export.row_counts["quizItems"],
        event_rows=export.row_counts["events"],
        measurement_rows=export.row_counts["measurements"],
    )
    db.add(audit)
    db.commit()
    return audit
