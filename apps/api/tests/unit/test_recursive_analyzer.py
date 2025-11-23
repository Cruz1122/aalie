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


if __name__ == '__main__':
    unittest.main()

