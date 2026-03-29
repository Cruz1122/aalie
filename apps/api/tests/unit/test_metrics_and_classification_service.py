from app.modules.classification import service as classification_service
from app.modules.execution.metrics_aggregator import aggregate_metrics


def test_aggregate_metrics_handles_cycles_and_missing_data():
    steps = [
        {"recursion": {"callId": "A"}, "tokens": 2, "microseconds": 1.5},
        {"recursion": {"callId": "B"}, "tokens": 3, "microseconds": 2.5},
        {"recursion": {"callId": "A"}, "tokens": 1, "microseconds": 0.5},
        {"recursion": {}, "tokens": 10, "microseconds": 10.0},
    ]
    calls = [
        {"id": "A", "children": ["B", "A"]},
        {"id": "B", "children": []},
    ]

    out = aggregate_metrics(steps, calls)

    assert out["A"]["tokens"] == 3
    assert out["A"]["microseconds"] == 2.0
    assert out["B"]["tokens"] == 3
    assert out["A"]["aggregateTokens"] == 6
    assert out["A"]["aggregateMicroseconds"] == 4.5


def test_classify_algorithm_ast_source_errors_and_exception(monkeypatch):
    monkeypatch.setattr(
        classification_service, "detect_algorithm_kind", lambda ast: "iterative"
    )

    by_ast = classification_service.classify_algorithm(ast={"type": "Program"})
    assert by_ast == {"ok": True, "kind": "iterative", "method": "ast"}

    monkeypatch.setattr(
        classification_service,
        "parse_source",
        lambda source: {"ok": True, "ast": {"type": "Program"}},
    )
    by_source = classification_service.classify_algorithm(source="algo")
    assert by_source["ok"] is True
    assert by_source["kind"] == "iterative"

    bad_source_type = classification_service.classify_algorithm(source=123)
    assert bad_source_type["ok"] is False

    parse_error = classification_service.classify_algorithm(source="bad")
    assert parse_error["ok"] is True

    monkeypatch.setattr(
        classification_service,
        "parse_source",
        lambda source: {"ok": False, "errors": [{"message": "parse"}]},
    )
    parse_fail = classification_service.classify_algorithm(source="bad")
    assert parse_fail["ok"] is False
    assert parse_fail["errors"][0]["message"] == "parse"

    monkeypatch.setattr(
        classification_service, "parse_source", lambda source: {"ok": True, "ast": None}
    )
    no_ast = classification_service.classify_algorithm(source="bad")
    assert no_ast["ok"] is False

    monkeypatch.setattr(
        classification_service,
        "detect_algorithm_kind",
        lambda ast: (_ for _ in ()).throw(RuntimeError("boom")),
    )
    crash = classification_service.classify_algorithm(ast={"type": "Program"})
    assert crash["ok"] is False
    assert "Error en clasificación" in crash["errors"][0]["message"]

    missing = classification_service.classify_algorithm()
    assert missing["ok"] is False
