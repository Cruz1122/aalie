#!/usr/bin/env python3
"""
Test simple del algoritmo Bubble Sort usando el endpoint HTTP.
"""

import json
import httpx

BASE_URL = "http://api:8000"  # Usar nombre del servicio docker

code = """
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

def test_bubble_simple():
    print("=" * 80)
    print("ANÁLISIS DETALLADO: Bubble Sort (vía endpoint HTTP)")
    print("=" * 80)
    print(f"\nCódigo:")
    print(code)
    
    # Primero, parsear
    try:
        with httpx.Client() as client:
            # Nota: el endpoint parse está en /grammar/parse y recibe "source" en el body
            parse_response = client.post(f"{BASE_URL}/grammar/parse", json={"source": code})
            if parse_response.status_code != 200:
                print(f"\n❌ Error al parsear: {parse_response.text}")
                return
            
            parse_result = parse_response.json()
            if not parse_result.get("ok"):
                print(f"\n❌ Parse falló: {parse_result.get('error')}")
                return
            
            print(f"\n✅ Parse exitoso")
            
            # Analizar - el endpoint analyze/open recibe "source" no "ast"
            analyze_response = client.post(f"{BASE_URL}/analyze/open", json={
                "source": code,
                "mode": "worst"
            })
    except Exception as e:
        print(f"\n❌ Error de conexión: {e}")
        import traceback
        traceback.print_exc()
        return
    
    if analyze_response.status_code != 200:
        print(f"\n❌ Error al analizar: {analyze_response.text}")
        return
    
    analysis_result = analyze_response.json()
    
    print(f"\n{'='*80}")
    print("FILAS ANALIZADAS:")
    print(f"{'='*80}")
    
    for row in analysis_result.get("byLine", []):
        line = row.get("line")
        kind = row.get("kind")
        ck = row.get("ck")
        count_raw = row.get("count_raw", "")
        count = row.get("count", "")
        note = row.get("note", "")
        
        print(f"\nLínea {line} ({kind}):")
        print(f"  C_k: {ck}")
        print(f"  Nota: {note}")
        print(f"  count_raw: {count_raw[:100]}")  # Truncar si es muy largo
        print(f"  count: {count[:100]}")
        
        # Verificar si contiene i, j, k
        has_i = 'i' in count and ('i +' in count or 'i n' in count or 'i^' in count or '- i' in count)
        has_j = 'j' in count and ('j +' in count or 'j n' in count or 'j^' in count or '- j' in count)
        has_k = 'k' in count and ('k +' in count or 'k n' in count or 'k^' in count or '- k' in count)
        
        if has_i:
            print(f"  ⚠️  PROBLEMA: count contiene variable 'i'")
        if has_j:
            print(f"  ⚠️  PROBLEMA: count contiene variable 'j'")
        if has_k:
            print(f"  ⚠️  PROBLEMA: count contiene variable 'k'")
    
    print(f"\n{'='*80}")
    print("TOTALES:")
    print(f"{'='*80}")
    
    totals = analysis_result.get("totals", {})
    t_open = totals.get("T_open", "")
    print(f"T_open: {t_open}")
    
    # Verificar si contiene i, j, k
    has_i = 'i' in t_open and ('i +' in t_open or 'i n' in t_open or 'i^' in t_open or '- i' in t_open)
    has_j = 'j' in t_open and ('j +' in t_open or 'j n' in t_open or 'j^' in t_open or '- j' in t_open)
    has_k = 'k' in t_open and ('k +' in t_open or 'k n' in t_open or 'k^' in t_open or '- k' in t_open)
    
    if has_i or has_j or has_k:
        print(f"⚠️  PROBLEMA: T_open contiene variables de iteración:")
        if has_i:
            print(f"  - Contiene 'i'")
        if has_j:
            print(f"  - Contiene 'j'")
        if has_k:
            print(f"  - Contiene 'k'")
    else:
        print(f"✅ T_open NO contiene variables de iteración")
    
    print(f"\nBig-O: {totals.get('big_o', '')}")
    print(f"Big-Omega: {totals.get('big_omega', '')}")
    print(f"Big-Theta: {totals.get('big_theta', '')}")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_bubble_simple()

