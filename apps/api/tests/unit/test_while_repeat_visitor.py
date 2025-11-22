"""
Tests unitarios para app.modules.analysis.visitors.while_repeat_visitor.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import unittest
from app.modules.analysis.analyzers.iterative import IterativeAnalyzer
from sympy import Symbol, Integer


class TestWhileRepeatVisitor(unittest.TestCase):
    """Tests para WhileRepeatVisitor."""

    def setUp(self):
        """Configuración inicial para cada test."""
        self.analyzer = IterativeAnalyzer()

    def test_iter_sym_while(self):
        """Test: Genera símbolo de iteración para WHILE"""
        result = self.analyzer.iter_sym("while", 5)
        self.assertEqual(result, "t_{while_5}")

    def test_iter_sym_repeat(self):
        """Test: Genera símbolo de iteración para REPEAT"""
        result = self.analyzer.iter_sym("repeat", 10)
        self.assertEqual(result, "t_{repeat_10}")

    def test_visit_while_simple(self):
        """Test: Visita bucle WHILE simple"""
        node = {
            "type": "While",
            "pos": {"line": 2},
            "test": {
                "type": "binary",
                "left": {"type": "identifier", "name": "i"},
                "op": "<",
                "right": {"type": "identifier", "name": "n"}
            },
            "body": {
                "type": "Block",
                "body": [
                    {"type": "Assign", "pos": {"line": 3}, "target": {"type": "identifier", "name": "i"}, "value": {"type": "binary", "left": {"type": "identifier", "name": "i"}, "op": "+", "right": {"type": "number", "value": 1}}}
                ]
            }
        }
        self.analyzer.visitWhile(node, mode="worst")
        self.assertGreater(len(self.analyzer.rows), 0)

    def test_visit_repeat(self):
        """Test: Visita bucle REPEAT"""
        node = {
            "type": "Repeat",
            "pos": {"line": 2},
            "test": {
                "type": "binary",
                "left": {"type": "identifier", "name": "i"},
                "op": ">",
                "right": {"type": "number", "value": 0}
            },
            "body": {
                "type": "Block",
                "body": [
                    {"type": "Assign", "pos": {"line": 3}, "target": {"type": "identifier", "name": "i"}, "value": {"type": "binary", "left": {"type": "identifier", "name": "i"}, "op": "-", "right": {"type": "number", "value": 1}}}
                ]
            }
        }
        self.analyzer.visitRepeat(node, mode="worst")
        self.assertGreater(len(self.analyzer.rows), 0)

    def test_str_to_sympy(self):
        """Test: Convierte string a SymPy"""
        result = self.analyzer._str_to_sympy("n")
        self.assertIsNotNone(result)
        self.assertIsInstance(result, (Symbol, Integer))

    def test_str_to_sympy_empty(self):
        """Test: Maneja string vacío"""
        result = self.analyzer._str_to_sympy("")
        self.assertEqual(result, Integer(1))

    def test_expr_to_str_identifier(self):
        """Test: Convierte identificador a string"""
        expr = {"type": "identifier", "name": "x"}
        result = self.analyzer._expr_to_str(expr)
        self.assertEqual(result, "x")

    def test_expr_to_str_binary(self):
        """Test: Convierte expresión binaria a string"""
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "a"},
            "op": "+",
            "right": {"type": "number", "value": 1}
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIn("a", result)
        self.assertIn("1", result)

    def test_is_simple_constant(self):
        """Test: Detecta constantes simples"""
        self.assertTrue(self.analyzer._is_simple_constant("1"))
        self.assertTrue(self.analyzer._is_simple_constant("42"))
        self.assertFalse(self.analyzer._is_simple_constant("n"))
        self.assertFalse(self.analyzer._is_simple_constant("n + 1"))

    def test_is_simple_constant_float(self):
        """Test: Detecta constantes flotantes"""
        self.assertTrue(self.analyzer._is_simple_constant("3.14"))
        self.assertTrue(self.analyzer._is_simple_constant("0.5"))

    def test_is_simple_constant_negative(self):
        """Test: Detecta constantes negativas"""
        self.assertTrue(self.analyzer._is_simple_constant("-1"))
        self.assertTrue(self.analyzer._is_simple_constant("-42"))

    def test_is_simple_constant_invalid(self):
        """Test: Rechaza expresiones que no son constantes"""
        self.assertFalse(self.analyzer._is_simple_constant("x + 1"))
        self.assertFalse(self.analyzer._is_simple_constant(""))
        self.assertFalse(self.analyzer._is_simple_constant("abc"))

    def test_str_to_sympy_complex(self):
        """Test: Convierte string complejo a SymPy"""
        result = self.analyzer._str_to_sympy("n + 1")
        self.assertIsNotNone(result)

    def test_str_to_sympy_with_symbols(self):
        """Test: Convierte string con símbolos a SymPy"""
        result = self.analyzer._str_to_sympy("i + j")
        self.assertIsNotNone(result)

    def test_str_to_sympy_error_handling(self):
        """Test: Maneja errores en conversión a SymPy"""
        # String que no se puede parsear
        result = self.analyzer._str_to_sympy("invalid!!!")
        # Debe retornar Integer(1) como fallback
        self.assertEqual(result, Integer(1))

    def test_expr_to_str_complex(self):
        """Test: Convierte expresión compleja a string"""
        expr = {
            "type": "binary",
            "operator": "&&",
            "left": {
                "type": "binary",
                "operator": "<",
                "left": {"type": "identifier", "name": "i"},
                "right": {"type": "identifier", "name": "n"}
            },
            "right": {
                "type": "binary",
                "operator": ">",
                "left": {"type": "identifier", "name": "x"},
                "right": {"type": "number", "value": 0}
            }
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)

