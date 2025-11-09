# apps/api/test_comprehensive_algorithms.py
"""
Test comprensivo del endpoint /analyze/open con múltiples algoritmos iterativos.
Prueba ciclos anidados, casos raros y diferentes patrones de complejidad.
"""

from fastapi.testclient import TestClient
from app.main import app
import json

client = TestClient(app)

# ============================================================================
# ALGORITMOS DE PRUEBA
# ============================================================================

ALGORITHMS = {
    "1. Simple FOR Loop": {
        "source": """
simple(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        x <- 1;
    END
END
""",
        "description": "Bucle FOR simple - O(n)"
    },
    
    "2. Nested FOR Loops (Rectangular)": {
        "source": """
rectangular(m, n) BEGIN
    FOR i <- 1 TO m DO BEGIN
        FOR j <- 1 TO n DO BEGIN
            x <- 1;
        END
    END
END
""",
        "description": "Bucles FOR anidados rectangulares - O(m*n)"
    },
    
    "3. Nested FOR Loops (Triangular)": {
        "source": """
triangular(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        FOR j <- 1 TO i DO BEGIN
            x <- 1;
        END
    END
END
""",
        "description": "Bucles FOR anidados triangulares - O(n²)"
    },
    
    "4. Bubble Sort": {
        "source": """
burbuja(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- 1 TO n - i DO BEGIN
            IF (A[j] > A[j + 1]) THEN BEGIN
                temp <- A[j];
                A[j] <- A[j + 1];
                A[j + 1] <- temp;
            END
        END
    END
END
""",
        "description": "Bubble Sort - O(n²)"
    },
    
    "5. Insertion Sort": {
        "source": """
insertionSort(arr, n) BEGIN
    FOR i <- 2 TO n DO BEGIN
        key <- arr[i];
        j <- i - 1;
        WHILE (j >= 1 AND arr[j] > key) DO BEGIN
            arr[j + 1] <- arr[j];
            j <- j - 1;
        END
        arr[j + 1] <- key;
    END
END
""",
        "description": "Insertion Sort con WHILE anidado - O(n²) peor caso"
    },
    
    "6. Selection Sort": {
        "source": """
selectionSort(A[n], n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        min_idx <- i;
        FOR j <- i + 1 TO n DO BEGIN
            IF (A[j] < A[min_idx]) THEN BEGIN
                min_idx <- j;
            END
        END
        IF (min_idx != i) THEN BEGIN
            temp <- A[i];
            A[i] <- A[min_idx];
            A[min_idx] <- temp;
        END
    END
END
""",
        "description": "Selection Sort - O(n²)"
    },
    
    "7. Matrix Multiplication": {
        "source": """
matrixMult(m, n, p) BEGIN
    FOR i <- 1 TO m DO BEGIN
        FOR j <- 1 TO n DO BEGIN
            sum <- 0;
            FOR k <- 1 TO p DO BEGIN
                sum <- sum + 1;
            END
            result <- sum;
        END
    END
END
""",
        "description": "Multiplicación de matrices - O(m*n*p)"
    },
    
    "8. Nested FOR with Dependent Limits": {
        "source": """
dependentLimits(n) BEGIN
    FOR i <- 1 TO n - 1 DO BEGIN
        FOR j <- i + 1 TO n DO BEGIN
            x <- 1;
        END
    END
END
""",
        "description": "Bucles FOR con límites dependientes - O(n²)"
    },
    
    "9. Complex FOR with Arithmetic": {
        "source": """
complexFor(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        FOR j <- 1 TO 2 * i DO BEGIN
            FOR k <- 1 TO j DO BEGIN
                x <- 1;
            END
        END
    END
END
""",
        "description": "Bucles FOR anidados con límites aritméticos - O(n³)"
    },
    
    "10. WHILE Loop": {
        "source": """
whileLoop(n) BEGIN
    i <- 1;
    WHILE (i <= n) DO BEGIN
        x <- 1;
        i <- i * 2;
    END
END
""",
        "description": "WHILE loop con multiplicación - O(log n)"
    },
    
    "11. Nested WHILE": {
        "source": """
nestedWhile(n) BEGIN
    i <- 1;
    WHILE (i <= n) DO BEGIN
        j <- 1;
        WHILE (j <= i) DO BEGIN
            x <- 1;
            j <- j + 1;
        END
        i <- i + 1;
    END
END
""",
        "description": "WHILE loops anidados - O(n²)"
    },
    
    "12. Mixed FOR and WHILE": {
        "source": """
mixedLoops(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        j <- 1;
        WHILE (j <= i) DO BEGIN
            x <- 1;
            j <- j + 1;
        END
    END
END
""",
        "description": "FOR con WHILE anidado - O(n²)"
    },
    
    "13. FOR with Complex Condition": {
        "source": """
complexCondition(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (i MOD 2 = 0) THEN BEGIN
            FOR j <- 1 TO i DO BEGIN
                x <- 1;
            END
        END
    END
END
""",
        "description": "FOR con IF y bucle interno condicional"
    },
    
    "14. Triple Nested FOR": {
        "source": """
tripleNested(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        FOR j <- 1 TO n DO BEGIN
            FOR k <- 1 TO n DO BEGIN
                x <- 1;
            END
        END
    END
END
""",
        "description": "Triple bucle FOR anidado - O(n³)"
    },
    
    "15. FOR with Conditional Inner Loop": {
        "source": """
conditionalInner(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (i MOD 2 = 0) THEN BEGIN
            FOR j <- 1 TO i DO BEGIN
                x <- 1;
            END
        END
        IF (i MOD 2 = 1) THEN BEGIN
            y <- 1;
        END
    END
END
""",
        "description": "FOR con IF y bucles internos condicionales"
    },
    
    "16. FOR with Break-like Pattern": {
        "source": """
breakPattern(n, target) BEGIN
    found <- FALSE;
    FOR i <- 1 TO n DO BEGIN
        IF (found = FALSE) THEN BEGIN
            IF (i = target) THEN BEGIN
                found <- TRUE;
            END
            x <- 1;
        END
    END
END
""",
        "description": "FOR con patrón similar a break"
    },
    
    "17. Nested FOR with Different Ranges": {
        "source": """
differentRanges(n) BEGIN
    FOR i <- 2 TO n DO BEGIN
        FOR j <- 1 TO i - 1 DO BEGIN
            FOR k <- j + 1 TO i DO BEGIN
                x <- 1;
            END
        END
    END
END
""",
        "description": "Bucles FOR anidados con rangos diferentes - O(n³)"
    },
    
    "18. FOR with Nested IF-ELSE": {
        "source": """
nestedIfElse(n) BEGIN
    FOR i <- 1 TO n DO BEGIN
        IF (i MOD 2 = 0) THEN BEGIN
            FOR j <- 1 TO i DO BEGIN
                x <- 1;
            END
        END
        ELSE BEGIN
            y <- 1;
        END
    END
END
""",
        "description": "FOR con IF-ELSE anidado"
    }
}

# ============================================================================
# FUNCIONES DE TEST
# ============================================================================

def test_algorithm(name: str, algorithm: dict) -> dict:
    """
    Prueba un algoritmo y retorna el resultado.
    
    Returns:
        dict con resultados del test
    """
    source = algorithm["source"]
    description = algorithm["description"]
    
    payload = {
        "source": source,
        "mode": "worst"
    }
    
    try:
        response = client.post("/analyze/open", json=payload)
        status_code = response.status_code
        
        if status_code == 200:
            result = response.json()
            ok = result.get("ok", False)
            
            if ok:
                by_line = result.get("byLine", [])
                totals = result.get("totals", {})
                t_open = totals.get("T_open", "")
                
                # Verificar que no haya "unknown" en los resultados
                has_unknown = False
                unknown_lines = []
                for row in by_line:
                    count = row.get("count", "")
                    if "unknown" in count.lower():
                        has_unknown = True
                        unknown_lines.append(row.get("line"))
                
                # Verificar que las sumatorias estén simplificadas
                has_unclosed_sums = False
                unclosed_lines = []
                for row in by_line:
                    count = row.get("count", "")
                    # Si contiene \sum pero no está en forma de fracción o polinomio, podría no estar cerrado
                    if "\\sum" in count and "frac" not in count and "^" not in count:
                        # Verificar si es una sumatoria simple cerrada (como n)
                        if not any(c.isdigit() for c in count.replace("n", "").replace(" ", "").replace("(", "").replace(")", "")):
                            has_unclosed_sums = True
                            unclosed_lines.append(row.get("line"))
                
                return {
                    "name": name,
                    "description": description,
                    "status": "PASS" if not has_unknown and not has_unclosed_sums else "PARTIAL",
                    "status_code": status_code,
                    "ok": ok,
                    "num_rows": len(by_line),
                    "has_unknown": has_unknown,
                    "unknown_lines": unknown_lines,
                    "has_unclosed_sums": has_unclosed_sums,
                    "unclosed_lines": unclosed_lines,
                    "t_open": t_open,
                    "t_open_preview": t_open[:100] + "..." if len(t_open) > 100 else t_open,
                    "error": None
                }
            else:
                errors = result.get("errors", [])
                return {
                    "name": name,
                    "description": description,
                    "status": "FAIL",
                    "status_code": status_code,
                    "ok": False,
                    "num_rows": 0,
                    "has_unknown": False,
                    "unknown_lines": [],
                    "has_unclosed_sums": False,
                    "unclosed_lines": [],
                    "t_open": "",
                    "t_open_preview": "",
                    "error": errors[0].get("message", "Unknown error") if errors else "Unknown error"
                }
        else:
            return {
                "name": name,
                "description": description,
                "status": "FAIL",
                "status_code": status_code,
                "ok": False,
                "num_rows": 0,
                "has_unknown": False,
                "unknown_lines": [],
                "has_unclosed_sums": False,
                "unclosed_lines": [],
                "t_open": "",
                "t_open_preview": "",
                "error": f"HTTP {status_code}: {response.text[:200]}"
            }
    except Exception as e:
        return {
            "name": name,
            "description": description,
            "status": "ERROR",
            "status_code": 0,
            "ok": False,
            "num_rows": 0,
            "has_unknown": False,
            "unknown_lines": [],
            "has_unclosed_sums": False,
            "unclosed_lines": [],
            "t_open": "",
            "t_open_preview": "",
            "error": str(e)
        }

# ============================================================================
# EJECUCIÓN DE TESTS
# ============================================================================

def main():
    print("=" * 80)
    print("TEST COMPRENSIVO DE ALGORITMOS ITERATIVOS")
    print("=" * 80)
    print()
    
    results = []
    
    for name, algorithm in ALGORITHMS.items():
        print(f"Testing: {name}")
        print(f"  Description: {algorithm['description']}")
        result = test_algorithm(name, algorithm)
        results.append(result)
        
        # Mostrar resultado inmediato
        if result["status"] == "PASS":
            print(f"  ✅ PASS - {result['num_rows']} filas, T_open: {result['t_open_preview']}")
        elif result["status"] == "PARTIAL":
            print(f"  ⚠ PARTIAL - {result['num_rows']} filas")
            if result["has_unknown"]:
                print(f"    ⚠ Tiene 'unknown' en líneas: {result['unknown_lines']}")
            if result["has_unclosed_sums"]:
                print(f"    ⚠ Tiene sumatorias sin cerrar en líneas: {result['unclosed_lines']}")
        else:
            print(f"  ❌ FAIL - {result['error']}")
        print()
    
    # ========================================================================
    # RESUMEN
    # ========================================================================
    print("=" * 80)
    print("RESUMEN")
    print("=" * 80)
    print()
    
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASS")
    partial = sum(1 for r in results if r["status"] == "PARTIAL")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    errors = sum(1 for r in results if r["status"] == "ERROR")
    
    print(f"Total de algoritmos probados: {total}")
    print(f"✅ PASS: {passed}")
    print(f"⚠ PARTIAL: {partial}")
    print(f"❌ FAIL: {failed}")
    print(f"💥 ERROR: {errors}")
    print()
    
    # Detalles de algoritmos que fallaron
    if failed > 0 or errors > 0:
        print("Algoritmos que fallaron:")
        for r in results:
            if r["status"] in ["FAIL", "ERROR"]:
                print(f"  - {r['name']}: {r['error']}")
        print()
    
    # Detalles de algoritmos parciales
    if partial > 0:
        print("Algoritmos con problemas parciales:")
        for r in results:
            if r["status"] == "PARTIAL":
                issues = []
                if r["has_unknown"]:
                    issues.append(f"unknown en líneas {r['unknown_lines']}")
                if r["has_unclosed_sums"]:
                    issues.append(f"sumatorias sin cerrar en líneas {r['unclosed_lines']}")
                print(f"  - {r['name']}: {', '.join(issues)}")
        print()
    
    # Tabla de resultados
    print("=" * 80)
    print("TABLA DE RESULTADOS")
    print("=" * 80)
    print(f"{'Algoritmo':<40} {'Status':<10} {'Filas':<8} {'T_open':<30}")
    print("-" * 80)
    
    for r in results:
        status_icon = "✅" if r["status"] == "PASS" else "⚠" if r["status"] == "PARTIAL" else "❌"
        name_short = r["name"].split(". ", 1)[-1] if ". " in r["name"] else r["name"]
        name_short = name_short[:38]
        t_open_short = r["t_open_preview"][:28] if r["t_open_preview"] else "N/A"
        print(f"{name_short:<40} {status_icon} {r['status']:<7} {r['num_rows']:<8} {t_open_short:<30}")
    
    print()
    
    # Estadísticas de T_open
    print("=" * 80)
    print("ESTADÍSTICAS DE T_open")
    print("=" * 80)
    
    t_opens = [r["t_open"] for r in results if r["t_open"]]
    simplified = sum(1 for t in t_opens if "\\sum" not in t or ("frac" in t or "^" in t))
    with_sums = sum(1 for t in t_opens if "\\sum" in t and "frac" not in t and "^" not in t)
    
    print(f"Total de T_open generados: {len(t_opens)}")
    print(f"T_open completamente simplificados: {simplified}")
    print(f"T_open con sumatorias: {with_sums}")
    print()
    
    # Éxito general
    success_rate = (passed / total * 100) if total > 0 else 0
    print("=" * 80)
    if success_rate == 100:
        print("🎉 TODOS LOS ALGORITMOS PASARON!")
    elif success_rate >= 80:
        print(f"✅ {success_rate:.1f}% de éxito - Mayoría de algoritmos funcionando correctamente")
    elif success_rate >= 50:
        print(f"⚠ {success_rate:.1f}% de éxito - Algunos problemas detectados")
    else:
        print(f"❌ {success_rate:.1f}% de éxito - Muchos problemas detectados")
    print("=" * 80)
    
    return results

if __name__ == "__main__":
    results = main()
    
    # Exit code basado en resultados
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASS")
    
    if passed == total:
        exit(0)
    else:
        exit(1)

