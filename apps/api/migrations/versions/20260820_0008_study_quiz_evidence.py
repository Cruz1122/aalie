"""Add authoritative study quiz attempts, items and adaptive progress."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260820_0008"
down_revision: Union[str, None] = "20260820_0007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "study_quiz_progress",
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("revision", sa.BigInteger(), nullable=False),
        sa.Column("mastery_by_skill", sa.JSON(), nullable=False),
        sa.Column("recent_question_ids", sa.JSON(), nullable=False),
        sa.Column("weak_skill_ids", sa.JSON(), nullable=False),
        sa.Column("last_failed_skill_ids", sa.JSON(), nullable=False),
        sa.Column("last_failed_topic_ids", sa.JSON(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["participant_id"], ["study_participants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("participant_id"),
    )

    op.create_table(
        "study_quiz_attempts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("participant_id", sa.Uuid(), nullable=False),
        sa.Column("session_id", sa.String(length=128), nullable=False),
        sa.Column("dataset_id", sa.String(length=128), nullable=False),
        sa.Column("dataset_schema_version", sa.String(length=32), nullable=False),
        sa.Column("taxonomy_version", sa.String(length=32), nullable=False),
        sa.Column("dataset_sha256", sa.String(length=64), nullable=False),
        sa.Column("app_build_sha", sa.String(length=40), nullable=True),
        sa.Column("selector_version", sa.String(length=64), nullable=False),
        sa.Column("grading_version", sa.String(length=64), nullable=False),
        sa.Column("progress_version", sa.String(length=64), nullable=False),
        sa.Column("progress_revision_before", sa.BigInteger(), nullable=False),
        sa.Column("course_id", sa.String(length=96), nullable=False),
        sa.Column("module_id", sa.String(length=128), nullable=True),
        sa.Column("locale", sa.String(length=32), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("question_count", sa.Integer(), nullable=False),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("max_score", sa.Float(), nullable=True),
        sa.Column("accuracy", sa.Float(), nullable=True),
        sa.Column("result_json", sa.JSON(), nullable=True),
        sa.CheckConstraint(
            "status IN ('STARTED','SUBMITTED','INVALIDATED')",
            name="ck_study_quiz_attempt_status",
        ),
        sa.CheckConstraint("question_count > 0", name="ck_study_quiz_question_count"),
        sa.CheckConstraint("char_length(dataset_sha256) = 64", name="ck_study_quiz_dataset_sha"),
        sa.ForeignKeyConstraint(["participant_id"], ["study_participants.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_id"),
    )
    op.create_index(
        "ix_study_quiz_attempts_participant_time",
        "study_quiz_attempts",
        ["participant_id", "started_at"],
    )

    op.create_table(
        "study_quiz_attempt_items",
        sa.Column("attempt_id", sa.Uuid(), nullable=False),
        sa.Column("position", sa.Integer(), nullable=False),
        sa.Column("question_id", sa.String(length=160), nullable=False),
        sa.Column("question_version", sa.Integer(), nullable=False),
        sa.Column("question_fingerprint_sha256", sa.String(length=64), nullable=False),
        sa.Column("topic", sa.String(length=128), nullable=False),
        sa.Column("difficulty", sa.String(length=32), nullable=False),
        sa.Column("question_type", sa.String(length=32), nullable=False),
        sa.Column("cognitive_level", sa.String(length=32), nullable=False),
        sa.Column("skill_ids", sa.JSON(), nullable=False),
        sa.Column("selection_reason_code", sa.String(length=64), nullable=False),
        sa.Column("option_order", sa.JSON(), nullable=False),
        sa.Column("left_item_order", sa.JSON(), nullable=False),
        sa.Column("right_item_order", sa.JSON(), nullable=False),
        sa.Column("score", sa.Float(), nullable=True),
        sa.Column("max_score", sa.Float(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=True),
        sa.CheckConstraint("position >= 0", name="ck_attempt_item_position"),
        sa.CheckConstraint(
            "char_length(question_fingerprint_sha256) = 64",
            name="ck_question_fingerprint",
        ),
        sa.ForeignKeyConstraint(["attempt_id"], ["study_quiz_attempts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("attempt_id", "position"),
        sa.UniqueConstraint("attempt_id", "question_id", name="uq_attempt_question"),
    )


def downgrade() -> None:
    op.drop_table("study_quiz_attempt_items")
    op.drop_index("ix_study_quiz_attempts_participant_time", table_name="study_quiz_attempts")
    op.drop_table("study_quiz_attempts")
    op.drop_table("study_quiz_progress")
