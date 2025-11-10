# tests/integration/test_iterative_analyzer.py
"""
Tests de integración para IterativeAnalyzer.
Verifica el flujo completo desde AST hasta resultado final.
"""

import pytest
from app.analysis.iterative_analyzer import IterativeAnalyzer


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

