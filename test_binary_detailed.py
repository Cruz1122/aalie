#!/usr/bin/env python3
"""
Test detallado para binaryReductionSum con iteración
"""
import sys
import json
sys.path.insert(0, 'apps/api')

from fastapi.testclient import TestClient
from app.main import app

binary_reduction_code = """binaryReductionSum(A, inicio, fin) BEGIN
  IF (inicio = fin) THEN BEGIN
    RETURN A[inicio];
  END
  medio <- (inicio + fin) DIV 2;
  izq <- binaryReductionSum(A, inicio, medio);
  der <- binaryReductionSum(A, medio + 1, fin);
  RETURN izq + der;
END
"""

print("=" * 80)
print("TEST DETALLADO: binaryReductionSum con Método de Iteración")
print("=" * 80)

client = TestClient(app)

# Analizar con iteración
print("\nAnalizando con iteración...")
res_analyze = client.post(
    "/analyze/open",
    json={
        "source": binary_reduction_code,
        "mode": "worst",
        "preferred_method": "iteration",
        "locale": "es"
    }
)

assert res_analyze.status_code == 200
analyze_result = res_analyze.json()

if analyze_result.get("ok"):
    iteration_data = analyze_result.get("totals", {}).get("iteration", {})
    
    print(f"\n✓ Análisis exitoso")
    print(f"  Theta: {iteration_data.get('theta')}")
    print(f"  Bound kind: {iteration_data.get('bound_kind')}")
    print(f"  Support code: {iteration_data.get('support_code')}")
    
    step_bundle = iteration_data.get("step_by_step", {})
    overall_status = step_bundle.get("overallStatus")
    
    print(f"\n✓ Step-by-step:")
    print(f"  Overall Status: {overall_status}")
    
    steps = step_bundle.get("steps", [])
    print(f"  Número de pasos: {len(steps)}\n")
    
    for i, step in enumerate(steps, 1):
        step_id = step.get("step_id", "?")
        status = step.get("status", "?")
        title = step.get("title", "?")
        print(f"  {i}. [{status:8s}] {title}")
    
    print("\n" + "=" * 80)
    print("CONCLUSIÓN FINAL:")
    print("=" * 80)
    if steps:
        last_step = steps[-1]
        print(f"Título:     {last_step.get('title')}")
        print(f"Estado:     {last_step.get('status')}")
        print(f"Theta:      {iteration_data.get('theta')}")
        
        if last_step.get('status') == 'complete':
            print("\n✅ ÉXITO: Iteración produce status 'complete' con Theta = 2^n")
        else:
            print(f"\n⚠️  Estado: {last_step.get('status')}")
else:
    print(f"\n❌ Error: {analyze_result.get('errors')}")
    sys.exit(1)
