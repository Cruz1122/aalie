"""
Tests para los modelos Pydantic (schemas) de los modulos classification y parsing.

Author: Tests generados para aumentar cobertura de codigo
"""
from pydantic import ValidationError
from app.modules.classification.schemas import ClassifyRequest, ClassifyResponse
from app.modules.parsing.schemas import ParseRequest, ParseResponse


class TestClassifyRequest:
    """Tests para ClassifyRequest schema."""

    def test_classify_request_with_source(self):
        request = ClassifyRequest(source="factorial(n) BEGIN RETURN 1; END")
        assert request.source == "factorial(n) BEGIN RETURN 1; END"
        assert request.ast is None

    def test_classify_request_with_ast(self):
        ast = {"type": "Program", "body": [{"type": "ProcDef", "name": "factorial"}]}
        request = ClassifyRequest(ast=ast)
        assert request.ast == ast
        assert request.source is None

    def test_classify_request_with_both(self):
        ast = {"type": "Program", "body": []}
        request = ClassifyRequest(source="test() BEGIN RETURN 1; END", ast=ast)
        assert request.source == "test() BEGIN RETURN 1; END"
        assert request.ast == ast

    def test_classify_request_with_none(self):
        request = ClassifyRequest()
        assert request.source is None
        assert request.ast is None

    def test_classify_request_serialization(self):
        request = ClassifyRequest(source="test() BEGIN RETURN 1; END")
        data = request.model_dump()
        assert "source" in data
        assert data["source"] == "test() BEGIN RETURN 1; END"
        assert "ast" in data

    def test_classify_request_deserialization(self):
        data = {"source": "test() BEGIN RETURN 1; END"}
        request = ClassifyRequest(**data)
        assert request.source == data["source"]


class TestClassifyResponse:
    """Tests para ClassifyResponse schema."""

    def test_classify_response_success(self):
        response = ClassifyResponse(ok=True, kind="iterative", method="ast")
        assert response.ok
        assert response.kind == "iterative"
        assert response.method == "ast"
        assert response.errors is None

    def test_classify_response_with_errors(self):
        errors = [{"message": "syntax error", "line": 1, "column": 0}]
        response = ClassifyResponse(ok=False, errors=errors)
        assert not response.ok
        assert response.errors == errors
        assert response.kind is None
        assert response.method is None

    def test_classify_response_all_fields(self):
        errors = []
        response = ClassifyResponse(ok=True, kind="recursive", method="ast", errors=errors)
        assert response.ok
        assert response.kind == "recursive"
        assert response.method == "ast"
        assert response.errors == errors

    def test_classify_response_serialization(self):
        response = ClassifyResponse(ok=True, kind="hybrid")
        data = response.model_dump()
        assert data["ok"]
        assert data["kind"] == "hybrid"
        assert "method" in data
        assert "errors" in data

    def test_classify_response_deserialization(self):
        data = {"ok": False, "errors": [{"message": "error"}]}
        response = ClassifyResponse(**data)
        assert not response.ok
        assert len(response.errors) == 1


class TestParseRequest:
    """Tests para ParseRequest schema."""

    def test_parse_request_with_input(self):
        request = ParseRequest(input="test() BEGIN RETURN 1; END")
        assert request.input == "test() BEGIN RETURN 1; END"
        assert request.source is None

    def test_parse_request_with_source(self):
        request = ParseRequest(source="test() BEGIN RETURN 1; END")
        assert request.source == "test() BEGIN RETURN 1; END"
        assert request.input is None

    def test_parse_request_with_both(self):
        request = ParseRequest(input="test() BEGIN RETURN 1; END", source="test() BEGIN RETURN 1; END")
        assert request.input is not None
        assert request.source is not None

    def test_parse_request_with_none(self):
        request = ParseRequest()
        assert request.input is None
        assert request.source is None

    def test_parse_request_serialization(self):
        request = ParseRequest(input="test() BEGIN RETURN 1; END")
        data = request.model_dump()
        assert "input" in data
        assert data["input"] == "test() BEGIN RETURN 1; END"
        assert "source" in data

    def test_parse_request_deserialization(self):
        data = {"source": "test() BEGIN RETURN 1; END"}
        request = ParseRequest(**data)
        assert request.source == data["source"]


class TestParseResponse:
    """Tests para ParseResponse schema."""

    def test_parse_response_success(self):
        ast = {"type": "Program", "body": []}
        response = ParseResponse(ok=True, available=True, runtime="python", ast=ast, errors=[])
        assert response.ok
        assert response.available
        assert response.runtime == "python"
        assert response.ast == ast
        assert response.errors == []
        assert response.error is None

    def test_parse_response_with_error(self):
        response = ParseResponse(
            ok=False,
            available=False,
            runtime="python",
            error="syntax error",
            errors=[{"message": "syntax error"}],
        )
        assert not response.ok
        assert not response.available
        assert response.error == "syntax error"
        assert len(response.errors) == 1
        assert response.ast is None

    def test_parse_response_all_fields(self):
        ast = {"type": "Program", "body": []}
        errors = []
        response = ParseResponse(
            ok=True, available=True, runtime="python", error=None, ast=ast, errors=errors
        )
        assert response.ok
        assert response.available
        assert response.runtime == "python"
        assert response.error is None
        assert response.ast == ast
        assert response.errors == errors

    def test_parse_response_default_errors(self):
        response = ParseResponse(ok=True, available=True, runtime="python")
        assert response.errors == []

    def test_parse_response_serialization(self):
        response = ParseResponse(ok=True, available=True, runtime="python", ast={"type": "Program"})
        data = response.model_dump()
        assert data["ok"]
        assert data["available"]
        assert data["runtime"] == "python"
        assert "error" in data
        assert "ast" in data
        assert "errors" in data

    def test_parse_response_deserialization(self):
        data = {
            "ok": False,
            "available": False,
            "runtime": "python",
            "error": "test error",
            "errors": [],
        }
        response = ParseResponse(**data)
        assert not response.ok
        assert not response.available
        assert response.error == "test error"
