# apps/api/app/analysis/nested_for_example.py

from .for_analyzer import ForAnalyzer


def create_nested_for_analysis():
    """
    Crea un análisis con bucles FOR anidados para demostrar sumatorias anidadas.
    
    Returns:
        Resultado del análisis con bucles anidados
    """
    analyzer = ForAnalyzer()
    analyzer.clear()
    
    # Agregar símbolos
    analyzer.add_symbol("n", "tamaño del arreglo")
    analyzer.add_symbol("m", "tamaño de la matriz")
    
    # Simular bucles anidados: for i <- 1 TO n, for j <- 1 TO m
    outer_for = {
        "type": "for",
        "pos": {"line": 1},
        "var": "i",
        "start": "1",
        "end": "n",
        "body": [
            {
                "type": "for",
                "pos": {"line": 2},
                "var": "j",
                "start": "1",
                "end": "m",
                "body": [
                    {
                        "type": "assign",
                        "pos": {"line": 3},
                        "left": "A",
                        "right": "i * j"
                    }
                ]
            }
        ]
    }
    
    # Analizar el bucle exterior (que contiene el bucle interior)
    analyzer.visit_for(outer_for, "worst")
    
    return analyzer.result()


if __name__ == "__main__":
    # Prueba con bucles anidados
    result = create_nested_for_analysis()
    print("Análisis de bucles FOR anidados:")
    print(f"T_open: {result['totals']['T_open']}")
    print(f"Número de filas: {len(result['byLine'])}")
    print("\nFilas generadas:")
    for row in result['byLine']:
        print(f"  Línea {row['line']}: {row['kind']} - {row['ck']} - {row['count']}")
    
    print("\nProcedimiento:")
    for i, step in enumerate(result['totals']['procedure'], 1):
        print(f"  {i}. {step}")
