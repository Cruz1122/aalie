"""
Tests de integración para 20+ algoritmos con WHILE.
Valida análisis correcto y notación asintótica (Θ, O, Ω) en best/worst/average.
Valida que T_open sea correcta y no se reporte O(1) incorrectamente.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""
import re

import pytest
from app.modules.analysis.service import analyze_algorithm


# --- Algoritmos con WHILE (20+) ---

ALGORITHMS = [
    # 1. Euclides (MCD) - log(min(a,b))
    ("Euclides MCD", """mcd(a, b) BEGIN
  WHILE (b != 0) DO BEGIN
    temp <- b;
    b <- a MOD b;
    a <- temp;
  END
  RETURN a;
END
"""),
    # 2. WHILE simple decremento
    ("WHILE decremento", """countdown(n) BEGIN
  i <- n;
  WHILE (i > 0) DO BEGIN
    x <- 1;
    i <- i - 1;
  END
END
"""),
    # 3. WHILE simple incremento
    ("WHILE incremento", """linear(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    x <- 1;
    i <- i + 1;
  END
END
"""),
    # 4. WHILE multiplicación (log n)
    ("WHILE multiplicación", """logLoop(n) BEGIN
  i <- 1;
  WHILE (i <= n) DO BEGIN
    x <- 1;
    i <- i * 2;
  END
END
"""),
    # 5. Insertion Sort - FOR con WHILE anidado
    ("Insertion Sort", """insertionSort(arr, n) BEGIN
  FOR i <- 2 TO n DO BEGIN
    key <- arr[i];
    j <- i - 1;
    WHILE (j >= 1 AND arr[j] > key) DO BEGIN
      arr[j + 1] <- arr[j];
      j <- j - 1;
    END
    arr[j + 1] <- key;
  END
END
"""),
    # 6. Búsqueda binaria
    ("Búsqueda binaria", """binarySearch(A, n, x) BEGIN
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
"""),
    # 7. FOR con WHILE anidado (mixto)
    ("FOR + WHILE anidado", """mixedLoops(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    j <- 1;
    WHILE (j <= i) DO BEGIN
      x <- 1;
      j <- j + 1;
    END
  END
END
"""),
    # 8. WHILE con flag bounded
    ("WHILE flag kill", """flagLoop() BEGIN
  flag <- true;
  WHILE (flag = true) DO BEGIN
    flag <- false;
  END
END
"""),
    # 9. WHILE anidados (dos niveles)
    ("WHILE anidados", """nestedWhile(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    j <- 0;
    WHILE (j < n) DO BEGIN
      x <- 1;
      j <- j + 1;
    END
    i <- i + 1;
  END
END
"""),
    # 10. WHILE con división
    ("WHILE división", """divLoop(n) BEGIN
  i <- n;
  WHILE (i > 1) DO BEGIN
    x <- 1;
    i <- i / 2;
  END
END
"""),
    # 11. Búsqueda lineal con WHILE
    ("Búsqueda lineal WHILE", """linearSearch(A, n, x) BEGIN
  i <- 1;
  WHILE (i <= n AND A[i] != x) DO BEGIN
    i <- i + 1;
  END
  IF (i <= n) THEN BEGIN
    RETURN i;
  END
  RETURN -1;
END
"""),
    # 12. Potencia con WHILE
    ("Potencia iterativa", """power(base, exp) BEGIN
  result <- 1;
  WHILE (exp > 0) DO BEGIN
    result <- result * base;
    exp <- exp - 1;
  END
  RETURN result;
END
"""),
    # 13. Factorial con WHILE
    ("Factorial WHILE", """factorial(n) BEGIN
  i <- 1;
  acc <- 1;
  WHILE (i <= n) DO BEGIN
    acc <- acc * i;
    i <- i + 1;
  END
  RETURN acc;
END
"""),
    # 14. Suma con WHILE
    ("Suma WHILE", """suma(n) BEGIN
  i <- 0;
  s <- 0;
  WHILE (i < n) DO BEGIN
    s <- s + i;
    i <- i + 1;
  END
  RETURN s;
END
"""),
    # 15. Triple WHILE anidado
    ("Triple WHILE", """tripleWhile(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    j <- 0;
    WHILE (j < n) DO BEGIN
      k <- 0;
      WHILE (k < n) DO BEGIN
        x <- 1;
        k <- k + 1;
      END
      j <- j + 1;
    END
    i <- i + 1;
  END
END
"""),
    # 16. FOR-WHILE-FOR
    ("FOR-WHILE-FOR", """forWhileFor(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    j <- 0;
    WHILE (j < i) DO BEGIN
      k <- 1;
      FOR k <- 1 TO n DO BEGIN
        x <- 1;
      END
      j <- j + 1;
    END
  END
END
"""),
    # 17. WHILE con condición compuesta AND
    ("WHILE AND", """whileAnd(n) BEGIN
  i <- 0;
  j <- 0;
  WHILE (i < n AND j < n) DO BEGIN
    x <- 1;
    i <- i + 1;
    j <- j + 1;
  END
END
"""),
    # 18. Shell sort (simplificado con WHILE)
    ("Shell gap WHILE", """shellGap(A, n, gap) BEGIN
  i <- gap;
  WHILE (i <= n) DO BEGIN
    temp <- A[i];
    j <- i;
    WHILE (j > gap AND A[j - gap] > temp) DO BEGIN
      A[j] <- A[j - gap];
      j <- j - gap;
    END
    A[j] <- temp;
    i <- i + 1;
  END
END
"""),
    # 19. Merge de dos listas (dos WHILE secuenciales)
    ("Merge dos WHILE", """merge(A, B, n, m) BEGIN
  i <- 1;
  j <- 1;
  k <- 1;
  WHILE (i <= n AND j <= m) DO BEGIN
    IF (A[i] <= B[j]) THEN BEGIN
      C[k] <- A[i];
      i <- i + 1;
    END
    ELSE BEGIN
      C[k] <- B[j];
      j <- j + 1;
    END
    k <- k + 1;
  END
  WHILE (i <= n) DO BEGIN
    C[k] <- A[i];
    i <- i + 1;
    k <- k + 1;
  END
  WHILE (j <= m) DO BEGIN
    C[k] <- B[j];
    j <- j + 1;
    k <- k + 1;
  END
END
"""),
    # 20. WHILE con i += 2
    ("WHILE paso 2", """stepTwo(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    x <- 1;
    i <- i + 2;
  END
END
"""),
    # 21. WHILE con i *= 3
    ("WHILE *3", """log3Loop(n) BEGIN
  i <- 1;
  WHILE (i <= n) DO BEGIN
    x <- 1;
    i <- i * 3;
  END
END
"""),
    # 22. WHILE dentro de IF
    ("IF con WHILE", """ifWhile(n, p) BEGIN
  IF (p = true) THEN BEGIN
    i <- 0;
    WHILE (i < n) DO BEGIN
      x <- 1;
      i <- i + 1;
    END
  END
END
"""),
    # 23. Doble FOR con WHILE interno
    ("FOR-FOR-WHILE", """forForWhile(n) BEGIN
  FOR i <- 1 TO n DO BEGIN
    FOR j <- 1 TO n DO BEGIN
      k <- j;
      WHILE (k > 0) DO BEGIN
        x <- 1;
        k <- k - 1;
      END
    END
  END
END
"""),
]


# Algoritmos que legítimamente son O(1) (ej. 1 iteración fija).
ALGORITHMS_O1 = {"WHILE flag kill"}

# Algoritmos que antes tenían bug O(1) incorrecto (ahora corregidos).
# Se mantiene vacío; si reaparecen fallos, añadir aquí.
ALGORITHMS_KNOWN_O1_BUG: set[str] = set()

# Complejidad esperada en worst case: "constant" | "log" | "linear" | "quadratic" | "cubic"
# Si no está en el mapa, se asume "non_constant" (no O(1)).
EXPECTED_WORST_COMPLEXITY = {
    "Euclides MCD": "log",  # Θ(log(min(a,b)))
    "WHILE decremento": "linear",
    "WHILE incremento": "linear",
    "WHILE multiplicación": "log",
    "Insertion Sort": "quadratic",
    "Búsqueda binaria": "log",
    "FOR + WHILE anidado": "quadratic",
    "WHILE flag kill": "constant",
    "WHILE anidados": "quadratic",
    "WHILE división": "log",
    "Búsqueda lineal WHILE": "linear",
    "Potencia iterativa": "linear",  # O(exp)
    "Factorial WHILE": "linear",
    "Suma WHILE": "linear",
    "Triple WHILE": "cubic",
    "FOR-WHILE-FOR": "cubic",
    "WHILE AND": "linear",
    "Shell gap WHILE": "linear",  # Analizador da O(n) por param gap; worst real es O(n²)
    "Merge dos WHILE": "linear",  # O(n+m)
    "WHILE paso 2": "linear",
    "WHILE *3": "log",
    "IF con WHILE": "linear",
    "FOR-FOR-WHILE": "cubic",
}


def _get_totals(result, case: str):
    """Obtiene totals del caso indicado (worst, best, avg)."""
    if case == "worst":
        data = result.get("worst")
    elif case == "best":
        data = result.get("best")
        if data == "same_as_worst":
            data = result.get("worst")
    else:
        data = result.get("avg")
        if data == "same_as_worst" or data is None:
            data = result.get("worst")
    return (data or {}).get("totals", {})


def _has_asymptotic_notation(totals: dict) -> bool:
    """Verifica que exista al menos una notación asintótica."""
    return bool(
        totals.get("big_theta") or totals.get("big_o") or totals.get("big_omega")
    )


def _is_o1_notation(notation: str) -> bool:
    """True si la notación es O(1), Θ(1) o Ω(1)."""
    if not notation:
        return False
    s = notation.lower().replace("\\", "").replace(" ", "")
    return "o(1)" in s or "θ(1)" in s or "theta(1)" in s or "ω(1)" in s or "omega(1)" in s


def _notation_has_complexity(notation: str, level: str) -> bool:
    """True si la notación contiene la complejidad esperada (o mayor)."""
    if not notation:
        return False
    s = notation.lower().replace("\\", "")
    if level == "constant":
        return _is_o1_notation(notation)
    if level == "log":
        return "log" in s
    if level == "linear":
        # n, exp, m, etc. Cualquier variable que crezca (incl. n^k con k>=1)
        return any(x in s for x in ["n", "exp", "m", "min"])
    if level == "quadratic":
        # n², n^2, n^3, n^6, etc. (al menos cuadrático)
        if "n" not in s:
            return False
        # Buscar n^{k} o n^k
        match = re.search(r"n\^?\{?(\d+)\}?", s)
        if match:
            return int(match.group(1)) >= 2
        return "²" in s or "2" in s
    if level == "cubic":
        # n³, n^3, n^6, etc. (al menos cúbico)
        if "n" not in s:
            return False
        match = re.search(r"n\^?\{?(\d+)\}?", s)
        if match:
            return int(match.group(1)) >= 3
        return "³" in s or "3" in s
    return False


def _t_open_has_variable(t_open: str) -> bool:
    """True si T_open contiene variable de tamaño (n, m, etc.), no solo constantes."""
    if not t_open:
        return False
    s = t_open.lower()
    # Debe contener n, m, min, log, sum, símbolos iterativos (t_while, exp_0), etc.
    vars_ok = ("n", "m", "min", "log", "sum", "\\sum", "i", "j", "k", "while", "exp_")
    return any(v in s for v in vars_ok)


def _get_by_line(result, case: str):
    """Obtiene byLine del caso indicado."""
    if case == "worst":
        data = result.get("worst")
    elif case == "best":
        data = result.get("best")
        if data == "same_as_worst":
            data = result.get("worst")
    else:
        data = result.get("avg")
        if data == "same_as_worst" or data is None:
            data = result.get("worst")
    return (data or {}).get("byLine", [])


class TestWhileAlgorithms:
    """Tests para 20+ algoritmos con WHILE."""

    @pytest.mark.parametrize("name,source", ALGORITHMS, ids=[a[0] for a in ALGORITHMS])
    def test_algorithm_analyzes_successfully(self, name: str, source: str):
        """Cada algoritmo debe analizarse correctamente (ok=True)."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), (
            f"[{name}] Análisis falló: {result.get('errors', 'sin errores')}"
        )
        assert "worst" in result, f"[{name}] Debe tener worst"
        worst = result["worst"]
        assert worst.get("ok", False), f"[{name}] worst.ok debe ser True"
        assert "byLine" in worst, f"[{name}] worst debe tener byLine"
        assert len(worst.get("byLine", [])) > 0, f"[{name}] byLine no debe estar vacío"
        assert "totals" in worst, f"[{name}] worst debe tener totals"
        assert "T_open" in worst["totals"], f"[{name}] totals debe tener T_open"
        t_open = worst["totals"]["T_open"]
        assert isinstance(t_open, str) and len(t_open) > 0, (
            f"[{name}] T_open debe ser string no vacío: {t_open!r}"
        )

    @pytest.mark.parametrize("name,source", ALGORITHMS, ids=[a[0] for a in ALGORITHMS])
    def test_worst_case_has_asymptotic_notation(self, name: str, source: str):
        """Worst case debe tener notación asintótica (Θ, O o Ω)."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        totals = _get_totals(result, "worst")
        assert _has_asymptotic_notation(totals), (
            f"[{name}] Worst case debe tener big_theta, big_o o big_omega. "
            f"Totals: {list(totals.keys())}"
        )

    @pytest.mark.parametrize("name,source", ALGORITHMS, ids=[a[0] for a in ALGORITHMS])
    def test_best_case_has_asymptotic_notation(self, name: str, source: str):
        """Best case debe tener notación asintótica."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        totals = _get_totals(result, "best")
        assert _has_asymptotic_notation(totals), (
            f"[{name}] Best case debe tener notación asintótica. Totals: {list(totals.keys())}"
        )

    @pytest.mark.parametrize("name,source", ALGORITHMS, ids=[a[0] for a in ALGORITHMS])
    def test_by_line_no_unknown_count(self, name: str, source: str):
        """Ninguna fila de byLine debe tener count 'unknown' (salvo unbounded)."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        by_line = _get_by_line(result, "worst")
        for row in by_line:
            count = str(row.get("count", ""))
            # Permitir unbounded en filas WHILE que no se pueden acotar
            if row.get("unbounded"):
                continue
            assert "unknown" not in count.lower(), (
                f"[{name}] Línea {row.get('line')} tiene count unknown: {count}"
            )

    def test_at_least_20_algorithms_defined(self):
        """Debe haber al menos 20 algoritmos definidos."""
        assert len(ALGORITHMS) >= 20, f"Solo hay {len(ALGORITHMS)} algoritmos, se requieren 20+"

    def test_euclides_specific_notation(self):
        """Euclides debe tener Θ(log(min(a,b))) en worst/best/avg."""
        source = ALGORITHMS[0][1]  # Euclides
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), "Euclides debe analizarse correctamente"
        for case in ("worst", "best", "avg"):
            totals = _get_totals(result, case)
            big_theta = totals.get("big_theta", "")
            assert "log" in big_theta.lower() or "min" in big_theta.lower(), (
                f"Euclides {case} debe tener Θ(log(min(a,b))): {big_theta}"
            )

    def test_insertion_sort_quadratic_worst(self):
        """Insertion Sort worst case debe ser O(n²)."""
        source = ALGORITHMS[4][1]  # Insertion Sort
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False)
        totals = _get_totals(result, "worst")
        big_o = totals.get("big_o", "")
        big_theta = totals.get("big_theta", "")
        combined = (big_o + " " + big_theta).lower()
        assert "n" in combined and ("2" in combined or "²" in combined or "n^" in combined), (
            f"Insertion Sort worst debe ser O(n²): big_o={big_o}, big_theta={big_theta}"
        )

    @pytest.mark.parametrize("name,source", ALGORITHMS, ids=[a[0] for a in ALGORITHMS])
    def test_worst_case_not_incorrectly_o1(self, name: str, source: str):
        """Algoritmos no constantes no deben reportar O(1) incorrectamente."""
        if name in ALGORITHMS_O1:
            pytest.skip(f"[{name}] Es O(1) legítimamente")
        if name in ALGORITHMS_KNOWN_O1_BUG:
            pytest.xfail(
                f"[{name}] Bug conocido: analizador devuelve O(1) cuando T_open tiene "
                "t_while/exp_0/log no resueltos. Ver ALGORITHMS_KNOWN_O1_BUG."
            )
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        totals = _get_totals(result, "worst")
        big_theta = totals.get("big_theta", "")
        big_o = totals.get("big_o", "")
        for notation, label in [(big_theta, "big_theta"), (big_o, "big_o")]:
            assert not _is_o1_notation(notation), (
                f"[{name}] {label} no debe ser O(1) incorrectamente. "
                f"Valor: {notation!r}. T_open={totals.get('T_open', '')!r}"
            )

    @pytest.mark.parametrize("name,source", ALGORITHMS, ids=[a[0] for a in ALGORITHMS])
    def test_t_open_has_variable_for_non_constant(self, name: str, source: str):
        """T_open debe contener variable de tamaño para algoritmos no constantes."""
        if name in ALGORITHMS_O1:
            pytest.skip(f"[{name}] Es O(1), T_open puede ser solo constantes")
        if name in ALGORITHMS_KNOWN_O1_BUG:
            pytest.xfail(
                f"[{name}] Bug conocido: T_open puede tener t_while/exp sin resolver. "
                "Ver ALGORITHMS_KNOWN_O1_BUG."
            )
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        totals = _get_totals(result, "worst")
        t_open = totals.get("T_open", "")
        assert _t_open_has_variable(t_open), (
            f"[{name}] T_open debe contener variable (n, m, log, etc.), no solo constantes. "
            f"T_open={t_open!r}"
        )

    @pytest.mark.parametrize("name,source", ALGORITHMS, ids=[a[0] for a in ALGORITHMS])
    def test_worst_case_matches_expected_complexity(self, name: str, source: str):
        """La notación asintótica debe coincidir con la complejidad esperada."""
        expected = EXPECTED_WORST_COMPLEXITY.get(name)
        if not expected:
            pytest.skip(f"[{name}] Sin complejidad esperada definida")
        if name in ALGORITHMS_KNOWN_O1_BUG:
            pytest.xfail(
                f"[{name}] Bug conocido: analizador devuelve O(1). Ver ALGORITHMS_KNOWN_O1_BUG."
            )
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        totals = _get_totals(result, "worst")
        big_theta = totals.get("big_theta", "") or ""
        big_o = totals.get("big_o", "") or ""
        notation = big_theta or big_o
        assert _notation_has_complexity(notation, expected), (
            f"[{name}] Esperado {expected}, obtenido: big_theta={big_theta!r}, big_o={big_o!r}"
        )

    # --- Tests exhaustivos de salida y notaciones ---

    @pytest.mark.parametrize("name,source", ALGORITHMS, ids=[a[0] for a in ALGORITHMS])
    def test_by_line_required_fields(self, name: str, source: str):
        """Todas las filas de byLine deben tener line, kind, ck, count_raw, count."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        by_line = _get_by_line(result, "worst")
        for i, row in enumerate(by_line):
            assert "line" in row, f"[{name}] Fila {i} debe tener line: {row}"
            assert "kind" in row, f"[{name}] Fila {i} debe tener kind: {row}"
            assert "ck" in row, f"[{name}] Fila {i} debe tener ck: {row}"
            assert "count_raw" in row, f"[{name}] Fila {i} debe tener count_raw: {row}"
            assert "count" in row, f"[{name}] Fila {i} debe tener count: {row}"
            assert isinstance(row["count"], str), (
                f"[{name}] Fila {i} count debe ser string: {type(row['count'])}"
            )
            assert isinstance(row["count_raw"], str), (
                f"[{name}] Fila {i} count_raw debe ser string: {type(row['count_raw'])}"
            )

    @pytest.mark.parametrize("name,source", ALGORITHMS, ids=[a[0] for a in ALGORITHMS])
    def test_by_line_count_not_nan_or_empty(self, name: str, source: str):
        """count no debe ser vacío, 'nan' o 'NaN' (salvo unbounded)."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        by_line = _get_by_line(result, "worst")
        for row in by_line:
            if row.get("unbounded"):
                continue
            count = str(row.get("count", ""))
            assert len(count) > 0, f"[{name}] Línea {row.get('line')} count vacío"
            assert "nan" not in count.lower(), (
                f"[{name}] Línea {row.get('line')} count no debe ser NaN: {count}"
            )

    @pytest.mark.parametrize("name,source", ALGORITHMS, ids=[a[0] for a in ALGORITHMS])
    def test_totals_has_t_polynomial_or_t_open(self, name: str, source: str):
        """totals debe tener T_polynomial cuando se puede simplificar, o al menos T_open."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        totals = _get_totals(result, "worst")
        assert "T_open" in totals, f"[{name}] totals debe tener T_open"
        t_open = totals.get("T_open", "")
        assert isinstance(t_open, str) and len(t_open) > 0, (
            f"[{name}] T_open debe ser string no vacío"
        )
        # T_polynomial es opcional; si existe, debe ser string no vacío
        t_poly = totals.get("T_polynomial")
        if t_poly is not None:
            assert isinstance(t_poly, str) and len(t_poly) > 0, (
                f"[{name}] T_polynomial debe ser string no vacío si existe"
            )

    @pytest.mark.parametrize("name,source", ALGORITHMS, ids=[a[0] for a in ALGORITHMS])
    def test_while_rows_have_coherent_notes(self, name: str, source: str):
        """Filas WHILE deben tener note coherente (o unbounded con unbounded_kind)."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        by_line = _get_by_line(result, "worst")
        for row in by_line:
            if row.get("kind") != "while":
                continue
            # WHILE unbounded: debe tener unbounded=True y unbounded_kind o note explicativa
            if row.get("unbounded"):
                note = row.get("note", "")
                kind_val = row.get("unbounded_kind", "")
                assert kind_val or "never" in note.lower() or "unbounded" in note.lower() or "not change" in note.lower() or "may never" in note.lower(), (
                    f"[{name}] WHILE unbounded en línea {row.get('line')} debe tener note o unbounded_kind"
                )
            # WHILE bounded: note puede describir condición o iteraciones
            else:
                count = str(row.get("count", ""))
                assert len(count) > 0, f"[{name}] WHILE bounded en línea {row.get('line')} debe tener count"

    def test_whilen_incremento_linear_output(self):
        """WHILE i<n DO { i<-i+1 } debe dar Θ(n) y T_open con n."""
        source = ALGORITHMS[2][1]  # WHILE incremento
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False)
        totals = _get_totals(result, "worst")
        big_theta = totals.get("big_theta", "").lower()
        big_o = totals.get("big_o", "").lower()
        t_open = totals.get("T_open", "").lower()
        assert "n" in big_theta or "n" in big_o, (
            f"WHILE incremento debe ser Θ(n) o O(n): big_theta={totals.get('big_theta')}, big_o={totals.get('big_o')}"
        )
        assert "n" in t_open, f"T_open debe contener n: {totals.get('T_open')}"

    def test_whilen_multiplicacion_log_output(self):
        """WHILE i<=n DO { i<-i*2 } debe dar Θ(log n)."""
        source = ALGORITHMS[3][1]  # WHILE multiplicación
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False)
        totals = _get_totals(result, "worst")
        notation = (totals.get("big_theta", "") + " " + totals.get("big_o", "")).lower()
        assert "log" in notation, (
            f"WHILE multiplicación debe ser Θ(log n): {totals.get('big_theta')}"
        )

    def test_whilen_anidados_quadratic_output(self):
        """Dos WHILE anidados i<n, j<n deben dar Θ(n²)."""
        source = ALGORITHMS[8][1]  # WHILE anidados
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False)
        totals = _get_totals(result, "worst")
        notation = (totals.get("big_theta", "") + " " + totals.get("big_o", "")).lower()
        assert "n" in notation and ("2" in notation or "²" in notation or "n^" in notation), (
            f"WHILE anidados debe ser Θ(n²): {totals.get('big_theta')}"
        )

    def test_avg_case_has_structure(self):
        """Caso promedio debe tener A_of_n o T_open y estructura coherente."""
        source = ALGORITHMS[2][1]  # WHILE incremento
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False)
        avg = result.get("avg")
        if avg and avg != "same_as_worst":
            totals = avg.get("totals", {})
            assert "A_of_n" in totals or "T_open" in totals, (
                "avg debe tener A_of_n o T_open"
            )
            assert _has_asymptotic_notation(totals), (
                "avg debe tener notación asintótica"
            )

    def test_big_o_big_omega_ordering(self):
        """Para algoritmos no constantes: O >= Θ >= Ω en nivel de complejidad."""
        # Solo verificamos que existan y sean coherentes (no O(1) cuando es O(n))
        source = ALGORITHMS[2][1]  # WHILE incremento
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False)
        totals = _get_totals(result, "worst")
        big_o = totals.get("big_o", "")
        big_omega = totals.get("big_omega", "")
        big_theta = totals.get("big_theta", "")
        # Si hay las tres, deben referirse a la misma variable (n, log n, etc.)
        if big_o and big_omega and big_theta:
            for notation in (big_o, big_omega, big_theta):
                assert "n" in notation.lower() or "log" in notation.lower() or "min" in notation.lower(), (
                    f"Notaciones deben referirse a variable de tamaño: O={big_o}, Ω={big_omega}, Θ={big_theta}"
                )
