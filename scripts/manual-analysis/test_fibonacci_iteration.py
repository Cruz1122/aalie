#!/usr/bin/env python3
"""
Test script para verificar que Fibonacci produce una cota superior completa
con el método de iteración (no parcial).
"""
import json
import sys
sys.path.insert(0, 'apps/api')

from fastapi.testclient import TestClient
from app.main import app

fibonacci_code = """fibonacci(n) BEGIN
  IF (n <= 1) THEN BEGIN
    RETURN 1;
  END
  RETURN fibonacci(n - 1) + fibonacci(n - 2);
END
"""

print("=" * 80)
print("TEST: Fibonacci con método de iteración")
print("=" * 80)

client = TestClient(app)

# Primero, detectar métodos aplicables
print("\n1. Detectando métodos aplicables...")
res_detect = client.post(
    "/analyze/detect-methods",
    json={"source": fibonacci_code}
)
assert res_detect.status_code == 200
detect_result = res_detect.json()

print(f"   Métodos detectados: {detect_result.get('applicable_methods', [])}")

if "iteration" not in detect_result.get("applicable_methods", []):
    print("   ⚠️  Iteración no está en métodos aplicables, continuando con análisis...")

# Ahora analizar con iteración preferida
print("\n2. Analizando con preferred_method='iteration'...")
res_analyze = client.post(
    "/analyze/open",
    json={
        "source": fibonacci_code,
        "mode": "worst",
        "preferred_method": "iteration",
        "locale": "es"
    }
)

assert res_analyze.status_code == 200, f"Status code: {res_analyze.status_code}"
analyze_result = res_analyze.json()

if not analyze_result.get("ok"):
    print(f"\n❌ Error: {analyze_result.get('errors')}")
    sys.exit(1)

print("\n3. Analizando el step_by_step...")
iteration_data = analyze_result.get("totals", {}).get("iteration", {})
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

# Verificar que la conclusión asintótica sea "complete"
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
    print(f"\n✅ ÉXITO: La conclusión asintótica es 'complete' (no 'partial')")
    print(f"   Theta: {iteration_data.get('theta')}")
    sys.exit(0)
else:
    print(f"\n❌ FALLO: La conclusión sigue siendo '{last_status}' en lugar de 'complete'")
    sys.exit(1)

