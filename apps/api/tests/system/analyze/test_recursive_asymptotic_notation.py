"""Regression tests for recursive asymptotic notation consistency."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def _extract_totals(payload: dict) -> dict:
    """Support both single-case and all-cases responses."""
    if "worst" in payload and isinstance(payload.get("worst"), dict):
        return payload["worst"].get("totals", {})
    return payload.get("totals", {})


def test_recursive_recommended_method_uses_asymptotic_notation():
    source = """binarySearchRec(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    medio <- (inicio + fin) DIV 2;
    IF (A[medio] = x) THEN BEGIN
        RETURN medio;
    END
    IF (x < A[medio]) THEN BEGIN
        RETURN binarySearchRec(A, x, inicio, medio - 1);
    END
    RETURN binarySearchRec(A, x, medio + 1, fin);
END"""

    response = client.post(
        "/analyze/open",
        json={
            "source": source,
            "mode": "all",
            "algorithm_kind": "recursive",
            "preferred_method": "master",
            "locale": "es",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload.get("ok") is True

    totals = _extract_totals(payload)
    t_open = str(totals.get("T_open") or "")

    assert t_open.startswith("\\Theta(") or t_open.startswith("O(") or t_open.startswith("\\Omega(")
    assert totals.get("big_theta") is not None
    assert totals.get("big_o") is not None
    assert totals.get("big_omega") is not None


def test_recursive_non_recommended_method_uses_bound_notation():
    source = """fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN fibonacci(n - 1) + fibonacci(n - 2);
END"""

    response = client.post(
        "/analyze/open",
        json={
            "source": source,
            "mode": "all",
            "algorithm_kind": "recursive",
            "preferred_method": "recursion_tree",
            "locale": "es",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload.get("ok") is True

    totals = _extract_totals(payload)
    t_open = str(totals.get("T_open") or "")

    # For upper-bound methods, output must be explicit Big-O (never bare algebra like n^2)
    assert t_open.startswith("O(")
    assert totals.get("big_o") is not None
    assert totals.get("big_theta") is None
