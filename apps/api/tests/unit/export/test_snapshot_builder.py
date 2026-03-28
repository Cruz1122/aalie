from app.modules.export.snapshot_builder import build_export_state


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


def test_build_export_state_generates_deterministic_metadata():
    payload = _base_payload()

    state_a = build_export_state(payload)
    state_b = build_export_state(
        {**payload, "requestOrigin": "https://frontend.example"}
    )

    assert (
        state_a["snapshotInput"]["analysisId"] == state_b["snapshotInput"]["analysisId"]
    )
    assert (
        state_a["snapshotInput"]["snapshotId"] == state_b["snapshotInput"]["snapshotId"]
    )
    assert (
        state_a["snapshotInput"]["createdAt"] == state_b["snapshotInput"]["createdAt"]
    )


def test_build_export_state_normalizes_formats_and_defaults():
    payload = _base_payload()
    payload["formats"] = ["markdown", "pdf", "markdown", "other"]

    state = build_export_state(payload)

    assert state["render"]["formats"] == ["markdown", "pdf"]
    assert state["options"]["includeGpuCpu"] is True
