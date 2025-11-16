#!/usr/bin/env python3
"""
Script de prueba para el endpoint de análisis recursivo.
Prueba con un algoritmo merge sort simple.
"""

import json
import requests

# Código de merge sort (divide-and-conquer)
merge_sort_code = """
procedure mergeSort(A[n], izq, der)
BEGIN
    IF (izq < der) THEN BEGIN
        medio <- (izq + der) / 2;
        CALL mergeSort(A, izq, medio);
        CALL mergeSort(A, medio + 1, der);
        CALL merge(A, izq, medio, der);
    END
END
"""

# URL del endpoint (ajustar según tu configuración)
BASE_URL = "http://localhost:8000"
ENDPOINT = f"{BASE_URL}/analyze/open"

def test_recursive_analysis():
    """Prueba el análisis de un algoritmo recursivo."""
    
    payload = {
        "source": merge_sort_code,
        "mode": "all",
        "algorithm_kind": "recursive"  # Forzar tipo recursivo
    }
    
    print("=" * 60)
    print("PRUEBA DE ENDPOINT - ALGORITMO RECURSIVO")
    print("=" * 60)
    print(f"\nCódigo a analizar:\n{merge_sort_code}")
    print(f"\nEnviando petición a: {ENDPOINT}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    print("\n" + "-" * 60)
    
    try:
        response = requests.post(
            ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            result = response.json()
            print("\n✓ Respuesta exitosa!")
            print("\nResultado:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
            
            # Verificar estructura de respuesta
            if result.get("ok"):
                if "worst" in result:
                    worst = result["worst"]
                    if worst.get("ok"):
                        totals = worst.get("totals", {})
                        print("\n" + "=" * 60)
                        print("ANÁLISIS DE RECURRENCIA:")
                        print("=" * 60)
                        if "recurrence" in totals:
                            rec = totals["recurrence"]
                            print(f"  Forma: {rec.get('form')}")
                            print(f"  a = {rec.get('a')}")
                            print(f"  b = {rec.get('b')}")
                            print(f"  f(n) = {rec.get('f')}")
                            print(f"  n₀ = {rec.get('n0')}")
                            print(f"  Aplicable: {rec.get('applicable')}")
                        
                        if "master" in totals:
                            master = totals["master"]
                            print("\nTEOREMA MAESTRO:")
                            print(f"  Caso: {master.get('case')}")
                            print(f"  g(n) = {master.get('nlogba')}")
                            print(f"  Comparación: {master.get('comparison')}")
                            print(f"  Θ = {master.get('theta')}")
                        
                        if "proof" in totals:
                            print("\nPASOS DE PRUEBA:")
                            for step in totals["proof"]:
                                print(f"  [{step.get('id')}] {step.get('text')}")
                else:
                    print(f"\n✗ Error en worst: {worst.get('errors')}")
            else:
                print(f"\n✗ Error en respuesta: {result.get('errors')}")
        else:
            print(f"\n✗ Error HTTP {response.status_code}")
            print(f"Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("\n✗ Error: No se pudo conectar al servidor.")
        print("  Asegúrate de que el servidor esté corriendo en", BASE_URL)
    except requests.exceptions.Timeout:
        print("\n✗ Error: Timeout esperando respuesta del servidor")
    except Exception as e:
        print(f"\n✗ Error inesperado: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_recursive_analysis()

