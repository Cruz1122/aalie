"""
Tests unitarios para app.modules.classification.service.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import unittest
from unittest.mock import patch, MagicMock
from app.modules.classification.service import classify_algorithm


class TestClassifyAlgorithm(unittest.TestCase):
    """Tests para la función classify_algorithm."""

    @patch('app.modules.classification.service.detect_algorithm_kind')
    def test_classifies_with_ast(self, mock_detect):
        """Test: Clasifica usando AST directamente"""
        mock_detect.return_value = "iterative"
        ast = {"type": "Program", "body": []}

        result = classify_algorithm(ast=ast)
        self.assertTrue(result["ok"])
        self.assertEqual(result["kind"], "iterative")
        self.assertEqual(result["method"], "ast")
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
        self.assertTrue(result["ok"])
        self.assertEqual(result["kind"], "recursive")
        self.assertEqual(result["method"], "ast")
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
        self.assertFalse(result["ok"])
        self.assertIn("errors", result)
        self.assertEqual(len(result["errors"]), 1)

    @patch('app.modules.classification.service.parse_source')
    def test_returns_error_when_ast_is_none(self, mock_parse):
        """Test: Retorna error cuando AST es None"""
        mock_parse.return_value = {
            "ok": True,
            "ast": None
        }

        result = classify_algorithm(source="code")
        self.assertFalse(result["ok"])
        self.assertIn("errors", result)
        self.assertEqual(result["errors"][0]["message"], "No se pudo obtener el AST del código")

    def test_returns_error_when_no_source_or_ast(self):
        """Test: Retorna error cuando no se proporciona source ni ast"""
        result = classify_algorithm()
        self.assertFalse(result["ok"])
        self.assertIn("errors", result)
        self.assertEqual(result["errors"][0]["message"], "Se requiere 'source' o 'ast' en el payload")

    def test_returns_error_when_source_is_not_string(self):
        """Test: Retorna error cuando source no es string"""
        result = classify_algorithm(source=123)
        self.assertFalse(result["ok"])
        self.assertIn("errors", result)
        self.assertEqual(result["errors"][0]["message"], "El campo 'source' debe ser una cadena de texto")

    @patch('app.modules.classification.service.detect_algorithm_kind')
    def test_handles_exception(self, mock_detect):
        """Test: Maneja excepciones correctamente"""
        mock_detect.side_effect = Exception("Test error")
        ast = {"type": "Program", "body": []}

        result = classify_algorithm(ast=ast)
        self.assertFalse(result["ok"])
        self.assertIn("errors", result)
        self.assertIn("Error en clasificación", result["errors"][0]["message"])
        self.assertIsNone(result["errors"][0]["line"])
        self.assertIsNone(result["errors"][0]["column"])

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
            self.assertTrue(result["ok"])
            self.assertEqual(result["kind"], kind)
            self.assertEqual(result["method"], "ast")

