# Steps y escenarios BDD para health.feature
import pytest
from pytest_bdd import scenario, when, then

FEATURE_DIR = "../features"

FEATURE = "health.feature"


@scenario(f"{FEATURE_DIR}/{FEATURE}", "GET /health responde ok")
def test_health_returns_ok():
    pass


@scenario(f"{FEATURE_DIR}/{FEATURE}", "POST /health no permitido")
def test_health_post_not_allowed():
    pass


@when('envio GET a "/health"')
def send_get_health(client, response_ctx):
    response_ctx["response"] = client.get("/health")


@when('envio POST a "/health"')
def send_post_health(client, response_ctx):
    response_ctx["response"] = client.post("/health")


@then('el cuerpo contiene status "ok"')
def body_status_ok(response_ctx):
    data = response_ctx["response"].json()
    assert data.get("status") == "ok"
