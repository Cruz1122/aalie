"""Persist temporary LLM abuse bans by pseudonymous rate-limit subject."""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20261007_0010"
down_revision: Union[str, None] = "20260820_0009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "abuse_bans",
        sa.Column("subject_hash", sa.String(length=64), nullable=False),
        sa.Column("strike_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("strike_window_started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_violation_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("banned_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "reason_code",
            sa.String(length=64),
            nullable=False,
            server_default="LLM_RATE_SPAM",
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("strike_count >= 0", name="ck_abuse_ban_strikes_nonnegative"),
        sa.PrimaryKeyConstraint("subject_hash"),
    )
    op.create_index("ix_abuse_bans_banned_until", "abuse_bans", ["banned_until"])
    op.create_index("ix_abuse_bans_updated_at", "abuse_bans", ["updated_at"])


def downgrade() -> None:
    op.drop_index("ix_abuse_bans_updated_at", table_name="abuse_bans")
    op.drop_index("ix_abuse_bans_banned_until", table_name="abuse_bans")
    op.drop_table("abuse_bans")
