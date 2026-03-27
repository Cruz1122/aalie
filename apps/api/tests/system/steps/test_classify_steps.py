# Steps y escenarios BDD para classify.feature
from pytest_bdd import scenario, then, when

FEATURE_DIR = "../features"
FEATURE = "classify.feature"

FOR_SIMPLE = """
test(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        x <- 1;
    END
END
"""
FACTORIAL_REC = """
factorial(n) BEGIN
    IF n <= 1 THEN BEGIN
        RETURN 1;
    END ELSE BEGIN
        RETURN n * factorial(n - 1);
    END
END
"""


@scenario(f"{FEATURE_DIR}/{FEATURE}", "Clasificar algoritmo iterativo por source")
def test_classify_iterative():
    pass


@scenario(f"{FEATURE_DIR}/{FEATURE}", "Clasificar algoritmo recursivo por source")
def test_classify_recursive():
    pass


@when("envio POST a \"/classify\" con body source con FOR simple")
def post_classify_for(client, response_ctx):
    response_ctx["response"] = client.post("/classify", json={"source": FOR_SIMPLE})


@when("envio POST a \"/classify\" con body source con factorial recursivo")
def post_classify_factorial(client, response_ctx):
    response_ctx["response"] = client.post("/classify", json={"source": FACTORIAL_REC})


@then('la respuesta tiene kind "iterative"')
def response_kind_iterative(response_ctx):
    assert response_ctx["response"].json().get("kind") == "iterative"


@then("si ok entonces kind es recursive o hybrid")
def response_ok_then_kind(response_ctx):
    data = response_ctx["response"].json()
    if data.get("ok"):
        assert data.get("kind") in ["recursive", "hybrid"]
