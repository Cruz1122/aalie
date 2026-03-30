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


def test_detect_methods_endpoint_supports_index_bound_reduction_iteration_method():
    source = """linearSearchRec(A[n], x, i, n) BEGIN
    IF (i > n) THEN BEGIN
        RETURN -1;
    END
    IF (A[i] = x) THEN BEGIN
        RETURN i;
    END
    RETURN linearSearchRec(A, x, i + 1, n);
END
"""
    res = client.post(
        "/analyze/detect-methods",
        json={"source": source, "algorithm_kind": "recursive"},
    )
    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    assert payload["default_method"] in payload["applicable_methods"]
    assert "iteration" in payload["applicable_methods"]
    assert payload["recurrence_info"]["type"] == "linear_shift"


def test_detect_methods_endpoint_does_not_crash_on_auxiliary_recursive_procedures():
    source = """bitonicSort(A[n], inicio, fin, ascendente) BEGIN
    IF (fin - inicio <= 0) THEN BEGIN
        RETURN 0;
    END
    medio <- (inicio + fin) DIV 2;
    CALL bitonicSort(A, inicio, medio, true);
    CALL bitonicSort(A, medio + 1, fin, false);
    CALL bitonicMerge(A, inicio, fin, ascendente);
    RETURN 0;
END

bitonicMerge(A[n], inicio, fin, ascendente) BEGIN
    IF (fin - inicio <= 0) THEN BEGIN
        RETURN 0;
    END
    medio <- (inicio + fin) DIV 2;
    i <- inicio;
    WHILE (i <= medio) DO BEGIN
        CALL compareAndSwap(A, i, i + (medio - inicio + 1), ascendente);
        i <- i + 1;
    END
    CALL bitonicMerge(A, inicio, medio, ascendente);
    CALL bitonicMerge(A, medio + 1, fin, ascendente);
    RETURN 0;
END

compareAndSwap(A[n], i, j, ascendente) BEGIN
    temp <- 0;
    IF (ascendente = true) THEN BEGIN
        IF (A[i] > A[j]) THEN BEGIN
            temp <- A[i];
            A[i] <- A[j];
            A[j] <- temp;
        END
    END
    ELSE BEGIN
        IF (A[i] < A[j]) THEN BEGIN
            temp <- A[i];
            A[i] <- A[j];
            A[j] <- temp;
        END
    END
    RETURN 0;
END
"""
    res = client.post(
        "/analyze/detect-methods",
        json={"source": source, "algorithm_kind": "recursive"},
    )
    assert res.status_code == 200
    payload = res.json()
    assert payload["ok"] is True
    assert payload["applicable_methods"]
