# apps/api/test_bubble_sort_detailed.py
"""
Test detallado para ver todas las líneas del bubble sort.
"""

from fastapi.testclient import TestClient
from app.main import app
import json

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
print("ANÁLISIS DETALLADO DE BUBBLE SORT")
print("=" * 60)
print()

if result.get("ok"):
    print(f"Total filas: {len(result.get('byLine', []))}\n")
    
    for i, row in enumerate(result.get("byLine", []), 1):
        print(f"Fila {i}:")
        print(f"  Línea código: {row.get('line')}")
        print(f"  Kind: {row.get('kind')}")
        print(f"  Ck: {row.get('ck')}")
        print(f"  Count_raw: {row.get('count_raw')}")
        print(f"  Count: {row.get('count')}")
        
        # Verificar si count tiene sumatorias sin simplificar
        count = row.get('count', '')
        if '\\sum' in count and 'frac' not in count and row.get('kind') == 'for':
            print(f"  ⚠ PROBLEMA: count tiene sumatorias sin simplificar completamente")
        elif 'frac' in count or (row.get('kind') == 'for' and 'sum' not in count.lower()):
            print(f"  ✅ Count está simplificado")
        
        print()
    
    # Mostrar T_open
    if 'totals' in result and 'T_open' in result['totals']:
        print(f"T_open: {result['totals']['T_open']}")
        print()
else:
    print("❌ Error en el análisis")
    print(json.dumps(result.get("errors"), indent=2))

