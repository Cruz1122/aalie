#!/usr/bin/env python3
"""
Test detallado del algoritmo Bubble Sort para ver qué pasa con cada fila.
"""

import sys
import json

# Código de Bubble Sort
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

def test_bubble_sort_detail():
    print("=" * 80)
    print("ANÁLISIS DETALLADO: Bubble Sort")
    print("=" * 80)
    print(f"\nCódigo:")
    print(code)
    
    # Importar módulos necesarios
    import sys
    import os
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../packages/grammar/py')))
    
    # Parsear el código
    from grammar.build.pseudocode_parser import PseudocodeParser
    parser = PseudocodeParser()
    result = parser.parse(code)
    
    if not result["ok"]:
        print(f"\n❌ Error al parsear: {result.get('error')}")
        return
    
    ast = result["ast"]
    print(f"\n✅ Parse exitoso")
    
    # Analizar
    from app.analysis.iterative_analyzer import IterativeAnalyzer
    analyzer = IterativeAnalyzer()
    analysis_result = analyzer.analyze(ast, mode="worst")
    
    print(f"\n{'='*80}")
    print("FILAS ANALIZADAS:")
    print(f"{'='*80}")
    
    for row in analysis_result.get("byLine", []):
        line = row.get("line")
        kind = row.get("kind")
        ck = row.get("ck")
        count_raw = row.get("count_raw", "")
        count = row.get("count", "")
        
        print(f"\nLínea {line} ({kind}):")
        print(f"  C_k: {ck}")
        print(f"  count_raw: {count_raw}")
        print(f"  count: {count}")
        
        # Verificar si contiene i
        if 'i' in count:
            print(f"  ⚠️  PROBLEMA: count contiene 'i'")
        
        if 'i' in count_raw:
            print(f"  ⚠️  count_raw contiene 'i' (esto es normal si es una sumatoria anidada)")
    
    print(f"\n{'='*80}")
    print("TOTALES:")
    print(f"{'='*80}")
    
    totals = analysis_result.get("totals", {})
    t_open = totals.get("T_open", "")
    print(f"T_open: {t_open}")
    
    if 'i' in t_open:
        print(f"⚠️  PROBLEMA: T_open contiene 'i'")
    else:
        print(f"✅ T_open NO contiene 'i'")
    
    print(f"\nBig-O: {totals.get('big_o', '')}")
    print(f"Big-Omega: {totals.get('big_omega', '')}")
    print(f"Big-Theta: {totals.get('big_theta', '')}")
    
    print("\n" + "=" * 80)
    
    # Mostrar JSON completo
    print("\nJSON completo:")
    print(json.dumps(analysis_result, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    test_bubble_sort_detail()

