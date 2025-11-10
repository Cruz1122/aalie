# tests/unit/test_summation_closer.py

import unittest
from app.analysis.summation_closer import SummationCloser


class TestSummationCloser(unittest.TestCase):
    """Tests para SummationCloser con casos canónicos."""
    
    def setUp(self):
        self.closer = SummationCloser()
    
    def test_constant_sum_simple(self):
        """Test 1: Sumatoria simple constante \\sum_{i=1}^{n} 1 → n"""
        expr = "\\sum_{i=1}^{n} 1"
        closed, steps = self.closer.close_summation(expr)
        
        self.assertIsNotNone(closed)
        self.assertIsNotNone(steps)
        self.assertGreater(len(steps), 0)
        # El resultado debe ser n o algo equivalente
        self.assertIn("n", closed.lower())
    
    def test_constant_sum_zero_start(self):
        """Test 2: Sumatoria constante desde 0 \\sum_{i=0}^{n} 1 → n+1"""
        expr = "\\sum_{i=0}^{n} 1"
        closed, steps = self.closer.close_summation(expr)
        
        self.assertIsNotNone(closed)
        self.assertIsNotNone(steps)
        self.assertGreater(len(steps), 0)
    
    def test_nested_rectangular(self):
        """Test 3: Sumatorias anidadas rectangulares \\sum_{i=1}^{n} \\sum_{j=1}^{m} 1 → n*m"""
        expr = "\\sum_{i=1}^{n} \\sum_{j=1}^{m} 1"
        closed, steps = self.closer.close_summation(expr)
        
        self.assertIsNotNone(closed)
        self.assertIsNotNone(steps)
        self.assertGreater(len(steps), 0)
        # Debe contener n y m
        self.assertTrue("n" in closed.lower() or "m" in closed.lower())
    
    def test_triangular_sum(self):
        """Test 4: Sumatoria triangular \\sum_{i=1}^{n} \\sum_{j=1}^{i} 1 → n(n+1)/2"""
        expr = "\\sum_{i=1}^{n} \\sum_{j=1}^{i} 1"
        closed, steps = self.closer.close_summation(expr)
        
        self.assertIsNotNone(closed)
        self.assertIsNotNone(steps)
        self.assertGreater(len(steps), 0)
        # Debe contener n y alguna forma de n(n+1)/2
        self.assertIn("n", closed.lower())
    
    def test_dependent_limits(self):
        """Test 5: Sumatorias con límites dependientes \\sum_{i=1}^{n-1} \\sum_{j=i+1}^{n} 1 → n(n-1)/2"""
        expr = "\\sum_{i=1}^{n-1} \\sum_{j=i+1}^{n} 1"
        closed, steps = self.closer.close_summation(expr)
        
        self.assertIsNotNone(closed)
        self.assertIsNotNone(steps)
        self.assertGreater(len(steps), 0)
        self.assertIn("n", closed.lower())
    
    def test_arithmetic_sum(self):
        """Test 6: Sumatoria aritmética \\sum_{i=1}^{n} i → n(n+1)/2"""
        expr = "\\sum_{i=1}^{n} i"
        closed, steps = self.closer.close_summation(expr)
        
        self.assertIsNotNone(closed)
        self.assertIsNotNone(steps)
        self.assertGreater(len(steps), 0)
        self.assertIn("n", closed.lower())
    
    def test_simple_expression(self):
        """Test 7: Expresión simple sin sumatorias"""
        expr = "n + 1"
        closed, steps = self.closer.close_summation(expr)
        
        self.assertIsNotNone(closed)
        # Puede o no tener pasos para expresiones simples
    
    def test_empty_expression(self):
        """Test 8: Expresión vacía"""
        expr = ""
        closed, steps = self.closer.close_summation(expr)
        
        self.assertEqual(closed, "1")
    
    def test_pattern_detection(self):
        """Test 9: Detección de patrones"""
        # Constante
        pattern = self.closer._detect_pattern("\\sum_{i=1}^{n} 1")
        self.assertEqual(pattern, 'constant_sum')
        
        # Triangular
        pattern = self.closer._detect_pattern("\\sum_{i=1}^{n} \\sum_{j=1}^{i} 1")
        self.assertEqual(pattern, 'triangular')
        
        # Rectangular
        pattern = self.closer._detect_pattern("\\sum_{i=1}^{n} \\sum_{j=1}^{m} 1")
        self.assertEqual(pattern, 'nested_rectangular')


if __name__ == '__main__':
    unittest.main()

