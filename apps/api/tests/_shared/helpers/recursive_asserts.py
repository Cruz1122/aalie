from __future__ import annotations

from typing import Any


def assert_recursive_bundle_shape(result: dict[str, Any], method: str) -> None:
    totals = result.get("totals", {})
    method_payload = totals.get(method, {})
    assert isinstance(method_payload, dict), f"Missing method payload: {method}"
    bundle = method_payload.get("step_by_step", {})
    assert isinstance(bundle, dict), "step_by_step must be a dict"
    assert isinstance(bundle.get("steps"), list), "step_by_step.steps must be a list"
