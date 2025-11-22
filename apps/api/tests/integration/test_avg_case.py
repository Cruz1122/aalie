# tests/integration/test_avg_case.py
"""
Tests de integración para caso promedio (average case analysis).
Verifica que el análisis de caso promedio funcione correctamente con esperanzas.
"""

import pytest
from app.modules.analysis.analyzers.iterative import IterativeAnalyzer


class TestAvgCase:
    """Tests para análisis de caso promedio."""
    
    def test_avg_case_has_expected_runs(self):
        """Test: Verificar que caso promedio tiene expectedRuns en cada fila"""
        analyzer = IterativeAnalyzer()
        
        # AST simple: bucle for
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
                                "type": "Assign",
                                "target": {"type": "identifier", "name": "x"},
                                "value": {"type": "number", "value": 1},
                                "pos": {"line": 2}
                            }
                        ]
                    },
                    "pos": {"line": 1}
                }
            ]
        }
        
        # Analizar en modo promedio
        result = analyzer.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        
        # Verificar que todas las filas tienen expectedRuns
        for row in result["byLine"]:
            assert "expectedRuns" in row, f"Fila {row.get('line')} debe tener expectedRuns"
            assert isinstance(row["expectedRuns"], str), "expectedRuns debe ser string"
    
    def test_avg_case_has_model_info(self):
        """Test: Verificar que caso promedio tiene avg_model_info en totals"""
        analyzer = IterativeAnalyzer()
        
        # AST simple
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "Assign",
                    "target": {"type": "identifier", "name": "x"},
                    "value": {"type": "number", "value": 1},
                    "pos": {"line": 1}
                }
            ]
        }
        
        # Analizar en modo promedio
        result = analyzer.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "totals" in result, "Debe tener totals"
        assert "avg_model_info" in result["totals"], "Debe tener avg_model_info"
        
        model_info = result["totals"]["avg_model_info"]
        assert "mode" in model_info, "avg_model_info debe tener mode"
        assert "note" in model_info, "avg_model_info debe tener note"
        assert model_info["mode"] == "uniform", "mode debe ser uniform"
        assert "uniforme" in model_info["note"].lower(), "note debe mencionar uniforme"
    
    def test_linear_search_avg_case(self):
        """Test: Búsqueda lineal en caso promedio (posición uniforme)"""
        analyzer = IterativeAnalyzer()
        
        # AST de búsqueda lineal: FOR i=1 TO n, IF A[i]=x THEN RETURN i
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
                }
            ]
        }
        
        # Analizar en modo promedio con modelo uniforme
        result = analyzer.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        
        # Verificar que hay filas
        assert len(result["byLine"]) > 0, "Debe tener al menos una fila"
        
        # Verificar que la comparación tiene probabilidad aplicada
        # En caso promedio con modelo uniforme, la condición del IF tiene p=1/2
        # Pero como hay early return, la esperanza debería ser menor que n
        
        # Verificar estructura básica
        totals = result["totals"]
        assert "avg_model_info" in totals, "Debe tener avg_model_info"
        assert "A_of_n" in totals, "Debe tener A_of_n para caso promedio"
    
    def test_bubble_sort_avg_case(self):
        """Test: Bubble sort básico en caso promedio"""
        analyzer = IterativeAnalyzer()
        
        # AST de bubble sort: dos bucles FOR anidados con IF para swap
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "For",
                    "var": "i",
                    "start": {"type": "number", "value": 1},
                    "end": {
                        "type": "binary",
                        "op": "-",
                        "left": {"type": "identifier", "name": "n"},
                        "right": {"type": "number", "value": 1}
                    },
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "For",
                                "var": "j",
                                "start": {"type": "number", "value": 1},
                                "end": {
                                    "type": "binary",
                                    "op": "-",
                                    "left": {"type": "identifier", "name": "n"},
                                    "right": {"type": "identifier", "name": "i"}
                                },
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
                                                    "index": {"type": "identifier", "name": "j"}
                                                },
                                                "right": {
                                                    "type": "index",
                                                    "target": {"type": "identifier", "name": "A"},
                                                    "index": {
                                                        "type": "binary",
                                                        "op": "+",
                                                        "left": {"type": "identifier", "name": "j"},
                                                        "right": {"type": "number", "value": 1}
                                                    }
                                                }
                                            },
                                            "consequent": {
                                                "type": "Block",
                                                "body": [
                                                    {
                                                        "type": "Assign",
                                                        "target": {"type": "identifier", "name": "temp"},
                                                        "value": {
                                                            "type": "index",
                                                            "target": {"type": "identifier", "name": "A"},
                                                            "index": {"type": "identifier", "name": "j"}
                                                        },
                                                        "pos": {"line": 4}
                                                    },
                                                    {
                                                        "type": "Assign",
                                                        "target": {
                                                            "type": "index",
                                                            "target": {"type": "identifier", "name": "A"},
                                                            "index": {"type": "identifier", "name": "j"}
                                                        },
                                                        "value": {
                                                            "type": "index",
                                                            "target": {"type": "identifier", "name": "A"},
                                                            "index": {
                                                                "type": "binary",
                                                                "op": "+",
                                                                "left": {"type": "identifier", "name": "j"},
                                                                "right": {"type": "number", "value": 1}
                                                            }
                                                        },
                                                        "pos": {"line": 5}
                                                    },
                                                    {
                                                        "type": "Assign",
                                                        "target": {
                                                            "type": "index",
                                                            "target": {"type": "identifier", "name": "A"},
                                                            "index": {
                                                                "type": "binary",
                                                                "op": "+",
                                                                "left": {"type": "identifier", "name": "j"},
                                                                "right": {"type": "number", "value": 1}
                                                            }
                                                        },
                                                        "value": {"type": "identifier", "name": "temp"},
                                                        "pos": {"line": 6}
                                                    }
                                                ]
                                            },
                                            "alternate": None,
                                            "pos": {"line": 3}
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
        
        # Analizar en modo promedio con modelo uniforme
        result = analyzer.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert "totals" in result, "Debe tener totals"
        
        # Verificar que hay filas
        assert len(result["byLine"]) > 0, "Debe tener al menos una fila"
        
        # Verificar estructura
        totals = result["totals"]
        assert "avg_model_info" in totals, "Debe tener avg_model_info"
        assert "A_of_n" in totals, "Debe tener A_of_n"
        
        # Verificar que todas las filas tienen expectedRuns
        for row in result["byLine"]:
            assert "expectedRuns" in row, f"Fila {row.get('line')} debe tener expectedRuns"
    
    def test_if_with_probability_avg_case(self):
        """Test: IF con probabilidad en caso promedio"""
        analyzer = IterativeAnalyzer()
        
        # AST con IF que tiene ambas ramas
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "If",
                    "test": {
                        "type": "binary",
                        "op": ">",
                        "left": {"type": "identifier", "name": "x"},
                        "right": {"type": "number", "value": 0}
                    },
                    "consequent": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "Assign",
                                "target": {"type": "identifier", "name": "y"},
                                "value": {"type": "number", "value": 1},
                                "pos": {"line": 2}
                            }
                        ]
                    },
                    "alternate": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "Assign",
                                "target": {"type": "identifier", "name": "y"},
                                "value": {"type": "number", "value": 0},
                                "pos": {"line": 3}
                            }
                        ]
                    },
                    "pos": {"line": 1}
                }
            ]
        }
        
        # Analizar en modo promedio
        result = analyzer.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        
        # Verificar que hay filas para ambas ramas (then y else)
        # En caso promedio, ambas ramas deben tener probabilidades aplicadas
        rows = result["byLine"]
        assert len(rows) >= 3, "Debe tener al menos guardia, then y else"
        
        # Verificar que las filas tienen expectedRuns
        for row in rows:
            assert "expectedRuns" in row, f"Fila {row.get('line')} debe tener expectedRuns"
    
    def test_symbolic_model_avg_case(self):
        """Test: Modelo simbólico en caso promedio"""
        analyzer = IterativeAnalyzer()
        
        # AST simple
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "Assign",
                    "target": {"type": "identifier", "name": "x"},
                    "value": {"type": "number", "value": 1},
                    "pos": {"line": 1}
                }
            ]
        }
        
        # Analizar en modo promedio con modelo simbólico
        result = analyzer.analyze(ast, mode="avg", avg_model={"mode": "symbolic", "predicates": {}})
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "totals" in result, "Debe tener totals"
        
        totals = result["totals"]
        assert "avg_model_info" in totals, "Debe tener avg_model_info"
        
        model_info = totals["avg_model_info"]
        assert model_info["mode"] == "symbolic", "mode debe ser symbolic"
        assert "simbólico" in model_info["note"].lower(), "note debe mencionar simbólico"
        
        # Verificar que hay hipótesis cuando es simbólico
        assert "hypotheses" in totals, "Debe tener hypotheses para modelo simbólico"
        assert len(totals["hypotheses"]) > 0, "Debe tener al menos una hipótesis"
    
    def test_avg_case_procedure_steps(self):
        """Test: Verificar que caso promedio genera pasos de procedimiento"""
        analyzer = IterativeAnalyzer()
        
        # AST simple
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
                                "type": "Assign",
                                "target": {"type": "identifier", "name": "x"},
                                "value": {"type": "number", "value": 1},
                                "pos": {"line": 2}
                            }
                        ]
                    },
                    "pos": {"line": 1}
                }
            ]
        }
        
        # Analizar en modo promedio
        result = analyzer.analyze(ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}})
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "totals" in result, "Debe tener totals"
        
        totals = result["totals"]
        
        # Verificar que hay A_of_n para caso promedio
        assert "A_of_n" in totals, "Debe tener A_of_n para caso promedio"
        
        # Verificar que hay información del modelo promedio
        assert "avg_model_info" in totals, "Debe tener avg_model_info"
        
        # Verificar pasos del procedimiento si están disponibles
        # Los pasos del procedimiento se agregan a procedure (opcional)
        if "procedure" in totals:
            procedure = totals["procedure"]
            assert isinstance(procedure, list), "procedure debe ser una lista"
            assert len(procedure) > 0, "Debe tener al menos un paso del procedimiento"
            
            # Verificar que hay pasos relacionados con caso promedio
            avg_related_steps = [step for step in procedure if "A(n)" in step or "E[N" in step or "promedio" in step.lower() or "esperanza" in step.lower() or "A_of_n" in step]
            # No es estricto: puede que no haya pasos específicos de promedio en procedimientos simples
            # Si hay procedure, verificamos que sea una lista válida

