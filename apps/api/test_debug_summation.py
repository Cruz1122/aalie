#!/usr/bin/env python3
"""
Test de diagnóstico para debug de evaluación de sumatorias anidadas.
"""

from sympy import Symbol, Sum, simplify, latex, expand, factor, summation
from app.analysis.summation_closer import SummationCloser

def test_nested_sum_with_i():
    """Test la sumatoria anidada que aparece en Bubble Sort"""
    print("=" * 80)
    print("TEST: Sumatoria Anidada con Variable Dependiente")
    print("=" * 80)
    
    # Crear símbolos
    n = Symbol('n', integer=True, positive=True)
    i = Symbol('i', integer=True)
    j = Symbol('j', integer=True)
    
    # Crear la sumatoria anidada: Sum(Sum(1, (j, 1, -i+n)), (i, 1, n-1))
    inner_sum = Sum(1, (j, 1, -i+n))
    outer_sum = Sum(inner_sum, (i, 1, n-1))
    
    print(f"\nSumatoria original:")
    print(f"  SymPy: {outer_sum}")
    print(f"  LaTeX: {latex(outer_sum)}")
    
    # Evaluar paso a paso
    print(f"\n1. Evaluando sumatoria interna:")
    inner_result = inner_sum.doit()
    print(f"   Resultado: {inner_result}")
    print(f"   LaTeX: {latex(inner_result)}")
    print(f"   Simplificado: {simplify(inner_result)}")
    
    print(f"\n2. Sustituyendo en sumatoria externa:")
    outer_with_inner = Sum(simplify(inner_result), (i, 1, n-1))
    print(f"   Expresión: {outer_with_inner}")
    print(f"   LaTeX: {latex(outer_with_inner)}")
    
    print(f"\n3. Evaluando sumatoria externa:")
    outer_result = outer_with_inner.doit()
    print(f"   Resultado: {outer_result}")
    print(f"   LaTeX: {latex(outer_result)}")
    print(f"   Simplificado: {simplify(outer_result)}")
    print(f"   Expandido: {expand(outer_result)}")
    print(f"   Factorizado: {factor(outer_result)}")
    
    # Verificar si tiene i
    if outer_result.has(i):
        print(f"\n⚠️  PROBLEMA: El resultado todavía contiene 'i'")
        print(f"   Intentando eliminar con summation():")
        try:
            result_summation = summation(-i + n, (i, 1, n-1))
            print(f"   Resultado con summation(): {result_summation}")
            print(f"   Simplificado: {simplify(result_summation)}")
            print(f"   Expandido: {expand(result_summation)}")
        except Exception as e:
            print(f"   Error: {e}")
    else:
        print(f"\n✅ El resultado NO contiene 'i'")
    
    # Evaluar la sumatoria completa directamente
    print(f"\n4. Evaluando sumatoria completa directamente:")
    full_result = outer_sum.doit()
    print(f"   Resultado: {full_result}")
    print(f"   LaTeX: {latex(full_result)}")
    print(f"   Simplificado: {simplify(full_result)}")
    print(f"   Expandido: {expand(full_result)}")
    
    if full_result.has(i):
        print(f"\n⚠️  PROBLEMA: El resultado directo todavía contiene 'i'")
    else:
        print(f"\n✅ El resultado directo NO contiene 'i'")
    
    # Probar con SummationCloser
    print(f"\n5. Probando con SummationCloser:")
    closer = SummationCloser()
    try:
        closed_latex, steps = closer.close_summation(outer_sum, "n")
        print(f"   Resultado: {closed_latex}")
        print(f"   Pasos:")
        for step in steps:
            print(f"     - {step}")
        
        if 'i' in closed_latex:
            print(f"\n⚠️  PROBLEMA: SummationCloser devolvió resultado con 'i'")
        else:
            print(f"\n✅ SummationCloser devolvió resultado sin 'i'")
    except Exception as e:
        print(f"   Error: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 80)

if __name__ == "__main__":
    test_nested_sum_with_i()

