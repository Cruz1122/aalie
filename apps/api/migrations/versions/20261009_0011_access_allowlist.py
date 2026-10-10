"""Create the evaluation access allowlist in the auth schema."""

from typing import Sequence, Union

from alembic import op

revision: str = "20261009_0011"
down_revision: Union[str, None] = "20261007_0010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_ALLOWLIST_EMAILS = (
    "jacobo.arroyave46095@ucaldas.edu.co",
    "andres.1702012582@ucaldas.edu.co",
    "juan.1701617972@ucaldas.edu.co",
    "laura.cardona43736@ucaldas.edu.co",
    "mariana.garcia33537@ucaldas.edu.co",
    "miguel.1701921572@ucaldas.edu.co",
    "isabela.guerrero53416@ucaldas.edu.co",
    "juan.giraldo43633@ucaldas.edu.co",
    "juan.hernandez40471@ucaldas.edu.co",
    "carlos.lema55586@ucaldas.edu.co",
    "juan.martinez46703@ucaldas.edu.co",
    "rafael.medina46005@ucaldas.edu.co",
    "mateo.mejia32303@ucaldas.edu.co",
    "andres.padilla34809@ucaldas.edu.co",
    "michael.ramirez63421@ucaldas.edu.co",
    "luis.rivera40256@ucaldas.edu.co",
    "juan.rendon37632@ucaldas.edu.co",
    "andres.salazar43822@ucaldas.edu.co",
    "bairon.vasquez44190@ucaldas.edu.co",
    "victor.valencia28604@ucaldas.edu.co",
    "sergio.velasquez28396@ucaldas.edu.co",
    "luzenith_g@ucaldas.edu.co",
    "jhon.patino29550@ucaldas.edu.co",
    "juan.cruz37552@ucaldas.edu.co",
    "juan.miranda41303@ucaldas.edu.co",
)


def upgrade() -> None:
    op.execute("CREATE SCHEMA IF NOT EXISTS auth")
    op.execute(
        """
        CREATE TABLE auth.access_allowlist (
            email text PRIMARY KEY,
            created_at timestamptz NOT NULL DEFAULT now(),
            CONSTRAINT access_allowlist_email_normalized CHECK (
                email = lower(email)
                AND email LIKE '%@ucaldas.edu.co'
                AND length(email) <= 320
            )
        )
        """
    )
    emails = ", ".join(f"('{email}')" for email in _ALLOWLIST_EMAILS)
    op.execute(
        f"""
        INSERT INTO auth.access_allowlist (email)
        VALUES {emails}
        ON CONFLICT (email) DO NOTHING
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS auth.access_allowlist")
