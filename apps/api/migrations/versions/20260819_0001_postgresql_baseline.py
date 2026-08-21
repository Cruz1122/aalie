"""Empty baseline for the PostgreSQL infrastructure phase."""

from typing import Sequence, Union

revision: str = "20260819_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Record the baseline without creating business tables."""


def downgrade() -> None:
    """Remove the baseline revision marker."""
