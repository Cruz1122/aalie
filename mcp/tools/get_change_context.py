"""Tool implementation for get_change_context."""

from __future__ import annotations

from typing import Any

from .catalog import build_change_context


def get_change_context(path: str | None = None, feature: str | None = None) -> dict[str, Any]:
    """Return repo context that must be read before making a change."""

    return build_change_context(path=path, feature=feature)
