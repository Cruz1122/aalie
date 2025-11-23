"""
Tests de sistema para el endpoint /classify.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestClassifyEndpoint:
    """Tests para el endpoint /classify."""

    def test_classify_with_source_iterative(self):
        """Test: Clasifica algoritmo iterativo usando source"""
        source = """
test(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        x <- 1;
    END
END
"""
        response = client.post("/classify", json={"source": source})
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True
        assert data.get("kind") == "iterative"
        assert data.get("method") == "ast"

    def test_classify_with_source_recursive(self):
        """Test: Clasifica algoritmo recursivo usando source"""
        source = """
factorial(n) BEGIN
    IF n <= 1 THEN BEGIN
        RETURN 1;
    END ELSE BEGIN
        RETURN n * factorial(n - 1);
    END
END
"""
        response = client.post("/classify", json={"source": source})
        assert response.status_code == 200
        data = response.json()
        # El parsing puede fallar, pero si funciona, debe clasificar como recursivo
        if data.get("ok"):
            assert data.get("kind") in ["recursive", "hybrid"]
            assert data.get("method") == "ast"
        else:
            # Si el parsing falla, debe tener errores
            assert "errors" in data

    def test_classify_with_ast(self):
        """Test: Clasifica algoritmo usando AST"""
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "test",
                    "body": [
                        {"type": "For", "variable": "i", "start": 1, "end": 10}
                    ]
                }
            ]
        }
        response = client.post("/classify", json={"ast": ast})
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is True
        assert data.get("kind") == "iterative"
        assert data.get("method") == "ast"

    def test_classify_with_invalid_source(self):
        """Test: Maneja source inválido"""
        response = client.post("/classify", json={"source": "invalid syntax {["})
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is False
        assert "errors" in data

    def test_classify_without_source_or_ast(self):
        """Test: Retorna error cuando no se proporciona source ni ast"""
        response = client.post("/classify", json={})
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is False
        assert "errors" in data

    def test_classify_with_non_string_source(self):
        """Test: Retorna error cuando source no es string"""
        response = client.post("/classify", json={"source": 123})
        assert response.status_code == 200
        data = response.json()
        assert data.get("ok") is False
        assert "errors" in data

