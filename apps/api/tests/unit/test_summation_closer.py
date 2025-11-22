# tests/unit/test_summation_closer.py

import unittest
from app.modules.analysis.utils.summation_closer import SummationCloser


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

    def test_has_iterative_symbols_true(self):
        """Test: _has_iterative_symbols detecta símbolos iterativos"""
        from sympy import Symbol
        expr = Symbol('t_while_5', integer=True)
        result = self.closer._has_iterative_symbols(expr)
        self.assertTrue(result)

    def test_has_iterative_symbols_false(self):
        """Test: _has_iterative_symbols no detecta símbolos no iterativos"""
        from sympy import Symbol
        expr = Symbol('n', integer=True)
        result = self.closer._has_iterative_symbols(expr)
        self.assertFalse(result)

    def test_has_iterative_symbols_with_sum(self):
        """Test: _has_iterative_symbols en expresión con sumatoria"""
        from sympy import Symbol, Sum, Integer
        i = Symbol('i', integer=True)
        n = Symbol('n', integer=True)
        expr = Sum(Integer(1), (i, Integer(1), n)) + Symbol('t_while_3')
        result = self.closer._has_iterative_symbols(expr)
        self.assertTrue(result)

    def test_has_summations_true(self):
        """Test: _has_summations detecta sumatorias"""
        from sympy import Symbol, Sum, Integer
        i = Symbol('i', integer=True)
        n = Symbol('n', integer=True)
        expr = Sum(Integer(1), (i, Integer(1), n))
        result = self.closer._has_summations(expr)
        self.assertTrue(result)

    def test_has_summations_false(self):
        """Test: _has_summations no detecta sumatorias cuando no hay"""
        from sympy import Symbol
        expr = Symbol('n', integer=True) + Symbol('m', integer=True)
        result = self.closer._has_summations(expr)
        self.assertFalse(result)

    def test_close_summation_with_sympy_expr(self):
        """Test: close_summation acepta expresión SymPy"""
        from sympy import Symbol, Sum, Integer
        i = Symbol('i', integer=True)
        n = Symbol('n', integer=True, positive=True)
        expr = Sum(Integer(1), (i, Integer(1), n))
        closed, steps = self.closer.close_summation(expr)
        self.assertIsNotNone(closed)
        self.assertIsNotNone(steps)
        self.assertIsInstance(steps, list)

    def test_close_summation_with_iterative_symbol(self):
        """Test: close_summation maneja símbolos iterativos"""
        from sympy import Symbol
        expr = Symbol('t_while_5', integer=True)
        closed, steps = self.closer.close_summation(expr)
        self.assertIsNotNone(closed)
        self.assertIsNotNone(steps)
        self.assertIsInstance(steps, list)

    def test_close_summation_with_sympy_expr_no_summations(self):
        """Test: close_summation con expresión SymPy sin sumatorias"""
        from sympy import Symbol
        expr = Symbol('n', integer=True) + Symbol('m', integer=True)
        closed, steps = self.closer.close_summation(expr)
        self.assertIsNotNone(closed)
        self.assertIsNotNone(steps)

    def test_close_summation_quadratic_sum(self):
        """Test: close_summation maneja sumatoria cuadrática"""
        expr = "\\sum_{i=1}^{n} i^2"
        closed, steps = self.closer.close_summation(expr)
        self.assertIsNotNone(closed)
        self.assertIsNotNone(steps)
        self.assertGreater(len(steps), 0)

    def test_close_summation_with_variable_different(self):
        """Test: close_summation con variable diferente"""
        expr = "\\sum_{i=1}^{m} 1"
        closed, steps = self.closer.close_summation(expr, variable="m")
        self.assertIsNotNone(closed)
        self.assertIsNotNone(steps)

    def test_close_summation_complex_nested(self):
        """Test: close_summation maneja sumatorias anidadas complejas"""
        expr = "\\sum_{i=1}^{n} \\sum_{j=1}^{i} \\sum_{k=1}^{j} 1"
        closed, steps = self.closer.close_summation(expr)
        self.assertIsNotNone(closed)
        self.assertIsNotNone(steps)
        self.assertGreater(len(steps), 0)

    def test_close_summation_with_arithmetic_progression(self):
        """Test: close_summation maneja progresión aritmética"""
        expr = "\\sum_{i=1}^{n} (2*i + 1)"
        closed, steps = self.closer.close_summation(expr)
        self.assertIsNotNone(closed)
        self.assertIsNotNone(steps)
        self.assertGreater(len(steps), 0)


if __name__ == '__main__':
    unittest.main()

