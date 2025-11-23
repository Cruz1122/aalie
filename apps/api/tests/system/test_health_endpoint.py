"""
Tests de sistema para el endpoint /health.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Tests para el endpoint /health."""

    def test_health_returns_ok(self):
        """Test: Endpoint /health retorna status ok"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data == {"status": "ok"}

    def test_health_method_get(self):
        """Test: Endpoint /health acepta método GET"""
        response = client.get("/health")
        assert response.status_code == 200

    def test_health_method_post_not_allowed(self):
        """Test: Endpoint /health no acepta método POST"""
        response = client.post("/health")
        assert response.status_code == 405  # Method Not Allowed

