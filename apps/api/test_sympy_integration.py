# apps/api/test_sympy_integration.py
"""
Script de prueba rápida para verificar la integración con SymPy.
Ejecutar dentro del contenedor Docker o con sympy instalado.
"""

def test_expr_converter():
    """Test básico de ExprConverter"""
    print("Testing ExprConverter...")
    try:
        from app.analysis.expr_converter import ExprConverter
        from sympy import Integer, Symbol
        
        converter = ExprConverter("n")
        
        # Test número
        result = converter.ast_to_sympy(5)
        assert result == Integer(5), f"Expected Integer(5), got {result}"
        print("✓ Número convertido correctamente")
        
        # Test identificador
        expr = {"type": "identifier", "name": "n"}
        result = converter.ast_to_sympy(expr)
        assert isinstance(result, Symbol), f"Expected Symbol, got {type(result)}"
        print("✓ Identificador convertido correctamente")
        
        # Test operación binaria
        expr = {
            "type": "binary",
            "left": {"type": "number", "value": 2},
            "right": {"type": "number", "value": 3},
            "operator": "+"
        }
        result = converter.ast_to_sympy(expr)
        assert result == Integer(5), f"Expected Integer(5), got {result}"
        print("✓ Operación binaria convertida correctamente")
        
        print("✓ ExprConverter: TODOS LOS TESTS PASARON\n")
        return True
    except Exception as e:
        print(f"✗ ExprConverter: ERROR - {e}")
        import traceback
        traceback.print_exc()
        return False


def test_base_analyzer():
    """Test básico de BaseAnalyzer con SymPy"""
    print("Testing BaseAnalyzer...")
    try:
        from app.analysis.base import BaseAnalyzer
        from sympy import Sum, Integer, Symbol
        
        analyzer = BaseAnalyzer()
        
        # Test add_row con SymPy
        analyzer.add_row(1, "assign", "C_1", Integer(1))
        assert len(analyzer.rows) == 1, "Debe tener 1 fila"
        assert "count_raw_expr" in analyzer.rows[0], "Debe tener count_raw_expr"
        print("✓ add_row con SymPy funciona")
        
        # Test push_multiplier con Sum
        n = Symbol("n", integer=True, positive=True)
        i = Symbol("i", integer=True)
        mult = Sum(Integer(1), (i, Integer(1), n))
        analyzer.push_multiplier(mult)
        assert len(analyzer.loop_stack) == 1, "Debe tener 1 multiplicador"
        assert isinstance(analyzer.loop_stack[0], Sum), "Debe ser un Sum"
        print("✓ push_multiplier con SymPy funciona")
        
        # Test build_t_open
        analyzer2 = BaseAnalyzer()
        analyzer2.add_row(1, "assign", "C_1", Integer(1))
        analyzer2.add_row(2, "assign", "C_2", Integer(2))
        t_open = analyzer2.build_t_open()
        assert isinstance(t_open, str), f"Expected string, got {type(t_open)}"
        assert len(t_open) > 0, "T_open no debe estar vacío"
        print("✓ build_t_open genera LaTeX correctamente")
        
        print("✓ BaseAnalyzer: TODOS LOS TESTS PASARON\n")
        return True
    except Exception as e:
        print(f"✗ BaseAnalyzer: ERROR - {e}")
        import traceback
        traceback.print_exc()
        return False


def test_summation_closer():
    """Test básico de SummationCloser"""
    print("Testing SummationCloser...")
    try:
        from app.analysis.summation_closer import SummationCloser
        
        closer = SummationCloser()
        
        # Test sumatoria simple
        expr = "\\sum_{i=1}^{n} 1"
        closed, steps = closer.close_summation(expr)
        assert isinstance(closed, str), f"Expected string, got {type(closed)}"
        assert isinstance(steps, list), f"Expected list, got {type(steps)}"
        print(f"✓ Sumatoria simple cerrada: {expr} → {closed}")
        
        # Test expresión simple
        expr = "n + 1"
        closed, steps = closer.close_summation(expr)
        assert isinstance(closed, str), f"Expected string, got {type(closed)}"
        print(f"✓ Expresión simple procesada: {expr} → {closed}")
        
        print("✓ SummationCloser: TODOS LOS TESTS PASARON\n")
        return True
    except Exception as e:
        print(f"✗ SummationCloser: ERROR - {e}")
        import traceback
        traceback.print_exc()
        return False


def test_for_visitor():
    """Test básico de ForVisitor con SymPy"""
    print("Testing ForVisitor...")
    try:
        from app.analysis.iterative_analyzer import IterativeAnalyzer
        
        analyzer = IterativeAnalyzer()
        
        # Test AST simple con FOR
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
                                "type": "Assign",
                                "target": {"type": "identifier", "name": "x"},
                                "value": {"type": "number", "value": 1},
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
        assert len(result["byLine"]) > 0, "Debe tener al menos una fila"
        
        # Verificar que las filas tienen los campos correctos
        for row in result["byLine"]:
            assert "count_raw" in row, "Debe tener count_raw"
            assert "count" in row, "Debe tener count"
        
        print(f"✓ Análisis completado: {len(result['byLine'])} filas generadas")
        print("✓ ForVisitor: TODOS LOS TESTS PASARON\n")
        return True
    except Exception as e:
        print(f"✗ ForVisitor: ERROR - {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    print("=" * 60)
    print("TESTS DE INTEGRACIÓN SYMPY")
    print("=" * 60)
    print()
    
    results = []
    
    results.append(("ExprConverter", test_expr_converter()))
    results.append(("BaseAnalyzer", test_base_analyzer()))
    results.append(("SummationCloser", test_summation_closer()))
    results.append(("ForVisitor", test_for_visitor()))
    
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

