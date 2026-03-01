# Steps y escenarios BDD para analyze_open.feature
from pytest_bdd import scenario, when, then

FEATURE_DIR = "../features"
FEATURE = "analyze_open.feature"

FOR_SIMPLE = """
test(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        x <- 1;
    END
END
"""
WHILE_LINEAR = """
linear(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    x <- 1;
    i <- i + 1;
  END
END
"""


@scenario(f"{FEATURE_DIR}/{FEATURE}", "Analizar bucle iterativo simple")
def test_analyze_simple_for():
    pass


@scenario(f"{FEATURE_DIR}/{FEATURE}", "Analizar algoritmo con WHILE")
def test_analyze_while():
    pass


@scenario(f"{FEATURE_DIR}/{FEATURE}", "Payload invalido devuelve error")
def test_analyze_invalid_payload():
    pass


@when('envio POST a "/analyze/open" con source bucle FOR simple y mode "worst"')
def post_analyze_for(client, response_ctx):
    response_ctx["response"] = client.post(
        "/analyze/open", json={"source": FOR_SIMPLE, "mode": "worst"}
    )


@when('envio POST a "/analyze/open" con source WHILE lineal y mode "worst"')
def post_analyze_while(client, response_ctx):
    response_ctx["response"] = client.post(
        "/analyze/open", json={"source": WHILE_LINEAR, "mode": "worst"}
    )


@when('envio POST a "/analyze/open" con body invalido')
def post_analyze_invalid(client, response_ctx):
    response_ctx["response"] = client.post("/analyze/open", json={})


@then("el analisis es exitoso")
def analysis_ok(response_ctx):
    data = response_ctx["response"].json()
    assert data.get("ok") is True, data.get("errors", data)


@then("la respuesta tiene byLine no vacio")
def response_has_byline(response_ctx):
    data = response_ctx["response"].json()
    by_line = data.get("byLine", data.get("worst", {}).get("byLine", []))
    assert isinstance(by_line, list) and len(by_line) > 0


