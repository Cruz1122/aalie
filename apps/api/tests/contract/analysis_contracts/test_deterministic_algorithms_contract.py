"""
Tests para algoritmos determinísticos (sin variabilidad).
Cuando worst == best, el caso promedio debe ser same_as_worst (no modelo probabilístico).
Cobertura: WHILE/FOR con cotas constantes, sin IF con early return.

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""

import pytest

from app.modules.analysis.service import analyze_algorithm

pytestmark = [pytest.mark.contract]

# Algoritmos determinísticos: worst == best, avg debe ser same_as_worst
DETERMINISTIC_ALGORITHMS = [
    # 1. WHILE con cota constante (ejemplo del usuario)
    (
        "WHILE i<=10 constante",
        """whileLoopExample() BEGIN
    i <- 1;
    WHILE (i <= 10) DO BEGIN
        print("Current value of i: ", i);
        i <- i + 1;
    END
END
""",
    ),
    # 2. FOR con cota constante
    (
        "FOR 1 TO 5 constante",
        """fixedLoop() BEGIN
    FOR i <- 1 TO 5 DO BEGIN
        x <- x + 1;
    END
END
""",
    ),
    # 3. WHILE simple con constante
    (
        "WHILE i<10 constante",
        """countToTen() BEGIN
    i <- 0;
    WHILE (i < 10) DO BEGIN
        i <- i + 1;
    END
END
""",
    ),
    # 4. WHILE flag kill (1 iteración) - O(1)
    (
        "WHILE flag kill",
        """flagLoop() BEGIN
    flag <- true;
    WHILE (flag = true) DO BEGIN
        flag <- false;
    END
END
""",
    ),
    # 5. FOR anidados con constantes
    (
        "FOR-FOR constantes",
        """nestedFixed() BEGIN
    FOR i <- 1 TO 3 DO BEGIN
        FOR j <- 1 TO 4 DO BEGIN
            x <- 1;
        END
    END
END
""",
    ),
    # 6. Factorial con FOR constante
    (
        "Factorial constante 5",
        """factorial5() BEGIN
    acc <- 1;
    FOR i <- 1 TO 5 DO BEGIN
        acc <- acc * i;
    END
    RETURN acc;
END
""",
    ),
    # 7. WHILE con i*2 hasta constante
    (
        "WHILE i*2 hasta 16",
        """logFixed() BEGIN
    i <- 1;
    WHILE (i <= 16) DO BEGIN
        x <- 1;
        i <- i * 2;
    END
END
""",
    ),
    # 8. Solo asignaciones
    (
        "Solo asignaciones",
        """noLoops() BEGIN
    a <- 1;
    b <- 2;
    c <- a + b;
END
""",
    ),
    # 9. WHILE con decremento a 0
    (
        "WHILE decremento constante",
        """countdown5() BEGIN
    i <- 5;
    WHILE (i > 0) DO BEGIN
        i <- i - 1;
    END
END
""",
    ),
    # 10. WHILE anidados constantes
    (
        "WHILE anidados constantes",
        """nestedWhileFixed() BEGIN
    i <- 0;
    WHILE (i < 3) DO BEGIN
        j <- 0;
        WHILE (j < 4) DO BEGIN
            x <- 1;
            j <- j + 1;
        END
        i <- i + 1;
    END
END
""",
    ),
]


# Algoritmos con variabilidad: worst != best, avg debe aplicar modelo
VARIABLE_ALGORITHMS = [
    (
        "Búsqueda lineal",
        """linearSearch(A, n, x) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (A[i] = x) THEN BEGIN
            RETURN i;
        END
    END
    RETURN -1;
END
""",
    ),
    (
        "Búsqueda lineal WHILE",
        """linearSearchWhile(A, n, x) BEGIN
    i <- 1;
    WHILE (i <= n AND A[i] != x) DO BEGIN
        i <- i + 1;
    END
    IF (i <= n) THEN BEGIN
        RETURN i;
    END
    RETURN -1;
END
""",
    ),
    (
        "Insertion Sort",
        """insertionSort(arr, n) BEGIN
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
""",
    ),
]


class TestDeterministicAlgorithms:
    """Tests para algoritmos determinísticos (worst == best)."""

    @pytest.mark.parametrize(
        "name,source",
        DETERMINISTIC_ALGORITHMS,
        ids=[a[0] for a in DETERMINISTIC_ALGORITHMS],
    )
    def test_deterministic_avg_is_same_as_worst(self, name: str, source: str):
        """Algoritmos determinísticos: avg debe ser same_as_worst (no modelo probabilístico)."""
        result = analyze_algorithm(source, mode="all")
        assert result.get(
            "ok", False
        ), f"[{name}] Análisis falló: {result.get('errors', [])}"
        assert (
            result.get("has_case_variability") is False
        ), f"[{name}] Debe ser has_case_variability=False (determinístico)"
        assert result.get("avg") == "same_as_worst", (
            f"[{name}] avg debe ser same_as_worst, no modelo probabilístico. "
            f"Obtenido: {result.get('avg')}"
        )
        assert (
            result.get("best") == "same_as_worst"
        ), f"[{name}] best debe ser same_as_worst"

    @pytest.mark.parametrize(
        "name,source",
        DETERMINISTIC_ALGORITHMS,
        ids=[a[0] for a in DETERMINISTIC_ALGORITHMS],
    )
    def test_deterministic_no_avg_model_applied(self, name: str, source: str):
        """Algoritmos determinísticos: no se ejecuta análisis avg con modelo probabilístico."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        # avg es "same_as_worst" (string), no un objeto con avg_model_info
        avg = result.get("avg")
        assert avg == "same_as_worst", f"[{name}] avg debe ser string 'same_as_worst'"
        assert not isinstance(
            avg, dict
        ), f"[{name}] avg no debe ser dict (no se aplicó modelo probabilístico)"

    @pytest.mark.parametrize(
        "name,source",
        DETERMINISTIC_ALGORITHMS,
        ids=[a[0] for a in DETERMINISTIC_ALGORITHMS],
    )
    def test_deterministic_worst_best_equal(self, name: str, source: str):
        """Algoritmos determinísticos: worst y best tienen T_open idéntica."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        worst = result.get("worst", {})
        best = result.get("best")
        if best == "same_as_worst":
            # best usa worst, así que implícitamente son iguales
            assert "totals" in worst, f"[{name}] worst debe tener totals"
            assert "T_open" in worst["totals"], f"[{name}] worst debe tener T_open"
        else:
            worst_t = worst.get("totals", {}).get("T_open", "")
            best_t = best.get("totals", {}).get("T_open", "")
            assert (
                worst_t == best_t
            ), f"[{name}] T_open debe ser igual: worst={worst_t}, best={best_t}"

    def test_whilen_constant_loop_example(self):
        """Caso específico: WHILE i<=10 con print (ejemplo del usuario)."""
        source = """whileLoopExample() BEGIN
    i <- 1;
    WHILE (i <= 10) DO BEGIN
        print("Current value of i: ", i);
        i <- i + 1;
    END
END
"""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False)
        assert result.get("has_case_variability") is False
        assert result.get("avg") == "same_as_worst"
        assert result.get("best") == "same_as_worst"
        worst_t = result["worst"]["totals"].get("T_open", "")
        # Debe contener constantes (10, 11, etc.), no variables de tamaño
        assert "10" in worst_t or "11" in worst_t


class TestVariableAlgorithms:
    """Tests para algoritmos con variabilidad (worst != best)."""

    @pytest.mark.parametrize(
        "name,source", VARIABLE_ALGORITHMS, ids=[a[0] for a in VARIABLE_ALGORITHMS]
    )
    def test_variable_has_variability(self, name: str, source: str):
        """Algoritmos con variabilidad: has_case_variability=True."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        assert (
            result.get("has_case_variability") is True
        ), f"[{name}] Debe ser has_case_variability=True"

    @pytest.mark.parametrize(
        "name,source", VARIABLE_ALGORITHMS, ids=[a[0] for a in VARIABLE_ALGORITHMS]
    )
    def test_variable_avg_is_not_same_as_worst(self, name: str, source: str):
        """Algoritmos con variabilidad: avg es objeto con análisis (no same_as_worst)."""
        result = analyze_algorithm(source, mode="all")
        assert result.get("ok", False), f"[{name}] Análisis falló"
        avg = result.get("avg")
        assert (
            avg != "same_as_worst"
        ), f"[{name}] avg debe ser análisis completo, no same_as_worst"
        assert isinstance(avg, dict), f"[{name}] avg debe ser dict"
        assert "totals" in avg, f"[{name}] avg debe tener totals"


class TestDeterministicCoverage:
    """Cobertura de casos determinísticos."""

    def test_at_least_10_deterministic_algorithms(self):
        """Debe haber al menos 10 algoritmos determinísticos definidos."""
        assert len(DETERMINISTIC_ALGORITHMS) >= 10

    def test_mix_deterministic_and_variable(self):
        """Verificar que determinísticos y variables se distinguen correctamente."""
        det_results = [
            analyze_algorithm(s, mode="all") for _, s in DETERMINISTIC_ALGORITHMS[:3]
        ]
        var_results = [
            analyze_algorithm(s, mode="all") for _, s in VARIABLE_ALGORITHMS[:2]
        ]
        for r in det_results:
            assert r.get("has_case_variability") is False
        for r in var_results:
            assert r.get("has_case_variability") is True
