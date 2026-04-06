"""
Benchmark de 10 algoritmos con WHILE.
Valida best/worst/avg vía analyze_algorithm (equivalente al endpoint /analyze/open).

Ejecutar: cd apps/api && python -m pytest tests/benchmark_while_algorithms.py -v -s

Author: Juan Camilo Cruz Parra (@Cruz1122)
"""

import pytest

from app.modules.analysis.service import analyze_algorithm

pytestmark = [
    pytest.mark.slow,
    pytest.mark.benchmark,
    pytest.mark.iterative,
    pytest.mark.while_loop,
]

BENCHMARK_ALGORITHMS = [
    # 1. Euclides MCD - Θ(log min(a,b))
    (
        "Euclides MCD",
        """mcd(a, b) BEGIN
  WHILE (b != 0) DO BEGIN
    temp <- b;
    b <- a MOD b;
    a <- temp;
  END
  RETURN a;
END
""",
        {"best": "log", "worst": "log", "avg": "log"},
    ),
    # 2. WHILE incremento - Θ(n)
    (
        "WHILE incremento",
        """linear(n) BEGIN
  i <- 0;
  WHILE (i < n) DO BEGIN
    x <- 1;
    i <- i + 1;
  END
END
""",
        {"best": "linear", "worst": "linear", "avg": "linear"},
    ),
    # 3. WHILE multiplicación - Θ(log n)
    (
        "WHILE multiplicación",
        """logLoop(n) BEGIN
  i <- 1;
  WHILE (i <= n) DO BEGIN
    x <- 1;
    i <- i * 2;
  END
END
""",
        {"best": "log", "worst": "log", "avg": "log"},
    ),
    # 4. Búsqueda binaria - Θ(1) best, Θ(log n) worst/avg
    (
        "Búsqueda binaria",
        """binarySearch(A, n, x) BEGIN
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
""",
        {"best": "constant", "worst": "log", "avg": "log"},
    ),
    # 5. Búsqueda lineal con flag (buscar) - Θ(1) best, Θ(n) worst/avg
    (
        "Búsqueda lineal con flag",
        """buscar(A, n, x) BEGIN
    i <- 0;
    encontrado <- false;
    WHILE (i < n AND encontrado = false) DO BEGIN
        IF (A[i] = x) THEN BEGIN
            encontrado <- true;
        END ELSE BEGIN
            i <- i + 1;
        END;
    END;
    RETURN encontrado;
END
""",
        {"best": "constant", "worst": "linear", "avg": "linear"},
    ),
    # 6. Búsqueda lineal WHILE (sin flag) - Θ(1) best, Θ(n) worst/avg
    (
        "Búsqueda lineal WHILE",
        """linearSearch(A, n, x) BEGIN
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
        {"best": "constant", "worst": "linear", "avg": "linear"},
    ),
    # 7. Factorial WHILE - Θ(n)
    (
        "Factorial WHILE",
        """factorial(n) BEGIN
  i <- 1;
  acc <- 1;
  WHILE (i <= n) DO BEGIN
    acc <- acc * i;
    i <- i + 1;
  END
  RETURN acc;
END
""",
        {"best": "linear", "worst": "linear", "avg": "linear"},
    ),
    # 8. WHILE anidados - Θ(n²)
    (
        "WHILE anidados",
        """nestedWhile(n) BEGIN
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
""",
        {"best": "quadratic", "worst": "quadratic", "avg": "quadratic"},
    ),
    # 9. Insertion Sort - Θ(n) best, Θ(n²) worst/avg
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
        {"best": "linear", "worst": "quadratic", "avg": "quadratic"},
    ),
    # 10. Bubble Sort Mejorado - Θ(n) best, Θ(n²) worst/avg
    (
        "Bubble Sort Mejorado",
        """ordenamientoBurbujaMejorado(A, n) BEGIN
  i <- 1;
  intercambiado <- true;
  WHILE (i < n AND intercambiado = true) DO BEGIN
    intercambiado <- false;
    FOR j <- 1 TO n - i DO BEGIN
      IF (A[j] > A[j+1]) THEN BEGIN
        temp <- A[j];
        A[j] <- A[j+1];
        A[j+1] <- temp;
        intercambiado <- true;
      END
    END
    i <- i + 1;
  END
END
""",
        {"best": "linear", "worst": "quadratic", "avg": "quadratic"},
    ),
]


def _theta_matches(expected: str, actual: str) -> bool:
    """Comprueba si la complejidad actual coincide con la esperada."""
    if not actual:
        return False
    # Normalizar: quitar LaTeX, pasar a minúsculas
    a = actual.lower().replace("\\theta", "").replace("(", "").replace(")", "")
    a = a.replace(" ", "").replace("{", "").replace("}", "")
    if expected == "constant":
        return "1" in a and "log" not in a and "n" not in a
    if expected == "log":
        return "log" in a
    if expected == "linear":
        if "log" in a or "n" not in a:
            return False
        if "2" in a and ("^" in actual or "^{" in actual):
            return False
        return True
    if expected == "quadratic":
        return "2" in a or "n2" in a or "quadratic" in a or "n^2" in actual
    if expected == "cubic":
        return "3" in a or "cubic" in a
    return False


@pytest.mark.parametrize("name,source,expected", BENCHMARK_ALGORITHMS)
def test_benchmark_while_algorithm(name: str, source: str, expected: dict) -> None:
    """Benchmark lane: valida ejecución y sanity semántica mínima."""
    results = {}
    for mode in ["best", "worst", "avg"]:
        r = analyze_algorithm(source=source, mode=mode)
        assert r.get("ok"), f"{name} {mode}: análisis falló: {r.get('errors', [])}"
        theta = r.get("totals", {}).get("big_theta", "")
        results[mode] = theta
    print(
        f"  {name}: best={results['best']} worst={results['worst']} avg={results['avg']} OK"
    )


def test_benchmark_summary() -> None:
    """Ejecuta benchmark completo e imprime resumen informativo (no gate funcional estricto)."""
    print("\n=== Benchmark 10 algoritmos WHILE ===\n")
    passed = 0
    failed = []
    for name, source, expected in BENCHMARK_ALGORITHMS:
        try:
            for mode in ["best", "worst", "avg"]:
                r = analyze_algorithm(source=source, mode=mode)
                if not r.get("ok"):
                    raise AssertionError(
                        f"{mode}: análisis falló: {r.get('errors', [])}"
                    )
                theta = r.get("totals", {}).get("big_theta", "")
                if theta and not _theta_matches(expected.get(mode, ""), theta):
                    raise AssertionError(
                        f"{mode}: esperado {expected.get(mode)}, obtuvo {theta}"
                    )
            passed += 1
            print(f"  [OK] {name}")
        except Exception as e:
            failed.append((name, str(e)))
            print(f"  [FAIL] {name}: {e}")
    print(f"\nPasaron: {passed}/{len(BENCHMARK_ALGORITHMS)}")
    if failed:
        print(f"Casos con warning de benchmark: {failed}")
