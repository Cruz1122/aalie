#!/usr/bin/env python3
"""
Test para verificar que la notación asintótica se convierte correctamente
basada en bound_kind en los step-by-step bundles.
"""

from apps.api.app.modules.analysis.parsers.pseudocode_parser import PseudocodeParser
from apps.api.app.modules.analysis.analyzers.recursive import RecursiveAnalyzer

# Test case: Fibonacci con recursion_tree
fibonacci_code = """
PROCEDURE fibonacci(n) BEGIN
  IF n <= 1 THEN RETURN n
  RETURN fibonacci(n-1) + fibonacci(n-2)
END
"""

def test_fibonacci_recursion_tree_uses_big_o_notation():
    """
    Verifica que recursion_tree para Fibonacci usa O(φⁿ) y no Θ(φⁿ).
    Esto es porque recursion_tree para linear_shift tiene bound_kind="upper".
    """
    parser = PseudocodeParser()
    analyzer = RecursiveAnalyzer(locale="es")
    
    # Parse
    parse_result = parser.parse(fibonacci_code)
    assert parse_result["ok"], f"Parse error: {parse_result.get('errors', [])}"
    ast = parse_result["ast"]
    
    # Analyze con método preferido recursion_tree
    analyze_result = analyzer.analyze(ast, preferred_method="recursion_tree")
    assert analyze_result["ok"], f"Analyze error: {analyze_result.get('errors', [])}"
    
    # Verificar que tenemos el step_by_step bundle
    recurrence = analyze_result.get("recurrence", {})
    step_bundle = analyze_result.get("recursion_tree", {}).get("step_by_step")
    
    assert step_bundle is not None, "No step_by_step bundle found"
    
    # Encontrar el paso 11 (conclusión asintótica)
    steps = step_bundle.get("steps", [])
    asymptotic_step = None
    for step in steps:
        if step.get("step_id") == "rt_s11":
            asymptotic_step = step
            break
    
    assert asymptotic_step is not None, "No asymptotic conclusion step found"
    
    # Verificar que usa O notation, no Theta
    primary_latex = asymptotic_step.get("primary_latex", "")
    payload = asymptotic_step.get("payload", {})
    asymptotic_result = payload.get("asymptoticResult", "")
    
    print(f"Primary LaTeX: {primary_latex}")
    print(f"Asymptotic Result: {asymptotic_result}")
    print(f"Step Status: {asymptotic_step.get('status')}")
    
    # La notación debe tener \mathcal{O}( no \Theta(
    assert "\\mathcal{O}(" in primary_latex or "\\mathcal{O}(" in asymptotic_result, \
        f"Expected O notation but got: primary_latex={primary_latex}, asymptotic_result={asymptotic_result}"
    
    # No debe tener \Theta
    assert "\\Theta(" not in primary_latex and "\\Theta(" not in asymptotic_result, \
        f"Should not have Θ notation but got: primary_latex={primary_latex}, asymptotic_result={asymptotic_result}"
    
    print("✅ Test passed: Fibonacci recursion_tree correctly uses O(φⁿ) notation!")
    return True


def test_fibonacci_characteristic_equation_uses_theta_notation():
    """
    Verifica que characteristic_equation para Fibonacci usa Θ(φⁿ).
    Esto es porque characteristic_equation tiene bound_kind="equivalent".
    """
    parser = PseudocodeParser()
    analyzer = RecursiveAnalyzer(locale="es")
    
    # Parse
    parse_result = parser.parse(fibonacci_code)
    assert parse_result["ok"], f"Parse error: {parse_result.get('errors', [])}"
    ast = parse_result["ast"]
    
    # Analyze con método preferido characteristic_equation
    analyze_result = analyzer.analyze(ast, preferred_method="characteristic_equation")
    assert analyze_result["ok"], f"Analyze error: {analyze_result.get('errors', [])}"
    
    # Verificar que tenemos el step_by_step bundle
    step_bundle = analyze_result.get("characteristic_equation", {}).get("step_by_step")
    
    assert step_bundle is not None, "No step_by_step bundle found"
    
    # Encontrar el paso 12 (conclusión asintótica)
    steps = step_bundle.get("steps", [])
    asymptotic_step = None
    for step in steps:
        if step.get("step_id") == "ceq_s12":
            asymptotic_step = step
            break
    
    assert asymptotic_step is not None, "No asymptotic conclusion step found"
    
    # Verificar que usa Theta notation
    primary_latex = asymptotic_step.get("primary_latex", "")
    payload = asymptotic_step.get("payload", {})
    theta = payload.get("theta", "")
    
    print(f"Primary LaTeX: {primary_latex}")
    print(f"Theta: {theta}")
    
    # La notación debe tener \Theta
    assert "\\Theta(" in primary_latex or "\\Theta(" in theta, \
        f"Expected Θ notation but got: primary_latex={primary_latex}, theta={theta}"
    
    print("✅ Test passed: Fibonacci characteristic_equation correctly uses Θ(φⁿ) notation!")
    return True


if __name__ == "__main__":
    print("Testing bound_kind notation conversion...\n")
    
    try:
        print("Test 1: Fibonacci recursion_tree uses O notation")
        print("-" * 60)
        test_fibonacci_recursion_tree_uses_big_o_notation()
        print()
        
        print("Test 2: Fibonacci characteristic_equation uses Θ notation")
        print("-" * 60)
        test_fibonacci_characteristic_equation_uses_theta_notation()
        print()
        
        print("=" * 60)
        print("✅ All tests passed!")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"❌ Test failed: {e}")
        exit(1)
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        exit(1)
