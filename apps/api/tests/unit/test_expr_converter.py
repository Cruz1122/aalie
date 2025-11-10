# tests/unit/test_expr_converter.py

import unittest
from app.analysis.expr_converter import ExprConverter
from sympy import Symbol, Integer, sympify


class TestExprConverter(unittest.TestCase):
    """Tests para ExprConverter."""
    
    def setUp(self):
        self.converter = ExprConverter("n")
    
    def test_number(self):
        """Test: Convertir número"""
        expr = 5
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(5))
    
    def test_string_number(self):
        """Test: Convertir string numérico"""
        expr = "10"
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(10))
    
    def test_identifier(self):
        """Test: Convertir identificador"""
        expr = {"type": "identifier", "name": "n"}
        result = self.converter.ast_to_sympy(expr)
        self.assertIsInstance(result, Symbol)
        self.assertEqual(str(result), "n")
    
    def test_binary_add(self):
        """Test: Convertir operación binaria suma"""
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 2},
            "right": {"type": "number", "value": 3},
            "operator": "+"
        }
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(5))
    
    def test_binary_subtract(self):
        """Test: Convertir operación binaria resta"""
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "n"},
            "right": {"type": "number", "value": 1},
            "operator": "-"
        }
        result = self.converter.ast_to_sympy(expr)
        expected = Symbol("n", integer=True, positive=True) - Integer(1)
        self.assertEqual(str(result), str(expected))
    
    def test_none(self):
        """Test: Convertir None"""
        result = self.converter.ast_to_sympy(None)
        self.assertEqual(result, Integer(0))


if __name__ == '__main__':
    unittest.main()

