"""
Tests unitarios para app.modules.analysis.visitors.if_visitor.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import unittest
from app.modules.analysis.analyzers.iterative import IterativeAnalyzer


class TestIfVisitor(unittest.TestCase):
    """Tests para IfVisitor."""

    def setUp(self):
        """Configuración inicial para cada test."""
        self.analyzer = IterativeAnalyzer()

    def test_visit_if_without_else(self):
        """Test: Visita IF sin ELSE"""
        node = {
            "type": "If",
            "pos": {"line": 2},
            "test": {"type": "binary", "left": {"type": "identifier", "name": "x"}, "op": ">", "right": {"type": "number", "value": 0}},
            "consequent": {
                "type": "Block",
                "body": [
                    {"type": "Assign", "pos": {"line": 3}, "target": {"type": "identifier", "name": "y"}, "value": {"type": "number", "value": 1}}
                ]
            }
        }
        self.analyzer.visitIf(node, mode="worst")
        self.assertGreater(len(self.analyzer.rows), 0)

    def test_visit_if_with_else(self):
        """Test: Visita IF con ELSE"""
        node = {
            "type": "If",
            "pos": {"line": 2},
            "test": {"type": "binary", "left": {"type": "identifier", "name": "x"}, "op": ">", "right": {"type": "number", "value": 0}},
            "consequent": {
                "type": "Block",
                "body": [
                    {"type": "Assign", "pos": {"line": 3}, "target": {"type": "identifier", "name": "y"}, "value": {"type": "number", "value": 1}}
                ]
            },
            "alternate": {
                "type": "Block",
                "body": [
                    {"type": "Assign", "pos": {"line": 4}, "target": {"type": "identifier", "name": "y"}, "value": {"type": "number", "value": 0}}
                ]
            }
        }
        self.analyzer.visitIf(node, mode="worst")
        self.assertGreater(len(self.analyzer.rows), 0)

    def test_expr_to_str_identifier(self):
        """Test: Convierte identificador a string"""
        expr = {"type": "identifier", "name": "x"}
        result = self.analyzer._expr_to_str(expr)
        self.assertEqual(result, "x")

    def test_expr_to_str_number(self):
        """Test: Convierte número a string"""
        expr = {"type": "number", "value": 42}
        result = self.analyzer._expr_to_str(expr)
        self.assertEqual(result, "42")

    def test_expr_to_str_binary(self):
        """Test: Convierte expresión binaria a string"""
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "a"},
            "operator": "+",
            "right": {"type": "number", "value": 1}
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIn("a", result)
        self.assertIn("1", result)

    def test_expr_to_str_index(self):
        """Test: Convierte expresión de índice a string"""
        expr = {
            "type": "index",
            "target": {"type": "identifier", "name": "A"},
            "index": {"type": "identifier", "name": "i"}
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIn("A", result)
        self.assertIn("i", result)

    def test_expr_to_str_none(self):
        """Test: Maneja expresión None"""
        result = self.analyzer._expr_to_str(None)
        self.assertEqual(result, "")

    def test_expr_to_str_string(self):
        """Test: Maneja string directamente"""
        result = self.analyzer._expr_to_str("test")
        self.assertEqual(result, "test")

    def test_expr_to_str_complex(self):
        """Test: Convierte expresión compleja a string"""
        expr = {
            "type": "binary",
            "operator": "&&",
            "left": {
                "type": "binary",
                "operator": ">",
                "left": {"type": "identifier", "name": "x"},
                "right": {"type": "number", "value": 0}
            },
            "right": {
                "type": "binary",
                "operator": "<",
                "left": {"type": "identifier", "name": "y"},
                "right": {"type": "number", "value": 10}
            }
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)

    def test_expr_to_str_unary(self):
        """Test: Convierte expresión unaria a string"""
        expr = {
            "type": "unary",
            "operator": "!",
            "arg": {"type": "identifier", "name": "flag"}
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIsInstance(result, str)

    def test_visit_if_with_nested_if(self):
        """Test: Visita IF anidado"""
        node = {
            "type": "If",
            "pos": {"line": 2},
            "test": {"type": "binary", "left": {"type": "identifier", "name": "x"}, "op": ">", "right": {"type": "number", "value": 0}},
            "consequent": {
                "type": "Block",
                "body": [
                    {
                        "type": "If",
                        "pos": {"line": 3},
                        "test": {"type": "binary", "left": {"type": "identifier", "name": "y"}, "op": ">", "right": {"type": "number", "value": 0}},
                        "consequent": {
                            "type": "Block",
                            "body": [
                                {"type": "Assign", "pos": {"line": 4}, "target": {"type": "identifier", "name": "z"}, "value": {"type": "number", "value": 1}}
                            ]
                        }
                    }
                ]
            }
        }
        self.analyzer.visitIf(node, mode="worst")
        self.assertGreater(len(self.analyzer.rows), 0)

