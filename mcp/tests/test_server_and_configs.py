from __future__ import annotations

import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def _load_server_module():
    spec = importlib.util.spec_from_file_location(
        "aalie_repo_mcp_server",
        ROOT / "mcp" / "server.py",
    )
    assert spec is not None and spec.loader is not None
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _frontmatter_data(path: Path) -> dict:
    content = path.read_text(encoding="utf-8")
    assert content.startswith("---\n"), f"{path} missing opening frontmatter delimiter"
    end = content.find("\n---\n", 4)
    assert end != -1, f"{path} missing closing frontmatter delimiter"
    raw = content[4:end]
    try:
        import yaml  # type: ignore

        data = yaml.safe_load(raw)
        assert isinstance(data, dict)
        return data
    except Exception:
        result: dict[str, object] = {}
        current_key: str | None = None
        current_list: list[str] | None = None
        for line in raw.splitlines():
            if not line.strip():
                continue
            if not line.startswith("  - ") and ":" in line:
                key, value = line.split(":", 1)
                key = key.strip()
                value = value.strip()
                if value:
                    result[key] = value
                    current_key = None
                    current_list = None
                else:
                    result[key] = []
                    current_key = key
                    current_list = result[key]
            elif line.startswith("  - ") and current_key and isinstance(current_list, list):
                current_list.append(line[4:].strip())
        return result


def test_server_registers_exactly_the_six_repo_local_tools():
    module = _load_server_module()

    assert sorted(module.REGISTERED_TOOLS) == [
        "check_contract_impact",
        "detect_recursive_family",
        "evaluate_while_case",
        "generate_test_oracle_stub",
        "get_change_context",
        "validate_snapshot_contract",
    ]


def test_cursor_and_vscode_configs_are_valid_json():
    cursor_config = json.loads((ROOT / ".cursor" / "mcp.json").read_text(encoding="utf-8"))
    vscode_mcp = json.loads((ROOT / ".vscode" / "mcp.json").read_text(encoding="utf-8"))
    vscode_tasks = json.loads((ROOT / ".vscode" / "tasks.json").read_text(encoding="utf-8"))

    assert cursor_config["mcpServers"]["aalie"]["command"] == "python3"
    assert vscode_mcp["servers"]["aalie"]["command"] == "python3"
    assert vscode_tasks["tasks"][0]["label"] == "AALIE: Start MCP"


def test_skill_frontmatters_parse_cleanly_and_cover_all_expected_skills():
    skills_dir = ROOT / ".agent" / "skills"
    expected = {
        "change-core-analysis.md",
        "debug-while-analysis.md",
        "implement-export-feature.md",
        "add-recursive-method-support.md",
        "write-authentic-tests.md",
        "pre-change-review.md",
        "add-content-module.md",
        "introduce-llm-job.md",
    }

    assert {path.name for path in skills_dir.glob("*.md")} == expected

    for path in skills_dir.glob("*.md"):
        data = _frontmatter_data(path)
        for key in (
            "id",
            "title",
            "when_to_use",
            "required_docs",
            "recommended_tools",
            "output_checklist",
        ):
            assert key in data, f"{path.name} missing frontmatter key: {key}"


def test_cursor_rule_files_exist_with_expected_names():
    rules_dir = ROOT / ".cursor" / "rules"
    expected = {
        "aalie-core.mdc",
        "aalie-export.mdc",
        "aalie-testing.mdc",
        "aalie-while.mdc",
    }

    assert {path.name for path in rules_dir.glob("*.mdc")} == expected
