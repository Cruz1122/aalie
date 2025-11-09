# apps/api/test_full_integration.py
"""
Test completo de integración para verificar que todo el sistema funciona correctamente.
"""

def test_full_workflow():
    """Test del flujo completo desde AST hasta resultado final"""
    print("Testing Full Workflow...")
    try:
        from app.analysis.iterative_analyzer import IterativeAnalyzer
        
        analyzer = IterativeAnalyzer()
        
        # AST de algoritmo simple con bucles anidados
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "For",
                    "var": "i",
                    "start": {"type": "number", "value": 1},
                    "end": {"type": "identifier", "name": "n"},
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "For",
                                "var": "j",
                                "start": {"type": "number", "value": 1},
                                "end": {"type": "identifier", "name": "i"},
                                "body": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Assign",
                                            "target": {"type": "identifier", "name": "x"},
                                            "value": {"type": "number", "value": 1},
                                            "pos": {"line": 2}
                                        }
                                    ]
                                },
                                "pos": {"line": 2}
                            }
                        ]
                    },
                    "pos": {"line": 1}
                }
            ]
        }
        
        result = analyzer.analyze(ast, mode="worst")
        
        # Verificaciones básicas
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert "totals" in result, "Debe tener totals"
        assert "T_open" in result["totals"], "Debe tener T_open"
        
        print(f"✓ Análisis completado: {len(result['byLine'])} filas")
        print(f"✓ T_open generado: {result['totals']['T_open'][:100]}...")
        
        # Verificar que todas las filas tienen los campos necesarios
        for row in result["byLine"]:
            assert "line" in row, "Debe tener line"
            assert "kind" in row, "Debe tener kind"
            assert "ck" in row, "Debe tener ck"
            assert "count_raw" in row, "Debe tener count_raw"
            assert "count" in row, "Debe tener count"
            assert isinstance(row["count_raw"], str), "count_raw debe ser string"
            assert isinstance(row["count"], str), "count debe ser string"
            assert "unknown" not in row["count"].lower(), f"count no debe ser 'unknown': {row['count']}"
        
        print("✓ Todas las filas tienen campos válidos")
        print("✓ Full Workflow: TEST PASÓ\n")
        return True
    except Exception as e:
        print(f"✗ Full Workflow: ERROR - {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("TEST DE INTEGRACIÓN COMPLETA")
    print("=" * 60)
    print()
    
    result = test_full_workflow()
    
    print("=" * 60)
    if result:
        print("🎉 TEST DE INTEGRACIÓN COMPLETO PASÓ!")
        exit(0)
    else:
        print("❌ TEST DE INTEGRACIÓN FALLÓ")
        exit(1)

