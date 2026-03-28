"""Shared pytest setup for repo-local MCP tests."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MCP_DIR = ROOT / "mcp"
APPS_API_DIR = ROOT / "apps" / "api"

for candidate in (MCP_DIR, APPS_API_DIR):
    candidate_str = str(candidate)
    if candidate_str not in sys.path:
        sys.path.insert(0, candidate_str)
