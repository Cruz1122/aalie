from __future__ import annotations

from typing import Any


def assert_trace_shape(payload: dict[str, Any]) -> None:
    assert payload.get("ok") is True
    trace = payload.get("trace", {})
    assert isinstance(trace, dict), "trace must be a dict"
    assert "steps" in trace, "trace.steps is required"
