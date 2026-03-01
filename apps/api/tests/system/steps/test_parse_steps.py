# Steps y escenarios BDD para parse.feature
from pytest_bdd import scenario, when, then

FEATURE_DIR = "../features"
FEATURE = "parse.feature"

SOURCES = {
    "valid": "{ a <- 1; for i <- 1 to 3 do { A[i] <- i } }",
    "unclosed": "{ a <- 1 ",
}


@scenario(f"{FEATURE_DIR}/{FEATURE}", "Parsear codigo con asignacion y FOR")
def test_parse_assign_and_for():
    pass


@scenario(f"{FEATURE_DIR}/{FEATURE}", "Parsear codigo con bloque sin cerrar devuelve error")
def test_parse_unclosed_block():
    pass


@when('envio POST a "/grammar/parse" con source valido')
def post_parse_valid(client, response_ctx):
    response_ctx["response"] = client.post("/grammar/parse", json={"source": SOURCES["valid"]})


@when('envio POST a "/grammar/parse" con source invalido sin cerrar')
def post_parse_unclosed(client, response_ctx):
    response_ctx["response"] = client.post("/grammar/parse", json={"source": SOURCES["unclosed"]})


@then("la respuesta tiene \"ok\" False")
def response_ok_false(response_ctx):
    assert response_ctx["response"].json().get("ok") is False


@then("la respuesta tiene \"errors\" lista vacia")
def response_errors_empty(response_ctx):
    assert response_ctx["response"].json().get("errors") == []


@then("la respuesta tiene al menos un error")
def response_has_errors(response_ctx):
    assert len(response_ctx["response"].json().get("errors", [])) >= 1
