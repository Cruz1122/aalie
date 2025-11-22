# tests/integration/test_intermediate_algorithms.py
"""
Tests de integración para algoritmos de complejidad intermedia.
Verifica el análisis de algoritmos como selection sort, bubble sort, insertion sort, etc.
"""

import pytest
from app.modules.analysis.analyzers.iterative import IterativeAnalyzer


class TestIntermediateAlgorithms:
    """Tests para algoritmos de complejidad intermedia."""
    
    def _create_selection_sort_ast(self):
        """Crea AST para selection sort"""
        return {
            "type": "Program",
            "body": [
                {
                    "type": "For",
                    "var": "i",
                    "start": {"type": "number", "value": 1},
                    "end": {
                        "type": "binary",
                        "left": {"type": "identifier", "name": "n"},
                        "operator": "-",
                        "right": {"type": "number", "value": 1}
                    },
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "Assign",
                                "target": {"type": "identifier", "name": "min_idx"},
                                "value": {"type": "identifier", "name": "i"},
                                "pos": {"line": 2}
                            },
                            {
                                "type": "For",
                                "var": "j",
                                "start": {
                                    "type": "binary",
                                    "left": {"type": "identifier", "name": "i"},
                                    "operator": "+",
                                    "right": {"type": "number", "value": 1}
                                },
                                "end": {"type": "identifier", "name": "n"},
                                "body": {
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
                                                    "index": {"type": "identifier", "name": "j"}
                                                },
                                                "right": {
                                                    "type": "index",
                                                    "target": {"type": "identifier", "name": "A"},
                                                    "index": {"type": "identifier", "name": "min_idx"}
                                                }
                                            },
                                            "consequent": {
                                                "type": "Block",
                                                "body": [
                                                    {
                                                        "type": "Assign",
                                                        "target": {"type": "identifier", "name": "min_idx"},
                                                        "value": {"type": "identifier", "name": "j"},
                                                        "pos": {"line": 4}
                                                    }
                                                ]
                                            },
                                            "alternate": None,
                                            "pos": {"line": 3}
                                        }
                                    ]
                                },
                                "pos": {"line": 3}
                            },
                            {
                                "type": "Assign",
                                "target": {"type": "identifier", "name": "temp"},
                                "value": {
                                    "type": "index",
                                    "target": {"type": "identifier", "name": "A"},
                                    "index": {"type": "identifier", "name": "i"}
                                },
                                "pos": {"line": 5}
                            },
                            {
                                "type": "Assign",
                                "target": {
                                    "type": "index",
                                    "target": {"type": "identifier", "name": "A"},
                                    "index": {"type": "identifier", "name": "i"}
                                },
                                "value": {
                                    "type": "index",
                                    "target": {"type": "identifier", "name": "A"},
                                    "index": {"type": "identifier", "name": "min_idx"}
                                },
                                "pos": {"line": 6}
                            },
                            {
                                "type": "Assign",
                                "target": {
                                    "type": "index",
                                    "target": {"type": "identifier", "name": "A"},
                                    "index": {"type": "identifier", "name": "min_idx"}
                                },
                                "value": {"type": "identifier", "name": "temp"},
                                "pos": {"line": 7}
                            }
                        ]
                    },
                    "pos": {"line": 1}
                }
            ]
        }
    
    def test_selection_sort_all_cases(self):
        """Test: Selection sort - todos los casos (O(n²))"""
        analyzer_worst = IterativeAnalyzer()
        analyzer_best = IterativeAnalyzer()
        analyzer_avg = IterativeAnalyzer()
        ast = self._create_selection_sort_ast()
        
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
    
    def _create_matrix_multiplication_ast(self):
        """Crea AST para multiplicación de matrices (O(n³))"""
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
                                                "target": {
                                                    "type": "index",
                                                    "target": {"type": "identifier", "name": "C"},
                                                    "index": {"type": "identifier", "name": "i"}
                                                },
                                                "index": {"type": "identifier", "name": "j"}
                                            },
                                            "value": {"type": "number", "value": 0},
                                            "pos": {"line": 3}
                                        },
                                        {
                                            "type": "For",
                                            "var": "k",
                                            "start": {"type": "number", "value": 1},
                                            "end": {"type": "identifier", "name": "n"},
                                            "body": {
                                                "type": "Block",
                                                "body": [
                                                    {
                                                        "type": "Assign",
                                                        "target": {
                                                            "type": "index",
                                                            "target": {
                                                                "type": "index",
                                                                "target": {"type": "identifier", "name": "C"},
                                                                "index": {"type": "identifier", "name": "i"}
                                                            },
                                                            "index": {"type": "identifier", "name": "j"}
                                                        },
                                                        "value": {
                                                            "type": "binary",
                                                            "left": {
                                                                "type": "index",
                                                                "target": {
                                                                    "type": "index",
                                                                    "target": {"type": "identifier", "name": "C"},
                                                                    "index": {"type": "identifier", "name": "i"}
                                                                },
                                                                "index": {"type": "identifier", "name": "j"}
                                                            },
                                                            "operator": "+",
                                                            "right": {
                                                                "type": "binary",
                                                                "left": {
                                                                    "type": "index",
                                                                    "target": {
                                                                        "type": "index",
                                                                        "target": {"type": "identifier", "name": "A"},
                                                                        "index": {"type": "identifier", "name": "i"}
                                                                    },
                                                                    "index": {"type": "identifier", "name": "k"}
                                                                },
                                                                "operator": "*",
                                                                "right": {
                                                                    "type": "index",
                                                                    "target": {
                                                                        "type": "index",
                                                                        "target": {"type": "identifier", "name": "B"},
                                                                        "index": {"type": "identifier", "name": "k"}
                                                                    },
                                                                    "index": {"type": "identifier", "name": "j"}
                                                                }
                                                            }
                                                        },
                                                        "pos": {"line": 5}
                                                    }
                                                ]
                                            },
                                            "pos": {"line": 4}
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
    
    def test_matrix_multiplication_all_cases(self):
        """Test: Multiplicación de matrices - todos los casos (O(n³))"""
        analyzer_worst = IterativeAnalyzer()
        analyzer_best = IterativeAnalyzer()
        analyzer_avg = IterativeAnalyzer()
        ast = self._create_matrix_multiplication_ast()
        
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

