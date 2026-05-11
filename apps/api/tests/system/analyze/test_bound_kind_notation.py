#!/usr/bin/env python3
"""
Test para verificar que la notación asintótica se convierte correctamente
basada en bound_kind en los step-by-step bundles.

La idea: cuando un método tiene bound_kind != "equivalent", debería usar
la notación correspondiente (O, Ω, ≈) en lugar de Θ en la conclusión asintótica.
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

pytestmark = [pytest.mark.system, pytest.mark.fast]

client = TestClient(app)


def test_fibonacci_recursion_tree_uses_upper_bound_notation():
    """
    Fibonacci debe exponer el walkthrough del árbol de recursión y concluir con O(2^n).
    """
    fibonacci_code = """fibonacci(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN n;
  END
  RETURN fibonacci(n - 1) + fibonacci(n - 2);
END
"""
    
    # Obtener los métodos aplicables
    res_detect = client.post(
        "/analyze/detect-methods",
        json={"source": fibonacci_code}
    )
    assert res_detect.status_code == 200
    detect_result = res_detect.json()
    
    # Verificar que recursion_tree está en métodos aplicables
    assert "recursion_tree" in detect_result.get("recurrence_info", {}).get("method_outcomes", {}), \
        "recursion_tree should be applicable for Fibonacci"
    
    # Verificar que bound_kind para recursion_tree es "upper"
    rt_outcome = detect_result["recurrence_info"]["method_outcomes"]["recursion_tree"]
    assert rt_outcome.get("bound_kind") == "upper", \
        f"recursion_tree should have bound_kind='upper', but got {rt_outcome.get('bound_kind')}"
    
    # Analizar con recursion_tree
    res_analyze = client.post(
        "/analyze/open",
        json={
            "source": fibonacci_code,
            "mode": "worst",
            "preferred_method": "recursion_tree",
            "locale": "es"
        }
    )
    assert res_analyze.status_code == 200
    analyze_result = res_analyze.json()
    assert analyze_result.get("ok"), f"Analysis should succeed: {analyze_result.get('errors')}"

    step_bundle = analyze_result.get("totals", {}).get("recursion_tree", {}).get("step_by_step")
    assert step_bundle is not None, "No step_by_step bundle found"
    assert step_bundle.get("overallStatus") == "complete", step_bundle

    steps = step_bundle.get("steps", [])
    assert len(steps) == 11, f"Expected 11 steps, got {len(steps)}"

    asymptotic_step = steps[-1]
    assert asymptotic_step.get("kind") == "asymptotic_conclusion"
    assert asymptotic_step.get("status") == "complete"

    primary_latex = asymptotic_step.get("math", {}).get("primaryLatex", "")
    payload = asymptotic_step.get("payload", {})
    asymptotic_result = payload.get("asymptoticResult", "")

    has_o = "\\mathcal{O}(2^n)" in str(primary_latex) or "\\mathcal{O}(2^n)" in str(asymptotic_result)
    has_theta = "\\Theta(" in str(primary_latex) or "\\Theta(" in str(asymptotic_result)
    has_phi = "\\varphi" in str(primary_latex) or "\\varphi" in str(asymptotic_result)

    assert has_o, f"Expected O notation but got: primary_latex={primary_latex}, payload={payload}"
    assert not has_theta, f"Should not show Theta notation here: primary_latex={primary_latex}, payload={payload}"
    assert not has_phi, f"Should not show phi-based bound here: primary_latex={primary_latex}, payload={payload}"

    print("[PASS] Fibonacci recursion_tree correctly uses upper bound notation")


def test_mergesort_recursion_tree_uses_theta_notation():
    """
    MergeSort es divide-and-conquer y está totalmente soportado por recursion_tree.
    El bound_kind debería ser "equivalent" así que usa Θ notation.
    """
    mergesort_code = """mergeSort(A, izq, der) BEGIN
  IF (izq < der) THEN BEGIN
    medio <- (izq + der) / 2;
    CALL mergeSort(A, izq, medio);
    CALL mergeSort(A, medio + 1, der);
    CALL merge(A, izq, medio, der);
  END
END
"""
    
    # Obtener los métodos aplicables
    res_detect = client.post(
        "/analyze/detect-methods",
        json={"source": mergesort_code}
    )
    assert res_detect.status_code == 200
    detect_result = res_detect.json()
    
    # Verificar que recursion_tree está en métodos aplicables
    assert "recursion_tree" in detect_result.get("recurrence_info", {}).get("method_outcomes", {}), \
        "recursion_tree should be applicable for MergeSort"
    
    # Verificar el bound_kind
    rt_outcome = detect_result["recurrence_info"]["method_outcomes"]["recursion_tree"]
    print(f"bound_kind for recursion_tree: {rt_outcome.get('bound_kind')}")
    
    # Analizar con recursion_tree
    res_analyze = client.post(
        "/analyze/open",
        json={
            "source": mergesort_code,
            "mode": "worst",
            "preferred_method": "recursion_tree",
            "locale": "es"
        }
    )
    assert res_analyze.status_code == 200
    analyze_result = res_analyze.json()
    assert analyze_result.get("ok"), f"Analysis should succeed: {analyze_result.get('errors')}"
    
    # Obtener el step-by-step bundle
    step_bundle = analyze_result.get("totals", {}).get("recursion_tree", {}).get("step_by_step")
    assert step_bundle is not None, "No step_by_step bundle found"
    
    # Encontrar el paso 11 (conclusión asintótica)
    steps = step_bundle.get("steps", [])
    assert len(steps) == 11, f"Expected 11 steps, got {len(steps)}"
    
    # El último paso es la conclusión asintótica
    asymptotic_step = steps[-1]
    
    # Verificar el estado
    print(f"Last step status: {asymptotic_step.get('status')}")
    print(f"Last step kind: {asymptotic_step.get('kind')}")
    
    # Si está 'complete', verificar que usa Θ notation
    if asymptotic_step.get('status') == 'complete':
        primary_latex = asymptotic_step.get("math", {}).get("primaryLatex", "")
        payload = asymptotic_step.get("payload", {})
        
        print(f"Primary LaTeX: {primary_latex}")
        print(f"Payload: {payload}")
        
        # La notación debe tener \Theta
        has_theta = "\\Theta(" in str(primary_latex) or "\\Theta(" in str(payload)
        assert has_theta, \
            f"Expected Θ notation but got: primary_latex={primary_latex}, payload={payload}"
        
        print("[PASS] MergeSort recursion_tree correctly uses Theta notation")


def test_fibonacci_characteristic_equation_uses_theta_notation():
    """
    Verifica que characteristic_equation para Fibonacci usa Θ(φⁿ).
    Esto es porque characteristic_equation tiene bound_kind="equivalent".
    """
    fibonacci_code = """fibonacci(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN n;
  END
  RETURN fibonacci(n - 1) + fibonacci(n - 2);
END
"""
    
    # Obtener los métodos aplicables
    res_detect = client.post(
        "/analyze/detect-methods",
        json={"source": fibonacci_code}
    )
    assert res_detect.status_code == 200
    detect_result = res_detect.json()
    
    # Verificar que characteristic_equation está en métodos aplicables y tiene bound_kind="equivalent"
    char_outcome = detect_result["recurrence_info"]["method_outcomes"]["characteristic_equation"]
    assert char_outcome.get("bound_kind") == "equivalent", \
        f"characteristic_equation should have bound_kind='equivalent', but got {char_outcome.get('bound_kind')}"
    
    # Analizar con characteristic_equation
    res_analyze = client.post(
        "/analyze/open",
        json={
            "source": fibonacci_code,
            "mode": "worst",
            "preferred_method": "characteristic_equation",
            "locale": "es"
        }
    )
    assert res_analyze.status_code == 200
    analyze_result = res_analyze.json()
    assert analyze_result.get("ok"), f"Analysis should succeed: {analyze_result.get('errors')}"
    
    # Obtener el step-by-step bundle
    step_bundle = analyze_result.get("totals", {}).get("characteristic_equation", {}).get("step_by_step")
    assert step_bundle is not None, "No step_by_step bundle found"
    
    # Encontrar el paso 12 (conclusión asintótica)
    steps = step_bundle.get("steps", [])
    assert len(steps) == 12, f"Expected 12 steps, got {len(steps)}"
    
    # El último paso es la conclusión asintótica
    asymptotic_step = steps[-1]
    
    print(f"Last step status: {asymptotic_step.get('status')}")
    print(f"Last step kind: {asymptotic_step.get('kind')}")
    
    # Verificar que usa Theta notation
    primary_latex = asymptotic_step.get("math", {}).get("primaryLatex", "")
    payload = asymptotic_step.get("payload", {})
    
    print(f"Primary LaTeX: {primary_latex}")
    print(f"Payload keys: {payload.keys() if isinstance(payload, dict) else 'not a dict'}")
    
    # La notación debe tener \Theta
    has_theta = "\\Theta(" in str(primary_latex) or "\\Theta(" in str(payload)
    assert has_theta, \
        f"Expected Θ notation but got: primary_latex={primary_latex}, payload={payload}"
    
    print("[PASS] Fibonacci characteristic_equation correctly uses Theta notation")

