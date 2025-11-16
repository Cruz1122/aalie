#!/usr/bin/env python3
"""
Script de prueba para el endpoint de análisis recursivo.
Prueba con un algoritmo merge sort simple.
"""

import json
import sys
import os

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(__file__))

# Código recursivo simple para prueba
merge_sort_code = """mergeSort(A[n], izq, der) {
    if (izq < der) then {
        medio <- (izq + der) / 2;
        call mergeSort(A, izq, medio);
        call mergeSort(A, medio + 1, der);
    }
}"""

def test_with_requests():
    """Prueba usando requests si está disponible."""
    try:
        import requests
        
        BASE_URL = "http://localhost:8000"
        ENDPOINT = f"{BASE_URL}/analyze/open"
        
        payload = {
            "source": merge_sort_code,
            "mode": "all",
            "algorithm_kind": "recursive"
        }
        
        print("=" * 60)
        print("PRUEBA DE ENDPOINT - ALGORITMO RECURSIVO")
        print("=" * 60)
        print(f"\nCódigo a analizar:\n{merge_sort_code}")
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
            print("\n[OK] Respuesta exitosa!")
            print("\nResultado (resumen):")
            
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
                        print(f"\n[ERROR] Error en worst: {worst.get('errors')}")
                else:
                    print("\n[OK] Respuesta OK pero sin worst/best/avg")
                    print(json.dumps(result, indent=2, ensure_ascii=False))
            else:
                print(f"\n[ERROR] Error en respuesta: {result.get('errors')}")
                print("\nRespuesta completa:")
                print(json.dumps(result, indent=2, ensure_ascii=False))
        else:
            print(f"\n[ERROR] Error HTTP {response.status_code}")
            print(f"Response: {response.text[:500]}")
            
    except ImportError:
        print("requests no esta instalado. Usando prueba directa del analizador...")
        test_direct_analyzer()
    except requests.exceptions.ConnectionError:
        print("\n[ERROR] No se pudo conectar al servidor.")
        print("  Asegurate de que el servidor este corriendo en http://localhost:8000")
        print("\nProbando analizador directamente...")
        test_direct_analyzer()
    except Exception as e:
        print(f"\n[ERROR] {e}")
        print("\nProbando analizador directamente como fallback...")
        test_direct_analyzer()
    except Exception as e:
        print(f"\n[ERROR] {e}")
        import traceback
        traceback.print_exc()

def test_direct_analyzer():
    """Prueba el analizador directamente sin servidor."""
    try:
        from app.routers.parse import parse_source
        from app.analysis import RecursiveAnalyzer
        
        print("\n" + "=" * 60)
        print("PRUEBA DIRECTA DEL ANALIZADOR")
        print("=" * 60)
        
        # Parsear el código
        print("\n1. Parseando código...")
        parse_result = parse_source(merge_sort_code)
        
        if not parse_result.get("ok"):
            print(f"✗ Error parseando: {parse_result.get('errors')}")
            return
        
        ast = parse_result.get("ast")
        print("✓ Parse exitoso")
        
        # Analizar
        print("\n2. Analizando con RecursiveAnalyzer...")
        analyzer = RecursiveAnalyzer()
        result = analyzer.analyze(ast, "worst")
        
        if result.get("ok"):
            print("✓ Análisis exitoso")
            totals = result.get("totals", {})
            
            print("\n" + "=" * 60)
            print("RESULTADO DEL ANÁLISIS:")
            print("=" * 60)
            
            if "recurrence" in totals:
                rec = totals["recurrence"]
                print(f"\nRECURRENCIA:")
                print(f"  Forma: {rec.get('form')}")
                print(f"  a = {rec.get('a')}")
                print(f"  b = {rec.get('b')}")
                print(f"  f(n) = {rec.get('f')}")
                print(f"  n₀ = {rec.get('n0')}")
                print(f"  Aplicable: {rec.get('applicable')}")
                if rec.get('notes'):
                    print(f"  Notas: {rec.get('notes')}")
            
            if "master" in totals:
                master = totals["master"]
                print(f"\nTEOREMA MAESTRO:")
                print(f"  Caso: {master.get('case')}")
                print(f"  g(n) = {master.get('nlogba')}")
                print(f"  Comparación: {master.get('comparison')}")
                if master.get('regularity'):
                    reg = master.get('regularity')
                    print(f"  Regularidad: {'✓' if reg.get('checked') else '⚠'} {reg.get('note')}")
                print(f"  Θ = {master.get('theta')}")
            
            if "proof" in totals:
                print(f"\nPASOS DE PRUEBA ({len(totals['proof'])} pasos):")
                for i, step in enumerate(totals["proof"], 1):
                    print(f"  {i}. [{step.get('id')}] {step.get('text')}")
            
            print(f"\nT_open: {totals.get('T_open', 'N/A')}")
        else:
            print(f"✗ Error en análisis: {result.get('errors')}")
            
    except Exception as e:
        print(f"✗ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_with_requests()

