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

    def test_detect_methods_includes_dp_validation_metadata(self):
        """Test: El endpoint incluye metadata de validación de DP cuando aplica."""
        source = """
sparseRec(n) BEGIN
    IF (n <= 3) THEN BEGIN
        RETURN 1;
    END
    RETURN sparseRec(n - 1) + sparseRec(n - 4);
END
"""
        response = client.post(
            "/analyze/detect-methods",
            json={"source": source, "algorithm_kind": "recursive"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True
        assert data.get("recurrence_info", {}).get("dp_validation", {}).get("primary_pattern") == "tabulation"


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

    def test_open_endpoint_invalid_payload(self):
        """Test: Endpoint /open maneja payload inválido"""
        response = client.post("/analyze/open", json={})
        assert response.status_code == 422  # Validation error

    def test_open_endpoint_with_avg_model(self):
        """Test: Endpoint /open con avgModel configurado"""
        source = """
test(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF i > n/2 THEN BEGIN
            RETURN 1;
        END
    END
END
"""
        payload = {
            "source": source,
            "mode": "avg",
            "avgModel": {
                "mode": "uniform",
                "predicates": {}
            }
        }
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "ok" in data

    def test_open_endpoint_with_preferred_method(self):
        """Test: Endpoint /open con preferred_method"""
        source = """
factorial(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN n * factorial(n - 1);
END
"""
        payload = {
            "source": source,
            "mode": "worst",
            "preferred_method": "iteration"
        }
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "ok" in data

    def test_open_endpoint_characteristic_step_bundle_contract(self):
        """Test: /open devuelve step_by_step tipado (12 pasos) para ecuación característica."""
        source = """
dobleConstante(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN dobleConstante(n - 1) + dobleConstante(n - 1) + 1;
END
"""
        payload = {
            "source": source,
            "mode": "worst",
            "preferred_method": "characteristic_equation",
            "locale": "es",
        }
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True

        char_eq = data.get("totals", {}).get("characteristic_equation", {})
        step_bundle = char_eq.get("step_by_step")
        assert isinstance(step_bundle, dict)
        assert step_bundle.get("method") == "characteristic_equation"
        assert step_bundle.get("version") == "ceq_steps_v1"
        assert step_bundle.get("overallStatus") in {"complete", "partial", "unsupported", "error"}

        steps = step_bundle.get("steps", [])
        assert isinstance(steps, list)
        assert len(steps) == 12

        required_fields = {
            "id",
            "kind",
            "title",
            "status",
            "math",
            "summary",
            "teachingNote",
            "warning",
            "confidence",
            "payload",
            "conceptNote",
        }
        valid_status = {"complete", "partial", "unsupported", "error"}
        for index, step in enumerate(steps, start=1):
            assert required_fields.issubset(step.keys())
            assert step.get("index") == index
            assert step.get("status") in valid_status
            assert isinstance(step.get("math"), dict)
            assert isinstance(step.get("payload"), dict)

    def test_open_endpoint_iteration_step_bundle_contract(self):
        """Test: /open devuelve step_by_step tipado (11 pasos) para método de iteración."""
        source = """
factorial(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN n * factorial(n - 1);
END
"""
        payload = {
            "source": source,
            "mode": "worst",
            "preferred_method": "iteration",
            "locale": "es",
        }
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True

        iteration = data.get("totals", {}).get("iteration", {})
        step_bundle = iteration.get("step_by_step")
        assert isinstance(step_bundle, dict)
        assert step_bundle.get("method") == "iteration"
        assert step_bundle.get("version") == "iter_steps_v1"
        assert step_bundle.get("overallStatus") in {"complete", "partial", "unsupported", "error"}

        steps = step_bundle.get("steps", [])
        assert isinstance(steps, list)
        assert len(steps) == 11

        required_fields = {
            "id",
            "kind",
            "title",
            "status",
            "math",
            "summary",
            "teachingNote",
            "warning",
            "confidence",
            "payload",
            "conceptNote",
        }
        valid_status = {"complete", "partial", "unsupported", "error"}
        for index, step in enumerate(steps, start=1):
            assert required_fields.issubset(step.keys())
            assert step.get("index") == index
            assert step.get("status") in valid_status
            assert isinstance(step.get("math"), dict)
            assert isinstance(step.get("payload"), dict)

    def test_open_endpoint_master_step_bundle_contract(self):
        """Test: /open devuelve step_by_step tipado (10 pasos) para Teorema Maestro."""
        source = """
masterExample(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN masterExample(n / 2) + 1;
END
"""
        payload = {
            "source": source,
            "mode": "worst",
            "preferred_method": "master",
            "locale": "es",
        }
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True

        master = data.get("totals", {}).get("master", {})
        step_bundle = master.get("step_by_step")
        assert isinstance(step_bundle, dict)
        assert step_bundle.get("method") == "master"
        assert step_bundle.get("version") == "master_steps_v1"
        assert step_bundle.get("overallStatus") in {"complete", "partial", "unsupported", "error"}

        steps = step_bundle.get("steps", [])
        assert isinstance(steps, list)
        assert len(steps) == 10
        assert steps[0]["kind"] == "recurrence_detected"
        assert steps[9]["kind"] == "asymptotic_conclusion"

    def test_open_endpoint_with_algorithm_kind(self):
        """Test: Endpoint /open con algorithm_kind"""
        source = """
test(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        x <- 1;
    END
END
"""
        payload = {
            "source": source,
            "mode": "worst",
            "algorithm_kind": "iterative"
        }
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "ok" in data

    def test_open_endpoint_mode_all(self):
        """Test: Endpoint /open con mode=all"""
        source = """
test(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        x <- 1;
    END
END
"""
        payload = {
            "source": source,
            "mode": "all"
        }
        response = client.post("/analyze/open", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "ok" in data

    def test_detect_methods_empty_source(self):
        """Test: detect-methods con source vacío"""
        response = client.post("/analyze/detect-methods", json={"source": ""})
        assert response.status_code == 200
        data = response.json()
        assert "ok" in data

    def test_detect_methods_with_algorithm_kind(self):
        """Test: detect-methods con algorithm_kind"""
        source = """
factorial(n) BEGIN
    IF n <= 1 THEN BEGIN
        RETURN 1;
    END
    RETURN n * factorial(n - 1);
END
"""
        payload = {
            "source": source,
            "algorithm_kind": "recursive"
        }
        response = client.post("/analyze/detect-methods", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert "ok" in data
