from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ...db.models.mf3 import (
    Study,
    StudyConsent,
    StudyIdentityLink,
    StudyMeasurement,
    StudyParticipant,
    StudyQuizAttempt,
)
from .constants import MEASUREMENT_KEYS, STUDY_CONDITIONS
from .schemas import (
    ParticipantAdminRow,
    ParticipantPublic,
    StudyCreateRequest,
    StudyMeasurementRequest,
    StudyPublic,
    StudySummaryResponse,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _study_public(study: Study) -> StudyPublic:
    return StudyPublic(
        id=study.id,
        slug=study.slug,
        title=study.title,
        protocolVersion=study.protocol_version,
        consentVersion=study.consent_version,
        consentSha256=study.consent_sha256,
        status=study.status,
        telemetryEnabled=study.telemetry_enabled,
    )


def _participant_public(participant: StudyParticipant) -> ParticipantPublic:
    return ParticipantPublic(
        id=participant.id,
        participantCode=participant.participant_code,
        condition=participant.condition,
        enrolledAt=participant.enrolled_at,
        withdrawnAt=participant.withdrawn_at,
        excludedAt=participant.excluded_at,
    )


def get_study_or_404(db: Session, slug: str) -> Study:
    study = db.scalar(select(Study).where(Study.slug == slug))
    if study is None:
        raise HTTPException(status_code=404, detail="Study not found")
    return study


def get_participant_for_user(
    db: Session,
    *,
    study_id: UUID,
    user_id: str,
) -> StudyParticipant | None:
    return db.scalar(
        select(StudyParticipant)
        .join(StudyIdentityLink, StudyIdentityLink.participant_id == StudyParticipant.id)
        .where(
            StudyIdentityLink.study_id == study_id,
            StudyIdentityLink.auth_user_id == user_id,
        )
    )


def require_recording_participant(
    db: Session,
    *,
    study_slug: str,
    user_id: str,
) -> tuple[Study, StudyParticipant]:
    study = get_study_or_404(db, study_slug)
    if study.status != "ACTIVE":
        raise HTTPException(status_code=409, detail="Study is not active")
    participant = get_participant_for_user(db, study_id=study.id, user_id=user_id)
    if participant is None:
        raise HTTPException(status_code=403, detail="Not enrolled in study")
    if participant.withdrawn_at is not None or participant.excluded_at is not None:
        raise HTTPException(status_code=403, detail="Study participation is inactive")
    if participant.condition not in STUDY_CONDITIONS:
        raise HTTPException(status_code=409, detail="Study condition is not assigned")
    return study, participant


def create_study(db: Session, payload: StudyCreateRequest) -> Study:
    if db.scalar(select(Study.id).where(Study.slug == payload.slug)) is not None:
        raise HTTPException(status_code=409, detail="Study slug already exists")
    study = Study(
        slug=payload.slug,
        title=payload.title,
        protocol_version=payload.protocolVersion,
        consent_version=payload.consentVersion,
        consent_sha256=payload.consentSha256,
        status="DRAFT",
        telemetry_enabled=False,
        retention_until=payload.retentionUntil,
    )
    db.add(study)
    db.commit()
    db.refresh(study)
    return study


def update_study_status(
    db: Session,
    *,
    study: Study,
    new_status: str,
    telemetry_enabled: bool | None,
) -> Study:
    transitions = {
        "DRAFT": {"ACTIVE"},
        "ACTIVE": {"PAUSED", "CLOSED"},
        "PAUSED": {"ACTIVE", "CLOSED"},
        "CLOSED": set(),
    }
    if new_status != study.status and new_status not in transitions[study.status]:
        raise HTTPException(
            status_code=409,
            detail=f"Invalid study transition {study.status}->{new_status}",
        )
    study.status = new_status
    if telemetry_enabled is not None:
        study.telemetry_enabled = telemetry_enabled
    if new_status == "ACTIVE" and study.starts_at is None:
        study.starts_at = _now()
    if new_status == "CLOSED":
        study.ends_at = study.ends_at or _now()
        study.telemetry_enabled = False
    db.commit()
    db.refresh(study)
    return study


def _new_participant_code() -> str:
    return f"P-{uuid4().hex[:8].upper()}"


def consent_to_study(db: Session, *, study: Study, user_id: str) -> StudyParticipant:
    if study.status != "ACTIVE":
        raise HTTPException(status_code=409, detail="Study is not accepting consent")
    existing = get_participant_for_user(db, study_id=study.id, user_id=user_id)
    if existing is not None:
        if existing.withdrawn_at is not None:
            raise HTTPException(status_code=409, detail="Withdrawn participation cannot be reactivated")
        return existing

    participant = StudyParticipant(
        study_id=study.id,
        participant_code=_new_participant_code(),
    )
    db.add(participant)
    db.flush()
    db.add(
        StudyIdentityLink(
            study_id=study.id,
            participant_id=participant.id,
            auth_user_id=user_id,
        )
    )
    db.add(
        StudyConsent(
            participant_id=participant.id,
            consent_version=study.consent_version,
            consent_sha256=study.consent_sha256,
            action="CONSENTED",
        )
    )
    db.commit()
    db.refresh(participant)
    return participant


def withdraw_from_study(db: Session, *, study: Study, user_id: str) -> StudyParticipant:
    participant = get_participant_for_user(db, study_id=study.id, user_id=user_id)
    if participant is None:
        raise HTTPException(status_code=404, detail="Study participation not found")
    if participant.withdrawn_at is None:
        participant.withdrawn_at = _now()
        db.add(
            StudyConsent(
                participant_id=participant.id,
                consent_version=study.consent_version,
                consent_sha256=study.consent_sha256,
                action="WITHDRAWN",
            )
        )
        db.commit()
        db.refresh(participant)
    return participant


def assign_condition(
    db: Session,
    *,
    study: Study,
    participant_id: UUID,
    condition: str,
) -> StudyParticipant:
    participant = db.get(StudyParticipant, participant_id)
    if participant is None or participant.study_id != study.id:
        raise HTTPException(status_code=404, detail="Participant not found")
    if condition not in STUDY_CONDITIONS:
        raise HTTPException(status_code=400, detail="Invalid study condition")

    evidence_exists = db.scalar(
        select(func.count())
        .select_from(StudyQuizAttempt)
        .where(StudyQuizAttempt.participant_id == participant.id)
    )
    if participant.condition is not None and participant.condition != condition and evidence_exists:
        raise HTTPException(
            status_code=409,
            detail="Condition is immutable after experimental evidence exists",
        )
    participant.condition = condition
    participant.condition_assigned_at = participant.condition_assigned_at or _now()
    db.commit()
    db.refresh(participant)
    return participant


def add_measurement(
    db: Session,
    *,
    participant: StudyParticipant,
    payload: StudyMeasurementRequest,
) -> StudyMeasurement:
    if payload.metricKey not in MEASUREMENT_KEYS:
        raise HTTPException(status_code=400, detail="Unsupported measurement key")
    measurement = StudyMeasurement(
        participant_id=participant.id,
        metric_key=payload.metricKey,
        metric_version=payload.metricVersion,
        phase=payload.phase,
        numeric_value=payload.numericValue,
        unit=payload.unit,
    )
    db.add(measurement)
    db.commit()
    db.refresh(measurement)
    return measurement


def list_studies(db: Session) -> list[StudyPublic]:
    return [_study_public(study) for study in db.scalars(select(Study).order_by(Study.created_at.desc()))]


def study_summary(db: Session, study: Study) -> StudySummaryResponse:
    participants = list(
        db.scalars(
            select(StudyParticipant).where(StudyParticipant.study_id == study.id)
        )
    )
    attempts = list(
        db.scalars(
            select(StudyQuizAttempt).join(
                StudyParticipant,
                StudyParticipant.id == StudyQuizAttempt.participant_id,
            ).where(StudyParticipant.study_id == study.id)
        )
    )
    completed = [attempt for attempt in attempts if attempt.status == "SUBMITTED"]
    accuracies = [attempt.accuracy for attempt in completed if attempt.accuracy is not None]
    return StudySummaryResponse(
        study=_study_public(study),
        participants=len(participants),
        activeParticipants=sum(
            p.withdrawn_at is None and p.excluded_at is None for p in participants
        ),
        withdrawn=sum(p.withdrawn_at is not None for p in participants),
        excluded=sum(p.excluded_at is not None for p in participants),
        aalie=sum(p.condition == "AALIE" for p in participants),
        control=sum(p.condition == "CONTROL" for p in participants),
        unassigned=sum(p.condition is None for p in participants),
        quizAttempts=len(attempts),
        completedQuizAttempts=len(completed),
        meanAccuracy=(sum(accuracies) / len(accuracies)) if accuracies else None,
    )


def participant_rows(db: Session, study: Study) -> list[ParticipantAdminRow]:
    participants = list(
        db.scalars(
            select(StudyParticipant)
            .where(StudyParticipant.study_id == study.id)
            .order_by(StudyParticipant.enrolled_at)
        )
    )
    rows: list[ParticipantAdminRow] = []
    for participant in participants:
        attempts = list(
            db.scalars(
                select(StudyQuizAttempt).where(
                    StudyQuizAttempt.participant_id == participant.id,
                    StudyQuizAttempt.status == "SUBMITTED",
                )
            )
        )
        accuracies = [a.accuracy for a in attempts if a.accuracy is not None]
        rows.append(
            ParticipantAdminRow(
                participantId=participant.id,
                participantCode=participant.participant_code,
                condition=participant.condition,
                enrolledAt=participant.enrolled_at,
                withdrawnAt=participant.withdrawn_at,
                excludedAt=participant.excluded_at,
                attempts=len(attempts),
                averageAccuracy=(sum(accuracies) / len(accuracies)) if accuracies else None,
            )
        )
    return rows


def public_study(study: Study) -> StudyPublic:
    return _study_public(study)


def public_participant(participant: StudyParticipant) -> ParticipantPublic:
    return _participant_public(participant)
