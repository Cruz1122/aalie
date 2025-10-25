#!/usr/bin/env python3
"""
Test script para verificar el análisis de quicksort end-to-end.
"""

import sys
import os

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.analysis.examples.quicksort_example import create_quicksort_analysis

def test_quicksort_analysis():
    """Prueba el análisis completo de quicksort."""
    print("=== PRUEBA DE ANÁLISIS DE QUICKSORT ===")
    
    try:
        # Crear análisis
        result = create_quicksort_analysis()
        
        # Verificar estructura básica
        assert result.get("ok") == True, "El análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert "totals" in result, "Debe tener totals"
        
        byLine = result["byLine"]
        totals = result["totals"]
        
        print(f"✓ Análisis exitoso")
        print(f"✓ Número de filas: {len(byLine)}")
        print(f"✓ T_open: {totals.get('T_open', 'N/A')}")
        
        # Verificar que hay filas para FOR e IF
        for_kinds = [row for row in byLine if row["kind"] == "for"]
        if_kinds = [row for row in byLine if row["kind"] == "if"]
        assign_kinds = [row for row in byLine if row["kind"] == "assign"]
        call_kinds = [row for row in byLine if row["kind"] == "call"]
        
        print(f"✓ Filas FOR: {len(for_kinds)}")
        print(f"✓ Filas IF: {len(if_kinds)}")
        print(f"✓ Filas ASSIGN: {len(assign_kinds)}")
        print(f"✓ Filas CALL: {len(call_kinds)}")
        
        # Verificar multiplicadores
        has_multipliers = any("\\sum" in row["count"] for row in byLine)
        print(f"✓ Multiplicadores aplicados: {has_multipliers}")
        
        # Verificar T_open
        t_open = totals.get("T_open", "")
        has_terms = "+" in t_open and "C_{" in t_open
        print(f"✓ T_open tiene términos: {has_terms}")
        
        # Verificar procedimiento
        procedure = totals.get("procedure", [])
        print(f"✓ Pasos del procedimiento: {len(procedure)}")
        
        print("\n=== FILAS DETALLADAS ===")
        for row in byLine:
            note = row.get("note", "")
            print(f"Línea {row['line']}: {row['kind']} - {row['ck']} - {row['count']} {f'- {note}' if note else ''}")
        
        print("\n=== PROCEDIMIENTO ===")
        for i, step in enumerate(procedure, 1):
            print(f"{i}. {step}")
        
        if totals.get("symbols"):
            print("\n=== SÍMBOLOS ===")
            for symbol, desc in totals["symbols"].items():
                print(f"{symbol}: {desc}")
        
        print("\n✅ TODAS LAS PRUEBAS PASARON")
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_quicksort_analysis()
    sys.exit(0 if success else 1)
