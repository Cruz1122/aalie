"""
Helpers for snapshot section statuses.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional


def create_section(
    status: str,
    data: Any = None,
    warnings: Optional[List[Dict[str, Any]]] = None,
    todos: Optional[List[str]] = None,
) -> Dict[str, Any]:
    section: Dict[str, Any] = {"status": status}
    if data is not None:
        section["data"] = data
    if warnings:
        section["warnings"] = warnings
    if todos:
        section["todos"] = todos
    return section


def mark_not_implemented(todo: str) -> Dict[str, Any]:
    return create_section("not_implemented", todos=[todo])


def mark_missing_data(warning: Dict[str, Any]) -> Dict[str, Any]:
    return create_section("missing_data", warnings=[warning])


def is_section_available(section: Optional[Dict[str, Any]]) -> bool:
    return bool(section) and section.get("status") == "available" and "data" in section

