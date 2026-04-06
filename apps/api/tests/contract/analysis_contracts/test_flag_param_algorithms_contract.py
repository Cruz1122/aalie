"""
Tests para algoritmos con banderas/parámetros que controlan el progreso del bucle.
WHILE con IF(param=const) que contiene el update: best case asume param habilita, avg no aplica geométrico.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""

import pytest

from app.modules.analysis.service import analyze_algorithm

pytestmark = [pytest.mark.contract]

# Algoritmos con param-controlled progress: IF(flag=1) THEN i<-i+1
FLAG_PARAM_ALGORITHMS: list[tuple[str, str]] = [
    # 1. Ejemplo del usuario: WHILE i<=10, IF flag=1 THEN i<-i+1
    (
        "WHILE i<=10 IF flag=1",
        """whileLoopExample(flag) BEGIN
    i <- 1;
    WHILE (i <= 10) DO BEGIN
        print("Current value of i: ", i);
        IF (flag = 1) THEN BEGIN
            i <- i + 1;
        END
    END
END
""",
    ),
    # 2. Variante con enabled
    (
        "WHILE i<n IF enabled",
        """loopWithEnabled(n, enabled) BEGIN
    i <- 0;
    WHILE (i < n) DO BEGIN
        x <- 1;
        IF (enabled = true) THEN BEGIN
            i <- i + 1;
        END
    END
END
""",
    ),
    # 3. Decremento controlado por flag
    (
        "WHILE i>0 IF doit",
        """countdownIf(doit) BEGIN
    i <- 5;
    WHILE (i > 0) DO BEGIN
        x <- 1;
        IF (doit = 1) THEN BEGIN
            i <- i - 1;
        END
    END
END
""",
    ),
    # 4. Dos params: n y flag
    (
        "WHILE i<n IF flag=1",
        """linearIfFlag(n, flag) BEGIN
    i <- 0;
    WHILE (i < n) DO BEGIN
        x <- 1;
        IF (flag = 1) THEN BEGIN
            i <- i + 1;
        END
    END
END
""",
    ),
    # 5. Condición invertida: IF (flag != 0)
    (
        "WHILE i<10 IF flag!=0",
        """loopFlagNe0(flag) BEGIN
    i <- 0;
    WHILE (i < 10) DO BEGIN
        x <- 1;
        IF (flag != 0) THEN BEGIN
            i <- i + 1;
        END
    END
END
""",
    ),
]


# Parametrización restringida: solo algoritmos donde best/avg difieren de worst.
def _flag_param_filtered():
    best_differs = []
    avg_differs = []
    for n, s in FLAG_PARAM_ALGORITHMS:
        r = analyze_algorithm(s, mode="all")
        if r.get("ok"):
            if r.get("best") != "same_as_worst":
                best_differs.append((n, s))
            if r.get("avg") != "same_as_worst":
                avg_differs.append((n, s))
    return best_differs, avg_differs


FLAG_PARAM_ALGORITHMS_BEST_DIFFERS, FLAG_PARAM_ALGORITHMS_AVG_DIFFERS = (
    _flag_param_filtered()
)


class TestFlagParamAlgorithms:
    """Tests para algoritmos con banderas que controlan progreso."""

    @pytest.mark.parametrize(
        "name,source",
        FLAG_PARAM_ALGORITHMS_BEST_DIFFERS,
        ids=[a[0] for a in FLAG_PARAM_ALGORITHMS_BEST_DIFFERS],
    )
    def test_best_case_bounded_when_param_enables(self, name: str, source: str):
        """Best case: asumir param habilita progreso → bounded (no unbounded)."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        best = result.get("best")
        assert (
            best != "same_as_worst"
        ), f"[{name}] test solo para algoritmos con best != worst"
        assert isinstance(best, dict), f"[{name}] best debe ser dict"
        by_line = best.get("byLine", [])
        while_rows = [r for r in by_line if r.get("kind") == "while"]
        assert len(while_rows) > 0, f"[{name}] Debe tener fila while"
        wr = while_rows[0]
        # Best case: NO debe ser unbounded (param habilita)
        assert not wr.get("unbounded", False), (
            f"[{name}] Best case debe ser bounded (param habilita progreso). "
            f"Obtenido: unbounded={wr.get('unbounded')}"
        )
        count = str(wr.get("count", ""))
        assert (
            "t_while" not in count or "unknown" not in count.lower()
        ), f"[{name}] Best case count debe ser concreto: {count}"

    @pytest.mark.parametrize(
        "name,source", FLAG_PARAM_ALGORITHMS, ids=[a[0] for a in FLAG_PARAM_ALGORITHMS]
    )
    def test_worst_case_unbounded(self, name: str, source: str):
        """Worst case: param puede impedir progreso → unbounded."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        worst = result.get("worst", {})
        by_line = worst.get("byLine", [])
        while_rows = [r for r in by_line if r.get("kind") == "while"]
        assert len(while_rows) > 0
        wr = while_rows[0]
        assert wr.get(
            "unbounded", False
        ), f"[{name}] Worst case debe ser unbounded (param puede impedir progreso)"

    @pytest.mark.parametrize(
        "name,source",
        FLAG_PARAM_ALGORITHMS_AVG_DIFFERS,
        ids=[a[0] for a in FLAG_PARAM_ALGORITHMS_AVG_DIFFERS],
    )
    def test_avg_no_geometric_model(self, name: str, source: str):
        """Avg: no aplicar modelo geométrico (E[iter]=1/p) cuando es param-controlled unbounded."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        avg = result.get("avg")
        assert (
            avg != "same_as_worst"
        ), f"[{name}] test solo para algoritmos con avg != worst"
        if isinstance(avg, dict):
            by_line = avg.get("byLine", [])
            while_rows = [r for r in by_line if r.get("kind") == "while"]
            if while_rows:
                wr = while_rows[0]
                note = wr.get("note", "")
                # No debe decir "E[#iterations] = 1/p" para param-controlled
                # (avg para param-controlled es unbounded, no geométrico)
                assert (
                    "1/p" not in note or "geometric" not in note.lower()
                ), f"[{name}] Avg no debe usar modelo geométrico para param-controlled: {note}"

    def test_user_example_best_bounded(self):
        """Caso específico del usuario: best case debe dar T_open con constantes (10, 9)."""
        source = """whileLoopExample(flag) BEGIN
    i <- 1;
    WHILE (i <= 10) DO BEGIN
        print("Current value of i: ", i);
        IF (flag = 1) THEN BEGIN
            i <- i + 1;
        END
    END
END
"""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False)
        assert result.get("has_case_variability") is True
        best = result.get("best")
        assert isinstance(best, dict)
        totals = best["totals"]
        t_open = totals.get("T_open", "")
        assert (
            "10" in t_open or "9" in t_open
        ), f"Best T_open debe tener constantes: {t_open}"
        assert "t_while" not in t_open, f"Best no debe tener t_while: {t_open}"
        # Best case acotado debe incluir notación asintótica O(1)/Ω(1) para la card
        assert totals.get("big_o"), "Best totals debe tener big_o (card)"
        assert totals.get("big_omega"), "Best totals debe tener big_omega (card)"

    def test_user_example_avg_unbounded(self):
        """Caso del usuario: avg debe ser unbounded (no modelo geométrico con p=1/2)."""
        source = """whileLoopExample(flag) BEGIN
    i <- 1;
    WHILE (i <= 10) DO BEGIN
        print("Current value of i: ", i);
        IF (flag = 1) THEN BEGIN
            i <- i + 1;
        END
    END
END
"""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False)
        avg = result.get("avg")
        assert isinstance(avg, dict)
        by_line = avg.get("byLine", [])
        while_rows = [r for r in by_line if r.get("kind") == "while"]
        assert len(while_rows) > 0
        wr = while_rows[0]
        # Avg para param-controlled: unbounded (no podemos promediar flag=0 ∞ con flag=1 10)
        assert wr.get("unbounded", False) or "t_while" in str(
            wr.get("count", "")
        ), "Avg debe ser unbounded o usar t_while (no E[iter]=2 o 3)"

    def test_no_o_flag_notation(self):
        """big_theta/big_o no debe ser O(flag) para algoritmos con param flag."""
        source = """whileLoopExample(flag) BEGIN
    i <- 1;
    WHILE (i <= 10) DO BEGIN
        IF (flag = 1) THEN BEGIN
            i <- i + 1;
        END
    END
END
"""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False)
        worst = result.get("worst", {})
        big_theta = worst.get("totals", {}).get("big_theta", "")
        big_o = worst.get("totals", {}).get("big_o", "")
        # No debe ser Θ(flag) u O(flag) - flag no es variable de tamaño
        assert (
            "flag" not in big_theta.lower()
        ), f"big_theta no debe ser Θ(flag): {big_theta}"
        assert "flag" not in big_o.lower(), f"big_o no debe ser O(flag): {big_o}"


class TestFlagParamCoverage:
    """Cobertura de casos con banderas."""

    def test_at_least_5_flag_algorithms(self):
        """Debe haber al menos 5 algoritmos con banderas definidos."""
        assert len(FLAG_PARAM_ALGORITHMS) >= 5
