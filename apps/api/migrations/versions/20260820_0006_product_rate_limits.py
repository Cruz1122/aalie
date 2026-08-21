"""Add atomic product rate-limit buckets."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260820_0006"
down_revision: Union[str, None] = "20260819_0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "rate_limit_buckets",
        sa.Column("scope", sa.String(length=64), nullable=False),
        sa.Column("subject_hash", sa.String(length=64), nullable=False),
        sa.Column("window_started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("reset_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("request_count", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("request_count >= 0", name="ck_rate_limit_count_nonnegative"),
        sa.PrimaryKeyConstraint("scope", "subject_hash"),
    )
    op.create_index("ix_rate_limit_reset_at", "rate_limit_buckets", ["reset_at"])


def downgrade() -> None:
    op.drop_index("ix_rate_limit_reset_at", table_name="rate_limit_buckets")
    op.drop_table("rate_limit_buckets")
