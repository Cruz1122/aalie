#!/usr/bin/env python3
"""
Test para debuggear el problema específico de la línea 4 del Bubble Sort.
"""

from sympy import Symbol, Sum, simplify, latex, summation
from app.analysis.summation_closer import SummationCloser

def test_line_4_summation():
    print("=" * 80)
    print("TEST: Sumatoria de la Línea 4 (Cabecera FOR j)")
    print("=" * 80)
    
    # La línea 4 tiene count_raw: \sum_{j=1}^{n-1} (-i + n + 1)
    # Pero esto está INCORRECTO. Debería ser: \sum_{i=1}^{n-1} (n - i + 1)
    
    n = Symbol('n', integer=True, positive=True)
    i = Symbol('i', integer=True)
    j = Symbol('j', integer=True)
    
    print("\n1. Evaluando la sumatoria INCORRECTA (como aparece en el bug):")
    print("   \\sum_{j=1}^{n-1} (-i + n + 1)")
    
    wrong_sum = Sum(-i + n + 1, (j, 1, n-1))
    print(f"   SymPy: {wrong_sum}")
    
    wrong_result = wrong_sum.doit()
    print(f"   Resultado: {wrong_result}")
    print(f"   Simplificado: {simplify(wrong_result)}")
    print(f"   Contiene 'i': {wrong_result.has(i)}")
    
    print("\n2. Evaluando la sumatoria CORRECTA (como debería ser):")
    print("   \\sum_{i=1}^{n-1} (n - i + 1)")
    
    correct_sum = Sum(n - i + 1, (i, 1, n-1))
    print(f"   SymPy: {correct_sum}")
    
    correct_result = correct_sum.doit()
    print(f"   Resultado: {correct_result}")
    print(f"   Simplificado: {simplify(correct_result)}")
    print(f"   Contiene 'i': {correct_result.has(i)}")
    
    print("\n3. Usando SummationCloser con la sumatoria INCORRECTA:")
    closer = SummationCloser()
    wrong_latex, wrong_steps = closer.close_summation(wrong_sum, "n")
    print(f"   Resultado: {wrong_latex}")
    if 'i' in wrong_latex:
        print(f"   ⚠️  PROBLEMA: Resultado contiene 'i'")
    
    print("\n4. Usando SummationCloser con la sumatoria CORRECTA:")
    correct_latex, correct_steps = closer.close_summation(correct_sum, "n")
    print(f"   Resultado: {correct_latex}")
    if 'i' in correct_latex:
        print(f"   ⚠️  PROBLEMA: Resultado contiene 'i'")
    else:
        print(f"   ✅ Resultado NO contiene 'i'")
    
    print("\n" + "=" * 80)
    print("CONCLUSIÓN:")
    print("=" * 80)
    print("El problema NO es en SummationCloser.")
    print("El problema es que el count_raw que se está generando está usando")
    print("la variable de sumatoria incorrecta (j en lugar de i).")
    print("Esto ocurre en la construcción del count_raw en ForVisitor.")
    print("=" * 80)

if __name__ == "__main__":
    test_line_4_summation()

