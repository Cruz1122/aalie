"""
Tests de sistema para el endpoint /analyze/trace.

Valida estructura de respuesta, algorithmKind, recursionTree cuando aplica,
y coherencia de steps con el pseudocódigo.

Author: AALIE
Version: 0.1.0
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@pytest.mark.system
class TestTraceEndpoint:
    """Tests para el endpoint POST /analyze/trace."""

    def test_trace_factorial_recursive(self):
        """Factorial recursivo: algoritmo recursivo con recursionTree."""
        source = """
fact(n) BEGIN
    IF n <= 1 THEN
        RETURN 1;
    RETURN n * fact(n - 1);
END
"""
        response = client.post(
            "/analyze/trace",
            json={"source": source, "case": "worst", "input_size": 4},
        )
        assert response.status_code == 200
        data = response.json()
        assert "ok" in data
        if data.get("ok"):
            assert "algorithmKind" in data
            assert data["algorithmKind"] in ("recursive", "hybrid", "iterative")
            if data.get("trace"):
                assert "steps" in data["trace"]
                if data["algorithmKind"] in ("recursive", "hybrid"):
                    assert "recursionTree" in data["trace"]
                    rt = data["trace"]["recursionTree"]
                    assert "calls" in rt
                    assert "root_calls" in rt

    def test_trace_with_structured_trace_deterministic(self):
        """El backend devuelve derived.structuredTrace con graph y patternKind."""
        source = """
binarySearch(A, low, high, x) BEGIN
    IF (low > high) THEN BEGIN
        RETURN -1;
    END;
    mid <- (low + high) / 2;
    IF (A[mid] = x) THEN BEGIN
        RETURN mid;
    END;
    IF (A[mid] > x) THEN BEGIN
        RETURN binarySearch(A, low, mid - 1, x);
    END ELSE BEGIN
        RETURN binarySearch(A, mid + 1, high, x);
    END;
END
"""
        response = client.post(
            "/analyze/trace",
            json={
                "source": source,
                "case": "worst",
                "input_size": 8,
                "initial_variables": {"A": [1, 2, 3, 4, 5, 6, 7, 8], "x": 9},
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True
        derived = data.get("derived", {})
        assert "structuredTrace" in derived
        st = derived["structuredTrace"]
        assert "graph" in st
        assert "patternKind" in st
        assert "classification" in st
        assert "nodes" in st["graph"]
        assert len(st["graph"]["nodes"]) > 0

    def test_trace_binary_search_recursive(self):
        """Búsqueda binaria recursiva."""
        source = """
binarySearch(A, low, high, x) BEGIN
    IF low > high THEN
        RETURN -1;
    mid <- (low + high) / 2;
    IF A[mid] = x THEN
        RETURN mid;
    IF A[mid] > x THEN
        RETURN binarySearch(A, low, mid - 1, x);
    RETURN binarySearch(A, mid + 1, high, x);
END
"""
        response = client.post(
            "/analyze/trace",
            json={"source": source, "case": "worst", "input_size": 8},
        )
        assert response.status_code == 200
        data = response.json()
        assert "ok" in data
        if data.get("ok"):
            assert "algorithmKind" in data
            assert "trace" in data
            if data.get("trace", {}).get("steps"):
                steps = data["trace"]["steps"]
                assert len(steps) > 0
                for s in steps:
                    assert "step_number" in s
                    assert "line" in s
                    assert "kind" in s
                    assert "variables" in s

    def test_trace_fibonacci_recursive(self):
        """Fibonacci recursivo: árbol exponencial."""
        source = """
fib(n) BEGIN
    IF n <= 1 THEN
        RETURN n;
    RETURN fib(n - 1) + fib(n - 2);
END
"""
        response = client.post(
            "/analyze/trace",
            json={"source": source, "case": "worst", "input_size": 4},
        )
        assert response.status_code == 200
        data = response.json()
        assert "ok" in data
        if data.get("ok"):
            assert "algorithmKind" in data
            if data.get("trace", {}).get("recursionTree"):
                rt = data["trace"]["recursionTree"]
                assert "calls" in rt
                assert len(rt["calls"]) > 0

    def test_trace_buscar_lista_linked_list(self):
        """buscarLista con lista enlazada: A y x se mapean a nodo y valor."""
        source = """
buscarLista(nodo, valor) BEGIN
    IF (nodo = null) THEN BEGIN
        RETURN false;
    END
    IF (nodo.valor = valor) THEN BEGIN
        RETURN true;
    END
    ELSE BEGIN
        RETURN buscarLista(nodo.siguiente, valor);
    END
END
"""
        response = client.post(
            "/analyze/trace",
            json={
                "source": source,
                "case": "worst",
                "input_size": 4,
                "initial_variables": {"A": [1, 2, 3, 4], "x": 4},
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True
        assert data.get("algorithmKind") in ("recursive", "hybrid")
        assert "recursionTree" in data.get("trace", {})
        rt = data["trace"]["recursionTree"]
        assert len(rt.get("calls", [])) > 0
        st = data.get("derived", {}).get("structuredTrace", {})
        assert "graph" in st
        assert len(st["graph"]["nodes"]) > 0

    def test_trace_iterative_algorithm(self):
        """Algoritmo iterativo: búsqueda lineal."""
        source = """
linearSearch(A, n, x) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF A[i] = x THEN
            RETURN i;
    END;
    RETURN -1;
END
"""
        response = client.post(
            "/analyze/trace",
            json={
                "source": source,
                "case": "worst",
                "input_size": 5,
                "initial_variables": {"A": [1, 2, 3, 4, 5], "x": 5},
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "ok" in data
        if data.get("ok"):
            assert data.get("algorithmKind") in ("iterative", "recursive", "hybrid")
            if data.get("trace", {}).get("steps"):
                steps = data["trace"]["steps"]
                assert len(steps) > 0
                assert all("line" in s for s in steps)

    def test_trace_euclides_without_initial_variables(self):
        """Euclides con input_size (sin initial_variables) no debe truncarse por loop infinito simbólico."""
        source = """
mcd(a, b) BEGIN
    WHILE (b != 0) DO BEGIN
        temp <- b;
        b <- a MOD b;
        a <- temp;
    END
    RETURN a;
END
"""
        response = client.post(
            "/analyze/trace",
            json={"source": source, "case": "worst", "input_size": 24},
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True
        steps = data.get("trace", {}).get("steps", [])
        assert len(steps) > 0
        assert not any((s.get("iteration") or {}).get("truncated") for s in steps)

    def test_trace_invalid_source(self):
        """Source inválido retorna error."""
        response = client.post(
            "/analyze/trace",
            json={"source": "invalid {[", "case": "worst"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is False
        assert "errors" in data

    def test_trace_missing_source(self):
        """Falta source: 422."""
        response = client.post("/analyze/trace", json={"case": "worst"})
        assert response.status_code == 422

    def test_trace_canonical_structure(self):
        """Valida contrato canónico: kind, summary, diagnostics en trace."""
        source = """
fact(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END;
    RETURN n * fact(n - 1);
END
"""
        response = client.post(
            "/analyze/trace",
            json={"source": source, "case": "worst", "input_size": 3},
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True
        trace = data.get("trace", {})
        assert "kind" in trace
        assert trace["kind"] in ("iterative", "recursive", "hybrid", "unknown")
        assert "summary" in trace
        summary = trace["summary"]
        assert "totalSteps" in summary
        assert "totalCalls" in summary
        assert "maxRecursionDepth" in summary
        assert "algorithmKind" in summary
        assert "diagnostics" in trace
        diag = trace["diagnostics"]
        assert "truncated" in diag
        assert "warnings" in diag
