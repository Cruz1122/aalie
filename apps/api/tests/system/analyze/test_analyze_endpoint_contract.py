import pytest
from fastapi.testclient import TestClient

from app.main import app
from tests._support.assertions import notation_has_complexity

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


def test_analyze_open_reports_quadratic_insertion_sort():
    source = """insertionSort(arr, n) BEGIN
    FOR i <- 2 TO n DO BEGIN
        key <- arr[i];
        j <- i - 1;
        WHILE (j >= 1 AND arr[j] > key) DO BEGIN
            arr[j + 1] <- arr[j];
            j <- j - 1;
        END
        arr[j + 1] <- key;
    END
END
"""
    res = client.post("/analyze/open", json={"source": source, "mode": "worst"})
    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    notation = payload["totals"].get("big_theta", "") or payload["totals"].get("big_o", "")
    assert notation_has_complexity(notation, "quadratic")


def test_analyze_open_reports_logarithmic_multiplicative_while():
    source = """whileLoop(n) BEGIN
    i <- 1;
    WHILE (i <= n) DO BEGIN
        x <- 1;
        i <- i * 2;
    END
END
"""
    res = client.post("/analyze/open", json={"source": source, "mode": "worst"})
    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    notation = payload["totals"].get("big_theta", "") or payload["totals"].get("big_o", "")
    assert notation_has_complexity(notation, "log")


def test_analyze_open_surfaces_invalid_source_as_error_payload():
    res = client.post("/analyze/open", json={"source": "invalid code {", "mode": "worst"})
    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is False
    assert payload["errors"]
