"""Promote the evaluation operators to ADMIN.

The allowlist in 20261009_0011 decides who can enter. These four
institutional accounts also operate the traceability panel. The update
runs on every environment, including production, when Alembic reaches head.
"""

from typing import Sequence, Union

from alembic import op

revision: str = "20261010_0012"
down_revision: Union[str, None] = "20261009_0011"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_OPERATOR_ADMIN_EMAILS = (
    "luzenith_g@ucaldas.edu.co",
    "jhon.patino29550@ucaldas.edu.co",
    "juan.cruz37552@ucaldas.edu.co",
    "juan.miranda41303@ucaldas.edu.co",
)


def upgrade() -> None:
    emails = ", ".join(f"'{email}'" for email in _OPERATOR_ADMIN_EMAILS)
    op.execute(
        f"""
        UPDATE auth."user"
        SET "role" = 'ADMIN',
            "updatedAt" = now()
        WHERE lower("email") IN ({emails})
        """
    )


def downgrade() -> None:
    emails = ", ".join(f"'{email}'" for email in _OPERATOR_ADMIN_EMAILS)
    op.execute(
        f"""
        UPDATE auth."user"
        SET "role" = 'USER',
            "updatedAt" = now()
        WHERE lower("email") IN ({emails})
          AND "role" = 'ADMIN'
        """
    )
