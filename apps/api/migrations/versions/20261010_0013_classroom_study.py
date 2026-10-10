"""Create the single classroom study used by Gestión."""

import hashlib
from typing import Sequence, Union

from alembic import op

revision: str = "20261010_0013"
down_revision: Union[str, None] = "20261010_0012"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

_SLUG = "2026-2"
_CONSENT_SHA256 = hashlib.sha256(b"2026-2").hexdigest()


def upgrade() -> None:
    op.execute(
        f"""
        INSERT INTO studies (
            id,
            slug,
            title,
            protocol_version,
            consent_version,
            consent_sha256,
            status,
            telemetry_enabled,
            starts_at,
            created_at,
            updated_at
        )
        SELECT
            gen_random_uuid(),
            '{_SLUG}',
            '{_SLUG}',
            '1.0.0',
            '1.0.0',
            '{_CONSENT_SHA256}',
            'ACTIVE',
            true,
            now(),
            now(),
            now()
        WHERE NOT EXISTS (
            SELECT 1 FROM studies WHERE slug = '{_SLUG}'
        )
        """
    )
    op.execute(
        f"""
        UPDATE studies
        SET status = 'ACTIVE',
            telemetry_enabled = true,
            title = '{_SLUG}',
            starts_at = COALESCE(starts_at, now()),
            updated_at = now()
        WHERE slug = '{_SLUG}'
          AND status <> 'CLOSED'
        """
    )


def downgrade() -> None:
    op.execute(
        f"""
        DELETE FROM studies AS study
        WHERE study.slug = '{_SLUG}'
          AND NOT EXISTS (
              SELECT 1
              FROM study_participants AS participant
              WHERE participant.study_id = study.id
          )
        """
    )
