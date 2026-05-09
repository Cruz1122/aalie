#!/usr/bin/env python3
"""
Test para binaryReductionSum - debería ser T(n) = 2T(n/2) + 1
"""
import sys
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
print("TEST: binaryReductionSum")
print("=" * 80)

client = TestClient(app)

# Detectar métodos aplicables
print("\n1. Detectando métodos aplicables...")
res_detect = client.post(
    "/analyze/detect-methods",
    json={"source": binary_reduction_code}
)
assert res_detect.status_code == 200
detect_result = res_detect.json()

print(f"\n   OK: {detect_result.get('ok')}")
if not detect_result.get('ok'):
    print(f"   Errors: {detect_result.get('errors')}")

applicable = detect_result.get("applicable_methods", [])
print(f"\n   Métodos aplicables: {applicable}")

recurrence_info = detect_result.get("recurrence_info", {})
print(f"\n   Tipo de recurrencia: {recurrence_info.get('type')}")
print(f"   Recurrencia: {recurrence_info.get('recurrence')}")

method_outcomes = recurrence_info.get("method_outcomes", {})
print(f"\n   Métodos en outcomes:")
for method, outcome in method_outcomes.items():
    print(f"     - {method}: {outcome.get('status')} (bound_kind: {outcome.get('bound_kind')})")

# Intentar con iteración
if "iteration" in applicable:
    print(f"\n2. Analizando con iteración...")
    res_analyze = client.post(
        "/analyze/open",
        json={
            "source": binary_reduction_code,
            "mode": "worst",
            "preferred_method": "iteration",
            "locale": "es"
        }
    )
    
    if res_analyze.status_code == 200:
        analyze_result = res_analyze.json()
        if analyze_result.get("ok"):
            iteration_data = analyze_result.get("totals", {}).get("iteration", {})
            print(f"   Theta: {iteration_data.get('theta')}")
            print(f"   Bound kind: {iteration_data.get('bound_kind')}")
        else:
            print(f"   Error: {analyze_result.get('errors')}")
    else:
        print(f"   Status code: {res_analyze.status_code}")
else:
    print(f"\n❌ PROBLEMA: 'iteration' no está en métodos aplicables")
    print(f"   Métodos disponibles: {applicable}")
    
    # Intentar con otro método
    if method_outcomes:
        first_applicable = None
        for method, outcome in method_outcomes.items():
            if outcome.get('status') in ['applicable', 'recommended']:
                first_applicable = method
                break
        
        if first_applicable:
            print(f"\n   Probando con {first_applicable}...")
            res_analyze = client.post(
                "/analyze/open",
                json={
                    "source": binary_reduction_code,
                    "mode": "worst",
                    "preferred_method": first_applicable,
                    "locale": "es"
                }
            )
            
            if res_analyze.status_code == 200:
                analyze_result = res_analyze.json()
                if analyze_result.get("ok"):
                    method_data = analyze_result.get("totals", {}).get(first_applicable, {})
                    print(f"   Theta: {method_data.get('theta')}")
                    print(f"   Bound kind: {method_data.get('bound_kind')}")

print("\n" + "=" * 80)
