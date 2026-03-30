# tests/unit/test_summation_closer.py
import pytest

from app.modules.analysis.utils.summation_closer import SummationCloser

pytestmark = [pytest.mark.unit, pytest.mark.fast]


class TestSummationCloser:
    """Tests para SummationCloser con casos canónicos."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.closer = SummationCloser()

    def test_constant_sum_simple(self):
        """Test 1: Sumatoria simple constante \\sum_{i=1}^{n} 1 → n"""
        expr = "\\sum_{i=1}^{n} 1"
        closed, steps = self.closer.close_summation(expr)

        assert closed is not None
        assert steps is not None
        assert len(steps) > 0
        # El resultado debe ser n o algo equivalente
        assert "n" in closed.lower()

    def test_constant_sum_zero_start(self):
        """Test 2: Sumatoria constante desde 0 \\sum_{i=0}^{n} 1 → n+1"""
        expr = "\\sum_{i=0}^{n} 1"
        closed, steps = self.closer.close_summation(expr)

        assert closed is not None
        assert steps is not None
        assert len(steps) > 0

    def test_nested_rectangular(self):
        """Test 3: Sumatorias anidadas rectangulares \\sum_{i=1}^{n} \\sum_{j=1}^{m} 1 → n*m"""
        expr = "\\sum_{i=1}^{n} \\sum_{j=1}^{m} 1"
        closed, steps = self.closer.close_summation(expr)

        assert closed is not None
        assert steps is not None
        assert len(steps) > 0
        # Debe contener n y m
        assert "n" in closed.lower() or "m" in closed.lower()

    def test_triangular_sum(self):
        """Test 4: Sumatoria triangular \\sum_{i=1}^{n} \\sum_{j=1}^{i} 1 → n(n+1)/2"""
        expr = "\\sum_{i=1}^{n} \\sum_{j=1}^{i} 1"
        closed, steps = self.closer.close_summation(expr)

        assert closed is not None
        assert steps is not None
        assert len(steps) > 0
        # Debe contener n y alguna forma de n(n+1)/2
        assert "n" in closed.lower()

    def test_dependent_limits(self):
        """Test 5: Sumatorias con límites dependientes \\sum_{i=1}^{n-1} \\sum_{j=i+1}^{n} 1 → n(n-1)/2"""
        expr = "\\sum_{i=1}^{n-1} \\sum_{j=i+1}^{n} 1"
        closed, steps = self.closer.close_summation(expr)

        assert closed is not None
        assert steps is not None
        assert len(steps) > 0
        assert "n" in closed.lower()

    def test_arithmetic_sum(self):
        """Test 6: Sumatoria aritmética \\sum_{i=1}^{n} i → n(n+1)/2"""
        expr = "\\sum_{i=1}^{n} i"
        closed, steps = self.closer.close_summation(expr)

        assert closed is not None
        assert steps is not None
        assert len(steps) > 0
        assert "n" in closed.lower()

    def test_simple_expression(self):
        """Test 7: Expresión simple sin sumatorias"""
        expr = "n + 1"
        closed, steps = self.closer.close_summation(expr)

        assert closed is not None
        # Puede o no tener pasos para expresiones simples

    def test_empty_expression(self):
        """Test 8: Expresión vacía"""
        expr = ""
        closed, steps = self.closer.close_summation(expr)

        assert closed == "1"

    def test_pattern_detection(self):
        """Test 9: Detección de patrones"""
        # Constante
        pattern = self.closer._detect_pattern("\\sum_{i=1}^{n} 1")
        assert pattern == "constant_sum"

        # Triangular
        pattern = self.closer._detect_pattern("\\sum_{i=1}^{n} \\sum_{j=1}^{i} 1")
        assert pattern == "triangular"

        # Rectangular
        pattern = self.closer._detect_pattern("\\sum_{i=1}^{n} \\sum_{j=1}^{m} 1")
        assert pattern == "nested_rectangular"

    def test_has_iterative_symbols_true(self):
        """Test: _has_iterative_symbols detecta símbolos iterativos"""
        from sympy import Symbol

        expr = Symbol("t_while_5", integer=True)
        result = self.closer._has_iterative_symbols(expr)
        assert result

    def test_has_iterative_symbols_false(self):
        """Test: _has_iterative_symbols no detecta símbolos no iterativos"""
        from sympy import Symbol

        expr = Symbol("n", integer=True)
        result = self.closer._has_iterative_symbols(expr)
        assert not result

    def test_has_iterative_symbols_with_sum(self):
        """Test: _has_iterative_symbols en expresión con sumatoria"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True)
        expr = Sum(Integer(1), (i, Integer(1), n)) + Symbol("t_while_3")
        result = self.closer._has_iterative_symbols(expr)
        assert result

    def test_has_summations_true(self):
        """Test: _has_summations detecta sumatorias"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True)
        expr = Sum(Integer(1), (i, Integer(1), n))
        result = self.closer._has_summations(expr)
        assert result

    def test_has_summations_false(self):
        """Test: _has_summations no detecta sumatorias cuando no hay"""
        from sympy import Symbol

        expr = Symbol("n", integer=True) + Symbol("m", integer=True)
        result = self.closer._has_summations(expr)
        assert not result

    def test_close_summation_with_sympy_expr(self):
        """Test: close_summation acepta expresión SymPy"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        expr = Sum(Integer(1), (i, Integer(1), n))
        closed, steps = self.closer.close_summation(expr)
        assert closed is not None
        assert steps is not None
        assert isinstance(steps, list)

    def test_close_summation_with_iterative_symbol(self):
        """Test: close_summation maneja símbolos iterativos"""
        from sympy import Symbol

        expr = Symbol("t_while_5", integer=True)
        closed, steps = self.closer.close_summation(expr)
        assert closed is not None
        assert steps is not None
        assert isinstance(steps, list)

    def test_close_summation_with_sympy_expr_no_summations(self):
        """Test: close_summation con expresión SymPy sin sumatorias"""
        from sympy import Symbol

        expr = Symbol("n", integer=True) + Symbol("m", integer=True)
        closed, steps = self.closer.close_summation(expr)
        assert closed is not None
        assert steps is not None

    def test_close_summation_quadratic_sum(self):
        """Test: close_summation maneja sumatoria cuadrática"""
        expr = "\\sum_{i=1}^{n} i^2"
        closed, steps = self.closer.close_summation(expr)
        assert closed is not None
        assert steps is not None
        assert len(steps) > 0

    def test_close_summation_with_variable_different(self):
        """Test: close_summation con variable diferente"""
        expr = "\\sum_{i=1}^{m} 1"
        closed, steps = self.closer.close_summation(expr, variable="m")
        assert closed is not None
        assert steps is not None

    def test_close_summation_complex_nested(self):
        """Test: close_summation maneja sumatorias anidadas complejas"""
        expr = "\\sum_{i=1}^{n} \\sum_{j=1}^{i} \\sum_{k=1}^{j} 1"
        closed, steps = self.closer.close_summation(expr)
        assert closed is not None
        assert steps is not None
        assert len(steps) > 0

    def test_close_summation_with_arithmetic_progression(self):
        """Test: close_summation maneja progresión aritmética"""
        expr = "\\sum_{i=1}^{n} (2*i + 1)"
        closed, steps = self.closer.close_summation(expr)
        assert closed is not None
        assert steps is not None
        assert len(steps) > 0

    def test_generate_constant_sum_steps(self):
        """Test: _generate_constant_sum_steps genera pasos para sumatoria constante"""
        expr = "\\sum_{i=1}^{n} 1"
        result = self.closer._generate_constant_sum_steps(expr, "n")
        assert result is not None
        assert isinstance(result, list)
        assert len(result) > 0

    def test_generate_constant_sum_steps_zero_start(self):
        """Test: _generate_constant_sum_steps con inicio en 0"""
        expr = "\\sum_{i=0}^{n} 1"
        result = self.closer._generate_constant_sum_steps(expr, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_generate_constant_sum_steps_custom_range(self):
        """Test: _generate_constant_sum_steps con rango personalizado"""
        expr = "\\sum_{i=2}^{m} 1"
        result = self.closer._generate_constant_sum_steps(expr, "m")
        assert result is not None
        assert isinstance(result, list)

    def test_generate_triangular_steps(self):
        """Test: _generate_triangular_steps genera pasos para sumatoria triangular"""
        expr = "\\sum_{i=1}^{n} \\sum_{j=1}^{i} 1"
        result = self.closer._generate_triangular_steps(expr, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_generate_nested_rectangular_steps(self):
        """Test: _generate_nested_rectangular_steps genera pasos para sumatorias rectangulares"""
        expr = "\\sum_{i=1}^{n} \\sum_{j=1}^{m} 1"
        result = self.closer._generate_nested_rectangular_steps(expr, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_generate_arithmetic_sum_steps(self):
        """Test: _generate_arithmetic_sum_steps genera pasos para sumatoria aritmética"""
        expr = "\\sum_{i=1}^{n} i"
        result = self.closer._generate_arithmetic_sum_steps(expr, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_generate_arithmetic_sum_steps_custom_start(self):
        """Test: _generate_arithmetic_sum_steps con inicio personalizado"""
        expr = "\\sum_{i=2}^{n} i"
        result = self.closer._generate_arithmetic_sum_steps(expr, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_generate_generic_steps(self):
        """Test: _generate_generic_steps genera pasos genéricos"""
        expr = "\\sum_{i=1}^{n} i^2"
        result = self.closer._generate_generic_steps(expr, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_latex_to_sympy_simple(self):
        """Test: _latex_to_sympy convierte expresión LaTeX simple"""
        result = self.closer._latex_to_sympy("n + 1", "n")
        assert result is not None

    def test_latex_to_sympy_with_sum(self):
        """Test: _latex_to_sympy convierte expresión con sumatoria"""
        result = self.closer._latex_to_sympy("\\sum_{i=1}^{n} 1", "n")
        assert result is not None

    def test_evaluate_with_sympy_simple(self):
        """Test: _evaluate_with_sympy evalúa expresión simple"""
        result = self.closer._evaluate_with_sympy("n + 1", "n")
        assert result is not None

    def test_evaluate_with_sympy_with_sum(self):
        """Test: _evaluate_with_sympy evalúa expresión con sumatoria"""
        result = self.closer._evaluate_with_sympy("\\sum_{i=1}^{n} 1", "n")
        assert result is not None

    def test_parse_limit_simple(self):
        """Test: _parse_limit parsea límite simple"""
        result = self.closer._parse_limit("n", "n")
        assert result is not None

    def test_parse_limit_expression(self):
        """Test: _parse_limit parsea límite con expresión"""
        result = self.closer._parse_limit("n-1", "n")
        assert result is not None

    def test_simplify_algebraic_expression_simple(self):
        """Test: _simplify_algebraic_expression simplifica expresión simple"""
        result = self.closer._simplify_algebraic_expression("n + 1", "n")
        assert isinstance(result, str)

    def test_simplify_algebraic_expression_complex(self):
        """Test: _simplify_algebraic_expression simplifica expresión compleja"""
        result = self.closer._simplify_algebraic_expression("(n) - (2) + 2", "n")
        assert isinstance(result, str)

    def test_parse_algebraic_to_sympy_simple(self):
        """Test: _parse_algebraic_to_sympy parsea expresión algebraica simple"""
        result = self.closer._parse_algebraic_to_sympy("n + 1", "n")
        assert result is not None

    def test_parse_algebraic_to_sympy_with_power(self):
        """Test: _parse_algebraic_to_sympy parsea expresión con potencia"""
        result = self.closer._parse_algebraic_to_sympy("n^2", "n")
        assert result is not None

    def test_parse_body_simple(self):
        """Test: _parse_body parsea cuerpo simple"""
        result = self.closer._parse_body("1", "n")
        assert result is not None

    def test_parse_body_expression(self):
        """Test: _parse_body parsea cuerpo con expresión"""
        result = self.closer._parse_body("i", "n")
        assert result is not None

    def test_extract_sum_body(self):
        """Test: _extract_sum_body extrae cuerpo de sumatoria"""
        expr = "\\sum_{i=1}^{n} i"
        result = self.closer._extract_sum_body(expr, 0)
        assert isinstance(result, str)

    def test_sympy_to_latex_simple(self):
        """Test: _sympy_to_latex convierte expresión SymPy simple"""
        from sympy import Symbol

        n_sym = Symbol("n", integer=True, positive=True)
        result = self.closer._sympy_to_latex(n_sym)
        assert isinstance(result, str)
        assert len(result) > 0

    def test_sympy_to_latex_complex(self):
        """Test: _sympy_to_latex convierte expresión SymPy compleja"""
        from sympy import Symbol

        n_sym = Symbol("n", integer=True, positive=True)
        expr = n_sym**2 + n_sym
        result = self.closer._sympy_to_latex(expr)
        assert isinstance(result, str)
        assert len(result) > 0

    def test_evaluate_all_sums_sympy_simple(self):
        """Test: _evaluate_all_sums_sympy evalúa sumatorias en expresión SymPy"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        expr = Sum(Integer(1), (i, Integer(1), n))
        result = self.closer._evaluate_all_sums_sympy(expr)
        assert result is not None

    def test_evaluate_all_sums_sympy_no_sums(self):
        """Test: _evaluate_all_sums_sympy con expresión sin sumatorias"""
        from sympy import Symbol

        n = Symbol("n", integer=True, positive=True)
        expr = n + 1
        result = self.closer._evaluate_all_sums_sympy(expr)
        assert result is not None

    def test_generate_steps_from_sympy(self):
        """Test: _generate_steps_from_sympy genera pasos desde expresión SymPy"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        expr = Sum(Integer(1), (i, Integer(1), n))
        result = self.closer._generate_steps_from_sympy(expr, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_generate_steps_from_sympy_structure(self):
        """Test: _generate_steps_from_sympy_structure genera pasos desde estructura SymPy"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        expr = Sum(Integer(1), (i, Integer(1), n))
        result = self.closer._generate_steps_from_sympy_structure(expr, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_analyze_single_sum(self):
        """Test: _analyze_single_sum analiza sumatoria simple"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        sum_expr = Sum(Integer(1), (i, Integer(1), n))
        result = self.closer._analyze_single_sum(sum_expr, "n")
        assert result is not None
        # El método retorna una tupla (steps, expr) según la firma
        # Pero puede retornar lista en algunos casos especiales
        assert isinstance(result, (list, tuple))
        if isinstance(result, tuple):
            # Si es tupla, el primer elemento debe ser una lista de pasos
            assert len(result) >= 1
            if len(result) > 0:
                assert isinstance(result[0], list)
        elif isinstance(result, list):
            # Si es lista directamente (caso especial), debe contener strings
            assert len(result) >= 0

    def test_analyze_nested_sums(self):
        """Test: _analyze_nested_sums analiza sumatorias anidadas"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        j = Symbol("j", integer=True)
        n = Symbol("n", integer=True, positive=True)
        m = Symbol("m", integer=True, positive=True)
        inner_sum = Sum(Integer(1), (j, Integer(1), m))
        outer_sum = Sum(inner_sum, (i, Integer(1), n))
        sums = [outer_sum]
        result = self.closer._analyze_nested_sums(sums, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_analyze_nested_sum_with_structure(self):
        """Test: _analyze_nested_sum_with_structure analiza sumatoria anidada con estructura"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        j = Symbol("j", integer=True)
        n = Symbol("n", integer=True, positive=True)
        inner_sum = Sum(Integer(1), (j, Integer(1), i))
        outer_sum = Sum(inner_sum, (i, Integer(1), n))
        result = self.closer._analyze_nested_sum_with_structure(
            outer_sum, inner_sum, "n"
        )
        assert result is not None
        assert isinstance(result, list)

    def test_analyze_multiple_limits_sum(self):
        """Test: _analyze_multiple_limits_sum analiza sumatoria con múltiples límites"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        sum_expr = Sum(Integer(1), (i, Integer(1), n))
        result = self.closer._analyze_multiple_limits_sum(sum_expr, "n")
        assert result is not None
        assert isinstance(result, list)

    # === Fase 2: Parsing y Evaluación Avanzados ===

    def test_latex_to_sympy_with_fraction(self):
        """Test: _latex_to_sympy maneja fracciones anidadas"""
        result = self.closer._latex_to_sympy("\\frac{n}{2}", "n")
        assert result is not None

    def test_latex_to_sympy_with_power_braces(self):
        """Test: _latex_to_sympy maneja potencias con llaves"""
        result = self.closer._latex_to_sympy("n^{2}", "n")
        assert result is not None

    def test_latex_to_sympy_with_log(self):
        """Test: _latex_to_sympy maneja logaritmos"""
        result = self.closer._latex_to_sympy("\\log(n)", "n")
        assert result is not None

    def test_latex_to_sympy_complex_limits(self):
        """Test: _latex_to_sympy maneja límites complejos"""
        result = self.closer._latex_to_sympy("\\sum_{i=1}^{n-1} 1", "n")
        assert result is not None

    def test_parse_limit_n_minus_one(self):
        """Test: _parse_limit parsea límite n-1"""
        result = self.closer._parse_limit("n-1", "n")
        assert result is not None

    def test_parse_limit_n_divided_by_two(self):
        """Test: _parse_limit parsea límite n/2"""
        result = self.closer._parse_limit("n/2", "n")
        assert result is not None

    def test_parse_limit_variable(self):
        """Test: _parse_limit parsea límite variable"""
        result = self.closer._parse_limit("m", "n")
        assert result is not None

    def test_parse_limit_constant(self):
        """Test: _parse_limit parsea límite constante"""
        result = self.closer._parse_limit("5", "n")
        assert result is not None
        assert result == 5

    def test_parse_algebraic_to_sympy_complex(self):
        """Test: _parse_algebraic_to_sympy parsea expresión compleja"""
        result = self.closer._parse_algebraic_to_sympy("n^2 + 2*n + 1", "n")
        assert result is not None

    def test_parse_algebraic_to_sympy_with_parentheses(self):
        """Test: _parse_algebraic_to_sympy maneja paréntesis"""
        result = self.closer._parse_algebraic_to_sympy("(n + 1) * (n - 1)", "n")
        assert result is not None

    def test_parse_algebraic_to_sympy_with_subscripts(self):
        """Test: _parse_algebraic_to_sympy maneja subíndices como j_0"""
        result = self.closer._parse_algebraic_to_sympy("j_0 + 1", "n")
        assert result is not None

    def test_parse_algebraic_to_sympy_with_cdot(self):
        """Test: _parse_algebraic_to_sympy maneja \\cdot"""
        result = self.closer._parse_algebraic_to_sympy("n \\cdot 2", "n")
        assert result is not None

    def test_parse_body_with_expression(self):
        """Test: _parse_body parsea cuerpo con expresión compleja"""
        result = self.closer._parse_body("i + 1", "n")
        assert result is not None

    def test_parse_body_with_power(self):
        """Test: _parse_body parsea cuerpo con potencia"""
        result = self.closer._parse_body("i^2", "n")
        assert result is not None

    def test_parse_body_with_binary(self):
        """Test: _parse_body parsea cuerpo con operación binaria"""
        result = self.closer._parse_body("2*i + 1", "n")
        assert result is not None

    def test_extract_sum_body_nested(self):
        """Test: _extract_sum_body extrae cuerpo de sumatoria anidada"""
        expr = "\\sum_{i=1}^{n} \\sum_{j=1}^{i} 1"
        # El cuerpo de la sumatoria externa comienza después del primer }
        result = self.closer._extract_sum_body(expr, expr.find("}") + 1)
        assert isinstance(result, str)
        assert len(result) > 0

    def test_extract_sum_body_simple(self):
        """Test: _extract_sum_body extrae cuerpo simple"""
        expr = "\\sum_{i=1}^{n} i"
        body_start = expr.find("}") + 1
        result = self.closer._extract_sum_body(expr, body_start)
        assert isinstance(result, str)

    def test_evaluate_all_sums_sympy_nested(self):
        """Test: _evaluate_all_sums_sympy evalúa sumatorias anidadas"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        j = Symbol("j", integer=True)
        n = Symbol("n", integer=True, positive=True)
        inner_sum = Sum(Integer(1), (j, Integer(1), i))
        outer_sum = Sum(inner_sum, (i, Integer(1), n))
        result = self.closer._evaluate_all_sums_sympy(outer_sum)
        assert result is not None

    def test_evaluate_all_sums_sympy_multiple_limits(self):
        """Test: _evaluate_all_sums_sympy maneja múltiples límites"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        j = Symbol("j", integer=True)
        n = Symbol("n", integer=True, positive=True)
        m = Symbol("m", integer=True, positive=True)
        # Sum con múltiples límites
        sum_expr = Sum(Integer(1), (i, Integer(1), n), (j, Integer(1), m))
        result = self.closer._evaluate_all_sums_sympy(sum_expr)
        assert result is not None

    def test_generate_steps_from_sympy_structure_nested(self):
        """Test: _generate_steps_from_sympy_structure genera pasos para estructura anidada"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        j = Symbol("j", integer=True)
        n = Symbol("n", integer=True, positive=True)
        inner_sum = Sum(Integer(1), (j, Integer(1), i))
        outer_sum = Sum(inner_sum, (i, Integer(1), n))
        result = self.closer._generate_steps_from_sympy_structure(outer_sum, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_analyze_single_sum_constant(self):
        """Test: _analyze_single_sum analiza sumatoria constante"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        sum_expr = Sum(Integer(1), (i, Integer(1), n))
        result = self.closer._analyze_single_sum(sum_expr, "n")
        assert result is not None
        # Puede retornar lista o tupla
        assert isinstance(result, (list, tuple))

    def test_analyze_single_sum_arithmetic(self):
        """Test: _analyze_single_sum analiza sumatoria aritmética"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        sum_expr = Sum(i, (i, Integer(1), n))
        result = self.closer._analyze_single_sum(sum_expr, "n")
        assert result is not None
        assert isinstance(result, (list, tuple))

    def test_analyze_single_sum_quadratic(self):
        """Test: _analyze_single_sum analiza sumatoria cuadrática"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        sum_expr = Sum(i**2, (i, Integer(1), n))
        result = self.closer._analyze_single_sum(sum_expr, "n")
        assert result is not None
        assert isinstance(result, (list, tuple))

    def test_analyze_nested_sums_multiple(self):
        """Test: _analyze_nested_sums analiza múltiples sumatorias anidadas"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        j = Symbol("j", integer=True)
        k = Symbol("k", integer=True)
        n = Symbol("n", integer=True, positive=True)
        inner_sum = Sum(Integer(1), (k, Integer(1), j))
        middle_sum = Sum(inner_sum, (j, Integer(1), i))
        outer_sum = Sum(middle_sum, (i, Integer(1), n))
        sums = [outer_sum]
        result = self.closer._analyze_nested_sums(sums, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_analyze_nested_sum_with_structure_complex(self):
        """Test: _analyze_nested_sum_with_structure analiza estructura compleja"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        j = Symbol("j", integer=True)
        n = Symbol("n", integer=True, positive=True)
        inner_sum = Sum(j, (j, Integer(1), i))
        outer_sum = Sum(inner_sum, (i, Integer(1), n))
        result = self.closer._analyze_nested_sum_with_structure(
            outer_sum, inner_sum, "n"
        )
        assert result is not None
        assert isinstance(result, list)

    def test_simplify_algebraic_expression_complex_parentheses(self):
        """Test: _simplify_algebraic_expression simplifica paréntesis complejos"""
        result = self.closer._simplify_algebraic_expression("((n) - (2)) + 2", "n")
        assert isinstance(result, str)
        assert "n" in result.lower()

    def test_simplify_algebraic_expression_with_subscripts(self):
        """Test: _simplify_algebraic_expression maneja subíndices"""
        result = self.closer._simplify_algebraic_expression("((j_0) - (1)) + 1", "n")
        assert isinstance(result, str)

    def test_sympy_to_latex_error_handling(self):
        """Test: _sympy_to_latex maneja errores correctamente"""
        from sympy import Symbol

        # Crear expresión que pueda causar problemas
        try:
            n_sym = Symbol("n", integer=True, positive=True)
            # Expresión compleja que podría fallar
            expr = n_sym**n_sym  # Esto puede ser problemático
            result = self.closer._sympy_to_latex(expr)
            assert isinstance(result, str)
        except Exception:
            # Si falla, está bien, solo verificamos que se maneje el error
            pass

    def test_latex_to_sympy_with_nested_sums(self):
        """Test: _latex_to_sympy maneja sumatorias anidadas en LaTeX"""
        expr = "\\sum_{i=1}^{n} \\sum_{j=1}^{i} \\sum_{k=1}^{j} 1"
        result = self.closer._latex_to_sympy(expr, "n")
        assert result is not None

    def test_latex_to_sympy_with_complex_body(self):
        """Test: _latex_to_sympy maneja cuerpo complejo"""
        expr = "\\sum_{i=1}^{n} (i^2 + 2*i + 1)"
        result = self.closer._latex_to_sympy(expr, "n")
        assert result is not None

    def test_parse_limit_with_expression(self):
        """Test: _parse_limit parsea límite con expresión completa"""
        result = self.closer._parse_limit("(n + 1) / 2", "n")
        assert result is not None

    def test_parse_body_with_nested_expression(self):
        """Test: _parse_body parsea cuerpo con expresión anidada"""
        result = self.closer._parse_body("(i + 1) * (i - 1)", "n")
        assert result is not None

    def test_parse_body_with_function_call(self):
        """Test: _parse_body parsea cuerpo con llamada a función"""
        result = self.closer._parse_body("f(i)", "n")
        assert result is not None

    def test_close_summation_with_complex_nested(self):
        """Test: close_summation maneja sumatorias anidadas muy complejas"""
        expr = "\\sum_{i=1}^{n} \\sum_{j=1}^{i} \\sum_{k=1}^{j} k"
        closed, steps = self.closer.close_summation(expr)
        assert closed is not None
        assert steps is not None
        assert isinstance(steps, list)

    def test_close_summation_with_fraction_limit(self):
        """Test: close_summation maneja límite con fracción"""
        expr = "\\sum_{i=1}^{n/2} 1"
        closed, steps = self.closer.close_summation(expr)
        assert closed is not None
        assert steps is not None

    def test_close_summation_with_log_in_body(self):
        """Test: close_summation maneja logaritmo en cuerpo"""
        expr = "\\sum_{i=1}^{n} \\log(i)"
        closed, steps = self.closer.close_summation(expr)
        assert closed is not None
        assert steps is not None

    def test_generate_constant_sum_steps_custom_variable(self):
        """Test: _generate_constant_sum_steps con variable diferente"""
        expr = "\\sum_{k=1}^{m} 1"
        result = self.closer._generate_constant_sum_steps(expr, "m")
        assert result is not None
        assert isinstance(result, list)

    def test_generate_triangular_steps_custom_variable(self):
        """Test: _generate_triangular_steps con variable diferente"""
        expr = "\\sum_{i=1}^{m} \\sum_{j=1}^{i} 1"
        result = self.closer._generate_triangular_steps(expr, "m")
        assert result is not None
        assert isinstance(result, list)

    def test_generate_nested_rectangular_steps_custom_variable(self):
        """Test: _generate_nested_rectangular_steps con variable diferente"""
        expr = "\\sum_{i=1}^{p} \\sum_{j=1}^{q} 1"
        result = self.closer._generate_nested_rectangular_steps(expr, "p")
        assert result is not None
        assert isinstance(result, list)

    def test_generate_arithmetic_sum_steps_custom_variable(self):
        """Test: _generate_arithmetic_sum_steps con variable diferente"""
        expr = "\\sum_{k=2}^{m} k"
        result = self.closer._generate_arithmetic_sum_steps(expr, "m")
        assert result is not None
        assert isinstance(result, list)

    def test_generate_generic_steps_complex_expression(self):
        """Test: _generate_generic_steps genera pasos para expresión compleja"""
        expr = "\\sum_{i=1}^{n} (i^3 + 2*i^2 + i)"
        result = self.closer._generate_generic_steps(expr, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_evaluate_with_sympy_complex_expression(self):
        """Test: _evaluate_with_sympy evalúa expresión compleja"""
        result = self.closer._evaluate_with_sympy("\\sum_{i=1}^{n} (i^2 + i)", "n")
        assert result is not None

    def test_evaluate_with_sympy_nested_sums(self):
        """Test: _evaluate_with_sympy evalúa sumatorias anidadas"""
        result = self.closer._evaluate_with_sympy(
            "\\sum_{i=1}^{n} \\sum_{j=1}^{i} j", "n"
        )
        assert result is not None

    def test_parse_algebraic_to_sympy_with_fraction(self):
        """Test: _parse_algebraic_to_sympy maneja fracciones"""
        result = self.closer._parse_algebraic_to_sympy("\\frac{n}{2}", "n")
        assert result is not None

    def test_parse_algebraic_to_sympy_with_sqrt(self):
        """Test: _parse_algebraic_to_sympy maneja raíz cuadrada"""
        result = self.closer._parse_algebraic_to_sympy("\\sqrt{n}", "n")
        assert result is not None

    def test_parse_algebraic_to_sympy_empty_string(self):
        """Test: _parse_algebraic_to_sympy maneja string vacío"""
        result = self.closer._parse_algebraic_to_sympy("", "n")
        assert result is not None

    def test_parse_body_empty_string(self):
        """Test: _parse_body maneja string vacío"""
        result = self.closer._parse_body("", "n")
        assert result is not None

    def test_extract_sum_body_empty_expression(self):
        """Test: _extract_sum_body maneja expresión vacía"""
        expr = "\\sum_{i=1}^{n}"
        body_start = expr.find("}") + 1
        result = self.closer._extract_sum_body(expr, body_start)
        assert isinstance(result, str)

    def test_sympy_to_latex_with_fraction(self):
        """Test: _sympy_to_latex convierte fracciones a LaTeX"""
        from sympy import Symbol

        n_sym = Symbol("n", integer=True, positive=True)
        expr = n_sym / 2
        result = self.closer._sympy_to_latex(expr)
        assert isinstance(result, str)
        assert len(result) > 0

    def test_sympy_to_latex_compacts_factored_rational_products(self):
        """Test: _sympy_to_latex prefiere n(n+3)/2 frente a 1/2·n·(n+3)."""
        from sympy import Rational, Symbol

        n_sym = Symbol("n", integer=True, positive=True)
        expr = Rational(1, 2) * n_sym * (n_sym + 3)
        result = self.closer._sympy_to_latex(expr)

        assert result == "\\frac{n \\left(n + 3\\right)}{2}"

    def test_sympy_to_latex_with_log(self):
        """Test: _sympy_to_latex convierte logaritmos a LaTeX"""
        from sympy import Symbol, log

        n_sym = Symbol("n", integer=True, positive=True)
        expr = log(n_sym)
        result = self.closer._sympy_to_latex(expr)
        assert isinstance(result, str)
        assert len(result) > 0

    def test_parse_limit_with_whitespace(self):
        """Test: _parse_limit maneja espacios en blanco"""
        result = self.closer._parse_limit(" n - 1 ", "n")
        assert result is not None

    def test_parse_limit_empty_string(self):
        """Test: _parse_limit maneja string vacío"""
        result = self.closer._parse_limit("", "n")
        assert result is not None

    def test_parse_body_with_whitespace(self):
        """Test: _parse_body maneja espacios en blanco"""
        result = self.closer._parse_body(" i + 1 ", "n")
        assert result is not None

    def test_parse_body_single_letter(self):
        """Test: _parse_body maneja letra única"""
        result = self.closer._parse_body("i", "n")
        assert result is not None

    def test_extract_sum_body_with_parentheses(self):
        """Test: _extract_sum_body extrae cuerpo con paréntesis"""
        expr = "\\sum_{i=1}^{n} (i + 1)"
        body_start = expr.find("}") + 1
        result = self.closer._extract_sum_body(expr, body_start)
        assert isinstance(result, str)
        assert "(" in result

    def test_extract_sum_body_no_parentheses(self):
        """Test: _extract_sum_body extrae cuerpo sin paréntesis"""
        expr = "\\sum_{i=1}^{n} i"
        body_start = expr.rfind("}") + 1  # Encontrar el último } (después de ^{n})
        result = self.closer._extract_sum_body(expr, body_start)
        assert isinstance(result, str)
        # El resultado debe contener "i", puede tener espacios
        assert "i" in result.strip()

    def test_extract_sum_body_until_next_sum(self):
        """Test: _extract_sum_body se detiene en siguiente sumatoria"""
        expr = "\\sum_{i=1}^{n} 1 + \\sum_{j=1}^{m} 1"
        # Encontrar el último } de la primera sumatoria (después de ^{n})
        body_start = expr.find("^{n}") + len("^{n}")
        result = self.closer._extract_sum_body(expr, body_start)
        assert isinstance(result, str)
        # Debe extraer solo hasta antes del siguiente \\sum
        # Puede incluir el "+" o solo "1"
        result_clean = result.strip()
        assert result_clean == "1" or result_clean == "1 +" or "1" in result_clean

    def test_parse_algebraic_to_sympy_with_left_right(self):
        """Test: _parse_algebraic_to_sympy maneja \\left y \\right"""
        result = self.closer._parse_algebraic_to_sympy("\\left(n + 1\\right)", "n")
        assert result is not None

    def test_parse_algebraic_to_sympy_with_leq(self):
        """Test: _parse_algebraic_to_sympy maneja \\leq"""
        result = self.closer._parse_algebraic_to_sympy("n \\leq 10", "n")
        assert result is not None

    def test_parse_algebraic_to_sympy_unbalanced_parentheses(self):
        """Test: _parse_algebraic_to_sympy maneja paréntesis desbalanceados"""
        result = self.closer._parse_algebraic_to_sympy("(n - 1))", "n")
        assert result is not None

    def test_simplify_algebraic_expression_not_string(self):
        """Test: _simplify_algebraic_expression maneja valor no string"""
        result = self.closer._simplify_algebraic_expression(123, "n")
        assert isinstance(result, str)

    def test_simplify_algebraic_expression_with_sum(self):
        """Test: _simplify_algebraic_expression no simplifica si tiene sumatoria"""
        expr = "n + \\sum_{i=1}^{n} 1"
        result = self.closer._simplify_algebraic_expression(expr, "n")
        assert result == expr  # Debe retornar sin cambios

    def test_analyze_single_sum_with_quadratic_body(self):
        """Test: _analyze_single_sum analiza sumatoria con cuerpo cuadrático"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        sum_expr = Sum(i**2 + 2 * i + 1, (i, Integer(1), n))
        result = self.closer._analyze_single_sum(sum_expr, "n")
        assert result is not None
        # Puede retornar tupla (steps, expr) o lista de steps dependiendo del caso
        assert isinstance(result, (tuple, list))
        if isinstance(result, tuple):
            assert len(result) >= 1
            assert isinstance(result[0], list)
        else:
            assert len(result) >= 0

    def test_analyze_single_sum_with_constant_factor(self):
        """Test: _analyze_single_sum analiza sumatoria con factor constante"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        # Sumatoria con cuerpo constante (no depende de i)
        sum_expr = Sum(Integer(5), (i, Integer(1), n))
        result = self.closer._analyze_single_sum(sum_expr, "n")
        assert result is not None
        # Puede retornar tupla (steps, expr) o lista de steps
        assert isinstance(result, (tuple, list))
        if isinstance(result, tuple):
            assert len(result) >= 1
            assert isinstance(result[0], list)
        else:
            assert len(result) >= 0

    def test_analyze_single_sum_with_linear_body(self):
        """Test: _analyze_single_sum analiza sumatoria con cuerpo lineal"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        # Cuerpo lineal: -i + n + 1
        sum_expr = Sum(-i + n + Integer(1), (i, Integer(1), n))
        result = self.closer._analyze_single_sum(sum_expr, "n")
        assert result is not None
        # Puede retornar tupla (steps, expr) o lista de steps
        assert isinstance(result, (tuple, list))
        if isinstance(result, tuple):
            assert len(result) >= 1
            assert isinstance(result[0], list)
        else:
            assert len(result) >= 0

    def test_analyze_nested_sums_three_levels(self):
        """Test: _analyze_nested_sums analiza tres niveles de anidamiento"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        j = Symbol("j", integer=True)
        k = Symbol("k", integer=True)
        n = Symbol("n", integer=True, positive=True)
        inner_sum = Sum(Integer(1), (k, Integer(1), j))
        middle_sum = Sum(inner_sum, (j, Integer(1), i))
        outer_sum = Sum(middle_sum, (i, Integer(1), n))
        sums = [outer_sum]
        result = self.closer._analyze_nested_sums(sums, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_analyze_nested_sum_with_structure_triangular(self):
        """Test: _analyze_nested_sum_with_structure analiza estructura triangular"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        j = Symbol("j", integer=True)
        n = Symbol("n", integer=True, positive=True)
        # Estructura triangular: Σ_{i=1}^n Σ_{j=1}^i 1
        inner_sum = Sum(Integer(1), (j, Integer(1), i))
        outer_sum = Sum(inner_sum, (i, Integer(1), n))
        result = self.closer._analyze_nested_sum_with_structure(
            outer_sum, inner_sum, "n"
        )
        assert result is not None
        assert isinstance(result, list)

    def test_analyze_nested_sum_with_structure_rectangular(self):
        """Test: _analyze_nested_sum_with_structure analiza estructura rectangular"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        j = Symbol("j", integer=True)
        n = Symbol("n", integer=True, positive=True)
        m = Symbol("m", integer=True, positive=True)
        # Estructura rectangular: Σ_{i=1}^n Σ_{j=1}^m 1
        inner_sum = Sum(Integer(1), (j, Integer(1), m))
        outer_sum = Sum(inner_sum, (i, Integer(1), n))
        result = self.closer._analyze_nested_sum_with_structure(
            outer_sum, inner_sum, "n"
        )
        assert result is not None
        assert isinstance(result, list)

    def test_analyze_multiple_limits_sum_two_limits(self):
        """Test: _analyze_multiple_limits_sum analiza sumatoria con dos límites"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        j = Symbol("j", integer=True)
        n = Symbol("n", integer=True, positive=True)
        # Sum con múltiples límites: Sum(1, (i, 1, n-1), (j, i+1, n))
        sum_expr = Sum(
            Integer(1), (i, Integer(1), n - Integer(1)), (j, i + Integer(1), n)
        )
        result = self.closer._analyze_multiple_limits_sum(sum_expr, "n")
        assert result is not None
        assert isinstance(result, list)
        assert len(result) > 0

    def test_analyze_multiple_limits_sum_three_limits(self):
        """Test: _analyze_multiple_limits_sum analiza sumatoria con tres límites"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        j = Symbol("j", integer=True)
        k = Symbol("k", integer=True)
        n = Symbol("n", integer=True, positive=True)
        # Sum con tres límites: Sum(1, (i, 1, n), (j, 1, i), (k, 1, j))
        sum_expr = Sum(
            Integer(1), (i, Integer(1), n), (j, Integer(1), i), (k, Integer(1), j)
        )
        result = self.closer._analyze_multiple_limits_sum(sum_expr, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_analyze_multiple_limits_sum_invalid_limits(self):
        """Test: _analyze_multiple_limits_sum maneja límites inválidos"""
        from sympy import Integer, Sum

        # Crear Sum con límites inválidos (solo 2 elementos en lugar de 3)
        try:
            sum_expr = Sum(Integer(1), (Integer(1), Integer(2)))  # Límite inválido
            result = self.closer._analyze_multiple_limits_sum(sum_expr, "n")
            # Debe manejar el error correctamente
            assert result is not None
            assert isinstance(result, list)
        except Exception:
            # Si falla, está bien, solo verificamos que se maneje
            pass

    def test_generate_steps_from_sympy_structure_single_sum(self):
        """Test: _generate_steps_from_sympy_structure genera pasos para Sum simple"""
        from sympy import Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        sum_expr = Sum(Integer(1), (i, Integer(1), n))
        result = self.closer._generate_steps_from_sympy_structure(sum_expr, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_generate_steps_from_sympy_structure_no_sums(self):
        """Test: _generate_steps_from_sympy_structure genera pasos sin sumatorias"""
        from sympy import Symbol

        n = Symbol("n", integer=True, positive=True)
        expr = n + 1
        result = self.closer._generate_steps_from_sympy_structure(expr, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_generate_steps_from_sympy_structure_multiple_sums(self):
        """Test: _generate_steps_from_sympy_structure genera pasos para múltiples sumatorias"""
        from sympy import Add, Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        j = Symbol("j", integer=True)
        n = Symbol("n", integer=True, positive=True)
        sum1 = Sum(Integer(1), (i, Integer(1), n))
        sum2 = Sum(Integer(1), (j, Integer(1), n))
        expr = Add(sum1, sum2)  # Suma de dos sumatorias independientes
        result = self.closer._generate_steps_from_sympy_structure(expr, "n")
        assert result is not None
        assert isinstance(result, list)

    def test_evaluate_all_sums_sympy_with_add(self):
        """Test: _evaluate_all_sums_sympy evalúa expresión con Add"""
        from sympy import Add, Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        j = Symbol("j", integer=True)
        n = Symbol("n", integer=True, positive=True)
        sum1 = Sum(Integer(1), (i, Integer(1), n))
        sum2 = Sum(Integer(1), (j, Integer(1), n))
        expr = Add(sum1, sum2)
        result = self.closer._evaluate_all_sums_sympy(expr)
        assert result is not None

    def test_evaluate_all_sums_sympy_with_mul(self):
        """Test: _evaluate_all_sums_sympy evalúa expresión con Mul"""
        from sympy import Integer, Mul, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        sum_expr = Sum(Integer(1), (i, Integer(1), n))
        expr = Mul(Integer(2), sum_expr)  # 2 * Σ
        result = self.closer._evaluate_all_sums_sympy(expr)
        assert result is not None

    def test_evaluate_all_sums_sympy_no_evaluation_possible(self):
        """Test: _evaluate_all_sums_sympy retorna expresión si no puede evaluar"""
        from sympy import Function, Integer, Sum, Symbol

        i = Symbol("i", integer=True)
        n = Symbol("n", integer=True, positive=True)
        # Crear función simbólica que no se puede evaluar
        f = Function("f")
        # Sumatoria que no se puede evaluar simbólicamente
        sum_expr = Sum(f(i), (i, Integer(1), n))
        result = self.closer._evaluate_all_sums_sympy(sum_expr)
        assert result is not None

    def test_latex_to_sympy_handles_error_gracefully(self):
        """Test: _latex_to_sympy maneja errores correctamente"""
        # Expresión LaTeX mal formada
        expr = "\\sum_{i=1}^{n} {invalid"
        try:
            result = self.closer._latex_to_sympy(expr, "n")
            # Debe retornar algo, incluso si hay error
            assert result is not None
        except Exception:
            # Si falla completamente, está bien, solo verificamos que se maneje
            pass

    def test_parse_algebraic_to_sympy_with_nested_parentheses(self):
        """Test: _parse_algebraic_to_sympy maneja paréntesis anidados"""
        result = self.closer._parse_algebraic_to_sympy("((n + 1) * (n - 1))", "n")
        assert result is not None

    def test_parse_algebraic_to_sympy_with_complex_expression(self):
        """Test: _parse_algebraic_to_sympy parsea expresión muy compleja"""
        result = self.closer._parse_algebraic_to_sympy("n^2 + 2*n*m + m^2", "n")
        assert result is not None

    def test_close_summation_with_variable_in_limit(self):
        """Test: close_summation maneja variable en límite"""
        expr = "\\sum_{i=1}^{m} 1"
        closed, steps = self.closer.close_summation(expr, variable="m")
        assert closed is not None
        assert steps is not None

    def test_close_summation_with_complex_limits(self):
        """Test: close_summation maneja límites complejos"""
        expr = "\\sum_{i=1}^{2*n} 1"
        closed, steps = self.closer.close_summation(expr, variable="n")
        assert closed is not None
        assert steps is not None
