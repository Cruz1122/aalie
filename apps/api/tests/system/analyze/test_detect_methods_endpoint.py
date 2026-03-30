import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


def test_detect_methods_endpoint_returns_master_metadata_for_divide_and_conquer():
    source = """masterExample(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN masterExample(n / 2) + 1;
END
"""
    res = client.post("/analyze/detect-methods", json={"source": source})
    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    assert payload["default_method"] == "master"
    assert payload["applicable_methods"] == ["master", "recursion_tree", "iteration"]
    assert payload["recurrence_info"]["type"] == "divide_conquer"


def test_detect_methods_endpoint_rejects_iterative_source():
    source = """test(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        x <- 1;
    END
END
"""
    res = client.post("/analyze/detect-methods", json={"source": source})
    assert res.status_code == 200
    assert res.json() == {
        "ok": False,
        "errors": [
            {
                "message": "Este endpoint solo es para algoritmos recursivos",
                "line": None,
                "column": None,
            }
        ],
    }


def test_detect_methods_endpoint_surfaces_parse_errors():
    res = client.post("/analyze/detect-methods", json={"source": "invalid {["})
    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is False
    assert payload["errors"]


def test_detect_methods_endpoint_includes_dp_validation_metadata():
    source = """sparseRec(n) BEGIN
    IF (n <= 3) THEN BEGIN
        RETURN 1;
    END
    RETURN sparseRec(n - 1) + sparseRec(n - 4);
END
"""
    res = client.post(
        "/analyze/detect-methods",
        json={"source": source, "algorithm_kind": "recursive"},
    )
    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    dp_validation = payload["recurrence_info"]["dp_validation"]
    assert dp_validation["status"] == "clear"
    assert dp_validation["primary_pattern"] == "tabulation"
    assert dp_validation["supported_patterns"] == ["tabulation", "memoization"]
