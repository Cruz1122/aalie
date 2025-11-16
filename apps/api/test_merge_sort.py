#!/usr/bin/env python3
"""
Script de prueba para verificar la detección de recurrencias en mergeSort.
"""

import sys
import os
import json

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(__file__))

merge_sort_code = """mergeSort(A[n], izq, der) {
    if (izq < der) then {
        medio <- (izq + der) / 2;
        call mergeSort(A, izq, medio);
        call mergeSort(A, medio + 1, der);
        call merge(A, izq, medio, der);
    }
}"""

def test_classify():
    """Prueba la clasificación del algoritmo."""
    try:
        import requests
        
        # El endpoint de clasificación está en Next.js (puerto 3000), no en FastAPI
        BASE_URL = "http://localhost:3000"
        ENDPOINT = f"{BASE_URL}/api/llm/classify"
        
        payload = {
            "source": merge_sort_code,
            "mode": "local"
        }
        
        print("=" * 60)
        print("PRUEBA DE CLASIFICACIÓN - mergeSort")
        print("=" * 60)
        print(f"\nCódigo:\n{merge_sort_code}")
        print(f"\nEnviando petición a: {ENDPOINT}")
        
        response = requests.post(
            ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n[OK] Clasificación exitosa!")
            print(f"  Tipo: {result.get('kind')}")
            print(f"  Método: {result.get('method')}")
            
            if result.get('kind') == 'recursive':
                print("\n✓ Correctamente clasificado como recursivo")
            else:
                print(f"\n✗ Esperado 'recursive', obtuvo '{result.get('kind')}'")
        else:
            print(f"\n[ERROR] HTTP {response.status_code}")
            print(f"Response: {response.text[:500]}")
            
    except ImportError:
        print("requests no está instalado")
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] No se pudo conectar al servidor.")
        print("  Asegúrate de que el servidor esté corriendo")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()

def test_analysis():
    """Prueba el análisis completo del algoritmo."""
    try:
        import requests
        
        BASE_URL = "http://localhost:8000"
        ENDPOINT = f"{BASE_URL}/analyze/open"
        
        payload = {
            "source": merge_sort_code,
            "mode": "worst",
            "algorithm_kind": "recursive"
        }
        
        print("\n" + "=" * 60)
        print("PRUEBA DE ANÁLISIS - mergeSort")
        print("=" * 60)
        print(f"\nEnviando petición a: {ENDPOINT}")
        
        response = requests.post(
            ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            
            if result.get("ok"):
                totals = result.get("totals", {})
                
                print("\n[OK] Análisis exitoso!")
                print("\n" + "=" * 60)
                print("RECURRENCIA DETECTADA:")
                print("=" * 60)
                
                if "recurrence" in totals:
                    rec = totals["recurrence"]
                    print(f"  Forma: {rec.get('form')}")
                    print(f"  a = {rec.get('a')}")
                    print(f"  b = {rec.get('b')}")
                    print(f"  f(n) = {rec.get('f')}")
                    print(f"  n₀ = {rec.get('n0')}")
                    print(f"  Aplicable: {rec.get('applicable')}")
                    
                    if rec.get('applicable'):
                        print("\n✓ Recurrencia aplicable al Teorema Maestro")
                    else:
                        print(f"\n✗ Recurrencia no aplicable: {rec.get('notes')}")
                else:
                    print("\n✗ No se detectó recurrencia")
                
                if "master" in totals:
                    master = totals["master"]
                    print("\n" + "=" * 60)
                    print("TEOREMA MAESTRO:")
                    print("=" * 60)
                    print(f"  Caso: {master.get('case')}")
                    print(f"  g(n) = {master.get('nlogba')}")
                    print(f"  Comparación: {master.get('comparison')}")
                    print(f"  Θ = {master.get('theta')}")
            else:
                print(f"\n[ERROR] Error en análisis: {result.get('errors')}")
        else:
            print(f"\n[ERROR] HTTP {response.status_code}")
            print(f"Response: {response.text[:500]}")
            
    except ImportError:
        print("requests no está instalado")
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] No se pudo conectar al servidor.")
        print("  Asegúrate de que el servidor esté corriendo")
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_classify()
    test_analysis()

