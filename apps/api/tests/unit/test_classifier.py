"""
Tests unitarios para app.modules.classification.classifier.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import unittest
from app.modules.classification.classifier import (
    detect_algorithm_kind,
    _has_iterative_constructs,
    _find_node_type,
    _find_procedure_definition,
    _has_recursive_calls,
    _search_recursive_calls
)


class TestDetectAlgorithmKind(unittest.TestCase):
    """Tests para la función detect_algorithm_kind."""

    def test_iterative_algorithm(self):
        """Test: Detecta algoritmo iterativo"""
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "test",
                    "body": [
                        {"type": "For", "variable": "i", "start": 1, "end": 10}
                    ]
                }
            ]
        }
        result = detect_algorithm_kind(ast)
        self.assertEqual(result, "iterative")

    def test_recursive_algorithm(self):
        """Test: Detecta algoritmo recursivo"""
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "factorial",
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "Call",
                                "name": "factorial"
                            }
                        ]
                    }
                }
            ]
        }
        result = detect_algorithm_kind(ast)
        self.assertEqual(result, "recursive")

    def test_hybrid_algorithm(self):
        """Test: Detecta algoritmo híbrido (iterativo y recursivo)"""
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "hybrid",
                    "body": {
                        "type": "Block",
                        "body": [
                            {"type": "For", "variable": "i"},
                            {
                                "type": "Call",
                                "name": "hybrid"
                            }
                        ]
                    }
                }
            ]
        }
        result = detect_algorithm_kind(ast)
        self.assertEqual(result, "hybrid")

    def test_unknown_algorithm(self):
        """Test: Detecta algoritmo desconocido (sin iteración ni recursión)"""
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "simple",
                    "body": [
                        {"type": "Assign", "variable": "x", "value": 1}
                    ]
                }
            ]
        }
        result = detect_algorithm_kind(ast)
        self.assertEqual(result, "unknown")

    def test_no_procedure_definition(self):
        """Test: Maneja AST sin definición de procedimiento"""
        ast = {
            "type": "Program",
            "body": []
        }
        result = detect_algorithm_kind(ast)
        self.assertEqual(result, "unknown")


class TestHasIterativeConstructs(unittest.TestCase):
    """Tests para la función _has_iterative_constructs."""

    def test_has_for_loop(self):
        """Test: Detecta bucle For"""
        ast = {"type": "For", "variable": "i"}
        result = _has_iterative_constructs(ast)
        self.assertTrue(result)

    def test_has_while_loop(self):
        """Test: Detecta bucle While"""
        ast = {"type": "While", "condition": True}
        result = _has_iterative_constructs(ast)
        self.assertTrue(result)

    def test_has_repeat_loop(self):
        """Test: Detecta bucle Repeat"""
        ast = {"type": "Repeat", "condition": True}
        result = _has_iterative_constructs(ast)
        self.assertTrue(result)

    def test_no_iterative_constructs(self):
        """Test: No detecta construcciones iterativas"""
        ast = {"type": "Assign", "variable": "x", "value": 1}
        result = _has_iterative_constructs(ast)
        self.assertFalse(result)

    def test_nested_iterative_constructs(self):
        """Test: Detecta construcciones iterativas anidadas"""
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "body": [
                        {
                            "type": "If",
                            "then": [
                                {"type": "For", "variable": "i"}
                            ]
                        }
                    ]
                }
            ]
        }
        result = _has_iterative_constructs(ast)
        self.assertTrue(result)


class TestFindNodeType(unittest.TestCase):
    """Tests para la función _find_node_type."""

    def test_finds_node_in_dict(self):
        """Test: Encuentra nodo en diccionario"""
        node = {"type": "For", "variable": "i"}
        result = _find_node_type(node, ["For"])
        self.assertTrue(result)

    def test_finds_node_in_nested_structure(self):
        """Test: Encuentra nodo en estructura anidada"""
        node = {
            "type": "Program",
            "body": [
                {"type": "ProcDef", "body": [{"type": "For"}]}
            ]
        }
        result = _find_node_type(node, ["For"])
        self.assertTrue(result)

    def test_finds_node_in_list(self):
        """Test: Encuentra nodo en lista"""
        node = {
            "type": "Program",
            "body": [
                {"type": "While"},
                {"type": "Assign"}
            ]
        }
        result = _find_node_type(node, ["While"])
        self.assertTrue(result)

    def test_does_not_find_node(self):
        """Test: No encuentra nodo que no existe"""
        node = {"type": "Assign", "variable": "x"}
        result = _find_node_type(node, ["For", "While"])
        self.assertFalse(result)

    def test_handles_non_dict_node(self):
        """Test: Maneja nodo que no es diccionario"""
        result = _find_node_type("string", ["For"])
        self.assertFalse(result)
        result = _find_node_type(123, ["For"])
        self.assertFalse(result)
        result = _find_node_type([1, 2, 3], ["For"])
        self.assertFalse(result)

    def test_skips_type_and_pos_fields(self):
        """Test: Omite campos type y pos en búsqueda recursiva"""
        node = {
            "type": "Program",
            "pos": {"line": 1, "column": 1},
            "body": [{"type": "For"}]
        }
        result = _find_node_type(node, ["For"])
        self.assertTrue(result)


class TestFindProcedureDefinition(unittest.TestCase):
    """Tests para la función _find_procedure_definition."""

    def test_finds_procedure_definition(self):
        """Test: Encuentra definición de procedimiento"""
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "test",
                    "body": []
                }
            ]
        }
        result = _find_procedure_definition(ast)
        self.assertIsNotNone(result)
        self.assertEqual(result["type"], "ProcDef")
        self.assertEqual(result["name"], "test")

    def test_no_procedure_definition(self):
        """Test: No encuentra definición de procedimiento"""
        ast = {
            "type": "Program",
            "body": [
                {"type": "Assign", "variable": "x"}
            ]
        }
        result = _find_procedure_definition(ast)
        self.assertIsNone(result)

    def test_empty_body(self):
        """Test: Maneja body vacío"""
        ast = {
            "type": "Program",
            "body": []
        }
        result = _find_procedure_definition(ast)
        self.assertIsNone(result)

    def test_non_list_body(self):
        """Test: Maneja body que no es lista"""
        ast = {
            "type": "Program",
            "body": "not a list"
        }
        result = _find_procedure_definition(ast)
        self.assertIsNone(result)


class TestHasRecursiveCalls(unittest.TestCase):
    """Tests para la función _has_recursive_calls."""

    def test_has_recursive_call_in_body(self):
        """Test: Detecta llamada recursiva en body"""
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "body": {
                "type": "Block",
                "body": [
                    {
                        "type": "Call",
                        "name": "factorial"
                    }
                ]
            }
        }
        result = _has_recursive_calls(proc_def, "factorial")
        self.assertTrue(result)

    def test_has_recursive_call_in_block(self):
        """Test: Detecta llamada recursiva en block"""
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "block": {
                "type": "Block",
                "body": [
                    {
                        "type": "Call",
                        "name": "factorial"
                    }
                ]
            }
        }
        result = _has_recursive_calls(proc_def, "factorial")
        self.assertTrue(result)

    def test_has_recursive_call_in_statements(self):
        """Test: Detecta llamada recursiva en statements"""
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "statements": {
                "type": "Block",
                "body": [
                    {
                        "type": "Call",
                        "name": "factorial"
                    }
                ]
            }
        }
        result = _has_recursive_calls(proc_def, "factorial")
        self.assertTrue(result)

    def test_no_recursive_call(self):
        """Test: No detecta llamada recursiva"""
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "body": {
                "type": "Block",
                "body": [
                    {
                        "type": "Call",
                        "name": "other_function"
                    }
                ]
            }
        }
        result = _has_recursive_calls(proc_def, "factorial")
        self.assertFalse(result)

    def test_case_insensitive_recursive_call(self):
        """Test: Detecta llamada recursiva sin importar mayúsculas/minúsculas"""
        proc_def = {
            "type": "ProcDef",
            "name": "Factorial",
            "body": {
                "type": "Block",
                "body": [
                    {
                        "type": "Call",
                        "name": "factorial"
                    }
                ]
            }
        }
        result = _has_recursive_calls(proc_def, "Factorial")
        self.assertTrue(result)


class TestSearchRecursiveCalls(unittest.TestCase):
    """Tests para la función _search_recursive_calls."""

    def test_finds_call_by_name(self):
        """Test: Encuentra llamada por campo name"""
        node = {
            "type": "Call",
            "name": "factorial"
        }
        result = _search_recursive_calls(node, "factorial")
        self.assertTrue(result)

    def test_finds_call_by_callee(self):
        """Test: Encuentra llamada por campo callee"""
        node = {
            "type": "Call",
            "callee": "factorial"
        }
        result = _search_recursive_calls(node, "factorial")
        self.assertTrue(result)

    def test_finds_call_by_function(self):
        """Test: Encuentra llamada por campo function"""
        node = {
            "type": "Call",
            "function": "factorial"
        }
        result = _search_recursive_calls(node, "factorial")
        self.assertTrue(result)

    def test_finds_call_by_target_name(self):
        """Test: Encuentra llamada por target.name"""
        node = {
            "type": "Call",
            "target": {
                "name": "factorial"
            }
        }
        result = _search_recursive_calls(node, "factorial")
        self.assertTrue(result)

    def test_finds_nested_call(self):
        """Test: Encuentra llamada anidada"""
        node = {
            "type": "If",
            "then": [
                {
                    "type": "Call",
                    "name": "factorial"
                }
            ]
        }
        result = _search_recursive_calls(node, "factorial")
        self.assertTrue(result)

    def test_does_not_find_call(self):
        """Test: No encuentra llamada"""
        node = {
            "type": "Call",
            "name": "other_function"
        }
        result = _search_recursive_calls(node, "factorial")
        self.assertFalse(result)

    def test_handles_non_dict_node(self):
        """Test: Maneja nodo que no es diccionario"""
        result = _search_recursive_calls("string", "factorial")
        self.assertFalse(result)
        result = _search_recursive_calls(123, "factorial")
        self.assertFalse(result)

    def test_skips_type_and_pos_fields(self):
        """Test: Omite campos type y pos en búsqueda"""
        node = {
            "type": "Program",
            "pos": {"line": 1},
            "body": [
                {
                    "type": "Call",
                    "name": "factorial"
                }
            ]
        }
        result = _search_recursive_calls(node, "factorial")
        self.assertTrue(result)

