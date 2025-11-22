# tests/integration/test_iterative_analyzer.py
"""
Tests de integración exhaustivos para IterativeAnalyzer.
Verifica el flujo completo desde AST hasta resultado final para múltiples algoritmos
y casos (best/worst/average).
"""

import pytest
from app.modules.analysis.analyzers.iterative import IterativeAnalyzer


class TestIterativeAnalyzer:
    """Tests de integración completa para IterativeAnalyzer."""
    
    def test_full_workflow_triangular_loops(self):
        """Test: Flujo completo con bucles anidados triangulares"""
        analyzer = IterativeAnalyzer()
        
        # AST de algoritmo simple con bucles anidados
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "For",
                    "var": "i",
                    "start": {"type": "number", "value": 1},
                    "end": {"type": "identifier", "name": "n"},
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "For",
                                "var": "j",
                                "start": {"type": "number", "value": 1},
                                "end": {"type": "identifier", "name": "i"},
                                "body": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Assign",
                                            "target": {"type": "identifier", "name": "x"},
                                            "value": {"type": "number", "value": 1},
                                            "pos": {"line": 2}
                                        }
                                    ]
                                },
                                "pos": {"line": 2}
                            }
                        ]
                    },
                    "pos": {"line": 1}
                }
            ]
        }
        
        result = analyzer.analyze(ast, mode="worst")
        
        # Verificaciones básicas
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert "totals" in result, "Debe tener totals"
        assert "T_open" in result["totals"], "Debe tener T_open"
        
        # Verificar que todas las filas tienen los campos necesarios
        for row in result["byLine"]:
            assert "line" in row, "Debe tener line"
            assert "kind" in row, "Debe tener kind"
            assert "ck" in row, "Debe tener ck"
            assert "count_raw" in row, "Debe tener count_raw"
            assert "count" in row, "Debe tener count"
            assert isinstance(row["count_raw"], str), "count_raw debe ser string"
            assert isinstance(row["count"], str), "count debe ser string"
            assert "unknown" not in row["count"].lower(), f"count no debe ser 'unknown': {row['count']}"
        
        # Verificar que T_open está generado
        t_open = result["totals"]["T_open"]
        assert isinstance(t_open, str), "T_open debe ser string"
        assert len(t_open) > 0, "T_open no debe estar vacío"

    def test_normalize_string(self):
        """Test: _normalize_string normaliza strings con formato especial"""
        analyzer = IterativeAnalyzer()
        result = analyzer._normalize_string("i=1\\ldotsn")
        assert result == "i=1..n"
    
    def test_normalize_string_with_space(self):
        """Test: _normalize_string normaliza strings con espacio"""
        analyzer = IterativeAnalyzer()
        result = analyzer._normalize_string("i=1\\ldots n")
        assert result == "i=1..n"
    
    def test_normalize_string_empty(self):
        """Test: _normalize_string maneja string vacío"""
        analyzer = IterativeAnalyzer()
        result = analyzer._normalize_string("")
        assert result == ""
    
    def test_normalize_string_none(self):
        """Test: _normalize_string maneja None"""
        analyzer = IterativeAnalyzer()
        result = analyzer._normalize_string(None)
        assert result is None
    
    def test_expr_to_str_binary_no_operator(self):
        """Test: _expr_to_str usa fallback para operador faltante"""
        analyzer = IterativeAnalyzer()
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "a"},
            "right": {"type": "identifier", "name": "b"}
            # Sin operator
        }
        result = analyzer._expr_to_str(expr)
        # Debe usar "-" como fallback
        assert "a" in result
        assert "b" in result
    
    def test_expr_to_str_unary(self):
        """Test: _expr_to_str maneja expresión unaria"""
        analyzer = IterativeAnalyzer()
        expr = {
            "type": "unary",
            "operator": "-",
            "arg": {"type": "number", "value": 5}
        }
        result = analyzer._expr_to_str(expr)
        assert isinstance(result, str)
    
    def test_expr_to_str_unknown_type(self):
        """Test: _expr_to_str maneja tipo desconocido (fallback)"""
        analyzer = IterativeAnalyzer()
        expr = {"type": "unknown_type", "value": 42}
        result = analyzer._expr_to_str(expr)
        assert isinstance(result, str)
    
    def test_visit_proc_def(self):
        """Test: visitProcDef visita definición de procedimiento"""
        analyzer = IterativeAnalyzer()
        node = {
            "type": "ProcDef",
            "pos": {"line": 1},
            "name": "test",
            "params": [{"name": "n"}],
            "body": {
                "type": "Block",
                "body": [
                    {"type": "Assign", "pos": {"line": 2}, "target": {"type": "identifier", "name": "x"}, "value": {"type": "number", "value": 1}}
                ]
            }
        }
        analyzer.visitProcDef(node)
        assert len(analyzer.rows) > 0
    
    def test_visit_other(self):
        """Test: visitOther visita nodo desconocido"""
        analyzer = IterativeAnalyzer()
        node = {
            "type": "UnknownType",
            "pos": {"line": 5}
        }
        initial_rows = len(analyzer.rows)
        analyzer.visitOther(node)
        assert len(analyzer.rows) > initial_rows
    
    def test_analyze_with_invalid_ast(self):
        """Test: analyze maneja AST inválido"""
        analyzer = IterativeAnalyzer()
        # AST con estructura incorrecta
        ast = None
        result = analyzer.analyze(ast, mode="worst")
        # Debe manejar el error y retornar resultado válido o error
        assert result is not None
    
    def test_latex_to_sympy_expr_simple(self):
        """Test: _latex_to_sympy_expr convierte expresión LaTeX simple"""
        analyzer = IterativeAnalyzer()
        result = analyzer._latex_to_sympy_expr("n + 1")
        assert result is not None
    
    def test_latex_to_sympy_expr_with_cdot(self):
        """Test: _latex_to_sympy_expr maneja \\cdot"""
        analyzer = IterativeAnalyzer()
        result = analyzer._latex_to_sympy_expr("n \\cdot 2")
        assert result is not None
    
    def test_latex_to_sympy_expr_with_frac(self):
        """Test: _latex_to_sympy_expr maneja fracciones LaTeX"""
        analyzer = IterativeAnalyzer()
        result = analyzer._latex_to_sympy_expr("\\frac{n}{2}")
        assert result is not None
    
    def test_latex_to_sympy_expr_with_log(self):
        """Test: _latex_to_sympy_expr maneja logaritmos LaTeX"""
        analyzer = IterativeAnalyzer()
        result = analyzer._latex_to_sympy_expr("n \\log(n)")
        assert result is not None
    
    def test_latex_to_sympy_expr_with_power(self):
        """Test: _latex_to_sympy_expr maneja potencias LaTeX"""
        analyzer = IterativeAnalyzer()
        result = analyzer._latex_to_sympy_expr("n^2")
        assert result is not None
    
    def test_latex_to_sympy_expr_with_power_braces(self):
        """Test: _latex_to_sympy_expr maneja potencias con llaves"""
        analyzer = IterativeAnalyzer()
        result = analyzer._latex_to_sympy_expr("n^{3}")
        assert result is not None
    
    def test_latex_to_sympy_expr_error(self):
        """Test: _latex_to_sympy_expr maneja errores"""
        analyzer = IterativeAnalyzer()
        # Expresión que causará error
        result = analyzer._latex_to_sympy_expr("invalid!!!")
        assert result is None
    
    def test_calculate_t_polynomial_fallback(self):
        """Test: _calculate_t_polynomial_fallback calcula T_polynomial"""
        analyzer = IterativeAnalyzer()
        # Agregar algunas filas
        analyzer.add_row(1, "assign", "C_1", "n", "test")
        analyzer.add_row(2, "assign", "C_2", "n", "test")
        analyzer.add_row(3, "assign", "C_3", "1", "test")
        analyzer._calculate_t_polynomial_fallback()
        assert analyzer.t_polynomial is not None
        assert isinstance(analyzer.t_polynomial, str)
        assert len(analyzer.t_polynomial) > 0
    
    def test_calculate_t_polynomial_fallback_single_ck(self):
        """Test: _calculate_t_polynomial_fallback con un solo C_k por término"""
        analyzer = IterativeAnalyzer()
        analyzer.add_row(1, "assign", "C_1", "n", "test")
        analyzer._calculate_t_polynomial_fallback()
        assert analyzer.t_polynomial is not None
        assert "C_1" in analyzer.t_polynomial
    
    def test_calculate_t_polynomial_fallback_multiple_ck(self):
        """Test: _calculate_t_polynomial_fallback con múltiples C_k por término"""
        analyzer = IterativeAnalyzer()
        analyzer.add_row(1, "assign", "C_1", "n", "test")
        analyzer.add_row(2, "assign", "C_2", "n", "test")
        analyzer._calculate_t_polynomial_fallback()
        assert analyzer.t_polynomial is not None
        # Debe agrupar C_1 y C_2 juntos
        assert "C_1" in analyzer.t_polynomial
        assert "C_2" in analyzer.t_polynomial


class TestCommonAlgorithms:
    """Tests para algoritmos comunes."""
    
    def _create_linear_search_ast(self):
        """Crea AST para búsqueda lineal"""
        return {
            "type": "Program",
            "body": [
                {
                    "type": "For",
                    "var": "i",
                    "start": {"type": "number", "value": 1},
                    "end": {"type": "identifier", "name": "n"},
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "If",
                                "test": {
                                    "type": "binary",
                                    "op": "=",
                                    "left": {
                                        "type": "index",
                                        "target": {"type": "identifier", "name": "A"},
                                        "index": {"type": "identifier", "name": "i"}
                                    },
                                    "right": {"type": "identifier", "name": "x"}
                                },
                                "consequent": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Return",
                                            "value": {"type": "identifier", "name": "i"},
                                            "pos": {"line": 3}
                                        }
                                    ]
                                },
                                "alternate": None,
                                "pos": {"line": 2}
                            }
                        ]
                    },
                    "pos": {"line": 1}
                },
                {
                    "type": "Return",
                    "value": {"type": "number", "value": -1},
                    "pos": {"line": 4}
                }
            ]
        }
    
    def test_linear_search_worst_case(self):
        """Test: Búsqueda lineal - peor caso (O(n))"""
        analyzer = IterativeAnalyzer()
        ast = self._create_linear_search_ast()
        
        result = analyzer.analyze(ast, mode="worst")
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert "totals" in result, "Debe tener totals"
        assert "T_open" in result["totals"], "Debe tener T_open"
        
        # En worst case, el IF debe elegir la rama con RETURN (más costosa)
        # Verificar que todas las filas tienen count
        for row in result["byLine"]:
            assert "count" in row, f"Fila {row.get('line')} debe tener count"
            assert "count_raw" in row, f"Fila {row.get('line')} debe tener count_raw"
    
    def test_linear_search_best_case(self):
        """Test: Búsqueda lineal - mejor caso (O(1))"""
        analyzer = IterativeAnalyzer()
        ast = self._create_linear_search_ast()
        
        result = analyzer.analyze(ast, mode="best")
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert "totals" in result, "Debe tener totals"
        assert "T_open" in result["totals"], "Debe tener T_open"
        
        # En best case, el IF debe elegir la rama mínima o el early return debe terminar rápido
        for row in result["byLine"]:
            assert "count" in row, f"Fila {row.get('line')} debe tener count"
    
    def test_linear_search_avg_case(self):
        """Test: Búsqueda lineal - caso promedio (O(n/2))"""
        analyzer = IterativeAnalyzer()
        ast = self._create_linear_search_ast()
        
        result = analyzer.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert "totals" in result, "Debe tener totals"
        
        # Verificar que caso promedio tiene expectedRuns y avg_model_info
        for row in result["byLine"]:
            assert "expectedRuns" in row, f"Fila {row.get('line')} debe tener expectedRuns en avg case"
        
        assert "avg_model_info" in result["totals"], "Debe tener avg_model_info"
        assert "A_of_n" in result["totals"], "Debe tener A_of_n para caso promedio"
    
    def _create_factorial_ast(self):
        """Crea AST para factorial iterativo"""
        return {
            "type": "Program",
            "body": [
                {
                    "type": "Assign",
                    "target": {"type": "identifier", "name": "resultado"},
                    "value": {"type": "number", "value": 1},
                    "pos": {"line": 1}
                },
                {
                    "type": "For",
                    "var": "i",
                    "start": {"type": "number", "value": 2},
                    "end": {"type": "identifier", "name": "n"},
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "Assign",
                                "target": {"type": "identifier", "name": "resultado"},
                                "value": {
                                    "type": "binary",
                                    "left": {"type": "identifier", "name": "resultado"},
                                    "operator": "*",
                                    "right": {"type": "identifier", "name": "i"}
                                },
                                "pos": {"line": 3}
                            }
                        ]
                    },
                    "pos": {"line": 2}
                },
                {
                    "type": "Return",
                    "value": {"type": "identifier", "name": "resultado"},
                    "pos": {"line": 4}
                }
            ]
        }
    
    def test_factorial_worst_case(self):
        """Test: Factorial iterativo - peor caso (O(n))"""
        analyzer = IterativeAnalyzer()
        ast = self._create_factorial_ast()
        
        result = analyzer.analyze(ast, mode="worst")
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert "totals" in result, "Debe tener totals"
        assert "T_open" in result["totals"], "Debe tener T_open"
        
        # Factorial es O(n) en todos los casos
        for row in result["byLine"]:
            assert "count" in row, f"Fila {row.get('line')} debe tener count"
    
    def test_factorial_best_case(self):
        """Test: Factorial iterativo - mejor caso (O(n))"""
        analyzer = IterativeAnalyzer()
        ast = self._create_factorial_ast()
        
        result = analyzer.analyze(ast, mode="best")
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert "totals" in result, "Debe tener totals"
        assert "T_open" in result["totals"], "Debe tener T_open"
    
    def test_factorial_avg_case(self):
        """Test: Factorial iterativo - caso promedio (O(n))"""
        analyzer = IterativeAnalyzer()
        ast = self._create_factorial_ast()
        
        result = analyzer.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        
        for row in result["byLine"]:
            assert "expectedRuns" in row, f"Fila {row.get('line')} debe tener expectedRuns"
    
    def _create_array_sum_ast(self):
        """Crea AST para suma de array"""
        return {
            "type": "Program",
            "body": [
                {
                    "type": "Assign",
                    "target": {"type": "identifier", "name": "suma"},
                    "value": {"type": "number", "value": 0},
                    "pos": {"line": 1}
                },
                {
                    "type": "For",
                    "var": "i",
                    "start": {"type": "number", "value": 1},
                    "end": {"type": "identifier", "name": "n"},
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "Assign",
                                "target": {"type": "identifier", "name": "suma"},
                                "value": {
                                    "type": "binary",
                                    "left": {"type": "identifier", "name": "suma"},
                                    "operator": "+",
                                    "right": {
                                        "type": "index",
                                        "target": {"type": "identifier", "name": "A"},
                                        "index": {"type": "identifier", "name": "i"}
                                    }
                                },
                                "pos": {"line": 3}
                            }
                        ]
                    },
                    "pos": {"line": 2}
                },
                {
                    "type": "Return",
                    "value": {"type": "identifier", "name": "suma"},
                    "pos": {"line": 4}
                }
            ]
        }
    
    def test_array_sum_all_cases(self):
        """Test: Suma de array - todos los casos (O(n))"""
        analyzer_worst = IterativeAnalyzer()
        analyzer_best = IterativeAnalyzer()
        analyzer_avg = IterativeAnalyzer()
        ast = self._create_array_sum_ast()
        
        result_worst = analyzer_worst.analyze(ast, mode="worst")
        result_best = analyzer_best.analyze(ast, mode="best")
        result_avg = analyzer_avg.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        for result in [result_worst, result_best, result_avg]:
            assert result.get("ok", False), "Análisis debe ser exitoso"
            assert "byLine" in result, "Debe tener byLine"
            assert "totals" in result, "Debe tener totals"
            assert "T_open" in result["totals"], "Debe tener T_open"
        
        # Verificar caso promedio
        for row in result_avg["byLine"]:
            assert "expectedRuns" in row, "Debe tener expectedRuns en avg case"
    
    def _create_array_max_ast(self):
        """Crea AST para máximo de array"""
        return {
            "type": "Program",
            "body": [
                {
                    "type": "Assign",
                    "target": {"type": "identifier", "name": "maximo"},
                    "value": {
                        "type": "index",
                        "target": {"type": "identifier", "name": "A"},
                        "index": {"type": "number", "value": 1}
                    },
                    "pos": {"line": 1}
                },
                {
                    "type": "For",
                    "var": "i",
                    "start": {"type": "number", "value": 2},
                    "end": {"type": "identifier", "name": "n"},
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "If",
                                "test": {
                                    "type": "binary",
                                    "op": ">",
                                    "left": {
                                        "type": "index",
                                        "target": {"type": "identifier", "name": "A"},
                                        "index": {"type": "identifier", "name": "i"}
                                    },
                                    "right": {"type": "identifier", "name": "maximo"}
                                },
                                "consequent": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Assign",
                                            "target": {"type": "identifier", "name": "maximo"},
                                            "value": {
                                                "type": "index",
                                                "target": {"type": "identifier", "name": "A"},
                                                "index": {"type": "identifier", "name": "i"}
                                            },
                                            "pos": {"line": 3}
                                        }
                                    ]
                                },
                                "alternate": None,
                                "pos": {"line": 2}
                            }
                        ]
                    },
                    "pos": {"line": 2}
                },
                {
                    "type": "Return",
                    "value": {"type": "identifier", "name": "maximo"},
                    "pos": {"line": 4}
                }
            ]
        }
    
    def test_array_max_all_cases(self):
        """Test: Máximo de array - todos los casos"""
        analyzer_worst = IterativeAnalyzer()
        analyzer_best = IterativeAnalyzer()
        analyzer_avg = IterativeAnalyzer()
        ast = self._create_array_max_ast()
        
        result_worst = analyzer_worst.analyze(ast, mode="worst")
        result_best = analyzer_best.analyze(ast, mode="best")
        result_avg = analyzer_avg.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        for result in [result_worst, result_best, result_avg]:
            assert result.get("ok", False), "Análisis debe ser exitoso"
            assert "byLine" in result, "Debe tener byLine"
            assert "totals" in result, "Debe tener totals"
            assert "T_open" in result["totals"], "Debe tener T_open"
        
        # Verificar caso promedio
        for row in result_avg["byLine"]:
            assert "expectedRuns" in row, "Debe tener expectedRuns en avg case"
    
    def _create_binary_search_ast(self):
        """Crea AST para búsqueda binaria iterativa"""
        return {
            "type": "Program",
            "body": [
                {
                    "type": "Assign",
                    "target": {"type": "identifier", "name": "izq"},
                    "value": {"type": "number", "value": 1},
                    "pos": {"line": 1}
                },
                {
                    "type": "Assign",
                    "target": {"type": "identifier", "name": "der"},
                    "value": {"type": "identifier", "name": "n"},
                    "pos": {"line": 2}
                },
                {
                    "type": "While",
                    "test": {
                        "type": "binary",
                        "op": "<=",
                        "left": {"type": "identifier", "name": "izq"},
                        "right": {"type": "identifier", "name": "der"}
                    },
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "Assign",
                                "target": {"type": "identifier", "name": "mitad"},
                                "value": {
                                    "type": "binary",
                                    "left": {
                                        "type": "binary",
                                        "left": {"type": "identifier", "name": "izq"},
                                        "operator": "+",
                                        "right": {"type": "identifier", "name": "der"}
                                    },
                                    "operator": "/",
                                    "right": {"type": "number", "value": 2}
                                },
                                "pos": {"line": 4}
                            },
                            {
                                "type": "If",
                                "test": {
                                    "type": "binary",
                                    "op": "=",
                                    "left": {
                                        "type": "index",
                                        "target": {"type": "identifier", "name": "A"},
                                        "index": {"type": "identifier", "name": "mitad"}
                                    },
                                    "right": {"type": "identifier", "name": "x"}
                                },
                                "consequent": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Return",
                                            "value": {"type": "identifier", "name": "mitad"},
                                            "pos": {"line": 6}
                                        }
                                    ]
                                },
                                "alternate": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "If",
                                            "test": {
                                                "type": "binary",
                                                "op": "<",
                                                "left": {
                                                    "type": "index",
                                                    "target": {"type": "identifier", "name": "A"},
                                                    "index": {"type": "identifier", "name": "mitad"}
                                                },
                                                "right": {"type": "identifier", "name": "x"}
                                            },
                                            "consequent": {
                                                "type": "Block",
                                                "body": [
                                                    {
                                                        "type": "Assign",
                                                        "target": {"type": "identifier", "name": "izq"},
                                                        "value": {
                                                            "type": "binary",
                                                            "left": {"type": "identifier", "name": "mitad"},
                                                            "operator": "+",
                                                            "right": {"type": "number", "value": 1}
                                                        },
                                                        "pos": {"line": 8}
                                                    }
                                                ]
                                            },
                                            "alternate": {
                                                "type": "Block",
                                                "body": [
                                                    {
                                                        "type": "Assign",
                                                        "target": {"type": "identifier", "name": "der"},
                                                        "value": {
                                                            "type": "binary",
                                                            "left": {"type": "identifier", "name": "mitad"},
                                                            "operator": "-",
                                                            "right": {"type": "number", "value": 1}
                                                        },
                                                        "pos": {"line": 10}
                                                    }
                                                ]
                                            },
                                            "pos": {"line": 7}
                                        }
                                    ]
                                },
                                "pos": {"line": 5}
                            }
                        ]
                    },
                    "pos": {"line": 3}
                },
                {
                    "type": "Return",
                    "value": {"type": "number", "value": -1},
                    "pos": {"line": 11}
                }
            ]
        }
    
    def test_binary_search_all_cases(self):
        """Test: Búsqueda binaria iterativa - todos los casos"""
        analyzer_worst = IterativeAnalyzer()
        analyzer_best = IterativeAnalyzer()
        analyzer_avg = IterativeAnalyzer()
        ast = self._create_binary_search_ast()
        
        result_worst = analyzer_worst.analyze(ast, mode="worst")
        result_best = analyzer_best.analyze(ast, mode="best")
        result_avg = analyzer_avg.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        for result in [result_worst, result_best, result_avg]:
            assert result.get("ok", False), "Análisis debe ser exitoso"
            assert "byLine" in result, "Debe tener byLine"
            assert "totals" in result, "Debe tener totals"
            assert "T_open" in result["totals"], "Debe tener T_open"
        
        # Verificar caso promedio
        for row in result_avg["byLine"]:
            assert "expectedRuns" in row, "Debe tener expectedRuns en avg case"

