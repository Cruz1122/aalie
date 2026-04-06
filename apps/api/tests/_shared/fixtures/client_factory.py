from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app


def build_test_client() -> TestClient:
    return TestClient(create_app())
