# tests/unit/test_expr_converter.py
import pytest
from sympy import Eq, Integer, Le, Ne, Symbol
from sympy.logic.boolalg import And, Or

from app.modules.analysis.utils.expr_converter import ExprConverter


class TestExprConverter:
    """Tests para ExprConverter."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.converter = ExprConverter("n")

    def test_number(self):
        """Test: Convertir número"""
        expr = 5
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(5)

    def test_string_number(self):
        """Test: Convertir string numérico"""
        expr = "10"
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(10)

    def test_identifier(self):
        """Test: Convertir identificador"""
        expr = {"type": "identifier", "name": "n"}
        result = self.converter.ast_to_sympy(expr)
        assert isinstance(result, Symbol)
        assert str(result) == "n"

    def test_binary_add(self):
        """Test: Convertir operación binaria suma"""
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 2},
            "right": {"type": "number", "value": 3},
            "operator": "+",
        }
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(5)

    def test_binary_subtract(self):
        """Test: Convertir operación binaria resta"""
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "n"},
            "right": {"type": "number", "value": 1},
            "operator": "-",
        }
        result = self.converter.ast_to_sympy(expr)
        expected = Symbol("n", integer=True, positive=True) - Integer(1)
        assert str(result) == str(expected)

    def test_none(self):
        """Test: Convertir None"""
        result = self.converter.ast_to_sympy(None)
        assert result == Integer(0)

    def test_string_float(self):
        """Test: Convertir string flotante"""
        expr = "3.14"
        result = self.converter.ast_to_sympy(expr)
        assert float(result) == 3.14

    def test_string_identifier(self):
        """Test: Convertir string que es identificador"""
        expr = "x"
        result = self.converter.ast_to_sympy(expr)
        assert isinstance(result, Symbol)
        assert str(result) == "x"

    def test_string_known_symbol(self):
        """Test: Convertir string que es símbolo conocido"""
        expr = "i"
        result = self.converter.ast_to_sympy(expr)
        assert isinstance(result, Symbol)
        assert str(result) == "i"
        assert "i" in self.converter.symbols

    def test_literal_type(self):
        """Test: Convertir expresión literal"""
        expr = {"type": "literal", "value": 42}
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(42)

    def test_literal_float(self):
        """Test: Convertir literal flotante"""
        expr = {"type": "literal", "value": 3.14}
        result = self.converter.ast_to_sympy(expr)
        assert float(result) == 3.14

    def test_binary_modulo(self):
        """Test: Convertir operación binaria módulo"""
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 10},
            "right": {"type": "number", "value": 3},
            "operator": "%",
        }
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(1)

    def test_binary_power(self):
        """Test: Convertir operación binaria potencia con **"""
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 2},
            "right": {"type": "number", "value": 3},
            "operator": "**",
        }
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(8)

    def test_binary_power_caret(self):
        """Test: Convertir operación binaria potencia con ^"""
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 2},
            "right": {"type": "number", "value": 4},
            "operator": "^",
        }
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(16)

    def test_binary_unknown_operator(self):
        """Test: Convertir operación binaria con operador desconocido (fallback)"""
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 5},
            "right": {"type": "number", "value": 3},
            "operator": "???",
        }
        result = self.converter.ast_to_sympy(expr)
        # Debe usar resta como fallback
        assert result == Integer(2)

    def test_binary_op_field(self):
        """Test: Convertir operación binaria usando campo 'op' en vez de 'operator'"""
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 7},
            "right": {"type": "number", "value": 2},
            "op": "+",
        }
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(9)

    def test_unary_plus(self):
        """Test: Convertir operación unaria positivo"""
        expr = {"type": "unary", "arg": {"type": "number", "value": 5}, "operator": "+"}
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(5)

    def test_unary_minus(self):
        """Test: Convertir operación unaria negativo"""
        expr = {"type": "unary", "arg": {"type": "number", "value": 5}, "operator": "-"}
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(-5)

    def test_unary_unknown_operator(self):
        """Test: Convertir operación unaria con operador desconocido"""
        expr = {
            "type": "unary",
            "arg": {"type": "number", "value": 5},
            "operator": "??",
        }
        result = self.converter.ast_to_sympy(expr)
        # Debe retornar el argumento sin modificar
        assert result == Integer(5)

    def test_index_expression(self):
        """Test: Convertir expresión indexada (array)"""
        expr = {
            "type": "index",
            "target": {"type": "identifier", "name": "A"},
            "index": {"type": "identifier", "name": "i"},
        }
        result = self.converter.ast_to_sympy(expr)
        # Debe retornar solo el índice
        assert isinstance(result, Symbol)
        assert str(result) == "i"

    def test_index_expression_no_target(self):
        """Test: Convertir expresión indexada sin target"""
        expr = {"type": "index", "index": {"type": "number", "value": 3}}
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(3)

    def test_unknown_type_with_value(self):
        """Test: Convertir expresión con tipo desconocido pero con campo value"""
        expr = {"type": "unknown_type", "value": 42}
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(42)

    def test_unknown_type_no_value(self):
        """Test: Convertir expresión con tipo desconocido sin campo value"""
        expr = {"type": "unknown_type"}
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(0)

    def test_unknown_type_empty_dict(self):
        """Test: Convertir expresión con tipo desconocido y dict vacío"""
        expr = {"type": "unknown_type"}
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(0)

    def test_get_symbol_existing(self):
        """Test: get_symbol retorna símbolo existente"""
        symbol = self.converter.get_symbol("n")
        assert isinstance(symbol, Symbol)
        assert str(symbol) == "n"
        assert "n" in self.converter.symbols

    def test_get_symbol_new(self):
        """Test: get_symbol crea nuevo símbolo"""
        initial_count = len(self.converter.symbols)
        symbol = self.converter.get_symbol("new_var")
        assert isinstance(symbol, Symbol)
        assert str(symbol) == "new_var"
        assert "new_var" in self.converter.symbols
        assert len(self.converter.symbols) == initial_count + 1

    def test_get_symbol_adds_to_dict(self):
        """Test: get_symbol agrega símbolo al diccionario"""
        symbol = self.converter.get_symbol("test_var")
        assert "test_var" in self.converter.symbols
        assert self.converter.symbols["test_var"] == symbol

    def test_fallback_sympify_string(self):
        """Test: Fallback final con sympify para string"""
        expr = "x + y"
        result = self.converter.ast_to_sympy(expr)
        # Debe intentar parsear con sympify
        assert result is not None

    def test_fallback_sympify_fails(self):
        """Test: Fallback final cuando sympify falla"""

        # Crear un objeto que no se pueda convertir a string/sympify fácilmente
        class Unconvertible:
            def __str__(self):
                raise Exception("Cannot convert")

        expr = Unconvertible()
        result = self.converter.ast_to_sympy(expr)
        # Debe retornar Integer(0) como fallback final
        assert result == Integer(0)

    def test_float_type(self):
        """Test: Convertir float directamente"""
        expr = 3.14
        result = self.converter.ast_to_sympy(expr)
        assert float(result) == 3.14

    def test_identifier_unknown(self):
        """Test: Convertir identificador no conocido"""
        expr = {"type": "identifier", "name": "unknown_var"}
        result = self.converter.ast_to_sympy(expr)
        assert isinstance(result, Symbol)
        assert str(result) == "unknown_var"

    def test_identifier_no_name(self):
        """Test: Convertir identificador sin campo name"""
        expr = {"type": "identifier"}
        result = self.converter.ast_to_sympy(expr)
        assert isinstance(result, Symbol)
        assert str(result) == "unknown"

    def test_number_no_value(self):
        """Test: Convertir number sin campo value"""
        expr = {"type": "number"}
        result = self.converter.ast_to_sympy(expr)
        assert result == Integer(0)

    def test_binary_no_left(self):
        """Test: Convertir operación binaria sin left"""
        expr = {
            "type": "binary",
            "right": {"type": "number", "value": 3},
            "operator": "+",
        }
        result = self.converter.ast_to_sympy(expr)
        # left será None, se convierte a Integer(0)
        assert result == Integer(3)

    def test_binary_no_right(self):
        """Test: Convertir operación binaria sin right"""
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 5},
            "operator": "+",
        }
        result = self.converter.ast_to_sympy(expr)
        # right será None, se convierte a Integer(0)
        assert result == Integer(5)

    def test_binary_equals_operator(self):
        """Test: Convertir comparación igualdad."""
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "n"},
            "right": {"type": "number", "value": 1},
            "operator": "==",
        }
        result = self.converter.ast_to_sympy(expr)
        assert str(result) == str(
            Eq(Symbol("n", integer=True, positive=True), Integer(1))
        )

    def test_binary_lte_operator(self):
        """Test: Convertir comparación <=."""
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "i"},
            "right": {"type": "identifier", "name": "j"},
            "operator": "<=",
        }
        result = self.converter.ast_to_sympy(expr)
        assert str(result) == str(
            Le(Symbol("i", integer=True), Symbol("j", integer=True))
        )

    def test_binary_and_operator(self):
        """Test: Convertir operador lógico AND."""
        expr = {
            "type": "binary",
            "left": {
                "type": "binary",
                "left": {"type": "identifier", "name": "i"},
                "right": {"type": "identifier", "name": "j"},
                "operator": "<=",
            },
            "right": {
                "type": "binary",
                "left": {"type": "identifier", "name": "j"},
                "right": {"type": "identifier", "name": "k"},
                "operator": "<=",
            },
            "operator": "and",
        }
        result = self.converter.ast_to_sympy(expr)
        assert isinstance(result, And)

    def test_binary_or_operator(self):
        """Test: Convertir operador lógico OR."""
        expr = {
            "type": "binary",
            "left": {
                "type": "binary",
                "left": {"type": "identifier", "name": "u"},
                "right": {"type": "number", "value": 0},
                "operator": "==",
            },
            "right": {
                "type": "binary",
                "left": {"type": "identifier", "name": "u"},
                "right": {"type": "number", "value": 1},
                "operator": "==",
            },
            "operator": "or",
        }
        result = self.converter.ast_to_sympy(expr)
        assert isinstance(result, Or)

    def test_unary_not_operator(self):
        """Test: Convertir operador unario NOT."""
        expr = {
            "type": "unary",
            "arg": {
                "type": "binary",
                "left": {"type": "identifier", "name": "u"},
                "right": {"type": "number", "value": 0},
                "operator": "==",
            },
            "operator": "not",
        }
        result = self.converter.ast_to_sympy(expr)
        assert result == Ne(Symbol("u", real=True), Integer(0))
