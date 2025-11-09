# apps/api/test_complex_cases.py
"""
Tests para casos complejos de análisis con SymPy.
"""

def test_insertion_sort():
    """Test: Análisis completo de insertion sort"""
    print("Testing Insertion Sort...")
    try:
        from app.analysis.iterative_analyzer import IterativeAnalyzer
        
        analyzer = IterativeAnalyzer()
        
        # AST de insertion sort simplificado
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "For",
                    "var": "i",
                    "start": {"type": "number", "value": 2},
                    "end": {"type": "identifier", "name": "n"},
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "Assign",
                                "target": {"type": "identifier", "name": "key"},
                                "value": {
                                    "type": "index",
                                    "target": {"type": "identifier", "name": "arr"},
                                    "index": {"type": "identifier", "name": "i"}
                                },
                                "pos": {"line": 2}
                            },
                            {
                                "type": "Assign",
                                "target": {"type": "identifier", "name": "j"},
                                "value": {
                                    "type": "binary",
                                    "left": {"type": "identifier", "name": "i"},
                                    "right": {"type": "number", "value": 1},
                                    "operator": "-"
                                },
                                "pos": {"line": 3}
                            },
                            {
                                "type": "While",
                                "test": {
                                    "type": "binary",
                                    "op": "and",
                                    "left": {
                                        "type": "binary",
                                        "left": {"type": "identifier", "name": "j"},
                                        "right": {"type": "number", "value": 1},
                                        "op": ">="
                                    },
                                    "right": {
                                        "type": "binary",
                                        "left": {
                                            "type": "index",
                                            "target": {"type": "identifier", "name": "arr"},
                                            "index": {"type": "identifier", "name": "j"}
                                        },
                                        "right": {"type": "identifier", "name": "key"},
                                        "op": ">"
                                    }
                                },
                                "body": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "Assign",
                                            "target": {
                                                "type": "index",
                                                "target": {"type": "identifier", "name": "arr"},
                                                "index": {
                                                    "type": "binary",
                                                    "left": {"type": "identifier", "name": "j"},
                                                    "right": {"type": "number", "value": 1},
                                                    "operator": "+"
                                                }
                                            },
                                            "value": {
                                                "type": "index",
                                                "target": {"type": "identifier", "name": "arr"},
                                                "index": {"type": "identifier", "name": "j"}
                                            },
                                            "pos": {"line": 5}
                                        },
                                        {
                                            "type": "Assign",
                                            "target": {"type": "identifier", "name": "j"},
                                            "value": {
                                                "type": "binary",
                                                "left": {"type": "identifier", "name": "j"},
                                                "right": {"type": "number", "value": 1},
                                                "operator": "-"
                                            },
                                            "pos": {"line": 6}
                                        }
                                    ]
                                },
                                "pos": {"line": 4}
                            },
                            {
                                "type": "Assign",
                                "target": {
                                    "type": "index",
                                    "target": {"type": "identifier", "name": "arr"},
                                    "index": {
                                        "type": "binary",
                                        "left": {"type": "identifier", "name": "j"},
                                        "right": {"type": "number", "value": 1},
                                        "operator": "+"
                                    }
                                },
                                "value": {"type": "identifier", "name": "key"},
                                "pos": {"line": 7}
                            }
                        ]
                    },
                    "pos": {"line": 1}
                }
            ]
        }
        
        result = analyzer.analyze(ast, mode="worst")
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        assert len(result["byLine"]) > 0, "Debe tener filas"
        
        print(f"✓ Insertion Sort analizado: {len(result['byLine'])} filas")
        
        # Verificar que todas las filas tienen count_raw y count
        for row in result["byLine"]:
            assert "count_raw" in row, f"Fila {row.get('line')} debe tener count_raw"
            assert "count" in row, f"Fila {row.get('line')} debe tener count"
            assert isinstance(row["count_raw"], str), f"count_raw debe ser string"
            assert isinstance(row["count"], str), f"count debe ser string"
        
        # Verificar T_open
        assert "totals" in result, "Debe tener totals"
        assert "T_open" in result["totals"], "Debe tener T_open"
        print(f"✓ T_open generado: {result['totals']['T_open'][:50]}...")
        
        print("✓ Insertion Sort: TEST PASÓ\n")
        return True
    except Exception as e:
        print(f"✗ Insertion Sort: ERROR - {e}")
        import traceback
        traceback.print_exc()
        return False


def test_nested_for_loops():
    """Test: Bucles FOR anidados (burbuja)"""
    print("Testing Nested FOR Loops (Bubble Sort)...")
    try:
        from app.analysis.iterative_analyzer import IterativeAnalyzer
        
        analyzer = IterativeAnalyzer()
        
        ast = {
            "type": "Program",
            "body": [
                {
                    "type": "For",
                    "var": "i",
                    "start": {"type": "number", "value": 1},
                    "end": {
                        "type": "binary",
                        "left": {"type": "identifier", "name": "n"},
                        "right": {"type": "number", "value": 1},
                        "operator": "-"
                    },
                    "body": {
                        "type": "Block",
                        "body": [
                            {
                                "type": "For",
                                "var": "j",
                                "start": {"type": "number", "value": 1},
                                "end": {
                                    "type": "binary",
                                    "left": {"type": "identifier", "name": "n"},
                                    "right": {"type": "identifier", "name": "i"},
                                    "operator": "-"
                                },
                                "body": {
                                    "type": "Block",
                                    "body": [
                                        {
                                            "type": "If",
                                            "test": {
                                                "type": "binary",
                                                "left": {
                                                    "type": "index",
                                                    "target": {"type": "identifier", "name": "A"},
                                                    "index": {"type": "identifier", "name": "j"}
                                                },
                                                "right": {
                                                    "type": "index",
                                                    "target": {"type": "identifier", "name": "A"},
                                                    "index": {
                                                        "type": "binary",
                                                        "left": {"type": "identifier", "name": "j"},
                                                        "right": {"type": "number", "value": 1},
                                                        "operator": "+"
                                                    }
                                                },
                                                "op": ">"
                                            },
                                            "consequent": {
                                                "type": "Block",
                                                "body": [
                                                    {
                                                        "type": "Assign",
                                                        "target": {"type": "identifier", "name": "temp"},
                                                        "value": {
                                                            "type": "index",
                                                            "target": {"type": "identifier", "name": "A"},
                                                            "index": {"type": "identifier", "name": "j"}
                                                        },
                                                        "pos": {"line": 4}
                                                    },
                                                    {
                                                        "type": "Assign",
                                                        "target": {
                                                            "type": "index",
                                                            "target": {"type": "identifier", "name": "A"},
                                                            "index": {"type": "identifier", "name": "j"}
                                                        },
                                                        "value": {
                                                            "type": "index",
                                                            "target": {"type": "identifier", "name": "A"},
                                                            "index": {
                                                                "type": "binary",
                                                                "left": {"type": "identifier", "name": "j"},
                                                                "right": {"type": "number", "value": 1},
                                                                "operator": "+"
                                                            }
                                                        },
                                                        "pos": {"line": 5}
                                                    },
                                                    {
                                                        "type": "Assign",
                                                        "target": {
                                                            "type": "index",
                                                            "target": {"type": "identifier", "name": "A"},
                                                            "index": {
                                                                "type": "binary",
                                                                "left": {"type": "identifier", "name": "j"},
                                                                "right": {"type": "number", "value": 1},
                                                                "operator": "+"
                                                            }
                                                        },
                                                        "value": {"type": "identifier", "name": "temp"},
                                                        "pos": {"line": 6}
                                                    }
                                                ]
                                            },
                                            "pos": {"line": 3}
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
        
        assert result.get("ok", False), "Análisis debe ser exitoso"
        assert "byLine" in result, "Debe tener byLine"
        
        print(f"✓ Bubble Sort analizado: {len(result['byLine'])} filas")
        
        # Verificar que hay sumatorias anidadas o que se simplificaron correctamente
        has_nested = False
        has_simplified = False
        
        for row in result["byLine"]:
            count_raw = row.get("count_raw", "")
            count = row.get("count", "")
            
            # Buscar sumatorias anidadas en count_raw
            if count_raw.count("sum") >= 2 or count_raw.count("\\sum") >= 2:
                has_nested = True
                print(f"  Encontrada sumatoria anidada en línea {row.get('line')}: {count_raw[:80]}...")
            
            # Verificar que el resultado esté simplificado (no debe contener "unknown")
            if "unknown" not in count.lower() and count != count_raw:
                has_simplified = True
                # Verificar que el resultado tenga sentido (contiene n o alguna expresión válida)
                if "n" in count.lower() or "frac" in count.lower() or count.strip().isdigit():
                    print(f"  Resultado simplificado en línea {row.get('line')}: {count[:80]}...")
        
        # Debe tener sumatorias anidadas O resultados simplificados correctamente
        assert has_nested or has_simplified, f"Debe tener sumatorias anidadas o resultados simplificados. count_raw: {[r.get('count_raw') for r in result['byLine']]}"
        if has_nested:
            print("✓ Sumatorias anidadas detectadas correctamente")
        if has_simplified:
            print("✓ Resultados simplificados correctamente")
        
        print("✓ Nested FOR Loops: TEST PASÓ\n")
        return True
    except Exception as e:
        print(f"✗ Nested FOR Loops: ERROR - {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("TESTS DE CASOS COMPLEJOS")
    print("=" * 60)
    print()
    
    results = []
    
    results.append(("Insertion Sort", test_insertion_sort()))
    results.append(("Nested FOR Loops", test_nested_for_loops()))
    
    print("=" * 60)
    print("RESUMEN")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    print()
    print(f"Total: {passed}/{total} tests pasaron")
    
    if passed == total:
        print("\n🎉 TODOS LOS TESTS PASARON!")
        exit(0)
    else:
        print(f"\n❌ {total - passed} test(s) fallaron")
        exit(1)

