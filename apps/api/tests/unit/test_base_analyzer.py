# tests/unit/test_base_analyzer.py

import unittest
from app.analysis.base import BaseAnalyzer
from sympy import Symbol, Sum, Integer, latex


class TestBaseAnalyzer(unittest.TestCase):
    """Tests para BaseAnalyzer con SymPy."""
    
    def setUp(self):
        self.analyzer = BaseAnalyzer()
    
    def test_add_row_with_sympy(self):
        """Test: add_row acepta expresiones SymPy"""
        self.analyzer.add_row(
            line=1,
            kind="assign",
            ck="C_1",
            count=Integer(1),
            note="Test"
        )
        
        self.assertEqual(len(self.analyzer.rows), 1)
        row = self.analyzer.rows[0]
        self.assertIn("count_raw_expr", row)
        self.assertIsNotNone(row["count_raw_expr"])
    
    def test_push_multiplier_sympy(self):
        """Test: push_multiplier acepta objetos SymPy Sum"""
        n = Symbol("n", integer=True, positive=True)
        i = Symbol("i", integer=True)
        mult = Sum(Integer(1), (i, Integer(1), n))
        
        self.analyzer.push_multiplier(mult)
        self.assertEqual(len(self.analyzer.loop_stack), 1)
        self.assertIsInstance(self.analyzer.loop_stack[0], Sum)
    
    def test_apply_loop_multipliers(self):
        """Test: _apply_loop_multipliers con SymPy"""
        n = Symbol("n", integer=True, positive=True)
        i = Symbol("i", integer=True)
        mult = Sum(Integer(1), (i, Integer(1), n))
        
        self.analyzer.push_multiplier(mult)
        base_count = Integer(1)
        
        result = self.analyzer._apply_loop_multipliers(base_count)
        self.assertIsInstance(result, Sum)
    
    def test_build_t_open(self):
        """Test: build_t_open genera LaTeX"""
        self.analyzer.add_row(1, "assign", "C_1", Integer(1))
        self.analyzer.add_row(2, "assign", "C_2", Integer(2))
        
        t_open = self.analyzer.build_t_open()
        self.assertIsInstance(t_open, str)
        self.assertGreater(len(t_open), 0)


if __name__ == '__main__':
    unittest.main()

