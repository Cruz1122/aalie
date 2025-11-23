"""
Tests unitarios para app.modules.analysis.visitors.for_visitor.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import unittest
from app.modules.analysis.analyzers.iterative import IterativeAnalyzer
from sympy import Symbol, Integer


class TestForVisitor(unittest.TestCase):
    """Tests para ForVisitor."""

    def setUp(self):
        """Configuración inicial para cada test."""
        self.analyzer = IterativeAnalyzer()

    def test_visit_for_simple_range(self):
        """Test: Visita bucle For con rango simple"""
        node = {
            "type": "For",
            "pos": {"line": 2},
            "variable": "i",
            "start": {"type": "number", "value": 1},
            "end": {"type": "identifier", "name": "n"},
            "body": [
                {"type": "Assign", "pos": {"line": 3}, "target": {"type": "identifier", "name": "x"}, "value": {"type": "number", "value": 1}}
            ]
        }
        self.analyzer.visitFor(node, mode="worst")
        self.assertGreater(len(self.analyzer.rows), 0)

    def test_visit_for_with_nested_loop(self):
        """Test: Visita bucle For anidado"""
        node = {
            "type": "For",
            "pos": {"line": 2},
            "variable": "i",
            "start": {"type": "number", "value": 1},
            "end": {"type": "identifier", "name": "n"},
            "body": [
                {
                    "type": "For",
                    "pos": {"line": 3},
                    "variable": "j",
                    "start": {"type": "number", "value": 1},
                    "end": {"type": "identifier", "name": "n"},
                    "body": [
                        {"type": "Assign", "pos": {"line": 4}, "target": {"type": "identifier", "name": "x"}, "value": {"type": "number", "value": 1}}
                    ]
                }
            ]
        }
        self.analyzer.visitFor(node, mode="worst")
        self.assertGreater(len(self.analyzer.rows), 0)

    def test_expr_to_sympy(self):
        """Test: Convierte expresión a SymPy"""
        expr = {"type": "identifier", "name": "n"}
        result = self.analyzer._expr_to_sympy(expr)
        self.assertIsNotNone(result)

    def test_str_to_sympy(self):
        """Test: Convierte string a SymPy"""
        result = self.analyzer._str_to_sympy("n")
        self.assertIsNotNone(result)
        self.assertIsInstance(result, (Symbol, Integer))

    def test_str_to_sympy_empty(self):
        """Test: Maneja string vacío"""
        result = self.analyzer._str_to_sympy("")
        self.assertEqual(result, Integer(1))

    def test_ast_expr_to_readable_str_identifier(self):
        """Test: Convierte identificador a string legible"""
        expr = {"type": "identifier", "name": "x"}
        result = self.analyzer._ast_expr_to_readable_str(expr)
        self.assertEqual(result, "x")

    def test_ast_expr_to_readable_str_number(self):
        """Test: Convierte número a string legible"""
        expr = {"type": "number", "value": 42}
        result = self.analyzer._ast_expr_to_readable_str(expr)
        self.assertEqual(result, "42")

    def test_ast_expr_to_readable_str_binary(self):
        """Test: Convierte expresión binaria a string legible"""
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "a"},
            "op": "+",
            "right": {"type": "number", "value": 1}
        }
        result = self.analyzer._ast_expr_to_readable_str(expr)
        self.assertIn("a", result)
        self.assertIn("1", result)

    def test_has_return_in_body(self):
        """Test: Detecta return en el cuerpo del bucle"""
        body = {
            "type": "Block",
            "body": [
                {"type": "Return", "value": {"type": "number", "value": 1}}
            ]
        }
        result = self.analyzer._has_return_in_body(body)
        self.assertTrue(result)

    def test_has_return_in_body_no_return(self):
        """Test: No detecta return cuando no existe"""
        body = {
            "type": "Block",
            "body": [
                {"type": "Assign", "target": {"type": "identifier", "name": "x"}, "value": {"type": "number", "value": 1}}
            ]
        }
        result = self.analyzer._has_return_in_body(body)
        self.assertFalse(result)

    def test_has_return_in_body_in_if_then(self):
        """Test: Detecta return en rama THEN de IF"""
        body = {
            "type": "if",
            "condition": {"type": "binary", "operator": ">", "left": {}, "right": {}},
            "consequent": {
                "type": "block",
                "body": [
                    {"type": "Return", "value": {"type": "number", "value": 1}}
                ]
            }
        }
        result = self.analyzer._has_return_in_body(body)
        self.assertTrue(result)

    def test_has_return_in_body_in_if_else(self):
        """Test: Detecta return en rama ELSE de IF"""
        body = {
            "type": "if",
            "condition": {"type": "binary", "operator": ">", "left": {}, "right": {}},
            "alternate": {
                "type": "block",
                "body": [
                    {"type": "Return", "value": {"type": "number", "value": 0}}
                ]
            }
        }
        result = self.analyzer._has_return_in_body(body)
        self.assertTrue(result)

    def test_has_return_in_body_in_nested_for(self):
        """Test: Detecta return en bucle FOR anidado"""
        body = {
            "type": "for",
            "variable": "i",
            "start": {"value": 1},
            "end": {"value": 10},
            "body": {
                "type": "block",
                "body": [
                    {"type": "Return", "value": {"type": "number", "value": 1}}
                ]
            }
        }
        result = self.analyzer._has_return_in_body(body)
        self.assertTrue(result)

    def test_has_return_in_body_none(self):
        """Test: Maneja None en body"""
        result = self.analyzer._has_return_in_body(None)
        self.assertFalse(result)

    def test_has_return_in_body_not_dict(self):
        """Test: Maneja body que no es dict"""
        result = self.analyzer._has_return_in_body("not_a_dict")
        self.assertFalse(result)

    def test_str_to_sympy_complex(self):
        """Test: Convierte string complejo a SymPy"""
        result = self.analyzer._str_to_sympy("n + 1")
        self.assertIsNotNone(result)

    def test_str_to_sympy_with_whitespace(self):
        """Test: Maneja string con espacios en blanco"""
        result = self.analyzer._str_to_sympy("  n  ")
        self.assertIsNotNone(result)

    def test_expr_to_str_complex(self):
        """Test: Convierte expresión compleja a string"""
        expr = {
            "type": "binary",
            "operator": "*",
            "left": {
                "type": "binary",
                "operator": "+",
                "left": {"type": "identifier", "name": "a"},
                "right": {"type": "identifier", "name": "b"}
            },
            "right": {"type": "identifier", "name": "c"}
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)

    def test_visit_for_with_return(self):
        """Test: visitFor con return en cuerpo (best case)"""
        node = {
            "type": "For",
            "pos": {"line": 2},
            "variable": "i",
            "start": {"type": "number", "value": 1},
            "end": {"type": "identifier", "name": "n"},
            "body": {
                "type": "Block",
                "body": [
                    {"type": "Return", "value": {"type": "number", "value": 1}}
                ]
            }
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitFor(node, mode="best")
        self.assertGreater(len(self.analyzer.rows), initial_rows)

    def test_visit_for_avg_case_with_return(self):
        """Test: visitFor en modo avg con return"""
        node = {
            "type": "For",
            "pos": {"line": 2},
            "variable": "i",
            "start": {"type": "number", "value": 1},
            "end": {"type": "identifier", "name": "n"},
            "body": {
                "type": "Block",
                "body": [
                    {"type": "Return", "value": {"type": "number", "value": 1}}
                ]
            }
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitFor(node, mode="avg")
        self.assertGreater(len(self.analyzer.rows), initial_rows)

    def test_visit_for_complex_start_end(self):
        """Test: visitFor con expresiones complejas en start y end"""
        node = {
            "type": "For",
            "pos": {"line": 2},
            "variable": "i",
            "start": {"type": "binary", "operator": "+", "left": {"type": "number", "value": 1}, "right": {"type": "number", "value": 1}},
            "end": {"type": "binary", "operator": "-", "left": {"type": "identifier", "name": "n"}, "right": {"type": "number", "value": 1}},
            "body": {
                "type": "Block",
                "body": [{"type": "Assign", "pos": {"line": 3}, "target": {"type": "identifier", "name": "x"}, "value": {"type": "number", "value": 1}}]
            }
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitFor(node, mode="worst")
        self.assertGreater(len(self.analyzer.rows), initial_rows)

    def test_visit_for_no_body(self):
        """Test: visitFor sin cuerpo"""
        node = {
            "type": "For",
            "pos": {"line": 2},
            "variable": "i",
            "start": {"type": "number", "value": 1},
            "end": {"type": "identifier", "name": "n"},
            "body": None
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitFor(node, mode="worst")
        # Debe agregar la cabecera del for
        self.assertGreater(len(self.analyzer.rows), initial_rows)

    def test_visit_for_body_is_list(self):
        """Test: visitFor con body como lista"""
        node = {
            "type": "For",
            "pos": {"line": 2},
            "variable": "i",
            "start": {"type": "number", "value": 1},
            "end": {"type": "identifier", "name": "n"},
            "body": [
                {"type": "Assign", "pos": {"line": 3}, "target": {"type": "identifier", "name": "x"}, "value": {"type": "number", "value": 1}}
            ]
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitFor(node, mode="worst")
        self.assertGreater(len(self.analyzer.rows), initial_rows)

