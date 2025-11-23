# tests/unit/test_expr_converter.py

import unittest
from app.modules.analysis.utils.expr_converter import ExprConverter
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
    
    def test_string_float(self):
        """Test: Convertir string flotante"""
        expr = "3.14"
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(float(result), 3.14)
    
    def test_string_identifier(self):
        """Test: Convertir string que es identificador"""
        expr = "x"
        result = self.converter.ast_to_sympy(expr)
        self.assertIsInstance(result, Symbol)
        self.assertEqual(str(result), "x")
    
    def test_string_known_symbol(self):
        """Test: Convertir string que es símbolo conocido"""
        expr = "i"
        result = self.converter.ast_to_sympy(expr)
        self.assertIsInstance(result, Symbol)
        self.assertEqual(str(result), "i")
        self.assertIn("i", self.converter.symbols)
    
    def test_literal_type(self):
        """Test: Convertir expresión literal"""
        expr = {"type": "literal", "value": 42}
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(42))
    
    def test_literal_float(self):
        """Test: Convertir literal flotante"""
        expr = {"type": "literal", "value": 3.14}
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(float(result), 3.14)
    
    def test_binary_modulo(self):
        """Test: Convertir operación binaria módulo"""
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 10},
            "right": {"type": "number", "value": 3},
            "operator": "%"
        }
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(1))
    
    def test_binary_power(self):
        """Test: Convertir operación binaria potencia con **"""
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 2},
            "right": {"type": "number", "value": 3},
            "operator": "**"
        }
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(8))
    
    def test_binary_power_caret(self):
        """Test: Convertir operación binaria potencia con ^"""
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 2},
            "right": {"type": "number", "value": 4},
            "operator": "^"
        }
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(16))
    
    def test_binary_unknown_operator(self):
        """Test: Convertir operación binaria con operador desconocido (fallback)"""
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 5},
            "right": {"type": "number", "value": 3},
            "operator": "???"
        }
        result = self.converter.ast_to_sympy(expr)
        # Debe usar resta como fallback
        self.assertEqual(result, Integer(2))
    
    def test_binary_op_field(self):
        """Test: Convertir operación binaria usando campo 'op' en vez de 'operator'"""
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 7},
            "right": {"type": "number", "value": 2},
            "op": "+"
        }
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(9))
    
    def test_unary_plus(self):
        """Test: Convertir operación unaria positivo"""
        expr = {
            "type": "unary",
            "arg": {"type": "number", "value": 5},
            "operator": "+"
        }
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(5))
    
    def test_unary_minus(self):
        """Test: Convertir operación unaria negativo"""
        expr = {
            "type": "unary",
            "arg": {"type": "number", "value": 5},
            "operator": "-"
        }
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(-5))
    
    def test_unary_unknown_operator(self):
        """Test: Convertir operación unaria con operador desconocido"""
        expr = {
            "type": "unary",
            "arg": {"type": "number", "value": 5},
            "operator": "!"
        }
        result = self.converter.ast_to_sympy(expr)
        # Debe retornar el argumento sin modificar
        self.assertEqual(result, Integer(5))
    
    def test_index_expression(self):
        """Test: Convertir expresión indexada (array)"""
        expr = {
            "type": "index",
            "target": {"type": "identifier", "name": "A"},
            "index": {"type": "identifier", "name": "i"}
        }
        result = self.converter.ast_to_sympy(expr)
        # Debe retornar solo el índice
        self.assertIsInstance(result, Symbol)
        self.assertEqual(str(result), "i")
    
    def test_index_expression_no_target(self):
        """Test: Convertir expresión indexada sin target"""
        expr = {
            "type": "index",
            "index": {"type": "number", "value": 3}
        }
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(3))
    
    def test_unknown_type_with_value(self):
        """Test: Convertir expresión con tipo desconocido pero con campo value"""
        expr = {
            "type": "unknown_type",
            "value": 42
        }
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(42))
    
    def test_unknown_type_no_value(self):
        """Test: Convertir expresión con tipo desconocido sin campo value"""
        expr = {
            "type": "unknown_type"
        }
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(0))
    
    def test_unknown_type_empty_dict(self):
        """Test: Convertir expresión con tipo desconocido y dict vacío"""
        expr = {
            "type": "unknown_type"
        }
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(0))
    
    def test_get_symbol_existing(self):
        """Test: get_symbol retorna símbolo existente"""
        symbol = self.converter.get_symbol("n")
        self.assertIsInstance(symbol, Symbol)
        self.assertEqual(str(symbol), "n")
        self.assertIn("n", self.converter.symbols)
    
    def test_get_symbol_new(self):
        """Test: get_symbol crea nuevo símbolo"""
        initial_count = len(self.converter.symbols)
        symbol = self.converter.get_symbol("new_var")
        self.assertIsInstance(symbol, Symbol)
        self.assertEqual(str(symbol), "new_var")
        self.assertIn("new_var", self.converter.symbols)
        self.assertEqual(len(self.converter.symbols), initial_count + 1)
    
    def test_get_symbol_adds_to_dict(self):
        """Test: get_symbol agrega símbolo al diccionario"""
        symbol = self.converter.get_symbol("test_var")
        self.assertIn("test_var", self.converter.symbols)
        self.assertEqual(self.converter.symbols["test_var"], symbol)
    
    def test_fallback_sympify_string(self):
        """Test: Fallback final con sympify para string"""
        expr = "x + y"
        result = self.converter.ast_to_sympy(expr)
        # Debe intentar parsear con sympify
        self.assertIsNotNone(result)
    
    def test_fallback_sympify_fails(self):
        """Test: Fallback final cuando sympify falla"""
        # Crear un objeto que no se pueda convertir a string/sympify fácilmente
        class Unconvertible:
            def __str__(self):
                raise Exception("Cannot convert")
        
        expr = Unconvertible()
        result = self.converter.ast_to_sympy(expr)
        # Debe retornar Integer(0) como fallback final
        self.assertEqual(result, Integer(0))
    
    def test_float_type(self):
        """Test: Convertir float directamente"""
        expr = 3.14
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(float(result), 3.14)
    
    def test_identifier_unknown(self):
        """Test: Convertir identificador no conocido"""
        expr = {"type": "identifier", "name": "unknown_var"}
        result = self.converter.ast_to_sympy(expr)
        self.assertIsInstance(result, Symbol)
        self.assertEqual(str(result), "unknown_var")
    
    def test_identifier_no_name(self):
        """Test: Convertir identificador sin campo name"""
        expr = {"type": "identifier"}
        result = self.converter.ast_to_sympy(expr)
        self.assertIsInstance(result, Symbol)
        self.assertEqual(str(result), "unknown")
    
    def test_number_no_value(self):
        """Test: Convertir number sin campo value"""
        expr = {"type": "number"}
        result = self.converter.ast_to_sympy(expr)
        self.assertEqual(result, Integer(0))
    
    def test_binary_no_left(self):
        """Test: Convertir operación binaria sin left"""
        expr = {
            "type": "binary",
            "right": {"type": "number", "value": 3},
            "operator": "+"
        }
        result = self.converter.ast_to_sympy(expr)
        # left será None, se convierte a Integer(0)
        self.assertEqual(result, Integer(3))
    
    def test_binary_no_right(self):
        """Test: Convertir operación binaria sin right"""
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 5},
            "operator": "+"
        }
        result = self.converter.ast_to_sympy(expr)
        # right será None, se convierte a Integer(0)
        self.assertEqual(result, Integer(5))


if __name__ == '__main__':
    unittest.main()

