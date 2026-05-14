"""
Test COMPLETO: Verifica que 5+ algoritmos por familia recursiva tienen 2+ métodos.
Usa pseudocódigo CORRECTAMENTE formado.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


# Algoritmos realmente recursivos, bien formados
COMPREHENSIVE_TEST_SUITE = {
    "divide_and_conquer": [
        {
            "name": "Binary Search",
            "source": """binarySearch(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    medio <- (inicio + fin) DIV 2;
    IF (A[medio] = x) THEN BEGIN
        RETURN medio;
    END
    IF (x < A[medio]) THEN BEGIN
        RETURN binarySearch(A, x, inicio, medio - 1);
    END
    RETURN binarySearch(A, x, medio + 1, fin);
END""",
        },
        {
            "name": "Ternary Search",
            "source": """ternarySearch(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    tercio <- (fin - inicio) DIV 3;
    m1 <- inicio + tercio;
    m2 <- fin - tercio;
    IF (A[m1] = x) THEN BEGIN
        RETURN m1;
    END
    IF (A[m2] = x) THEN BEGIN
        RETURN m2;
    END
    IF (x < A[m1]) THEN BEGIN
        RETURN ternarySearch(A, x, inicio, m1 - 1);
    END
    IF (x > A[m2]) THEN BEGIN
        RETURN ternarySearch(A, x, m2 + 1, fin);
    END
    RETURN ternarySearch(A, x, m1 + 1, m2 - 1);
END""",
        },
        {
            "name": "Count Array Elements",
            "source": """countElements(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN 1;
    END
    medio <- (inicio + fin) DIV 2;
    left <- countElements(A, inicio, medio);
    right <- countElements(A, medio + 1, fin);
    RETURN left + right;
END""",
        },
        {
            "name": "Find Minimum in Array",
            "source": """findMin(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    leftMin <- findMin(A, inicio, medio);
    rightMin <- findMin(A, medio + 1, fin);
    IF (leftMin < rightMin) THEN BEGIN
        RETURN leftMin;
    END
    RETURN rightMin;
END""",
        },
        {
            "name": "Sum Array Divide Conquer",
            "source": """sumDC(A[n], inicio, fin) BEGIN
    IF (inicio = fin) THEN BEGIN
        RETURN A[inicio];
    END
    medio <- (inicio + fin) DIV 2;
    leftSum <- sumDC(A, inicio, medio);
    rightSum <- sumDC(A, medio + 1, fin);
    RETURN leftSum + rightSum;
END""",
        },
    ],
    "decrease_and_conquer": [
        {
            "name": "Palindrome Check",
            "source": """isPalindrome(S[n], izq, der) BEGIN
    IF (izq >= der) THEN BEGIN
        RETURN 1;
    END
    IF (S[izq] != S[der]) THEN BEGIN
        RETURN 0;
    END
    RETURN isPalindrome(S, izq + 1, der - 1);
END""",
        },
        {
            "name": "Simple Power",
            "source": """power(x, n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    RETURN x * power(x, n - 1);
END""",
        },
        {
            "name": "Max Element",
            "source": """maxElement(A[n], n) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN A[1];
    END
    max <- maxElement(A, n - 1);
    IF (A[n] > max) THEN BEGIN
        RETURN A[n];
    END
    RETURN max;
END""",
        },
        {
            "name": "Array Sum",
            "source": """sumArray(A[n], n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 0;
    END
    RETURN A[n] + sumArray(A, n - 1);
END""",
        },
        {
            "name": "Count Digits",
            "source": """countDigits(num) BEGIN
    IF (num < 10) THEN BEGIN
        RETURN 1;
    END
    RETURN 1 + countDigits(num DIV 10);
END""",
        },
    ],
    "decrease_and_get_conquered": [
        {
            "name": "Fibonacci",
            "source": """fib(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN fib(n - 1) + fib(n - 2);
END""",
        },
        {
            "name": "Tribonacci",
            "source": """trib(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 0;
    END
    IF (n = 2) THEN BEGIN
        RETURN 1;
    END
    RETURN trib(n - 1) + trib(n - 2) + trib(n - 3);
END""",
        },
        {
            "name": "Tower of Hanoi",
            "source": """hanoi(n, origen, destino, auxiliar) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    izq <- hanoi(n - 1, origen, auxiliar, destino);
    der <- hanoi(n - 1, auxiliar, destino, origen);
    RETURN izq + der + 1;
END""",
        },
        {
            "name": "Climbing Stairs",
            "source": """stairs(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN stairs(n - 1) + stairs(n - 2);
END""",
        },
        {
            "name": "Tetranacci",
            "source": """tetra(n) BEGIN
    IF (n <= 2) THEN BEGIN
        RETURN 0;
    END
    IF (n = 3) THEN BEGIN
        RETURN 1;
    END
    RETURN tetra(n - 1) + tetra(n - 2) + tetra(n - 3) + tetra(n - 4);
END""",
        },
    ],
}


class TestComprehensiveMethodsDetection:
    """Test exhaustivo de detección de métodos para todas las familias."""

    @pytest.mark.parametrize(
        "family,algorithms",
        [
            ("divide_and_conquer", COMPREHENSIVE_TEST_SUITE["divide_and_conquer"]),
            ("decrease_and_conquer", COMPREHENSIVE_TEST_SUITE["decrease_and_conquer"]),
            (
                "decrease_and_get_conquered",
                COMPREHENSIVE_TEST_SUITE["decrease_and_get_conquered"],
            ),
        ],
    )
    def test_family_has_multiple_methods(self, family, algorithms):
        """
        PRUEBA CRÍTICA: Cada algoritmo recursivo debe tener al menos 2 métodos aplicables.
        """
        print(f"\n{'='*100}")
        print(f"FAMILIA: {family.upper()}")
        print(f"{'='*100}\n")

        results = []
        failures = []

        for idx, algo in enumerate(algorithms, 1):
            algo_name = algo["name"]
            source = algo["source"]

            print(f"[{idx}/{len(algorithms)}] {algo_name:<40}", end=" → ")

            response = client.post(
                "/analyze/detect-methods",
                json={"source": source},
            )

            if response.status_code != 200:
                print(f"[HTTP {response.status_code}]")
                failures.append((algo_name, f"HTTP {response.status_code}"))
                continue

            data = response.json()

            if not data.get("ok"):
                error = data.get("errors", [{}])[0].get("message", "Unknown")
                print(f"[PARSE ERROR]: {error[:50]}")
                failures.append((algo_name, error[:50]))
                continue

            applicable_methods = data.get("applicable_methods", [])
            default_method = data.get("default_method")
            recurrence_type = data.get("recurrence_info", {}).get("type", "unknown")
            num_methods = len(applicable_methods)

            if num_methods < 2:
                print(
                    f"[PROBLEMA] Solo {num_methods} metodo(s): {applicable_methods}"
                )
                failures.append((algo_name, f"{num_methods} metodo(s)"))
            else:
                print(f"[OK] {num_methods} metodos: {applicable_methods}")
                results.append(
                    {
                        "name": algo_name,
                        "methods": applicable_methods,
                        "default": default_method,
                        "recurrence": recurrence_type,
                        "count": num_methods,
                    }
                )

        # Resumen por familia
        print(f"\n{'='*100}")
        print(f"RESUMEN: {family}")
        print(f"{'='*100}")
        print(f"Total probados: {len(algorithms)}")
        print(f"Exitos: {len(results)}")
        print(f"Fallos: {len(failures)}")

        if failures:
            print("\nProblemas encontrados:")
            for name, reason in failures:
                print(f"  * {name}: {reason}")

        # Verificación
        assert len(failures) == 0, f"Se encontraron {len(failures)} algoritmos con problemas"


def test_summary_all_algorithms():
    """Resumen global de todos los algoritmos."""
    print("\n\n" + "=" * 120)
    print("RESUMEN GLOBAL - TEST DE DETECCIÓN DE MÉTODOS")
    print("=" * 120 + "\n")

    total_count = 0
    pass_count = 0
    problems = []

    for family, algorithms in COMPREHENSIVE_TEST_SUITE.items():
        family_pass = 0
        family_problems = []

        for algo in algorithms:
            total_count += 1
            response = client.post(
                "/analyze/detect-methods",
                json={"source": algo["source"]},
            )

            if response.status_code == 200 and response.json().get("ok"):
                methods = response.json().get("applicable_methods", [])
                if len(methods) >= 2:
                    family_pass += 1
                    pass_count += 1
                else:
                    family_problems.append(f"{algo['name']} ({len(methods)} metodo(s))")
            else:
                error = response.json().get("errors", [{}])[0].get("message", "Unknown")
                family_problems.append(f"{algo['name']} (Parse: {error[:30]})")

            problems.extend(family_problems)

        pct = (family_pass / len(algorithms) * 100) if algorithms else 0
        status = "[PASS]" if family_pass == len(algorithms) else "[WARN]"
        print(f"{status} {family:<35} {family_pass}/{len(algorithms)} ({pct:.0f}%)")

        if family_problems:
            for prob in family_problems:
                print(f"       - {prob}")

    print(f"\n{'='*120}")
    print(f"TOTAL: {pass_count}/{total_count} ({pass_count/total_count*100:.1f}%)")
    print(f"{'='*120}\n")

    assert pass_count == total_count, f"Falló: {total_count - pass_count} algoritmos no tienen 2+ métodos"
