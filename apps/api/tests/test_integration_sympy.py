# apps/api/tests/test_integration_sympy.py

import unittest
from app.analysis.iterative_analyzer import IterativeAnalyzer
from sympy import Symbol, Sum, Integer


class TestIntegrationSymPy(unittest.TestCase):
    """Tests de integración para verificar que todo funciona con SymPy."""
    
    def setUp(self):
        self.analyzer = IterativeAnalyzer()
    
    def test_simple_for_loop(self):
        """Test: Analizar un bucle FOR simple"""
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
        
        result = self.analyzer.analyze(ast, mode="worst")
        
        self.assertTrue(result.get("ok", False))
        self.assertIn("byLine", result)
        self.assertGreater(len(result["byLine"]), 0)
        
        # Verificar que las filas tienen count_raw_expr
        for row in result["byLine"]:
            self.assertIn("count_raw", row)
            self.assertIn("count", row)
    
    def test_nested_for_loops(self):
        """Test: Analizar bucles FOR anidados"""
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
        
        result = self.analyzer.analyze(ast, mode="worst")
        
        self.assertTrue(result.get("ok", False))
        self.assertIn("byLine", result)
        
        # Verificar que hay filas con sumatorias anidadas
        for row in result["byLine"]:
            if row.get("kind") == "assign":
                # Debe tener una sumatoria anidada
                count_raw = row.get("count_raw", "")
                self.assertIn("sum", count_raw.lower())


if __name__ == '__main__':
    unittest.main()

