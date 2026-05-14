"""
Test para identificar qué nombres de función funcionan en el parser.
"""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

# Probamos diferentes nombres de función
FUNCTION_NAMES_TEST = [
    ("sort", "sort(A[n]) BEGIN RETURN 0; END"),
    ("sortArray", "sortArray(A[n]) BEGIN RETURN 0; END"),
    ("mergeSort", "mergeSort(A[n]) BEGIN RETURN 0; END"),
    ("quickSort", "quickSort(A[n]) BEGIN RETURN 0; END"),
    ("search", "search(A[n], x) BEGIN RETURN 0; END"),
    ("binarySearch", "binarySearch(A[n], x) BEGIN RETURN 0; END"),
    ("fib", "fib(n) BEGIN RETURN 0; END"),
    ("fibonacci", "fibonacci(n) BEGIN RETURN 0; END"),
    ("power", "power(x, n) BEGIN RETURN 0; END"),
    ("exp", "exp(x, n) BEGIN RETURN 0; END"),
    ("foo", "foo(n) BEGIN RETURN 0; END"),
    ("bar", "bar(n) BEGIN RETURN 0; END"),
    ("test", "test(n) BEGIN RETURN 0; END"),
    ("fact", "fact(n) BEGIN IF (n = 0) THEN RETURN 1; END RETURN n * fact(n - 1); END"),
    ("factorial", "factorial(n) BEGIN IF (n = 0) THEN RETURN 1; END RETURN n * factorial(n - 1); END"),
]

def test_which_function_names_work():
    """Identifica qué nombres de función son aceptados por el parser."""
    
    print("\n\nTEST: Qué nombres de función acepta el parser\n")
    print("=" * 80)
    
    working = []
    not_working = []
    
    for name, source in FUNCTION_NAMES_TEST:
        print(f"{name:<20}", end=" → ")
        
        response = client.post(
            "/analyze/detect-methods",
            json={"source": source}
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                methods = data.get("applicable_methods", [])
                print(f"[OK] {len(methods)} metodos detectados")
                working.append((name, len(methods)))
            else:
                error = data.get("errors", [{}])[0].get("message", "")
                print(f"[FAIL] Parse: {error[:40]}")
                not_working.append((name, error[:40]))
        else:
            print(f"[HTTP {response.status_code}]")
            not_working.append((name, f"HTTP {response.status_code}"))
    
    print("\n" + "=" * 80)
    print("\nRESULTADOS:")
    print(f"Nombres que funcionan: {len(working)}")
    print(f"  {[name for name, _ in working]}")
    print(f"\nNombres que NO funcionan: {len(not_working)}")
    for name, reason in not_working:
        print(f"  - {name}: {reason}")

if __name__ == "__main__":
    test_which_function_names_work()
