"""
Tests unitarios para app.modules.parsing.adapter.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import unittest
from unittest.mock import patch, MagicMock
from app.modules.parsing import adapter


class TestIsGrammarAvailable(unittest.TestCase):
    """Tests para la función is_grammar_available."""

    @patch('app.modules.parsing.adapter.GRAMMAR_AVAILABLE', True)
    def test_available_when_grammar_installed(self):
        """Test: Grammar disponible cuando está instalado"""
        result = adapter.is_grammar_available()
        self.assertTrue(result)

    @patch('app.modules.parsing.adapter.GRAMMAR_AVAILABLE', False)
    def test_unavailable_when_grammar_not_installed(self):
        """Test: Grammar no disponible cuando no está instalado"""
        result = adapter.is_grammar_available()
        self.assertFalse(result)


class TestParseToAstAdapter(unittest.TestCase):
    """Tests para la función parse_to_ast_adapter."""

    @patch('app.modules.parsing.adapter.GRAMMAR_AVAILABLE', False)
    @patch('app.modules.parsing.adapter.parse_to_ast', None)
    def test_returns_error_when_grammar_unavailable(self):
        """Test: Retorna error cuando grammar no está disponible"""
        ast, errors = adapter.parse_to_ast_adapter("test code")
        self.assertIsNone(ast)
        self.assertEqual(len(errors), 1)
        self.assertEqual(errors[0]["message"], "aa_grammar no disponible")
        self.assertEqual(errors[0]["line"], 0)
        self.assertEqual(errors[0]["column"], 0)

    @patch('app.modules.parsing.adapter.GRAMMAR_AVAILABLE', True)
    @patch('app.modules.parsing.adapter.parse_to_ast')
    def test_parses_successfully_when_grammar_available(self, mock_parse):
        """Test: Parsea correctamente cuando grammar está disponible"""
        mock_ast = {"type": "Program", "body": []}
        mock_errors = []
        mock_parse.return_value = (mock_ast, mock_errors)

        ast, errors = adapter.parse_to_ast_adapter("test(n) BEGIN END")
        self.assertEqual(ast, mock_ast)
        self.assertEqual(errors, mock_errors)
        mock_parse.assert_called_once_with("test(n) BEGIN END")

    @patch('app.modules.parsing.adapter.GRAMMAR_AVAILABLE', True)
    @patch('app.modules.parsing.adapter.parse_to_ast')
    def test_returns_errors_when_parsing_fails(self, mock_parse):
        """Test: Retorna errores cuando el parsing falla"""
        mock_ast = None
        mock_errors = [
            {"line": 1, "column": 5, "message": "Syntax error"}
        ]
        mock_parse.return_value = (mock_ast, mock_errors)

        ast, errors = adapter.parse_to_ast_adapter("invalid code")
        self.assertIsNone(ast)
        self.assertEqual(errors, mock_errors)
        mock_parse.assert_called_once_with("invalid code")

    @patch('app.modules.parsing.adapter.GRAMMAR_AVAILABLE', True)
    @patch('app.modules.parsing.adapter.parse_to_ast')
    def test_handles_multiple_errors(self, mock_parse):
        """Test: Maneja múltiples errores de parsing"""
        mock_ast = None
        mock_errors = [
            {"line": 1, "column": 5, "message": "Error 1"},
            {"line": 2, "column": 10, "message": "Error 2"}
        ]
        mock_parse.return_value = (mock_ast, mock_errors)

        ast, errors = adapter.parse_to_ast_adapter("invalid code")
        self.assertIsNone(ast)
        self.assertEqual(len(errors), 2)
        self.assertEqual(errors[0]["message"], "Error 1")
        self.assertEqual(errors[1]["message"], "Error 2")

