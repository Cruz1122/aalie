"""
Tests unitarios para app.modules.analysis.models.avg_model.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""

import pytest
from sympy import Rational, Symbol

from app.modules.analysis.models.avg_model import AvgModel

pytestmark = [pytest.mark.unit, pytest.mark.fast]


class TestAvgModel:
    """Tests para AvgModel."""

    def test_init_uniform_mode(self):
        model = AvgModel(mode="uniform")
        assert model.mode == "uniform"
        assert model.predicates == {}

    def test_init_symbolic_mode(self):
        model = AvgModel(mode="symbolic")
        assert model.mode == "symbolic"
        assert model.predicates == {}

    def test_init_with_predicates(self):
        predicates = {"A[j] > A[j+1]": "1/2", "A[i] < pivot": "p"}
        model = AvgModel(mode="uniform", predicates=predicates)
        assert model.predicates == predicates

    def test_init_invalid_mode(self):
        with pytest.raises(ValueError):
            AvgModel(mode="invalid")

    def test_get_probability_uniform_default(self):
        model = AvgModel(mode="uniform")
        result = model.get_probability("A[j] > A[j+1]")
        assert result == "1/2"

    def test_get_probability_uniform_with_predicate(self):
        predicates = {"A[j] > A[j+1]": "1/3"}
        model = AvgModel(mode="uniform", predicates=predicates)
        result = model.get_probability("A[j] > A[j+1]")
        assert result == "1/3"

    def test_get_probability_symbolic_default(self):
        model = AvgModel(mode="symbolic")
        result = model.get_probability("A[j] > A[j+1]")
        assert result in ["p", "q", "r", "s", "t"]

    def test_get_probability_symbolic_with_context(self):
        model = AvgModel(mode="symbolic")
        context = {"loop_var": "i"}
        result = model.get_probability("A[i] > A[i+1]", context)
        assert result == "p(i)"

    def test_get_probability_symbolic_unique_symbols(self):
        model = AvgModel(mode="symbolic")
        result1 = model.get_probability("pred1")
        result2 = model.get_probability("pred2")
        assert isinstance(result1, str)
        assert isinstance(result2, str)

    def test_get_default_probability_uniform(self):
        model = AvgModel(mode="uniform")
        result = model.get_default_probability()
        assert result == "1/2"

    def test_get_default_probability_symbolic(self):
        model = AvgModel(mode="symbolic")
        result = model.get_default_probability()
        assert result == "p"

    def test_get_probability_sympy_rational(self):
        model = AvgModel(mode="uniform")
        result = model.get_probability_sympy("A[j] > A[j+1]")
        assert isinstance(result, Rational)
        assert result == Rational(1, 2)

    def test_get_probability_sympy_symbol(self):
        model = AvgModel(mode="symbolic")
        result = model.get_probability_sympy("A[j] > A[j+1]")
        assert isinstance(result, Symbol)

    def test_get_probability_sympy_function(self):
        model = AvgModel(mode="symbolic")
        context = {"loop_var": "i"}
        result = model.get_probability_sympy("A[i] > A[i+1]", context)
        assert result is not None

    def test_get_model_info_uniform_no_predicates(self):
        model = AvgModel(mode="uniform")
        info = model.get_model_info(locale="es")
        assert info["mode"] == "uniform"
        assert "uniforme" in info["note"]

    def test_get_model_info_uniform_with_predicates(self):
        predicates = {"A[j] > A[j+1]": "1/2"}
        model = AvgModel(mode="uniform", predicates=predicates)
        info = model.get_model_info(locale="es")
        assert info["mode"] == "uniform"
        assert "predicados" in info["note"]

    def test_get_model_info_symbolic_no_predicates(self):
        model = AvgModel(mode="symbolic")
        info = model.get_model_info(locale="es")
        assert info["mode"] == "symbolic"
        assert "simbolico" in info["note"] or "simbólico" in info["note"]

    def test_has_symbols_uniform_no_predicates(self):
        model = AvgModel(mode="uniform")
        assert not model.has_symbols()

    def test_has_symbols_symbolic(self):
        model = AvgModel(mode="symbolic")
        assert model.has_symbols()

    def test_has_symbols_uniform_with_symbolic_predicate(self):
        predicates = {"A[j] > A[j+1]": "p"}
        model = AvgModel(mode="uniform", predicates=predicates)
        assert model.has_symbols()

    def test_has_symbols_uniform_with_numeric_predicate(self):
        predicates = {"A[j] > A[j+1]": "1/2"}
        model = AvgModel(mode="uniform", predicates=predicates)
        assert not model.has_symbols()
