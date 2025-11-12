# tests/unit/test_complexity_classes.py

import unittest
from app.analysis.complexity_classes import ComplexityClasses


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


if __name__ == '__main__':
    unittest.main()

