"""Enrollment and roster for the single classroom study."""

from __future__ import annotations

from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select, text
from sqlalchemy.orm import Session

from ...db.models.mf3 import Study, StudyEvent, StudyQuizAttempt
from .schemas import ClassroomActivityItem, ClassroomStudentRow
from .service import assign_condition, consent_to_study, get_participant_for_user

CLASSROOM_STUDY_SLUG = "2026-2"
OPERATOR_ADMIN_EMAILS = frozenset(
    {
        "luzenith_g@ucaldas.edu.co",
        "jhon.patino29550@ucaldas.edu.co",
        "juan.cruz37552@ucaldas.edu.co",
        "juan.miranda41303@ucaldas.edu.co",
    }
)

_EVENT_KINDS = {
    "analysis_run": "analysis",
    "trace_run": "trace",
    "export_run": "export",
    "llm_run": "assistant",
}


def is_classroom_student(email: str | None) -> bool:
    normalized = (email or "").strip().casefold()
    return bool(normalized) and normalized not in OPERATOR_ADMIN_EMAILS


def _allowlisted(db: Session, email: str) -> bool:
    found = db.execute(
        text("SELECT 1 FROM auth.access_allowlist WHERE email = :email"),
        {"email": email},
    ).first()
    return found is not None


def ensure_classroom_participant(
    db: Session,
    *,
    user_id: str,
    email: str | None,
) -> None:
    """Enroll an allowlisted student so existing telemetry can be stored."""

    normalized = (email or "").strip().casefold()
    if not is_classroom_student(normalized) or not _allowlisted(db, normalized):
        return
    study = db.scalar(select(Study).where(Study.slug == CLASSROOM_STUDY_SLUG))
    if study is None or study.status != "ACTIVE":
        return
    try:
        participant = consent_to_study(db, study=study, user_id=user_id)
    except HTTPException:
        return
    if participant.condition != "AALIE":
        try:
            assign_condition(
                db,
                study=study,
                participant_id=participant.id,
                condition="AALIE",
            )
        except HTTPException:
            return


def _student_emails(db: Session) -> list[str]:
    emails = db.execute(text("SELECT email FROM auth.access_allowlist ORDER BY email")).scalars()
    return [email for email in emails if is_classroom_student(email)]


def _user_id(db: Session, email: str) -> str | None:
    return db.execute(
        text('SELECT id FROM auth."user" WHERE lower(email) = :email'),
        {"email": email},
    ).scalar()


def _activity_for_participant(
    db: Session, participant_id
) -> tuple[datetime | None, dict[str, int], list[ClassroomActivityItem]]:
    counts = {"analysis": 0, "trace": 0, "quizzes": 0, "assistant": 0}
    items: list[ClassroomActivityItem] = []
    events = db.scalars(select(StudyEvent).where(StudyEvent.participant_id == participant_id))
    for event in events:
        kind = _EVENT_KINDS.get(event.event_name)
        if kind == "analysis":
            counts["analysis"] += 1
        elif kind == "trace":
            counts["trace"] += 1
        elif kind == "assistant":
            counts["assistant"] += 1
        if kind is None:
            continue
        items.append(
            ClassroomActivityItem(
                occurredAt=event.occurred_at,
                kind=kind,
                success=event.success,
            )
        )

    attempts = db.scalars(
        select(StudyQuizAttempt).where(StudyQuizAttempt.participant_id == participant_id)
    )
    for attempt in attempts:
        counts["quizzes"] += 1
        items.append(
            ClassroomActivityItem(
                occurredAt=attempt.submitted_at or attempt.started_at,
                kind="quiz",
                success=attempt.status == "SUBMITTED",
            )
        )

    items.sort(key=lambda item: item.occurredAt, reverse=True)
    last = items[0].occurredAt if items else None
    return last, counts, items


def classroom_roster(db: Session) -> list[ClassroomStudentRow]:
    study = db.scalar(select(Study).where(Study.slug == CLASSROOM_STUDY_SLUG))
    rows: list[ClassroomStudentRow] = []
    for email in _student_emails(db):
        user_id = _user_id(db, email)
        participant = (
            get_participant_for_user(db, study_id=study.id, user_id=user_id)
            if study is not None and user_id
            else None
        )
        last = None
        counts = {"analysis": 0, "trace": 0, "quizzes": 0, "assistant": 0}
        if participant is not None:
            last, counts, _items = _activity_for_participant(db, participant.id)
        rows.append(
            ClassroomStudentRow(
                email=email,
                lastActivityAt=last,
                analysis=counts["analysis"],
                traces=counts["trace"],
                quizzes=counts["quizzes"],
                assistant=counts["assistant"],
            )
        )
    rows.sort(
        key=lambda row: (
            row.lastActivityAt is None,
            -(row.lastActivityAt.timestamp() if row.lastActivityAt else 0),
            row.email,
        )
    )
    return rows


def classroom_activity(db: Session, email: str) -> list[ClassroomActivityItem]:
    normalized = email.strip().casefold()
    if normalized not in set(_student_emails(db)):
        raise HTTPException(status_code=404, detail="Student not found")
    study = db.scalar(select(Study).where(Study.slug == CLASSROOM_STUDY_SLUG))
    user_id = _user_id(db, normalized)
    if study is None or not user_id:
        return []
    participant = get_participant_for_user(db, study_id=study.id, user_id=user_id)
    if participant is None:
        return []
    _last, _counts, items = _activity_for_participant(db, participant.id)
    return items
