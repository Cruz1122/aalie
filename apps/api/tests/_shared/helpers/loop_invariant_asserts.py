from __future__ import annotations

from typing import Any


def assert_loop_invariant_shape(payload: dict[str, Any]) -> None:
    assert "loopInvariant" in payload
    li = payload["loopInvariant"]
    for field in ("status", "reason", "selectedLoop", "invariant", "didacticSummary", "evidence"):
        assert field in li, f"Missing loopInvariant.{field}"
    assert "patternType" in li["selectedLoop"], "Missing loopInvariant.selectedLoop.patternType"
