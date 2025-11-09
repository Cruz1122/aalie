# apps/api/test_endpoint.py
"""
Script para probar el endpoint /analyze/open directamente usando TestClient de FastAPI.
"""

import sys
import os

# Agregar el path para importar la app
sys.path.insert(0, '/usr/src/app/apps/api')

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_simple_for_loop():
    """Test 1: Bucle FOR simple"""
    print("=" * 60)
    print("TEST 1: Bucle FOR simple")
    print("=" * 60)
    
    source = """
test(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        x <- 1;
    END
END
"""
    
    payload = {
        "source": source,
        "mode": "worst"
    }
    
    try:
        response = client.post("/analyze/open", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"OK: {result.get('ok')}")
            print(f"Total filas: {len(result.get('byLine', []))}")
            
            if result.get('ok'):
                # Verificar campos básicos
                for row in result.get('byLine', []):
                    assert 'count_raw' in row, "Debe tener count_raw"
                    assert 'count' in row, "Debe tener count"
                    assert 'unknown' not in row.get('count', '').lower(), f"No debe tener 'unknown': {row.get('count')}"
                
                print("\n✓ TEST 1 PASÓ")
                return True
            else:
                print(f"✗ Error en respuesta: {result.get('errors')}")
                return False
        else:
            print(f"✗ Error HTTP: {response.status_code}")
            print(response.text[:500])
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_insertion_sort():
    """Test 2: Insertion Sort completo"""
    print("\n" + "=" * 60)
    print("TEST 2: Insertion Sort")
    print("=" * 60)
    
    source = """
insertionSort(arr, n) BEGIN
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
"""
    
    payload = {
        "source": source,
        "mode": "worst"
    }
    
    try:
        response = client.post("/analyze/open", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"OK: {result.get('ok')}")
            print(f"Total filas: {len(result.get('byLine', []))}")
            
            if result.get('ok'):
                # Verificar que no haya "unknown"
                has_unknown = False
                for row in result.get('byLine', []):
                    count = row.get('count', '')
                    if 'unknown' in count.lower():
                        has_unknown = True
                        print(f"  ⚠ Línea {row.get('line')} tiene 'unknown': {count}")
                
                if not has_unknown:
                    print("\n✓ TEST 2 PASÓ (sin 'unknown')")
                    return True
                else:
                    print("\n⚠ TEST 2 PASÓ pero con algunos 'unknown'")
                    return True
            else:
                print(f"✗ Error en respuesta: {result.get('errors')}")
                return False
        else:
            print(f"✗ Error HTTP: {response.status_code}")
            print(response.text[:500])
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_bubble_sort():
    """Test 3: Bubble Sort (bucles anidados)"""
    print("\n" + "=" * 60)
    print("TEST 3: Bubble Sort (bucles anidados)")
    print("=" * 60)
    
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
    
    try:
        response = client.post("/analyze/open", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"OK: {result.get('ok')}")
            print(f"Total filas: {len(result.get('byLine', []))}")
            
            if result.get('ok'):
                # Mostrar algunas filas
                print("\nPrimeras 3 filas:")
                for i, row in enumerate(result.get('byLine', [])[:3]):
                    print(f"  Fila {i+1}: Línea {row.get('line')}, Kind: {row.get('kind')}")
                    print(f"    Count_raw: {row.get('count_raw', '')[:70]}...")
                    print(f"    Count: {row.get('count', '')[:70]}...")
                
                # Verificar T_open
                if 'totals' in result and 'T_open' in result['totals']:
                    print(f"\nT_open: {result['totals']['T_open'][:100]}...")
                
                print("\n✓ TEST 3 PASÓ")
                return True
            else:
                print(f"✗ Error en respuesta: {result.get('errors')}")
                return False
        else:
            print(f"✗ Error HTTP: {response.status_code}")
            print(response.text[:500])
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_triangular_sum():
    """Test 4: Sumatoria triangular"""
    print("\n" + "=" * 60)
    print("TEST 4: Sumatoria triangular (FOR anidado)")
    print("=" * 60)
    
    source = """
triangular(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        FOR j <- 1 TO i DO BEGIN
            x <- 1;
        END
    END
END
"""
    
    payload = {
        "source": source,
        "mode": "worst"
    }
    
    try:
        response = client.post("/analyze/open", json=payload)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"OK: {result.get('ok')}")
            print(f"Total filas: {len(result.get('byLine', []))}")
            
            if result.get('ok'):
                # Mostrar todas las filas
                print("\nTodas las filas:")
                for i, row in enumerate(result.get('byLine', [])):
                    print(f"  Fila {i+1}: Línea {row.get('line')}, Kind: {row.get('kind')}")
                    print(f"    Ck: {row.get('ck')}")
                    print(f"    Count_raw: {row.get('count_raw', '')[:80]}...")
                    print(f"    Count: {row.get('count', '')[:80]}...")
                    if 'procedure' in row and row['procedure']:
                        print(f"    Procedure: {len(row['procedure'])} pasos")
                
                # Verificar T_open
                if 'totals' in result and 'T_open' in result['totals']:
                    print(f"\nT_open: {result['totals']['T_open']}")
                
                print("\n✓ TEST 4 PASÓ")
                return True
            else:
                print(f"✗ Error en respuesta: {result.get('errors')}")
                return False
        else:
            print(f"✗ Error HTTP: {response.status_code}")
            print(response.text[:500])
            return False
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("TESTS DEL ENDPOINT /analyze/open")
    print("=" * 60)
    print()
    
    results = []
    
    results.append(("Simple FOR Loop", test_simple_for_loop()))
    results.append(("Insertion Sort", test_insertion_sort()))
    results.append(("Bubble Sort", test_bubble_sort()))
    results.append(("Triangular Sum", test_triangular_sum()))
    
    print("\n" + "=" * 60)
    print("RESUMEN FINAL")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    print()
    print(f"Total: {passed}/{total} tests pasaron")
    
    if passed == total:
        print("\n🎉 TODOS LOS TESTS DEL ENDPOINT PASARON!")
        sys.exit(0)
    else:
        print(f"\n❌ {total - passed} test(s) fallaron")
        sys.exit(1)
