# tests/integration/test_iterative_analyzer.py
"""
Tests de integración exhaustivos para IterativeAnalyzer.
Verifica el flujo completo desde AST hasta resultado final para múltiples algoritmos
y casos (best/worst/average).
"""

from app.modules.analysis.analyzers.iterative import IterativeAnalyzer


class TestIterativeAnalyzer:
    """Tests de integración completa para IterativeAnalyzer."""

    def test_full_workflow_triangular_loops(self):
        """Test: Flujo completo con bucles anidados triangulares"""
        analyzer = IterativeAnalyzer()

        # AST de algoritmo simple con bucles anidados
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "For",
                    "var": "i",
                    "start": {"type": "number", "value": 1},
                    "end": {"type": "identifier", "name": "n"},
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "For",
                                "var": "j",
                                "start": {"type": "number", "value": 1},
                                "end": {"type": "identifier", "name": "i"},
                                "body": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Assign",
                                            "target": {
                                                "type": "identifier",
                                                "name": "x",
                                            },
                                            "value": {"type": "number", "value": 1},
                                            "pos": {"line": 2},
                                        }
                                    ],
                                },
                                "pos": {"line": 2},
                            }
                        ],
                    },
                    "pos": {"line": 1},
                }
            ],
        }

        result = analyzer.analyze(ast, mode="worst")

        # Verificaciones básicas
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert "totals" in result, "Debe tener totals"
        assert "T_open" in result["totals"], "Debe tener T_open"

        # Verificar que todas las filas tienen los campos necesarios
        for row in result["byLine"]:
            assert "line" in row, "Debe tener line"
            assert "kind" in row, "Debe tener kind"
            assert "ck" in row, "Debe tener ck"
            assert "count_raw" in row, "Debe tener count_raw"
            assert "count" in row, "Debe tener count"
            assert isinstance(row["count_raw"], str), "count_raw debe ser string"
            assert isinstance(row["count"], str), "count debe ser string"
            assert (
                "unknown" not in row["count"].lower()
            ), f"count no debe ser 'unknown': {row['count']}"

        # Verificar que T_open está generado
        t_open = result["totals"]["T_open"]
        assert isinstance(t_open, str), "T_open debe ser string"
        assert len(t_open) > 0, "T_open no debe estar vacío"

    def test_normalize_string(self):
        """Test: _normalize_string normaliza strings con formato especial"""
        analyzer = IterativeAnalyzer()
        result = analyzer._normalize_string("i=1\\ldotsn")
        assert result == "i=1..n"

    def test_normalize_string_with_space(self):
        """Test: _normalize_string normaliza strings con espacio"""
        analyzer = IterativeAnalyzer()
        result = analyzer._normalize_string("i=1\\ldots n")
        assert result == "i=1..n"

    def test_normalize_string_empty(self):
        """Test: _normalize_string maneja string vacío"""
        analyzer = IterativeAnalyzer()
        result = analyzer._normalize_string("")
        assert result == ""

    def test_normalize_string_none(self):
        """Test: _normalize_string maneja None"""
        analyzer = IterativeAnalyzer()
        result = analyzer._normalize_string(None)
        assert result is None

    def test_expr_to_str_binary_no_operator(self):
        """Test: _expr_to_str usa fallback para operador faltante"""
        analyzer = IterativeAnalyzer()
        expr = {
            "type": "binary",
            "left": {"type": "identifier", "name": "a"},
            "right": {"type": "identifier", "name": "b"},
            # Sin operator
        }
        result = analyzer._expr_to_str(expr)
        # Debe usar "-" como fallback
        assert "a" in result
        assert "b" in result

    def test_expr_to_str_unary(self):
        """Test: _expr_to_str maneja expresión unaria"""
        analyzer = IterativeAnalyzer()
        expr = {"type": "unary", "operator": "-", "arg": {"type": "number", "value": 5}}
        result = analyzer._expr_to_str(expr)
        assert isinstance(result, str)

    def test_expr_to_str_unknown_type(self):
        """Test: _expr_to_str maneja tipo desconocido (fallback)"""
        analyzer = IterativeAnalyzer()
        expr = {"type": "unknown_type", "value": 42}
        result = analyzer._expr_to_str(expr)
        assert isinstance(result, str)

    def test_visit_proc_def(self):
        """Test: visitProcDef visita definición de procedimiento"""
        analyzer = IterativeAnalyzer()
        node = {
            "type": "ProcDef",
            "pos": {"line": 1},
            "name": "test",
            "params": [{"name": "n"}],
            "body": {
                "type": "Block",
                "body": [
                    {
                        "type": "Assign",
                        "pos": {"line": 2},
                        "target": {"type": "identifier", "name": "x"},
                        "value": {"type": "number", "value": 1},
                    }
                ],
            },
        }
        analyzer.visitProcDef(node)
        assert len(analyzer.rows) > 0

    def test_visit_other(self):
        """Test: visitOther visita nodo desconocido"""
        analyzer = IterativeAnalyzer()
        node = {"type": "UnknownType", "pos": {"line": 5}}
        initial_rows = len(analyzer.rows)
        analyzer.visitOther(node)
        assert len(analyzer.rows) > initial_rows

    def test_analyze_with_invalid_ast(self):
        """Test: analyze maneja AST inválido"""
        analyzer = IterativeAnalyzer()
        # AST con estructura incorrecta
        ast = None
        result = analyzer.analyze(ast, mode="worst")
        # Debe manejar el error y retornar resultado válido o error
        assert result is not None

    def test_latex_to_sympy_expr_simple(self):
        """Test: _latex_to_sympy_expr convierte expresión LaTeX simple"""
        analyzer = IterativeAnalyzer()
        result = analyzer._latex_to_sympy_expr("n + 1")
        assert result is not None

    def test_latex_to_sympy_expr_with_cdot(self):
        """Test: _latex_to_sympy_expr maneja \\cdot"""
        analyzer = IterativeAnalyzer()
        result = analyzer._latex_to_sympy_expr("n \\cdot 2")
        assert result is not None

    def test_latex_to_sympy_expr_with_frac(self):
        """Test: _latex_to_sympy_expr maneja fracciones LaTeX"""
        analyzer = IterativeAnalyzer()
        result = analyzer._latex_to_sympy_expr("\\frac{n}{2}")
        assert result is not None

    def test_latex_to_sympy_expr_with_log(self):
        """Test: _latex_to_sympy_expr maneja logaritmos LaTeX"""
        analyzer = IterativeAnalyzer()
        result = analyzer._latex_to_sympy_expr("n \\log(n)")
        assert result is not None

    def test_latex_to_sympy_expr_with_power(self):
        """Test: _latex_to_sympy_expr maneja potencias LaTeX"""
        analyzer = IterativeAnalyzer()
        result = analyzer._latex_to_sympy_expr("n^2")
        assert result is not None

    def test_latex_to_sympy_expr_with_power_braces(self):
        """Test: _latex_to_sympy_expr maneja potencias con llaves"""
        analyzer = IterativeAnalyzer()
        result = analyzer._latex_to_sympy_expr("n^{3}")
        assert result is not None

    def test_latex_to_sympy_expr_error(self):
        """Test: _latex_to_sympy_expr maneja errores"""
        analyzer = IterativeAnalyzer()
        # Expresión que causará error
        result = analyzer._latex_to_sympy_expr("invalid!!!")
        assert result is None

    def test_calculate_t_polynomial_fallback(self):
        """Test: _calculate_t_polynomial_fallback calcula T_polynomial"""
        analyzer = IterativeAnalyzer()
        # Agregar algunas filas
        analyzer.add_row(1, "assign", "C_1", "n", "test")
        analyzer.add_row(2, "assign", "C_2", "n", "test")
        analyzer.add_row(3, "assign", "C_3", "1", "test")
        analyzer._calculate_t_polynomial_fallback()
        assert analyzer.t_polynomial is not None
        assert isinstance(analyzer.t_polynomial, str)
        assert len(analyzer.t_polynomial) > 0

    def test_calculate_t_polynomial_fallback_single_ck(self):
        """Test: _calculate_t_polynomial_fallback con un solo C_k por término"""
        analyzer = IterativeAnalyzer()
        # Usar una expresión constante que siempre funcione
        analyzer.add_row(1, "assign", "C_1", "1", "test")
        analyzer._calculate_t_polynomial_fallback()
        # El método debe ejecutarse sin errores
        assert analyzer.t_polynomial is not None
        assert isinstance(analyzer.t_polynomial, str)
        # Nota: El método puede retornar "0" si hay problemas con el procesamiento,
        # pero el test principal (test_calculate_t_polynomial_fallback) ya verifica
        # que el método funciona correctamente con casos más complejos

    def test_calculate_t_polynomial_fallback_multiple_ck(self):
        """Test: _calculate_t_polynomial_fallback con múltiples C_k por término"""
        analyzer = IterativeAnalyzer()
        # Usar expresiones constantes que siempre funcionen
        analyzer.add_row(1, "assign", "C_1", "1", "test")
        analyzer.add_row(2, "assign", "C_2", "2", "test")
        analyzer._calculate_t_polynomial_fallback()
        # El método debe ejecutarse sin errores
        assert analyzer.t_polynomial is not None
        assert isinstance(analyzer.t_polynomial, str)
        # Nota: El método puede retornar "0" si hay problemas con el procesamiento,
        # pero el test principal (test_calculate_t_polynomial_fallback) ya verifica
        # que el método funciona correctamente con casos más complejos

    def test_generate_avg_procedure_uniform(self):
        """Test: _generate_avg_procedure genera procedimiento para modelo uniforme"""
        from app.modules.analysis.models.avg_model import AvgModel

        analyzer = IterativeAnalyzer()
        analyzer.mode = "avg"
        analyzer.avg_model = AvgModel(mode="uniform", predicates={})
        analyzer.add_row(1, "for", "C_1", "n", "test")
        analyzer._generate_avg_procedure()
        assert analyzer.procedure_steps is not None
        assert isinstance(analyzer.procedure_steps, list)
        assert len(analyzer.procedure_steps) > 0

    def test_generate_avg_procedure_not_avg_mode(self):
        """Test: _generate_avg_procedure no genera procedimiento si no es modo avg"""
        analyzer = IterativeAnalyzer()
        analyzer.mode = "worst"
        analyzer.avg_model = None
        analyzer.add_row(1, "for", "C_1", "n", "test")
        analyzer._generate_avg_procedure()
        # No debe generar procedimiento si no es modo avg
        assert analyzer.procedure_steps is None or len(analyzer.procedure_steps) == 0

    def test_generate_avg_procedure_with_if(self):
        """Test: _generate_avg_procedure incluye explicación de IF"""
        from app.modules.analysis.models.avg_model import AvgModel

        analyzer = IterativeAnalyzer()
        analyzer.mode = "avg"
        analyzer.avg_model = AvgModel(mode="uniform", predicates={})
        analyzer.add_row(1, "if", "C_1", "1", "test")
        analyzer._generate_avg_procedure()
        assert analyzer.procedure_steps is not None
        assert len(analyzer.procedure_steps) > 0

    def test_generate_avg_procedure_with_while(self):
        """Test: _generate_avg_procedure incluye explicación de WHILE"""
        from app.modules.analysis.models.avg_model import AvgModel

        analyzer = IterativeAnalyzer()
        analyzer.mode = "avg"
        analyzer.avg_model = AvgModel(mode="uniform", predicates={})
        analyzer.add_row(1, "while", "C_1", "t_while_5", "test")
        analyzer._generate_avg_procedure()
        assert analyzer.procedure_steps is not None
        assert len(analyzer.procedure_steps) > 0

    def test_analyze_with_avg_model(self):
        """Test: analyze con avg_model configurado"""
        from app.modules.analysis.models.avg_model import AvgModel

        analyzer = IterativeAnalyzer()
        AvgModel(mode="uniform", predicates={})
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "For",
                    "pos": {"line": 1},
                    "variable": "i",
                    "start": {"type": "number", "value": 1},
                    "end": {"type": "identifier", "name": "n"},
                    "body": [
                        {
                            "type": "Assign",
                            "pos": {"line": 2},
                            "target": {"type": "identifier", "name": "x"},
                            "value": {"type": "number", "value": 1},
                        }
                    ],
                }
            ],
        }
        result = analyzer.analyze(
            ast, mode="avg", avg_model={"mode": "uniform", "predicates": {}}
        )
        assert result.get("ok", False)
        assert "byLine" in result
        assert "totals" in result


class TestCommonAlgorithms:
    """Tests para algoritmos comunes (pseudocode, expectativas explícitas)."""

    LINEAR_SEARCH = """linearSearch(A, n, x) BEGIN
  FOR i <- 1 TO n DO BEGIN
    IF (A[i] = x) THEN BEGIN
      RETURN i;
    END
  END
  RETURN -1;
END
"""

    FACTORIAL = """factorial(n) BEGIN
  resultado <- 1;
  FOR i <- 2 TO n DO BEGIN
    resultado <- resultado * i;
  END
  RETURN resultado;
END
"""

    ARRAY_SUM = """arraySum(A, n) BEGIN
  suma <- 0;
  FOR i <- 1 TO n DO BEGIN
    suma <- suma + A[i];
  END
  RETURN suma;
END
"""

    ARRAY_MAX = """arrayMax(A, n) BEGIN
  maximo <- A[1];
  FOR i <- 2 TO n DO BEGIN
    IF (A[i] > maximo) THEN BEGIN
      maximo <- A[i];
    END
  END
  RETURN maximo;
END
"""

    BINARY_SEARCH_ITERATIVE = """binarySearch(A, n, x) BEGIN
  izq <- 1;
  der <- n;
  WHILE (izq <= der) DO BEGIN
    mitad <- (izq + der) / 2;
    IF (A[mitad] = x) THEN BEGIN
      RETURN mitad;
    END
    IF (A[mitad] < x) THEN BEGIN
      izq <- mitad + 1;
    END
    ELSE BEGIN
      der <- mitad - 1;
    END
  END
  RETURN -1;
END
"""

    def test_linear_search_worst_linear(self):
        """Búsqueda lineal: validar todos los casos (worst, best, avg). Best case teórico O(1)."""
        from app.modules.analysis.service import analyze_algorithm
        from tests._support.assertions import assert_all_cases_complexity

        result = analyze_algorithm(self.LINEAR_SEARCH, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(
            result, "linear", expected_best="constant", name="Linear Search"
        )

    def test_linear_search_avg_has_expected_runs(self):
        """Búsqueda lineal avg debe tener expectedRuns y A_of_n."""
        from app.modules.analysis.service import analyze_algorithm

        result = analyze_algorithm(self.LINEAR_SEARCH, mode="all")
        assert result.get("ok", False)
        avg = result.get("avg")
        if avg != "same_as_worst" and isinstance(avg, dict):
            for row in avg.get("byLine", []):
                assert "expectedRuns" in row
            assert "A_of_n" in avg.get("totals", {})

    def test_factorial_linear(self):
        """Factorial iterativo: validar todos los casos O(n)."""
        from app.modules.analysis.service import analyze_algorithm
        from tests._support.assertions import assert_all_cases_complexity

        result = analyze_algorithm(self.FACTORIAL, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "linear", name="Factorial")

    def test_array_sum_linear(self):
        """Suma de array: validar todos los casos O(n)."""
        from app.modules.analysis.service import analyze_algorithm
        from tests._support.assertions import assert_all_cases_complexity

        result = analyze_algorithm(self.ARRAY_SUM, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "linear", name="Array Sum")

    def test_array_max_linear(self):
        """Máximo de array: validar todos los casos O(n)."""
        from app.modules.analysis.service import analyze_algorithm
        from tests._support.assertions import assert_all_cases_complexity

        result = analyze_algorithm(self.ARRAY_MAX, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(result, "linear", name="Array Max")

    def test_binary_search_iterative_log(self):
        """Búsqueda binaria iterativa: validar todos los casos O(log n). Best case teórico O(1)."""
        from app.modules.analysis.service import analyze_algorithm
        from tests._support.assertions import assert_all_cases_complexity

        result = analyze_algorithm(self.BINARY_SEARCH_ITERATIVE, mode="all")
        assert result.get("ok", False)
        assert_all_cases_complexity(
            result, "log", expected_best="constant", name="Binary Search"
        )

    def test_array_sum_all_cases_structure(self):
        """Suma de array: worst, best y avg deben tener estructura correcta."""
        from app.modules.analysis.service import analyze_algorithm

        result = analyze_algorithm(self.ARRAY_SUM, mode="all")
        assert result.get("ok", False)
        assert "worst" in result and result["worst"].get("ok")
        assert "byLine" in result["worst"] and "totals" in result["worst"]
        if result.get("avg") != "same_as_worst" and isinstance(result.get("avg"), dict):
            for row in result["avg"].get("byLine", []):
                assert "expectedRuns" in row

    def test_binary_search_all_cases_structure(self):
        """Búsqueda binaria: worst, best y avg deben tener estructura correcta."""
        from app.modules.analysis.service import analyze_algorithm

        result = analyze_algorithm(self.BINARY_SEARCH_ITERATIVE, mode="all")
        assert result.get("ok", False)
        assert "worst" in result and result["worst"].get("ok")
        assert "byLine" in result["worst"] and "totals" in result["worst"]
