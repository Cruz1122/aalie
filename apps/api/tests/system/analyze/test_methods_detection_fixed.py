"""
Test de detección de métodos CORREGIDO - con nombres de función válidos.
"""

import json
import pytest
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


# Ejemplos CORREGIDOS de algoritmos de cada familia
TEST_ALGORITHMS_FIXED = {
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
            "name": "Merge Sort",
            "source": """sort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        medio <- (inicio + fin) DIV 2;
        sort(A, inicio, medio);
        sort(A, medio + 1, fin);
        merge(A, inicio, medio, fin);
    END
END""",
        },
        {
            "name": "Quick Sort",
            "source": """sort(A[n], inicio, fin) BEGIN
    IF (inicio < fin) THEN BEGIN
        pi <- partition(A, inicio, fin);
        sort(A, inicio, pi - 1);
        sort(A, pi + 1, fin);
    END
END""",
        },
        {
            "name": "Ternary Search",
            "source": """search(A[n], x, inicio, fin) BEGIN
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
        RETURN search(A, x, inicio, m1 - 1);
    END
    IF (x > A[m2]) THEN BEGIN
        RETURN search(A, x, m2 + 1, fin);
    END
    RETURN search(A, x, m1 + 1, m2 - 1);
END""",
        },
        {
            "name": "Power Divide and Conquer",
            "source": """power(x, n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    IF (n MOD 2 = 0) THEN BEGIN
        temp <- power(x, n DIV 2);
        RETURN temp * temp;
    END
    RETURN x * power(x, n - 1);
END""",
        },
    ],
    "decrease_and_conquer": [
        {
            "name": "Insertion Sort",
            "source": """sort(A[n], n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN 0;
    END
    sort(A, n - 1);
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
        {
            "name": "Palindrome Check",
            "source": """check(S[n], izq, der) BEGIN
    IF (izq >= der) THEN BEGIN
        RETURN 1;
    END
    IF (S[izq] != S[der]) THEN BEGIN
        RETURN 0;
    END
    RETURN check(S, izq + 1, der - 1);
END""",
        },
        {
            "name": "Simple Power",
            "source": """exp(x, n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    RETURN x * exp(x, n - 1);
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
            "source": """sum(A[n], n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 0;
    END
    RETURN A[n] + sum(A, n - 1);
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
            "name": "Stairs",
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


def test_all_algorithms_have_multiple_methods():
    """
    Test comprobador: Verifica que cada algoritmo recursivo tiene al menos 2 métodos.
    """
    print("\n\n" + "=" * 100)
    print("DIAGNOSTICO: Detección de Métodos Aplicables para Algoritmos Recursivos")
    print("=" * 100 + "\n")

    global_stats = {
        "total": 0,
        "with_multiple": 0,
        "families": {}
    }

    for family, algorithms in TEST_ALGORITHMS_FIXED.items():
        print(f"\n{'='*100}")
        print(f"FAMILIA: {family.upper()}")
        print(f"{'='*100}\n")

        family_stats = {
            "total": len(algorithms),
            "passing": 0,
            "failing": []
        }

        for idx, algo in enumerate(algorithms, 1):
            algo_name = algo["name"]
            source_code = algo["source"]

            print(f"[{idx}/{len(algorithms)}] {algo_name:<40}", end=" ")

            response = client.post(
                "/analyze/detect-methods",
                json={"source": source_code},
            )

            if response.status_code != 200:
                print(f"[HTTP {response.status_code}] FALLÓ")
                family_stats["failing"].append({
                    "name": algo_name,
                    "reason": f"HTTP {response.status_code}"
                })
                continue

            data = response.json()

            if not data.get("ok"):
                error = data.get("errors", [{}])[0].get("message", "Unknown")
                print(f"[PARSE ERROR] FALLÓ: {error[:50]}")
                family_stats["failing"].append({
                    "name": algo_name,
                    "reason": f"Parse: {error[:50]}"
                })
                continue

            applicable_methods = data.get("applicable_methods", [])
            default_method = data.get("default_method")
            num_methods = len(applicable_methods)

            if num_methods >= 2:
                print(f"[EXITO] {num_methods} metodos: {applicable_methods}")
                family_stats["passing"] += 1
                global_stats["with_multiple"] += 1
            else:
                print(f"[PROBLEMA] SOLO {num_methods} metodo: {applicable_methods}")
                family_stats["failing"].append({
                    "name": algo_name,
                    "methods": applicable_methods,
                    "num": num_methods
                })

            global_stats["total"] += 1

        # Resumen de familia
        percentage = (family_stats["passing"] / family_stats["total"] * 100) if family_stats["total"] > 0 else 0
        status = "[EXITO]" if family_stats["failing"] == [] else "[ALERTA]"
        print(f"\n{status} Resumen {family}: {family_stats['passing']}/{family_stats['total']} correctos ({percentage:.0f}%)")

        if family_stats["failing"]:
            print(f"\n   Problemas encontrados ({len(family_stats['failing'])}):")
            for fail in family_stats["failing"]:
                if "methods" in fail:
                    print(f"     * {fail['name']}: {fail['num']} metodo(s) - {fail['methods']}")
                else:
                    print(f"     * {fail['name']}: {fail['reason']}")

        global_stats["families"][family] = family_stats

    # Resumen GLOBAL
    print(f"\n\n{'='*100}")
    print("RESUMEN GLOBAL")
    print(f"{'='*100}\n")

    total = global_stats["total"]
    passing = global_stats["with_multiple"]
    percentage = (passing / total * 100) if total > 0 else 0

    print(f"Total algoritmos probados: {total}")
    print(f"Algoritmos con 2+ metodos: {passing}")
    print(f"Porcentaje de exito: {percentage:.1f}%")

    # Tabla por familia
    print(f"\nDetalle por familia:")
    for family, stats in global_stats["families"].items():
        fam_pass = stats["passing"]
        fam_total = stats["total"]
        fam_pct = (fam_pass / fam_total * 100) if fam_total > 0 else 0
        print(f"  {family:<35} {fam_pass}/{fam_total} ({fam_pct:.0f}%)")

    print(f"\n{'='*100}\n")

    # Verificación final
    assert passing == total, f"FALLÓ: {total - passing} algoritmo(s) no tienen 2+ metodos detectados"
    assert percentage == 100, f"FALLÓ: Solo {percentage:.1f}% de los algoritmos tienen metodos multiples"


if __name__ == "__main__":
    test_all_algorithms_have_multiple_methods()
