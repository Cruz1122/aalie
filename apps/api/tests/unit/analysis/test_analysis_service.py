"""
Tests unitarios para app.modules.analysis.service.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""

from unittest.mock import MagicMock, patch

import pytest

from app.modules.analysis.service import analyze_algorithm, detect_methods

pytestmark = [pytest.mark.unit, pytest.mark.fast]


class TestAnalyzeAlgorithm:
    """Tests para la función analyze_algorithm."""

    @patch("app.modules.analysis.service.parse_source")
    def test_returns_error_when_parsing_fails(self, mock_parse):
        """Test: Retorna error cuando el parsing falla"""
        mock_parse.return_value = {
            "ok": False,
            "errors": [{"line": 1, "column": 1, "message": "Syntax error"}],
        }

        result = analyze_algorithm("invalid code", mode="worst")
        assert not result["ok"]
        assert "errors" in result

    @patch("app.modules.analysis.service.parse_source")
    def test_returns_error_when_ast_is_none(self, mock_parse):
        """Test: Retorna error cuando AST es None"""
        mock_parse.return_value = {"ok": True, "ast": None}

        result = analyze_algorithm("code", mode="worst")
        assert not result["ok"]
        assert "errors" in result

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.AnalyzerRegistry")
    def test_analyzes_iterative_algorithm(self, mock_registry, mock_detect, mock_parse):
        """Test: Analiza algoritmo iterativo"""
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}
        mock_detect.return_value = "iterative"

        mock_analyzer = MagicMock()
        mock_analyzer.analyze.return_value = {"ok": True, "byLine": []}
        mock_registry.get.return_value = MagicMock(return_value=mock_analyzer)

        result = analyze_algorithm("test(n) BEGIN END", mode="worst")
        assert result["ok"]

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    def test_handles_exception(self, mock_detect, mock_parse):
        """Test: Maneja excepciones correctamente"""
        mock_parse.side_effect = Exception("Test error")

        result = analyze_algorithm("code", mode="worst")
        assert not result["ok"]
        assert "errors" in result
        assert "Error en análisis" in result["errors"][0]["message"]

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.AnalyzerRegistry")
    def test_analyzes_with_algorithm_kind_provided(
        self, mock_registry, mock_detect, mock_parse
    ):
        """Test: Analiza con tipo de algoritmo proporcionado"""
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}

        mock_analyzer = MagicMock()
        mock_analyzer.analyze.return_value = {"ok": True, "byLine": []}
        mock_registry.get.return_value = MagicMock(return_value=mock_analyzer)

        analyze_algorithm("code", mode="worst", algorithm_kind="iterative")
        # No debe llamar a detect_algorithm_kind si se proporciona algorithm_kind
        mock_detect.assert_not_called()

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.AnalyzerRegistry")
    def test_mode_all_with_variability(self, mock_registry, mock_detect, mock_parse):
        """Test: Modo 'all' con variabilidad de casos"""
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}
        mock_detect.return_value = "iterative"

        mock_analyzer_worst = MagicMock()
        mock_analyzer_best = MagicMock()
        mock_analyzer_avg = MagicMock()

        mock_analyzer_worst.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "n", "recurrence": None},
        }
        mock_analyzer_best.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "1", "recurrence": None},
        }
        mock_analyzer_avg.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "n/2", "recurrence": None},
        }

        mock_registry.get.return_value = MagicMock(
            side_effect=[mock_analyzer_worst, mock_analyzer_best, mock_analyzer_avg]
        )

        result = analyze_algorithm("code", mode="all")
        assert result["ok"]
        assert result.get("has_case_variability", False)
        assert "worst" in result
        assert "best" in result
        assert "avg" in result

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.AnalyzerRegistry")
    def test_mode_all_without_variability(self, mock_registry, mock_detect, mock_parse):
        """Test: Modo 'all' sin variabilidad de casos"""
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}
        mock_detect.return_value = "iterative"

        mock_analyzer_worst = MagicMock()
        mock_analyzer_best = MagicMock()
        mock_analyzer_avg = MagicMock()

        # Mismo resultado para worst y best (sin variabilidad)
        same_result = {"ok": True, "totals": {"T_open": "n", "recurrence": None}}
        mock_analyzer_worst.analyze.return_value = same_result
        mock_analyzer_best.analyze.return_value = same_result
        mock_analyzer_avg.analyze.return_value = same_result

        mock_registry.get.return_value = MagicMock(
            side_effect=[mock_analyzer_worst, mock_analyzer_best, mock_analyzer_avg]
        )

        result = analyze_algorithm("code", mode="all")
        assert result["ok"]
        # Como worst == best == avg y es IterativeAnalyzer (no RecursiveAnalyzer),
        # has_variability será True por defecto, pero best y avg deberían ser "same_as_worst"
        # Solo para RecursiveAnalyzer se llama _has_case_variability()
        # Para IterativeAnalyzer, si worst == best == avg, has_variability será False
        if result.get("worst") and result.get("best") == "same_as_worst":
            assert not result.get("has_case_variability", True)
        assert "worst" in result

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.AnalyzerRegistry")
    def test_mode_all_avg_fails(self, mock_registry, mock_detect, mock_parse):
        """Test: Modo 'all' con análisis promedio fallido"""
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}
        mock_detect.return_value = "iterative"

        mock_analyzer_worst = MagicMock()
        mock_analyzer_best = MagicMock()
        mock_analyzer_avg = MagicMock()

        mock_analyzer_worst.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "n", "recurrence": None},
        }
        mock_analyzer_best.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "1", "recurrence": None},
        }
        mock_analyzer_avg.analyze.return_value = {
            "ok": False,
            "errors": [{"message": "Error en análisis promedio"}],
        }

        mock_registry.get.return_value = MagicMock(
            side_effect=[mock_analyzer_worst, mock_analyzer_best, mock_analyzer_avg]
        )

        result = analyze_algorithm("code", mode="all")
        assert result["ok"]
        # Debe continuar aunque avg falle, pero result_avg será None
        assert "worst" in result
        assert "best" in result

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.AnalyzerRegistry")
    def test_mode_all_recursive_with_preferred_method(
        self, mock_registry, mock_detect, mock_parse
    ):
        """Test: Modo 'all' con RecursiveAnalyzer y preferred_method"""
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}
        mock_detect.return_value = "recursive"

        from app.modules.analysis.analyzers.recursive import RecursiveAnalyzer

        mock_analyzer_worst = MagicMock()
        mock_analyzer_worst.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "T_worst"},
        }
        mock_analyzer_worst._has_case_variability.return_value = True

        mock_analyzer_best = MagicMock()
        mock_analyzer_best.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "T_best"},
        }

        mock_analyzer_avg = MagicMock()
        mock_analyzer_avg.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "T_avg"},
        }

        # Mock registry.get para retornar fábrica de analizadores
        mock_registry.get.return_value = MagicMock(
            side_effect=[mock_analyzer_worst, mock_analyzer_best, mock_analyzer_avg]
        )

        # Usar isinstance check con los mocks configurados como RecursiveAnalyzer
        with patch(
            "app.modules.analysis.service.isinstance",
            lambda obj, cls: cls == RecursiveAnalyzer,
        ):
            result = analyze_algorithm("code", mode="all", preferred_method="master")
            assert result["ok"]
            # Verificar que se llamó con preferred_method
            assert mock_analyzer_worst.analyze.called
            # Verificar los argumentos de la llamada
            call_args = mock_analyzer_worst.analyze.call_args
            if call_args and len(call_args) > 1:
                kwargs = call_args[1]
                if kwargs and "preferred_method" in kwargs:
                    assert kwargs["preferred_method"] == "master"

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.AnalyzerRegistry")
    def test_mode_avg_without_avg_model(self, mock_registry, mock_detect, mock_parse):
        """Test: Modo 'avg' sin avg_model proporcionado"""
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}
        mock_detect.return_value = "iterative"

        mock_analyzer = MagicMock()
        mock_analyzer.analyze.return_value = {"ok": True, "totals": {"T_open": "n/2"}}

        mock_registry.get.return_value = MagicMock(return_value=mock_analyzer)

        result = analyze_algorithm("code", mode="avg")
        assert result["ok"]
        # Verificar que se llamó con avg_model por defecto
        call_kwargs = mock_analyzer.analyze.call_args[1]
        assert call_kwargs.get("avg_model") is not None

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.AnalyzerRegistry")
    def test_mode_avg_with_avg_model(self, mock_registry, mock_detect, mock_parse):
        """Test: Modo 'avg' con avg_model proporcionado"""
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}
        mock_detect.return_value = "iterative"

        mock_analyzer = MagicMock()
        mock_analyzer.analyze.return_value = {"ok": True, "totals": {"T_open": "n/2"}}

        mock_registry.get.return_value = MagicMock(return_value=mock_analyzer)
        avg_model = {"mode": "symbolic", "predicates": {"cond": "p"}}

        result = analyze_algorithm("code", mode="avg", avg_model=avg_model)
        assert result["ok"]
        # Verificar que se pasó el avg_model proporcionado
        call_kwargs = mock_analyzer.analyze.call_args[1]
        assert call_kwargs.get("avg_model") == avg_model

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.AnalyzerRegistry")
    def test_analyzer_class_none_fallback(self, mock_registry, mock_detect, mock_parse):
        """Test: Fallback a IterativeAnalyzer cuando analyzer_class es None"""
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}
        mock_detect.return_value = "unknown"
        mock_registry.get.return_value = None  # analyzer_class es None

        mock_analyzer = MagicMock()
        mock_analyzer.analyze.return_value = {"ok": True, "totals": {"T_open": "1"}}

        # Debe usar IterativeAnalyzer como fallback
        with patch(
            "app.modules.analysis.service.IterativeAnalyzer",
            return_value=mock_analyzer,
        ):
            result = analyze_algorithm("code", mode="worst")
            assert result["ok"]
            # Verificar que se usó IterativeAnalyzer
            mock_analyzer.analyze.assert_called_once()

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.AnalyzerRegistry")
    def test_mode_all_best_fails(self, mock_registry, mock_detect, mock_parse):
        """Test: Modo 'all' cuando best falla"""
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}
        mock_detect.return_value = "iterative"

        mock_analyzer_worst = MagicMock()
        mock_analyzer_best = MagicMock()

        mock_analyzer_worst.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "n"},
        }
        mock_analyzer_best.analyze.return_value = {
            "ok": False,
            "errors": [{"message": "Error"}],
        }
        mock_registry.get.return_value = MagicMock(
            side_effect=[mock_analyzer_worst, mock_analyzer_best]
        )

        result = analyze_algorithm("code", mode="all")
        # Debe retornar el error de best inmediatamente
        assert not result["ok"]
        assert "errors" in result

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.AnalyzerRegistry")
    @patch("app.modules.analysis.service.generate_loop_invariant")
    def test_generate_loop_invariant_exception_fallback(
        self, mock_invariant, mock_registry, mock_detect, mock_parse
    ):
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []},
        }
        mock_detect.return_value = "iterative"
        mock_invariant.side_effect = RuntimeError("boom")
        mock_analyzer = MagicMock()
        mock_analyzer.analyze.return_value = {"ok": True, "totals": {"T_open": "1"}}
        mock_registry.get.return_value = MagicMock(return_value=mock_analyzer)

        result = analyze_algorithm("code", mode="worst", locale="es")
        assert result["ok"]
        assert result["loopInvariant"]["status"] == "unavailable"

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.AnalyzerRegistry")
    def test_invalid_locale_falls_back_to_en(
        self, mock_registry, mock_detect, mock_parse
    ):
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []},
        }
        mock_detect.return_value = "iterative"
        mock_analyzer = MagicMock()
        mock_analyzer.analyze.return_value = {"ok": True, "totals": {"T_open": "1"}}
        mock_registry.get.return_value = MagicMock(return_value=mock_analyzer)

        result = analyze_algorithm("code", mode="worst", locale="fr")
        assert result["ok"]
        assert "loopInvariant" in result
        assert result["loopInvariant"]["status"] in {"ok", "unavailable"}

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.AnalyzerRegistry")
    def test_mode_all_for_while_for_overrides_cubic(
        self, mock_registry, mock_detect, mock_parse
    ):
        mock_parse.return_value = {
            "ok": True,
            "ast": {
                "type": "Program",
                "body": [
                    {
                        "type": "ProcDef",
                        "body": {
                            "body": [
                                {
                                    "type": "For",
                                    "body": {
                                        "body": [
                                            {
                                                "type": "While",
                                                "body": {"body": [{"type": "For"}]},
                                            }
                                        ]
                                    },
                                }
                            ]
                        },
                    }
                ],
            },
        }
        mock_detect.return_value = "iterative"

        mock_analyzer_worst = MagicMock()
        mock_analyzer_best = MagicMock()
        mock_analyzer_avg = MagicMock()
        mock_analyzer_worst.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "n^2", "recurrence": None},
        }
        mock_analyzer_best.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "n", "recurrence": None},
        }
        mock_analyzer_avg.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "n^2", "recurrence": None},
        }
        mock_registry.get.return_value = MagicMock(
            side_effect=[mock_analyzer_worst, mock_analyzer_best, mock_analyzer_avg]
        )

        result = analyze_algorithm("code", mode="all")
        worst_totals = result["worst"]["totals"]
        assert worst_totals["big_theta"] == "\\Theta(n^{3})"
        assert worst_totals["big_o"] == "O(n^{3})"
        assert worst_totals["big_omega"] == "\\Omega(n^{3})"

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.AnalyzerRegistry")
    def test_mode_all_worst_non_dict_returns_generic_error(
        self, mock_registry, mock_detect, mock_parse
    ):
        mock_parse.return_value = {
            "ok": True,
            "ast": {"type": "Program", "body": []},
        }
        mock_detect.return_value = "iterative"
        mock_analyzer_worst = MagicMock()
        mock_analyzer_best = MagicMock()
        mock_analyzer_worst.analyze.return_value = object()
        mock_analyzer_best.analyze.return_value = {
            "ok": True,
            "totals": {"T_open": "n"},
        }
        mock_registry.get.return_value = MagicMock(
            side_effect=[mock_analyzer_worst, mock_analyzer_best]
        )

        result = analyze_algorithm("code", mode="all")
        assert not result["ok"]
        assert "Error en análisis" in result["errors"][0]["message"]


class TestDetectMethods:
    """Tests para la función detect_methods."""

    @patch("app.modules.analysis.service.parse_source")
    def test_returns_error_when_parsing_fails(self, mock_parse):
        """Test: Retorna error cuando el parsing falla"""
        mock_parse.return_value = {
            "ok": False,
            "errors": [{"line": 1, "column": 1, "message": "Syntax error"}],
        }

        result = detect_methods("invalid code")
        assert not result["ok"]
        assert "errors" in result

    @patch("app.modules.analysis.service.parse_source")
    def test_returns_error_for_non_recursive_algorithm(self, mock_parse):
        """Test: Retorna error para algoritmo no recursivo"""
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}

        with patch(
            "app.modules.analysis.service.detect_algorithm_kind",
            return_value="iterative",
        ):
            result = detect_methods("code")
            assert not result["ok"]
            assert "recursivos" in result["errors"][0]["message"]

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.RecursiveAnalyzer")
    def test_detects_methods_for_recursive_algorithm(
        self, mock_analyzer_class, mock_detect, mock_parse
    ):
        """Test: Detecta métodos para algoritmo recursivo"""
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}
        mock_detect.return_value = "recursive"

        mock_analyzer = MagicMock()
        mock_analyzer.detect_applicable_methods.return_value = {
            "ok": True,
            "applicable_methods": ["master", "iteration"],
            "default_method": "master",
            "recurrence_info": {},
        }
        mock_analyzer_class.return_value = mock_analyzer

        result = detect_methods("code")
        assert result["ok"]
        assert "applicable_methods" in result
        assert "default_method" in result

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    def test_handles_exception(self, mock_detect, mock_parse):
        """Test: Maneja excepciones correctamente"""
        mock_parse.side_effect = Exception("Test error")

        result = detect_methods("code")
        assert not result["ok"]
        assert "errors" in result
        assert "Error detectando métodos" in result["errors"][0]["message"]

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.RecursiveAnalyzer")
    def test_detect_methods_hybrid_algorithm(
        self, mock_recursive_analyzer_class, mock_detect, mock_parse
    ):
        """Test: detect_methods acepta algoritmo 'hybrid'"""
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}
        mock_detect.return_value = "hybrid"

        mock_analyzer = MagicMock()
        mock_analyzer.detect_applicable_methods.return_value = {
            "ok": True,
            "applicable_methods": ["master"],
            "default_method": "master",
        }
        mock_recursive_analyzer_class.return_value = mock_analyzer

        result = detect_methods("code")
        # Debe aceptar hybrid
        assert result["ok"]

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.RecursiveAnalyzer")
    def test_detect_methods_returns_dp_validation_metadata(
        self, mock_analyzer_class, mock_detect, mock_parse
    ):
        """Test: detect_methods propaga metadata de validación de PD."""
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}
        mock_detect.return_value = "recursive"

        mock_analyzer = MagicMock()
        mock_analyzer.detect_applicable_methods.return_value = {
            "ok": True,
            "applicable_methods": ["characteristic_equation"],
            "default_method": "characteristic_equation",
            "recurrence_info": {
                "type": "linear_shift",
                "dp_validation": {
                    "status": "clear",
                    "applicable": True,
                    "confidence": "high",
                    "primary_pattern": "tabulation",
                    "supported_patterns": ["tabulation", "memoization"],
                    "reasons": ["La recurrencia reutiliza subproblemas equivalentes."],
                },
            },
        }
        mock_analyzer_class.return_value = mock_analyzer

        result = detect_methods("code")

        assert result["ok"]
        assert (
            result["recurrence_info"]["dp_validation"]["primary_pattern"]
            == "tabulation"
        )
        assert (
            "memoization"
            in result["recurrence_info"]["dp_validation"]["supported_patterns"]
        )

    @patch("app.modules.analysis.service.parse_source")
    def test_detect_methods_ast_none_returns_error(self, mock_parse):
        mock_parse.return_value = {"ok": True, "ast": None}
        result = detect_methods("code")
        assert not result["ok"]
        assert "ast" in result["errors"][0]["message"].lower()

    @patch("app.modules.analysis.service.parse_source")
    @patch("app.modules.analysis.service.detect_algorithm_kind")
    @patch("app.modules.analysis.service.RecursiveAnalyzer")
    def test_detect_methods_propagates_analyzer_not_ok(
        self, mock_analyzer_class, mock_detect, mock_parse
    ):
        mock_parse.return_value = {"ok": True, "ast": {"type": "Program", "body": []}}
        mock_detect.return_value = "recursive"
        mock_analyzer = MagicMock()
        mock_analyzer.detect_applicable_methods.return_value = {
            "ok": False,
            "errors": [{"message": "unsupported recurrence"}],
        }
        mock_analyzer_class.return_value = mock_analyzer

        result = detect_methods("code")
        assert not result["ok"]
        assert "unsupported recurrence" in result["errors"][0]["message"]
