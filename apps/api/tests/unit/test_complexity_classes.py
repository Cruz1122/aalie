# tests/unit/test_complexity_classes.py

import unittest
from app.modules.analysis.utils.complexity_classes import ComplexityClasses


class TestComplexityClasses(unittest.TestCase):
    """Tests para ComplexityClasses."""
    
    def setUp(self):
        self.complexity = ComplexityClasses()
    
    def test_extract_dominant_term_quadratic(self):
        """Test 1: Extraer término dominante de polinomio cuadrático"""
        poly = "n^2 + 3n + 5"
        dominant = self.complexity.extract_dominant_term(poly)
        
        self.assertIsNotNone(dominant)
        self.assertIn("n", dominant.lower())
        self.assertIn("2", dominant or "n^2" in dominant.lower())
    
    def test_extract_dominant_term_linear(self):
        """Test 2: Extraer término dominante de polinomio lineal"""
        poly = "5n + 3"
        dominant = self.complexity.extract_dominant_term(poly)
        
        self.assertIsNotNone(dominant)
        self.assertIn("n", dominant.lower())
    
    def test_calculate_big_o_quadratic(self):
        """Test 4: Calcular Big-O para polinomio cuadrático"""
        poly = "n^2 + 3n + 5"
        big_o = self.complexity.calculate_big_o(poly)
        
        self.assertIsNotNone(big_o)
        self.assertTrue(big_o.startswith("O("))
        self.assertIn("n", big_o.lower())
    
    def test_calculate_big_o_linear(self):
        """Test 5: Calcular Big-O para polinomio lineal"""
        poly = "5n + 3"
        big_o = self.complexity.calculate_big_o(poly)
        
        self.assertIsNotNone(big_o)
        self.assertTrue(big_o.startswith("O("))
        self.assertIn("n", big_o.lower())
    
    def test_calculate_big_omega(self):
        """Test 6: Calcular Big-Omega"""
        poly = "n^2 + n"
        big_omega = self.complexity.calculate_big_omega(poly)
        
        self.assertIsNotNone(big_omega)
        self.assertTrue("\\Omega" in big_omega or "Omega" in big_omega)
    
    def test_calculate_big_theta(self):
        """Test 7: Calcular Big-Theta"""
        poly = "n^2 + 3n + 5"
        big_theta = self.complexity.calculate_big_theta(poly)
        
        self.assertIsNotNone(big_theta)
        self.assertTrue("\\Theta" in big_theta or "Theta" in big_theta)
    
    def test_logarithmic_complexity(self):
        """Test 8: Manejar complejidad logarítmica"""
        poly = "log(n)"
        big_o = self.complexity.calculate_big_o(poly)
        
        self.assertIsNotNone(big_o)
        self.assertTrue(big_o.startswith("O("))
    
    def test_constant_complexity(self):
        """Test 9: Manejar complejidad constante"""
        poly = "5"
        big_o = self.complexity.calculate_big_o(poly)
        
        self.assertIsNotNone(big_o)
        self.assertTrue(big_o.startswith("O("))
        # Para complejidad constante, el resultado puede ser O(5), O(1), etc.
        # Lo importante es que empiece con O( y no contenga variables
        self.assertNotIn("n", big_o.lower())
    
    def test_empty_polynomial(self):
        """Test 10: Manejar polinomio vacío"""
        poly = ""
        dominant = self.complexity.extract_dominant_term(poly)
        
        self.assertEqual(dominant, "1")

    def test_parse_polynomial_with_fractions(self):
        """Test: _parse_polynomial maneja fracciones LaTeX"""
        poly = "\\frac{n}{2} + 1"
        result = self.complexity._parse_polynomial(poly)
        self.assertIsNotNone(result)

    def test_parse_polynomial_with_nested_fractions(self):
        """Test: _parse_polynomial maneja fracciones anidadas"""
        poly = "\\frac{\\frac{n}{2}}{3}"
        result = self.complexity._parse_polynomial(poly)
        self.assertIsNotNone(result)

    def test_parse_polynomial_with_log(self):
        """Test: _parse_polynomial maneja logaritmos LaTeX"""
        poly = "n \\log(n)"
        result = self.complexity._parse_polynomial(poly)
        self.assertIsNotNone(result)

    def test_parse_polynomial_with_log_braces(self):
        """Test: _parse_polynomial maneja logaritmos con llaves"""
        poly = "n \\log{n}"
        result = self.complexity._parse_polynomial(poly)
        self.assertIsNotNone(result)

    def test_parse_polynomial_with_latex_commands(self):
        """Test: _parse_polynomial elimina comandos LaTeX \\left \\right"""
        poly = "\\left(n + 1\\right)^2"
        result = self.complexity._parse_polynomial(poly)
        self.assertIsNotNone(result)

    def test_parse_polynomial_with_c_constants_error(self):
        """Test: _parse_polynomial lanza error con constantes C_k"""
        poly = "C_1 * n + C_2"
        with self.assertRaises(ValueError):
            self.complexity._parse_polynomial(poly)

    def test_extract_dominant_sympy_constant(self):
        """Test: _extract_dominant_sympy retorna 1 para constantes"""
        from sympy import Integer
        result = self.complexity._extract_dominant_sympy(Integer(5))
        self.assertEqual(result, Integer(1))

    def test_extract_dominant_sympy_linear(self):
        """Test: _extract_dominant_sympy extrae término dominante lineal"""
        from sympy import Symbol
        n = Symbol('n', integer=True, positive=True)
        expr = n + 5
        result = self.complexity._extract_dominant_sympy(expr)
        self.assertIsNotNone(result)

    def test_extract_dominant_sympy_quadratic(self):
        """Test: _extract_dominant_sympy extrae término dominante cuadrático"""
        from sympy import Symbol
        n = Symbol('n', integer=True, positive=True)
        expr = n**2 + 3*n + 5
        result = self.complexity._extract_dominant_sympy(expr)
        self.assertIsNotNone(result)

    def test_extract_dominant_sympy_log(self):
        """Test: _extract_dominant_sympy maneja logaritmos"""
        from sympy import Symbol, log
        n = Symbol('n', integer=True, positive=True)
        expr = n * log(n)
        result = self.complexity._extract_dominant_sympy(expr)
        self.assertIsNotNone(result)

    def test_extract_dominant_sympy_different_variable(self):
        """Test: _extract_dominant_sympy con variable diferente"""
        from sympy import Symbol
        m = Symbol('m', integer=True, positive=True)
        # Si no hay símbolo 'n', debería retornar 1 o usar el primer símbolo
        result = self.complexity._extract_dominant_sympy(m + 5, variable="n")
        # Si no encuentra 'n', puede retornar 1 o usar m
        self.assertIsNotNone(result)

    def test_sympy_to_latex_simple(self):
        """Test: _sympy_to_latex convierte expresión simple"""
        from sympy import Symbol
        n = Symbol('n', integer=True, positive=True)
        result = self.complexity._sympy_to_latex(n)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)

    def test_sympy_to_latex_complex(self):
        """Test: _sympy_to_latex convierte expresión compleja"""
        from sympy import Symbol, log
        n = Symbol('n', integer=True, positive=True)
        expr = n**2 + n * log(n)
        result = self.complexity._sympy_to_latex(expr)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)

    def test_sympy_to_latex_error_handling(self):
        """Test: _sympy_to_latex maneja errores"""
        # Crear un objeto que cause error en latex()
        class BadExpr:
            pass
        
        bad_expr = BadExpr()
        result = self.complexity._sympy_to_latex(bad_expr)
        # Debe usar str() como fallback
        self.assertIsInstance(result, str)

    def test_calculate_big_o_with_exponential(self):
        """Test: Calcular Big-O con exponenciales"""
        poly = "2^n"
        big_o = self.complexity.calculate_big_o(poly)
        self.assertIsNotNone(big_o)
        self.assertTrue(big_o.startswith("O("))

    def test_calculate_big_o_with_power(self):
        """Test: Calcular Big-O con potencias altas"""
        poly = "n^3 + n^2"
        big_o = self.complexity.calculate_big_o(poly)
        self.assertIsNotNone(big_o)
        self.assertTrue(big_o.startswith("O("))

    def test_calculate_big_omega_constant(self):
        """Test: Calcular Big-Omega con constante"""
        poly = "5"
        big_omega = self.complexity.calculate_big_omega(poly)
        self.assertIsNotNone(big_omega)

    def test_calculate_big_theta_log(self):
        """Test: Calcular Big-Theta con logaritmo"""
        poly = "n log(n)"
        big_theta = self.complexity.calculate_big_theta(poly)
        self.assertIsNotNone(big_theta)
        self.assertTrue("\\Theta" in big_theta or "Theta" in big_theta)


if __name__ == '__main__':
    unittest.main()

