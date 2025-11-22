"""
Tests unitarios para app.modules.analysis.service.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import unittest
from unittest.mock import patch, MagicMock
from app.modules.analysis.service import analyze_algorithm, detect_methods


class TestAnalyzeAlgorithm(unittest.TestCase):
    """Tests para la función analyze_algorithm."""

    @patch('app.modules.analysis.service.parse_source')
    def test_returns_error_when_parsing_fails(self, mock_parse):
        """Test: Retorna error cuando el parsing falla"""
        mock_parse.return_value = {
            "ok": False,
            "errors": [{"line": 1, "column": 1, "message": "Syntax error"}]
        }

        result = analyze_algorithm("invalid code", mode="worst")
        self.assertFalse(result["ok"])
        self.assertIn("errors", result)

    @patch('app.modules.analysis.service.parse_source')
    def test_returns_error_when_ast_is_none(self, mock_parse):
        """Test: Retorna error cuando AST es None"""
        mock_parse.return_value = {
            "ok": True,
            "ast": None
        }

        result = analyze_algorithm("code", mode="worst")
        self.assertFalse(result["ok"])
        self.assertIn("errors", result)

    @patch('app.modules.analysis.service.parse_source')
    @patch('app.modules.analysis.service.detect_algorithm_kind')
    @patch('app.modules.analysis.service.AnalyzerRegistry')
    def test_analyzes_iterative_algorithm(self, mock_registry, mock_detect, mock_parse):
        """Test: Analiza algoritmo iterativo"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }
        mock_detect.return_value = "iterative"
        
        from app.modules.analysis.analyzers.iterative import IterativeAnalyzer
        mock_analyzer = MagicMock()
        mock_analyzer.analyze.return_value = {"ok": True, "byLine": []}
        mock_registry.get.return_value = IterativeAnalyzer
        
        with patch.object(IterativeAnalyzer, '__new__', return_value=mock_analyzer):
            result = analyze_algorithm("test(n) BEGIN END", mode="worst")
            self.assertTrue(result["ok"])

    @patch('app.modules.analysis.service.parse_source')
    @patch('app.modules.analysis.service.detect_algorithm_kind')
    def test_handles_exception(self, mock_detect, mock_parse):
        """Test: Maneja excepciones correctamente"""
        mock_parse.side_effect = Exception("Test error")

        result = analyze_algorithm("code", mode="worst")
        self.assertFalse(result["ok"])
        self.assertIn("errors", result)
        self.assertIn("Error en análisis", result["errors"][0]["message"])

    @patch('app.modules.analysis.service.parse_source')
    @patch('app.modules.analysis.service.detect_algorithm_kind')
    @patch('app.modules.analysis.service.AnalyzerRegistry')
    def test_analyzes_with_algorithm_kind_provided(self, mock_registry, mock_detect, mock_parse):
        """Test: Analiza con tipo de algoritmo proporcionado"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }
        
        from app.modules.analysis.analyzers.iterative import IterativeAnalyzer
        mock_analyzer = MagicMock()
        mock_analyzer.analyze.return_value = {"ok": True, "byLine": []}
        mock_registry.get.return_value = IterativeAnalyzer
        
        with patch.object(IterativeAnalyzer, '__new__', return_value=mock_analyzer):
            result = analyze_algorithm("code", mode="worst", algorithm_kind="iterative")
            # No debe llamar a detect_algorithm_kind si se proporciona algorithm_kind
            mock_detect.assert_not_called()


class TestDetectMethods(unittest.TestCase):
    """Tests para la función detect_methods."""

    @patch('app.modules.analysis.service.parse_source')
    def test_returns_error_when_parsing_fails(self, mock_parse):
        """Test: Retorna error cuando el parsing falla"""
        mock_parse.return_value = {
            "ok": False,
            "errors": [{"line": 1, "column": 1, "message": "Syntax error"}]
        }

        result = detect_methods("invalid code")
        self.assertFalse(result["ok"])
        self.assertIn("errors", result)

    @patch('app.modules.analysis.service.parse_source')
    def test_returns_error_for_non_recursive_algorithm(self, mock_parse):
        """Test: Retorna error para algoritmo no recursivo"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }

        with patch('app.modules.analysis.service.detect_algorithm_kind', return_value="iterative"):
            result = detect_methods("code")
            self.assertFalse(result["ok"])
            self.assertIn("recursivos", result["errors"][0]["message"])

    @patch('app.modules.analysis.service.parse_source')
    @patch('app.modules.analysis.service.detect_algorithm_kind')
    @patch('app.modules.analysis.service.RecursiveAnalyzer')
    def test_detects_methods_for_recursive_algorithm(self, mock_analyzer_class, mock_detect, mock_parse):
        """Test: Detecta métodos para algoritmo recursivo"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }
        mock_detect.return_value = "recursive"
        
        mock_analyzer = MagicMock()
        mock_analyzer.detect_applicable_methods.return_value = {
            "ok": True,
            "applicable_methods": ["master", "iteration"],
            "default_method": "master",
            "recurrence_info": {}
        }
        mock_analyzer_class.return_value = mock_analyzer

        result = detect_methods("code")
        self.assertTrue(result["ok"])
        self.assertIn("applicable_methods", result)
        self.assertIn("default_method", result)

    @patch('app.modules.analysis.service.parse_source')
    @patch('app.modules.analysis.service.detect_algorithm_kind')
    def test_handles_exception(self, mock_detect, mock_parse):
        """Test: Maneja excepciones correctamente"""
        mock_parse.side_effect = Exception("Test error")

        result = detect_methods("code")
        self.assertFalse(result["ok"])
        self.assertIn("errors", result)
        self.assertIn("Error detectando métodos", result["errors"][0]["message"])

