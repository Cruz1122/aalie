"""
Tests de integración para algoritmos complejos con casos raros.
Verifica el análisis de bucles anidados variables, WHILE complejos, IF anidados, etc.
"""

import pytest
from app.modules.analysis.analyzers.iterative import IterativeAnalyzer


class TestComplexAlgorithms:
    """Tests para algoritmos complejos con casos raros."""
    
    def _create_nested_loops_variable_limits_ast(self):
        """Crea AST para bucles anidados con límites variables (FOR i=1 TO n, FOR j=i TO n)"""
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
                                "type": "For",
                                "var": "j",
                                "start": {"type": "identifier", "name": "i"},
                                "end": {"type": "identifier", "name": "n"},
                                "body": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Assign",
                                            "target": {"type": "identifier", "name": "x"},
                                            "value": {
                                                "type": "binary",
                                                "left": {"type": "identifier", "name": "i"},
                                                "operator": "+",
                                                "right": {"type": "identifier", "name": "j"}
                                            },
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
    
    def test_nested_loops_variable_limits_all_cases(self):
        """Test: Bucles anidados con límites variables - todos los casos"""
        analyzer_worst = IterativeAnalyzer()
        analyzer_best = IterativeAnalyzer()
        analyzer_avg = IterativeAnalyzer()
        ast = self._create_nested_loops_variable_limits_ast()
        
        result_worst = analyzer_worst.analyze(ast, mode="worst")
        result_best = analyzer_best.analyze(ast, mode="best")
        result_avg = analyzer_avg.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        for result in [result_worst, result_best, result_avg]:
            assert result.get("ok", False), "Análisis debe ser exitoso"
            assert "byLine" in result, "Debe tener byLine"
            assert "totals" in result, "Debe tener totals"
            assert "T_open" in result["totals"], "Debe tener T_open"
    
    def _create_complex_while_ast(self):
        """Crea AST para WHILE con condiciones complejas (AND/OR múltiples)"""
        return {
            "type": "Program",
            "body": [
                {
                    "type": "Assign",
                    "target": {"type": "identifier", "name": "i"},
                    "value": {"type": "number", "value": 1},
                    "pos": {"line": 1}
                },
                {
                    "type": "While",
                    "test": {
                        "type": "binary",
                        "op": "and",
                        "left": {
                            "type": "binary",
                            "op": "<=",
                            "left": {"type": "identifier", "name": "i"},
                            "right": {"type": "identifier", "name": "n"}
                        },
                        "right": {
                            "type": "binary",
                            "op": ">",
                            "left": {
                                "type": "index",
                                "target": {"type": "identifier", "name": "A"},
                                "index": {"type": "identifier", "name": "i"}
                            },
                            "right": {"type": "number", "value": 0}
                        }
                    },
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "Assign",
                                "target": {"type": "identifier", "name": "i"},
                                "value": {
                                    "type": "binary",
                                    "left": {"type": "identifier", "name": "i"},
                                    "operator": "+",
                                    "right": {"type": "number", "value": 1}
                                },
                                "pos": {"line": 3}
                            }
                        ]
                    },
                    "pos": {"line": 2}
                }
            ]
        }
    
    def test_complex_while_all_cases(self):
        """Test: WHILE con condiciones complejas - todos los casos"""
        analyzer_worst = IterativeAnalyzer()
        analyzer_best = IterativeAnalyzer()
        analyzer_avg = IterativeAnalyzer()
        ast = self._create_complex_while_ast()
        
        result_worst = analyzer_worst.analyze(ast, mode="worst")
        result_best = analyzer_best.analyze(ast, mode="best")
        result_avg = analyzer_avg.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        for result in [result_worst, result_best, result_avg]:
            assert result.get("ok", False), "Análisis debe ser exitoso"
            assert "byLine" in result, "Debe tener byLine"
            assert "totals" in result, "Debe tener totals"
            assert "T_open" in result["totals"], "Debe tener T_open"
    
    def _create_complex_indexed_array_ast(self):
        """Crea AST para arrays con indexación compleja (A[i+j], A[i*2])"""
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
                                "type": "For",
                                "var": "j",
                                "start": {"type": "number", "value": 1},
                                "end": {"type": "identifier", "name": "n"},
                                "body": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Assign",
                                            "target": {
                                                "type": "index",
                                                "target": {"type": "identifier", "name": "A"},
                                                "index": {
                                                    "type": "binary",
                                                    "left": {"type": "identifier", "name": "i"},
                                                    "operator": "+",
                                                    "right": {"type": "identifier", "name": "j"}
                                                }
                                            },
                                            "value": {
                                                "type": "binary",
                                                "left": {
                                                    "type": "index",
                                                    "target": {"type": "identifier", "name": "A"},
                                                    "index": {
                                                        "type": "binary",
                                                        "left": {"type": "identifier", "name": "i"},
                                                        "operator": "*",
                                                        "right": {"type": "number", "value": 2}
                                                    }
                                                },
                                                "operator": "+",
                                                "right": {
                                                    "type": "index",
                                                    "target": {"type": "identifier", "name": "A"},
                                                    "index": {"type": "identifier", "name": "j"}
                                                }
                                            },
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
    
    def test_complex_indexed_array_all_cases(self):
        """Test: Arrays con indexación compleja - todos los casos"""
        analyzer_worst = IterativeAnalyzer()
        analyzer_best = IterativeAnalyzer()
        analyzer_avg = IterativeAnalyzer()
        ast = self._create_complex_indexed_array_ast()
        
        result_worst = analyzer_worst.analyze(ast, mode="worst")
        result_best = analyzer_best.analyze(ast, mode="best")
        result_avg = analyzer_avg.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        for result in [result_worst, result_best, result_avg]:
            assert result.get("ok", False), "Análisis debe ser exitoso"
            assert "byLine" in result, "Debe tener byLine"
            assert "totals" in result, "Debe tener totals"
            assert "T_open" in result["totals"], "Debe tener T_open"
    
    def _create_nested_if_in_for_ast(self):
        """Crea AST para IF anidados dentro de FOR con múltiples ramas"""
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
                                    "op": ">",
                                    "left": {
                                        "type": "index",
                                        "target": {"type": "identifier", "name": "A"},
                                        "index": {"type": "identifier", "name": "i"}
                                    },
                                    "right": {"type": "number", "value": 0}
                                },
                                "consequent": {
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
                                                "right": {"type": "number", "value": 100}
                                            },
                                            "consequent": {
                                                "type": "Block",
                                                "body": [
                                                    {
                                                        "type": "Assign",
                                                        "target": {"type": "identifier", "name": "x"},
                                                        "value": {"type": "number", "value": 1},
                                                        "pos": {"line": 3}
                                                    }
                                                ]
                                            },
                                            "alternate": {
                                                "type": "Block",
                                                "body": [
                                                    {
                                                        "type": "Assign",
                                                        "target": {"type": "identifier", "name": "x"},
                                                        "value": {"type": "number", "value": 2},
                                                        "pos": {"line": 4}
                                                    }
                                                ]
                                            },
                                            "pos": {"line": 3}
                                        }
                                    ]
                                },
                                "alternate": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Assign",
                                            "target": {"type": "identifier", "name": "x"},
                                            "value": {"type": "number", "value": 0},
                                            "pos": {"line": 5}
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
    
    def test_nested_if_in_for_all_cases(self):
        """Test: IF anidados dentro de FOR - todos los casos"""
        analyzer_worst = IterativeAnalyzer()
        analyzer_best = IterativeAnalyzer()
        analyzer_avg = IterativeAnalyzer()
        ast = self._create_nested_if_in_for_ast()
        
        result_worst = analyzer_worst.analyze(ast, mode="worst")
        result_best = analyzer_best.analyze(ast, mode="best")
        result_avg = analyzer_avg.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        for result in [result_worst, result_best, result_avg]:
            assert result.get("ok", False), "Análisis debe ser exitoso"
            assert "byLine" in result, "Debe tener byLine"
            assert "totals" in result, "Debe tener totals"
            assert "T_open" in result["totals"], "Debe tener T_open"
        
        # Verificar que worst case selecciona ramas máximas
        # Verificar que best case selecciona ramas mínimas
        # Verificar que avg case aplica probabilidades

