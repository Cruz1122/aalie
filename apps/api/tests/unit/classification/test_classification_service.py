"""
Tests unitarios para app.modules.classification.service.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
from unittest.mock import patch, MagicMock
from app.modules.classification.service import classify_algorithm


class TestClassifyAlgorithm:
    """Tests para la función classify_algorithm."""

    @patch('app.modules.classification.service.detect_algorithm_kind')
    def test_classifies_with_ast(self, mock_detect):
        """Test: Clasifica usando AST directamente"""
        mock_detect.return_value = "iterative"
        ast = {"type": "Program", "body": []}

        result = classify_algorithm(ast=ast)
        assert result["ok"]
        assert result["kind"] == "iterative"
        assert result["method"] == "ast"
        mock_detect.assert_called_once_with(ast)

    @patch('app.modules.classification.service.parse_source')
    @patch('app.modules.classification.service.detect_algorithm_kind')
    def test_classifies_with_source(self, mock_detect, mock_parse):
        """Test: Clasifica parseando source"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }
        mock_detect.return_value = "recursive"

        result = classify_algorithm(source="test(n) BEGIN END")
        assert result["ok"]
        assert result["kind"] == "recursive"
        assert result["method"] == "ast"
        mock_parse.assert_called_once_with("test(n) BEGIN END")
        mock_detect.assert_called_once()

    @patch('app.modules.classification.service.parse_source')
    def test_returns_error_when_parsing_fails(self, mock_parse):
        """Test: Retorna error cuando el parsing falla"""
        mock_parse.return_value = {
            "ok": False,
            "errors": [{"line": 1, "column": 1, "message": "Syntax error"}]
        }

        result = classify_algorithm(source="invalid code")
        assert not result["ok"]
        assert "errors" in result
        assert len(result["errors"]) == 1

    @patch('app.modules.classification.service.parse_source')
    def test_returns_error_when_ast_is_none(self, mock_parse):
        """Test: Retorna error cuando AST es None"""
        mock_parse.return_value = {
            "ok": True,
            "ast": None
        }

        result = classify_algorithm(source="code")
        assert not result["ok"]
        assert "errors" in result
        assert result["errors"][0]["message"] == "No se pudo obtener el AST del código"

    def test_returns_error_when_no_source_or_ast(self):
        """Test: Retorna error cuando no se proporciona source ni ast"""
        result = classify_algorithm()
        assert not result["ok"]
        assert "errors" in result
        assert result["errors"][0]["message"] == "Se requiere 'source' o 'ast' en el payload"

    def test_returns_error_when_source_is_not_string(self):
        """Test: Retorna error cuando source no es string"""
        result = classify_algorithm(source=123)
        assert not result["ok"]
        assert "errors" in result
        assert result["errors"][0]["message"] == "El campo 'source' debe ser una cadena de texto"

    @patch('app.modules.classification.service.detect_algorithm_kind')
    def test_handles_exception(self, mock_detect):
        """Test: Maneja excepciones correctamente"""
        mock_detect.side_effect = Exception("Test error")
        ast = {"type": "Program", "body": []}

        result = classify_algorithm(ast=ast)
        assert not result["ok"]
        assert "errors" in result
        assert "Error en clasificación" in result["errors"][0]["message"]
        assert result["errors"][0]["line"] is None
        assert result["errors"][0]["column"] is None

    @patch('app.modules.classification.service.parse_source')
    @patch('app.modules.classification.service.detect_algorithm_kind')
    def test_classifies_all_kinds(self, mock_detect, mock_parse):
        """Test: Clasifica todos los tipos de algoritmos"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }

        for kind in ["iterative", "recursive", "hybrid", "unknown"]:
            mock_detect.return_value = kind
            result = classify_algorithm(source="code")
            assert result["ok"]
            assert result["kind"] == kind
            assert result["method"] == "ast"

