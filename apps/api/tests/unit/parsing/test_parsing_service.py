"""
Tests unitarios para app.modules.parsing.service.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""

import pytest
from unittest.mock import patch

from app.modules.parsing.service import normalize_source_text, parse_source

pytestmark = [pytest.mark.unit, pytest.mark.fast]


class TestParseSource:
    """Tests para la funcion parse_source."""

    @patch("app.modules.parsing.service.is_grammar_available")
    def test_returns_error_when_grammar_unavailable(self, mock_available):
        mock_available.return_value = False
        result = parse_source("test code")
        assert not result["ok"]
        assert result["ast"] is None
        assert len(result["errors"]) == 1
        assert result["errors"][0]["message"] == "aa_grammar no disponible"

    @patch("app.modules.parsing.service.is_grammar_available")
    @patch("app.modules.parsing.service.parse_to_ast_adapter")
    def test_parses_successfully_with_valid_code(self, mock_adapter, mock_available):
        mock_available.return_value = True
        mock_ast = {"type": "Program", "body": []}
        mock_adapter.return_value = (mock_ast, [])
        result = parse_source("test(n) BEGIN END")
        assert result["ok"]
        assert result["ast"] == mock_ast
        assert result["errors"] == []

    @patch("app.modules.parsing.service.is_grammar_available")
    @patch("app.modules.parsing.service.parse_to_ast_adapter")
    def test_returns_errors_with_invalid_code(self, mock_adapter, mock_available):
        mock_available.return_value = True
        mock_errors = [{"line": 1, "column": 5, "message": "Syntax error"}]
        mock_adapter.return_value = (None, mock_errors)
        result = parse_source("invalid code")
        assert not result["ok"]
        assert result["ast"] is None
        assert len(result["errors"]) == 1
        assert result["errors"][0]["line"] == 1
        assert result["errors"][0]["column"] == 5
        assert result["errors"][0]["message"] == "Syntax error"

    @patch("app.modules.parsing.service.is_grammar_available")
    @patch("app.modules.parsing.service.parse_to_ast_adapter")
    def test_formats_errors_correctly(self, mock_adapter, mock_available):
        mock_available.return_value = True
        mock_errors = [{"line": 2, "column": 10, "message": "Unexpected token"}]
        mock_adapter.return_value = (None, mock_errors)
        result = parse_source("invalid")
        assert not result["ok"]
        assert result["errors"][0]["line"] == 2
        assert result["errors"][0]["column"] == 10
        assert result["errors"][0]["message"] == "Unexpected token"

    @patch("app.modules.parsing.service.is_grammar_available")
    @patch("app.modules.parsing.service.parse_to_ast_adapter")
    def test_handles_errors_with_missing_fields(self, mock_adapter, mock_available):
        mock_available.return_value = True
        mock_errors = [{"message": "Error sin line y column"}]
        mock_adapter.return_value = (None, mock_errors)
        result = parse_source("invalid")
        assert not result["ok"]
        assert result["errors"][0]["line"] == 0
        assert result["errors"][0]["column"] == 0
        assert result["errors"][0]["message"] == "Error sin line y column"

    @patch("app.modules.parsing.service.is_grammar_available")
    @patch("app.modules.parsing.service.parse_to_ast_adapter")
    def test_handles_errors_with_missing_message(self, mock_adapter, mock_available):
        mock_available.return_value = True
        mock_errors = [{"line": 1, "column": 1}]
        mock_adapter.return_value = (None, mock_errors)
        result = parse_source("invalid")
        assert not result["ok"]
        assert result["errors"][0]["message"] == "error de sintaxis"

    @patch("app.modules.parsing.service.is_grammar_available")
    @patch("app.modules.parsing.service.parse_to_ast_adapter")
    def test_handles_multiple_errors(self, mock_adapter, mock_available):
        mock_available.return_value = True
        mock_errors = [
            {"line": 1, "column": 5, "message": "Error 1"},
            {"line": 2, "column": 10, "message": "Error 2"},
        ]
        mock_adapter.return_value = (None, mock_errors)
        result = parse_source("invalid code")
        assert not result["ok"]
        assert len(result["errors"]) == 2
        assert result["errors"][0]["message"] == "Error 1"
        assert result["errors"][1]["message"] == "Error 2"

    @patch("app.modules.parsing.service.is_grammar_available")
    @patch("app.modules.parsing.service.parse_to_ast_adapter")
    def test_normalizes_bom_and_line_endings_before_parse(
        self, mock_adapter, mock_available
    ):
        mock_available.return_value = True
        mock_adapter.return_value = ({"type": "Program", "body": []}, [])

        parse_source("\ufeffalgo(n) BEGIN\r\n  RETURN 1;\rEND")

        mock_adapter.assert_called_once_with("algo(n) BEGIN\n  RETURN 1;\nEND")


class TestNormalizeSourceText:
    def test_removes_utf8_bom(self):
        assert normalize_source_text("\ufeffabc") == "abc"

    def test_normalizes_crlf_and_cr_to_lf(self):
        assert normalize_source_text("a\r\nb\rc") == "a\nb\nc"
