from tools.check_contract_impact import check_contract_impact
from tools.get_change_context import get_change_context


def test_get_change_context_for_while_path_prefers_while_area():
    result = get_change_context(
        path="apps/api/app/modules/analysis/while_engine/engine.py"
    )

    assert result["ok"] is True
    assert result["area"] == "while_engine"
    assert result["risk"] == "high"
    assert "docs/03-specs/while-heuristics-spec.md" in result["required_docs"]
    assert result["recommended_skill"] == "debug-while-analysis"


def test_get_change_context_for_export_feature_resolves_snapshot_area():
    result = get_change_context(feature="export pdf")

    assert result["ok"] is True
    assert result["area"] == "export_snapshot"
    assert "docs/03-specs/report-snapshot-spec.md" in result["required_docs"]
    assert "apps/api/tests/system/test_export_endpoint.py" in result["related_tests"]


def test_check_contract_impact_merges_export_contracts_without_duplicates():
    result = check_contract_impact(
        [
            "apps/api/app/modules/export/engine.py",
            "packages/types/src/export-snapshot.ts",
        ]
    )

    assert result["ok"] is True
    assert result["areas"] == ["export_snapshot"]
    assert result["risk"] == "high"
    assert (
        "docs/09-decisions/adr-002-single-snapshot-for-exports.md"
        in result["contracts_impacted"]
    )
    assert "single-snapshot source of truth" in result["must_review"]
    assert (
        "apps/api/tests/unit/export/test_snapshot_builder.py" in result["tests_to_run"]
    )
