"""
Tests para los modelos Pydantic (schemas) de los módulos classification y parsing.

Author: Tests generados para aumentar cobertura de código
"""
import unittest
from pydantic import ValidationError
from app.modules.classification.schemas import ClassifyRequest, ClassifyResponse
from app.modules.parsing.schemas import ParseRequest, ParseResponse


class TestClassifyRequest(unittest.TestCase):
    """Tests para ClassifyRequest schema."""

    def test_classify_request_with_source(self):
        """Test: ClassifyRequest se crea correctamente con source"""
        request = ClassifyRequest(source="factorial(n) BEGIN RETURN 1; END")
        self.assertEqual(request.source, "factorial(n) BEGIN RETURN 1; END")
        self.assertIsNone(request.ast)

    def test_classify_request_with_ast(self):
        """Test: ClassifyRequest se crea correctamente con ast"""
        ast = {"type": "Program", "body": [{"type": "ProcDef", "name": "factorial"}]}
        request = ClassifyRequest(ast=ast)
        self.assertEqual(request.ast, ast)
        self.assertIsNone(request.source)

    def test_classify_request_with_both(self):
        """Test: ClassifyRequest acepta tanto source como ast"""
        ast = {"type": "Program", "body": []}
        request = ClassifyRequest(
            source="test() BEGIN RETURN 1; END",
            ast=ast
        )
        self.assertEqual(request.source, "test() BEGIN RETURN 1; END")
        self.assertEqual(request.ast, ast)

    def test_classify_request_with_none(self):
        """Test: ClassifyRequest acepta ambos campos como None"""
        request = ClassifyRequest()
        self.assertIsNone(request.source)
        self.assertIsNone(request.ast)

    def test_classify_request_serialization(self):
        """Test: ClassifyRequest se puede serializar a dict"""
        request = ClassifyRequest(source="test() BEGIN RETURN 1; END")
        data = request.model_dump()
        self.assertIn("source", data)
        self.assertEqual(data["source"], "test() BEGIN RETURN 1; END")
        self.assertIn("ast", data)

    def test_classify_request_deserialization(self):
        """Test: ClassifyRequest se puede crear desde dict"""
        data = {"source": "test() BEGIN RETURN 1; END"}
        request = ClassifyRequest(**data)
        self.assertEqual(request.source, data["source"])


class TestClassifyResponse(unittest.TestCase):
    """Tests para ClassifyResponse schema."""

    def test_classify_response_success(self):
        """Test: ClassifyResponse se crea correctamente con ok=True"""
        response = ClassifyResponse(
            ok=True,
            kind="iterative",
            method="ast"
        )
        self.assertTrue(response.ok)
        self.assertEqual(response.kind, "iterative")
        self.assertEqual(response.method, "ast")
        self.assertIsNone(response.errors)

    def test_classify_response_with_errors(self):
        """Test: ClassifyResponse se crea correctamente con errores"""
        errors = [{"message": "syntax error", "line": 1, "column": 0}]
        response = ClassifyResponse(
            ok=False,
            errors=errors
        )
        self.assertFalse(response.ok)
        self.assertEqual(response.errors, errors)
        self.assertIsNone(response.kind)
        self.assertIsNone(response.method)

    def test_classify_response_all_fields(self):
        """Test: ClassifyResponse con todos los campos"""
        errors = []
        response = ClassifyResponse(
            ok=True,
            kind="recursive",
            method="ast",
            errors=errors
        )
        self.assertTrue(response.ok)
        self.assertEqual(response.kind, "recursive")
        self.assertEqual(response.method, "ast")
        self.assertEqual(response.errors, errors)

    def test_classify_response_serialization(self):
        """Test: ClassifyResponse se puede serializar a dict"""
        response = ClassifyResponse(ok=True, kind="hybrid")
        data = response.model_dump()
        self.assertTrue(data["ok"])
        self.assertEqual(data["kind"], "hybrid")
        self.assertIn("method", data)
        self.assertIn("errors", data)

    def test_classify_response_deserialization(self):
        """Test: ClassifyResponse se puede crear desde dict"""
        data = {
            "ok": False,
            "errors": [{"message": "error"}]
        }
        response = ClassifyResponse(**data)
        self.assertFalse(response.ok)
        self.assertEqual(len(response.errors), 1)


class TestParseRequest(unittest.TestCase):
    """Tests para ParseRequest schema."""

    def test_parse_request_with_input(self):
        """Test: ParseRequest se crea correctamente con input"""
        request = ParseRequest(input="test() BEGIN RETURN 1; END")
        self.assertEqual(request.input, "test() BEGIN RETURN 1; END")
        self.assertIsNone(request.source)

    def test_parse_request_with_source(self):
        """Test: ParseRequest se crea correctamente con source"""
        request = ParseRequest(source="test() BEGIN RETURN 1; END")
        self.assertEqual(request.source, "test() BEGIN RETURN 1; END")
        self.assertIsNone(request.input)

    def test_parse_request_with_both(self):
        """Test: ParseRequest acepta tanto input como source"""
        request = ParseRequest(
            input="test() BEGIN RETURN 1; END",
            source="test() BEGIN RETURN 1; END"
        )
        self.assertIsNotNone(request.input)
        self.assertIsNotNone(request.source)

    def test_parse_request_with_none(self):
        """Test: ParseRequest acepta ambos campos como None"""
        request = ParseRequest()
        self.assertIsNone(request.input)
        self.assertIsNone(request.source)

    def test_parse_request_serialization(self):
        """Test: ParseRequest se puede serializar a dict"""
        request = ParseRequest(input="test() BEGIN RETURN 1; END")
        data = request.model_dump()
        self.assertIn("input", data)
        self.assertEqual(data["input"], "test() BEGIN RETURN 1; END")
        self.assertIn("source", data)

    def test_parse_request_deserialization(self):
        """Test: ParseRequest se puede crear desde dict"""
        data = {"source": "test() BEGIN RETURN 1; END"}
        request = ParseRequest(**data)
        self.assertEqual(request.source, data["source"])


class TestParseResponse(unittest.TestCase):
    """Tests para ParseResponse schema."""

    def test_parse_response_success(self):
        """Test: ParseResponse se crea correctamente con ok=True"""
        ast = {"type": "Program", "body": []}
        response = ParseResponse(
            ok=True,
            available=True,
            runtime="python",
            ast=ast,
            errors=[]
        )
        self.assertTrue(response.ok)
        self.assertTrue(response.available)
        self.assertEqual(response.runtime, "python")
        self.assertEqual(response.ast, ast)
        self.assertEqual(response.errors, [])
        self.assertIsNone(response.error)

    def test_parse_response_with_error(self):
        """Test: ParseResponse se crea correctamente con error"""
        response = ParseResponse(
            ok=False,
            available=False,
            runtime="python",
            error="syntax error",
            errors=[{"message": "syntax error"}]
        )
        self.assertFalse(response.ok)
        self.assertFalse(response.available)
        self.assertEqual(response.error, "syntax error")
        self.assertEqual(len(response.errors), 1)
        self.assertIsNone(response.ast)

    def test_parse_response_all_fields(self):
        """Test: ParseResponse con todos los campos"""
        ast = {"type": "Program", "body": []}
        errors = []
        response = ParseResponse(
            ok=True,
            available=True,
            runtime="python",
            error=None,
            ast=ast,
            errors=errors
        )
        self.assertTrue(response.ok)
        self.assertTrue(response.available)
        self.assertEqual(response.runtime, "python")
        self.assertIsNone(response.error)
        self.assertEqual(response.ast, ast)
        self.assertEqual(response.errors, errors)

    def test_parse_response_default_errors(self):
        """Test: ParseResponse tiene errors como lista vacía por defecto"""
        response = ParseResponse(
            ok=True,
            available=True,
            runtime="python"
        )
        self.assertEqual(response.errors, [])

    def test_parse_response_serialization(self):
        """Test: ParseResponse se puede serializar a dict"""
        response = ParseResponse(
            ok=True,
            available=True,
            runtime="python",
            ast={"type": "Program"}
        )
        data = response.model_dump()
        self.assertTrue(data["ok"])
        self.assertTrue(data["available"])
        self.assertEqual(data["runtime"], "python")
        self.assertIn("error", data)
        self.assertIn("ast", data)
        self.assertIn("errors", data)

    def test_parse_response_deserialization(self):
        """Test: ParseResponse se puede crear desde dict"""
        data = {
            "ok": False,
            "available": False,
            "runtime": "python",
            "error": "test error",
            "errors": []
        }
        response = ParseResponse(**data)
        self.assertFalse(response.ok)
        self.assertFalse(response.available)
        self.assertEqual(response.error, "test error")

