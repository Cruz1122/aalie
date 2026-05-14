"""
Test para verificar que cada algoritmo recursivo tiene múltiples métodos aplicables.

Este test es crítico para identificar por qué el modal de métodos no siempre
aparece cuando se selecciona un algoritmo recursivo.

Author: Debugging Session
"""

import json
import pytest
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


# Ejemplos de algoritmos de cada familia recursiva
TEST_ALGORITHMS = {
    "divide_and_conquer": [
        # Binary Search
        {
            "name": "Binary Search recursiva",
            "source": """binarySearchRec(A[n], x, inicio, fin) BEGIN
    IF (inicio > fin) THEN BEGIN
        RETURN -1;
    END
    medio <- (inicio + fin) DIV 2;
    IF (A[medio] = x) THEN BEGIN
        RETURN medio;
    END
    IF (x < A[medio]) THEN BEGIN
        RETURN binarySearchRec(A, x, inicio, medio - 1);
    END
    RETURN binarySearchRec(A, x, medio + 1, fin);
END""",
        },
        # Merge Sort
        {
            "name": "Merge Sort",
            "source": """mergeSort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        medio <- (inicio + fin) DIV 2;
        mergeSort(A, inicio, medio);
        mergeSort(A, medio + 1, fin);
        merge(A, inicio, medio, fin);
    END
END""",
        },
        # Quick Sort
        {
            "name": "Quick Sort",
            "source": """quickSort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        pi <- partition(A, inicio, fin);
        quickSort(A, inicio, pi - 1);
        quickSort(A, pi + 1, fin);
    END
END""",
        },
        # Ternary Search
        {
            "name": "Ternary Search",
            "source": """ternarySearchRec(A[n], x, inicio, fin) BEGIN
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
        RETURN ternarySearchRec(A, x, inicio, m1 - 1);
    END
    IF (x > A[m2]) THEN BEGIN
        RETURN ternarySearchRec(A, x, m2 + 1, fin);
    END
    RETURN ternarySearchRec(A, x, m1 + 1, m2 - 1);
END""",
        },
        # Strassen Matrix Multiplication (simplified)
        {
            "name": "Matrix Multiplication",
            "source": """matrixMultiply(A[n][n], B[n][n], C[n][n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        medio <- (inicio + fin) DIV 2;
        matrixMultiply(A, B, C, inicio, medio);
        matrixMultiply(A, B, C, medio + 1, fin);
    END
END""",
        },
    ],
    "decrease_and_conquer": [
        # Insertion Sort Recursive
        {
            "name": "Insertion Sort Recursiva",
            "source": """insertionSortRec(A[n], n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 0;
    END
    insertionSortRec(A, n - 1);
    clave <- A[n];
    j <- n - 1;
    WHILE (j > 0 AND A[j] > clave) DO BEGIN
        A[j + 1] <- A[j];
        j <- j - 1;
    END
    A[j + 1] <- clave;
    RETURN 0;
END""",
        },
        # Palindrome Check
        {
            "name": "Palindrome Check Recursivo",
            "source": """palindromeRec(S[n], izq, der) BEGIN
    IF (izq >= der) THEN BEGIN
        RETURN 1;
    END
    IF (S[izq] != S[der]) THEN BEGIN
        RETURN 0;
    END
    RETURN palindromeRec(S, izq + 1, der - 1);
END""",
        },
        # Power of a Number
        {
            "name": "Power Recursiva",
            "source": """power(x, n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    IF (n < 0) THEN BEGIN
        RETURN 1 / power(x, -n);
    END
    RETURN x * power(x, n - 1);
END""",
        },
        # Exponential (Fast Exponentiation)
        {
            "name": "Fast Exponentiation",
            "source": """fastExpo(x, n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    IF (n MOD 2 = 0) THEN BEGIN
        temp <- fastExpo(x, n / 2);
        RETURN temp * temp;
    END
    RETURN x * fastExpo(x, n - 1);
END""",
        },
        # String Search (KMP simplified)
        {
            "name": "String Search Recursiva",
            "source": """stringSearchRec(texto[m], patron[n], pos) BEGIN
    IF (pos > m - n) THEN BEGIN
        RETURN -1;
    END
    IF (matchAt(texto, patron, pos)) THEN BEGIN
        RETURN pos;
    END
    RETURN stringSearchRec(texto, patron, pos + 1);
END""",
        },
    ],
    "decrease_and_get_conquered": [
        # Fibonacci
        {
            "name": "Fibonacci Recursivo",
            "source": """fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN fibonacci(n - 1) + fibonacci(n - 2);
END""",
        },
        # Tribonacci
        {
            "name": "Tribonacci Recursivo",
            "source": """tribonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 0;
    END
    IF (n = 2) THEN BEGIN
        RETURN 1;
    END
    RETURN tribonacci(n - 1) + tribonacci(n - 2) + tribonacci(n - 3);
END""",
        },
        # Tower of Hanoi
        {
            "name": "Torres de Hanoi",
            "source": """hanoi(n, origen, destino, auxiliar) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    izquierda <- hanoi(n - 1, origen, auxiliar, destino);
    derecha <- hanoi(n - 1, auxiliar, destino, origen);
    RETURN izquierda + derecha + 1;
END""",
        },
        # Climbing Stairs
        {
            "name": "Escaleras Recursivas",
            "source": """escaleras(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 1;
    END
    RETURN escaleras(n - 1) + escaleras(n - 2);
END""",
        },
        # Tetranacci
        {
            "name": "Tetranacci",
            "source": """tetranacci(n) BEGIN
    IF (n <= 2) THEN BEGIN
        RETURN 0;
    END
    IF (n = 3) THEN BEGIN
        RETURN 1;
    END
    RETURN tetranacci(n - 1) + tetranacci(n - 2) + tetranacci(n - 3) + tetranacci(n - 4);
END""",
        },
    ],
}


class TestApplicableMethodsDetection:
    """Test que verifica la detección de métodos aplicables."""

    @pytest.mark.parametrize(
        "family,algorithms",
        [
            ("divide_and_conquer", TEST_ALGORITHMS["divide_and_conquer"]),
            ("decrease_and_conquer", TEST_ALGORITHMS["decrease_and_conquer"]),
            (
                "decrease_and_get_conquered",
                TEST_ALGORITHMS["decrease_and_get_conquered"],
            ),
        ],
    )
    def test_each_algorithm_has_multiple_applicable_methods(
        self, family, algorithms
    ):
        """
        Verifica que CADA algoritmo de cada familia tiene al menos 2 métodos aplicables.

        IMPORTANTE: Este test es diagnóstico. Ayuda a identificar cuáles algoritmos
        tienen problemas en la detección de métodos.
        """
        print(f"\n\n{'='*80}")
        print(f"FAMILIA: {family}")
        print(f"{'='*80}\n")

        results = []
        failures = []

        for idx, algo in enumerate(algorithms, 1):
            algo_name = algo["name"]
            source_code = algo["source"]

            print(f"\n[{idx}/{len(algorithms)}] Probando: {algo_name}")
            print("-" * 60)

            # Llamar al endpoint de detección de métodos
            response = client.post(
                "/analyze/detect-methods",
                json={"source": source_code},
            )

            print(f"Status Code: {response.status_code}")

            if response.status_code != 200:
                print(f"[FAIL] ERROR: El endpoint retornó {response.status_code}")
                print(f"Respuesta: {response.json()}")
                failures.append(
                    {
                        "algorithm": algo_name,
                        "family": family,
                        "issue": f"HTTP {response.status_code}",
                    }
                )
                continue

            data = response.json()

            if not data.get("ok"):
                error_msg = data.get("errors", [{}])[0].get("message", "Unknown")
                print(f"[FAIL] ERROR: {error_msg}")
                failures.append(
                    {
                        "algorithm": algo_name,
                        "family": family,
                        "issue": error_msg,
                    }
                )
                continue

            applicable_methods = data.get("applicable_methods", [])
            default_method = data.get("default_method")
            recurrence_info = data.get("recurrence_info", {})

            print(f"[OK] Detectado como algoritmo recursivo")
            print(f"   Metodos aplicables: {applicable_methods}")
            print(f"   Metodo por defecto: {default_method}")
            print(f"   Tipo de recurrencia: {recurrence_info.get('type', 'unknown')}")

            num_methods = len(applicable_methods)

            # VERIFICACIÓN CRÍTICA: Al menos 2 métodos
            if num_methods < 2:
                print(
                    f"   [WARN] PROBLEMA: Solo {num_methods} metodo aplicable (se esperan >= 2)"
                )
                failures.append(
                    {
                        "algorithm": algo_name,
                        "family": family,
                        "applicable_methods": applicable_methods,
                        "issue": f"Solo {num_methods} metodo detectado",
                    }
                )
            else:
                print(f"   [OK] CORRECTO: {num_methods} metodos aplicables")

            results.append(
                {
                    "algorithm": algo_name,
                    "family": family,
                    "applicable_methods": applicable_methods,
                    "default_method": default_method,
                    "num_methods": num_methods,
                    "recurrence_type": recurrence_info.get("type"),
                }
            )

        # Resumen de familia
        print(f"\n{'='*80}")
        print(f"RESUMEN - {family}")
        print(f"{'='*80}")
        print(f"Total algoritmos probados: {len(results)}")
        print(
            f"Algoritmos con 2+ metodos: {sum(1 for r in results if r['num_methods'] >= 2)}"
        )
        print(f"Algoritmos problematicos: {len(failures)}")

        if failures:
            print("\n[FAIL] ALGORITMOS CON PROBLEMAS:")
            for failure in failures:
                print(
                    f"  - {failure['algorithm']}: {failure.get('issue', 'desconocido')}"
                )
                if "applicable_methods" in failure:
                    print(f"    Metodos detectados: {failure['applicable_methods']}")

        # Verificación final
        if failures:
            print(
                f"\n[FAIL] FALLÓ: {len(failures)} algoritmos tienen problemas con detección de metodos"
            )
            print("\nDETALLES DE FALLOS:")
            print(json.dumps(failures, indent=2, ensure_ascii=False))

        # Este assert falla si algún algoritmo no tiene 2+ métodos
        # Así podemos ver exactamente cuáles fallan
        assert (
            len(failures) == 0
        ), f"Se encontraron {len(failures)} algoritmos sin multiples metodos aplicables"


def test_all_algorithms_summary():
    """Test resumen que muestra estadísticas globales."""
    print("\n\n" + "=" * 80)
    print("RESUMEN GLOBAL DE DETECCIÓN DE MÉTODOS")
    print("=" * 80 + "\n")

    global_results = []
    global_failures = []

    for family, algorithms in TEST_ALGORITHMS.items():
        family_results = {
            "family": family,
            "total": len(algorithms),
            "with_multiple_methods": 0,
            "problematic": [],
        }

        for algo in algorithms:
            response = client.post(
                "/analyze/detect-methods",
                json={"source": algo["source"]},
            )

            if response.status_code == 200 and response.json().get("ok"):
                applicable = response.json().get("applicable_methods", [])
                if len(applicable) >= 2:
                    family_results["with_multiple_methods"] += 1
                else:
                    family_results["problematic"].append(
                        {
                            "name": algo["name"],
                            "methods": applicable,
                        }
                    )
            else:
                family_results["problematic"].append(
                    {
                        "name": algo["name"],
                        "error": "No se detectó como recursivo",
                    }
                )

        global_results.append(family_results)

    # Mostrar resumen
    for result in global_results:
        total = result["total"]
        with_mult = result["with_multiple_methods"]
        percentage = (with_mult / total * 100) if total > 0 else 0
        status = "[OK]" if percentage == 100 else "[WARN]"

        print(
            f"{status} {result['family']}: {with_mult}/{total} ({percentage:.1f}%)"
        )

        if result["problematic"]:
            print(f"   Problemas: {len(result['problematic'])}")
            for prob in result["problematic"]:
                if "methods" in prob:
                    print(f"     - {prob['name']}: {len(prob['methods'])} metodo(s)")
                else:
                    print(f"     - {prob['name']}: {prob.get('error', 'desconocido')}")

    print("\n" + "=" * 80 + "\n")
