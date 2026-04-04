"""Repo-local MCP server for AALIE."""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any, Callable, Dict

ROOT = Path(__file__).resolve().parent.parent
MCP_DIR = ROOT / "mcp"
APPS_API_DIR = ROOT / "apps" / "api"

for path in (MCP_DIR, APPS_API_DIR):
    path_str = str(path)
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

try:
    from mcp.server.fastmcp import FastMCP as _FastMCP

    MCP_RUNTIME_AVAILABLE = True
except ImportError:
    MCP_RUNTIME_AVAILABLE = False

    class _FastMCP:  # pragma: no cover - exercised indirectly in smoke tests
        """Minimal fallback so the module can still be imported in dev/test."""

        def __init__(self, name: str, json_response: bool = False) -> None:
            self.name = name
            self.json_response = json_response
            self._decorated: Dict[str, Callable[..., Any]] = {}

        def tool(self) -> Callable[[Callable[..., Any]], Callable[..., Any]]:
            def decorator(func: Callable[..., Any]) -> Callable[..., Any]:
                self._decorated[func.__name__] = func
                return func

            return decorator

        def run(self, transport: str = "stdio") -> None:
            raise SystemExit(
                "The 'mcp' package is required to run the AALIE MCP server. "
                "Install it with: python3 -m pip install -r mcp/requirements.txt"
            )


from tools.check_contract_impact import (  # noqa: E402
    check_contract_impact as check_contract_impact_tool,
)
from tools.detect_recursive_family import (  # noqa: E402
    detect_recursive_family as detect_recursive_family_tool,
)
from tools.evaluate_while_case import (
    evaluate_while_case as evaluate_while_case_tool,
)  # noqa: E402
from tools.generate_test_oracle_stub import (  # noqa: E402
    generate_test_oracle_stub as generate_test_oracle_stub_tool,
)
from tools.get_change_context import (
    get_change_context as get_change_context_tool,
)  # noqa: E402
from tools.validate_snapshot_contract import (  # noqa: E402
    validate_snapshot_contract as validate_snapshot_contract_tool,
)

FastMCP = _FastMCP
mcp = FastMCP("AALIE Agentic", json_response=True)
REGISTERED_TOOLS: Dict[str, Callable[..., Any]] = {}


def _register_tool(
    func: Callable[..., Any],
) -> Callable[..., Any]:
    REGISTERED_TOOLS[func.__name__] = func
    return mcp.tool()(func)


@_register_tool
def get_change_context(
    path: str | None = None, feature: str | None = None
) -> Dict[str, Any]:
    """Return required docs/tests/skill before touching a repo area."""

    return get_change_context_tool(path=path, feature=feature)


@_register_tool
def check_contract_impact(changed_paths: list[str]) -> Dict[str, Any]:
    """Return impacted contracts, review checklist and tests for changed files."""

    return check_contract_impact_tool(changed_paths=changed_paths)


@_register_tool
def validate_snapshot_contract(
    snapshot: Dict[str, Any] | None = None,
    snapshot_path: str | None = None,
) -> Dict[str, Any]:
    """Validate a snapshot against AALIE snapshot contract invariants."""

    return validate_snapshot_contract_tool(
        snapshot=snapshot, snapshot_path=snapshot_path
    )


@_register_tool
def evaluate_while_case(source: str, mode: str = "worst") -> Dict[str, Any]:
    """Diagnose WHILE coverage/evidence without inventing conclusions."""

    return evaluate_while_case_tool(source=source, mode=mode)


@_register_tool
def detect_recursive_family(
    source: str,
    algorithm_kind: str | None = None,
) -> Dict[str, Any]:
    """Detect recurrence family and applicable recursive methods."""

    return detect_recursive_family_tool(source=source, algorithm_kind=algorithm_kind)


@_register_tool
def generate_test_oracle_stub(
    source: str = "",
    focus: str | None = None,
    changed_paths: list[str] | None = None,
) -> Dict[str, Any]:
    """Return the minimum expected-test structure for a source/change."""

    return generate_test_oracle_stub_tool(
        source=source,
        focus=focus,
        changed_paths=changed_paths,
    )


def main() -> None:
    """Run the MCP server over stdio."""

    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
