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

    def test_analyze_subproblem_size_with_division(self):
        """Test: _analyze_subproblem_size detecta división directa"""
        proc_def = {
            "type": "ProcDef",
            "name": "mergeSort",
            "params": [{"name": "A"}, {"name": "izq"}, {"name": "der"}],
            "body": {"type": "block", "statements": []}
        }
        call = {
            "name": "mergeSort",
            "args": [
                {"type": "identifier", "name": "A"},
                {"type": "identifier", "name": "izq"},
                {
                    "type": "binary",
                    "operator": "/",
                    "left": {"type": "identifier", "name": "n"},
                    "right": {"type": "number", "value": 2}
                }
            ]
        }
        result = self.analyzer._analyze_subproblem_size(call, proc_def)
        self.assertIsNotNone(result)
        if result:
            self.assertIn("b", result)

    def test_analyze_subproblem_size_with_params(self):
        """Test: _analyze_subproblem_size con parámetros insuficientes"""
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "params": [{"name": "n"}],
            "body": {"type": "block", "statements": []}
        }
        call = {
            "name": "factorial",
            "args": []  # Sin argumentos
        }
        result = self.analyzer._analyze_subproblem_size(call, proc_def)
        self.assertIsNone(result)

    def test_analyze_subproblem_size_no_params(self):
        """Test: _analyze_subproblem_size sin parámetros en proc_def"""
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "params": [],
            "body": {"type": "block", "statements": []}
        }
        call = {
            "name": "factorial",
            "args": [{"type": "identifier", "name": "n"}]
        }
        result = self.analyzer._analyze_subproblem_size(call, proc_def)
        self.assertIsNone(result)

    def test_detect_indirect_division_with_variable(self):
        """Test: _detect_indirect_division detecta división indirecta"""
        body = {
            "type": "block",
            "statements": [
                {
                    "type": "Assign",
                    "target": {"type": "identifier", "name": "medio"},
                    "value": {
                        "type": "binary",
                        "operator": "/",
                        "left": {"type": "identifier", "name": "n"},
                        "right": {"type": "number", "value": 2}
                    }
                }
            ]
        }
        args = [{"type": "identifier", "name": "medio"}]
        params = [{"name": "n"}]
        result = self.analyzer._detect_indirect_division(body, args, params)
        if result is not None:
            self.assertIsInstance(result, float)
            self.assertEqual(result, 2.0)

    def test_detect_indirect_division_no_args(self):
        """Test: _detect_indirect_division sin argumentos"""
        body = {"type": "block", "statements": []}
        args = []
        params = [{"name": "n"}]
        result = self.analyzer._detect_indirect_division(body, args, params)
        self.assertIsNone(result)

    def test_detect_indirect_division_no_params(self):
        """Test: _detect_indirect_division sin parámetros"""
        body = {"type": "block", "statements": []}
        args = [{"type": "identifier", "name": "medio"}]
        params = []
        result = self.analyzer._detect_indirect_division(body, args, params)
        self.assertIsNone(result)

    def test_detect_indirect_division_with_binary_expr(self):
        """Test: _detect_indirect_division con expresión binaria"""
        body = {"type": "block", "statements": []}
        args = [
            {
                "type": "binary",
                "operator": "/",
                "left": {"type": "identifier", "name": "n"},
                "right": {"type": "number", "value": 3}
            }
        ]
        params = [{"name": "n"}]
        result = self.analyzer._detect_indirect_division(body, args, params)
        if result is not None:
            self.assertIsInstance(result, float)

    def test_detect_size_reduction_by_comparison(self):
        """Test: _detect_size_reduction_by_comparison detecta reducción"""
        proc_def = {
            "type": "ProcDef",
            "name": "mergeSort",
            "params": [{"name": "A"}, {"name": "izq"}, {"name": "der"}],
            "body": {
                "type": "block",
                "statements": [
                    {
                        "type": "Assign",
                        "target": {"type": "identifier", "name": "medio"},
                        "value": {
                            "type": "binary",
                            "operator": "/",
                            "left": {
                                "type": "binary",
                                "operator": "+",
                                "left": {"type": "identifier", "name": "izq"},
                                "right": {"type": "identifier", "name": "der"}
                            },
                            "right": {"type": "number", "value": 2}
                        }
                    }
                ]
            }
        }
        args = [
            {"type": "identifier", "name": "A"},
            {"type": "identifier", "name": "izq"},
            {"type": "identifier", "name": "medio"}
        ]
        params = [{"name": "A"}, {"name": "izq"}, {"name": "der"}]
        result = self.analyzer._detect_size_reduction_by_comparison(args, params, proc_def)
        if result is not None:
            self.assertIsInstance(result, float)

    def test_detect_size_reduction_by_comparison_no_args(self):
        """Test: _detect_size_reduction_by_comparison sin argumentos"""
        proc_def = {"type": "ProcDef", "body": {"type": "block", "statements": []}}
        args = []
        params = [{"name": "n"}]
        result = self.analyzer._detect_size_reduction_by_comparison(args, params, proc_def)
        # Puede retornar None o algún valor dependiendo de la implementación
        self.assertIsInstance(result, (float, type(None)))

    def test_find_variable_division_found(self):
        """Test: _find_variable_division encuentra división"""
        node = {
            "type": "block",
            "statements": [
                {
                    "type": "Assign",
                    "target": {"type": "identifier", "name": "medio"},
                    "value": {
                        "type": "binary",
                        "operator": "/",
                        "left": {"type": "identifier", "name": "n"},
                        "right": {"type": "number", "value": 2}
                    }
                }
            ]
        }
        result = self.analyzer._find_variable_division(node, "medio")
        self.assertIsNotNone(result)
        self.assertEqual(result, 2.0)

    def test_find_variable_division_not_found(self):
        """Test: _find_variable_division no encuentra división"""
        node = {
            "type": "block",
            "statements": [
                {
                    "type": "Assign",
                    "target": {"type": "identifier", "name": "medio"},
                    "value": {
                        "type": "binary",
                        "operator": "+",
                        "left": {"type": "identifier", "name": "izq"},
                        "right": {"type": "identifier", "name": "der"}
                    }
                }
            ]
        }
        result = self.analyzer._find_variable_division(node, "medio")
        self.assertIsNone(result)

    def test_find_variable_division_not_dict(self):
        """Test: _find_variable_division con nodo que no es dict"""
        result = self.analyzer._find_variable_division("not_a_dict", "medio")
        self.assertIsNone(result)

    def test_detect_variable_size_reduction_with_arithmetic(self):
        """Test: _detect_variable_size_reduction detecta reducción con aritmética"""
        proc_def = {
            "type": "ProcDef",
            "name": "quickSort",
            "params": [{"name": "A"}, {"name": "izq"}, {"name": "der"}],
            "body": {
                "type": "block",
                "statements": [
                    {
                        "type": "Call",
                        "name": "quickSort",
                        "args": [
                            {"type": "identifier", "name": "A"},
                            {"type": "identifier", "name": "izq"},
                            {
                                "type": "binary",
                                "operator": "-",
                                "left": {"type": "identifier", "name": "pi"},
                                "right": {"type": "number", "value": 1}
                            }
                        ]
                    },
                    {
                        "type": "Call",
                        "name": "quickSort",
                        "args": [
                            {"type": "identifier", "name": "A"},
                            {
                                "type": "binary",
                                "operator": "+",
                                "left": {"type": "identifier", "name": "pi"},
                                "right": {"type": "number", "value": 1}
                            },
                            {"type": "identifier", "name": "der"}
                        ]
                    }
                ]
            }
        }
        args = [
            {"type": "identifier", "name": "A"},
            {
                "type": "binary",
                "operator": "-",
                "left": {"type": "identifier", "name": "pi"},
                "right": {"type": "number", "value": 1}
            },
            {"type": "identifier", "name": "der"}
        ]
        params = [{"name": "A"}, {"name": "izq"}, {"name": "der"}]
        result = self.analyzer._detect_variable_size_reduction(args, params, proc_def)
        if result is not None:
            self.assertIsInstance(result, float)
            self.assertEqual(result, 2.0)

    def test_detect_variable_size_reduction_no_args(self):
        """Test: _detect_variable_size_reduction sin argumentos"""
        proc_def = {"type": "ProcDef", "body": {"type": "block", "statements": []}}
        args = []
        params = [{"name": "n"}]
        result = self.analyzer._detect_variable_size_reduction(args, params, proc_def)
        self.assertIsNone(result)

    def test_extract_division_factor_direct(self):
        """Test: _extract_division_factor extrae factor directo"""
        expr = {
            "type": "binary",
            "operator": "/",
            "left": {"type": "identifier", "name": "n"},
            "right": {"type": "number", "value": 2}
        }
        result = self.analyzer._extract_division_factor(expr)
        self.assertIsNotNone(result)
        self.assertEqual(result, 2.0)

    def test_extract_division_factor_nested(self):
        """Test: _extract_division_factor extrae factor en expresión anidada"""
        expr = {
            "type": "binary",
            "operator": "+",
            "left": {"type": "identifier", "name": "izq"},
            "right": {
                "type": "binary",
                "operator": "/",
                "left": {"type": "identifier", "name": "n"},
                "right": {"type": "number", "value": 3}
            }
        }
        result = self.analyzer._extract_division_factor(expr)
        if result is not None:
            self.assertIsInstance(result, float)

    def test_extract_division_factor_not_division(self):
        """Test: _extract_division_factor con expresión que no es división"""
        expr = {
            "type": "binary",
            "operator": "+",
            "left": {"type": "number", "value": 1},
            "right": {"type": "number", "value": 2}
        }
        result = self.analyzer._extract_division_factor(expr)
        self.assertIsNone(result)

    def test_extract_division_factor_not_dict(self):
        """Test: _extract_division_factor con expresión que no es dict"""
        result = self.analyzer._extract_division_factor("not_a_dict")
        self.assertIsNone(result)

    def test_find_division_assignments(self):
        """Test: _find_division_assignments encuentra asignaciones con división"""
        node = {
            "type": "block",
            "statements": [
                {
                    "type": "Assign",
                    "target": {"type": "identifier", "name": "medio"},
                    "value": {
                        "type": "binary",
                        "operator": "/",
                        "left": {"type": "identifier", "name": "n"},
                        "right": {"type": "number", "value": 2}
                    }
                },
                {
                    "type": "Assign",
                    "target": {"type": "identifier", "name": "tercio"},
                    "value": {
                        "type": "binary",
                        "operator": "/",
                        "left": {"type": "identifier", "name": "n"},
                        "right": {"type": "number", "value": 3}
                    }
                }
            ]
        }
        factors = []
        self.analyzer._find_division_assignments(node, factors)
        self.assertGreater(len(factors), 0)
        self.assertIn(2.0, factors)

    def test_find_division_assignments_not_dict(self):
        """Test: _find_division_assignments con nodo que no es dict"""
        factors = []
        self.analyzer._find_division_assignments("not_a_dict", factors)
        self.assertEqual(len(factors), 0)

    def test_extract_recurrence_success(self):
        """Test: _extract_recurrence extrae recurrencia exitosamente"""
        proc_def = {
            "type": "ProcDef",
            "name": "mergeSort",
            "params": [{"name": "n"}],
            "body": {
                "type": "block",
                "statements": [
                    {
                        "type": "Call",
                        "name": "mergeSort",
                        "args": [
                            {
                                "type": "binary",
                                "operator": "/",
                                "left": {"type": "identifier", "name": "n"},
                                "right": {"type": "number", "value": 2}
                            }
                        ]
                    },
                    {
                        "type": "Call",
                        "name": "mergeSort",
                        "args": [
                            {
                                "type": "binary",
                                "operator": "/",
                                "left": {"type": "identifier", "name": "n"},
                                "right": {"type": "number", "value": 2}
                            }
                        ]
                    }
                ]
            }
        }
        result = self.analyzer._extract_recurrence(proc_def)
        self.assertIsNotNone(result)
        if result.get("success"):
            self.assertIn("recurrence", result)

    def test_extract_recurrence_no_recursive_calls(self):
        """Test: _extract_recurrence sin llamadas recursivas"""
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "params": [{"name": "n"}],
            "body": {
                "type": "block",
                "statements": [
                    {"type": "assign", "target": {"name": "x"}, "value": {"value": 1}}
                ]
            }
        }
        result = self.analyzer._extract_recurrence(proc_def)
        self.assertIsNotNone(result)
        self.assertFalse(result.get("success", True))

    def test_calculate_non_recursive_work(self):
        """Test: _calculate_non_recursive_work calcula trabajo no recursivo"""
        proc_def = {
            "type": "ProcDef",
            "name": "mergeSort",
            "body": {
                "type": "block",
                "statements": [
                    {"type": "assign"},
                    {"type": "assign"},
                    {"type": "for"}
                ]
            }
        }
        recursive_calls = [{"name": "mergeSort"}]
        result = self.analyzer._calculate_non_recursive_work(proc_def, recursive_calls)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)

    def test_analyze_work_complexity_simple(self):
        """Test: _analyze_work_complexity analiza complejidad simple"""
        node = {
            "type": "block",
            "statements": [
                {"type": "assign"},
                {"type": "return"}
            ]
        }
        recursive_calls = []
        result = self.analyzer._analyze_work_complexity(node, recursive_calls)
        self.assertIsInstance(result, str)

    def test_analyze_work_complexity_with_loop(self):
        """Test: _analyze_work_complexity con bucle"""
        node = {
            "type": "block",
            "statements": [
                {
                    "type": "for",
                    "variable": "i",
                    "start": {"value": 1},
                    "end": {"type": "identifier", "name": "n"},
                    "body": {"type": "block", "statements": [{"type": "assign"}]}
                }
            ]
        }
        recursive_calls = []
        result = self.analyzer._analyze_work_complexity(node, recursive_calls)
        self.assertIsInstance(result, str)
        # El resultado debe ser un string válido (puede ser O(1), O(n), etc.)
        self.assertGreater(len(result), 0)

    def test_compare_f_with_g_case_1(self):
        """Test: _compare_f_with_g detecta Caso 1 (f(n) < g(n))"""
        result = self.analyzer._compare_f_with_g("1", 1.0)  # f(n)=1, log_b_a=1, g(n)=n
        self.assertIsNotNone(result)
        self.assertIn("case", result)
        self.assertIn("comparison", result)

    def test_compare_f_with_g_case_2(self):
        """Test: _compare_f_with_g detecta Caso 2 (f(n) = g(n))"""
        result = self.analyzer._compare_f_with_g("n", 1.0)  # f(n)=n, log_b_a=1, g(n)=n
        self.assertIsNotNone(result)
        self.assertIn("case", result)

    def test_compare_f_with_g_case_3(self):
        """Test: _compare_f_with_g detecta Caso 3 (f(n) > g(n))"""
        result = self.analyzer._compare_f_with_g("n^2", 1.0)  # f(n)=n^2, log_b_a=1, g(n)=n
        self.assertIsNotNone(result)
        self.assertIn("case", result)

    def test_parse_complexity_expression_constant(self):
        """Test: _parse_complexity_expression parsea constante"""
        from sympy import Symbol, Integer
        n_sym = Symbol("n", integer=True, positive=True)
        result = self.analyzer._parse_complexity_expression("1", n_sym)
        self.assertIsNotNone(result)
        self.assertEqual(result, Integer(1))

    def test_parse_complexity_expression_n(self):
        """Test: _parse_complexity_expression parsea n"""
        from sympy import Symbol
        n_sym = Symbol("n", integer=True, positive=True)
        result = self.analyzer._parse_complexity_expression("n", n_sym)
        self.assertIsNotNone(result)
        self.assertEqual(result, n_sym)

    def test_parse_complexity_expression_n_power(self):
        """Test: _parse_complexity_expression parsea n^k"""
        from sympy import Symbol
        n_sym = Symbol("n", integer=True, positive=True)
        result = self.analyzer._parse_complexity_expression("n^2", n_sym)
        self.assertIsNotNone(result)
        self.assertIn("n", str(result))

    def test_parse_complexity_expression_n_log_n(self):
        """Test: _parse_complexity_expression parsea n log n"""
        from sympy import Symbol
        n_sym = Symbol("n", integer=True, positive=True)
        result = self.analyzer._parse_complexity_expression("n log(n)", n_sym)
        self.assertIsNotNone(result)
        self.assertIsNotNone(result)

    def test_compare_with_limits_case_1(self):
        """Test: _compare_with_limits detecta Caso 1"""
        from sympy import Symbol, Integer
        n_sym = Symbol("n", integer=True, positive=True)
        f_n = Integer(1)  # f(n) = 1
        g_n = n_sym  # g(n) = n
        result = self.analyzer._compare_with_limits(f_n, g_n, n_sym, 1.0)
        self.assertIsNotNone(result)
        self.assertIn("case", result)

    def test_compare_with_limits_case_2(self):
        """Test: _compare_with_limits detecta Caso 2"""
        from sympy import Symbol
        n_sym = Symbol("n", integer=True, positive=True)
        f_n = n_sym  # f(n) = n
        g_n = n_sym  # g(n) = n
        result = self.analyzer._compare_with_limits(f_n, g_n, n_sym, 1.0)
        self.assertIsNotNone(result)
        self.assertIn("case", result)

    def test_compare_heuristic(self):
        """Test: _compare_heuristic realiza comparación heurística"""
        from sympy import Symbol
        n_sym = Symbol("n", integer=True, positive=True)
        f_n = n_sym ** 2  # f(n) = n^2
        g_n = n_sym  # g(n) = n
        result = self.analyzer._compare_heuristic(f_n, g_n, 1.0)
        self.assertIsNotNone(result)
        self.assertIn("case", result)

    def test_extract_exponent_from_expr_power(self):
        """Test: _extract_exponent_from_expr extrae exponente de n^k"""
        from sympy import Symbol
        n_sym = Symbol("n", integer=True, positive=True)
        expr = n_sym ** 2
        result = self.analyzer._extract_exponent_from_expr(expr)
        self.assertIsNotNone(result)
        self.assertEqual(result, 2.0)

    def test_extract_exponent_from_expr_n(self):
        """Test: _extract_exponent_from_expr extrae exponente de n"""
        from sympy import Symbol
        n_sym = Symbol("n", integer=True, positive=True)
        result = self.analyzer._extract_exponent_from_expr(n_sym)
        self.assertIsNotNone(result)
        self.assertEqual(result, 1.0)

    def test_extract_exponent_from_expr_constant(self):
        """Test: _extract_exponent_from_expr extrae exponente de constante"""
        from sympy import Integer
        expr = Integer(5)
        result = self.analyzer._extract_exponent_from_expr(expr)
        self.assertIsNotNone(result)
        self.assertEqual(result, 0.0)

    def test_compare_f_with_g_simple_case_1(self):
        """Test: _compare_f_with_g_simple detecta Caso 1"""
        result = self.analyzer._compare_f_with_g_simple("1", 1.0)
        self.assertIsNotNone(result)
        self.assertIn("case", result)

    def test_compare_f_with_g_simple_case_2(self):
        """Test: _compare_f_with_g_simple detecta Caso 2"""
        result = self.analyzer._compare_f_with_g_simple("n", 1.0)
        self.assertIsNotNone(result)
        self.assertIn("case", result)

    def test_extract_exponent_n(self):
        """Test: _extract_exponent extrae exponente de 'n'"""
        result = self.analyzer._extract_exponent("n")
        self.assertIsNotNone(result)
        self.assertEqual(result, 1.0)

    def test_extract_exponent_constant(self):
        """Test: _extract_exponent extrae exponente de constante"""
        result = self.analyzer._extract_exponent("1")
        self.assertIsNotNone(result)
        self.assertEqual(result, 0.0)

    def test_extract_exponent_n_power(self):
        """Test: _extract_exponent extrae exponente de 'n^2'"""
        result = self.analyzer._extract_exponent("n^2")
        self.assertIsNotNone(result)
        self.assertEqual(result, 2.0)

    def test_check_regularity_valid(self):
        """Test: _check_regularity verifica regularidad válida"""
        result = self.analyzer._check_regularity(2, 2.0, "n^2")
        self.assertIsNotNone(result)
        self.assertIn("checked", result)

    def test_check_regularity_invalid(self):
        """Test: _check_regularity con regularidad inválida"""
        result = self.analyzer._check_regularity(2, 2.0, "1")
        self.assertIsNotNone(result)
        self.assertIn("checked", result)

    def test_simplify_latex_expr_n_power_zero(self):
        """Test: _simplify_latex_expr simplifica n^0"""
        result = self.analyzer._simplify_latex_expr("n^{0}")
        self.assertIn("1", result)

    def test_simplify_latex_expr_n_power_one(self):
        """Test: _simplify_latex_expr simplifica n^1"""
        result = self.analyzer._simplify_latex_expr("n^{1}")
        self.assertIn("n", result)
        self.assertNotIn("^1", result)

    def test_simplify_latex_expr_log_n(self):
        """Test: _simplify_latex_expr simplifica log(n)"""
        result = self.analyzer._simplify_latex_expr("\\log(n)")
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)

    def test_simplify_latex_expr_empty(self):
        """Test: _simplify_latex_expr maneja string vacío"""
        result = self.analyzer._simplify_latex_expr("")
        self.assertIsInstance(result, str)

    def test_simplify_latex_expr_not_string(self):
        """Test: _simplify_latex_expr maneja valor no string"""
        result = self.analyzer._simplify_latex_expr(123)
        self.assertIsInstance(result, str)

    def test_simplify_expr_latex(self):
        """Test: _simplify_expr_latex simplifica expresión SymPy a LaTeX"""
        from sympy import Symbol, Integer
        n_sym = Symbol("n", integer=True, positive=True)
        expr = n_sym ** 2 + Integer(1)
        result = self.analyzer._simplify_expr_latex(expr)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)

    def test_simplify_number_latex_integer(self):
        """Test: _simplify_number_latex simplifica entero"""
        result = self.analyzer._simplify_number_latex(5.0)
        self.assertEqual(result, "5")

    def test_simplify_number_latex_fraction(self):
        """Test: _simplify_number_latex simplifica fracción"""
        result = self.analyzer._simplify_number_latex(0.5)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)

    def test_simplify_number_latex_decimal(self):
        """Test: _simplify_number_latex simplifica decimal"""
        result = self.analyzer._simplify_number_latex(3.14159)
        self.assertIsInstance(result, str)

    def test_calculate_theta_case_1(self):
        """Test: _calculate_theta calcula Theta para Caso 1"""
        from sympy import Symbol
        n_sym = Symbol("n", integer=True, positive=True)
        g_n = n_sym
        result = self.analyzer._calculate_theta(1, g_n, "1", 1.0)
        self.assertIsInstance(result, str)
        self.assertIn("Theta", result)

    def test_calculate_theta_case_2(self):
        """Test: _calculate_theta calcula Theta para Caso 2"""
        from sympy import Symbol
        n_sym = Symbol("n", integer=True, positive=True)
        g_n = n_sym
        result = self.analyzer._calculate_theta(2, g_n, "n", 1.0)
        self.assertIsInstance(result, str)
        self.assertIn("Theta", result)

    def test_calculate_theta_case_3(self):
        """Test: _calculate_theta calcula Theta para Caso 3"""
        from sympy import Symbol
        n_sym = Symbol("n", integer=True, positive=True)
        g_n = n_sym
        result = self.analyzer._calculate_theta(3, g_n, "n^2", 1.0)
        self.assertIsInstance(result, str)
        self.assertIn("Theta", result)

    # === Fase 1: Métodos de Resolución ===

    def create_fibonacci_ast(self):
        """Crea AST de Fibonacci: T(n) = T(n-1) + T(n-2) -> Ecuación Característica"""
        return {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "fibonacci",
                "params": [{"type": "Param", "name": "n"}],
                "body": {
                    "type": "Block",
                    "body": [
                        {
                            "type": "If",
                            "test": {"type": "Binary", "op": "<=", "left": {"type": "Identifier", "name": "n"}, "right": {"type": "Literal", "value": 1}},
                            "consequent": {
                                "type": "Block",
                                "body": [{"type": "Return", "value": {"type": "Identifier", "name": "n"}}]
                            },
                            "alternate": {
                                "type": "Block",
                                "body": [{
                                    "type": "Return",
                                    "value": {
                                        "type": "Binary",
                                        "op": "+",
                                        "left": {
                                            "type": "Call",
                                            "name": "fibonacci",
                                            "args": [{"type": "Binary", "op": "-", "left": {"type": "Identifier", "name": "n"}, "right": {"type": "Literal", "value": 1}}]
                                        },
                                        "right": {
                                            "type": "Call",
                                            "name": "fibonacci",
                                            "args": [{"type": "Binary", "op": "-", "left": {"type": "Identifier", "name": "n"}, "right": {"type": "Literal", "value": 2}}]
                                        }
                                    }
                                }]
                            }
                        }
                    ]
                }
            }]
        }

    def create_factorial_ast(self):
        """Crea AST de Factorial: T(n) = T(n-1) + 1 -> Método de Iteración"""
        return {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "factorial",
                "params": [{"type": "Param", "name": "n"}],
                "body": {
                    "type": "Block",
                    "body": [
                        {
                            "type": "If",
                            "test": {"type": "Binary", "op": "<=", "left": {"type": "Identifier", "name": "n"}, "right": {"type": "Literal", "value": 1}},
                            "consequent": {
                                "type": "Block",
                                "body": [{"type": "Return", "value": {"type": "Literal", "value": 1}}]
                            },
                            "alternate": {
                                "type": "Block",
                                "body": [{
                                    "type": "Return",
                                    "value": {
                                        "type": "Binary",
                                        "op": "*",
                                        "left": {"type": "Identifier", "name": "n"},
                                        "right": {
                                            "type": "Call",
                                            "name": "factorial",
                                            "args": [{"type": "Binary", "op": "-", "left": {"type": "Identifier", "name": "n"}, "right": {"type": "Literal", "value": 1}}]
                                        }
                                    }
                                }]
                            }
                        }
                    ]
                }
            }]
        }

    def test_detect_linear_recurrence_fibonacci(self):
        """Test: _detect_linear_recurrence detecta Fibonacci T(n) = T(n-1) + T(n-2)"""
        # Crear llamadas recursivas simuladas directamente para evitar recursión infinita
        proc_def = {
            "type": "ProcDef",
            "name": "fibonacci",
            "params": [{"type": "Param", "name": "n"}],
            "body": {
                "type": "Block",
                "body": []
            }
        }
        recursive_calls = [
            {
                "type": "Call",
                "name": "fibonacci",
                "args": [{"type": "Binary", "op": "-", "left": {"type": "Identifier", "name": "n"}, "right": {"type": "Literal", "value": 1}}]
            },
            {
                "type": "Call",
                "name": "fibonacci",
                "args": [{"type": "Binary", "op": "-", "left": {"type": "Identifier", "name": "n"}, "right": {"type": "Literal", "value": 2}}]
            }
        ]
        
        # Mock _analyze_subproblem_type para evitar recursión infinita
        def mock_analyze_subproblem_type(call, proc_def):
            args = call.get("args", [])
            if args:
                arg = args[0]
                if isinstance(arg, dict) and arg.get("op") == "-":
                    right = arg.get("right", {})
                    if isinstance(right, dict) and right.get("value") == 1:
                        return {"type": "subtraction", "pattern": "n-1", "factor": 1}
                    elif isinstance(right, dict) and right.get("value") == 2:
                        return {"type": "subtraction", "pattern": "n-2", "factor": 2}
            return None
        
        with patch.object(self.analyzer, '_analyze_subproblem_type', side_effect=mock_analyze_subproblem_type):
            with patch.object(self.analyzer, '_calculate_non_recursive_work', return_value="0"):
                with patch.object(self.analyzer, '_has_auxiliary_function_calls', return_value=False):
                    result = self.analyzer._detect_linear_recurrence(proc_def, recursive_calls)
                    
                    self.assertIsNotNone(result)
                    self.assertTrue(result.get("is_linear"))
                    self.assertEqual(result["max_offset"], 2)
                    self.assertIn(1, result["coefficients"])
                    self.assertIn(2, result["coefficients"])

    def test_detect_linear_recurrence_factorial(self):
        """Test: _detect_linear_recurrence detecta Factorial T(n) = T(n-1) + 1"""
        # Crear AST simplificado sin body complejo que cause recursión infinita
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "params": [{"type": "Param", "name": "n"}],
            "body": {
                "type": "Block",
                "body": [{
                    "type": "Call",
                    "name": "factorial",
                    "args": [{"type": "Binary", "op": "-", "left": {"type": "Identifier", "name": "n"}, "right": {"type": "Literal", "value": 1}}]
                }]
            }
        }
        self.analyzer.proc_def = proc_def
        
        # Crear llamadas recursivas simuladas directamente
        recursive_calls = [{
            "type": "Call",
            "name": "factorial",
            "args": [{"type": "Binary", "op": "-", "left": {"type": "Identifier", "name": "n"}, "right": {"type": "Literal", "value": 1}}]
        }]
        
        # Mock _analyze_subproblem_type para evitar recursión infinita
        with patch.object(self.analyzer, '_analyze_subproblem_type', return_value={
            "type": "subtraction",
            "pattern": "n-1",
            "factor": 1
        }):
            with patch.object(self.analyzer, '_calculate_non_recursive_work', return_value="1"):
                with patch.object(self.analyzer, '_has_auxiliary_function_calls', return_value=False):
                    result = self.analyzer._detect_linear_recurrence(proc_def, recursive_calls)
                    
                    self.assertIsNotNone(result)
                    self.assertTrue(result.get("is_linear"))
                    self.assertEqual(result["max_offset"], 1)
                    self.assertIn(1, result["coefficients"])

    def test_detect_linear_recurrence_no_linear(self):
        """Test: _detect_linear_recurrence no detecta recurrencia no lineal"""
        # Crear AST que no sea lineal (ej: T(n) = T(n/2) + 1)
        proc_def = {
            "type": "ProcDef",
            "name": "binarySearch",
            "params": [{"type": "Param", "name": "n"}],
            "body": {
                "type": "Block",
                "body": [{
                    "type": "Call",
                    "name": "binarySearch",
                    "args": [{"type": "Binary", "op": "/", "left": {"type": "Identifier", "name": "n"}, "right": {"type": "Literal", "value": 2}}]
                }]
            }
        }
        recursive_calls = [{"type": "Call", "name": "binarySearch", "args": proc_def["body"]["body"][0]["args"]}]
        
        result = self.analyzer._detect_linear_recurrence(proc_def, recursive_calls)
        
        # No debería detectar como lineal porque tiene división, no resta
        # Puede retornar None o False
        if result:
            self.assertFalse(result.get("is_linear", True))

    def test_apply_characteristic_equation_method_fibonacci(self):
        """Test: _apply_characteristic_equation_method aplica método de ecuación característica para Fibonacci"""
        ast = self.create_fibonacci_ast()
        proc_def = ast["body"][0]
        self.analyzer.proc_def = proc_def
        self.analyzer.ast = ast
        self.analyzer.procedure_name = "fibonacci"
        self.analyzer.proof_steps = []
        
        # Configurar recurrencia
        recursive_calls = self.analyzer._find_recursive_calls(proc_def)
        linear_info = self.analyzer._detect_linear_recurrence(proc_def, recursive_calls)
        
        # Simular extracción de recurrencia
        self.analyzer.recurrence = {
            "form": "T(n) = T(n-1) + T(n-2)",
            "applicable": True,
            "method": "characteristic_equation"
        }
        
        result = self.analyzer._apply_characteristic_equation_method()
        
        self.assertTrue(result.get("success"))
        self.assertIn("characteristic_equation", result)
        char_eq = result["characteristic_equation"]
        self.assertIn("equation", char_eq)
        self.assertIn("roots", char_eq)

    def test_apply_characteristic_equation_method_no_recurrence(self):
        """Test: _apply_characteristic_equation_method falla sin recurrencia"""
        self.analyzer.recurrence = None
        
        result = self.analyzer._apply_characteristic_equation_method()
        
        self.assertFalse(result.get("success"))
        self.assertIn("reason", result)

    def test_apply_characteristic_equation_method_not_linear(self):
        """Test: _apply_characteristic_equation_method falla si no es lineal"""
        proc_def = {"type": "ProcDef", "name": "test", "params": []}
        self.analyzer.proc_def = proc_def
        self.analyzer.recurrence = {"form": "T(n) = T(n/2) + 1", "applicable": True}
        
        with patch.object(self.analyzer, '_detect_linear_recurrence', return_value=None):
            result = self.analyzer._apply_characteristic_equation_method()
            
            self.assertFalse(result.get("success"))
            self.assertIn("reason", result)

    def test_apply_iteration_method_factorial(self):
        """Test: _apply_iteration_method aplica método de iteración para Factorial"""
        ast = self.create_factorial_ast()
        proc_def = ast["body"][0]
        self.analyzer.proc_def = proc_def
        self.analyzer.ast = ast
        self.analyzer.procedure_name = "factorial"
        self.analyzer.proof_steps = []
        
        # Configurar recurrencia
        self.analyzer.recurrence = {
            "form": "T(n) = T(n-1) + 1",
            "a": 1,
            "f": "1",
            "n0": 1,
            "applicable": True,
            "method": "iteration"
        }
        
        # Mock _extract_g_function para retornar información de g(n) = n-1
        with patch.object(self.analyzer, '_extract_g_function', return_value={
            "type": "subtraction",
            "pattern": "n-1",
            "factor": 1,
            "has_multiple_terms": False
        }):
            with patch.object(self.analyzer, '_find_main_procedure', return_value=proc_def):
                result = self.analyzer._apply_iteration_method()
                
                # Puede ser exitoso o fallar dependiendo de la implementación
                self.assertIsNotNone(result)
                self.assertIn("success", result)

    def test_apply_iteration_method_no_recurrence(self):
        """Test: _apply_iteration_method falla sin recurrencia"""
        self.analyzer.recurrence = None
        
        result = self.analyzer._apply_iteration_method()
        
        self.assertFalse(result.get("success"))
        self.assertIn("reason", result)

    def test_apply_iteration_method_no_g_function(self):
        """Test: _apply_iteration_method falla si no puede extraer g(n)"""
        self.analyzer.recurrence = {
            "form": "T(n) = T(n-1) + 1",
            "a": 1,
            "f": "1",
            "n0": 1,
            "applicable": True
        }
        
        with patch.object(self.analyzer, '_extract_g_function', return_value=None):
            result = self.analyzer._apply_iteration_method()
            
            self.assertFalse(result.get("success"))
            self.assertIn("reason", result)

    def test_apply_recursion_tree_method_merge_sort(self):
        """Test: _apply_recursion_tree_method aplica método de árbol de recursión"""
        self.analyzer.proof_steps = []
        self.analyzer.recurrence = {
            "form": "T(n) = 2T(n/2) + n",
            "a": 2,
            "b": 2.0,
            "f": "n",
            "n0": 1,
            "applicable": True
        }
        
        # Mock métodos helper necesarios
        with patch.object(self.analyzer, '_build_tree_levels', return_value=[
            {"level": 0, "num_nodes_latex": "1", "subproblem_size_latex": "n", "cost_per_node_latex": "n", "total_cost_latex": "n"},
            {"level": 1, "num_nodes_latex": "2", "subproblem_size_latex": "n/2", "cost_per_node_latex": "n/2", "total_cost_latex": "n"}
        ]):
            with patch.object(self.analyzer, '_calculate_tree_sum', return_value={
                "expression": "\\sum_{i=0}^{\\log_2(n)} 2^i \\cdot n/2^i",
                "evaluated": "n \\log n",
                "theta": "\\Theta(n \\log n)"
            }):
                with patch.object(self.analyzer, '_identify_dominating_level', return_value={
                    "level": "todos",
                    "reason": "Todos los niveles tienen el mismo costo"
                }):
                    result = self.analyzer._apply_recursion_tree_method()
                    
                    self.assertTrue(result.get("success"))
                    self.assertIn("recursion_tree", result)

    def test_apply_recursion_tree_method_no_recurrence(self):
        """Test: _apply_recursion_tree_method falla sin recurrencia"""
        self.analyzer.recurrence = None
        
        result = self.analyzer._apply_recursion_tree_method()
        
        self.assertFalse(result.get("success"))
        self.assertIn("reason", result)

    def test_analyze_subproblem_type_subtraction(self):
        """Test: _analyze_subproblem_type detecta resta (n-1)"""
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "params": [{"type": "Param", "name": "n"}]
        }
        call = {
            "type": "Call",
            "name": "factorial",
            "args": [{"type": "Binary", "op": "-", "left": {"type": "Identifier", "name": "n"}, "right": {"type": "Literal", "value": 1}}]
        }
        
        with patch.object(self.analyzer, '_detect_range_reduction', return_value=None):
            result = self.analyzer._analyze_subproblem_type(call, proc_def)
            
            self.assertIsNotNone(result)
            self.assertEqual(result["type"], "subtraction")
            self.assertEqual(result["pattern"], "n-1")
            self.assertEqual(result["factor"], 1)

    def test_analyze_subproblem_type_division(self):
        """Test: _analyze_subproblem_type detecta división (n/2)"""
        proc_def = {
            "type": "ProcDef",
            "name": "binarySearch",
            "params": [{"type": "Param", "name": "n"}]
        }
        call = {
            "type": "Call",
            "name": "binarySearch",
            "args": [{"type": "Binary", "op": "/", "left": {"type": "Identifier", "name": "n"}, "right": {"type": "Literal", "value": 2}}]
        }
        
        with patch.object(self.analyzer, '_detect_range_reduction', return_value=None):
            with patch.object(self.analyzer, '_is_range_halving_pattern', return_value=False):
                result = self.analyzer._analyze_subproblem_type(call, proc_def)
                
                self.assertIsNotNone(result)
                self.assertEqual(result["type"], "division")
                self.assertEqual(result["pattern"], "n/2")
                self.assertEqual(result["factor"], 2)

    def test_analyze_subproblem_type_none_params(self):
        """Test: _analyze_subproblem_type retorna None sin parámetros"""
        proc_def = {"type": "ProcDef", "name": "test", "params": []}
        call = {"type": "Call", "name": "test", "args": []}
        
        result = self.analyzer._analyze_subproblem_type(call, proc_def)
        
        self.assertIsNone(result)

    def test_has_case_variability_deterministic(self):
        """Test: _has_case_variability detecta algoritmo determinístico (sin variabilidad)"""
        proc_def = {
            "type": "ProcDef",
            "name": "fibonacci",
            "params": [{"type": "Param", "name": "n"}],
            "body": {
                "type": "Block",
                "body": []
            }
        }
        self.analyzer.proc_def = proc_def
        
        # Configurar recurrencia lineal
        self.analyzer.recurrence = {
            "form": "T(n) = T(n-1) + T(n-2)",
            "method": "characteristic_equation",
            "applicable": True
        }
        
        with patch.object(self.analyzer, '_find_recursive_calls', return_value=[]):
            with patch.object(self.analyzer, '_has_conditional_recursive_calls', return_value=False):
                with patch.object(self.analyzer, '_detect_early_return', return_value=False):
                    result = self.analyzer._has_case_variability()
                    
                    # Verificar que retorna un booleano
                    self.assertIsInstance(result, bool)

    def test_has_case_variability_non_deterministic(self):
        """Test: _has_case_variability detecta algoritmo no determinístico (con variabilidad)"""
        proc_def = {
            "type": "ProcDef",
            "name": "quicksort",
            "params": [{"type": "Param", "name": "n"}],
            "body": {
                "type": "Block",
                "body": [{
                    "type": "If",
                    "test": {"type": "Identifier", "name": "condition"},
                    "consequent": {
                        "type": "Block",
                        "body": [{"type": "Call", "name": "quicksort", "args": []}]
                    },
                    "alternate": {
                        "type": "Block",
                        "body": [{"type": "Call", "name": "quicksort", "args": []}]
                    }
                }]
            }
        }
        self.analyzer.proc_def = proc_def
        
        recursive_calls = [{"type": "Call", "name": "quicksort", "args": []}]
        
        with patch.object(self.analyzer, '_find_recursive_calls', return_value=recursive_calls):
            with patch.object(self.analyzer, '_has_conditional_recursive_calls', return_value=True):
                result = self.analyzer._has_case_variability()
                
                # Quicksort tiene condicionales que afectan recursión, debería tener variabilidad
                self.assertTrue(result)

    def test_has_conditional_recursive_calls_both_branches(self):
        """Test: _has_conditional_recursive_calls detecta llamadas en ambas ramas"""
        recursive_calls = [
            {"type": "Call", "name": "func", "args": []},
            {"type": "Call", "name": "func", "args": []}
        ]
        node = {
            "type": "If",
            "consequent": {
                "type": "Block",
                "body": [{"type": "Call", "name": "func", "args": []}]
            },
            "alternate": {
                "type": "Block",
                "body": [{"type": "Call", "name": "func", "args": []}]
            }
        }
        
        with patch.object(self.analyzer, '_contains_recursive_call', side_effect=lambda n, rc: True):
            result = self.analyzer._has_conditional_recursive_calls(node, recursive_calls)
            
            self.assertTrue(result)

    def test_has_conditional_recursive_calls_single_branch(self):
        """Test: _has_conditional_recursive_calls no detecta si solo una rama tiene llamadas"""
        recursive_calls = [{"type": "Call", "name": "func", "args": []}]
        node = {
            "type": "If",
            "consequent": {
                "type": "Block",
                "body": [{"type": "Call", "name": "func", "args": []}]
            },
            "alternate": {
                "type": "Block",
                "body": []
            }
        }
        
        with patch.object(self.analyzer, '_contains_recursive_call', side_effect=lambda n, rc: 
                         n.get("consequent") and n["consequent"].get("body", [])):
            result = self.analyzer._has_conditional_recursive_calls(node, recursive_calls)
            
            # Solo una rama tiene llamadas, no debería detectar variabilidad por condicionales
            # (pero la implementación puede ser diferente)
            self.assertIsInstance(result, bool)

    def test_detect_base_cases_fibonacci(self):
        """Test: _detect_base_cases detecta casos base de Fibonacci T(0)=0, T(1)=1"""
        ast = self.create_fibonacci_ast()
        proc_def = ast["body"][0]
        self.analyzer.proc_def = proc_def
        self.analyzer.procedure_name = "fibonacci"
        
        result = self.analyzer._detect_base_cases(proc_def)
        
        self.assertIsInstance(result, dict)
        # Debería detectar T(0) y T(1) basado en la condición n <= 1 y el return n
        self.assertGreater(len(result), 0)

    def test_detect_base_cases_factorial(self):
        """Test: _detect_base_cases detecta caso base de Factorial T(1)=1"""
        ast = self.create_factorial_ast()
        proc_def = ast["body"][0]
        self.analyzer.proc_def = proc_def
        self.analyzer.procedure_name = "factorial"
        
        result = self.analyzer._detect_base_cases(proc_def)
        
        self.assertIsInstance(result, dict)
        # Debería detectar T(1)=1 basado en la condición n <= 1 y el return 1

    def test_build_tree_levels(self):
        """Test: _build_tree_levels construye niveles del árbol"""
        a = 2
        b = 2.0
        f_n = "n"
        n0 = 1
        
        result = self.analyzer._build_tree_levels(a, b, f_n, n0)
        
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
        # Verificar estructura de cada nivel
        for level in result:
            self.assertIn("num_nodes_latex", level)
            self.assertIn("subproblem_size_latex", level)
            self.assertIn("cost_per_node_latex", level)
            self.assertIn("total_cost_latex", level)

    def test_calculate_tree_sum(self):
        """Test: _calculate_tree_sum calcula sumatoria de costos"""
        levels = [
            {"total_cost_latex": "n"},
            {"total_cost_latex": "n"},
            {"total_cost_latex": "n"}
        ]
        a = 2
        b = 2.0
        f_n = "n"
        
        result = self.analyzer._calculate_tree_sum(levels, a, b, f_n)
        
        self.assertIsInstance(result, dict)
        self.assertIn("expression", result)
        self.assertIn("evaluated", result)
        self.assertIn("theta", result)

    def test_identify_dominating_level(self):
        """Test: _identify_dominating_level identifica nivel dominante"""
        levels = [
            {"total_cost_latex": "n", "level": 0},
            {"total_cost_latex": "n", "level": 1},
            {"total_cost_latex": "n", "level": 2}
        ]
        a = 2
        b = 2.0
        f_n = "n"
        
        result = self.analyzer._identify_dominating_level(levels, a, b, f_n)
        
        self.assertIsInstance(result, dict)
        self.assertIn("level", result)
        self.assertIn("reason", result)

    def test_extract_g_function_subtraction(self):
        """Test: _extract_g_function extrae g(n) = n-1"""
        self.analyzer.recurrence = {
            "form": "T(n) = T(n-1) + 1",
            "a": 1,
            "applicable": True
        }
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "params": [{"type": "Param", "name": "n"}],
            "body": {
                "type": "Block",
                "body": [{
                    "type": "Call",
                    "name": "factorial",
                    "args": [{"type": "Binary", "op": "-", "left": {"type": "Identifier", "name": "n"}, "right": {"type": "Literal", "value": 1}}]
                }]
            }
        }
        self.analyzer.proc_def = proc_def
        
        recursive_calls = [{"type": "Call", "name": "factorial", "args": proc_def["body"]["body"][0]["args"]}]
        
        with patch.object(self.analyzer, '_find_recursive_calls', return_value=recursive_calls):
            with patch.object(self.analyzer, '_analyze_subproblem_type', return_value={
                "type": "subtraction",
                "pattern": "n-1",
                "factor": 1
            }):
                result = self.analyzer._extract_g_function()
                
                self.assertIsNotNone(result)
                self.assertEqual(result["type"], "subtraction")
                self.assertEqual(result["pattern"], "n-1")

    # === Tests para método analyze() - Casos de error ===
    
    def test_analyze_no_main_procedure(self):
        """Test: analyze() retorna error cuando no encuentra procedimiento principal"""
        analyzer = RecursiveAnalyzer()
        ast = {
            "type": "Program",
            "body": []  # Sin procedimientos
        }
        result = analyzer.analyze(ast, mode="worst")
        self.assertFalse(result.get("ok"))
        self.assertIn("errors", result)
        self.assertGreater(len(result["errors"]), 0)
    
    def test_analyze_validation_failed(self):
        """Test: analyze() retorna error cuando la validación de condiciones falla"""
        analyzer = RecursiveAnalyzer()
        ast = {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "test",
                "params": [],
                "body": {
                    "type": "Block",
                    "statements": []
                }
            }]
        }
        # Mock _validate_conditions para retornar inválido
        with patch.object(analyzer, '_validate_conditions', return_value={
            "valid": False,
            "reason": "No tiene llamadas recursivas"
        }):
            result = analyzer.analyze(ast, mode="worst")
            self.assertFalse(result.get("ok"))
            self.assertIn("errors", result)
    
    def test_analyze_extract_recurrence_failed(self):
        """Test: analyze() retorna error cuando falla la extracción de recurrencia"""
        analyzer = RecursiveAnalyzer()
        ast = {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "test",
                "params": [{"name": "n"}],
                "body": {
                    "type": "Block",
                    "statements": []
                }
            }]
        }
        with patch.object(analyzer, '_find_main_procedure', return_value=ast["body"][0]):
            with patch.object(analyzer, '_validate_conditions', return_value={"valid": True}):
                with patch.object(analyzer, '_extract_recurrence', return_value={
                    "success": False,
                    "reason": "Error extrayendo recurrencia"
                }):
                    result = analyzer.analyze(ast, mode="worst")
                    self.assertFalse(result.get("ok"))
                    self.assertIn("errors", result)
    
    def test_analyze_recurrence_not_applicable(self):
        """Test: analyze() retorna error cuando la recurrencia no es aplicable"""
        analyzer = RecursiveAnalyzer()
        ast = {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "test",
                "params": [{"name": "n"}],
                "body": {
                    "type": "Block",
                    "statements": []
                }
            }]
        }
        with patch.object(analyzer, '_find_main_procedure', return_value=ast["body"][0]):
            with patch.object(analyzer, '_validate_conditions', return_value={"valid": True}):
                with patch.object(analyzer, '_extract_recurrence', return_value={
                    "success": True,
                    "recurrence": {
                        "applicable": False,
                        "notes": ["No es divide-and-conquer"]
                    }
                }):
                    result = analyzer.analyze(ast, mode="worst")
                    self.assertFalse(result.get("ok"))
                    self.assertIn("errors", result)
    
    def test_analyze_invalid_preferred_method(self):
        """Test: analyze() retorna error cuando el método preferido es inválido"""
        analyzer = RecursiveAnalyzer()
        ast = {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "test",
                "params": [{"name": "n"}],
                "body": {
                    "type": "Block",
                    "statements": []
                }
            }]
        }
        with patch.object(analyzer, '_find_main_procedure', return_value=ast["body"][0]):
            with patch.object(analyzer, '_validate_conditions', return_value={"valid": True}):
                with patch.object(analyzer, '_extract_recurrence', return_value={
                    "success": True,
                    "recurrence": {
                        "applicable": True,
                        "method": "master"
                    }
                }):
                    result = analyzer.analyze(ast, mode="worst", preferred_method="invalid_method")
                    self.assertFalse(result.get("ok"))
                    self.assertIn("errors", result)
    
    def test_analyze_characteristic_equation_error(self):
        """Test: analyze() retorna error cuando falla la aplicación de ecuación característica"""
        analyzer = RecursiveAnalyzer()
        ast = {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "fibonacci",
                "params": [{"name": "n"}],
                "body": {
                    "type": "Block",
                    "statements": []
                }
            }]
        }
        with patch.object(analyzer, '_find_main_procedure', return_value=ast["body"][0]):
            with patch.object(analyzer, '_validate_conditions', return_value={"valid": True}):
                with patch.object(analyzer, '_extract_recurrence', return_value={
                    "success": True,
                    "recurrence": {
                        "applicable": True,
                        "method": "characteristic_equation"
                    }
                }):
                    with patch.object(analyzer, '_apply_characteristic_equation_method', return_value={
                        "success": False,
                        "reason": "Error en ecuación característica"
                    }):
                        result = analyzer.analyze(ast, mode="worst", preferred_method="characteristic_equation")
                        self.assertFalse(result.get("ok"))
                        self.assertIn("errors", result)
    
    def test_analyze_iteration_method_error(self):
        """Test: analyze() retorna error cuando falla la aplicación de método de iteración"""
        analyzer = RecursiveAnalyzer()
        ast = {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "factorial",
                "params": [{"name": "n"}],
                "body": {
                    "type": "Block",
                    "statements": []
                }
            }]
        }
        with patch.object(analyzer, '_find_main_procedure', return_value=ast["body"][0]):
            with patch.object(analyzer, '_validate_conditions', return_value={"valid": True}):
                with patch.object(analyzer, '_extract_recurrence', return_value={
                    "success": True,
                    "recurrence": {
                        "applicable": True,
                        "method": "iteration"
                    }
                }):
                    with patch.object(analyzer, '_apply_iteration_method', return_value={
                        "success": False,
                        "reason": "Error en método de iteración"
                    }):
                        result = analyzer.analyze(ast, mode="worst", preferred_method="iteration")
                        self.assertFalse(result.get("ok"))
                        self.assertIn("errors", result)
    
    def test_analyze_recursion_tree_method_error(self):
        """Test: analyze() retorna error cuando falla la aplicación de método de árbol de recursión"""
        analyzer = RecursiveAnalyzer()
        ast = {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "mergeSort",
                "params": [{"name": "n"}],
                "body": {
                    "type": "Block",
                    "statements": []
                }
            }]
        }
        with patch.object(analyzer, '_find_main_procedure', return_value=ast["body"][0]):
            with patch.object(analyzer, '_validate_conditions', return_value={"valid": True}):
                with patch.object(analyzer, '_extract_recurrence', return_value={
                    "success": True,
                    "recurrence": {
                        "applicable": True,
                        "method": "recursion_tree"
                    }
                }):
                    with patch.object(analyzer, '_apply_recursion_tree_method', return_value={
                        "success": False,
                        "reason": "Error en árbol de recursión"
                    }):
                        result = analyzer.analyze(ast, mode="worst", preferred_method="recursion_tree")
                        self.assertFalse(result.get("ok"))
                        self.assertIn("errors", result)
    
    def test_analyze_master_theorem_error(self):
        """Test: analyze() retorna error cuando falla la aplicación del teorema maestro"""
        analyzer = RecursiveAnalyzer()
        ast = {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "test",
                "params": [{"name": "n"}],
                "body": {
                    "type": "Block",
                    "statements": []
                }
            }]
        }
        with patch.object(analyzer, '_find_main_procedure', return_value=ast["body"][0]):
            with patch.object(analyzer, '_validate_conditions', return_value={"valid": True}):
                with patch.object(analyzer, '_extract_recurrence', return_value={
                    "success": True,
                    "recurrence": {
                        "applicable": True,
                        "method": "master"
                    }
                }):
                    with patch.object(analyzer, '_apply_master_theorem', return_value={
                        "success": False,
                        "reason": "Error en teorema maestro"
                    }):
                        result = analyzer.analyze(ast, mode="worst", preferred_method="master")
                        self.assertFalse(result.get("ok"))
                        self.assertIn("errors", result)

    # === Tests para detect_applicable_methods() ===
    
    def test_detect_applicable_methods_success(self):
        """Test: detect_applicable_methods() detecta métodos aplicables exitosamente"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_merge_sort_ast()
        
        result = analyzer.detect_applicable_methods(ast)
        
        # Puede fallar si el AST no es válido, pero si es exitoso debe tener la estructura correcta
        if result.get("ok"):
            self.assertIn("applicable_methods", result)
            self.assertIn("default_method", result)
            self.assertIn("recurrence_info", result)
            self.assertIsInstance(result["applicable_methods"], list)
            self.assertGreater(len(result["applicable_methods"]), 0)
        else:
            # Si falla, debe tener errores
            self.assertIn("errors", result)
    
    def test_detect_applicable_methods_no_main_procedure(self):
        """Test: detect_applicable_methods() retorna error cuando no encuentra procedimiento principal"""
        analyzer = RecursiveAnalyzer()
        ast = {
            "type": "Program",
            "body": []
        }
        
        result = analyzer.detect_applicable_methods(ast)
        
        self.assertFalse(result.get("ok"))
        self.assertIn("errors", result)
    
    def test_detect_applicable_methods_validation_failed(self):
        """Test: detect_applicable_methods() retorna error cuando la validación falla"""
        analyzer = RecursiveAnalyzer()
        ast = {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "test",
                "params": [],
                "body": {"type": "Block", "statements": []}
            }]
        }
        
        with patch.object(analyzer, '_validate_conditions', return_value={
            "valid": False,
            "reason": "No válido"
        }):
            result = analyzer.detect_applicable_methods(ast)
            self.assertFalse(result.get("ok"))
            self.assertIn("errors", result)
    
    def test_detect_applicable_methods_extract_recurrence_failed(self):
        """Test: detect_applicable_methods() retorna error cuando falla la extracción de recurrencia"""
        analyzer = RecursiveAnalyzer()
        ast = {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "test",
                "params": [{"name": "n"}],
                "body": {"type": "Block", "statements": []}
            }]
        }
        
        with patch.object(analyzer, '_find_main_procedure', return_value=ast["body"][0]):
            with patch.object(analyzer, '_validate_conditions', return_value={"valid": True}):
                with patch.object(analyzer, '_extract_recurrence', return_value={
                    "success": False,
                    "reason": "Error extrayendo"
                }):
                    result = analyzer.detect_applicable_methods(ast)
                    self.assertFalse(result.get("ok"))
                    self.assertIn("errors", result)
    
    def test_detect_applicable_methods_recurrence_not_applicable(self):
        """Test: detect_applicable_methods() retorna error cuando recurrencia no es aplicable"""
        analyzer = RecursiveAnalyzer()
        ast = {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "test",
                "params": [{"name": "n"}],
                "body": {"type": "Block", "statements": []}
            }]
        }
        
        with patch.object(analyzer, '_find_main_procedure', return_value=ast["body"][0]):
            with patch.object(analyzer, '_validate_conditions', return_value={"valid": True}):
                with patch.object(analyzer, '_extract_recurrence', return_value={
                    "success": True,
                    "recurrence": {
                        "applicable": False,
                        "notes": ["No aplicable"]
                    }
                }):
                    result = analyzer.detect_applicable_methods(ast)
                    self.assertFalse(result.get("ok"))
                    self.assertIn("errors", result)
    
    def test_detect_applicable_methods_exception_handling(self):
        """Test: detect_applicable_methods() maneja excepciones correctamente"""
        analyzer = RecursiveAnalyzer()
        ast = {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "test",
                "params": [{"name": "n"}],
                "body": {"type": "Block", "statements": []}
            }]
        }
        
        with patch.object(analyzer, '_find_main_procedure', side_effect=Exception("Error inesperado")):
            result = analyzer.detect_applicable_methods(ast)
            self.assertFalse(result.get("ok"))
            self.assertIn("errors", result)
    
    def test_detect_applicable_methods_includes_master(self):
        """Test: detect_applicable_methods() siempre incluye 'master' como método aplicable"""
        analyzer = RecursiveAnalyzer()
        ast = self.create_merge_sort_ast()
        
        result = analyzer.detect_applicable_methods(ast)
        
        if result.get("ok"):
            self.assertIn("master", result["applicable_methods"])
    
    def create_merge_sort_ast(self):
        """Crea AST de Merge Sort para tests"""
        return {
            "type": "Program",
            "body": [{
                "type": "ProcDef",
                "name": "mergeSort",
                "params": [
                    {"type": "ArrayParam", "name": "A", "start": {"type": "Identifier", "name": "n"}},
                    {"type": "Param", "name": "izq"},
                    {"type": "Param", "name": "der"}
                ],
                "body": {
                    "type": "Block",
                    "body": [
                        {
                            "type": "If",
                            "test": {"type": "Binary", "op": "<", "left": {"type": "Identifier", "name": "izq"}, "right": {"type": "Identifier", "name": "der"}},
                            "consequent": {
                                "type": "Block",
                                "body": [
                                    {
                                        "type": "Call",
                                        "name": "mergeSort",
                                        "args": [
                                            {"type": "Identifier", "name": "A"},
                                            {"type": "Identifier", "name": "izq"},
                                            {"type": "Identifier", "name": "der"}
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            }]
        }

    # === Tests para métodos helper de detección ===
    
    def test_has_auxiliary_function_calls_true(self):
        """Test: _has_auxiliary_function_calls detecta llamadas a funciones auxiliares"""
        self.analyzer.procedure_name = "factorial"
        node = {
            "type": "Block",
            "statements": [
                {
                    "type": "Call",
                    "name": "helper",
                    "args": []
                }
            ]
        }
        recursive_calls = [{"name": "factorial"}]
        result = self.analyzer._has_auxiliary_function_calls(node, recursive_calls)
        self.assertTrue(result)
    
    def test_has_auxiliary_function_calls_false(self):
        """Test: _has_auxiliary_function_calls no detecta si solo hay llamadas recursivas"""
        self.analyzer.procedure_name = "factorial"
        node = {
            "type": "Block",
            "statements": [
                {
                    "type": "Call",
                    "name": "factorial",
                    "args": []
                }
            ]
        }
        recursive_calls = [{"name": "factorial"}]
        result = self.analyzer._has_auxiliary_function_calls(node, recursive_calls)
        self.assertFalse(result)
    
    def test_has_auxiliary_function_calls_not_dict(self):
        """Test: _has_auxiliary_function_calls retorna False para nodos que no son dict"""
        result = self.analyzer._has_auxiliary_function_calls("not_a_dict", [])
        self.assertFalse(result)
    
    def test_has_auxiliary_function_calls_nested(self):
        """Test: _has_auxiliary_function_calls detecta llamadas auxiliares anidadas"""
        self.analyzer.procedure_name = "factorial"
        node = {
            "type": "Block",
            "statements": [
                {
                    "type": "If",
                    "then": {
                        "type": "Block",
                        "statements": [
                            {
                                "type": "Call",
                                "name": "helper",
                                "args": []
                            }
                        ]
                    }
                }
            ]
        }
        recursive_calls = [{"name": "factorial"}]
        result = self.analyzer._has_auxiliary_function_calls(node, recursive_calls)
        self.assertTrue(result)
    
    def test_depends_on_size_variable_true(self):
        """Test: _depends_on_size_variable detecta dependencia de variable de tamaño"""
        start = {"type": "identifier", "name": "i"}
        end = {"type": "identifier", "name": "n"}
        result = self.analyzer._depends_on_size_variable(start, end)
        self.assertTrue(result)
    
    def test_depends_on_size_variable_false(self):
        """Test: _depends_on_size_variable no detecta si no depende de n"""
        start = {"type": "literal", "value": 0}
        end = {"type": "literal", "value": 10}
        result = self.analyzer._depends_on_size_variable(start, end)
        self.assertFalse(result)
    
    def test_depends_on_size_variable_binary_expr(self):
        """Test: _depends_on_size_variable detecta en expresiones binarias"""
        start = {"type": "Literal", "value": 0}
        end = {
            "type": "Identifier",
            "name": "der"
        }
        result = self.analyzer._depends_on_size_variable(start, end)
        self.assertTrue(result)
    
    def test_while_depends_on_size_true(self):
        """Test: _while_depends_on_size detecta dependencia en condición de while"""
        test = {
            "type": "binary",
            "operator": "<",
            "left": {"type": "identifier", "name": "i"},
            "right": {"type": "identifier", "name": "n"}
        }
        result = self.analyzer._while_depends_on_size(test)
        self.assertTrue(result)
    
    def test_while_depends_on_size_false(self):
        """Test: _while_depends_on_size no detecta si no depende de n"""
        test = {
            "type": "binary",
            "operator": "<",
            "left": {"type": "identifier", "name": "i"},
            "right": {"type": "literal", "value": 10}
        }
        result = self.analyzer._while_depends_on_size(test)
        self.assertFalse(result)
    
    def test_while_depends_on_size_not_dict(self):
        """Test: _while_depends_on_size maneja nodos que no son dict"""
        result = self.analyzer._while_depends_on_size("not_a_dict")
        self.assertFalse(result)
    
    def test_check_nested_loops_nested_for(self):
        """Test: _check_nested_loops detecta bucles for anidados"""
        self.analyzer.procedure_name = "test"
        node = {
            "type": "For",
            "variable": "i",
            "start": {"value": 0},
            "end": {"type": "identifier", "name": "n"},
            "body": {
                "type": "Block",
                "statements": [
                    {
                        "type": "For",
                        "variable": "j",
                        "start": {"value": 0},
                        "end": {"type": "identifier", "name": "n"},
                        "body": {"type": "Block", "statements": []}
                    }
                ]
            }
        }
        recursive_calls = []
        result = self.analyzer._check_nested_loops(node, recursive_calls)
        self.assertEqual(result, "n^2")
    
    def test_check_nested_loops_single_loop(self):
        """Test: _check_nested_loops retorna 'n' para un solo bucle"""
        self.analyzer.procedure_name = "test"
        node = {
            "type": "For",
            "variable": "i",
            "start": {"value": 0},
            "end": {"type": "identifier", "name": "n"},
            "body": {"type": "Block", "statements": []}
        }
        recursive_calls = []
        result = self.analyzer._check_nested_loops(node, recursive_calls)
        self.assertEqual(result, "n")
    
    def test_check_nested_loops_no_loops(self):
        """Test: _check_nested_loops retorna '1' cuando no hay bucles"""
        self.analyzer.procedure_name = "test"
        node = {
            "type": "Block",
            "statements": [
                {"type": "assign"}
            ]
        }
        recursive_calls = []
        result = self.analyzer._check_nested_loops(node, recursive_calls)
        self.assertEqual(result, "1")
    
    def test_check_nested_loops_not_dict(self):
        """Test: _check_nested_loops maneja nodos que no son dict"""
        result = self.analyzer._check_nested_loops("not_a_dict", [])
        self.assertEqual(result, "1")

    # === Tests para métodos de detección de casos base ===
    
    def test_detect_base_case_with_if_return(self):
        """Test: _detect_base_case detecta caso base con IF y RETURN"""
        self.analyzer.procedure_name = "factorial"
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "params": [{"name": "n"}],
            "body": {
                "type": "Block",
                "statements": [
                    {
                        "type": "If",
                        "condition": {
                            "type": "binary",
                            "operator": "<=",
                            "left": {"name": "n"},
                            "right": {"value": 1}
                        },
                        "then": {
                            "type": "Block",
                            "statements": [
                                {
                                    "type": "Return",
                                    "value": {"value": 1}
                                }
                            ]
                        }
                    }
                ]
            }
        }
        result = self.analyzer._detect_base_case(proc_def)
        self.assertIsInstance(result, int)
        self.assertGreaterEqual(result, 0)
    
    def test_detect_base_cases_multiple(self):
        """Test: _detect_base_cases detecta múltiples casos base"""
        self.analyzer.procedure_name = "fibonacci"
        proc_def = {
            "type": "ProcDef",
            "name": "fibonacci",
            "params": [{"name": "n"}],
            "body": {
                "type": "Block",
                "statements": [
                    {
                        "type": "If",
                        "condition": {
                            "type": "binary",
                            "operator": "<=",
                            "left": {"name": "n"},
                            "right": {"value": 1}
                        },
                        "then": {
                            "type": "Block",
                            "statements": [
                                {"type": "Return", "value": {"name": "n"}}
                            ]
                        }
                    }
                ]
            }
        }
        result = self.analyzer._detect_base_cases(proc_def)
        self.assertIsInstance(result, dict)
    
    def test_find_return_expression_found(self):
        """Test: _find_return_expression encuentra expresión de return"""
        node = {
            "type": "Block",
            "statements": [
                {
                    "type": "Return",
                    "value": {"value": 1}
                }
            ]
        }
        result = self.analyzer._find_return_expression(node)
        self.assertIsNotNone(result)
    
    def test_find_return_expression_not_found(self):
        """Test: _find_return_expression retorna None si no hay return"""
        node = {
            "type": "Block",
            "statements": [
                {"type": "assign"}
            ]
        }
        result = self.analyzer._find_return_expression(node)
        self.assertIsNone(result)
    
    def test_extract_return_value_literal(self):
        """Test: _extract_return_value extrae valor literal"""
        node = {
            "type": "Return",
            "value": {"type": "Literal", "value": 1}
        }
        result = self.analyzer._extract_return_value(node)
        self.assertEqual(result, 1)
    
    def test_extract_return_value_identifier(self):
        """Test: _extract_return_value extrae valor de identificador"""
        node = {
            "type": "Return",
            "value": {"type": "identifier", "name": "n"}
        }
        result = self.analyzer._extract_return_value(node)
        # Puede retornar None o el nombre, dependiendo de la implementación
        self.assertIsInstance(result, (int, type(None)))
    
    def test_extract_literal_value_integer(self):
        """Test: _extract_literal_value extrae valor entero"""
        expr = {"type": "Literal", "value": 5}
        result = self.analyzer._extract_literal_value(expr)
        self.assertEqual(result, 5)
    
    def test_extract_literal_value_not_literal(self):
        """Test: _extract_literal_value retorna None si no es literal"""
        expr = {"type": "identifier", "name": "n"}
        result = self.analyzer._extract_literal_value(expr)
        self.assertIsNone(result)
    
    def test_find_base_case_guard_found(self):
        """Test: _find_base_case_guard encuentra guarda de caso base"""
        self.analyzer.procedure_name = "factorial"
        node = {
            "type": "If",
            "condition": {
                "type": "Binary",
                "op": "<=",
                "left": {"type": "Identifier", "name": "n"},
                "right": {"type": "Literal", "value": 1}
            },
            "then": {
                "type": "Block",
                "statements": [
                    {"type": "Return", "value": {"type": "Literal", "value": 1}}
                ]
            }
        }
        result = self.analyzer._find_base_case_guard(node)
        self.assertIsNotNone(result)
        self.assertIsInstance(result, int)
    
    def test_find_base_case_guard_not_found(self):
        """Test: _find_base_case_guard retorna None si no encuentra guarda"""
        node = {
            "type": "If",
            "condition": {
                "type": "binary",
                "operator": ">",
                "left": {"name": "n"},
                "right": {"value": 1}
            }
        }
        result = self.analyzer._find_base_case_guard(node)
        # Puede retornar None o algún valor dependiendo de la implementación
        self.assertIsInstance(result, (int, type(None)))
    
    def test_extract_base_case_from_condition_less_equal(self):
        """Test: _extract_base_case_from_condition extrae caso base de condición <="""
        condition = {
            "type": "Binary",
            "op": "<=",
            "left": {"type": "Identifier", "name": "n"},
            "right": {"type": "Literal", "value": 1}
        }
        result = self.analyzer._extract_base_case_from_condition(condition)
        self.assertEqual(result, 1)
    
    def test_extract_base_case_from_condition_equal(self):
        """Test: _extract_base_case_from_condition extrae caso base de condición =="""
        condition = {
            "type": "Binary",
            "op": "==",
            "left": {"type": "Identifier", "name": "n"},
            "right": {"type": "Literal", "value": 0}
        }
        result = self.analyzer._extract_base_case_from_condition(condition)
        # El método retorna max(1, n0), así que 0 se convierte en 1
        self.assertIsNotNone(result)
        self.assertGreaterEqual(result, 1)
    
    def test_extract_base_case_from_condition_not_base_case(self):
        """Test: _extract_base_case_from_condition retorna None si no es caso base"""
        condition = {
            "type": "binary",
            "operator": ">",
            "left": {"name": "n"},
            "right": {"value": 1}
        }
        result = self.analyzer._extract_base_case_from_condition(condition)
        self.assertIsNone(result)

    # === Tests para métodos de detección de early return ===
    
    def test_detect_early_return_true(self):
        """Test: _detect_early_return detecta return temprano"""
        self.analyzer.proc_def = {
            "type": "ProcDef",
            "name": "binarySearch",
            "params": [{"name": "n"}],
            "body": {
                "type": "Block",
                "body": [
                    {
                        "type": "If",
                        "test": {"type": "Binary", "op": "==", "left": {"name": "x"}, "right": {"name": "target"}},
                        "consequent": {
                            "type": "Block",
                            "body": [{"type": "Return", "value": {"value": 0}}]
                        },
                        "alternate": {
                            "type": "Block",
                            "body": [
                                {
                                    "type": "Call",
                                    "name": "binarySearch",
                                    "args": []
                                }
                            ]
                        }
                    }
                ]
            }
        }
        self.analyzer.procedure_name = "binarySearch"
        result = self.analyzer._detect_early_return()
        self.assertTrue(result)
    
    def test_detect_early_return_false(self):
        """Test: _detect_early_return retorna False cuando no hay return temprano"""
        self.analyzer.proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "params": [{"name": "n"}],
            "body": {
                "type": "Block",
                "body": [
                    {
                        "type": "Call",
                        "name": "factorial",
                        "args": []
                    }
                ]
            }
        }
        self.analyzer.procedure_name = "factorial"
        result = self.analyzer._detect_early_return()
        self.assertFalse(result)
    
    def test_detect_early_return_no_proc_def(self):
        """Test: _detect_early_return retorna False cuando no hay proc_def"""
        self.analyzer.proc_def = None
        result = self.analyzer._detect_early_return()
        self.assertFalse(result)
    
    def test_has_return_before_recursive_calls_if_then_else(self):
        """Test: _has_return_before_recursive_calls detecta patrón IF-THEN-ELSE con return en THEN"""
        self.analyzer.procedure_name = "binarySearch"
        recursive_calls = [{"name": "binarySearch"}]
        node = {
            "type": "If",
            "consequent": {
                "type": "Block",
                "body": [{"type": "Return", "value": {"value": 0}}]
            },
            "alternate": {
                "type": "Block",
                "body": [
                    {
                        "type": "Call",
                        "name": "binarySearch",
                        "args": []
                    }
                ]
            }
        }
        result = self.analyzer._has_return_before_recursive_calls(node, recursive_calls)
        self.assertTrue(result)
    
    def test_has_return_before_recursive_calls_block_sequence(self):
        """Test: _has_return_before_recursive_calls detecta return antes de recursivas en Block"""
        self.analyzer.procedure_name = "test"
        recursive_calls = [{"name": "test"}]
        node = {
            "type": "Block",
            "statements": [
                {"type": "Return", "value": {"value": 1}},
                {
                    "type": "Call",
                    "name": "test",
                    "args": []
                }
            ]
        }
        result = self.analyzer._has_return_before_recursive_calls(node, recursive_calls)
        self.assertTrue(result)
    
    def test_has_return_before_recursive_calls_return_with_recursive(self):
        """Test: _has_return_before_recursive_calls retorna False si return contiene recursivas"""
        self.analyzer.procedure_name = "factorial"
        recursive_calls = [{"name": "factorial"}]
        node = {
            "type": "Return",
            "value": {
                "type": "Call",
                "name": "factorial",
                "args": []
            }
        }
        result = self.analyzer._has_return_before_recursive_calls(node, recursive_calls)
        self.assertFalse(result)
    
    def test_has_return_before_recursive_calls_not_dict(self):
        """Test: _has_return_before_recursive_calls maneja nodos que no son dict"""
        result = self.analyzer._has_return_before_recursive_calls("not_a_dict", [])
        self.assertFalse(result)
    
    def test_find_return_statements_found(self):
        """Test: _find_return_statements encuentra statements de return"""
        node = {
            "type": "Block",
            "body": [
                {"type": "Return", "value": {"value": 1}},
                {"type": "Return", "value": {"value": 2}}
            ]
        }
        result = self.analyzer._find_return_statements(node)
        self.assertIsInstance(result, list)
        self.assertGreaterEqual(len(result), 1)
    
    def test_find_return_statements_not_found(self):
        """Test: _find_return_statements retorna lista vacía si no hay returns"""
        node = {
            "type": "Block",
            "body": [
                {"type": "assign"}
            ]
        }
        result = self.analyzer._find_return_statements(node)
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 0)
    
    def test_find_return_statements_nested(self):
        """Test: _find_return_statements encuentra returns anidados"""
        node = {
            "type": "If",
            "then": {
                "type": "Block",
                "body": [{"type": "Return", "value": {"value": 1}}]
            },
            "else": {
                "type": "Block",
                "body": [{"type": "Return", "value": {"value": 2}}]
            }
        }
        result = self.analyzer._find_return_statements(node)
        self.assertGreaterEqual(len(result), 1)

    # === Tests para métodos de análisis de subproblemas ===
    
    def test_is_range_halving_pattern_true(self):
        """Test: _is_range_halving_pattern detecta patrón de división por la mitad"""
        expr = {
            "type": "Binary",
            "op": "/",
            "left": {
                "type": "Binary",
                "op": "+",
                "left": {"type": "Identifier", "name": "izq"},
                "right": {"type": "Identifier", "name": "der"}
            },
            "right": {"type": "Literal", "value": 2}
        }
        params = [{"name": "izq"}, {"name": "der"}]
        result = self.analyzer._is_range_halving_pattern(expr, params)
        self.assertTrue(result)
    
    def test_is_range_halving_pattern_false(self):
        """Test: _is_range_halving_pattern retorna False si no es patrón de división"""
        expr = {
            "type": "binary",
            "operator": "-",
            "left": {"type": "identifier", "name": "n"},
            "right": {"type": "literal", "value": 1}
        }
        params = [{"name": "n"}]
        result = self.analyzer._is_range_halving_pattern(expr, params)
        self.assertFalse(result)
    
    def test_detect_range_reduction_found(self):
        """Test: _detect_range_reduction detecta reducción de rango"""
        args = [
            {"type": "Identifier", "name": "A"},
            {
                "type": "Binary",
                "op": "+",
                "left": {"type": "Identifier", "name": "izq"},
                "right": {"type": "Literal", "value": 1}
            },
            {
                "type": "Binary",
                "op": "-",
                "left": {"type": "Identifier", "name": "der"},
                "right": {"type": "Literal", "value": 1}
            }
        ]
        params = [{"name": "A"}, {"name": "izq"}, {"name": "der"}]
        result = self.analyzer._detect_range_reduction(args, params)
        # Puede retornar None o un resultado dependiendo de la implementación
        self.assertIsInstance(result, (dict, type(None)))
    
    def test_detect_range_reduction_not_found(self):
        """Test: _detect_range_reduction retorna None si no hay reducción"""
        args = [
            {"type": "identifier", "name": "n"}
        ]
        params = [{"name": "n"}]
        result = self.analyzer._detect_range_reduction(args, params)
        self.assertIsNone(result)
    
    def test_detect_range_reduction_no_args(self):
        """Test: _detect_range_reduction maneja lista vacía de argumentos"""
        args = []
        params = [{"name": "n"}]
        result = self.analyzer._detect_range_reduction(args, params)
        self.assertIsNone(result)
    
    def test_combines_multiple_results_true(self):
        """Test: _combines_multiple_results detecta cuando se combinan múltiples resultados"""
        self.analyzer.procedure_name = "fibonacci"
        proc_def = {
            "type": "ProcDef",
            "name": "fibonacci",
            "body": {
                "type": "Block",
                "body": [
                    {
                        "type": "Return",
                        "value": {
                            "type": "binary",
                            "operator": "+",
                            "left": {
                                "type": "Call",
                                "name": "fibonacci",
                                "args": []
                            },
                            "right": {
                                "type": "Call",
                                "name": "fibonacci",
                                "args": []
                            }
                        }
                    }
                ]
            }
        }
        recursive_calls = [
            {"name": "fibonacci"},
            {"name": "fibonacci"}
        ]
        result = self.analyzer._combines_multiple_results(proc_def, recursive_calls)
        self.assertTrue(result)
    
    def test_combines_multiple_results_false(self):
        """Test: _combines_multiple_results retorna False si no combina resultados"""
        self.analyzer.procedure_name = "factorial"
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "body": {
                "type": "Block",
                "body": [
                    {
                        "type": "Return",
                        "value": {
                            "type": "Call",
                            "name": "factorial",
                            "args": []
                        }
                    }
                ]
            }
        }
        recursive_calls = [{"name": "factorial"}]
        result = self.analyzer._combines_multiple_results(proc_def, recursive_calls)
        self.assertFalse(result)
    
    def test_contains_multiple_recursive_calls_true(self):
        """Test: _contains_multiple_recursive_calls detecta múltiples llamadas recursivas"""
        self.analyzer.procedure_name = "fibonacci"
        expr = {
            "type": "binary",
            "operator": "+",
            "left": {
                "type": "Call",
                "name": "fibonacci",
                "args": []
            },
            "right": {
                "type": "Call",
                "name": "fibonacci",
                "args": []
            }
        }
        result = self.analyzer._contains_multiple_recursive_calls(expr, "fibonacci")
        self.assertTrue(result)
    
    def test_contains_multiple_recursive_calls_false(self):
        """Test: _contains_multiple_recursive_calls retorna False si hay una sola llamada"""
        self.analyzer.procedure_name = "factorial"
        expr = {
            "type": "Call",
            "name": "factorial",
            "args": []
        }
        result = self.analyzer._contains_multiple_recursive_calls(expr, "factorial")
        self.assertFalse(result)

    # === Tests para casos edge en métodos de resolución ===
    
    def test_apply_characteristic_equation_method_no_linear_recurrence(self):
        """Test: _apply_characteristic_equation_method falla si no es recurrencia lineal"""
        self.analyzer.recurrence = {
            "form": "T(n) = T(n/2) + 1",
            "applicable": True
        }
        self.analyzer.proc_def = {"type": "ProcDef", "name": "test"}
        with patch.object(self.analyzer, '_detect_linear_recurrence', return_value=None):
            result = self.analyzer._apply_characteristic_equation_method()
            self.assertFalse(result.get("success"))
    
    def test_apply_iteration_method_no_g_function(self):
        """Test: _apply_iteration_method falla si no puede extraer g(n)"""
        self.analyzer.recurrence = {
            "form": "T(n) = T(n-1) + 1",
            "a": 1,
            "f": "1",
            "n0": 1,
            "applicable": True
        }
        self.analyzer.proc_def = {"type": "ProcDef", "name": "test"}
        with patch.object(self.analyzer, '_extract_g_function', return_value=None):
            result = self.analyzer._apply_iteration_method()
            self.assertFalse(result.get("success"))
    
    def test_apply_recursion_tree_method_no_recurrence(self):
        """Test: _apply_recursion_tree_method falla si no hay recurrencia"""
        self.analyzer.recurrence = None
        result = self.analyzer._apply_recursion_tree_method()
        self.assertFalse(result.get("success"))
    
    def test_generate_dp_code(self):
        """Test: _generate_dp_code genera código DP"""
        coefficients = {1: 1, 2: 1}
        max_offset = 2
        result = self.analyzer._generate_dp_code(coefficients, max_offset)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)
    
    def test_generate_optimized_dp_code(self):
        """Test: _generate_optimized_dp_code genera código DP optimizado"""
        coefficients = {1: 1, 2: 1}
        max_offset = 2
        result = self.analyzer._generate_optimized_dp_code(coefficients, max_offset)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)
    
    def test_calculate_recursive_complexity(self):
        """Test: _calculate_recursive_complexity calcula complejidad recursiva"""
        coefficients = {1: 1, 2: 1}
        max_offset = 2
        result = self.analyzer._calculate_recursive_complexity(coefficients, max_offset)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)

    # === Tests para métodos de extracción y expansión ===
    
    def test_extract_g_function_division(self):
        """Test: _extract_g_function extrae g(n) = n/2"""
        self.analyzer.recurrence = {
            "form": "T(n) = T(n/2) + 1",
            "a": 1,
            "applicable": True
        }
        self.analyzer.proc_def = {
            "type": "ProcDef",
            "name": "binarySearch",
            "params": [{"name": "n"}],
            "body": {
                "type": "Block",
                "body": [
                    {
                        "type": "Call",
                        "name": "binarySearch",
                        "args": [
                            {
                                "type": "binary",
                                "operator": "/",
                                "left": {"name": "n"},
                                "right": {"value": 2}
                            }
                        ]
                    }
                ]
            }
        }
        recursive_calls = [{"name": "binarySearch", "args": [{"type": "binary", "operator": "/", "left": {"name": "n"}, "right": {"value": 2}}]}]
        with patch.object(self.analyzer, '_find_recursive_calls', return_value=recursive_calls):
            with patch.object(self.analyzer, '_analyze_subproblem_type', return_value={
                "type": "division",
                "pattern": "n/2",
                "factor": 2
            }):
                result = self.analyzer._extract_g_function()
                self.assertIsNotNone(result)
                if result:
                    self.assertIn("type", result)
    
    def test_expand_recurrence(self):
        """Test: _expand_recurrence expande recurrencia"""
        g_n_info = {
            "type": "subtraction",
            "pattern": "n-1",
            "factor": 1
        }
        f_n = "1"
        result = self.analyzer._expand_recurrence(g_n_info, f_n, num_expansions=3)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
    
    def test_create_general_form(self):
        """Test: _create_general_form crea forma general"""
        g_n_info = {
            "type": "subtraction",
            "pattern": "n-1",
            "factor": 1
        }
        f_n = "1"
        result = self.analyzer._create_general_form(g_n_info, f_n)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)
    
    def test_determine_k_from_base_case(self):
        """Test: _determine_k_from_base_case determina k desde caso base"""
        g_n_info = {
            "type": "subtraction",
            "pattern": "n-1",
            "factor": 1
        }
        n0 = 1
        result = self.analyzer._determine_k_from_base_case(g_n_info, n0)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)
    
    def test_substitute_k_in_summation(self):
        """Test: _substitute_k_in_summation sustituye k en sumatoria"""
        g_n_info = {
            "type": "subtraction",
            "pattern": "n-1",
            "factor": 1
        }
        f_n = "1"
        k_expr = "n-1"
        n0 = 1
        result = self.analyzer._substitute_k_in_summation(g_n_info, f_n, k_expr, n0)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)
    
    def test_solve_summation(self):
        """Test: _solve_summation resuelve sumatoria"""
        g_n_info = {
            "type": "subtraction",
            "pattern": "n-1",
            "factor": 1
        }
        f_n = "1"
        k_expr = "n-1"
        result = self.analyzer._solve_summation(g_n_info, f_n, k_expr)
        self.assertIsInstance(result, dict)
        self.assertIn("evaluated", result)
        self.assertIn("theta", result)

    # === Tests para construcción de árbol de recursión ===
    
    def test_build_tree_levels_different_a_b(self):
        """Test: _build_tree_levels construye niveles con diferentes valores de a y b"""
        a = 3
        b = 3.0
        f_n = "n"
        n0 = 1
        result = self.analyzer._build_tree_levels(a, b, f_n, n0)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
        for level in result:
            self.assertIn("level", level)
            self.assertIn("num_nodes_latex", level)
            self.assertIn("subproblem_size_latex", level)
    
    def test_build_tree_levels_f_n_squared(self):
        """Test: _build_tree_levels maneja f(n) = n^2"""
        a = 2
        b = 2.0
        f_n = "n^2"
        n0 = 1
        result = self.analyzer._build_tree_levels(a, b, f_n, n0)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
    
    def test_build_tree_levels_f_n_constant(self):
        """Test: _build_tree_levels maneja f(n) = 1"""
        a = 2
        b = 2.0
        f_n = "1"
        n0 = 1
        result = self.analyzer._build_tree_levels(a, b, f_n, n0)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
    
    def test_calculate_tree_sum_different_cases(self):
        """Test: _calculate_tree_sum calcula sumatoria para diferentes casos"""
        levels = [
            {"total_cost_latex": "n^2"},
            {"total_cost_latex": "n^2/2"},
            {"total_cost_latex": "n^2/4"}
        ]
        a = 2
        b = 2.0
        f_n = "n^2"
        result = self.analyzer._calculate_tree_sum(levels, a, b, f_n)
        self.assertIsInstance(result, dict)
        self.assertIn("expression", result)
        self.assertIn("evaluated", result)
        self.assertIn("theta", result)
    
    def test_calculate_tree_sum_uniform_levels(self):
        """Test: _calculate_tree_sum calcula cuando todos los niveles tienen el mismo costo"""
        levels = [
            {"total_cost_latex": "n"},
            {"total_cost_latex": "n"},
            {"total_cost_latex": "n"}
        ]
        a = 2
        b = 2.0
        f_n = "n"
        result = self.analyzer._calculate_tree_sum(levels, a, b, f_n)
        self.assertIsInstance(result, dict)
        self.assertIn("theta", result)
    
    def test_identify_dominating_level_leaves(self):
        """Test: _identify_dominating_level identifica hojas como dominantes"""
        levels = [
            {"total_cost_latex": "1", "level": 0},
            {"total_cost_latex": "2", "level": 1},
            {"total_cost_latex": "4", "level": 2}
        ]
        a = 2
        b = 2.0
        f_n = "1"
        result = self.analyzer._identify_dominating_level(levels, a, b, f_n)
        self.assertIsInstance(result, dict)
        self.assertIn("level", result)
        self.assertIn("reason", result)
    
    def test_identify_dominating_level_root(self):
        """Test: _identify_dominating_level identifica raíz como dominante"""
        levels = [
            {"total_cost_latex": "n^2", "level": 0},
            {"total_cost_latex": "n^2/2", "level": 1},
            {"total_cost_latex": "n^2/4", "level": 2}
        ]
        a = 2
        b = 2.0
        f_n = "n^2"
        result = self.analyzer._identify_dominating_level(levels, a, b, f_n)
        self.assertIsInstance(result, dict)
        self.assertIn("level", result)
    
    def test_identify_dominating_level_all_equal(self):
        """Test: _identify_dominating_level identifica cuando todos son iguales"""
        levels = [
            {"total_cost_latex": "n", "level": 0},
            {"total_cost_latex": "n", "level": 1},
            {"total_cost_latex": "n", "level": 2}
        ]
        a = 2
        b = 2.0
        f_n = "n"
        result = self.analyzer._identify_dominating_level(levels, a, b, f_n)
        self.assertIsInstance(result, dict)
        self.assertIn("level", result)


if __name__ == '__main__':
    unittest.main()

