"""
Tests unitarios para app.modules.analysis.visitors.while_repeat_visitor.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import pytest
from sympy import Integer, Symbol

from app.modules.analysis.analyzers.iterative import IterativeAnalyzer
from app.modules.parsing.service import parse_source


class TestWhileRepeatVisitor:
    """Tests para WhileRepeatVisitor."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.analyzer = IterativeAnalyzer()

    def test_iter_sym_while(self):
        """Test: Genera símbolo de iteración para WHILE"""
        result = self.analyzer.iter_sym("while", 5)
        assert result == "t_{while_5}"

    def test_iter_sym_repeat(self):
        """Test: Genera símbolo de iteración para REPEAT"""
        result = self.analyzer.iter_sym("repeat", 10)
        assert result == "t_{repeat_10}"

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
        assert len(self.analyzer.rows) > 0

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
        assert len(self.analyzer.rows) > 0

    def test_str_to_sympy(self):
        """Test: Convierte string a SymPy"""
        result = self.analyzer._str_to_sympy("n")
        assert result is not None
        assert isinstance(result, (Symbol, Integer))

    def test_str_to_sympy_empty(self):
        """Test: Maneja string vacío"""
        result = self.analyzer._str_to_sympy("")
        assert result == Integer(1)

    def test_expr_to_str_identifier(self):
        """Test: Convierte identificador a string"""
        expr = {"type": "identifier", "name": "x"}
        result = self.analyzer._expr_to_str(expr)
        assert result == "x"

    def test_expr_to_str_binary(self):
        """Test: Convierte expresión binaria a string"""
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "a"},
            "op": "+",
            "right": {"type": "number", "value": 1}
        }
        result = self.analyzer._expr_to_str(expr)
        assert "a" in result
        assert "1" in result

    def test_is_simple_constant(self):
        """Test: Detecta constantes simples"""
        assert self.analyzer._is_simple_constant("1")
        assert self.analyzer._is_simple_constant("42")
        assert not self.analyzer._is_simple_constant("n")
        assert not self.analyzer._is_simple_constant("n + 1")

    def test_is_simple_constant_float(self):
        """Test: Detecta constantes flotantes"""
        assert self.analyzer._is_simple_constant("3.14")
        assert self.analyzer._is_simple_constant("0.5")

    def test_is_simple_constant_negative(self):
        """Test: Detecta constantes negativas"""
        assert self.analyzer._is_simple_constant("-1")
        assert self.analyzer._is_simple_constant("-42")

    def test_is_simple_constant_invalid(self):
        """Test: Rechaza expresiones que no son constantes"""
        assert not self.analyzer._is_simple_constant("x + 1")
        assert not self.analyzer._is_simple_constant("")
        assert not self.analyzer._is_simple_constant("abc")

    def test_str_to_sympy_complex(self):
        """Test: Convierte string complejo a SymPy"""
        result = self.analyzer._str_to_sympy("n + 1")
        assert result is not None

    def test_str_to_sympy_with_symbols(self):
        """Test: Convierte string con símbolos a SymPy"""
        result = self.analyzer._str_to_sympy("i + j")
        assert result is not None

    def test_str_to_sympy_error_handling(self):
        """Test: Maneja errores en conversión a SymPy"""
        # String que no se puede parsear
        result = self.analyzer._str_to_sympy("invalid!!!")
        # Debe retornar Integer(1) como fallback
        assert result == Integer(1)

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
        assert isinstance(result, str)
        assert len(result) > 0

    def test_calculate_iterations_addition(self):
        """Test: _calculate_iterations con incremento (+)"""
        result = self.analyzer._calculate_iterations("i", "0", {"operator": "+", "constant": "1"}, "n", "<", "worst")
        assert result is not None
        assert isinstance(result, str)

    def test_calculate_iterations_subtraction(self):
        """Test: _calculate_iterations con decremento (-)"""
        result = self.analyzer._calculate_iterations("i", "n", {"operator": "-", "constant": "1"}, "0", ">", "worst")
        assert result is not None
        assert isinstance(result, str)

    def test_calculate_iterations_multiplication(self):
        """Test: _calculate_iterations con multiplicación (*)"""
        result = self.analyzer._calculate_iterations("i", "1", {"operator": "*", "constant": "2"}, "n", "<", "worst")
        assert result is not None
        assert isinstance(result, str)

    def test_calculate_iterations_division(self):
        """Test: _calculate_iterations con división (/)"""
        result = self.analyzer._calculate_iterations("i", "n", {"operator": "/", "constant": "2"}, "1", ">", "worst")
        assert result is not None
        assert isinstance(result, str)

    def test_calculate_iterations_no_initial(self):
        """Test: _calculate_iterations sin valor inicial"""
        result = self.analyzer._calculate_iterations("i", None, {"operator": "+", "constant": "1"}, "n", "<", "worst")
        assert result is not None
        assert isinstance(result, str)

    def test_calculate_iterations_custom_constant(self):
        """Test: _calculate_iterations con constante personalizada"""
        result = self.analyzer._calculate_iterations("i", "0", {"operator": "+", "constant": "2"}, "n", "<", "worst")
        assert result is not None
        assert isinstance(result, str)

    def test_calculate_iterations_invalid(self):
        """Test: _calculate_iterations con combinación inválida"""
        result = self.analyzer._calculate_iterations("i", "0", {"operator": "+", "constant": "1"}, "n", ">", "worst")
        # Debe retornar None para combinaciones inválidas
        assert result is None

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
        assert isinstance(result, (dict, type(None)))

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
        assert isinstance(result, (dict, type(None)))

    def test_get_while_exit_probability_no_model(self):
        """Test: _get_while_exit_probability sin avg_model"""
        node = {
            "type": "While",
            "test": {"type": "binary", "operator": "<", "left": {"type": "identifier", "name": "i"}, "right": {"type": "identifier", "name": "n"}}
        }
        # Asegurar que no hay avg_model
        self.analyzer.avg_model = None
        result = self.analyzer._get_while_exit_probability(node)
        assert result is None

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
        assert isinstance(result, (tuple, type(None)))

    def test_has_non_control_comparison_with_index(self):
        """Test: _has_non_control_comparison detecta acceso a array"""
        node = {
            "type": "index",
            "target": {"type": "identifier", "name": "A"},
            "index": {"type": "identifier", "name": "j"}
        }
        result = self.analyzer._has_non_control_comparison(node, "i")
        assert result

    def test_has_non_control_comparison_with_array_access(self):
        """Test: _has_non_control_comparison detecta acceso a array en comparación"""
        node = {
            "type": "binary",
            "operator": ">",
            "left": {"type": "index", "target": {"type": "identifier", "name": "A"}, "index": {"type": "identifier", "name": "j"}},
            "right": {"type": "identifier", "name": "key"}
        }
        result = self.analyzer._has_non_control_comparison(node, "i")
        assert result

    def test_has_non_control_comparison_with_different_var(self):
        """Test: _has_non_control_comparison detecta variable diferente"""
        node = {
            "type": "binary",
            "operator": ">",
            "left": {"type": "identifier", "name": "j"},
            "right": {"type": "number", "value": 0}
        }
        result = self.analyzer._has_non_control_comparison(node, "i")
        assert result

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
        assert not result

    def test_has_non_control_comparison_not_dict(self):
        """Test: _has_non_control_comparison con nodo que no es dict"""
        result = self.analyzer._has_non_control_comparison("not_a_dict", "i")
        assert not result

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
        assert r.get("ok", f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        assert len(while_rows) > 0, "Debe haber al menos una fila while"
        wr = while_rows[0]
        assert wr.get("unbounded", "Debe ser unbounded")
        assert wr.get("unbounded_kind") == "non_terminating"
        assert "never set to false" in wr.get("note", "".lower())

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
        assert r.get("ok", f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        assert len(while_rows) > 0
        wr = while_rows[0]
        assert not wr.get("unbounded", False), "No debe ser unbounded"
        # Condición: 2 evaluaciones (entrada + salida), count = iterations+1 = 2
        count_str = str(wr.get("count", ""))
        assert count_str == "2", f"Count debe ser 2 (1 iteracion + 1 eval salida: {count_str})"

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
        assert r.get("ok", f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        assert len(while_rows) > 0
        wr = while_rows[0]
        assert not wr.get("unbounded", False), "No debe ser unbounded"
        count_str = str(wr.get("count", ""))
        # Debe contener n o i_0 (iteraciones = valor inicial - 0)
        assert "n" in count_str or "i" in count_str.lower(), f"Count debe reflejar iteraciones: {count_str}"

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
        assert r.get("ok", f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        assert len(while_rows) > 0
        wr = while_rows[0]
        assert wr.get("unbounded", False), "Debe ser unbounded (update solo en rama condicional)"
        assert "not change" in wr.get("note", "").lower()

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
        assert r.get("ok", f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        assert len(while_rows) > 0
        wr = while_rows[0]
        assert wr.get("unbounded", "Debe ser unbounded (OR con disyunto sin kill)")

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
        assert r.get("ok", f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        assert len(while_rows) > 0
        wr = while_rows[0]
        assert not wr.get("unbounded", False), "Debe ser bounded (algoritmo de Euclides)"
        count_str = str(wr.get("count", ""))
        assert "min" in count_str.lower(), f"Count debe contener min(a,b): {count_str}"

    def test_oracle_while_increment_linear_bounded(self):
        """WHILE i < n DO { i <- i + 1 } → bounded, count = n + 1 (cond eval)"""
        src = """linear(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    x <- 1;
    i <- i + 1;
  END
END
"""
        r = parse_source(src)
        assert r.get("ok", f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        assert len(while_rows) > 0
        wr = while_rows[0]
        assert not wr.get("unbounded", False), "Debe ser bounded (incremento lineal)"
        count_str = str(wr.get("count", ""))
        assert "n" in count_str, f"Count debe contener n: {count_str}"
        note = wr.get("note", "")
        assert "worst" in note.lower() or "variable" in note.lower() or "n" in note.lower(), f"Note debe describir analisis: {note}"

    def test_oracle_while_multiplication_log_bounded(self):
        """WHILE i <= n DO { i <- i * 2 } → bounded, O(log n) iteraciones"""
        src = """logLoop(n) BEGIN
  i <- 1;
  WHILE (i <= n) DO BEGIN
    x <- 1;
    i <- i * 2;
  END
END
"""
        r = parse_source(src)
        assert r.get("ok", f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        assert len(while_rows) > 0
        wr = while_rows[0]
        assert not wr.get("unbounded", False), "Debe ser bounded (multiplicacion)"
        count_str = str(wr.get("count", ""))
        assert "log" in count_str.lower() or "n" in count_str, f"Count debe reflejar O(log n): {count_str}"

    def test_oracle_while_decrement_to_zero_bounded(self):
        """WHILE i > 0 DO { i <- i - 1 } con i <- n → bounded, n+1 evaluaciones"""
        src = """countdown(n) BEGIN
  i <- n;
  WHILE (i > 0) DO BEGIN
    x <- 1;
    i <- i - 1;
  END
END
"""
        r = parse_source(src)
        assert r.get("ok", f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        assert len(while_rows) > 0
        wr = while_rows[0]
        assert not wr.get("unbounded", False), "Debe ser bounded (decremento)"
        count_str = str(wr.get("count", ""))
        assert "n" in count_str, f"Count debe contener n: {count_str}"

    def test_oracle_while_note_contains_condition_info(self):
        """Filas WHILE bounded deben tener note que describa condición o iteraciones."""
        src = """simple(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    i <- i + 1;
  END
END
"""
        r = parse_source(src)
        assert r.get("ok", f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        assert len(while_rows) > 0
        wr = while_rows[0]
        note = wr.get("note", "")
        # Note debe mencionar variable, condición o modo (en/es)
        assert len(note) > 0, "WHILE debe tener note"
        keywords = ["while", "condition", "variable", "worst", "condición", "peor", "línea"]
        assert any(kw in note.lower() for kw in keywords) or "i" in note or "n" in note, f"Note debe describir analisis: {note}"

    def test_oracle_while_binary_search_pattern(self):
        """WHILE low <= high con mid = (low+high)/2 → patrón búsqueda binaria, O(log n)"""
        src = """binarySearch(A, n, x) BEGIN
  low <- 1;
  high <- n;
  WHILE (low <= high) DO BEGIN
    mid <- (low + high) / 2;
    IF (A[mid] = x) THEN BEGIN
      RETURN mid;
    END
    IF (A[mid] < x) THEN BEGIN
      low <- mid + 1;
    END
    ELSE BEGIN
      high <- mid - 1;
    END
  END
  RETURN -1;
END
"""
        r = parse_source(src)
        assert r.get("ok", f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        assert len(while_rows) > 0
        wr = while_rows[0]
        assert not wr.get("unbounded", False), "Busqueda binaria debe ser bounded"
        count_str = str(wr.get("count", ""))
        assert "log" in count_str.lower() or "n" in count_str, f"Count debe reflejar O(log n): {count_str}"

    def test_oracle_while_and_flag_does_not_shrink_worst(self):
        """
        WHILE (i < n AND swapped = true) con swapped kill-must y revive-may
        no debe colapsar el peor caso a 1 iteración; debe depender de n.
        """
        src = """bubbleFlag(n) BEGIN
  i <- 1;
  swapped <- true;
  WHILE (i < n AND swapped = true) DO BEGIN
    swapped <- false;
    IF (p) THEN BEGIN
      swapped <- true;
    END
    i <- i + 1;
  END
END
"""
        r = parse_source(src)
        assert r.get("ok", f"Parse failed: {r.get('errors')}")
        self.analyzer.analyze(r["ast"], "worst")
        while_rows = [row for row in self.analyzer.rows if row.get("kind") == "while"]
        assert len(while_rows) > 0, "Debe haber al menos una fila while"
        wr = while_rows[0]
        assert not wr.get("unbounded", False), "No debe ser unbounded"
        count_str = str(wr.get("count", ""))
        assert count_str != "2", f"No debe colapsar a 2 evaluaciones: {count_str}"
        assert "n" in count_str.lower(), f"Peor caso debe depender de n: {count_str}"

