#!/usr/bin/env python3
"""
Test para debuggear las sumatorias anidadas del cuerpo del FOR j.
"""

from sympy import Symbol, Sum, simplify, latex, summation
from app.analysis.summation_closer import SummationCloser

def test_nested_double_sum():
    print("=" * 80)
    print("TEST: Sumatoria Anidada Doble (Líneas 5-8 del Bubble Sort)")
    print("=" * 80)
    
    # Las líneas 5-8 tienen count_raw: \sum_{\substack{1 \leq i \leq n - 1\\1 \leq j \leq - i + n}} 1
    # Esto es: Sum(1, (i, 1, n-1), (j, 1, -i+n))
    # Es una sumatoria doble anidada
    
    n = Symbol('n', integer=True, positive=True)
    i = Symbol('i', integer=True)
    j = Symbol('j', integer=True)
    
    print("\n1. Creando la sumatoria doble anidada:")
    print("   Sum(1, (i, 1, n-1), (j, 1, -i+n))")
    
    # En SymPy, Sum con múltiples límites es una forma compacta de sumatorias anidadas
    nested_sum = Sum(1, (i, 1, n-1), (j, 1, -i+n))
    print(f"   SymPy: {nested_sum}")
    print(f"   LaTeX: {latex(nested_sum)}")
    
    print("\n2. Evaluando directamente con .doit():")
    result = nested_sum.doit()
    print(f"   Resultado: {result}")
    print(f"   Simplificado: {simplify(result)}")
    print(f"   Contiene 'i': {result.has(i)}")
    print(f"   Contiene 'j': {result.has(j)}")
    
    print("\n3. Evaluando paso a paso (sumatoria interna primero):")
    # Sumatoria interna: Sum(1, (j, 1, -i+n))
    inner = Sum(1, (j, 1, -i+n))
    print(f"   Sumatoria interna: {inner}")
    inner_result = inner.doit()
    print(f"   Resultado interno: {inner_result}")
    print(f"   Simplificado: {simplify(inner_result)}")
    
    # Sumatoria externa: Sum(inner_result, (i, 1, n-1))
    outer = Sum(simplify(inner_result), (i, 1, n-1))
    print(f"\n   Sumatoria externa: {outer}")
    outer_result = outer.doit()
    print(f"   Resultado externo: {outer_result}")
    print(f"   Simplificado: {simplify(outer_result)}")
    print(f"   Contiene 'i': {simplify(outer_result).has(i)}")
    print(f"   Contiene 'j': {simplify(outer_result).has(j)}")
    
    print("\n4. Usando SummationCloser:")
    closer = SummationCloser()
    closed_latex, steps = closer.close_summation(nested_sum, "n")
    print(f"   Resultado: {closed_latex}")
    print(f"   Contiene 'i': {'i' in closed_latex}")
    print(f"   Contiene 'j': {'j' in closed_latex}")
    
    print(f"\n   Pasos:")
    for step in steps:
        print(f"     {step}")
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_nested_double_sum()

