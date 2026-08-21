"""Add Better Auth JWT key metadata columns.

Better Auth 1.7 reads and writes the optional algorithm and curve metadata
for every JWK. Keep the migration idempotent for databases that were created
from a generated Better Auth schema containing these columns already.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "20260819_0003"
down_revision: Union[str, None] = "20260819_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('ALTER TABLE auth."jwks" ADD COLUMN IF NOT EXISTS "alg" text')
    op.execute('ALTER TABLE auth."jwks" ADD COLUMN IF NOT EXISTS "crv" text')


def downgrade() -> None:
    raise RuntimeError("Better Auth migrations are forward-only; restore a database backup instead")
