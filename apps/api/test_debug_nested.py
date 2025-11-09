# apps/api/test_debug_nested.py
"""
Script para debuggear qué está generando el análisis de bucles anidados.
"""

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

print("=" * 60)
print("RESULTADO DEL ANÁLISIS")
print("=" * 60)
print(f"OK: {result.get('ok')}")
print(f"Total filas: {len(result.get('byLine', []))}")
print()

for i, row in enumerate(result.get('byLine', [])):
    print(f"Fila {i+1}:")
    print(f"  Line: {row.get('line')}")
    print(f"  Kind: {row.get('kind')}")
    print(f"  Ck: {row.get('ck')}")
    print(f"  Count_raw: {row.get('count_raw', '')[:100]}")
    print(f"  Count: {row.get('count', '')[:100]}")
    print(f"  Has count_raw_expr: {'count_raw_expr' in row}")
    print()

