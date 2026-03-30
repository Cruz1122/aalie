from __future__ import annotations

from typing import Any


def assert_contract_shape(payload: dict[str, Any], required_top_level: set[str]) -> None:
    missing = required_top_level - set(payload.keys())
    assert not missing, f"Missing contract fields: {sorted(missing)}"


def assert_case_shape(case_payload: dict[str, Any]) -> None:
    assert "totals" in case_payload, "Missing totals in case payload"
    assert isinstance(case_payload.get("totals"), dict), "totals must be a dict"
