"""
Tests unitarios para app.modules.parsing.service.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import unittest
from unittest.mock import patch, MagicMock
from app.modules.parsing.service import parse_source


class TestParseSource(unittest.TestCase):
    """Tests para la función parse_source."""

    @patch('app.modules.parsing.service.is_grammar_available')
    def test_returns_error_when_grammar_unavailable(self, mock_available):
        """Test: Retorna error cuando grammar no está disponible"""
        mock_available.return_value = False

        result = parse_source("test code")
        self.assertFalse(result["ok"])
        self.assertIsNone(result["ast"])
        self.assertEqual(len(result["errors"]), 1)
        self.assertEqual(result["errors"][0]["message"], "aa_grammar no disponible")

    @patch('app.modules.parsing.service.is_grammar_available')
    @patch('app.modules.parsing.service.parse_to_ast_adapter')
    def test_parses_successfully_with_valid_code(self, mock_adapter, mock_available):
        """Test: Parsea correctamente código válido"""
        mock_available.return_value = True
        mock_ast = {"type": "Program", "body": []}
        mock_adapter.return_value = (mock_ast, [])

        result = parse_source("test(n) BEGIN END")
        self.assertTrue(result["ok"])
        self.assertEqual(result["ast"], mock_ast)
        self.assertEqual(result["errors"], [])

    @patch('app.modules.parsing.service.is_grammar_available')
    @patch('app.modules.parsing.service.parse_to_ast_adapter')
    def test_returns_errors_with_invalid_code(self, mock_adapter, mock_available):
        """Test: Retorna errores con código inválido"""
        mock_available.return_value = True
        mock_errors = [
            {"line": 1, "column": 5, "message": "Syntax error"}
        ]
        mock_adapter.return_value = (None, mock_errors)

        result = parse_source("invalid code")
        self.assertFalse(result["ok"])
        self.assertIsNone(result["ast"])
        self.assertEqual(len(result["errors"]), 1)
        self.assertEqual(result["errors"][0]["line"], 1)
        self.assertEqual(result["errors"][0]["column"], 5)
        self.assertEqual(result["errors"][0]["message"], "Syntax error")

    @patch('app.modules.parsing.service.is_grammar_available')
    @patch('app.modules.parsing.service.parse_to_ast_adapter')
    def test_formats_errors_correctly(self, mock_adapter, mock_available):
        """Test: Formatea errores correctamente"""
        mock_available.return_value = True
        mock_errors = [
            {"line": 2, "column": 10, "message": "Unexpected token"}
        ]
        mock_adapter.return_value = (None, mock_errors)

        result = parse_source("invalid")
        self.assertFalse(result["ok"])
        self.assertEqual(result["errors"][0]["line"], 2)
        self.assertEqual(result["errors"][0]["column"], 10)
        self.assertEqual(result["errors"][0]["message"], "Unexpected token")

    @patch('app.modules.parsing.service.is_grammar_available')
    @patch('app.modules.parsing.service.parse_to_ast_adapter')
    def test_handles_errors_with_missing_fields(self, mock_adapter, mock_available):
        """Test: Maneja errores con campos faltantes usando valores por defecto"""
        mock_available.return_value = True
        mock_errors = [
            {"message": "Error sin line y column"}
        ]
        mock_adapter.return_value = (None, mock_errors)

        result = parse_source("invalid")
        self.assertFalse(result["ok"])
        self.assertEqual(result["errors"][0]["line"], 0)  # Valor por defecto
        self.assertEqual(result["errors"][0]["column"], 0)  # Valor por defecto
        self.assertEqual(result["errors"][0]["message"], "Error sin line y column")

    @patch('app.modules.parsing.service.is_grammar_available')
    @patch('app.modules.parsing.service.parse_to_ast_adapter')
    def test_handles_errors_with_missing_message(self, mock_adapter, mock_available):
        """Test: Maneja errores sin mensaje usando mensaje por defecto"""
        mock_available.return_value = True
        mock_errors = [
            {"line": 1, "column": 1}
        ]
        mock_adapter.return_value = (None, mock_errors)

        result = parse_source("invalid")
        self.assertFalse(result["ok"])
        self.assertEqual(result["errors"][0]["message"], "error de sintaxis")  # Valor por defecto

    @patch('app.modules.parsing.service.is_grammar_available')
    @patch('app.modules.parsing.service.parse_to_ast_adapter')
    def test_handles_multiple_errors(self, mock_adapter, mock_available):
        """Test: Maneja múltiples errores"""
        mock_available.return_value = True
        mock_errors = [
            {"line": 1, "column": 5, "message": "Error 1"},
            {"line": 2, "column": 10, "message": "Error 2"}
        ]
        mock_adapter.return_value = (None, mock_errors)

        result = parse_source("invalid code")
        self.assertFalse(result["ok"])
        self.assertEqual(len(result["errors"]), 2)
        self.assertEqual(result["errors"][0]["message"], "Error 1")
        self.assertEqual(result["errors"][1]["message"], "Error 2")

