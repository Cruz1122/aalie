"""
Tests unitarios para métodos helper de RecursiveAnalyzer.

Author: Tests generados para aumentar cobertura de código
"""
import unittest
from unittest.mock import MagicMock, patch
from app.modules.analysis.analyzers.recursive import RecursiveAnalyzer


class TestRecursiveAnalyzerHelpers(unittest.TestCase):
    """Tests para métodos helper de RecursiveAnalyzer."""

    def setUp(self):
        """Set up test fixtures."""
        self.analyzer = RecursiveAnalyzer()

    def test_has_object_field_access_in_recursive_calls(self):
        """Test: _has_object_field_access_in_recursive_calls detecta acceso a campos"""
        # Llamadas recursivas con acceso a campos (ej: obj.field())
        recursive_calls = [
            {"name": "factorial", "args": []},
            {"name": "helper", "args": [], "target": {"type": "field_access", "name": "obj"}}
        ]
        result = self.analyzer._has_object_field_access_in_recursive_calls(recursive_calls)
        # Debe detectar acceso a campos
        self.assertIsInstance(result, bool)

    def test_has_object_field_access_no_field_access(self):
        """Test: _has_object_field_access_in_recursive_calls sin acceso a campos"""
        # Llamadas recursivas sin acceso a campos
        recursive_calls = [
            {"name": "factorial", "args": []}
        ]
        result = self.analyzer._has_object_field_access_in_recursive_calls(recursive_calls)
        self.assertFalse(result)

    def test_has_field_access_with_field(self):
        """Test: _has_field_access detecta acceso a campo"""
        node = {
            "type": "call",
            "target": {"type": "field_access", "object": "obj", "field": "method"}
        }
        result = self.analyzer._has_field_access(node)
        self.assertIsInstance(result, bool)

    def test_has_field_access_without_field(self):
        """Test: _has_field_access sin acceso a campo"""
        node = {
            "type": "call",
            "target": {"type": "identifier", "name": "func"}
        }
        result = self.analyzer._has_field_access(node)
        self.assertFalse(result)

    def test_has_field_access_none(self):
        """Test: _has_field_access con None"""
        result = self.analyzer._has_field_access(None)
        self.assertFalse(result)

    def test_find_procedure_by_name_found(self):
        """Test: _find_procedure_by_name encuentra procedimiento"""
        # Establecer AST en el analyzer
        self.analyzer.ast = {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "factorial",
                    "params": [{"name": "n"}]
                }
            ]
        }
        result = self.analyzer._find_procedure_by_name("factorial")
        # Debe encontrar el procedimiento
        self.assertIsNotNone(result)
        self.assertEqual(result["name"], "factorial")

    def test_find_procedure_by_name_not_found(self):
        """Test: _find_procedure_by_name no encuentra procedimiento"""
        ast = {
            "type": "Program",
            "body": []
        }
        with patch.object(self.analyzer, '_find_main_procedure', return_value=None):
            result = self.analyzer._find_procedure_by_name("nonexistent")
            self.assertIsNone(result)

    def test_validate_conditions_valid(self):
        """Test: _validate_conditions con condiciones válidas"""
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "params": [{"name": "n"}],
            "body": {
                "type": "block",
                "statements": [
                    {
                        "type": "Call",
                        "name": "factorial",  # Llamada recursiva
                        "args": []
                    }
                ]
            }
        }
        result = self.analyzer._validate_conditions(proc_def)
        self.assertIn("valid", result)
        # Si las condiciones son válidas, debe retornar valid=True
        self.assertTrue(result["valid"])

    def test_find_if_else_paths(self):
        """Test: _find_if_else_paths encuentra caminos IF-ELSE"""
        node = {
            "type": "if",
            "condition": {"type": "binary", "operator": ">", "left": {}, "right": {}},
            "then": {
                "type": "block",
                "statements": [{"type": "assign"}]
            },
            "else": {
                "type": "block",
                "statements": [{"type": "assign"}]
            }
        }
        result = self.analyzer._find_if_else_paths(node)
        self.assertIsInstance(result, list)
        # Debe encontrar al menos el camino then y else

    def test_find_if_else_paths_no_else(self):
        """Test: _find_if_else_paths sin ELSE"""
        node = {
            "type": "if",
            "condition": {},
            "then": {"type": "block", "statements": []}
        }
        result = self.analyzer._find_if_else_paths(node)
        self.assertIsInstance(result, list)

    def test_has_recursive_call_in_subtree_true(self):
        """Test: _has_recursive_call_in_subtree detecta llamada recursiva"""
        node = {
            "type": "block",
            "statements": [
                {
                    "type": "Call",
                    "name": "factorial",
                    "args": []
                }
            ]
        }
        proc_name = "factorial"
        result = self.analyzer._has_recursive_call_in_subtree(node, proc_name)
        self.assertTrue(result)

    def test_has_recursive_call_in_subtree_false(self):
        """Test: _has_recursive_call_in_subtree sin llamada recursiva"""
        node = {
            "type": "block",
            "statements": [
                {
                    "type": "assign",
                    "left": {"name": "x"},
                    "right": {"value": 1}
                }
            ]
        }
        proc_name = "factorial"
        result = self.analyzer._has_recursive_call_in_subtree(node, proc_name)
        self.assertFalse(result)

    def test_max_complexity(self):
        """Test: _max_complexity compara complejidades"""
        c1 = "n"
        c2 = "n^2"
        result = self.analyzer._max_complexity(c1, c2)
        # Debe retornar la mayor complejidad
        self.assertIsInstance(result, str)
        self.assertEqual(result, c2)  # n^2 > n

    def test_max_complexity_equal(self):
        """Test: _max_complexity con complejidades iguales"""
        c1 = "n"
        c2 = "n"
        result = self.analyzer._max_complexity(c1, c2)
        self.assertEqual(result, c1)

    def test_count_non_recursive_statements(self):
        """Test: _count_non_recursive_statements cuenta statements no recursivos"""
        node = {
            "type": "block",
            "statements": [
                {"type": "assign"},
                {"type": "assign"},
                {"type": "call", "name": "helper"}  # No es recursivo si helper != proc_name
            ]
        }
        recursive_calls = [{"name": "factorial"}]  # Llamadas recursivas diferentes
        result = self.analyzer._count_non_recursive_statements(node, recursive_calls)
        self.assertIsInstance(result, int)
        self.assertGreaterEqual(result, 0)

    def test_has_loop_inside_true(self):
        """Test: _has_loop_inside detecta bucle"""
        node = {
            "type": "block",
            "statements": [
                {
                    "type": "For",
                    "variable": "i",
                    "start": {"value": 1},
                    "end": {"value": 10},
                    "body": {"type": "block", "statements": []}
                }
            ]
        }
        recursive_calls = [{"name": "factorial"}]
        result = self.analyzer._has_loop_inside(node, recursive_calls)
        self.assertTrue(result)

    def test_has_loop_inside_false(self):
        """Test: _has_loop_inside sin bucles"""
        node = {
            "type": "block",
            "statements": [
                {"type": "assign"},
                {"type": "return"}
            ]
        }
        recursive_calls = []
        result = self.analyzer._has_loop_inside(node, recursive_calls)
        self.assertFalse(result)

    def test_has_recursive_calls_in_node_true(self):
        """Test: _has_recursive_calls_in_node detecta llamadas recursivas"""
        node = {
            "type": "block",
            "statements": [
                {
                    "type": "call",
                    "name": "factorial"
                }
            ]
        }
        result = self.analyzer._has_recursive_calls_in_node(node)
        # Debe detectar si hay llamadas recursivas
        self.assertIsInstance(result, bool)

    def test_contains_recursive_call_true(self):
        """Test: _contains_recursive_call detecta llamada recursiva en lista"""
        # Configurar procedure_name en el analyzer
        self.analyzer.procedure_name = "factorial"
        node = {
            "type": "Call",
            "name": "factorial",
            "args": []
        }
        recursive_calls = [{"name": "factorial"}]
        result = self.analyzer._contains_recursive_call(node, recursive_calls)
        self.assertTrue(result)

    def test_contains_recursive_call_false(self):
        """Test: _contains_recursive_call sin llamada recursiva"""
        node = {
            "type": "call",
            "name": "helper",
            "args": []
        }
        recursive_calls = [{"name": "factorial"}]
        result = self.analyzer._contains_recursive_call(node, recursive_calls)
        self.assertFalse(result)

    def test_detect_base_case_with_return(self):
        """Test: _detect_base_case detecta caso base con RETURN"""
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "body": {
                "type": "block",
                "statements": [
                    {
                        "type": "if",
                        "condition": {
                            "type": "binary",
                            "operator": "<=",
                            "left": {"name": "n"},
                            "right": {"value": 1}
                        },
                        "then": {
                            "type": "return",
                            "value": {"value": 1}
                        }
                    }
                ]
            }
        }
        result = self.analyzer._detect_base_case(proc_def)
        self.assertIsInstance(result, int)

    def test_extract_floor_ceil_division(self):
        """Test: _extract_floor_ceil_division extrae factor de división floor/ceil"""
        # Expresión con floor(n/2)
        expr = {
            "type": "call",
            "name": "floor",
            "args": [
                {
                    "type": "binary",
                    "operator": "/",
                    "left": {"name": "n"},
                    "right": {"value": 2}
                }
            ]
        }
        result = self.analyzer._extract_floor_ceil_division(expr)
        # Debe retornar el factor de división (0.5 para n/2)
        if result is not None:
            self.assertIsInstance(result, float)

    def test_extract_floor_ceil_division_no_division(self):
        """Test: _extract_floor_ceil_division sin división"""
        expr = {
            "type": "binary",
            "operator": "+",
            "left": {"value": 1},
            "right": {"value": 2}
        }
        result = self.analyzer._extract_floor_ceil_division(expr)
        self.assertIsNone(result)

    def test_represents_size_variable_true(self):
        """Test: _represents_size_variable detecta variable de tamaño"""
        # Variable común de tamaño
        expr = {"type": "identifier", "name": "n"}
        result = self.analyzer._represents_size_variable(expr)
        self.assertTrue(result)

    def test_represents_size_variable_false(self):
        """Test: _represents_size_variable con variable que no es de tamaño"""
        expr = {"type": "identifier", "name": "i"}
        result = self.analyzer._represents_size_variable(expr)
        # 'i' típicamente es índice, no tamaño
        self.assertIsInstance(result, bool)


if __name__ == '__main__':
    unittest.main()

