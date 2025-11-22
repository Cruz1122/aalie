# tests/integration/test_sympy_integration.py
"""
Tests de integración básica con SymPy.
Verifica que los componentes trabajan juntos correctamente.
"""

import pytest
from app.modules.analysis.analyzers.iterative import IterativeAnalyzer


class TestSymPyIntegration:
    """Tests de integración para verificar que todo funciona con SymPy."""
    
    def test_for_visitor_simple_loop(self):
        """Test: Analizar un bucle FOR simple con IterativeAnalyzer"""
        analyzer = IterativeAnalyzer()
        
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
        
        result = analyzer.analyze(ast, mode="worst")
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert len(result["byLine"]) > 0, "Debe tener al menos una fila"
        
        # Verificar que las filas tienen los campos correctos
        for row in result["byLine"]:
            assert "count_raw" in row, "Debe tener count_raw"
            assert "count" in row, "Debe tener count"
            assert isinstance(row["count_raw"], str), "count_raw debe ser string"
            assert isinstance(row["count"], str), "count debe ser string"
    
    def test_for_visitor_nested_loops(self):
        """Test: Analizar bucles FOR anidados"""
        analyzer = IterativeAnalyzer()
        
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
                                "end": {"type": "identifier", "name": "n"},
                                "body": {
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
                                "pos": {"line": 2}
                            }
                        ]
                    },
                    "pos": {"line": 1}
                }
            ]
        }
        
        result = analyzer.analyze(ast, mode="worst")
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        
        # Verificar que hay filas con sumatorias anidadas
        has_sum = False
        for row in result["byLine"]:
            if row.get("kind") == "assign":
                count_raw = row.get("count_raw", "")
                if "sum" in count_raw.lower() or "\\sum" in count_raw.lower():
                    has_sum = True
                    break
        
        assert has_sum, "Debe tener sumatorias anidadas en las filas de asignación"

