"""
Test FINAL: Modal de métodos aparece correctamente para algoritmos del catálogo.
"""

import json
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


# Ejemplos del catálogo que deberían tener 2+ métodos
FINAL_TEST_ALGORITHMS = [
    ("Fibonacci", """fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN fibonacci(n - 1) + fibonacci(n - 2);
END"""),
    ("Binary Search", """binarySearchRec(A[n], x, inicio, fin) BEGIN
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
END"""),
    ("Tower of Hanoi", """hanoi(n, origen, destino, auxiliar) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    izquierda <- hanoi(n - 1, origen, auxiliar, destino);
    derecha <- hanoi(n - 1, auxiliar, destino, origen);
    RETURN izquierda + derecha + 1;
END"""),
    ("Palindrome Check", """isPalindrome(S[n], izq, der) BEGIN
    IF (izq >= der) THEN BEGIN
        RETURN 1;
    END
    IF (S[izq] != S[der]) THEN BEGIN
        RETURN 0;
    END
    RETURN isPalindrome(S, izq + 1, der - 1);
END"""),
    ("Simple Power", """power(x, n) BEGIN
    IF (n = 0) THEN BEGIN
        RETURN 1;
    END
    RETURN x * power(x, n - 1);
END"""),
]


def test_modal_shows_for_catalog_algorithms():
    """
    TEST FINAL: Verifica que TODOS los ejemplos del catálogo muestran modal.
    """
    print("\n\n" + "=" * 110)
    print("TEST FINAL: Modal de Métodos Aparece para Algoritmos del Catálogo")
    print("=" * 110 + "\n")

    results = []
    failures = []

    for algo_name, source_code in FINAL_TEST_ALGORITHMS:
        print(f"[ANALIZANDO] {algo_name:<30}", end=" ")

        response = client.post(
            "/analyze/detect-methods",
            json={"source": source_code}
        )

        if response.status_code != 200:
            print(f"[HTTP {response.status_code}]")
            failures.append(f"{algo_name}: HTTP {response.status_code}")
            continue

        data = response.json()

        if not data.get("ok"):
            error_msg = data.get("errors", [{}])[0].get("message", "Unknown")
            print(f"[PARSE ERROR]: {error_msg[:40]}")
            failures.append(f"{algo_name}: {error_msg[:40]}")
            continue

        methods = data.get("applicable_methods", [])
        default = data.get("default_method")
        num = len(methods)

        # CRITERIO: Modal aparece si > 1 método
        if num > 1:
            print(f"[MODAL APARECE] {num} metodos: {methods}")
            results.append({
                "name": algo_name,
                "num_methods": num,
                "methods": methods,
                "default": default
            })
        else:
            print(f"[MODAL NO APARECE] Solo {num} metodo: {methods}")
            failures.append(f"{algo_name}: {num} metodo(s)")

    # Resumen
    print(f"\n{'='*110}")
    print("RESUMEN FINAL")
    print(f"{'='*110}\n")

    print(f"Total algoritmos: {len(FINAL_TEST_ALGORITHMS)}")
    print(f"Muestran modal (2+ metodos): {len(results)}")
    print(f"NO muestran modal (<= 1 metodo): {len(failures)}")

    if results:
        print("\n[EXITO] Algoritmos que muestran modal:")
        for r in results:
            print(f"  - {r['name']}: {r['num_methods']} metodos {r['methods']}")

    if failures:
        print("\n[PROBLEMA] Algoritmos sin modal:")
        for f in failures:
            print(f"  - {f}")

    print(f"\n{'='*110}\n")

    # Verificación
    assert len(failures) == 0, f"FALLÓ: {len(failures)} algoritmo(s) no muestran modal"
    assert len(results) == len(FINAL_TEST_ALGORITHMS), "No todos los algoritmos pasan"


def test_response_structure_valid():
    """Verifica que la estructura de respuesta es correcta y puede renderizar modal."""
    print("\n\nTEST: Estructura de Respuesta Válida para Modal\n")

    source = """fib(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN fib(n - 1) + fib(n - 2);
END"""

    response = client.post("/analyze/detect-methods", json={"source": source})
    assert response.status_code == 200

    data = response.json()

    # Verificar estructura requerida para que el frontend muestre modal
    assert isinstance(data, dict), "Response debe ser dict"
    assert data.get("ok") is True, "ok debe ser True"
    assert "applicable_methods" in data, "Debe tener applicable_methods"
    assert isinstance(data["applicable_methods"], list), "applicable_methods debe ser lista"
    assert len(data["applicable_methods"]) > 0, "Debe haber métodos"
    assert "default_method" in data, "Debe tener default_method"
    assert isinstance(data["default_method"], str), "default_method debe ser string"

    # El criterio crítico: si len(applicable_methods) > 1, la modal aparece
    num_methods = len(data["applicable_methods"])
    will_show_modal = num_methods > 1

    print(f"Métodos disponibles: {num_methods}")
    print(f"Modal aparecerá: {will_show_modal}")
    print(f"Métodos: {data['applicable_methods']}")

    assert will_show_modal, f"Se espera > 1 método, se obtuvieron {num_methods}"
