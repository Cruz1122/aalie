"""
Tests unitarios para app.modules.analysis.visitors.while_repeat_visitor.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import unittest
from app.modules.analysis.analyzers.iterative import IterativeAnalyzer
from app.modules.parsing.service import parse_source
from sympy import Symbol, Integer


class TestWhileRepeatVisitor(unittest.TestCase):
    """Tests para WhileRepeatVisitor."""

    def setUp(self):
        """Configuración inicial para cada test."""
        self.analyzer = IterativeAnalyzer()

    def test_iter_sym_while(self):
        """Test: Genera símbolo de iteración para WHILE"""
        result = self.analyzer.iter_sym("while", 5)
        self.assertEqual(result, "t_{while_5}")

    def test_iter_sym_repeat(self):
        """Test: Genera símbolo de iteración para REPEAT"""
        result = self.analyzer.iter_sym("repeat", 10)
        self.assertEqual(result, "t_{repeat_10}")

    def test_visit_while_simple(self):
        """Test: Visita bucle WHILE simple"""
        node = {
            "type": "While",
            "pos": {"line": 2},
            "test": {
                "type": "binary",
                "left": {"type": "identifier", "name": "i"},
                "op": "<",
                "right": {"type": "identifier", "name": "n"}
            },
            "body": {
                "type": "Block",
                "body": [
                    {"type": "Assign", "pos": {"line": 3}, "target": {"type": "identifier", "name": "i"}, "value": {"type": "binary", "left": {"type": "identifier", "name": "i"}, "op": "+", "right": {"type": "number", "value": 1}}}
                ]
            }
        }
        self.analyzer.visitWhile(node, mode="worst")
        self.assertGreater(len(self.analyzer.rows), 0)

    def test_visit_repeat(self):
        """Test: Visita bucle REPEAT"""
        node = {
            "type": "Repeat",
            "pos": {"line": 2},
            "test": {
                "type": "binary",
                "left": {"type": "identifier", "name": "i"},
                "op": ">",
                "right": {"type": "number", "value": 0}
            },
            "body": {
                "type": "Block",
                "body": [
                    {"type": "Assign", "pos": {"line": 3}, "target": {"type": "identifier", "name": "i"}, "value": {"type": "binary", "left": {"type": "identifier", "name": "i"}, "op": "-", "right": {"type": "number", "value": 1}}}
                ]
            }
        }
        self.analyzer.visitRepeat(node, mode="worst")
        self.assertGreater(len(self.analyzer.rows), 0)

    def test_str_to_sympy(self):
        """Test: Convierte string a SymPy"""
        result = self.analyzer._str_to_sympy("n")
        self.assertIsNotNone(result)
        self.assertIsInstance(result, (Symbol, Integer))

    def test_str_to_sympy_empty(self):
        """Test: Maneja string vacío"""
        result = self.analyzer._str_to_sympy("")
        self.assertEqual(result, Integer(1))

    def test_expr_to_str_identifier(self):
        """Test: Convierte identificador a string"""
        expr = {"type": "identifier", "name": "x"}
        result = self.analyzer._expr_to_str(expr)
        self.assertEqual(result, "x")

    def test_expr_to_str_binary(self):
        """Test: Convierte expresión binaria a string"""
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "a"},
            "op": "+",
            "right": {"type": "number", "value": 1}
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIn("a", result)
        self.assertIn("1", result)

    def test_is_simple_constant(self):
        """Test: Detecta constantes simples"""
        self.assertTrue(self.analyzer._is_simple_constant("1"))
        self.assertTrue(self.analyzer._is_simple_constant("42"))
        self.assertFalse(self.analyzer._is_simple_constant("n"))
        self.assertFalse(self.analyzer._is_simple_constant("n + 1"))

    def test_is_simple_constant_float(self):
        """Test: Detecta constantes flotantes"""
        self.assertTrue(self.analyzer._is_simple_constant("3.14"))
        self.assertTrue(self.analyzer._is_simple_constant("0.5"))

    def test_is_simple_constant_negative(self):
        """Test: Detecta constantes negativas"""
        self.assertTrue(self.analyzer._is_simple_constant("-1"))
        self.assertTrue(self.analyzer._is_simple_constant("-42"))

    def test_is_simple_constant_invalid(self):
        """Test: Rechaza expresiones que no son constantes"""
        self.assertFalse(self.analyzer._is_simple_constant("x + 1"))
        self.assertFalse(self.analyzer._is_simple_constant(""))
        self.assertFalse(self.analyzer._is_simple_constant("abc"))

    def test_str_to_sympy_complex(self):
        """Test: Convierte string complejo a SymPy"""
        result = self.analyzer._str_to_sympy("n + 1")
        self.assertIsNotNone(result)

    def test_str_to_sympy_with_symbols(self):
        """Test: Convierte string con símbolos a SymPy"""
        result = self.analyzer._str_to_sympy("i + j")
        self.assertIsNotNone(result)

    def test_str_to_sympy_error_handling(self):
        """Test: Maneja errores en conversión a SymPy"""
        # String que no se puede parsear
        result = self.analyzer._str_to_sympy("invalid!!!")
        # Debe retornar Integer(1) como fallback
        self.assertEqual(result, Integer(1))

    def test_expr_to_str_complex(self):
        """Test: Convierte expresión compleja a string"""
        expr = {
            "type": "binary",
            "operator": "&&",
            "left": {
                "type": "binary",
                "operator": "<",
                "left": {"type": "identifier", "name": "i"},
                "right": {"type": "identifier", "name": "n"}
            },
            "right": {
                "type": "binary",
                "operator": ">",
                "left": {"type": "identifier", "name": "x"},
                "right": {"type": "number", "value": 0}
            }
        }
        result = self.analyzer._expr_to_str(expr)
        self.assertIsInstance(result, str)
        self.assertGreater(len(result), 0)

    def test_calculate_iterations_addition(self):
        """Test: _calculate_iterations con incremento (+)"""
        result = self.analyzer._calculate_iterations("i", "0", {"operator": "+", "constant": "1"}, "n", "<", "worst")
        self.assertIsNotNone(result)
        self.assertIsInstance(result, str)

    def test_calculate_iterations_subtraction(self):
        """Test: _calculate_iterations con decremento (-)"""
        result = self.analyzer._calculate_iterations("i", "n", {"operator": "-", "constant": "1"}, "0", ">", "worst")
        self.assertIsNotNone(result)
        self.assertIsInstance(result, str)

    def test_calculate_iterations_multiplication(self):
        """Test: _calculate_iterations con multiplicación (*)"""
        result = self.analyzer._calculate_iterations("i", "1", {"operator": "*", "constant": "2"}, "n", "<", "worst")
        self.assertIsNotNone(result)
        self.assertIsInstance(result, str)

    def test_calculate_iterations_division(self):
        """Test: _calculate_iterations con división (/)"""
        result = self.analyzer._calculate_iterations("i", "n", {"operator": "/", "constant": "2"}, "1", ">", "worst")
        self.assertIsNotNone(result)
        self.assertIsInstance(result, str)

    def test_calculate_iterations_no_initial(self):
        """Test: _calculate_iterations sin valor inicial"""
        result = self.analyzer._calculate_iterations("i", None, {"operator": "+", "constant": "1"}, "n", "<", "worst")
        self.assertIsNotNone(result)
        self.assertIsInstance(result, str)

    def test_calculate_iterations_custom_constant(self):
        """Test: _calculate_iterations con constante personalizada"""
        result = self.analyzer._calculate_iterations("i", "0", {"operator": "+", "constant": "2"}, "n", "<", "worst")
        self.assertIsNotNone(result)
        self.assertIsInstance(result, str)

    def test_calculate_iterations_invalid(self):
        """Test: _calculate_iterations con combinación inválida"""
        result = self.analyzer._calculate_iterations("i", "0", {"operator": "+", "constant": "1"}, "n", ">", "worst")
        # Debe retornar None para combinaciones inválidas
        self.assertIsNone(result)

    def test_analyze_while_closure_simple(self):
        """Test: _analyze_while_closure analiza cierre simple"""
        node = {
            "type": "While",
            "pos": {"line": 2},
            "test": {
                "type": "binary",
                "operator": "<",
                "left": {"type": "identifier", "name": "i"},
                "right": {"type": "identifier", "name": "n"}
            },
            "body": {
                "type": "Block",
                "body": [
                    {
                        "type": "Assign",
                        "target": {"type": "identifier", "name": "i"},
                        "value": {
                            "type": "binary",
                            "operator": "+",
                            "left": {"type": "identifier", "name": "i"},
                            "right": {"type": "number", "value": 1}
                        }
                    }
                ]
            }
        }
        result = self.analyzer._analyze_while_closure(node, mode="worst")
        # Puede retornar None si no se puede analizar, o un dict con información
        self.assertIsInstance(result, (dict, type(None)))

    def test_analyze_while_closure_best_case(self):
        """Test: _analyze_while_closure en modo best case"""
        node = {
            "type": "While",
            "pos": {"line": 2},
            "test": {
                "type": "binary",
                "operator": "&&",
                "left": {
                    "type": "binary",
                    "operator": ">",
                    "left": {"type": "identifier", "name": "j"},
                    "right": {"type": "number", "value": 0}
                },
                "right": {
                    "type": "binary",
                    "operator": ">",
                    "left": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "j"}},
                    "right": {"type": "identifier", "name": "key"}
                }
            },
            "body": {"type": "Block", "body": []}
        }
        result = self.analyzer._analyze_while_closure(node, mode="best")
        # Puede retornar None o un dict con información de 0 iteraciones
        self.assertIsInstance(result, (dict, type(None)))

    def test_get_while_exit_probability_no_model(self):
        """Test: _get_while_exit_probability sin avg_model"""
        node = {
            "type": "While",
            "test": {"type": "binary", "operator": "<", "left": {"type": "identifier", "name": "i"}, "right": {"type": "identifier", "name": "n"}}
        }
        # Asegurar que no hay avg_model
        self.analyzer.avg_model = None
        result = self.analyzer._get_while_exit_probability(node)
        self.assertIsNone(result)

    def test_get_while_exit_probability_with_model(self):
        """Test: _get_while_exit_probability con avg_model"""
        from app.modules.analysis.models.avg_model import AvgModel
        self.analyzer.avg_model = AvgModel(mode="uniform", predicates={})
        node = {
            "type": "While",
            "test": {"type": "binary", "operator": "<", "left": {"type": "identifier", "name": "i"}, "right": {"type": "identifier", "name": "n"}}
        }
        result = self.analyzer._get_while_exit_probability(node)
        # Puede retornar None si no encuentra el predicado, o tupla (p_sympy, p_str)
        self.assertIsInstance(result, (tuple, type(None)))

    def test_has_non_control_comparison_with_index(self):
        """Test: _has_non_control_comparison detecta acceso a array"""
        node = {
            "type": "index",
            "target": {"type": "identifier", "name": "A"},
            "index": {"type": "identifier", "name": "j"}
        }
        result = self.analyzer._has_non_control_comparison(node, "i")
        self.assertTrue(result)

    def test_has_non_control_comparison_with_array_access(self):
        """Test: _has_non_control_comparison detecta acceso a array en comparación"""
        node = {
            "type": "binary",
            "operator": ">",
            "left": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "j"}},
            "right": {"type": "identifier", "name": "key"}
        }
        result = self.analyzer._has_non_control_comparison(node, "i")
        self.assertTrue(result)

    def test_has_non_control_comparison_with_different_var(self):
        """Test: _has_non_control_comparison detecta variable diferente"""
        node = {
            "type": "binary",
            "operator": ">",
            "left": {"type": "identifier", "name": "j"},
            "right": {"type": "number", "value": 0}
        }
        result = self.analyzer._has_non_control_comparison(node, "i")
        self.assertTrue(result)

    def test_has_non_control_comparison_same_var(self):
        """Test: _has_non_control_comparison con solo variable de control"""
        node = {
            "type": "binary",
            "operator": "<",
            "left": {"type": "identifier", "name": "i"},
            "right": {"type": "number", "value": 10}
        }
        result = self.analyzer._has_non_control_comparison(node, "i")
        # Comparación solo con constante y variable de control, sin arrays
        self.assertFalse(result)

    def test_has_non_control_comparison_not_dict(self):
        """Test: _has_non_control_comparison con nodo que no es dict"""
        result = self.analyzer._has_non_control_comparison("not_a_dict", "i")
        self.assertFalse(result)

    # --- Tests oráculo (plan mejora WHILE - Fase 1) ---

    def test_oracle_while_bool_unbounded_no_kill(self):
        """WHILE flag=true DO { x <- x + 1 } → unbounded, unbounded_kind=non_terminating"""
        src = """test() BEGIN
  flag <- true
  WHILE (flag = true) DO BEGIN
    x <- x + 1
  END
END
"""
        r = parse_source(src)
        self.assertTrue(r.get("ok"), f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        self.assertGreater(len(while_rows), 0, "Debe haber al menos una fila while")
        wr = while_rows[0]
        self.assertTrue(wr.get("unbounded"), "Debe ser unbounded")
        self.assertEqual(wr.get("unbounded_kind"), "non_terminating")
        self.assertIn("never set to false", wr.get("note", "").lower())

    def test_oracle_while_bool_bounded_kill(self):
        """WHILE flag=true DO { flag <- false } → bounded, iterations=1"""
        src = """test() BEGIN
  flag <- true
  WHILE (flag = true) DO BEGIN
    flag <- false
  END
END
"""
        r = parse_source(src)
        self.assertTrue(r.get("ok"), f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        self.assertGreater(len(while_rows), 0)
        wr = while_rows[0]
        self.assertFalse(wr.get("unbounded", False), "No debe ser unbounded")
        # Condición: 2 evaluaciones (entrada + salida), count = iterations+1 = 2
        count_str = str(wr.get("count", ""))
        self.assertEqual(count_str, "2", f"Count debe ser 2 (1 iteración + 1 eval salida): {count_str}")

    def test_oracle_while_decrement_bounded(self):
        """WHILE i != 0 DO { i <- i - 1 } con i inicializado → bounded, iterations = i0"""
        src = """test() BEGIN
  i <- n
  WHILE (i != 0) DO BEGIN
    i <- i - 1
  END
END
"""
        r = parse_source(src)
        self.assertTrue(r.get("ok"), f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        self.assertGreater(len(while_rows), 0)
        wr = while_rows[0]
        self.assertFalse(wr.get("unbounded", False), "No debe ser unbounded")
        count_str = str(wr.get("count", ""))
        # Debe contener n o i_0 (iteraciones = valor inicial - 0)
        self.assertTrue(
            "n" in count_str or "i" in count_str.lower(),
            f"Count debe reflejar iteraciones: {count_str}",
        )

    def test_oracle_while_no_progress_must(self):
        """WHILE i < n DO { IF (p) THEN i <- i+1 } → unbounded (no progreso must)"""
        src = """test() BEGIN
  i <- 0
  WHILE (i < n) DO BEGIN
    IF (p) THEN BEGIN
      i <- i + 1
    END
  END
END
"""
        r = parse_source(src)
        self.assertTrue(r.get("ok"), f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        self.assertGreater(len(while_rows), 0)
        wr = while_rows[0]
        self.assertTrue(wr.get("unbounded"), "Debe ser unbounded (update solo en rama condicional)")
        self.assertIn("not change", wr.get("note", "").lower())

    def test_oracle_while_or_no_progress(self):
        """WHILE (i < n OR flag = true) DO { i <- i + 1 } con flag sin kill → unbounded"""
        src = """test() BEGIN
  i <- 0
  flag <- true
  WHILE ((i < n) OR (flag = true)) DO BEGIN
    i <- i + 1
  END
END
"""
        r = parse_source(src)
        self.assertTrue(r.get("ok"), f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        self.assertGreater(len(while_rows), 0)
        wr = while_rows[0]
        self.assertTrue(wr.get("unbounded"), "Debe ser unbounded (OR con disyunto sin kill)")

    def test_oracle_while_euclid_mod(self):
        """WHILE (b != 0) DO { b <- a MOD b; ... } (Euclides) → bounded con min(a,b)"""
        src = """mcd(a, b) BEGIN
  WHILE (b != 0) DO BEGIN
    temp <- b;
    b <- a MOD b;
    a <- temp;
  END
  RETURN a;
END
"""
        r = parse_source(src)
        self.assertTrue(r.get("ok"), f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        self.assertGreater(len(while_rows), 0)
        wr = while_rows[0]
        self.assertFalse(wr.get("unbounded", False), "Debe ser bounded (algoritmo de Euclides)")
        count_str = str(wr.get("count", ""))
        self.assertIn("min", count_str.lower(), f"Count debe contener min(a,b): {count_str}")

