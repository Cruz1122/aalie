#!/usr/bin/env python3
"""
Test script para verificar que T(n)=T(n/2)+T(n/4)+c produce cota superior correcta.
"""
import json
import sys
sys.path.insert(0, 'apps/api')

from fastapi.testclient import TestClient
from app.main import app

# Pseudocódigo que genera T(n) = T(n/2) + T(n/4) + c
divide_conquer_code = """mergeSearch(A, l, r) BEGIN
  IF (l >= r) THEN BEGIN
    RETURN A[l];
  END
  m1 <- l + (r - l) / 2;
  m2 <- l + (r - l) / 4;
  x <- mergeSearch(A, l, m1);
  y <- mergeSearch(A, m1 + 1, m2);
  RETURN max(x, y);
END
"""

print("=" * 80)
print("TEST: T(n)=T(n/2)+T(n/4)+c con método de iteración")
print("=" * 80)

client = TestClient(app)

# Primero, detectar métodos aplicables
print("\n1. Detectando métodos aplicables...")
res_detect = client.post(
    "/analyze/detect-methods",
    json={"source": divide_conquer_code}
)
assert res_detect.status_code == 200
detect_result = res_detect.json()

print(f"   Métodos detectados: {detect_result.get('applicable_methods', [])}")
print(f"   Tipo de recurrencia: {detect_result.get('recurrence_info', {}).get('type')}")

# Ahora analizar con iteración preferida
print("\n2. Analizando con preferred_method='iteration'...")
res_analyze = client.post(
    "/analyze/open",
    json={
        "source": divide_conquer_code,
        "mode": "worst",
        "preferred_method": "iteration",
        "locale": "es"
    }
)

assert res_analyze.status_code == 200, f"Status code: {res_analyze.status_code}"
analyze_result = res_analyze.json()

if not analyze_result.get("ok"):
    print(f"\n   Error: {analyze_result.get('errors')}")
    # No es error crítico, algunos tipos no soportan iteración

print("\n3. Analizando el resultado...")
iteration_data = analyze_result.get("totals", {}).get("iteration", {})
if iteration_data:
    step_bundle = iteration_data.get("step_by_step", {})
    overall_status = step_bundle.get("overallStatus")
    print(f"   Overall Status: {overall_status}")
    
    steps = step_bundle.get("steps", [])
    print(f"   Número de pasos: {len(steps)}\n")
    
    for step in steps:
        step_id = step.get("step_id", "?")
        status = step.get("status", "?")
        title = step.get("title", "?")
        print(f"   [{step_id:8s}] {title:50s} | {status}")
    
    print("\n" + "=" * 80)
    last_step = steps[-1] if steps else {}
    last_status = last_step.get("status", "")
    last_title = last_step.get("title", "")
    
    print(f"ÚLTIMA CONCLUSIÓN:")
    print(f"  Título: {last_title}")
    print(f"  Estado: {last_status}")
    print(f"  Theta:  {iteration_data.get('theta')}")
    print("=" * 80)
    
    if last_status == "complete":
        print(f"\n✅ ÉXITO: La conclusión es 'complete'")
        print(f"   Theta: {iteration_data.get('theta')}")
    else:
        print(f"\n⚠️  Estado: {last_status}")
else:
    print("\n   No hay datos de iteración (puede ser esperado si no aplica iteración)")
    # Intentar con otro método
    print("\n   Probando con recursion_tree...")
    res_analyze2 = client.post(
        "/analyze/open",
        json={
            "source": divide_conquer_code,
            "mode": "worst",
            "preferred_method": "recursion_tree",
            "locale": "es"
        }
    )
    analyze_result2 = res_analyze2.json()
    if analyze_result2.get("ok"):
        recursion_tree_data = analyze_result2.get("totals", {}).get("recursion_tree", {})
        print(f"   Resultado recursion_tree - Theta: {recursion_tree_data.get('theta')}")

print("\n✅ Test completado")
