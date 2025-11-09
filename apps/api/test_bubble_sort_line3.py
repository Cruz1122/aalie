# apps/api/test_bubble_sort_line3.py
"""
Test específico para verificar que la línea 3 del bubble sort se simplifica correctamente.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

source = """
burbuja(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- 1 TO n - i DO BEGIN
            IF (A[j] > A[j + 1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j + 1];
                A[j + 1] <- temp;
            END
        END
    END
END
"""

payload = {
    "source": source,
    "mode": "worst"
}

response = client.post("/analyze/open", json=payload)
result = response.json()

print("=" * 60)
print("VERIFICACIÓN DE LÍNEA 3 (bucle FOR interno)")
print("=" * 60)

if result.get("ok"):
    for row in result.get("byLine", []):
        if row.get("line") == 3 and row.get("kind") == "for":
            print(f"Línea: {row.get('line')}")
            print(f"Kind: {row.get('kind')}")
            print(f"Count_raw: {row.get('count_raw')}")
            print(f"Count: {row.get('count')}")
            print()
            
            # Verificar que count esté completamente simplificado
            count = row.get('count', '')
            if 'sum' in count.lower() and 'frac' not in count.lower():
                print("❌ PROBLEMA: count aún contiene sumatorias sin simplificar")
                print(f"   Count: {count}")
            elif 'frac' in count.lower() or count.replace('n', '').replace(' ', '').replace('+', '').replace('-', '').replace('*', '').replace('(', '').replace(')', '').isdigit():
                print("✅ CORRECTO: count está completamente simplificado")
                print(f"   Count: {count}")
            else:
                print(f"⚠ Count: {count}")
else:
    print("❌ Error en el análisis")
    print(result.get("errors"))

