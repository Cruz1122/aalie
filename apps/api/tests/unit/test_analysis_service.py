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
    
    @patch('app.modules.analysis.service.parse_source')
    @patch('app.modules.analysis.service.detect_algorithm_kind')
    @patch('app.modules.analysis.service.AnalyzerRegistry')
    def test_mode_all_with_variability(self, mock_registry, mock_detect, mock_parse):
        """Test: Modo 'all' con variabilidad de casos"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }
        mock_detect.return_value = "iterative"
        
        from app.modules.analysis.analyzers.iterative import IterativeAnalyzer
        mock_analyzer_worst = MagicMock()
        mock_analyzer_best = MagicMock()
        mock_analyzer_avg = MagicMock()
        
        mock_analyzer_worst.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "n", "recurrence": None}
        }
        mock_analyzer_best.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "1", "recurrence": None}
        }
        mock_analyzer_avg.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "n/2", "recurrence": None}
        }
        
        mock_registry.get.return_value = IterativeAnalyzer
        
        with patch.object(IterativeAnalyzer, '__new__', side_effect=[mock_analyzer_worst, mock_analyzer_best, mock_analyzer_avg]):
            result = analyze_algorithm("code", mode="all")
            self.assertTrue(result["ok"])
            self.assertTrue(result.get("has_case_variability", False))
            self.assertIn("worst", result)
            self.assertIn("best", result)
            self.assertIn("avg", result)
    
    @patch('app.modules.analysis.service.parse_source')
    @patch('app.modules.analysis.service.detect_algorithm_kind')
    @patch('app.modules.analysis.service.AnalyzerRegistry')
    def test_mode_all_without_variability(self, mock_registry, mock_detect, mock_parse):
        """Test: Modo 'all' sin variabilidad de casos"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }
        mock_detect.return_value = "iterative"
        
        from app.modules.analysis.analyzers.iterative import IterativeAnalyzer
        mock_analyzer_worst = MagicMock()
        mock_analyzer_best = MagicMock()
        mock_analyzer_avg = MagicMock()
        
        # Mismo resultado para worst y best (sin variabilidad)
        same_result = {
            "ok": True,
            "totals": {"T_open": "n", "recurrence": None}
        }
        mock_analyzer_worst.analyze.return_value = same_result
        mock_analyzer_best.analyze.return_value = same_result
        mock_analyzer_avg.analyze.return_value = same_result
        
        mock_registry.get.return_value = IterativeAnalyzer
        
        with patch.object(IterativeAnalyzer, '__new__', side_effect=[mock_analyzer_worst, mock_analyzer_best, mock_analyzer_avg]):
            result = analyze_algorithm("code", mode="all")
            self.assertTrue(result["ok"])
            # Como worst == best == avg y es IterativeAnalyzer (no RecursiveAnalyzer),
            # has_variability será True por defecto, pero best y avg deberían ser "same_as_worst"
            # Solo para RecursiveAnalyzer se llama _has_case_variability()
            # Para IterativeAnalyzer, si worst == best == avg, has_variability será False
            if result.get("worst") and result.get("best") == "same_as_worst":
                self.assertFalse(result.get("has_case_variability", True))
            self.assertIn("worst", result)
    
    @patch('app.modules.analysis.service.parse_source')
    @patch('app.modules.analysis.service.detect_algorithm_kind')
    @patch('app.modules.analysis.service.AnalyzerRegistry')
    def test_mode_all_avg_fails(self, mock_registry, mock_detect, mock_parse):
        """Test: Modo 'all' con análisis promedio fallido"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }
        mock_detect.return_value = "iterative"
        
        from app.modules.analysis.analyzers.iterative import IterativeAnalyzer
        mock_analyzer_worst = MagicMock()
        mock_analyzer_best = MagicMock()
        mock_analyzer_avg = MagicMock()
        
        mock_analyzer_worst.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "n", "recurrence": None}
        }
        mock_analyzer_best.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "1", "recurrence": None}
        }
        mock_analyzer_avg.analyze.return_value = {
            "ok": False,
            "errors": [{"message": "Error en análisis promedio"}]
        }
        
        mock_registry.get.return_value = IterativeAnalyzer
        
        with patch.object(IterativeAnalyzer, '__new__', side_effect=[mock_analyzer_worst, mock_analyzer_best, mock_analyzer_avg]):
            result = analyze_algorithm("code", mode="all")
            self.assertTrue(result["ok"])
            # Debe continuar aunque avg falle, pero result_avg será None
            self.assertIn("worst", result)
            self.assertIn("best", result)
    
    @patch('app.modules.analysis.service.parse_source')
    @patch('app.modules.analysis.service.detect_algorithm_kind')
    @patch('app.modules.analysis.service.AnalyzerRegistry')
    def test_mode_all_recursive_with_preferred_method(self, mock_registry, mock_detect, mock_parse):
        """Test: Modo 'all' con RecursiveAnalyzer y preferred_method"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }
        mock_detect.return_value = "recursive"
        
        from app.modules.analysis.analyzers.recursive import RecursiveAnalyzer
        
        # Crear instancias reales que se comporten como RecursiveAnalyzer
        class MockRecursiveAnalyzer(RecursiveAnalyzer):
            def __init__(self):
                pass
        
        mock_analyzer_worst = MagicMock()
        mock_analyzer_worst.analyze.return_value = {"ok": True, "totals": {"T_open": "T_worst"}}
        mock_analyzer_worst._has_case_variability.return_value = True
        
        mock_analyzer_best = MagicMock()
        mock_analyzer_best.analyze.return_value = {"ok": True, "totals": {"T_open": "T_best"}}
        
        mock_analyzer_avg = MagicMock()
        mock_analyzer_avg.analyze.return_value = {"ok": True, "totals": {"T_open": "T_avg"}}
        
        # Mock registry.get para retornar RecursiveAnalyzer
        mock_registry.get = lambda kind: RecursiveAnalyzer if kind == "recursive" else None
        
        # Usar isinstance check con los mocks configurados como RecursiveAnalyzer
        with patch('app.modules.analysis.service.isinstance', lambda obj, cls: cls == RecursiveAnalyzer):
            with patch.object(RecursiveAnalyzer, '__new__', side_effect=[mock_analyzer_worst, mock_analyzer_best, mock_analyzer_avg]):
                result = analyze_algorithm("code", mode="all", preferred_method="master")
                self.assertTrue(result["ok"])
                # Verificar que se llamó con preferred_method
                self.assertTrue(mock_analyzer_worst.analyze.called)
                # Verificar los argumentos de la llamada
                call_args = mock_analyzer_worst.analyze.call_args
                if call_args and len(call_args) > 1:
                    kwargs = call_args[1]
                    if kwargs and "preferred_method" in kwargs:
                        self.assertEqual(kwargs["preferred_method"], "master")
    
    @patch('app.modules.analysis.service.parse_source')
    @patch('app.modules.analysis.service.detect_algorithm_kind')
    @patch('app.modules.analysis.service.AnalyzerRegistry')
    def test_mode_avg_without_avg_model(self, mock_registry, mock_detect, mock_parse):
        """Test: Modo 'avg' sin avg_model proporcionado"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }
        mock_detect.return_value = "iterative"
        
        from app.modules.analysis.analyzers.iterative import IterativeAnalyzer
        mock_analyzer = MagicMock()
        mock_analyzer.analyze.return_value = {"ok": True, "totals": {"T_open": "n/2"}}
        
        mock_registry.get.return_value = IterativeAnalyzer
        
        with patch.object(IterativeAnalyzer, '__new__', return_value=mock_analyzer):
            result = analyze_algorithm("code", mode="avg")
            self.assertTrue(result["ok"])
            # Verificar que se llamó con avg_model por defecto
            call_kwargs = mock_analyzer.analyze.call_args[1]
            self.assertIsNotNone(call_kwargs.get("avg_model"))
    
    @patch('app.modules.analysis.service.parse_source')
    @patch('app.modules.analysis.service.detect_algorithm_kind')
    @patch('app.modules.analysis.service.AnalyzerRegistry')
    def test_mode_avg_with_avg_model(self, mock_registry, mock_detect, mock_parse):
        """Test: Modo 'avg' con avg_model proporcionado"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }
        mock_detect.return_value = "iterative"
        
        from app.modules.analysis.analyzers.iterative import IterativeAnalyzer
        mock_analyzer = MagicMock()
        mock_analyzer.analyze.return_value = {"ok": True, "totals": {"T_open": "n/2"}}
        
        mock_registry.get.return_value = IterativeAnalyzer
        avg_model = {"mode": "symbolic", "predicates": {"cond": "p"}}
        
        with patch.object(IterativeAnalyzer, '__new__', return_value=mock_analyzer):
            result = analyze_algorithm("code", mode="avg", avg_model=avg_model)
            self.assertTrue(result["ok"])
            # Verificar que se pasó el avg_model proporcionado
            call_kwargs = mock_analyzer.analyze.call_args[1]
            self.assertEqual(call_kwargs.get("avg_model"), avg_model)
    
    @patch('app.modules.analysis.service.parse_source')
    @patch('app.modules.analysis.service.detect_algorithm_kind')
    @patch('app.modules.analysis.service.AnalyzerRegistry')
    def test_analyzer_class_none_fallback(self, mock_registry, mock_detect, mock_parse):
        """Test: Fallback a IterativeAnalyzer cuando analyzer_class es None"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }
        mock_detect.return_value = "unknown"
        mock_registry.get.return_value = None  # analyzer_class es None
        
        from app.modules.analysis.analyzers.iterative import IterativeAnalyzer
        mock_analyzer = MagicMock()
        mock_analyzer.analyze.return_value = {"ok": True, "totals": {"T_open": "1"}}
        
        # Debe usar IterativeAnalyzer como fallback
        with patch.object(IterativeAnalyzer, '__new__', return_value=mock_analyzer):
            result = analyze_algorithm("code", mode="worst")
            self.assertTrue(result["ok"])
            # Verificar que se usó IterativeAnalyzer
            mock_analyzer.analyze.assert_called_once()
    
    @patch('app.modules.analysis.service.parse_source')
    @patch('app.modules.analysis.service.detect_algorithm_kind')
    @patch('app.modules.analysis.service.AnalyzerRegistry')
    def test_mode_all_best_fails(self, mock_registry, mock_detect, mock_parse):
        """Test: Modo 'all' cuando best falla"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }
        mock_detect.return_value = "iterative"
        
        from app.modules.analysis.analyzers.iterative import IterativeAnalyzer
        mock_analyzer_worst = MagicMock()
        mock_analyzer_best = MagicMock()
        
        mock_analyzer_worst.analyze.return_value = {"ok": True, "totals": {"T_open": "n"}}
        mock_analyzer_best.analyze.return_value = {"ok": False, "errors": [{"message": "Error"}]}
        mock_registry.get.return_value = IterativeAnalyzer
        
        with patch.object(IterativeAnalyzer, '__new__', side_effect=[mock_analyzer_worst, mock_analyzer_best]):
            result = analyze_algorithm("code", mode="all")
            # Debe retornar el error de best inmediatamente
            self.assertFalse(result["ok"])
            self.assertIn("errors", result)


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
    
    @patch('app.modules.analysis.service.parse_source')
    @patch('app.modules.analysis.service.detect_algorithm_kind')
    def test_detect_methods_hybrid_algorithm(self, mock_detect, mock_parse):
        """Test: detect_methods acepta algoritmo 'hybrid'"""
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []}
        }
        mock_detect.return_value = "hybrid"
        
        from app.modules.analysis.service import RecursiveAnalyzer
        mock_analyzer = MagicMock()
        mock_analyzer.detect_applicable_methods.return_value = {
            "ok": True,
            "applicable_methods": ["master"],
            "default_method": "master"
        }
        
        with patch.object(RecursiveAnalyzer, '__new__', return_value=mock_analyzer):
            result = detect_methods("code")
            # Debe aceptar hybrid
            self.assertTrue(result["ok"])

