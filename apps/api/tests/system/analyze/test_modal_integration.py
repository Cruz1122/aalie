"""
Test de integración: Verifica que la modal de métodos aparece cuando se carga un algoritmo del catálogo.
"""

import json

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


# Pseudocódigos del catálogo que deberían mostrar modal
CATALOG_EXAMPLES = [
    {
        "name": "Fibonacci (catálogo)",
        "source": """fibonacci(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN fibonacci(n - 1) + fibonacci(n - 2);
END""",
    },
    {
        "name": "Binary Search (catálogo)",
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
    {
        "name": "Hanoi (catálogo)",
        "source": """hanoi(n, origen, destino, auxiliar) BEGIN
    IF (n = 1) THEN BEGIN
        RETURN 1;
    END
    izquierda <- hanoi(n - 1, origen, auxiliar, destino);
    derecha <- hanoi(n - 1, auxiliar, destino, origen);
    RETURN izquierda + derecha + 1;
END""",
    },
]


def test_modal_appears_for_catalog_examples():
    """
    Test de integración: Verifica que para cada ejemplo del catálogo,
    al detectar métodos se obtienen 2+ opciones, lo que debería mostrar modal.
    """
    print("\n\n" + "=" * 100)
    print("TEST INTEGRACIÓN: Modal de Métodos Aparece para Ejemplos del Catálogo")
    print("=" * 100 + "\n")

    all_pass = True

    for example in CATALOG_EXAMPLES:
        name = example["name"]
        source = example["source"]

        print(f"\n[TEST] {name}")
        print("-" * 100)

        # Paso 1: Parsear el código
        print("  1. Parseando código...", end=" ")
        parse_response = client.post("/parse", json={"source": source})

        if parse_response.status_code != 200:
            print(f"[FAIL] HTTP {parse_response.status_code}")
            all_pass = False
            continue

        parse_data = parse_response.json()
        if not parse_data.get("ok"):
            print(
                f"[FAIL] Parse error: {parse_data.get('errors', [{}])[0].get('message')}"
            )
            all_pass = False
            continue

        print("[OK]")

        # Paso 2: Detectar tipo de algoritmo
        print("  2. Detectando tipo de algoritmo...", end=" ")
        algo_kind = parse_data.get("algorithm_kind", "unknown")
        is_recursive = algo_kind in ("recursive", "hybrid")
        print(f"[OK] Tipo: {algo_kind} {'(recursivo)' if is_recursive else '(NO recursivo)'}")

        if not is_recursive:
            print("     [SKIP] No es recursivo, modal no debería aparecer")
            continue

        # Paso 3: Detectar métodos aplicables
        print("  3. Detectando métodos aplicables...", end=" ")
        methods_response = client.post(
            "/analyze/detect-methods", json={"source": source}
        )

        if methods_response.status_code != 200:
            print(f"[FAIL] HTTP {methods_response.status_code}")
            all_pass = False
            continue

        methods_data = methods_response.json()
        if not methods_data.get("ok"):
            error_msg = methods_data.get("errors", [{}])[0].get("message")
            print(f"[FAIL] {error_msg}")
            all_pass = False
            continue

        applicable_methods = methods_data.get("applicable_methods", [])
        default_method = methods_data.get("default_method")
        recurrence_type = methods_data.get("recurrence_info", {}).get("type")

        print(f"[OK] {len(applicable_methods)} métodos")
        print(f"     Métodos: {applicable_methods}")
        print(f"     Defecto: {default_method}")
        print(f"     Tipo recurrencia: {recurrence_type}")

        # Paso 4: Verificar si modal debería aparecer
        print("  4. Verificando si modal aparece...", end=" ")
        should_show_modal = len(applicable_methods) > 1

        if should_show_modal:
            print(f"[OK] SI - Hay {len(applicable_methods)} métodos para elegir")
        else:
            print(f"[WARN] NO - Solo {len(applicable_methods)} método, modal NO aparece")
            # Pero esto es un problema si esperamos 2+
            all_pass = False

    print(f"\n{'='*100}")
    if all_pass:
        print("RESULTADO: TODOS LOS EJEMPLOS MUESTRAN MODAL CORRECTAMENTE")
    else:
        print("RESULTADO: ALGUNOS EJEMPLOS NO MUESTRAN MODAL")
    print(f"{'='*100}\n")

    assert all_pass, "Algunos ejemplos no muestran modal correctamente"


def test_detect_methods_response_structure():
    """Verifica que la respuesta del endpoint tiene la estructura correcta."""
    print("\n\nTEST: Estructura de Respuesta de detect-methods\n")

    source = """fib(n) BEGIN
    IF (n <= 1) THEN BEGIN
        RETURN n;
    END
    RETURN fib(n - 1) + fib(n - 2);
END"""

    response = client.post("/analyze/detect-methods", json={"source": source})
    data = response.json()

    print(f"Status: {response.status_code}")
    print("Response structure:")
    print(json.dumps(data, indent=2, ensure_ascii=False)[:500])

    assert response.status_code == 200, "El endpoint debe retornar 200"
    assert "ok" in data, "La respuesta debe tener campo 'ok'"
    assert data["ok"] is True, "ok debe ser True para un algoritmo válido"
    assert "applicable_methods" in data, "Debe tener 'applicable_methods'"
    assert isinstance(
        data["applicable_methods"], list
    ), "applicable_methods debe ser una lista"
    assert len(data["applicable_methods"]) >= 1, "Debe haber al menos 1 método"
    assert "default_method" in data, "Debe tener 'default_method'"
