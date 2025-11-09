# apps/api/test_selection_sort_debug.py
"""
Debug específico para Selection Sort
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

source = """
selectionSort(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        min_idx <- i;
        FOR j <- i + 1 TO n DO BEGIN
            IF (A[j] < A[min_idx]) THEN BEGIN
                min_idx <- j;
            END
        END
        IF (min_idx != i) THEN BEGIN
            temp <- A[i];
            A[i] <- A[min_idx];
            A[min_idx] <- temp;
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

print("=" * 80)
print("DEBUG SELECTION SORT")
print("=" * 80)

if result.get("ok"):
    for i, row in enumerate(result.get("byLine", []), 1):
        print(f"\nFila {i}:")
        print(f"  Línea código: {row.get('line')}")
        print(f"  Kind: {row.get('kind')}")
        print(f"  Ck: {row.get('ck')}")
        print(f"  Note: {row.get('note')}")
        print(f"  Count_raw: {row.get('count_raw')}")
        print(f"  Count: {row.get('count')}")
        
        # Verificar línea 4 específicamente
        if row.get('line') == 4 and row.get('kind') == 'for':
            print(f"\n  ⚠ LÍNEA 4 (FOR j) - VERIFICACIÓN:")
            note = row.get('note', '')
            if 'i - 1' in note:
                print(f"    ❌ ERROR: La nota contiene 'i - 1' pero debería ser 'i + 1'")
            elif 'i + 1' in note:
                print(f"    ✅ CORRECTO: La nota contiene 'i + 1'")
            else:
                print(f"    ⚠ La nota no contiene ni 'i - 1' ni 'i + 1': {note}")
            
            count_raw = row.get('count_raw', '')
            # Verificar si count_raw tiene el dominio correcto
            if 'i - 1' in count_raw or 'i-1' in count_raw:
                print(f"    ❌ ERROR: count_raw contiene 'i - 1' o 'i-1'")
            elif 'i + 1' in count_raw or 'i+1' in count_raw:
                print(f"    ✅ CORRECTO: count_raw contiene 'i + 1' o 'i+1'")
            
            # Verificar el resultado esperado
            expected_count = "\\frac{n^{2}}{2} + \\frac{n}{2} - 1"  # o similar
            count = row.get('count', '')
            print(f"    Count actual: {count}")
            print(f"    Count esperado (aproximado): n²/2 + n/2 - 1")
else:
    print("❌ Error en el análisis")
    print(result.get("errors"))

