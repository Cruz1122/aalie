from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    UniqueConstraint,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column

from ..base import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class RateLimitBucket(Base):
    __tablename__ = "rate_limit_buckets"

    scope: Mapped[str] = mapped_column(String(64), primary_key=True)
    subject_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    window_started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    reset_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    request_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )

    __table_args__ = (CheckConstraint("request_count >= 0", name="ck_rate_limit_count_nonnegative"),)


class Study(Base):
    __tablename__ = "studies"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    slug: Mapped[str] = mapped_column(String(96), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(240), nullable=False)
    protocol_version: Mapped[str] = mapped_column(String(64), nullable=False)
    consent_version: Mapped[str] = mapped_column(String(64), nullable=False)
    consent_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="DRAFT")
    telemetry_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    retention_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=utcnow, onupdate=utcnow
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('DRAFT','ACTIVE','PAUSED','CLOSED')",
            name="ck_studies_status",
        ),
        CheckConstraint("char_length(consent_sha256) = 64", name="ck_studies_consent_sha"),
    )


class StudyParticipant(Base):
    __tablename__ = "study_participants"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    study_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("studies.id", ondelete="CASCADE"), nullable=False
    )
    participant_code: Mapped[str] = mapped_column(String(32), nullable=False)
    condition: Mapped[str | None] = mapped_column(String(16))
    enrolled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    condition_assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    excluded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    exclusion_reason_code: Mapped[str | None] = mapped_column(String(64))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    __table_args__ = (
        UniqueConstraint("study_id", "participant_code", name="uq_study_participant_code"),
        CheckConstraint(
            "condition IS NULL OR condition IN ('AALIE','CONTROL')",
            name="ck_participant_condition",
        ),
    )


class StudyIdentityLink(Base):
    __tablename__ = "study_identity_links"

    study_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("studies.id", ondelete="CASCADE"), primary_key=True
    )
    participant_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("study_participants.id", ondelete="CASCADE"),
        primary_key=True,
        nullable=False,
    )
    auth_user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    linked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    __table_args__ = (
        UniqueConstraint("study_id", "auth_user_id", name="uq_study_auth_user"),
    )


class StudyConsent(Base):
    __tablename__ = "study_consents"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    participant_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("study_participants.id", ondelete="CASCADE"),
        nullable=False,
    )
    consent_version: Mapped[str] = mapped_column(String(64), nullable=False)
    consent_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    action: Mapped[str] = mapped_column(String(16), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)

    __table_args__ = (
        CheckConstraint("action IN ('CONSENTED','WITHDRAWN')", name="ck_consent_action"),
        CheckConstraint("char_length(consent_sha256) = 64", name="ck_consent_sha"),
    )


class StudyMeasurement(Base):
    __tablename__ = "study_measurements"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    participant_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("study_participants.id", ondelete="CASCADE"),
        nullable=False,
    )
    metric_key: Mapped[str] = mapped_column(String(96), nullable=False)
    metric_version: Mapped[str] = mapped_column(String(32), nullable=False)
    phase: Mapped[str] = mapped_column(String(32), nullable=False)
    numeric_value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str | None] = mapped_column(String(32))
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class StudyEvent(Base):
    __tablename__ = "study_events"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    participant_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("study_participants.id", ondelete="CASCADE"),
        nullable=False,
    )
    event_name: Mapped[str] = mapped_column(String(48), nullable=False)
    event_version: Mapped[str] = mapped_column(String(16), nullable=False, default="1")
    source: Mapped[str] = mapped_column(String(16), nullable=False, default="SERVER")
    request_id: Mapped[str | None] = mapped_column(String(64))
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False)
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    error_code: Mapped[str | None] = mapped_column(String(64))
    algorithm_kind: Mapped[str | None] = mapped_column(String(32))
    analysis_method: Mapped[str | None] = mapped_column(String(64))
    export_format: Mapped[str | None] = mapped_column(String(16))
    llm_job: Mapped[str | None] = mapped_column(String(64))
    llm_provider: Mapped[str | None] = mapped_column(String(64))
    llm_model: Mapped[str | None] = mapped_column(String(128))
    app_build_sha: Mapped[str | None] = mapped_column(String(40))

    __table_args__ = (
        CheckConstraint(
            "event_name IN ('analysis_run','trace_run','export_run','llm_run')",
            name="ck_study_event_name",
        ),
        CheckConstraint("source IN ('SERVER','CLIENT')", name="ck_study_event_source"),
        CheckConstraint("duration_ms IS NULL OR duration_ms >= 0", name="ck_event_duration"),
    )


class StudyQuizProgress(Base):
    __tablename__ = "study_quiz_progress"

    participant_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("study_participants.id", ondelete="CASCADE"),
        primary_key=True,
    )
    revision: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    mastery_by_skill: Mapped[dict[str, float]] = mapped_column(JSON, nullable=False, default=dict)
    recent_question_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    weak_skill_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    last_failed_skill_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    last_failed_topic_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)


class StudyQuizAttempt(Base):
    __tablename__ = "study_quiz_attempts"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    participant_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("study_participants.id", ondelete="CASCADE"),
        nullable=False,
    )
    session_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    dataset_id: Mapped[str] = mapped_column(String(128), nullable=False)
    dataset_schema_version: Mapped[str] = mapped_column(String(32), nullable=False)
    taxonomy_version: Mapped[str] = mapped_column(String(32), nullable=False)
    dataset_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    app_build_sha: Mapped[str | None] = mapped_column(String(40))
    selector_version: Mapped[str] = mapped_column(String(64), nullable=False)
    grading_version: Mapped[str] = mapped_column(String(64), nullable=False)
    progress_version: Mapped[str] = mapped_column(String(64), nullable=False)
    progress_revision_before: Mapped[int] = mapped_column(BigInteger, nullable=False)
    course_id: Mapped[str] = mapped_column(String(96), nullable=False)
    module_id: Mapped[str | None] = mapped_column(String(128))
    locale: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default="STARTED")
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[float | None] = mapped_column(Float)
    max_score: Mapped[float | None] = mapped_column(Float)
    accuracy: Mapped[float | None] = mapped_column(Float)
    result_json: Mapped[dict[str, object] | None] = mapped_column(JSON)

    __table_args__ = (
        CheckConstraint(
            "status IN ('STARTED','SUBMITTED','INVALIDATED')",
            name="ck_study_quiz_attempt_status",
        ),
        CheckConstraint("question_count > 0", name="ck_study_quiz_question_count"),
        CheckConstraint("char_length(dataset_sha256) = 64", name="ck_study_quiz_dataset_sha"),
    )


class StudyQuizAttemptItem(Base):
    __tablename__ = "study_quiz_attempt_items"

    attempt_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("study_quiz_attempts.id", ondelete="CASCADE"),
        primary_key=True,
    )
    position: Mapped[int] = mapped_column(Integer, primary_key=True)
    question_id: Mapped[str] = mapped_column(String(160), nullable=False)
    question_version: Mapped[int] = mapped_column(Integer, nullable=False)
    question_fingerprint_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    topic: Mapped[str] = mapped_column(String(128), nullable=False)
    difficulty: Mapped[str] = mapped_column(String(32), nullable=False)
    question_type: Mapped[str] = mapped_column(String(32), nullable=False)
    cognitive_level: Mapped[str] = mapped_column(String(32), nullable=False)
    skill_ids: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    selection_reason_code: Mapped[str] = mapped_column(String(64), nullable=False)
    option_order: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    left_item_order: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    right_item_order: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    score: Mapped[float | None] = mapped_column(Float)
    max_score: Mapped[float] = mapped_column(Float, nullable=False)
    is_correct: Mapped[bool | None] = mapped_column(Boolean)

    __table_args__ = (
        UniqueConstraint("attempt_id", "question_id", name="uq_attempt_question"),
        CheckConstraint("position >= 0", name="ck_attempt_item_position"),
        CheckConstraint("char_length(question_fingerprint_sha256) = 64", name="ck_question_fingerprint"),
    )


class StudyExportAudit(Base):
    __tablename__ = "study_export_audit"

    id: Mapped[UUID] = mapped_column(Uuid(as_uuid=True), primary_key=True, default=uuid4)
    study_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True), ForeignKey("studies.id", ondelete="CASCADE"), nullable=False
    )
    admin_user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    archive_sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    participant_rows: Mapped[int] = mapped_column(Integer, nullable=False)
    attempt_rows: Mapped[int] = mapped_column(Integer, nullable=False)
    item_rows: Mapped[int] = mapped_column(Integer, nullable=False)
    event_rows: Mapped[int] = mapped_column(Integer, nullable=False)
    measurement_rows: Mapped[int] = mapped_column(Integer, nullable=False)

    __table_args__ = (CheckConstraint("char_length(archive_sha256) = 64", name="ck_export_audit_sha"),)
