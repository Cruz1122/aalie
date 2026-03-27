# Fixtures y steps compartidos para BDD (TestClient, respuesta, codigos).
import pytest
from fastapi.testclient import TestClient
from pytest_bdd import then

from app.main import app


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def response_ctx():
    """Contexto para guardar la ultima respuesta HTTP entre steps."""
    return {}


# Steps compartidos (Then) para todos los features
@then("el codigo de respuesta es 200")
def status_200(response_ctx):
    assert response_ctx["response"].status_code == 200


@then("el codigo de respuesta es 405")
def status_405(response_ctx):
    assert response_ctx["response"].status_code == 405


@then("el codigo de respuesta es 422")
def status_422(response_ctx):
    assert response_ctx["response"].status_code == 422


@then("responde ok True")
def response_ok_true(response_ctx):
    assert response_ctx["response"].json().get("ok") is True
