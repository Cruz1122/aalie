"""Add the account issuer required by Better Auth 1.7."""

from typing import Sequence, Union

from alembic import op

revision: str = "20260819_0004"
down_revision: Union[str, None] = "20260819_0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('ALTER TABLE auth."account" ADD COLUMN IF NOT EXISTS "issuer" text')
    op.execute(
        """
        UPDATE auth."account"
        SET "issuer" = CASE
            WHEN "providerId" = 'google' THEN 'https://accounts.google.com'
            ELSE "providerId"
        END
        WHERE "issuer" IS NULL
        """
    )
    op.execute('ALTER TABLE auth."account" ALTER COLUMN "issuer" SET NOT NULL')


def downgrade() -> None:
    raise RuntimeError("Better Auth migrations are forward-only; restore a database backup instead")
