"""Shared helpers for repo-local MCP tools."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any, Iterable, Sequence

ROOT = Path(__file__).resolve().parents[2]
MCP_DIR = ROOT / "mcp"
APPS_API_DIR = ROOT / "apps" / "api"
PACKAGES_TYPES_FILE = ROOT / "packages" / "types" / "src" / "export-snapshot.ts"

RISK_ORDER = {"low": 0, "medium": 1, "high": 2}
SNAPSHOT_SECTION_STATUSES = {
    "available",
    "not_requested",
    "not_supported",
    "not_implemented",
    "missing_data",
}


def ensure_apps_api_on_path() -> None:
    """Ensure backend modules are importable by the tools."""

    apps_api_str = str(APPS_API_DIR)
    if apps_api_str not in sys.path:
        sys.path.insert(0, apps_api_str)


def ensure_mcp_on_path() -> None:
    """Ensure the local MCP helpers are importable."""

    mcp_dir_str = str(MCP_DIR)
    if mcp_dir_str not in sys.path:
        sys.path.insert(0, mcp_dir_str)


def dedupe(items: Iterable[Any]) -> list[Any]:
    """Return a stable de-duplicated list."""

    seen: set[Any] = set()
    output: list[Any] = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        output.append(item)
    return output


def normalize_repo_path(path: str | Path) -> str:
    """Return a stable repo-relative POSIX path when possible."""

    candidate = Path(path)
    if not candidate.is_absolute():
        return candidate.as_posix().lstrip("./")

    try:
        return candidate.resolve().relative_to(ROOT).as_posix()
    except ValueError:
        return candidate.resolve().as_posix()


def resolve_repo_path(path: str | Path) -> Path:
    """Resolve a user-provided path relative to repo root when needed."""

    candidate = Path(path)
    if candidate.is_absolute():
        return candidate
    return (ROOT / candidate).resolve()


def read_json_file(path: str | Path) -> Any:
    """Load JSON from disk."""

    with resolve_repo_path(path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def max_risk(risks: Sequence[str]) -> str:
    """Return the highest risk in the provided list."""

    if not risks:
        return "low"
    return max(risks, key=lambda risk: RISK_ORDER.get(risk, -1))


def extract_types_snapshot_schema_version() -> str | None:
    """Read the shared snapshot schema version from packages/types."""

    if not PACKAGES_TYPES_FILE.exists():
        return None

    content = PACKAGES_TYPES_FILE.read_text(encoding="utf-8")
    match = re.search(
        r'export const SNAPSHOT_SCHEMA_VERSION = "([^"]+)" as const;',
        content,
    )
    return match.group(1) if match else None


def section_status(section: Any) -> str | None:
    """Return a section status if the object looks like a snapshot section."""

    if isinstance(section, dict):
        status = section.get("status")
        if isinstance(status, str):
            return status
    return None


def section_data(section: Any) -> Any:
    """Return a section payload if the object looks like a snapshot section."""

    if isinstance(section, dict):
        return section.get("data")
    return None


def humanize_identifier(value: str | None) -> str:
    """Convert snake_case-ish identifiers into readable labels."""

    if not value:
        return "unknown"
    return value.replace("_", " ").strip()
