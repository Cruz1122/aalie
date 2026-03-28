from __future__ import annotations

from copy import deepcopy

from app.modules.export.snapshot_builder import build_export_state, build_snapshot
from tools.validate_snapshot_contract import validate_snapshot_contract


def _base_payload() -> dict:
    return {
        "source": "sumatoria(n) BEGIN RETURN n; END",
        "formats": ["markdown"],
        "locale": "es",
        "cachedParse": {
            "ok": True,
            "available": True,
            "runtime": "python",
            "error": None,
            "ast": {"type": "Program", "body": []},
            "errors": [],
        },
        "cachedClassify": {"ok": True, "kind": "iterative", "method": "ast"},
        "cachedAnalyze": {
            "ok": True,
            "has_case_variability": False,
            "worst": {
                "ok": True,
                "byLine": [],
                "totals": {
                    "T_open": "1",
                    "T_polynomial": "1",
                    "big_o": "O(1)",
                    "big_omega": "\\Omega(1)",
                    "big_theta": "\\Theta(1)",
                    "procedure": [],
                    "notes": [],
                },
            },
            "best": "same_as_worst",
            "avg": "same_as_worst",
        },
        "cachedTraceByCase": {"worst": {"ok": True, "trace": {"steps": []}}},
    }


def _valid_snapshot() -> dict:
    state = build_export_state(_base_payload())
    return build_snapshot(state["snapshotInput"], state["options"])


def _error_codes(result: dict) -> set[str]:
    return {error["code"] for error in result["errors"]}


def test_validate_snapshot_contract_accepts_valid_snapshot_fixture():
    result = validate_snapshot_contract(snapshot=_valid_snapshot())

    assert result["valid"] is True
    assert result["errors"] == []


def test_validate_snapshot_contract_rejects_wrong_schema_version():
    snapshot = _valid_snapshot()
    snapshot["schemaVersion"] = "9.9.9"

    result = validate_snapshot_contract(snapshot=snapshot)

    assert result["valid"] is False
    assert "schema_version_mismatch" in _error_codes(result)


def test_validate_snapshot_contract_rejects_missing_required_root_field():
    snapshot = _valid_snapshot()
    snapshot.pop("globalResult")

    result = validate_snapshot_contract(snapshot=snapshot)

    assert result["valid"] is False
    assert "missing_root_fields" in _error_codes(result)


def test_validate_snapshot_contract_rejects_public_section_contradiction():
    snapshot = _valid_snapshot()
    snapshot["recursive"] = {
        "status": "available",
        "data": {
            "recurrence": {
                "status": "available",
                "data": {"type": "linear_shift", "form": "T(n)=T(n-1)+1"},
            },
            "methodsAvailable": {
                "status": "available",
                "data": ["iteration"],
            },
        },
    }

    result = validate_snapshot_contract(snapshot=snapshot)

    assert result["valid"] is False
    assert "iterative_recursive_contradiction" in _error_codes(result)


def test_validate_snapshot_contract_rejects_internal_only_recursive_contract():
    snapshot = deepcopy(_valid_snapshot())
    snapshot["algorithmType"] = "recursive"
    snapshot["recursive"] = {"status": "not_supported"}
    snapshot["internal"]["recurrence"] = {
        "status": "available",
        "data": {"type": "linear_shift", "form": "T(n)=T(n-1)+1"},
    }

    result = validate_snapshot_contract(snapshot=snapshot)

    assert result["valid"] is False
    assert "public_contract_hidden_in_internal" in _error_codes(result)
