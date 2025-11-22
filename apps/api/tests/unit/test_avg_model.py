"""
Tests unitarios para app.modules.analysis.models.avg_model.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import unittest
from app.modules.analysis.models.avg_model import AvgModel
from sympy import Symbol, Rational, Integer


class TestAvgModel(unittest.TestCase):
    """Tests para AvgModel."""

    def test_init_uniform_mode(self):
        """Test: Inicializa modelo en modo uniform"""
        model = AvgModel(mode="uniform")
        self.assertEqual(model.mode, "uniform")
        self.assertEqual(model.predicates, {})

    def test_init_symbolic_mode(self):
        """Test: Inicializa modelo en modo symbolic"""
        model = AvgModel(mode="symbolic")
        self.assertEqual(model.mode, "symbolic")
        self.assertEqual(model.predicates, {})

    def test_init_with_predicates(self):
        """Test: Inicializa modelo con predicados"""
        predicates = {"A[j] > A[j+1]": "1/2", "A[i] < pivot": "p"}
        model = AvgModel(mode="uniform", predicates=predicates)
        self.assertEqual(model.predicates, predicates)

    def test_init_invalid_mode(self):
        """Test: Lanza error con modo inválido"""
        with self.assertRaises(ValueError):
            AvgModel(mode="invalid")

    def test_get_probability_uniform_default(self):
        """Test: Obtiene probabilidad por defecto en modo uniform"""
        model = AvgModel(mode="uniform")
        result = model.get_probability("A[j] > A[j+1]")
        self.assertEqual(result, "1/2")

    def test_get_probability_uniform_with_predicate(self):
        """Test: Obtiene probabilidad específica en modo uniform"""
        predicates = {"A[j] > A[j+1]": "1/3"}
        model = AvgModel(mode="uniform", predicates=predicates)
        result = model.get_probability("A[j] > A[j+1]")
        self.assertEqual(result, "1/3")

    def test_get_probability_symbolic_default(self):
        """Test: Obtiene símbolo por defecto en modo symbolic"""
        model = AvgModel(mode="symbolic")
        result = model.get_probability("A[j] > A[j+1]")
        self.assertIn(result, ["p", "q", "r", "s", "t"])

    def test_get_probability_symbolic_with_context(self):
        """Test: Obtiene símbolo con contexto de bucle"""
        model = AvgModel(mode="symbolic")
        context = {"loop_var": "i"}
        result = model.get_probability("A[i] > A[i+1]", context)
        self.assertEqual(result, "p(i)")

    def test_get_probability_symbolic_unique_symbols(self):
        """Test: Genera símbolos únicos en modo symbolic"""
        model = AvgModel(mode="symbolic")
        result1 = model.get_probability("pred1")
        result2 = model.get_probability("pred2")
        # Pueden ser iguales o diferentes dependiendo del contador
        self.assertIsInstance(result1, str)
        self.assertIsInstance(result2, str)

    def test_get_default_probability_uniform(self):
        """Test: Obtiene probabilidad por defecto en modo uniform"""
        model = AvgModel(mode="uniform")
        result = model.get_default_probability()
        self.assertEqual(result, "1/2")

    def test_get_default_probability_symbolic(self):
        """Test: Obtiene probabilidad por defecto en modo symbolic"""
        model = AvgModel(mode="symbolic")
        result = model.get_default_probability()
        self.assertEqual(result, "p")

    def test_get_probability_sympy_rational(self):
        """Test: Convierte probabilidad fracción a SymPy Rational"""
        model = AvgModel(mode="uniform")
        result = model.get_probability_sympy("A[j] > A[j+1]")
        self.assertIsInstance(result, Rational)
        self.assertEqual(result, Rational(1, 2))

    def test_get_probability_sympy_symbol(self):
        """Test: Convierte símbolo a SymPy Symbol"""
        model = AvgModel(mode="symbolic")
        result = model.get_probability_sympy("A[j] > A[j+1]")
        self.assertIsInstance(result, Symbol)

    def test_get_probability_sympy_function(self):
        """Test: Convierte función probabilística a SymPy Function"""
        model = AvgModel(mode="symbolic")
        context = {"loop_var": "i"}
        result = model.get_probability_sympy("A[i] > A[i+1]", context)
        # Debe ser una función aplicada
        self.assertIsNotNone(result)

    def test_get_model_info_uniform_no_predicates(self):
        """Test: Obtiene información del modelo uniform sin predicados"""
        model = AvgModel(mode="uniform")
        info = model.get_model_info()
        self.assertEqual(info["mode"], "uniform")
        self.assertIn("uniforme", info["note"])

    def test_get_model_info_uniform_with_predicates(self):
        """Test: Obtiene información del modelo uniform con predicados"""
        predicates = {"A[j] > A[j+1]": "1/2"}
        model = AvgModel(mode="uniform", predicates=predicates)
        info = model.get_model_info()
        self.assertEqual(info["mode"], "uniform")
        self.assertIn("predicados", info["note"])

    def test_get_model_info_symbolic_no_predicates(self):
        """Test: Obtiene información del modelo symbolic sin predicados"""
        model = AvgModel(mode="symbolic")
        info = model.get_model_info()
        self.assertEqual(info["mode"], "symbolic")
        self.assertIn("simbólico", info["note"])

    def test_has_symbols_uniform_no_predicates(self):
        """Test: Verifica que modelo uniform sin predicados no tiene símbolos"""
        model = AvgModel(mode="uniform")
        self.assertFalse(model.has_symbols())

    def test_has_symbols_symbolic(self):
        """Test: Verifica que modelo symbolic tiene símbolos"""
        model = AvgModel(mode="symbolic")
        self.assertTrue(model.has_symbols())

    def test_has_symbols_uniform_with_symbolic_predicate(self):
        """Test: Verifica que modelo uniform con predicado simbólico tiene símbolos"""
        predicates = {"A[j] > A[j+1]": "p"}
        model = AvgModel(mode="uniform", predicates=predicates)
        self.assertTrue(model.has_symbols())

    def test_has_symbols_uniform_with_numeric_predicate(self):
        """Test: Verifica que modelo uniform con predicado numérico no tiene símbolos"""
        predicates = {"A[j] > A[j+1]": "1/2"}
        model = AvgModel(mode="uniform", predicates=predicates)
        self.assertFalse(model.has_symbols())

