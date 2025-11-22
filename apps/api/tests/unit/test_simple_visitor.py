"""
Tests unitarios para app.modules.analysis.visitors.simple_visitor.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import unittest
from app.modules.analysis.analyzers.iterative import IterativeAnalyzer


class TestSimpleVisitor(unittest.TestCase):
    """Tests para SimpleVisitor."""

    def setUp(self):
        """Configuración inicial para cada test."""
        self.analyzer = IterativeAnalyzer()

    def test_visit_assign(self):
        """Test: Visita asignación"""
        node = {
            "type": "Assign",
            "pos": {"line": 2},
            "target": {"type": "identifier", "name": "x"},
            "value": {"type": "number", "value": 1}
        }
        self.analyzer.visitAssign(node)
        self.assertGreater(len(self.analyzer.rows), 0)

    def test_visit_call_stmt(self):
        """Test: Visita llamada a procedimiento"""
        node = {
            "type": "CallStmt",
            "pos": {"line": 2},
            "name": "print",
            "args": [
                {"type": "identifier", "name": "x"}
            ]
        }
        self.analyzer.visitCallStmt(node)
        self.assertGreater(len(self.analyzer.rows), 0)

    def test_visit_return(self):
        """Test: Visita return"""
        node = {
            "type": "Return",
            "pos": {"line": 2},
            "value": {"type": "number", "value": 1}
        }
        self.analyzer.visitReturn(node, mode="worst")
        self.assertGreater(len(self.analyzer.rows), 0)

    def test_visit_print(self):
        """Test: Visita print"""
        node = {
            "type": "Print",
            "pos": {"line": 2},
            "args": [
                {"type": "identifier", "name": "x"}
            ]
        }
        self.analyzer.visitPrint(node)
        self.assertGreater(len(self.analyzer.rows), 0)

    def test_visit_decl(self):
        """Test: Visita declaración"""
        node = {
            "type": "Decl",
            "pos": {"line": 2},
            "variable": {"type": "identifier", "name": "x"},
            "type": "int"
        }
        self.analyzer.visitDecl(node)
        self.assertGreater(len(self.analyzer.rows), 0)

    def test_cost_of_lvalue_identifier(self):
        """Test: Calcula costo de lvalue identificador"""
        lvalue = {"type": "identifier", "name": "x"}
        result = self.analyzer._cost_of_lvalue(lvalue)
        self.assertIsInstance(result, list)

    def test_cost_of_lvalue_index(self):
        """Test: Calcula costo de lvalue índice"""
        lvalue = {
            "type": "index",
            "target": {"type": "identifier", "name": "A"},
            "index": {"type": "identifier", "name": "i"}
        }
        result = self.analyzer._cost_of_lvalue(lvalue)
        self.assertIsInstance(result, list)

    def test_cost_of_expr_identifier(self):
        """Test: Calcula costo de expresión identificador"""
        expr = {"type": "identifier", "name": "x"}
        result = self.analyzer._cost_of_expr(expr)
        self.assertIsInstance(result, list)

    def test_cost_of_expr_number(self):
        """Test: Calcula costo de expresión número"""
        expr = {"type": "number", "value": 42}
        result = self.analyzer._cost_of_expr(expr)
        self.assertIsInstance(result, list)

    def test_cost_of_expr_binary(self):
        """Test: Calcula costo de expresión binaria"""
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "a"},
            "operator": "+",
            "right": {"type": "number", "value": 1}
        }
        result = self.analyzer._cost_of_expr(expr)
        self.assertIsInstance(result, list)

    def test_expr_to_str_identifier(self):
        """Test: Convierte identificador a string"""
        expr = {"type": "identifier", "name": "x"}
        result = self.analyzer._expr_to_str(expr)
        self.assertEqual(result, "x")

    def test_expr_to_str_literal_string(self):
        """Test: Convierte literal string a string"""
        expr = {"type": "literal", "value": "hello"}
        result = self.analyzer._expr_to_str(expr)
        self.assertIn("hello", result)

    def test_cost_of_lvalue_nested_index(self):
        """Test: Calcula costo de lvalue con índice anidado"""
        lvalue = {
            "type": "index",
            "target": {
                "type": "index",
                "target": {"type": "identifier", "name": "matrix"},
                "index": {"type": "identifier", "name": "i"}
            },
            "index": {"type": "identifier", "name": "j"}
        }
        result = self.analyzer._cost_of_lvalue(lvalue)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

    def test_cost_of_lvalue_field(self):
        """Test: Calcula costo de lvalue con acceso a campo"""
        lvalue = {
            "type": "field",
            "target": {"type": "identifier", "name": "obj"},
            "field": "prop"
        }
        result = self.analyzer._cost_of_lvalue(lvalue)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

    def test_cost_of_lvalue_not_dict(self):
        """Test: Calcula costo de lvalue que no es dict"""
        result = self.analyzer._cost_of_lvalue("not_a_dict")
        self.assertEqual(result, [])

    def test_cost_of_expr_index(self):
        """Test: Calcula costo de expresión con índice"""
        expr = {
            "type": "index",
            "target": {"type": "identifier", "name": "A"},
            "index": {"type": "identifier", "name": "i"}
        }
        result = self.analyzer._cost_of_expr(expr)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

    def test_cost_of_expr_field(self):
        """Test: Calcula costo de expresión con acceso a campo"""
        expr = {
            "type": "field",
            "target": {"type": "identifier", "name": "obj"},
            "field": "prop"
        }
        result = self.analyzer._cost_of_expr(expr)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

    def test_cost_of_expr_unary(self):
        """Test: Calcula costo de expresión unaria"""
        expr = {
            "type": "unary",
            "operator": "-",
            "arg": {
                "type": "binary",
                "operator": "+",
                "left": {"type": "number", "value": 1},
                "right": {"type": "number", "value": 2}
            }
        }
        result = self.analyzer._cost_of_expr(expr)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

    def test_cost_of_expr_unary_literal(self):
        """Test: Calcula costo de expresión unaria sobre literal"""
        expr = {
            "type": "unary",
            "operator": "-",
            "arg": {"type": "literal", "value": 5}
        }
        result = self.analyzer._cost_of_expr(expr)
        # No debe agregar costo para literal
        self.assertEqual(result, [])

    def test_cost_of_expr_call(self):
        """Test: Calcula costo de expresión con llamada a función"""
        expr = {
            "type": "call",
            "name": "sqrt",
            "args": [
                {"type": "identifier", "name": "x"}
            ]
        }
        result = self.analyzer._cost_of_expr(expr)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

    def test_cost_of_expr_call_multiple_args(self):
        """Test: Calcula costo de expresión con llamada a función múltiples argumentos"""
        expr = {
            "type": "call",
            "name": "max",
            "args": [
                {"type": "identifier", "name": "x"},
                {"type": "identifier", "name": "y"},
                {"type": "identifier", "name": "z"}
            ]
        }
        result = self.analyzer._cost_of_expr(expr)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

    def test_cost_of_expr_none(self):
        """Test: Calcula costo de expresión None"""
        result = self.analyzer._cost_of_expr(None)
        self.assertEqual(result, [])

    def test_cost_of_expr_not_dict(self):
        """Test: Calcula costo de expresión que no es dict"""
        result = self.analyzer._cost_of_expr("not_a_dict")
        self.assertEqual(result, [])

    def test_cost_of_expr_unknown_type(self):
        """Test: Calcula costo de expresión con tipo desconocido (fallback)"""
        expr = {"type": "unknown_type"}
        result = self.analyzer._cost_of_expr(expr)
        # Debe usar fallback y agregar costo
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)

    def test_visit_other(self):
        """Test: visitOther con nodo desconocido"""
        node = {
            "type": "UnknownType",
            "pos": {"line": 5}
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitOther(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)

    def test_visit_other_no_pos(self):
        """Test: visitOther con nodo sin pos"""
        node = {
            "type": "UnknownType"
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitOther(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)

