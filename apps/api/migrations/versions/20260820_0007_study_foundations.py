"""Add studies, participants, consent, measurements and allowlisted telemetry."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260820_0007"
down_revision: Union[str, None] = "20260820_0006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "studies",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("slug", sa.String(length=96), nullable=False),
        sa.Column("title", sa.String(length=240), nullable=False),
        sa.Column("protocol_version", sa.String(length=64), nullable=False),
        sa.Column("consent_version", sa.String(length=64), nullable=False),
        sa.Column("consent_sha256", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("telemetry_enabled", sa.Boolean(), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("retention_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "status IN ('DRAFT','ACTIVE','PAUSED','CLOSED')",
            name="ck_studies_status",
        ),
        sa.CheckConstraint("char_length(consent_sha256) = 64", name="ck_studies_consent_sha"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )

    op.create_table(
        "study_participants",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("study_id", sa.Uuid(), nullable=False),
        sa.Column("participant_code", sa.String(length=32), nullable=False),
        sa.Column("condition", sa.String(length=16), nullable=True),
        sa.Column("enrolled_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("condition_assigned_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("withdrawn_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("excluded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("exclusion_reason_code", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "condition IS NULL OR condition IN ('AALIE','CONTROL')",
            name="ck_participant_condition",
        ),
        sa.ForeignKeyConstraint(["study_id"], ["studies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("study_id", "participant_code", name="uq_study_participant_code"),
    )
    op.create_index("ix_study_participants_study_id", "study_participants", ["study_id"])

    op.create_table(
        "study_identity_links",
        sa.Column("study_id", sa.Uuid(), nullable=False),
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("auth_user_id", sa.String(length=255), nullable=False),
        sa.Column("linked_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["participant_id"], ["study_participants.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["study_id"], ["studies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("study_id", "participant_id"),
        sa.UniqueConstraint("participant_id"),
        sa.UniqueConstraint("study_id", "auth_user_id", name="uq_study_auth_user"),
    )

    op.create_table(
        "study_consents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("consent_version", sa.String(length=64), nullable=False),
        sa.Column("consent_sha256", sa.String(length=64), nullable=False),
        sa.Column("action", sa.String(length=16), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("action IN ('CONSENTED','WITHDRAWN')", name="ck_consent_action"),
        sa.CheckConstraint("char_length(consent_sha256) = 64", name="ck_consent_sha"),
        sa.ForeignKeyConstraint(["participant_id"], ["study_participants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_study_consents_participant", "study_consents", ["participant_id", "recorded_at"])

    op.create_table(
        "study_measurements",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("metric_key", sa.String(length=96), nullable=False),
        sa.Column("metric_version", sa.String(length=32), nullable=False),
        sa.Column("phase", sa.String(length=32), nullable=False),
        sa.Column("numeric_value", sa.Float(), nullable=False),
        sa.Column("unit", sa.String(length=32), nullable=True),
        sa.Column("measured_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["participant_id"], ["study_participants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "study_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("event_name", sa.String(length=48), nullable=False),
        sa.Column("event_version", sa.String(length=16), nullable=False),
        sa.Column("source", sa.String(length=16), nullable=False),
        sa.Column("request_id", sa.String(length=64), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("success", sa.Boolean(), nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("error_code", sa.String(length=64), nullable=True),
        sa.Column("algorithm_kind", sa.String(length=32), nullable=True),
        sa.Column("analysis_method", sa.String(length=64), nullable=True),
        sa.Column("export_format", sa.String(length=16), nullable=True),
        sa.Column("llm_job", sa.String(length=64), nullable=True),
        sa.Column("llm_provider", sa.String(length=64), nullable=True),
        sa.Column("llm_model", sa.String(length=128), nullable=True),
        sa.Column("app_build_sha", sa.String(length=40), nullable=True),
        sa.CheckConstraint(
            "event_name IN ('analysis_run','trace_run','export_run','llm_run')",
            name="ck_study_event_name",
        ),
        sa.CheckConstraint("source IN ('SERVER','CLIENT')", name="ck_study_event_source"),
        sa.CheckConstraint("duration_ms IS NULL OR duration_ms >= 0", name="ck_event_duration"),
        sa.ForeignKeyConstraint(["participant_id"], ["study_participants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_study_events_participant_time", "study_events", ["participant_id", "occurred_at"])


def downgrade() -> None:
    op.drop_index("ix_study_events_participant_time", table_name="study_events")
    op.drop_table("study_events")
    op.drop_table("study_measurements")
    op.drop_index("ix_study_consents_participant", table_name="study_consents")
    op.drop_table("study_consents")
    op.drop_table("study_identity_links")
    op.drop_index("ix_study_participants_study_id", table_name="study_participants")
    op.drop_table("study_participants")
    op.drop_table("studies")
