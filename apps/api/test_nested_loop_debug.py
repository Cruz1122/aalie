# apps/api/test_nested_loop_debug.py
"""
Debug específico para bucles anidados con límites dependientes
"""

from app.analysis.iterative_analyzer import IterativeAnalyzer
from app.routers.parse import parse_source
from sympy import latex, Symbol, Integer, Sum

source = """
selectionSort(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- i + 1 TO n DO BEGIN
            x <- 1;
        END
    END
END
"""

parse_result = parse_source(source)
if parse_result.get('ok'):
    ast = parse_result['ast']
    analyzer = IterativeAnalyzer()
    
    # Ejecutar análisis
    result = analyzer.analyze(ast, 'worst')
    
    print("=" * 80)
    print("DEBUG BUCLES ANIDADOS CON LÍMITES DEPENDIENTES")
    print("=" * 80)
    print()
    
    if result.get("ok"):
        for row in result.get("byLine", []):
            if row.get('kind') == 'for' and 'j' in str(row.get('note', '')):
                print("FOR j (bucle interno):")
                print(f"  Línea: {row.get('line')}")
                print(f"  Note: {row.get('note')}")
                print(f"  Count_raw: {row.get('count_raw')}")
                print(f"  Count: {row.get('count')}")
                print()
                
                # Verificar qué debería ser
                print("Valores esperados:")
                print("  Count_raw debería ser: \\sum_{i=1}^{n-1} (-i + n + 1)")
                print("  Count debería ser: n²/2 + n/2 - 1")
                print()
                
                # Verificar el problema
                count_raw = row.get('count_raw', '')
                if '+ 3' in count_raw or '+3' in count_raw:
                    print("  ❌ PROBLEMA DETECTADO: Count_raw tiene +3 en lugar de +1")
                elif '+ 1' in count_raw or '+1' in count_raw:
                    print("  ✅ Count_raw tiene +1 (correcto)")
                
                if 'i - 1' in count_raw or 'i-1' in count_raw:
                    print("  ❌ PROBLEMA DETECTADO: Count_raw tiene i-1 en lugar de i+1")
                elif 'i + 1' in count_raw or 'i+1' in count_raw:
                    print("  ✅ Count_raw tiene i+1 (correcto)")
                
                break
        
        # Verificar líneas dentro del bucle j
        print("\nLíneas dentro del bucle j:")
        for row in result.get("byLine", []):
            if row.get('line') in [5, 6] and row.get('kind') in ['if', 'assign']:
                print(f"  Línea {row.get('line')} ({row.get('kind')}):")
                print(f"    Count_raw: {row.get('count_raw')}")
                print(f"    Count: {row.get('count')}")
                
                count_raw = row.get('count_raw', '')
                if 'i - 1' in count_raw or 'i-1' in count_raw:
                    print("    ❌ PROBLEMA: Count_raw tiene i-1 en lugar de i+1")
                elif 'i + 1' in count_raw or 'i+1' in count_raw:
                    print("    ✅ Count_raw tiene i+1 (correcto)")
                print()
                
                print("  Valores esperados:")
                print("    Count_raw debería ser: \\sum_{\\substack{i + 1 \\leq j \\leq n\\\\1 \\leq i \\leq n - 1}} 1")
                print("    Count debería ser: n(n-1)/2")
                print()

