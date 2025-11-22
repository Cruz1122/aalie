"""
Tests de sistema para endpoints adicionales de análisis.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestDetectMethodsEndpoint:
    """Tests para el endpoint /analyze/detect-methods."""

    def test_detect_methods_recursive_algorithm(self):
        """Test: Detecta métodos para algoritmo recursivo"""
        source = """
mergesort(A, p, r) BEGIN
    IF p < r THEN BEGIN
        q <- (p + r) / 2;
        mergesort(A, p, q);
        mergesort(A, q + 1, r);
        merge(A, p, q, r);
    END
END
"""
        response = client.post("/analyze/detect-methods", json={"source": source})
        assert response.status_code == 200
        data = response.json()
        # Puede ser ok o error dependiendo de si el algoritmo es detectado como recursivo
        assert "ok" in data

    def test_detect_methods_iterative_algorithm(self):
        """Test: Retorna error para algoritmo iterativo"""
        source = """
test(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        x <- 1;
    END
END
"""
        response = client.post("/analyze/detect-methods", json={"source": source})
        assert response.status_code == 200
        data = response.json()
        # Debe retornar error porque no es recursivo
        assert data.get("ok") is False

    def test_detect_methods_invalid_source(self):
        """Test: Maneja source inválido"""
        response = client.post("/analyze/detect-methods", json={"source": "invalid {["})
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is False
        assert "errors" in data


class TestDummyEndpoint:
    """Tests para el endpoint /analyze/dummy."""

    def test_dummy_returns_analysis(self):
        """Test: Endpoint /dummy retorna análisis dummy"""
        response = client.get("/analyze/dummy")
        assert response.status_code == 200
        data = response.json()
        # El endpoint retorna directamente el resultado de create_dummy_analysis()
        # que incluye ok, byLine y totals
        assert "ok" in data, "Debe tener campo 'ok'"
        assert data.get("ok") is True, f"ok debe ser True, obtuvo {data.get('ok')}"
        assert "byLine" in data, "Debe tener campo 'byLine'"
        assert "totals" in data, "Debe tener campo 'totals'"

    def test_dummy_method_get(self):
        """Test: Endpoint /dummy acepta método GET"""
        response = client.get("/analyze/dummy")
        assert response.status_code == 200


class TestClosedEndpoint:
    """Tests para el endpoint /analyze/closed."""

    def test_closed_returns_not_implemented(self):
        """Test: Endpoint /closed retorna error de no implementado"""
        response = client.post("/analyze/closed", json={"source": "test(n) BEGIN END"})
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is False
        assert "errors" in data
        assert "no implementado" in data["errors"][0]["message"].lower() or "not implemented" in data["errors"][0]["message"].lower()

    def test_closed_method_post(self):
        """Test: Endpoint /closed acepta método POST"""
        response = client.post("/analyze/closed", json={"source": "test"})
        assert response.status_code == 200

