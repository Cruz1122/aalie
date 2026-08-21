"""Add audit records for privileged research dataset exports."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260820_0009"
down_revision: Union[str, None] = "20260820_0008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "study_export_audit",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("study_id", sa.Uuid(), nullable=False),
        sa.Column("admin_user_id", sa.String(length=255), nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("archive_sha256", sa.String(length=64), nullable=False),
        sa.Column("participant_rows", sa.Integer(), nullable=False),
        sa.Column("attempt_rows", sa.Integer(), nullable=False),
        sa.Column("item_rows", sa.Integer(), nullable=False),
        sa.Column("event_rows", sa.Integer(), nullable=False),
        sa.Column("measurement_rows", sa.Integer(), nullable=False),
        sa.CheckConstraint("char_length(archive_sha256) = 64", name="ck_export_audit_sha"),
        sa.ForeignKeyConstraint(["study_id"], ["studies.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_study_export_audit_study_time",
        "study_export_audit",
        ["study_id", "generated_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_study_export_audit_study_time", table_name="study_export_audit")
    op.drop_table("study_export_audit")
