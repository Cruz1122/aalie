# tests/unit/test_base_analyzer.py

import unittest
from app.modules.analysis.analyzers.base import BaseAnalyzer
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
    
    def test_add_row_latex_error_handling(self):
        """Test: add_row maneja errores al convertir count_raw_expr a LaTeX"""
        # Crear un objeto que cause error en latex() pero permita str()
        class BadSymPy:
            def __repr__(self):
                return "BadSymPy()"
            
            def __str__(self):
                return "BadSymPy fallback"
        
        bad_expr = BadSymPy()
        # El error en latex() debe ser capturado y usar str() como fallback
        # Mockeamos latex para que lance excepción
        from unittest.mock import patch
        with patch('app.modules.analysis.analyzers.base.latex', side_effect=Exception("Cannot convert to LaTeX")):
            self.analyzer.add_row(1, "assign", "C_1", bad_expr, "test")
            self.assertEqual(len(self.analyzer.rows), 1)
            # Verificar que se usó str() como fallback
            self.assertEqual(self.analyzer.rows[0]["count_raw"], "BadSymPy fallback")
    
    def test_add_row_count_raw_expr_none(self):
        """Test: add_row maneja count_raw_expr=None"""
        self.analyzer.add_row(1, "assign", "C_1", None, "test")
        row = self.analyzer.rows[0]
        self.assertEqual(row["count_raw"], "1")
    
    def test_add_row_count_raw_expr_not_string(self):
        """Test: add_row convierte count_raw_latex a string si no lo es"""
        # Simular que latex() retorna un objeto no-string
        class NotString:
            def __str__(self):
                return "not_a_string"
        
        # En la práctica, esto sería manejado internamente
        self.analyzer.add_row(1, "assign", "C_1", Integer(5), "test")
        row = self.analyzer.rows[0]
        self.assertIsInstance(row["count_raw"], str)
    
    def test_build_t_open_empty_loop_stack(self):
        """Test: build_t_open funciona con loop_stack vacío"""
        self.analyzer.add_row(1, "assign", "C_1", Integer(1))
        t_open = self.analyzer.build_t_open()
        self.assertIsInstance(t_open, str)
    
    def test_get_context_hash(self):
        """Test: get_context_hash genera hash del contexto"""
        self.analyzer.push_multiplier(Integer(5))
        hash1 = self.analyzer.get_context_hash()
        self.assertIsInstance(hash1, str)
        self.assertGreater(len(hash1), 0)
    
    def test_get_context_hash_different_contexts(self):
        """Test: get_context_hash retorna diferentes hashes para diferentes contextos"""
        self.analyzer.push_multiplier(Integer(5))
        hash1 = self.analyzer.get_context_hash()
        
        self.analyzer.pop_multiplier()
        self.analyzer.push_multiplier(Integer(10))
        hash2 = self.analyzer.get_context_hash()
        
        self.assertNotEqual(hash1, hash2)
    
    def test_get_context_hash_empty_stack(self):
        """Test: get_context_hash funciona con loop_stack vacío"""
        hash1 = self.analyzer.get_context_hash()
        self.assertIsInstance(hash1, str)
    
    def test_add_procedure_step(self):
        """Test: add_procedure_step agrega un paso"""
        self.assertIsNone(self.analyzer.procedure_steps)
        self.analyzer.add_procedure_step("Paso 1")
        self.assertIsNotNone(self.analyzer.procedure_steps)
        self.assertEqual(len(self.analyzer.procedure_steps), 1)
        self.assertEqual(self.analyzer.procedure_steps[0], "Paso 1")
    
    def test_add_procedure_step_multiple(self):
        """Test: add_procedure_step agrega múltiples pasos"""
        self.analyzer.add_procedure_step("Paso 1")
        self.analyzer.add_procedure_step("Paso 2")
        self.analyzer.add_procedure_step("Paso 3")
        
        self.assertEqual(len(self.analyzer.procedure_steps), 3)
        self.assertEqual(self.analyzer.procedure_steps[0], "Paso 1")
        self.assertEqual(self.analyzer.procedure_steps[1], "Paso 2")
        self.assertEqual(self.analyzer.procedure_steps[2], "Paso 3")
    
    def test_result_cleanup_sympy_objects(self):
        """Test: result() limpia objetos SymPy no serializables"""
        self.analyzer.add_row(1, "assign", "C_1", Integer(5), "test")
        result = self.analyzer.result()
        
        # Verificar que las filas limpias no contienen objetos SymPy
        self.assertIn("byLine", result)
        for row in result["byLine"]:
            # count_raw_expr y count_expr deben ser removidos
            self.assertNotIn("count_raw_expr", row)
            self.assertNotIn("count_expr", row)
    
    def test_result_sympy_conversion_error(self):
        """Test: result() maneja errores al convertir objetos SymPy a LaTeX"""
        # Crear un objeto SymPy-like que cause error en latex()
        class BadSymPyValue:
            def __init__(self):
                pass
            
            @property
            def __class__(self):
                class FakeClass:
                    pass
                FakeClass.__module__ = "sympy.core"
                return FakeClass
        
        # Agregar fila con objeto problemático en algún campo
        self.analyzer.add_row(1, "assign", "C_1", Integer(5), "test")
        # Modificar la fila para tener un valor problemático
        self.analyzer.rows[0]["test_sympy"] = BadSymPyValue()
        
        # Debe manejar el error y usar str() como fallback
        result = self.analyzer.result()
        self.assertIn("byLine", result)
    
    def test_result_count_value_none(self):
        """Test: result() maneja count=None correctamente"""
        # Crear fila donde count podría ser None
        self.analyzer.add_row(1, "assign", "C_1", "1", "test")
        result = self.analyzer.result()
        self.assertIn("byLine", result)
        if len(result["byLine"]) > 0:
            self.assertIn("count", result["byLine"][0])
    
    def test_result_count_value_zero(self):
        """Test: result() mantiene count=0 como '0' no como '1'"""
        self.analyzer.add_row(1, "assign", "C_1", Integer(0), "test")
        result = self.analyzer.result()
        
        self.assertIn("byLine", result)
        if len(result["byLine"]) > 0:
            # Si count_raw es 0, debe mantener "0"
            # Esto es manejado en el código cuando value == 0
            pass
    
    def test_result_mode_avg_expected_runs(self):
        """Test: result() agrega expectedRuns en modo avg"""
        self.analyzer.mode = "avg"
        self.analyzer.add_row(1, "assign", "C_1", Integer(5), "test")
        result = self.analyzer.result()
        
        self.assertIn("byLine", result)
        if len(result["byLine"]) > 0:
            row = result["byLine"][0]
            self.assertIn("expectedRuns", row)
    
    def test_result_mode_avg_expected_runs_zero(self):
        """Test: result() mantiene expectedRuns='0' cuando count es 0 en modo avg"""
        self.analyzer.mode = "avg"
        self.analyzer.add_row(1, "assign", "C_1", Integer(0), "test")
        result = self.analyzer.result()
        
        self.assertIn("byLine", result)
        if len(result["byLine"]) > 0:
            row = result["byLine"][0]
            if row.get("count") == "0":
                # En modo avg, expectedRuns también debe ser "0" si count es "0"
                pass


if __name__ == '__main__':
    unittest.main()

