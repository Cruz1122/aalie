"""Use Better Auth 1.7 issuer/accountId external identities."""

from typing import Sequence, Union

from alembic import op

revision: str = "20260819_0005"
down_revision: Union[str, None] = "20260819_0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        """
        DO $$
        BEGIN
            IF EXISTS (
                SELECT 1
                FROM auth."account"
                WHERE "providerId" <> 'google'
            ) THEN
                RAISE EXCEPTION
                    'Manual account issuer mapping is required for historical non-Google providers';
            END IF;

            IF EXISTS (
                SELECT 1
                FROM auth."account"
                GROUP BY "issuer", "accountId"
                HAVING count(*) > 1
            ) THEN
                RAISE EXCEPTION
                    'Duplicate Better Auth identities found for issuer/accountId';
            END IF;
        END $$
        """
    )
    op.execute(
        'ALTER TABLE auth."account" ' "DROP CONSTRAINT IF EXISTS account_provider_identity_unique"
    )
    op.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS account_issuer_identity_unique "
        'ON auth."account" ("issuer", "accountId")'
    )


def downgrade() -> None:
    raise RuntimeError("Better Auth migrations are forward-only; restore a database backup instead")
