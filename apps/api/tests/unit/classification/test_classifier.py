"""
Tests unitarios para app.modules.classification.classifier.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""

import pytest

from app.modules.classification.classifier import (
    _find_node_type,
    _find_procedure_definition,
    _has_iterative_constructs,
    _has_recursive_calls,
    _search_recursive_calls,
    detect_algorithm_kind,
)

pytestmark = [pytest.mark.unit, pytest.mark.fast]



class TestDetectAlgorithmKind:
    """Tests para la función detect_algorithm_kind."""

    def test_iterative_algorithm(self):
        """Test: Detecta algoritmo iterativo"""
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "test",
                    "body": [{"type": "For", "variable": "i", "start": 1, "end": 10}],
                }
            ],
        }
        result = detect_algorithm_kind(ast)
        assert result == "iterative"

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
                        "body": [{"type": "Call", "name": "factorial"}],
                    },
                }
            ],
        }
        result = detect_algorithm_kind(ast)
        assert result == "recursive"

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
                            {"type": "Call", "name": "hybrid"},
                        ],
                    },
                }
            ],
        }
        result = detect_algorithm_kind(ast)
        assert result == "hybrid"

    def test_unknown_algorithm(self):
        """Test: Detecta algoritmo desconocido (sin iteración ni recursión)"""
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "name": "simple",
                    "body": [{"type": "Assign", "variable": "x", "value": 1}],
                }
            ],
        }
        result = detect_algorithm_kind(ast)
        assert result == "unknown"

    def test_no_procedure_definition(self):
        """Test: Maneja AST sin definición de procedimiento"""
        ast = {"type": "Program", "body": []}
        result = detect_algorithm_kind(ast)
        assert result == "unknown"


class TestHasIterativeConstructs:
    """Tests para la función _has_iterative_constructs."""

    def test_has_for_loop(self):
        """Test: Detecta bucle For"""
        ast = {"type": "For", "variable": "i"}
        result = _has_iterative_constructs(ast)
        assert result

    def test_has_while_loop(self):
        """Test: Detecta bucle While"""
        ast = {"type": "While", "condition": True}
        result = _has_iterative_constructs(ast)
        assert result

    def test_has_repeat_loop(self):
        """Test: Detecta bucle Repeat"""
        ast = {"type": "Repeat", "condition": True}
        result = _has_iterative_constructs(ast)
        assert result

    def test_no_iterative_constructs(self):
        """Test: No detecta construcciones iterativas"""
        ast = {"type": "Assign", "variable": "x", "value": 1}
        result = _has_iterative_constructs(ast)
        assert not result

    def test_nested_iterative_constructs(self):
        """Test: Detecta construcciones iterativas anidadas"""
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "ProcDef",
                    "body": [
                        {"type": "If", "then": [{"type": "For", "variable": "i"}]}
                    ],
                }
            ],
        }
        result = _has_iterative_constructs(ast)
        assert result


class TestFindNodeType:
    """Tests para la función _find_node_type."""

    def test_finds_node_in_dict(self):
        """Test: Encuentra nodo en diccionario"""
        node = {"type": "For", "variable": "i"}
        result = _find_node_type(node, ["For"])
        assert result

    def test_finds_node_in_nested_structure(self):
        """Test: Encuentra nodo en estructura anidada"""
        node = {
            "type": "Program",
            "body": [{"type": "ProcDef", "body": [{"type": "For"}]}],
        }
        result = _find_node_type(node, ["For"])
        assert result

    def test_finds_node_in_list(self):
        """Test: Encuentra nodo en lista"""
        node = {"type": "Program", "body": [{"type": "While"}, {"type": "Assign"}]}
        result = _find_node_type(node, ["While"])
        assert result

    def test_does_not_find_node(self):
        """Test: No encuentra nodo que no existe"""
        node = {"type": "Assign", "variable": "x"}
        result = _find_node_type(node, ["For", "While"])
        assert not result

    def test_handles_non_dict_node(self):
        """Test: Maneja nodo que no es diccionario"""
        result = _find_node_type("string", ["For"])
        assert not result
        result = _find_node_type(123, ["For"])
        assert not result
        result = _find_node_type([1, 2, 3], ["For"])
        assert not result

    def test_skips_type_and_pos_fields(self):
        """Test: Omite campos type y pos en búsqueda recursiva"""
        node = {
            "type": "Program",
            "pos": {"line": 1, "column": 1},
            "body": [{"type": "For"}],
        }
        result = _find_node_type(node, ["For"])
        assert result


class TestFindProcedureDefinition:
    """Tests para la función _find_procedure_definition."""

    def test_finds_procedure_definition(self):
        """Test: Encuentra definición de procedimiento"""
        ast = {
            "type": "Program",
            "body": [{"type": "ProcDef", "name": "test", "body": []}],
        }
        result = _find_procedure_definition(ast)
        assert result is not None
        assert result["type"] == "ProcDef"
        assert result["name"] == "test"

    def test_no_procedure_definition(self):
        """Test: No encuentra definición de procedimiento"""
        ast = {"type": "Program", "body": [{"type": "Assign", "variable": "x"}]}
        result = _find_procedure_definition(ast)
        assert result is None

    def test_empty_body(self):
        """Test: Maneja body vacío"""
        ast = {"type": "Program", "body": []}
        result = _find_procedure_definition(ast)
        assert result is None

    def test_non_list_body(self):
        """Test: Maneja body que no es lista"""
        ast = {"type": "Program", "body": "not a list"}
        result = _find_procedure_definition(ast)
        assert result is None


class TestHasRecursiveCalls:
    """Tests para la función _has_recursive_calls."""

    def test_has_recursive_call_in_body(self):
        """Test: Detecta llamada recursiva en body"""
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "body": {"type": "Block", "body": [{"type": "Call", "name": "factorial"}]},
        }
        result = _has_recursive_calls(proc_def, "factorial")
        assert result

    def test_has_recursive_call_in_block(self):
        """Test: Detecta llamada recursiva en block"""
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "block": {"type": "Block", "body": [{"type": "Call", "name": "factorial"}]},
        }
        result = _has_recursive_calls(proc_def, "factorial")
        assert result

    def test_has_recursive_call_in_statements(self):
        """Test: Detecta llamada recursiva en statements"""
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "statements": {
                "type": "Block",
                "body": [{"type": "Call", "name": "factorial"}],
            },
        }
        result = _has_recursive_calls(proc_def, "factorial")
        assert result

    def test_no_recursive_call(self):
        """Test: No detecta llamada recursiva"""
        proc_def = {
            "type": "ProcDef",
            "name": "factorial",
            "body": {
                "type": "Block",
                "body": [{"type": "Call", "name": "other_function"}],
            },
        }
        result = _has_recursive_calls(proc_def, "factorial")
        assert not result

    def test_case_insensitive_recursive_call(self):
        """Test: Detecta llamada recursiva sin importar mayúsculas/minúsculas"""
        proc_def = {
            "type": "ProcDef",
            "name": "Factorial",
            "body": {"type": "Block", "body": [{"type": "Call", "name": "factorial"}]},
        }
        result = _has_recursive_calls(proc_def, "Factorial")
        assert result


class TestSearchRecursiveCalls:
    """Tests para la función _search_recursive_calls."""

    def test_finds_call_by_name(self):
        """Test: Encuentra llamada por campo name"""
        node = {"type": "Call", "name": "factorial"}
        result = _search_recursive_calls(node, "factorial")
        assert result

    def test_finds_call_by_callee(self):
        """Test: Encuentra llamada por campo callee"""
        node = {"type": "Call", "callee": "factorial"}
        result = _search_recursive_calls(node, "factorial")
        assert result

    def test_finds_call_by_function(self):
        """Test: Encuentra llamada por campo function"""
        node = {"type": "Call", "function": "factorial"}
        result = _search_recursive_calls(node, "factorial")
        assert result

    def test_finds_call_by_target_name(self):
        """Test: Encuentra llamada por target.name"""
        node = {"type": "Call", "target": {"name": "factorial"}}
        result = _search_recursive_calls(node, "factorial")
        assert result

    def test_finds_nested_call(self):
        """Test: Encuentra llamada anidada"""
        node = {"type": "If", "then": [{"type": "Call", "name": "factorial"}]}
        result = _search_recursive_calls(node, "factorial")
        assert result

    def test_does_not_find_call(self):
        """Test: No encuentra llamada"""
        node = {"type": "Call", "name": "other_function"}
        result = _search_recursive_calls(node, "factorial")
        assert not result

    def test_handles_non_dict_node(self):
        """Test: Maneja nodo que no es diccionario"""
        result = _search_recursive_calls("string", "factorial")
        assert not result
        result = _search_recursive_calls(123, "factorial")
        assert not result

    def test_skips_type_and_pos_fields(self):
        """Test: Omite campos type y pos en búsqueda"""
        node = {
            "type": "Program",
            "pos": {"line": 1},
            "body": [{"type": "Call", "name": "factorial"}],
        }
        result = _search_recursive_calls(node, "factorial")
        assert result
