# apps/api/app/analysis/examples/quicksort_example.py

from typing import Any, Dict
from ..iterative_analyzer import IterativeAnalyzer


def create_quicksort_ast() -> Dict[str, Any]:
    """
    Crea un AST de ejemplo para quicksort.
    
    Simula el algoritmo quicksort con:
    - FOR j <- izq TO der - 1
    - IF (A[j] <= pivot) dentro del FOR
    - Asignaciones de swap
    - Llamadas recursivas
    """
    return {
        "type": "Program",
        "body": [
            {
                "type": "ProcDef",
                "name": "quicksort",
                "params": ["A", "izq", "der"],
                "body": {
                    "type": "Block",
                    "body": [
                        # Línea 1: if (izq < der)
                        {
                            "type": "If",
                            "pos": {"line": 1},
                            "condition": {
                                "type": "binary",
                                "left": {"type": "identifier", "name": "izq"},
                                "operator": "<",
                                "right": {"type": "identifier", "name": "der"}
                            },
                            "consequent": {
                                "type": "Block",
                                "body": [
                                    # Línea 2: pivot <- A[der]
                                    {
                                        "type": "Assign",
                                        "pos": {"line": 2},
                                        "target": {"type": "identifier", "name": "pivot"},
                                        "value": {
                                            "type": "index",
                                            "target": {"type": "identifier", "name": "A"},
                                            "index": {"type": "identifier", "name": "der"}
                                        }
                                    },
                                    # Línea 3: i <- izq - 1
                                    {
                                        "type": "Assign",
                                        "pos": {"line": 3},
                                        "target": {"type": "identifier", "name": "i"},
                                        "value": {
                                            "type": "binary",
                                            "left": {"type": "identifier", "name": "izq"},
                                            "operator": "-",
                                            "right": {"type": "number", "value": "1"}
                                        }
                                    },
                                    # Línea 4: j <- izq
                                    {
                                        "type": "Assign",
                                        "pos": {"line": 4},
                                        "target": {"type": "identifier", "name": "j"},
                                        "value": {"type": "identifier", "name": "izq"}
                                    },
                                    # Línea 5: for j <- izq TO der - 1
                                    {
                                        "type": "For",
                                        "pos": {"line": 5},
                                        "var": "j",
                                        "start": {"type": "identifier", "name": "izq"},
                                        "end": {
                                            "type": "binary",
                                            "left": {"type": "identifier", "name": "der"},
                                            "operator": "-",
                                            "right": {"type": "number", "value": "1"}
                                        },
                                        "body": {
                                            "type": "Block",
                                            "body": [
                                                # Línea 6: if (A[j] <= pivot)
                                                {
                                                    "type": "If",
                                                    "pos": {"line": 6},
                                                    "condition": {
                                                        "type": "binary",
                                                        "left": {
                                                            "type": "index",
                                                            "target": {"type": "identifier", "name": "A"},
                                                            "index": {"type": "identifier", "name": "j"}
                                                        },
                                                        "operator": "<=",
                                                        "right": {"type": "identifier", "name": "pivot"}
                                                    },
                                                    "consequent": {
                                                        "type": "Block",
                                                        "body": [
                                                            # Línea 7: i <- i + 1
                                                            {
                                                                "type": "Assign",
                                                                "pos": {"line": 7},
                                                                "target": {"type": "identifier", "name": "i"},
                                                                "value": {
                                                                    "type": "binary",
                                                                    "left": {"type": "identifier", "name": "i"},
                                                                    "operator": "+",
                                                                    "right": {"type": "number", "value": "1"}
                                                                }
                                                            },
                                                            # Línea 8: temp <- A[i]
                                                            {
                                                                "type": "Assign",
                                                                "pos": {"line": 8},
                                                                "target": {"type": "identifier", "name": "temp"},
                                                                "value": {
                                                                    "type": "index",
                                                                    "target": {"type": "identifier", "name": "A"},
                                                                    "index": {"type": "identifier", "name": "i"}
                                                                }
                                                            },
                                                            # Línea 9: A[i] <- A[j]
                                                            {
                                                                "type": "Assign",
                                                                "pos": {"line": 9},
                                                                "target": {
                                                                    "type": "index",
                                                                    "target": {"type": "identifier", "name": "A"},
                                                                    "index": {"type": "identifier", "name": "i"}
                                                                },
                                                                "value": {
                                                                    "type": "index",
                                                                    "target": {"type": "identifier", "name": "A"},
                                                                    "index": {"type": "identifier", "name": "j"}
                                                                }
                                                            },
                                                            # Línea 10: A[j] <- temp
                                                            {
                                                                "type": "Assign",
                                                                "pos": {"line": 10},
                                                                "target": {
                                                                    "type": "index",
                                                                    "target": {"type": "identifier", "name": "A"},
                                                                    "index": {"type": "identifier", "name": "j"}
                                                                },
                                                                "value": {"type": "identifier", "name": "temp"}
                                                            }
                                                        ]
                                                    },
                                                    "alternate": None  # No hay else
                                                }
                                            ]
                                        }
                                    },
                                    # Línea 11: temp <- A[i + 1]
                                    {
                                        "type": "Assign",
                                        "pos": {"line": 11},
                                        "target": {"type": "identifier", "name": "temp"},
                                        "value": {
                                            "type": "index",
                                            "target": {"type": "identifier", "name": "A"},
                                            "index": {
                                                "type": "binary",
                                                "left": {"type": "identifier", "name": "i"},
                                                "operator": "+",
                                                "right": {"type": "number", "value": "1"}
                                            }
                                        }
                                    },
                                    # Línea 12: A[i + 1] <- A[der]
                                    {
                                        "type": "Assign",
                                        "pos": {"line": 12},
                                        "target": {
                                            "type": "index",
                                            "target": {"type": "identifier", "name": "A"},
                                            "index": {
                                                "type": "binary",
                                                "left": {"type": "identifier", "name": "i"},
                                                "operator": "+",
                                                "right": {"type": "number", "value": "1"}
                                            }
                                        },
                                        "value": {
                                            "type": "index",
                                            "target": {"type": "identifier", "name": "A"},
                                            "index": {"type": "identifier", "name": "der"}
                                        }
                                    },
                                    # Línea 13: A[der] <- temp
                                    {
                                        "type": "Assign",
                                        "pos": {"line": 13},
                                        "target": {
                                            "type": "index",
                                            "target": {"type": "identifier", "name": "A"},
                                            "index": {"type": "identifier", "name": "der"}
                                        },
                                        "value": {"type": "identifier", "name": "temp"}
                                    },
                                    # Línea 14: pivot_index <- i + 1
                                    {
                                        "type": "Assign",
                                        "pos": {"line": 14},
                                        "target": {"type": "identifier", "name": "pivot_index"},
                                        "value": {
                                            "type": "binary",
                                            "left": {"type": "identifier", "name": "i"},
                                            "operator": "+",
                                            "right": {"type": "number", "value": "1"}
                                        }
                                    },
                                    # Línea 15: CALL quicksort(A, izq, pivot_index - 1)
                                    {
                                        "type": "Call",
                                        "pos": {"line": 15},
                                        "name": "quicksort",
                                        "args": [
                                            {"type": "identifier", "name": "A"},
                                            {"type": "identifier", "name": "izq"},
                                            {
                                                "type": "binary",
                                                "left": {"type": "identifier", "name": "pivot_index"},
                                                "operator": "-",
                                                "right": {"type": "number", "value": "1"}
                                            }
                                        ]
                                    },
                                    # Línea 16: CALL quicksort(A, pivot_index + 1, der)
                                    {
                                        "type": "Call",
                                        "pos": {"line": 16},
                                        "name": "quicksort",
                                        "args": [
                                            {"type": "identifier", "name": "A"},
                                            {
                                                "type": "binary",
                                                "left": {"type": "identifier", "name": "pivot_index"},
                                                "operator": "+",
                                                "right": {"type": "number", "value": "1"}
                                            },
                                            {"type": "identifier", "name": "der"}
                                        ]
                                    }
                                ]
                            },
                            "alternate": None  # No hay else
                        }
                    ]
                }
            }
        ]
    }


def create_quicksort_analysis() -> Dict[str, Any]:
    """
    Crea un análisis completo del algoritmo quicksort.
    
    Returns:
        Resultado del análisis con byLine, T_open, procedure, etc.
    """
    # Crear AST de quicksort
    ast = create_quicksort_ast()
    
    # Crear analizador
    analyzer = IterativeAnalyzer()
    
    # Agregar símbolos
    analyzer.add_symbol("n", "tamaño del arreglo")
    analyzer.add_symbol("izq", "índice izquierdo")
    analyzer.add_symbol("der", "índice derecho")
    analyzer.add_symbol("pivot", "valor pivote")
    analyzer.add_symbol("i", "índice de partición")
    analyzer.add_symbol("j", "índice de iteración")
    
    # Analizar
    result = analyzer.analyze(ast, "worst")
    
    return result


if __name__ == "__main__":
    # Prueba del análisis de quicksort
    result = create_quicksort_analysis()
    
    print("=== ANÁLISIS DE QUICKSORT ===")
    print(f"OK: {result['ok']}")
    print(f"Número de filas: {len(result['byLine'])}")
    print(f"T_open: {result['totals']['T_open']}")
    print(f"Procedimiento: {len(result['totals']['procedure'])} pasos")
    
    print("\n=== FILAS POR LÍNEA ===")
    for row in result['byLine']:
        print(f"Línea {row['line']}: {row['kind']} - {row['ck']} - {row['count']} - {row.get('note', '')}")
    
    print("\n=== PROCEDIMIENTO ===")
    for i, step in enumerate(result['totals']['procedure'], 1):
        print(f"{i}. {step}")
    
    if result['totals'].get('symbols'):
        print("\n=== SÍMBOLOS ===")
        for symbol, desc in result['totals']['symbols'].items():
            print(f"{symbol}: {desc}")
    
    if result['totals'].get('notes'):
        print("\n=== NOTAS ===")
        for note in result['totals']['notes']:
            print(f"- {note}")
