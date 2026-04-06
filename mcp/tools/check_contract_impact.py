"""Tool implementation for check_contract_impact."""

from __future__ import annotations

from typing import Any

from .catalog import build_contract_impact


def check_contract_impact(changed_paths: list[str]) -> dict[str, Any]:
    """Return contracts/tests/checklists impacted by changed paths."""

    return build_contract_impact(changed_paths=changed_paths)
