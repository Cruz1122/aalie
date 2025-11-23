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

    def test_visit_program(self):
        """Test: visit con nodo Program"""
        node = {
            "type": "Program",
            "body": [
                {"type": "Assign", "pos": {"line": 1}, "target": {"type": "identifier", "name": "x"}, "value": {"type": "number", "value": 1}}
            ]
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visit(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)

    def test_visit_block(self):
        """Test: visit con nodo Block"""
        node = {
            "type": "Block",
            "body": [
                {"type": "Assign", "pos": {"line": 1}, "target": {"type": "identifier", "name": "x"}, "value": {"type": "number", "value": 1}}
            ]
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visit(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)

    def test_visit_for(self):
        """Test: visit con nodo For"""
        node = {
            "type": "For",
            "pos": {"line": 1},
            "variable": "i",
            "start": {"type": "number", "value": 1},
            "end": {"type": "identifier", "name": "n"},
            "body": [{"type": "Assign", "pos": {"line": 2}, "target": {"type": "identifier", "name": "x"}, "value": {"type": "number", "value": 1}}]
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visit(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)

    def test_visit_while(self):
        """Test: visit con nodo While"""
        node = {
            "type": "While",
            "pos": {"line": 1},
            "test": {"type": "binary", "operator": "<", "left": {"type": "identifier", "name": "i"}, "right": {"type": "identifier", "name": "n"}},
            "body": {"type": "Block", "body": [{"type": "Assign", "pos": {"line": 2}, "target": {"type": "identifier", "name": "i"}, "value": {"type": "binary", "operator": "+", "left": {"type": "identifier", "name": "i"}, "right": {"type": "number", "value": 1}}}]}
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visit(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)

    def test_visit_if(self):
        """Test: visit con nodo If"""
        node = {
            "type": "If",
            "pos": {"line": 1},
            "test": {"type": "binary", "operator": ">", "left": {"type": "identifier", "name": "x"}, "right": {"type": "number", "value": 0}},
            "consequent": {"type": "Block", "body": [{"type": "Assign", "pos": {"line": 2}, "target": {"type": "identifier", "name": "y"}, "value": {"type": "number", "value": 1}}]}
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visit(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)

    def test_visit_none(self):
        """Test: visit con None"""
        self.analyzer.visit(None)
        # No debe causar error

    def test_visit_not_dict(self):
        """Test: visit con valor que no es dict"""
        self.analyzer.visit("not_a_dict")
        # No debe causar error

    def test_visit_unknown_type(self):
        """Test: visit con tipo desconocido (usa visitOther)"""
        node = {
            "type": "UnknownType",
            "pos": {"line": 5}
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visit(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)

    def test_visit_program_method(self):
        """Test: visitProgram visita programa"""
        node = {
            "type": "Program",
            "body": [
                {"type": "Assign", "pos": {"line": 1}, "target": {"type": "identifier", "name": "x"}, "value": {"type": "number", "value": 1}}
            ]
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitProgram(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)

    def test_visit_block_method(self):
        """Test: visitBlock visita bloque"""
        node = {
            "type": "Block",
            "body": [
                {"type": "Assign", "pos": {"line": 1}, "target": {"type": "identifier", "name": "x"}, "value": {"type": "number", "value": 1}}
            ]
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitBlock(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)

    def test_visit_block_with_while(self):
        """Test: visitBlock con While dentro"""
        node = {
            "type": "Block",
            "body": [
                {
                    "type": "While",
                    "pos": {"line": 1},
                    "test": {"type": "binary", "operator": "<", "left": {"type": "identifier", "name": "i"}, "right": {"type": "identifier", "name": "n"}},
                    "body": {"type": "Block", "body": []}
                }
            ]
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitBlock(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)
    
    # === Fase 3: Casos Edge Avanzados ===
    
    def test_cost_of_lvalue_nested_field(self):
        """Test: _cost_of_lvalue con campo anidado"""
        lvalue = {
            "type": "field",
            "target": {
                "type": "field",
                "target": {"type": "identifier", "name": "obj"},
                "field": "inner"
            },
            "field": "prop"
        }
        result = self.analyzer._cost_of_lvalue(lvalue)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
    
    def test_cost_of_lvalue_index_with_field(self):
        """Test: _cost_of_lvalue con índice que tiene campo"""
        lvalue = {
            "type": "index",
            "target": {
                "type": "field",
                "target": {"type": "identifier", "name": "arr"},
                "field": "data"
            },
            "index": {"type": "identifier", "name": "i"}
        }
        result = self.analyzer._cost_of_lvalue(lvalue)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
    
    def test_cost_of_expr_nested_index(self):
        """Test: _cost_of_expr con índice anidado"""
        expr = {
            "type": "index",
            "target": {
                "type": "index",
                "target": {"type": "identifier", "name": "matrix"},
                "index": {"type": "identifier", "name": "i"}
            },
            "index": {"type": "identifier", "name": "j"}
        }
        result = self.analyzer._cost_of_expr(expr)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
    
    def test_cost_of_expr_nested_binary(self):
        """Test: _cost_of_expr con expresión binaria anidada"""
        expr = {
            "type": "binary",
            "operator": "+",
            "left": {
                "type": "binary",
                "operator": "*",
                "left": {"type": "identifier", "name": "a"},
                "right": {"type": "identifier", "name": "b"}
            },
            "right": {
                "type": "binary",
                "operator": "-",
                "left": {"type": "identifier", "name": "c"},
                "right": {"type": "identifier", "name": "d"}
            }
        }
        result = self.analyzer._cost_of_expr(expr)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
    
    def test_cost_of_expr_call_with_complex_args(self):
        """Test: _cost_of_expr con llamada a función con argumentos complejos"""
        expr = {
            "type": "call",
            "name": "max",
            "args": [
                {
                    "type": "binary",
                    "operator": "+",
                    "left": {"type": "identifier", "name": "x"},
                    "right": {"type": "number", "value": 1}
                },
                {
                    "type": "index",
                    "target": {"type": "identifier", "name": "A"},
                    "index": {"type": "identifier", "name": "i"}
                }
            ]
        }
        result = self.analyzer._cost_of_expr(expr)
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
    
    def test_expr_to_str_binary_no_operator(self):
        """Test: _expr_to_str con expresión binaria sin operador"""
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "a"},
            "right": {"type": "identifier", "name": "b"}
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIsInstance(result, str)
        self.assertIn("a", result)
        self.assertIn("b", result)
    
    def test_expr_to_str_unary_no_operator(self):
        """Test: _expr_to_str con expresión unaria sin operador"""
        expr = {
            "type": "unary",
            "arg": {"type": "identifier", "name": "x"}
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIsInstance(result, str)
    
    def test_expr_to_str_literal_with_escape(self):
        """Test: _expr_to_str con literal que tiene caracteres especiales"""
        expr = {
            "type": "literal",
            "value": 'text with "quotes" and \\backslash'
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIsInstance(result, str)
    
    def test_expr_to_str_unknown_type(self):
        """Test: _expr_to_str con tipo desconocido"""
        expr = {
            "type": "unknown_type",
            "value": "some_value"
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIsInstance(result, str)
    
    def test_expr_to_str_none(self):
        """Test: _expr_to_str con None"""
        result = self.analyzer._expr_to_str(None)
        self.assertEqual(result, "")
    
    def test_expr_to_str_string(self):
        """Test: _expr_to_str con string"""
        result = self.analyzer._expr_to_str("hello")
        self.assertEqual(result, "hello")
    
    def test_expr_to_str_int(self):
        """Test: _expr_to_str con int"""
        result = self.analyzer._expr_to_str(42)
        self.assertEqual(result, "42")
    
    def test_expr_to_str_float(self):
        """Test: _expr_to_str con float"""
        result = self.analyzer._expr_to_str(3.14)
        self.assertEqual(result, "3.14")
    
    def test_expr_to_str_number_no_value(self):
        """Test: _expr_to_str con número sin value"""
        expr = {
            "type": "number"
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIsInstance(result, str)
    
    def test_expr_to_str_identifier_no_name(self):
        """Test: _expr_to_str con identificador sin name"""
        expr = {
            "type": "identifier"
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIsInstance(result, str)
    
    def test_visit_assign_with_complex_target(self):
        """Test: visitAssign con target complejo"""
        node = {
            "type": "Assign",
            "pos": {"line": 2},
            "target": {
                "type": "index",
                "target": {
                    "type": "field",
                    "target": {"type": "identifier", "name": "matrix"},
                    "field": "data"
                },
                "index": {"type": "identifier", "name": "i"}
            },
            "value": {
                "type": "binary",
                "operator": "+",
                "left": {"type": "identifier", "name": "x"},
                "right": {"type": "number", "value": 1}
            }
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitAssign(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)
    
    def test_visit_assign_with_complex_value(self):
        """Test: visitAssign con value complejo"""
        node = {
            "type": "Assign",
            "pos": {"line": 2},
            "target": {"type": "identifier", "name": "result"},
            "value": {
                "type": "call",
                "name": "sqrt",
                "args": [
                    {
                        "type": "binary",
                        "operator": "+",
                        "left": {
                            "type": "binary",
                            "operator": "*",
                            "left": {"type": "identifier", "name": "x"},
                            "right": {"type": "identifier", "name": "x"}
                        },
                        "right": {
                            "type": "binary",
                            "operator": "*",
                            "left": {"type": "identifier", "name": "y"},
                            "right": {"type": "identifier", "name": "y"}
                        }
                    }
                ]
            }
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitAssign(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)
    
    def test_visit_call_stmt_with_nested_args(self):
        """Test: visitCallStmt con argumentos anidados"""
        node = {
            "type": "CallStmt",
            "pos": {"line": 2},
            "name": "process",
            "args": [
                {
                    "type": "index",
                    "target": {"type": "identifier", "name": "A"},
                    "index": {
                        "type": "binary",
                        "operator": "+",
                        "left": {"type": "identifier", "name": "i"},
                        "right": {"type": "number", "value": 1}
                    }
                },
                {
                    "type": "call",
                    "name": "len",
                    "args": [{"type": "identifier", "name": "arr"}]
                }
            ]
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitCallStmt(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)
    
    def test_visit_return_with_complex_value(self):
        """Test: visitReturn con value complejo"""
        node = {
            "type": "Return",
            "pos": {"line": 2},
            "value": {
                "type": "binary",
                "operator": "+",
                "left": {
                    "type": "index",
                    "target": {"type": "identifier", "name": "A"},
                    "index": {"type": "identifier", "name": "i"}
                },
                "right": {
                    "type": "index",
                    "target": {"type": "identifier", "name": "B"},
                    "index": {"type": "identifier", "name": "j"}
                }
            }
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitReturn(node, mode="worst")
        self.assertGreater(len(self.analyzer.rows), initial_rows)
    
    def test_visit_return_avg_mode_success(self):
        """Test: visitReturn en modo avg con éxito"""
        node = {
            "type": "Return",
            "pos": {"line": 2},
            "value": {"type": "identifier", "name": "i"}
        }
        # Simular que estamos dentro de un bucle
        self.analyzer.loop_stack = [{"type": "For"}]
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitReturn(node, mode="avg")
        self.assertGreater(len(self.analyzer.rows), initial_rows)
    
    def test_visit_return_avg_mode_failure(self):
        """Test: visitReturn en modo avg con fracaso"""
        node = {
            "type": "Return",
            "pos": {"line": 2},
            "value": {
                "type": "unary",
                "op": "-",
                "arg": {"type": "number", "value": 1}
            }
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitReturn(node, mode="avg")
        self.assertGreater(len(self.analyzer.rows), initial_rows)
    
    def test_visit_print_with_multiple_args(self):
        """Test: visitPrint con múltiples argumentos"""
        node = {
            "type": "Print",
            "pos": {"line": 2},
            "args": [
                {"type": "identifier", "name": "x"},
                {"type": "literal", "value": ", "},
                {"type": "identifier", "name": "y"}
            ]
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitPrint(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)
    
    def test_visit_decl_with_size(self):
        """Test: visitDecl con size"""
        node = {
            "type": "Decl",
            "pos": {"line": 2},
            "variable": {"type": "identifier", "name": "arr"},
            "type": "int[]",
            "size": {
                "type": "binary",
                "operator": "*",
                "left": {"type": "identifier", "name": "n"},
                "right": {"type": "identifier", "name": "m"}
            }
        }
        initial_rows = len(self.analyzer.rows)
        self.analyzer.visitDecl(node)
        self.assertGreater(len(self.analyzer.rows), initial_rows)
    
    def test_cost_of_expr_string(self):
        """Test: _cost_of_expr con tipo string"""
        expr = {"type": "string", "value": "hello"}
        result = self.analyzer._cost_of_expr(expr)
        self.assertEqual(result, [])
    
    def test_cost_of_expr_true(self):
        """Test: _cost_of_expr con tipo true"""
        expr = {"type": "true"}
        result = self.analyzer._cost_of_expr(expr)
        self.assertEqual(result, [])
    
    def test_cost_of_expr_false(self):
        """Test: _cost_of_expr con tipo false"""
        expr = {"type": "false"}
        result = self.analyzer._cost_of_expr(expr)
        self.assertEqual(result, [])
    
    def test_cost_of_expr_null(self):
        """Test: _cost_of_expr con tipo null"""
        expr = {"type": "null"}
        result = self.analyzer._cost_of_expr(expr)
        self.assertEqual(result, [])
    
    def test_cost_of_expr_unary_identifier(self):
        """Test: _cost_of_expr con expresión unaria sobre identificador"""
        expr = {
            "type": "unary",
            "operator": "-",
            "arg": {"type": "identifier", "name": "x"}
        }
        result = self.analyzer._cost_of_expr(expr)
        # No debe agregar costo para identificador (es simple)
        self.assertIsInstance(result, list)
        self.assertEqual(len(result), 0)
    
    def test_cost_of_expr_unary_complex(self):
        """Test: _cost_of_expr con expresión unaria sobre expresión compleja"""
        expr = {
            "type": "unary",
            "operator": "-",
            "arg": {
                "type": "binary",
                "operator": "+",
                "left": {"type": "identifier", "name": "a"},
                "right": {"type": "identifier", "name": "b"}
            }
        }
        result = self.analyzer._cost_of_expr(expr)
        # Debe agregar costo para operación unaria sobre expresión compleja
        self.assertIsInstance(result, list)
        self.assertGreater(len(result), 0)
    
    def test_cost_of_expr_unary_number(self):
        """Test: _cost_of_expr con expresión unaria sobre número"""
        expr = {
            "type": "unary",
            "operator": "-",
            "arg": {"type": "number", "value": 5}
        }
        result = self.analyzer._cost_of_expr(expr)
        # No debe agregar costo para literal
        self.assertEqual(result, [])


